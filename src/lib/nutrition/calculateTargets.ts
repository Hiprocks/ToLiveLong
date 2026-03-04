import { ActivityLevel, DailyTargets, NutritionTargets, UserProfileInput } from "@/lib/types";

const ACTIVITY_FACTOR: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very: 1.725,
  extra: 1.9,
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const getCalorieMultiplier = (profile: UserProfileInput) => {
  if (profile.primaryGoal === "bulking") return 1.07;
  if (profile.primaryGoal === "cutting") return 0.83;
  if (profile.primaryGoal === "recomposition") return 0.97;
  return 1.0; // maintenance
};

const getBmr = (profile: UserProfileInput) => {
  const s = profile.gender === "male" ? 5 : -161;
  return 10 * profile.weightKg + 6.25 * profile.heightCm - 5 * profile.age + s;
};

const getExerciseBonus = (profile: UserProfileInput): number => {
  const weeklyMinutes = (profile.exerciseFrequencyWeekly ?? 0) * (profile.exerciseDurationMin ?? 0);
  if (weeklyMinutes >= 360) return 0.15;
  if (weeklyMinutes >= 180) return 0.1;
  if (weeklyMinutes >= 60) return 0.05;
  return 0;
};

const getProteinGrams = (profile: UserProfileInput): number => {
  const weightBased =
    profile.primaryGoal === "bulking"
      ? profile.weightKg * 1.8
      : profile.primaryGoal === "maintenance"
        ? profile.weightKg * 1.6
        : profile.weightKg * 2.0; // cutting/recomposition

  if (profile.bodyFatPct === undefined) {
    return Math.round(Math.min(weightBased, profile.weightKg * 2.2));
  }

  const leanMassKg = profile.weightKg * (1 - profile.bodyFatPct / 100);
  const lbmBased =
    profile.primaryGoal === "bulking"
      ? leanMassKg * 2.0
      : profile.primaryGoal === "maintenance"
        ? leanMassKg * 1.8
        : leanMassKg * 2.2; // cutting/recomposition

  return Math.round(Math.min(lbmBased, profile.weightKg * 2.2));
};

const getFatGrams = (profile: UserProfileInput): number => {
  if (profile.primaryGoal === "maintenance") return Math.round(profile.weightKg * 0.85);
  if (profile.primaryGoal === "bulking") return Math.round(profile.weightKg * 0.95);
  return Math.round(profile.weightKg * 0.8); // cutting/recomposition
};

export const calculateNutritionTargets = (profile: UserProfileInput): NutritionTargets => {
  const baseBmr = getBmr(profile);

  const palBase = ACTIVITY_FACTOR[profile.occupationalActivityLevel ?? "sedentary"];
  const activityMultiplier = clamp(palBase + getExerciseBonus(profile), 1.2, 1.9);

  const tdee = Math.round(baseBmr * activityMultiplier);
  const targetCalories = Math.max(1000, Math.round(tdee * getCalorieMultiplier(profile)));

  const proteinG = getProteinGrams(profile);
  const fatG = getFatGrams(profile);
  const remainingCalories = targetCalories - (proteinG * 4 + fatG * 9);
  const carbsG = Math.max(0, Math.round(remainingCalories / 4));

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
