import assert from "node:assert/strict";
import test from "node:test";
import { calculateNutritionTargets } from "@/lib/nutrition/calculateTargets";
import { UserProfileInput } from "@/lib/types";

const baseProfile: UserProfileInput = {
  gender: "male",
  age: 30,
  heightCm: 175,
  weightKg: 80,
  occupationalActivityLevel: "moderate",
  exerciseFrequencyWeekly: 3,
  exerciseDurationMin: 45,
  exerciseIntensity: "medium",
  primaryGoal: "maintenance",
};

test("maintenance uses PAL-only activity and rounds outputs", () => {
  const baseline = calculateNutritionTargets(baseProfile);
  const heavyTraining = calculateNutritionTargets({
    ...baseProfile,
    exerciseFrequencyWeekly: 7,
    exerciseDurationMin: 120,
    exerciseIntensity: "high",
  });

  assert.equal(baseline.tdee, heavyTraining.tdee);
  assert.equal(baseline.targetCalories % 10, 0);
  assert.equal(baseline.protein % 5, 0);
  assert.equal(baseline.fat % 5, 0);
  assert.equal(baseline.carbs % 5, 0);
});

test("goal multipliers and fat ratios follow the rewritten plan", () => {
  const cutting = calculateNutritionTargets({ ...baseProfile, primaryGoal: "cutting" });
  const bulking = calculateNutritionTargets({ ...baseProfile, primaryGoal: "bulking" });
  const recomposition = calculateNutritionTargets({ ...baseProfile, primaryGoal: "recomposition" });
  const maintenance = calculateNutritionTargets({ ...baseProfile, primaryGoal: "maintenance" });

  assert.equal(cutting.targetCalories, 2170);
  assert.equal(bulking.targetCalories, 2850);
  assert.equal(recomposition.targetCalories, 2510);
  assert.equal(maintenance.targetCalories, 2710);

  assert.equal(cutting.fat, 60);
  assert.equal(bulking.fat, 80);
  assert.equal(recomposition.fat, 85);
  assert.equal(maintenance.fat, 90);
});

test("recomposition moves lean profiles to maintenance calories", () => {
  const withoutBodyFat = calculateNutritionTargets({
    ...baseProfile,
    primaryGoal: "recomposition",
  });
  const leanMale = calculateNutritionTargets({
    ...baseProfile,
    primaryGoal: "recomposition",
    bodyFatPct: 12,
  });

  assert.equal(withoutBodyFat.targetCalories, 2510);
  assert.equal(leanMale.targetCalories, 2710);
});

test("cutting protein respects bodyweight and calorie caps", () => {
  const lowCalorie = calculateNutritionTargets({
    ...baseProfile,
    weightKg: 120,
    heightCm: 160,
    age: 60,
    occupationalActivityLevel: "sedentary",
    primaryGoal: "cutting",
    bodyFatPct: 45,
  });

  assert.ok(lowCalorie.protein <= 265);
  assert.ok(lowCalorie.protein * 4 <= lowCalorie.targetCalories * 0.35 + 20);
});

test("recomposition with bodyFatPct uses LBM x 2.5 protein", () => {
  // 60kg male, 27.2% body fat → LBM 43.68kg → 43.68 x 2.5 = 109.2 → 110g
  const result = calculateNutritionTargets({
    gender: "male", age: 42, heightCm: 168, weightKg: 60,
    primaryGoal: "recomposition",
    occupationalActivityLevel: "moderate",
    exerciseFrequencyWeekly: 3, exerciseDurationMin: 25, exerciseIntensity: "medium",
    bodyFatPct: 27.2,
  });

  assert.equal(result.protein, 110);
  // protein should be higher than body-weight-based fallback (60 x 1.6 = 96 → 95g)
  assert.ok(result.protein > 95);
});

test("cutting with bodyFatPct uses LBM x 2.2 protein", () => {
  // 80kg male, 25% body fat → LBM 60kg → 60 x 2.2 = 132 → 130g
  const result = calculateNutritionTargets({
    ...baseProfile,
    primaryGoal: "cutting",
    bodyFatPct: 25,
  });

  assert.equal(result.protein, 130);
});
