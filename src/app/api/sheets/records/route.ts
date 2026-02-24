import { NextRequest, NextResponse } from "next/server";
import {
  appendRow,
  deleteRowByIndex,
  getRowsByIndexes,
  listRecordDateColumn,
  listRows,
  parseRecord,
  RANGES,
} from "@/lib/sheets";
import { MealRecord, MealType } from "@/lib/types";
import {
  assertFoodName,
  assertIsoDate,
  assertMealType,
  parseNonNegativeNumber,
  ValidationError,
} from "@/lib/apiValidation";
import { assertSameOrigin, AuthorizationError } from "@/lib/apiGuard";
import { getLocalDateString } from "@/lib/date";

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const addTemplateIfNeeded = async (
  record: MealRecord,
  saveAsTemplate: boolean
): Promise<boolean> => {
  if (!saveAsTemplate) return false;
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
  return true;
};

export async function GET(req: NextRequest) {
  try {
    const date = req.nextUrl.searchParams.get("date");
    if (!date) {
      const rows = await listRows(RANGES.records);
      const records = rows.map(parseRecord).filter((row) => row.id && row.food_name);
      return NextResponse.json(records);
    }

    const targetDate = assertIsoDate(date);
    const dateColumn = await listRecordDateColumn();
    const rowIndexes = dateColumn
      .map((value, index) => (value === targetDate ? index + 2 : null))
      .filter((rowIndex): rowIndex is number => rowIndex !== null);

    if (rowIndexes.length === 0) return NextResponse.json([]);

    const rows = await getRowsByIndexes("records", "K", rowIndexes);
    const records = rows.map(parseRecord).filter((row) => row.id && row.food_name);
    return NextResponse.json(records);
  } catch (error) {
    console.error(error);
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Failed to fetch records" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
    const body = (await req.json()) as Partial<MealRecord> & { saveAsTemplate?: boolean };
    const mealType: MealType = assertMealType(body.meal_type ?? "breakfast");
    const foodName = assertFoodName(body.food_name);
    const date = assertIsoDate(body.date ?? getLocalDateString());

    const record: MealRecord = {
      id: body.id ?? createId(),
      date,
      meal_type: mealType,
      food_name: foodName,
      amount: parseNonNegativeNumber(body.amount ?? 0, "amount", { min: 1, max: 10000 }),
      calories: parseNonNegativeNumber(body.calories ?? 0, "calories", { max: 20000 }),
      carbs: parseNonNegativeNumber(body.carbs ?? 0, "carbs", { max: 5000 }),
      protein: parseNonNegativeNumber(body.protein ?? 0, "protein", { max: 5000 }),
      fat: parseNonNegativeNumber(body.fat ?? 0, "fat", { max: 5000 }),
      sugar: parseNonNegativeNumber(body.sugar ?? 0, "sugar", { max: 5000 }),
      sodium: parseNonNegativeNumber(body.sodium ?? 0, "sodium", { max: 100000 }),
    };

    const { rowIndex } = await appendRow(RANGES.records, [
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

    let templateSaved = false;
    try {
      templateSaved = await addTemplateIfNeeded(record, Boolean(body.saveAsTemplate));
    } catch (templateError) {
      if (rowIndex) {
        try {
          await deleteRowByIndex("records", rowIndex);
        } catch (rollbackError) {
          console.error("Rollback failed after template save failure:", rollbackError);
        }
      }
      throw templateError;
    }

    return NextResponse.json({ record, templateSaved }, { status: 201 });
  } catch (error) {
    console.error(error);
    if (error instanceof ValidationError || error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Failed to create record" }, { status: 500 });
  }
}
