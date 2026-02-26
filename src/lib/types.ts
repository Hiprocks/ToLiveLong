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
  | "overfat"
  | "obese"
  | "severe_obese";
export type MacroPreference = "balanced" | "low_carb" | "high_protein";
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
