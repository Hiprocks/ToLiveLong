export interface DailyTargets {
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  sugar: number;
  sodium: number;
}

export type Gender = "male" | "female";
export type PrimaryGoal =
  | "cutting"
  | "maintenance"
  | "bulking"
  | "recomposition";
export type MacroPreference = "balanced" | "low_carb" | "high_protein" | "keto";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "very" | "extra";
export type ExerciseIntensity = "low" | "medium" | "high";

export interface UserProfileInput {
  gender: Gender;
  age: number;
  heightCm: number;
  weightKg: number;
  occupationalActivityLevel?: ActivityLevel;
  exerciseFrequencyWeekly?: number;
  exerciseDurationMin?: number;
  exerciseIntensity?: ExerciseIntensity;
  neatLevel?: ActivityLevel;
  bodyFatPct?: number;
  skeletalMuscleKg?: number;
  waistHipRatio?: number;
  primaryGoal: PrimaryGoal;
  macroPreference: MacroPreference;
}

export interface NutritionTargets extends DailyTargets {
  bmr: number;
  tdee: number;
  targetCalories: number;
  aiNotes?: string;
  aiSource?: "ai" | "fallback";
  aiDebug?: string;
  aiUpdatedAt?: string;
}

export interface UserTargetsResponse extends DailyTargets {
  profileRegistered?: boolean;
  profile?: UserProfileInput | null;
  computed?: NutritionTargets | null;
}

export interface MealRecord {
  id: string;
  date: string;
  food_name: string;
  amount: number;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  sugar: number;
  sodium: number;
}

export interface TemplateItem {
  id: string;
  food_name: string;
  base_amount: number;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  sugar: number;
  sodium: number;
}

export interface FoodIndexItem {
  id: string;
  name: string;
  source: "mfds" | "korean_standard_food" | "korean_standard_ingredient" | "fallback";
  // Nutrient reference amount (mostly 100g in current index data).
  baseAmount: number;
  // Default input amount for UX (e.g., estimated 1 serving grams).
  defaultAmount?: number;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  sugar: number;
  sodium: number;
}
