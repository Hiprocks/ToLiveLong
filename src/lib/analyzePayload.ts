const NUTRIENT_MAX = {
  calories: 20000,
  carbs: 5000,
  protein: 5000,
  fat: 5000,
  sugar: 5000,
  sodium: 100000,
} as const;

export type AnalyzePayload = {
  menu_name: string;
  food_name: string;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  sugar: number;
  sodium: number;
};

export const parseModelJson = (rawText: string) => {
  const cleaned = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // Fallback for responses that include prose around the JSON payload.
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      const candidate = cleaned.slice(start, end + 1);
      return JSON.parse(candidate);
    }
    throw new Error("Model response does not contain valid JSON");
  }
};

const toSafeNumber = (value: unknown, max: number): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  if (parsed < 0) return 0;
  if (parsed > max) return max;
  return Math.round(parsed);
};

export const normalizeAnalyzePayload = (value: unknown): AnalyzePayload => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Invalid model JSON payload");
  }

  const payload = value as Record<string, unknown>;
  const rawName = payload.food_name ?? payload.menu_name;
  const normalizedName = typeof rawName === "string" ? rawName.trim() : "";

  return {
    menu_name: normalizedName,
    food_name: normalizedName,
    calories: toSafeNumber(payload.calories, NUTRIENT_MAX.calories),
    carbs: toSafeNumber(payload.carbs, NUTRIENT_MAX.carbs),
    protein: toSafeNumber(payload.protein, NUTRIENT_MAX.protein),
    fat: toSafeNumber(payload.fat, NUTRIENT_MAX.fat),
    sugar: toSafeNumber(payload.sugar, NUTRIENT_MAX.sugar),
    sodium: toSafeNumber(payload.sodium, NUTRIENT_MAX.sodium),
  };
};
