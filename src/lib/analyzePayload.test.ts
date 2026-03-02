import test from "node:test";
import assert from "node:assert/strict";
import { normalizeAnalyzePayload, parseModelJson } from "@/lib/analyzePayload";

test("parseModelJson parses fenced JSON", () => {
  const parsed = parseModelJson('```json\n{"menu_name":"Banana","calories":105}\n```') as {
    menu_name: string;
    calories: number;
  };
  assert.equal(parsed.menu_name, "Banana");
  assert.equal(parsed.calories, 105);
});

test("parseModelJson parses JSON wrapped in prose", () => {
  const parsed = parseModelJson(
    'Result:\nHere is the object:\n{"menu_name":"Egg","protein":6}\nDone.'
  ) as { menu_name: string; protein: number };
  assert.equal(parsed.menu_name, "Egg");
  assert.equal(parsed.protein, 6);
});

test("normalizeAnalyzePayload clamps and rounds nutrient values", () => {
  const normalized = normalizeAnalyzePayload({
    menu_name: " Yogurt ",
    calories: 99.6,
    carbs: -3,
    protein: "18.2",
    fat: Infinity,
    sugar: 7000,
    sodium: "1200.4",
  });

  assert.deepEqual(normalized, {
    menu_name: "요거트",
    food_name: "요거트",
    amount: 100,
    amount_basis: "food_serving_estimate",
    calories: 100,
    carbs: 0,
    protein: 18,
    fat: 0,
    sugar: 5000,
    sodium: 1200,
  });
});

test("normalizeAnalyzePayload throws for invalid payload type", () => {
  assert.throws(() => normalizeAnalyzePayload(null), /Invalid model JSON payload/);
  assert.throws(() => normalizeAnalyzePayload([]), /Invalid model JSON payload/);
});
