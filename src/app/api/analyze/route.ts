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

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "GEMINI_API_KEY is not configured" }, { status: 500 });
    }
    const formData = await req.formData();
    const file = formData.get("image") as File;

    if (!file) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }
    if (!file.type || !file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Invalid image type" }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const base64Image = Buffer.from(buffer).toString("base64");
    const mimeType = file.type || "image/jpeg";

    const prompt = `
      Analyze this image of food or a nutrition label.
      Identify whether this is (A) a nutrition label or (B) a food photo.
      For (A) nutrition label:
      - Set amount_basis to "label_total_content"
      - Extract total content amount in grams (or ml treated as equivalent for input) as "amount"
      - Return nutrients for that total content amount (not per serving)
      - menu_name must be Korean
      For (B) food photo:
      - Set amount_basis to "food_serving_estimate"
      - Estimate one serving amount in grams as "amount"
      - Return nutrients for that one serving amount
      - menu_name must be Korean

      Return ONLY a raw JSON object (no markdown formatting) with the following structure:
      {
        "menu_name": "Korean Food Name",
        "amount": 0, // number (grams/ml)
        "amount_basis": "label_total_content" | "food_serving_estimate",
        "calories": 0, // number (kcal)
        "carbs": 0, // number (g)
        "protein": 0, // number (g)
        "fat": 0, // number (g)
        "sugar": 0, // number (g)
        "sodium": 0 // number (mg)
      }
      
      If you cannot determine amount, use 100.
      If you cannot determine nutrient values, use 0.
      Translate menu_name to Korean if source text is English.
      Ensure the response is valid JSON.
    `;

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
        const result = await model.generateContent([
          prompt,
          {
            inlineData: {
              data: base64Image,
              mimeType,
            },
          },
        ]);
        const response = await result.response;
        const text = response.text();
        const parsed = parseModelJson(text);
        const data = normalizeAnalyzePayload(parsed);
        return NextResponse.json(data);
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
        console.warn(`[analyze] Gemini model failed: ${modelName}`, error);
      }
    }

    throw new Error(
      `Gemini request failed for models (${modelCandidates.join(", ")}). Last error: ${lastError}`
    );
  } catch (error) {
    console.error("Error analyzing image:", error);
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to analyze image",
      },
      { status: 500 }
    );
  }
}
