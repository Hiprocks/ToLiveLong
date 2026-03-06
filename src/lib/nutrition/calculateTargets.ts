import { ActivityLevel, DailyTargets, NutritionTargets, UserProfileInput } from "@/lib/types";

const ACTIVITY_FACTOR: Record<ActivityLevel, number> = {
  sedentary: 1.35,
  light: 1.375,
  moderate: 1.55,
  very: 1.725,
  extra: 1.9,
};

const GOAL_MULTIPLIER: Record<UserProfileInput["primaryGoal"], number> = {
  cutting: 0.8,
  bulking: 1.05,
  recomposition: 0.925,
  maintenance: 1.0,
};

const PROTEIN_PER_KG: Record<UserProfileInput["primaryGoal"], number> = {
  cutting: 2.0,
  bulking: 1.8,
  recomposition: 1.6,
  maintenance: 1.4,
};

const FAT_RATIO: Record<UserProfileInput["primaryGoal"], number> = {
  cutting: 0.25,
  bulking: 0.25,
  recomposition: 0.3,
  maintenance: 0.3,
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const roundToNearest = (value: number, unit: number) => Math.round(value / unit) * unit;

const getBmr = (profile: UserProfileInput) => {
  const s = profile.gender === "male" ? 5 : -161;
  return 10 * profile.weightKg + 6.25 * profile.heightCm - 5 * profile.age + s;
};

const getEffectivePal = (profile: UserProfileInput) => {
  return clamp(ACTIVITY_FACTOR[profile.occupationalActivityLevel ?? "sedentary"], 1.2, 1.9);
};

const isLeanRecompositionProfile = (profile: UserProfileInput) => {
  if (profile.bodyFatPct === undefined) return false;
  if (profile.gender === "male") return profile.bodyFatPct <= 15;
  return profile.bodyFatPct <= 23;
};

const getGoalMultiplier = (profile: UserProfileInput) => {
  if (profile.primaryGoal !== "recomposition") return GOAL_MULTIPLIER[profile.primaryGoal];
  return isLeanRecompositionProfile(profile) ? 1.0 : GOAL_MULTIPLIER.recomposition;
};

const getProteinGrams = (profile: UserProfileInput, targetCalories: number) => {
  let grams = profile.weightKg * PROTEIN_PER_KG[profile.primaryGoal];

  if ((profile.primaryGoal === "cutting" || profile.primaryGoal === "recomposition") && profile.bodyFatPct !== undefined) {
    const leanMassKg = profile.weightKg * (1 - profile.bodyFatPct / 100);
    grams = clamp(leanMassKg * 2.2, leanMassKg * 1.8, leanMassKg * 2.6);
  }

  const bwCap = profile.weightKg * 2.2;
  const kcalCap = (targetCalories * 0.35) / 4;
  return Math.max(0, Math.round(Math.min(grams, bwCap, kcalCap)));
};

const getFatGrams = (profile: UserProfileInput, targetCalories: number) => {
  const ratioBased = (targetCalories * FAT_RATIO[profile.primaryGoal]) / 9;
  const floorByWeight = profile.weightKg * 0.6;
  return Math.max(ratioBased, floorByWeight);
};

export const calculateNutritionTargets = (profile: UserProfileInput): NutritionTargets => {
  const baseBmr = getBmr(profile);
  const tdee = Math.round(baseBmr * getEffectivePal(profile));
  const rawTargetCalories = Math.max(1000, tdee * getGoalMultiplier(profile));
  const targetCalories = roundToNearest(rawTargetCalories, 10);

  const rawProteinG = getProteinGrams(profile, targetCalories);
  const rawFatG = getFatGrams(profile, targetCalories);
  const remainingCalories = Math.max(0, targetCalories - (rawProteinG * 4 + rawFatG * 9));
  const rawCarbsG = remainingCalories / 4;

  const proteinG = roundToNearest(rawProteinG, 5);
  const fatG = roundToNearest(rawFatG, 5);
  const carbsG = roundToNearest(rawCarbsG, 5);

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
