import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { assertSameOrigin, AuthorizationError } from "@/lib/apiGuard";
import { normalizeAnalyzePayload, parseModelJson } from "@/lib/analyzePayload";

const DEFAULT_MODEL_CANDIDATES = [
  "gemini-2.5-pro",
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-1.5-pro",
] as const;

const getModelCandidates = (): string[] => {
  const fromEnv = (process.env.GEMINI_MODEL ?? "")
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
  return Array.from(new Set([...fromEnv, ...DEFAULT_MODEL_CANDIDATES]));
};

const normalizeIntakeSummary = (value: unknown, fallback: string): string => {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  return trimmed.length > 120 ? `${trimmed.slice(0, 120).trim()}...` : trimmed;
};

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "GEMINI_API_KEY is not configured" }, { status: 500 });
    }

    const body = (await req.json()) as { text?: string };
    const text = typeof body?.text === "string" ? body.text.trim() : "";
    if (!text) {
      return NextResponse.json({ error: "text is required" }, { status: 400 });
    }

    const prompt = `
Analyze the user's food intake text.
Estimate a single meal entry as structured nutrition.
Return ONLY raw JSON with this schema:
{
  "menu_name": "Korean Food Name",
  "amount": 0,
  "amount_basis": "food_serving_estimate",
  "calories": 0,
  "carbs": 0,
  "protein": 0,
  "fat": 0,
  "sugar": 0,
  "sodium": 0,
  "intake_summary": "Korean short summary of what user consumed and remaining ratio"
}
Rules:
- menu_name must be Korean.
- amount is grams.
- if unknown, use safe estimate and keep numbers realistic.
- intake_summary should be concise and clearly mention eaten vs leftover.

User input:
${text}
    `.trim();

    const modelCandidates = getModelCandidates();
    let lastError = "Unknown error";

    for (const modelName of modelCandidates) {
      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: "application/json",
          },
        });

        const result = await model.generateContent([prompt]);
        const response = await result.response;
        const parsed = parseModelJson(response.text());
        const normalized = normalizeAnalyzePayload(parsed);
        const parsedRecord = parsed as Record<string, unknown>;
        return NextResponse.json({
          ...normalized,
          intake_summary: normalizeIntakeSummary(parsedRecord.intake_summary, text),
        });
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
        console.warn(`[analyze/text] Gemini model failed: ${modelName}`, error);
      }
    }

    throw new Error(
      `Gemini request failed for models (${modelCandidates.join(", ")}). Last error: ${lastError}`
    );
  } catch (error) {
    console.error("Error analyzing text:", error);
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to analyze text",
      },
      { status: 500 }
    );
  }
}
