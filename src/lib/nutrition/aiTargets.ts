import { GoogleGenerativeAI } from "@google/generative-ai";
import { parseModelJson } from "@/lib/analyzePayload";
import { NutritionTargets, UserProfileInput } from "@/lib/types";
import { calculateNutritionTargets } from "@/lib/nutrition/calculateTargets";

const DEFAULT_MODEL_CANDIDATES = ["gemini-1.5-pro", "gemini-1.5-flash"] as const;

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

  let notes = typeof payload.notes === "string" ? payload.notes.trim() : "";
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
    aiNotes: notes || undefined,
    aiSource: "ai",
  };
};

const buildPrompt = (profile: UserProfileInput, baseline: NutritionTargets) => {
  return `
You are a nutrition planning assistant. Use the user's profile to propose daily nutrition targets.
Focus on realistic protein for general formula users; avoid excessive protein.
Write the notes in Korean. Notes must be non-empty and 1-2 sentences.
Notes must be a bullet-style summary (short phrases) within 200 characters (including spaces).
Notes must include:
- BMR/TDEE result and realistic daily calorie target
- Macro goals in grams (carbs/protein/fat) based on body weight
- One key actionable advice

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
  "notes": string
}

User profile:
${JSON.stringify(profile)}

Baseline calculation (for reference only; you may adjust):
${JSON.stringify(baseline)}
  `.trim();
};

const buildFallbackNotes = (profile: UserProfileInput, baseline: NutritionTargets) => {
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

  const note = `- BMR ${baseline.bmr}, TDEE ${baseline.tdee}\n- 목표 ${baseline.targetCalories}kcal, 탄${baseline.carbs}/단${baseline.protein}/지${baseline.fat}g\n- ${goalLabel[profile.primaryGoal]}(${macroLabel[profile.macroPreference]}) 기준으로 1주 기록`;
  if (note.length <= 200) return note;
  return `BMR ${baseline.bmr}, TDEE ${baseline.tdee}, 목표 ${baseline.targetCalories}kcal, 탄${baseline.carbs}/단${baseline.protein}/지${baseline.fat}g. 1주 기록으로 조정`;
};

export const calculateNutritionTargetsWithAi = async (
  profile: UserProfileInput
): Promise<NutritionTargets> => {
  const baseline = calculateNutritionTargets(profile);
  if (!process.env.GEMINI_API_KEY) {
    return {
      ...baseline,
      aiNotes: buildFallbackNotes(profile, baseline),
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
          return {
            ...baseline,
            aiNotes: buildFallbackNotes(profile, baseline),
            aiSource: "fallback",
            aiDebug: "AI response missing required numeric fields",
          };
        }

        if (!normalized.aiNotes) {
          normalized.aiNotes = buildFallbackNotes(profile, baseline);
          normalized.aiSource = "fallback";
          normalized.aiDebug = "AI response missing notes; using fallback notes";
        }

        return normalized;
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
      }
    }

    return {
      ...baseline,
      aiNotes: buildFallbackNotes(profile, baseline),
      aiSource: "fallback",
      aiDebug: `AI error across models (${modelCandidates.join(", ")}): ${lastError}`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return {
      ...baseline,
      aiNotes: buildFallbackNotes(profile, baseline),
      aiSource: "fallback",
      aiDebug: `AI error: ${message}`,
    };
  }
};
