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

const getModelCandidates = (): string[] => {
  const fromEnv = (process.env.GEMINI_MODEL ?? "")
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
  return Array.from(new Set([...fromEnv, ...DEFAULT_MODEL_CANDIDATES]));
};

export const getAiModelCandidates = getModelCandidates;

const normalizeAiTargets = (value: unknown): Pick<NutritionTargets, "aiFeedback" | "aiNotes" | "aiSource"> | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const payload = value as Record<string, unknown>;

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
  if (!analysis || !exercisePlan || !dietPlan) return null;

  return {
    aiFeedback: { analysis, exercisePlan, dietPlan },
    aiNotes: notes || undefined,
    aiSource: "ai",
  };
};

export const normalizeAiTargetsPayload = normalizeAiTargets;

const buildPrompt = (profile: UserProfileInput, baseline: NutritionTargets) => {
  return `
You are a nutrition coaching assistant.
Write feedback in Korean.
Do NOT calculate or modify nutrition numbers.
The system already finalized numeric targets internally.
Do NOT repeat BMR/TDEE/targetCalories/carbs/protein/fat numbers in feedback text.
Treat exerciseFrequencyWeekly, exerciseDurationMin, exerciseIntensity, waistCm, waistHipRatio, and bodyFatPct as context only.
Return concise feedback text around 200 chars total.
Feedback must include:
1) Body/goal analysis
2) One or two action-focused exercise suggestions
3) One or two action-focused diet suggestions

Return ONLY raw JSON with the following keys:
{
  "analysis": string,
  "exercisePlan": string,
  "dietPlan": string,
  "notes": string
}

User profile:
${JSON.stringify(profile)}

Baseline calculation (reference only; never alter numeric targets):
${JSON.stringify(baseline)}
  `.trim();
};

const getBodyTypeHint = (profile: UserProfileInput): string => {
  if (profile.bodyFatPct !== undefined) {
    if (profile.bodyFatPct >= 28) return "체지방이 높은 편";
    if (profile.bodyFatPct <= 14) return "체지방이 낮은 편";
    return "체지방이 중간 범위";
  }

  if (profile.waistCm !== undefined) {
    if (profile.gender === "male" && profile.waistCm >= 90) return "복부 관리가 필요한 편";
    if (profile.gender === "female" && profile.waistCm >= 85) return "복부 관리가 필요한 편";
    return "복부 둘레는 안정적인 편";
  }

  if (profile.waistHipRatio !== undefined) {
    if (profile.waistHipRatio >= 0.9) return "복부 지방 관리가 필요한 체형";
    return "복부 비만 위험은 낮은 체형";
  }

  return "체형 정보는 기본 입력 기준";
};

const buildFallbackNotes = (profile: UserProfileInput) => {
  const goalLabel: Record<UserProfileInput["primaryGoal"], string> = {
    cutting: "살 빼기",
    maintenance: "유지",
    bulking: "근육 키우기",
    recomposition: "살 빼고 근육 키우기",
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
  const note = `${bodyType}, ${goalLabel[profile.primaryGoal]} 목표입니다. 주 ${sessions}회 ${intensity} 운동을 유지하고 단백질 섭취와 허리둘레 변화를 함께 확인하세요.`;
  if (note.length <= 200) return note;
  return `주 ${sessions}회 ${intensity} 운동과 단백질 중심 식사, 허리둘레 추적을 권장합니다.`;
};

const buildFallbackFeedback = (profile: UserProfileInput): NonNullable<NutritionTargets["aiFeedback"]> => {
  const intensityLabel: Record<NonNullable<UserProfileInput["exerciseIntensity"]>, string> = {
    low: "저강도",
    medium: "중강도",
    high: "고강도",
  };
  const goalLabel: Record<UserProfileInput["primaryGoal"], string> = {
    cutting: "살 빼기",
    maintenance: "유지",
    bulking: "근육 키우기",
    recomposition: "살 빼고 근육 키우기",
  };

  const bodyType = getBodyTypeHint(profile);
  const sessions = profile.exerciseFrequencyWeekly ?? 3;
  const duration = profile.exerciseDurationMin ?? 45;
  const intensity = intensityLabel[profile.exerciseIntensity ?? "medium"];

  return {
    analysis: `${bodyType}, ${goalLabel[profile.primaryGoal]} 목표 기준`,
    exercisePlan: `주 ${sessions}회 ${intensity} ${duration}분 운동을 꾸준히 이어가세요.`,
    dietPlan: "단백질을 우선 챙기고 허리둘레 변화를 함께 추적하세요.",
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
          lastError = `${modelName}: AI response missing required feedback fields`;
          continue;
        }

        return {
          ...baseline,
          aiFeedback: normalized.aiFeedback,
          aiNotes: normalized.aiNotes ?? buildFallbackNotes(profile),
          aiSource: "ai",
        };
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
