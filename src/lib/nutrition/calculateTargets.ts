import { ActivityLevel, DailyTargets, NutritionTargets, UserProfileInput } from "@/lib/types";

const ACTIVITY_FACTOR: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very: 1.725,
  extra: 1.9,
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const getMacroRatio = (preference: UserProfileInput["macroPreference"]) => {
  if (preference === "low_carb") return { carbs: 0.3, protein: 0.35, fat: 0.35 };
  if (preference === "high_protein") return { carbs: 0.35, protein: 0.4, fat: 0.25 };
  return { carbs: 0.45, protein: 0.3, fat: 0.25 };
};

const getCalorieAdjustment = (profile: UserProfileInput) => {
  if (profile.primaryGoal === "bulking") return 300;
  if (profile.primaryGoal === "cutting") return -400;
  if (profile.primaryGoal === "overfat") return -550;
  if (profile.primaryGoal === "obese") return -700;
  if (profile.primaryGoal === "severe_obese") return -850;
  return 0; // maintenance
};

export const calculateNutritionTargets = (profile: UserProfileInput): NutritionTargets => {
  const s = profile.gender === "male" ? 5 : -161;
  const baseBmr = 10 * profile.weightKg + 6.25 * profile.heightCm - 5 * profile.age + s;

  const palBase = ACTIVITY_FACTOR[profile.occupationalActivityLevel ?? "sedentary"];
  const neatBonus = ACTIVITY_FACTOR[profile.neatLevel ?? "sedentary"] - 1.2;
  const activityMultiplier = clamp(palBase + neatBonus * 0.25, 1.2, 1.9);

  const tdee = Math.round(baseBmr * activityMultiplier);
  const targetCalories = Math.max(1000, Math.round(tdee + getCalorieAdjustment(profile)));

  const ratio = getMacroRatio(profile.macroPreference);
  const carbsG = Math.round((targetCalories * ratio.carbs) / 4);
  const proteinG = Math.round((targetCalories * ratio.protein) / 4);
  const fatG = Math.round((targetCalories * ratio.fat) / 9);

  return {
    bmr: Math.round(baseBmr),
    tdee,
    targetCalories,
    calories: targetCalories,
    carbs: carbsG,
    protein: proteinG,
    fat: fatG,
    sugar: 30,
    sodium: 2000,
  };
};

export const toDailyTargets = (computed: NutritionTargets): DailyTargets => ({
  calories: computed.calories,
  carbs: computed.carbs,
  protein: computed.protein,
  fat: computed.fat,
  sugar: computed.sugar,
  sodium: computed.sodium,
});
