import { NextRequest, NextResponse } from "next/server";
import {
  appendRow,
  deleteRowByIndex,
  RANGES,
} from "@/lib/sheets";
import { MealRecord } from "@/lib/types";
import {
  assertFoodName,
  assertIsoDate,
  parseNonNegativeNumber,
  ValidationError,
} from "@/lib/apiValidation";
import { assertSameOrigin, AuthorizationError } from "@/lib/apiGuard";
import { getLocalDateString } from "@/lib/date";
import {
  CACHE_TAGS,
  getCachedAllRecords,
  getCachedRecordsByDate,
  revalidateCacheTag,
} from "@/lib/sheetsCache";

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const addTemplateIfNeeded = async (
  record: MealRecord,
  saveAsTemplate: boolean
): Promise<{ saved: boolean; templateId: string | null }> => {
  if (!saveAsTemplate) return { saved: false, templateId: null };
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
  return { saved: true, templateId };
};

export async function GET(req: NextRequest) {
  try {
    const date = req.nextUrl.searchParams.get("date");
    if (!date) {
      const records = await getCachedAllRecords();
      return NextResponse.json(records);
    }

    const targetDate = assertIsoDate(date);
    const records = await getCachedRecordsByDate(targetDate);
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
    const foodName = assertFoodName(body.food_name);
    const date = assertIsoDate(body.date ?? getLocalDateString());

    const record: MealRecord = {
      id: body.id ?? createId(),
      date,
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
      "",
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
    let templateId: string | null = null;
    try {
      const result = await addTemplateIfNeeded(record, Boolean(body.saveAsTemplate));
      templateSaved = result.saved;
      templateId = result.templateId;
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

    revalidateCacheTag(CACHE_TAGS.records);
    if (templateSaved) revalidateCacheTag(CACHE_TAGS.templates);

    return NextResponse.json({ record, templateSaved, templateId }, { status: 201 });
  } catch (error) {
    console.error(error);
    if (error instanceof ValidationError || error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Failed to create record" }, { status: 500 });
  }
}
