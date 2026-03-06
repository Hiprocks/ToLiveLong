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
    analysis: "체지방이 높은 편이며 감량 목표입니다.",
    exercisePlan: "주 3회 중강도 운동을 꾸준히 이어가세요.",
    dietPlan: "단백질을 우선 챙기고 허리둘레 변화를 함께 추적하세요.",
    notes: "핵심: 단백질과 허리둘레를 함께 관리하세요.",
  });

  assert.ok(payload);
  assert.equal(payload?.aiSource, "ai");
  assert.equal(payload?.aiNotes, "핵심: 단백질과 허리둘레를 함께 관리하세요.");
  assert.equal(payload?.aiFeedback?.analysis, "체지방이 높은 편이며 감량 목표입니다.");
});

test("normalizeAiTargetsPayload returns null when required feedback fields are missing", () => {
  const payload = normalizeAiTargetsPayload({
    analysis: "요약만 있음",
    notes: "invalid",
  });
  assert.equal(payload, null);
});
