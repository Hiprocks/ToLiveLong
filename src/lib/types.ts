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
  waistCm?: number;
  primaryGoal: PrimaryGoal;
}

export interface NutritionTargets extends DailyTargets {
  bmr: number;
  tdee: number;
  targetCalories: number;
  aiFeedback?: {
    analysis: string;
    exercisePlan: string;
    dietPlan: string;
  };
  aiNotes?: string;
  aiSource?: "ai" | "fallback";
  aiDebug?: string;
  aiUpdatedAt?: string;
}

export interface UserTargetsResponse extends DailyTargets {
  profileRegistered?: boolean;
  profile?: UserProfileInput | null;
  computed?: NutritionTargets | null;
  dietReview?: {
    text: string;
    generatedAt: string;
    from: string;
    to: string;
  } | null;
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
  // How nutrient values (per baseAmount) were sourced.
  nutritionSourceQuality?: "official_db" | "estimated_db";
  // Nutrient reference amount (mostly 100g in current index data).
  baseAmount: number;
  // Default input amount for UX (e.g., estimated 1 serving grams).
  defaultAmount?: number;
  // How defaultAmount was determined.
  defaultAmountSource?: "official_serving" | "estimated_serving" | "reference_100g";
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  sugar: number;
  sodium: number;
}
