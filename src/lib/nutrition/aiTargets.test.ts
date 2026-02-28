import assert from "node:assert/strict";
import test from "node:test";
import { getAiModelCandidates, normalizeAiTargetsPayload } from "@/lib/nutrition/aiTargets";

test("getAiModelCandidates includes modern defaults and deduplicates env models", () => {
  const prev = process.env.GEMINI_MODEL;
  process.env.GEMINI_MODEL = "gemini-2.5-flash, gemini-2.0-flash, gemini-2.5-flash";

  try {
    const models = getAiModelCandidates();
    assert.ok(models.includes("gemini-2.5-pro"));
    assert.ok(models.includes("gemini-2.5-flash"));
    assert.ok(models.includes("gemini-2.0-flash"));
    assert.equal(models.filter((m) => m === "gemini-2.5-flash").length, 1);
  } finally {
    if (prev === undefined) {
      delete process.env.GEMINI_MODEL;
    } else {
      process.env.GEMINI_MODEL = prev;
    }
  }
});

test("normalizeAiTargetsPayload returns ai payload for valid response", () => {
  const payload = normalizeAiTargetsPayload({
    bmr: 1601,
    tdee: 2302,
    targetCalories: 2103,
    carbs: 250,
    protein: 140,
    fat: 60,
    sugar: 35,
    sodium: 1800,
    notes: "- test note",
  });

  assert.ok(payload);
  assert.equal(payload?.targetCalories, 2103);
  assert.equal(payload?.aiSource, "ai");
  assert.equal(payload?.aiNotes, "- test note");
});

test("normalizeAiTargetsPayload returns null when required macros are missing", () => {
  const payload = normalizeAiTargetsPayload({
    targetCalories: 2100,
    carbs: 0,
    protein: 130,
    fat: 60,
    notes: "invalid",
  });
  assert.equal(payload, null);
});
