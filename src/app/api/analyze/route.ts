import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { assertSameOrigin, AuthorizationError } from "@/lib/apiGuard";
import { normalizeAnalyzePayload, parseModelJson } from "@/lib/analyzePayload";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const DEFAULT_MODEL_CANDIDATES = ["gemini-1.5-pro", "gemini-1.5-flash"] as const;

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

    const buffer = await file.arrayBuffer();
    const base64Image = Buffer.from(buffer).toString("base64");

    const prompt = `
      Analyze this image of food or a nutrition label.
      Identify the food item and estimate its nutritional content.
      If it's a nutrition label, extract the values.
      
      Return ONLY a raw JSON object (no markdown formatting) with the following structure:
      {
        "menu_name": "Food Name",
        "calories": 0, // number (kcal)
        "carbs": 0, // number (g)
        "protein": 0, // number (g)
        "fat": 0, // number (g)
        "sugar": 0, // number (g)
        "sodium": 0 // number (mg)
      }
      
      If you cannot determine a value, use 0.
      Ensure the response is valid JSON.
    `;

    const modelCandidates = getModelCandidates();
    let lastError = "Unknown error";

    for (const modelName of modelCandidates) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent([
          prompt,
          {
            inlineData: {
              data: base64Image,
              mimeType: file.type,
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
