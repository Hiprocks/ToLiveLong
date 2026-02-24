import { NextRequest, NextResponse } from "next/server";
import { appendRow, listRows, parseTemplate, RANGES } from "@/lib/sheets";
import { TemplateItem } from "@/lib/types";

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export async function GET() {
  try {
    const rows = await listRows(RANGES.templates);
    const templates = rows
      .map(parseTemplate)
      .filter((row) => row.id && row.food_name)
      .sort((a, b) => a.food_name.localeCompare(b.food_name));
    return NextResponse.json(templates);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<TemplateItem>;
    if (!body.food_name) {
      return NextResponse.json({ error: "food_name is required" }, { status: 400 });
    }

    const template: TemplateItem = {
      id: body.id ?? createId(),
      food_name: body.food_name,
      base_amount: Number(body.base_amount ?? 100),
      calories: Number(body.calories ?? 0),
      carbs: Number(body.carbs ?? 0),
      protein: Number(body.protein ?? 0),
      fat: Number(body.fat ?? 0),
      sugar: Number(body.sugar ?? 0),
      sodium: Number(body.sodium ?? 0),
    };

    await appendRow(RANGES.templates, [
      template.id,
      template.food_name,
      template.base_amount,
      template.calories,
      template.carbs,
      template.protein,
      template.fat,
      template.sugar,
      template.sodium,
    ]);

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create template" }, { status: 500 });
  }
}

