import test from "node:test";
import assert from "node:assert/strict";
import {
  applyIntakeAdjustments,
  invertAdjustedValue,
  isSoupyMeal,
  normalizeIntakeMeta,
  parseIntakeMeta,
  serializeIntakeMeta,
} from "@/lib/mealAdjustments";

test("isSoupyMeal detects soup-like meals from korean names", () => {
  assert.equal(isSoupyMeal("김치찌개"), true);
  assert.equal(isSoupyMeal("닭가슴살"), false);
});

test("applyIntakeAdjustments applies soup and ratio together", () => {
  const adjusted = applyIntakeAdjustments(
    {
      amount: 400,
      calories: 800,
      carbs: 80,
      protein: 40,
      fat: 20,
      sugar: 10,
      sodium: 2000,
    },
    {
      version: 1,
      adjustments: {
        soupPreference: "solids_only",
        consumptionRatio: 0.5,
      },
    },
    true
  );

  assert.deepEqual(adjusted, {
    amount: 200,
    calories: 280,
    carbs: 28,
    protein: 14,
    fat: 7,
    sugar: 4,
    sodium: 500,
  });
});

test("invertAdjustedValue restores base values", () => {
  const meta = normalizeIntakeMeta({
    version: 1,
    adjustments: { soupPreference: "solids_only", consumptionRatio: 0.5 },
  });

  assert.equal(invertAdjustedValue("amount", 200, meta, true), 400);
  assert.equal(invertAdjustedValue("calories", 280, meta, true), 800);
});

test("serializeIntakeMeta omits defaults and parses safely", () => {
  assert.equal(serializeIntakeMeta({ version: 1, adjustments: { soupPreference: "normal", consumptionRatio: 1 } }), "");

  const serialized = serializeIntakeMeta({
    version: 1,
    adjustments: {
      soupPreference: "solids_only",
      consumptionRatio: 0.75,
    },
  });

  assert.deepEqual(parseIntakeMeta(serialized), {
    version: 1,
    adjustments: {
      soupPreference: "solids_only",
      consumptionRatio: 0.75,
    },
  });
});
