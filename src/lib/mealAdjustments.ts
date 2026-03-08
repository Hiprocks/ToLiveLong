import { IntakeAdjustments, IntakeMeta, SoupPreference } from "@/lib/types";

export type MealNutritionFields = {
  amount: number;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  sugar: number;
  sodium: number;
};

const SOUPY_KEYWORDS = [
  "국",
  "탕",
  "찌개",
  "전골",
  "라면",
  "우동",
  "칼국수",
  "짬뽕",
  "쌀국수",
  "마라탕",
  "수프",
  "스프",
  "죽",
  "곰탕",
  "설렁탕",
  "해장국",
  "냉면",
  "국밥",
  "떡국",
  "만둣국",
];

const clampRatio = (value: number | null | undefined) => {
  if (value === null || value === undefined || !Number.isFinite(value)) return 1;
  if (value <= 0) return 0.25;
  if (value > 1) return 1;
  return value;
};

const roundValue = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.round(value);
};

const SOUP_FACTORS: Omit<MealNutritionFields, "amount"> = {
  calories: 0.7,
  carbs: 0.7,
  protein: 0.7,
  fat: 0.7,
  sugar: 0.8,
  sodium: 0.5,
};

export const DEFAULT_INTAKE_META: IntakeMeta = {
  version: 1,
  adjustments: {
    soupPreference: "normal",
    consumptionRatio: 1,
  },
};

export const RATIO_OPTIONS = [0.25, 0.5, 0.75, 1] as const;

export const isSoupyMeal = (foodName: string, aiSummary = "") => {
  const haystack = `${foodName} ${aiSummary}`.trim();
  return SOUPY_KEYWORDS.some((keyword) => haystack.includes(keyword));
};

export const normalizeIntakeMeta = (value: unknown): IntakeMeta | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const payload = value as { version?: unknown; adjustments?: IntakeAdjustments | null };
  const rawAdjustments =
    payload.adjustments && typeof payload.adjustments === "object" ? payload.adjustments : {};
  const rawSoupPreference = rawAdjustments?.soupPreference;
  const soupPreference: SoupPreference =
    rawSoupPreference === "solids_only" ? "solids_only" : "normal";
  const ratio = clampRatio(rawAdjustments?.consumptionRatio);

  return {
    version: payload.version === 1 ? 1 : 1,
    adjustments: {
      soupPreference,
      consumptionRatio: ratio,
    },
  };
};

export const serializeIntakeMeta = (value: IntakeMeta | null | undefined) => {
  const normalized = normalizeIntakeMeta(value);
  if (!normalized) return "";

  const soupPreference = normalized.adjustments?.soupPreference ?? "normal";
  const consumptionRatio = clampRatio(normalized.adjustments?.consumptionRatio);

  const payload: IntakeMeta = {
    version: 1,
    adjustments: {},
  };

  if (soupPreference !== "normal") {
    payload.adjustments = {
      ...payload.adjustments,
      soupPreference,
    };
  }
  if (consumptionRatio !== 1) {
    payload.adjustments = {
      ...payload.adjustments,
      consumptionRatio,
    };
  }

  if (!Object.keys(payload.adjustments ?? {}).length) return "";
  return JSON.stringify(payload);
};

export const parseIntakeMeta = (value: string | undefined) => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    return normalizeIntakeMeta(JSON.parse(trimmed));
  } catch {
    return null;
  }
};

export const applyIntakeAdjustments = (
  base: MealNutritionFields,
  meta: IntakeMeta | null | undefined,
  isSoupy: boolean
): MealNutritionFields => {
  const normalized = normalizeIntakeMeta(meta) ?? DEFAULT_INTAKE_META;
  const soupPreference = normalized.adjustments?.soupPreference ?? "normal";
  const ratio = clampRatio(normalized.adjustments?.consumptionRatio);

  const soupFactor = isSoupy && soupPreference === "solids_only" ? SOUP_FACTORS : null;

  return {
    amount: roundValue(base.amount * ratio),
    calories: roundValue(base.calories * (soupFactor?.calories ?? 1) * ratio),
    carbs: roundValue(base.carbs * (soupFactor?.carbs ?? 1) * ratio),
    protein: roundValue(base.protein * (soupFactor?.protein ?? 1) * ratio),
    fat: roundValue(base.fat * (soupFactor?.fat ?? 1) * ratio),
    sugar: roundValue(base.sugar * (soupFactor?.sugar ?? 1) * ratio),
    sodium: roundValue(base.sodium * (soupFactor?.sodium ?? 1) * ratio),
  };
};

export const invertAdjustedValue = (
  key: keyof MealNutritionFields,
  adjustedValue: number,
  meta: IntakeMeta | null | undefined,
  isSoupy: boolean
) => {
  const normalized = normalizeIntakeMeta(meta) ?? DEFAULT_INTAKE_META;
  const soupPreference = normalized.adjustments?.soupPreference ?? "normal";
  const ratio = clampRatio(normalized.adjustments?.consumptionRatio);
  const soupFactor =
    key !== "amount" && isSoupy && soupPreference === "solids_only"
      ? SOUP_FACTORS[key as keyof typeof SOUP_FACTORS] ?? 1
      : 1;
  const divisor = key === "amount" ? ratio : ratio * soupFactor;
  if (!divisor) return 0;
  return roundValue(adjustedValue / divisor);
};
