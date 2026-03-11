export type ProgressTone = "low" | "ok" | "slight" | "high";

interface ToneOptions {
  /** Sugar/sodium use stricter thresholds (ceiling nutrients). */
  ceiling?: boolean;
}

/**
 * 4-tier tone based on intake-to-target ratio.
 *
 * Standard nutrients (cal, carbs, protein, fat):
 *   low ≤0.8 | ok 0.8–1.0 | slight 1.0–1.1 | high >1.1
 *
 * Ceiling nutrients (sugar, sodium):
 *   low ≤0.8 | ok 0.8–1.0 | slight 1.0–1.2 | high >1.2
 */
export const getProgressTone = (
  ratio: number,
  opts?: ToneOptions,
): ProgressTone => {
  if (!Number.isFinite(ratio) || ratio <= 0.8) return "low";
  const highThreshold = opts?.ceiling ? 1.2 : 1.1;
  if (ratio <= 1) return "ok";
  if (ratio <= highThreshold) return "slight";
  return "high";
};

/** True when intake is in the 80–110% sweet spot (ok or slight). */
export const isAchieved = (tone: ProgressTone): boolean =>
  tone === "ok" || tone === "slight";

export const TONE_CHART_COLOR: Record<ProgressTone, string> = {
  low: "rgba(245,158,11,0.75)",
  ok: "rgba(34,197,94,0.75)",
  slight: "rgba(34,197,94,0.75)",
  high: "rgba(239,68,68,0.75)",
};

export const TONE_TEXT_COLOR: Record<ProgressTone, string> = {
  low: "rgb(245,158,11)",
  ok: "rgb(34,197,94)",
  slight: "rgb(34,197,94)",
  high: "rgb(239,68,68)",
};
