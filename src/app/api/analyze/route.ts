import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("image") as File;

        if (!file) {
            return NextResponse.json({ error: "No image provided" }, { status: 400 });
        }

        const buffer = await file.arrayBuffer();
        const base64Image = Buffer.from(buffer).toString("base64");

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

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

        // Clean up markdown code blocks if present
        const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();
        const data = JSON.parse(jsonStr);

        return NextResponse.json(data);
    } catch (error) {
        console.error("Error analyzing image:", error);
        return NextResponse.json(
            { error: "Failed to analyze image" },
            { status: 500 }
        );
    }
}
