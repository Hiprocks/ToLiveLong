import { NextRequest, NextResponse } from "next/server";
import { appendRow, listRows, parseRecord, RANGES } from "@/lib/sheets";
import { MealRecord, MealType } from "@/lib/types";

const isMealType = (value: string): value is MealType =>
  ["breakfast", "lunch", "dinner", "snack"].includes(value);

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const addTemplateIfNeeded = async (record: MealRecord, saveAsTemplate: boolean) => {
  if (!saveAsTemplate) return;
  const templateId = createId();
  await appendRow(RANGES.templates, [
    templateId,
    record.food_name,
    record.amount,
    record.calories,
    record.carbs,
    record.protein,
    record.fat,
    record.sugar,
    record.sodium,
  ]);
};

export async function GET(req: NextRequest) {
  try {
    const date = req.nextUrl.searchParams.get("date");
    const rows = await listRows(RANGES.records);
    const records = rows.map(parseRecord).filter((row) => row.id && row.food_name);
    const filtered = date ? records.filter((row) => row.date === date) : records;

    return NextResponse.json(filtered);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch records" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<MealRecord> & { saveAsTemplate?: boolean };
    const mealType = body.meal_type ?? "breakfast";
    if (!isMealType(mealType)) {
      return NextResponse.json({ error: "Invalid meal_type" }, { status: 400 });
    }

    if (!body.food_name) {
      return NextResponse.json({ error: "food_name is required" }, { status: 400 });
    }

    const record: MealRecord = {
      id: body.id ?? createId(),
      date: body.date ?? new Date().toISOString().slice(0, 10),
      meal_type: mealType,
      food_name: body.food_name,
      amount: Number(body.amount ?? 0),
      calories: Number(body.calories ?? 0),
      carbs: Number(body.carbs ?? 0),
      protein: Number(body.protein ?? 0),
      fat: Number(body.fat ?? 0),
      sugar: Number(body.sugar ?? 0),
      sodium: Number(body.sodium ?? 0),
    };

    await appendRow(RANGES.records, [
      record.id,
      record.date,
      record.meal_type,
      record.food_name,
      record.amount,
      record.calories,
      record.carbs,
      record.protein,
      record.fat,
      record.sugar,
      record.sodium,
    ]);

    await addTemplateIfNeeded(record, Boolean(body.saveAsTemplate));

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create record" }, { status: 500 });
  }
}

