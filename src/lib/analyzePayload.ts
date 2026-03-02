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
  amount: number;
  amount_basis: "label_total_content" | "food_serving_estimate";
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  sugar: number;
  sodium: number;
};

export const FALLBACK_ANALYZED_FOOD_NAME = "추정 식품";

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

const toSafePositiveAmount = (value: unknown): number | null => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  if (parsed <= 0) return null;
  if (parsed > 10000) return 10000;
  return Math.round(parsed);
};

const toKoreanFoodName = (value: string): string => {
  const normalized = value.trim();
  if (!normalized) return FALLBACK_ANALYZED_FOOD_NAME;
  if (/[가-힣]/.test(normalized)) return normalized;

  const key = normalized.toLowerCase().replace(/[^a-z0-9 ]/g, " ");
  const map: Array<[string, string]> = [
    ["chicken breast", "닭가슴살"],
    ["chicken", "치킨"],
    ["banana", "바나나"],
    ["apple", "사과"],
    ["egg", "계란"],
    ["yogurt", "요거트"],
    ["milk", "우유"],
    ["protein shake", "프로틴쉐이크"],
    ["salad", "샐러드"],
    ["rice", "밥"],
    ["ramen", "라면"],
    ["pizza", "피자"],
    ["burger", "햄버거"],
    ["sandwich", "샌드위치"],
    ["pasta", "파스타"],
  ];
  for (const [token, korean] of map) {
    if (key.includes(token)) return korean;
  }
  return FALLBACK_ANALYZED_FOOD_NAME;
};

export const normalizeAnalyzePayload = (value: unknown): AnalyzePayload => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Invalid model JSON payload");
  }

  const payload = value as Record<string, unknown>;
  const rawName = payload.food_name ?? payload.menu_name;
  const normalizedName = typeof rawName === "string" ? rawName.trim() : "";
  const safeName = toKoreanFoodName(normalizedName || FALLBACK_ANALYZED_FOOD_NAME);

  const rawAmount =
    payload.amount ??
    payload.total_amount ??
    payload.total_content_amount ??
    payload.total_content_g ??
    payload.total_content_ml ??
    payload.serving_amount ??
    payload.estimated_serving_amount;
  const safeAmount = toSafePositiveAmount(rawAmount) ?? 100;

  const rawBasis = typeof payload.amount_basis === "string" ? payload.amount_basis.trim() : "";
  const amountBasis =
    rawBasis === "label_total_content" || rawBasis === "food_serving_estimate"
      ? rawBasis
      : "food_serving_estimate";

  return {
    menu_name: safeName,
    food_name: safeName,
    amount: safeAmount,
    amount_basis: amountBasis,
    calories: toSafeNumber(payload.calories, NUTRIENT_MAX.calories),
    carbs: toSafeNumber(payload.carbs, NUTRIENT_MAX.carbs),
    protein: toSafeNumber(payload.protein, NUTRIENT_MAX.protein),
    fat: toSafeNumber(payload.fat, NUTRIENT_MAX.fat),
    sugar: toSafeNumber(payload.sugar, NUTRIENT_MAX.sugar),
    sodium: toSafeNumber(payload.sodium, NUTRIENT_MAX.sodium),
  };
};
