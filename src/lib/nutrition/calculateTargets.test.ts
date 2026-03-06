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
  neatLevel: "light",
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

  assert.equal(cutting.targetCalories, 2240);
  assert.equal(bulking.targetCalories, 2940);
  assert.equal(recomposition.targetCalories, 2590);
  assert.equal(maintenance.targetCalories, 2800);

  assert.equal(cutting.fat, 60);
  assert.equal(bulking.fat, 80);
  assert.equal(recomposition.fat, 85);
  assert.equal(maintenance.fat, 95);
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

  assert.equal(withoutBodyFat.targetCalories, 2590);
  assert.equal(leanMale.targetCalories, 2800);
});

test("cutting protein respects bodyweight and calorie caps", () => {
  const lowCalorie = calculateNutritionTargets({
    ...baseProfile,
    weightKg: 120,
    heightCm: 160,
    age: 60,
    occupationalActivityLevel: "sedentary",
    neatLevel: "sedentary",
    primaryGoal: "cutting",
    bodyFatPct: 45,
  });

  assert.ok(lowCalorie.protein <= 265);
  assert.ok(lowCalorie.protein * 4 <= lowCalorie.targetCalories * 0.35 + 20);
});
