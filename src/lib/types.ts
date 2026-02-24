export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export interface DailyTargets {
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  sugar: number;
  sodium: number;
}

export interface MealRecord {
  id: string;
  date: string;
  meal_type: MealType;
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

