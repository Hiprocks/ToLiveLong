import { GoogleGenerativeAI } from "@google/generative-ai";
import { parseModelJson } from "@/lib/analyzePayload";
import { NutritionTargets, UserProfileInput } from "@/lib/types";
import { calculateNutritionTargets } from "@/lib/nutrition/calculateTargets";

const DEFAULT_MODEL_CANDIDATES = [
  "gemini-2.5-pro",
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-1.5-pro",
] as const;

const MAX = {
  bmr: 10000,
  tdee: 15000,
  calories: 20000,
  carbs: 5000,
  protein: 5000,
  fat: 5000,
  sugar: 5000,
  sodium: 100000,
} as const;

const getModelCandidates = (): string[] => {
  const fromEnv = (process.env.GEMINI_MODEL ?? "")
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
  return Array.from(new Set([...fromEnv, ...DEFAULT_MODEL_CANDIDATES]));
};

export const getAiModelCandidates = getModelCandidates;

const toSafeNumber = (value: unknown, max: number): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  if (parsed < 0) return 0;
  if (parsed > max) return max;
  return Math.round(parsed);
};

const normalizeAiTargets = (value: unknown): NutritionTargets | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const payload = value as Record<string, unknown>;

  const targetCalories = toSafeNumber(payload.targetCalories ?? payload.calories, MAX.calories);
  const bmr = toSafeNumber(payload.bmr, MAX.bmr);
  const tdee = toSafeNumber(payload.tdee, MAX.tdee);
  const carbs = toSafeNumber(payload.carbs, MAX.carbs);
  const protein = toSafeNumber(payload.protein, MAX.protein);
  const fat = toSafeNumber(payload.fat, MAX.fat);
  const sugar = toSafeNumber(payload.sugar ?? 30, MAX.sugar);
  const sodium = toSafeNumber(payload.sodium ?? 2000, MAX.sodium);

  const analysis =
    typeof payload.analysis === "string" ? payload.analysis.trim() : "";
  const exercisePlan =
    typeof payload.exercisePlan === "string" ? payload.exercisePlan.trim() : "";
  const dietPlan =
    typeof payload.dietPlan === "string" ? payload.dietPlan.trim() : "";
  const feedbackParts = [analysis, exercisePlan, dietPlan].filter(Boolean);
  let notes =
    typeof payload.notes === "string" ? payload.notes.trim() : feedbackParts.join(" ");
  if (notes.length > 200) notes = notes.slice(0, 200).trim();

  if (!targetCalories || !carbs || !protein || !fat) return null;

  return {
    bmr: bmr || 0,
    tdee: tdee || 0,
    targetCalories,
    calories: targetCalories,
    carbs,
    protein,
    fat,
    sugar,
    sodium,
    aiFeedback:
      analysis || exercisePlan || dietPlan
        ? { analysis, exercisePlan, dietPlan }
        : undefined,
    aiNotes: notes || undefined,
    aiSource: "ai",
  };
};

export const normalizeAiTargetsPayload = normalizeAiTargets;

const buildPrompt = (profile: UserProfileInput, baseline: NutritionTargets) => {
  return `
You are a nutrition planning assistant. Use the user's profile to propose daily nutrition targets.
Focus on realistic protein and practical adherence.
Write feedback in Korean.
Important: Keep numeric metrics separate in numeric fields only.
Do NOT repeat BMR/TDEE/targetCalories/carbs/protein/fat numbers in feedback text.
Return concise feedback text around 200 chars total.
Feedback must include:
1) Body/goal analysis
2) Exercise prescription (intensity/duration/frequency)
3) Diet recommendation (high protein, low fat)

Return ONLY raw JSON with the following keys:
{
  "bmr": number,
  "tdee": number,
  "targetCalories": number,
  "carbs": number,
  "protein": number,
  "fat": number,
  "sugar": number,
  "sodium": number,
  "analysis": string,
  "exercisePlan": string,
  "dietPlan": string
}

User profile:
${JSON.stringify(profile)}

Baseline calculation (for reference only; you may adjust):
${JSON.stringify(baseline)}
  `.trim();
};

const getBodyTypeHint = (profile: UserProfileInput): string => {
  if (profile.bodyFatPct !== undefined) {
    if (profile.bodyFatPct >= 28) return "체지방이 높은 편";
    if (profile.bodyFatPct <= 14) return "체지방이 낮은 편";
    return "체지방이 중간 범위";
  }

  if (profile.waistHipRatio !== undefined) {
    if (profile.waistHipRatio >= 0.9) return "복부 지방 관리가 필요한 체형";
    return "복부 비만 위험은 낮은 체형";
  }

  return "체형 정보는 기본 입력 기준";
};

