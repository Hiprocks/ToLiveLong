import { MealType } from "@/lib/types";
import { normalizeUtf8Text, utf8ByteLength } from "@/lib/text";

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const FOOD_NAME_MAX = 120;
const FOOD_NAME_MAX_BYTES = 240;

export class ValidationError extends Error {
  status = 400;
}

export const assertIsoDate = (value: unknown, fieldName = "date"): string => {
  const date = typeof value === "string" ? value.trim() : "";
  if (!ISO_DATE_RE.test(date)) {
    throw new ValidationError(`${fieldName} must be YYYY-MM-DD`);
  }
  return date;
};

export const assertMealType = (value: unknown): MealType => {
  if (value === "breakfast" || value === "lunch" || value === "dinner" || value === "snack") {
    return value;
  }
  throw new ValidationError("Invalid meal_type");
};

export const assertFoodName = (value: unknown): string => {
  const foodName = typeof value === "string" ? normalizeUtf8Text(value).trim() : "";
  if (!foodName) throw new ValidationError("food_name is required");
  if (foodName.length > FOOD_NAME_MAX) {
    throw new ValidationError(`food_name must be <= ${FOOD_NAME_MAX} characters`);
  }
  if (utf8ByteLength(foodName) > FOOD_NAME_MAX_BYTES) {
    throw new ValidationError(`food_name must be <= ${FOOD_NAME_MAX_BYTES} UTF-8 bytes`);
  }
  return foodName;
};

export const parseNonNegativeNumber = (
  value: unknown,
  fieldName: string,
  options?: { min?: number; max?: number }
): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new ValidationError(`${fieldName} must be a number`);
  }
  const min = options?.min ?? 0;
  const max = options?.max ?? Number.MAX_SAFE_INTEGER;
  if (parsed < min) throw new ValidationError(`${fieldName} must be >= ${min}`);
  if (parsed > max) throw new ValidationError(`${fieldName} must be <= ${max}`);
  return parsed;
};
