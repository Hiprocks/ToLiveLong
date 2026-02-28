import { ActivityLevel, DailyTargets, NutritionTargets, UserProfileInput } from "@/lib/types";

const ACTIVITY_FACTOR: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very: 1.725,
  extra: 1.9,
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const getMacroRatio = (profile: UserProfileInput) => {
  const preference = profile.macroPreference;
  const ratio =
    preference === "low_carb"
      ? { carbs: 0.3, protein: 0.35, fat: 0.35 }
      : preference === "high_protein"
        ? { carbs: 0.4, protein: 0.4, fat: 0.2 }
        : preference === "keto"
          ? { carbs: 0.1, protein: 0.2, fat: 0.7 }
          : { carbs: 0.5, protein: 0.2, fat: 0.3 };

  if (profile.primaryGoal !== "recomposition") {
    return ratio;
  }

  const minProtein = 0.35;
  if (ratio.protein >= minProtein) return ratio;

  let carbs = ratio.carbs;
  let fat = ratio.fat;
  let protein = minProtein;
  let overflow = carbs + fat + protein - 1;

  const carbFloor = 0.1;
  const fatFloor = 0.15;

  if (overflow > 0) {
    const carbReduction = Math.min(overflow, Math.max(0, carbs - carbFloor));
    carbs -= carbReduction;
    overflow -= carbReduction;
  }

  if (overflow > 0) {
    const fatReduction = Math.min(overflow, Math.max(0, fat - fatFloor));
    fat -= fatReduction;
    overflow -= fatReduction;
  }

  if (overflow > 0) {
    protein = Math.max(0.2, protein - overflow);
  }

  return { carbs, protein, fat };
};

const getCalorieMultiplier = (profile: UserProfileInput) => {
  if (profile.primaryGoal === "bulking") return 1.1;
  if (profile.primaryGoal === "cutting") return 0.8;
  if (profile.primaryGoal === "recomposition") return 1.0;
  return 1.0; // maintenance
};

const getBmr = (profile: UserProfileInput) => {
  if (profile.bodyFatPct !== undefined) {
    const leanMassKg = profile.weightKg * (1 - profile.bodyFatPct / 100);
    return 370 + 21.6 * leanMassKg;
  }
  const s = profile.gender === "male" ? 5 : -161;
  return 10 * profile.weightKg + 6.25 * profile.heightCm - 5 * profile.age + s;
};

export const calculateNutritionTargets = (profile: UserProfileInput): NutritionTargets => {
  const baseBmr = getBmr(profile);

  const palBase = ACTIVITY_FACTOR[profile.occupationalActivityLevel ?? "sedentary"];
  const neatBonus = ACTIVITY_FACTOR[profile.neatLevel ?? "sedentary"] - 1.2;
  const activityMultiplier = clamp(palBase + neatBonus * 0.25, 1.2, 1.9);

  const tdee = Math.round(baseBmr * activityMultiplier);
  const targetCalories = Math.max(1000, Math.round(tdee * getCalorieMultiplier(profile)));

  const ratio = getMacroRatio(profile);
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