const buildFallbackNotes = (profile: UserProfileInput) => {
  const goalLabel: Record<UserProfileInput["primaryGoal"], string> = {
    cutting: "감량",
    maintenance: "유지",
    bulking: "증량",
    recomposition: "리컴포지션",
  };
  const macroLabel: Record<UserProfileInput["macroPreference"], string> = {
    balanced: "균형형",
    low_carb: "저탄수",
    high_protein: "고단백",
    keto: "저탄고지",
  };
  const intensityLabel: Record<NonNullable<UserProfileInput["exerciseIntensity"]>, string> = {
    low: "저강도",
    medium: "중강도",
    high: "고강도",
  };

  const sessions = profile.exerciseFrequencyWeekly ?? 3;
  const duration = profile.exerciseDurationMin ?? 45;
  const intensity = intensityLabel[profile.exerciseIntensity ?? "medium"];
  const bodyType = getBodyTypeHint(profile);

  const note = `${bodyType}이며 ${goalLabel[profile.primaryGoal]} 목표입니다. 주 ${sessions}회 ${intensity} ${duration}분 운동을 권장합니다. 단백질 중심으로 지방은 최소화하고 ${macroLabel[profile.macroPreference]} 패턴으로 식단을 유지하세요.`;
  if (note.length <= 200) return note;
  return `주 ${sessions}회 ${intensity} ${duration}분 운동, 단백질 중심 저지방 식단을 권장합니다.`;
};

const buildFallbackFeedback = (profile: UserProfileInput): NonNullable<NutritionTargets["aiFeedback"]> => {
  const intensityLabel: Record<NonNullable<UserProfileInput["exerciseIntensity"]>, string> = {
    low: "저강도",
    medium: "중강도",
    high: "고강도",
  };
  const goalLabel: Record<UserProfileInput["primaryGoal"], string> = {
    cutting: "감량",
    maintenance: "유지",
    bulking: "증량",
    recomposition: "리컴포지션",
  };

  const bodyType = getBodyTypeHint(profile);
  const sessions = profile.exerciseFrequencyWeekly ?? 3;
  const duration = profile.exerciseDurationMin ?? 45;
  const intensity = intensityLabel[profile.exerciseIntensity ?? "medium"];

  return {
    analysis: `${bodyType}, ${goalLabel[profile.primaryGoal]} 목표 기준`,
    exercisePlan: `주 ${sessions}회 ${intensity} ${duration}분 운동 권장`,
    dietPlan: "단백질 중심, 지방 최소화 식단 권장",
  };
};

export const calculateNutritionTargetsWithAi = async (
  profile: UserProfileInput
): Promise<NutritionTargets> => {
  const baseline = calculateNutritionTargets(profile);
  if (!process.env.GEMINI_API_KEY) {
    const fallbackFeedback = buildFallbackFeedback(profile);
    return {
      ...baseline,
      aiFeedback: fallbackFeedback,
      aiNotes: buildFallbackNotes(profile),
      aiSource: "fallback",
      aiDebug: "GEMINI_API_KEY missing",
    };
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const prompt = buildPrompt(profile, baseline);
    const modelCandidates = getModelCandidates();
    let lastError = "Unknown error";

    for (const modelName of modelCandidates) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent([prompt]);
        const response = await result.response;
        const text = response.text();
        const parsed = parseModelJson(text);
        const normalized = normalizeAiTargets(parsed);

        if (!normalized) {
          lastError = `${modelName}: AI response missing required numeric fields`;
          continue;
        }

        if (!normalized.aiNotes) {
          const fallbackFeedback = buildFallbackFeedback(profile);
          normalized.aiFeedback = normalized.aiFeedback ?? fallbackFeedback;
          normalized.aiNotes = buildFallbackNotes(profile);
          normalized.aiDebug = "AI response missing notes; fallback notes injected";
        }

        return normalized;
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
      }
    }

    return {
      ...baseline,
      aiFeedback: buildFallbackFeedback(profile),
      aiNotes: buildFallbackNotes(profile),
      aiSource: "fallback",
      aiDebug: `AI error across models (${modelCandidates.join(", ")}): ${lastError}`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return {
      ...baseline,
      aiFeedback: buildFallbackFeedback(profile),
      aiNotes: buildFallbackNotes(profile),
      aiSource: "fallback",
      aiDebug: `AI error: ${message}`,
    };
  }
};
