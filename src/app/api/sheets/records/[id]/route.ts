import { NextRequest, NextResponse } from "next/server";
import {
  deleteRowByIndex,
  getRowsByIndexes,
  listRecordIdColumn,
  parseRecord,
  RANGES,
  updateRow,
} from "@/lib/sheets";
import { CACHE_TAGS, revalidateCacheTag } from "@/lib/sheetsCache";
import { MealRecord } from "@/lib/types";
import {
  assertFoodName,
  assertIsoDate,
  parseNonNegativeNumber,
  ValidationError,
} from "@/lib/apiValidation";
import { assertSameOrigin, AuthorizationError } from "@/lib/apiGuard";
import { normalizeIntakeMeta, serializeIntakeMeta } from "@/lib/mealAdjustments";

const findRecordById = async (id: string) => {
  const ids = await listRecordIdColumn();
  const rowOffset = ids.findIndex((value) => value === id);
  if (rowOffset < 0) return null;

  const rowIndex = rowOffset + 2;
  const rows = await getRowsByIndexes("records", "K", [rowIndex]);
  const row = rows[0];
  if (!row) return null;
  return { rowIndex, record: parseRecord(row) };
};

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    assertSameOrigin(req);
    const { id } = await context.params;
    const found = await findRecordById(id);
    if (!found) return NextResponse.json({ error: "Record not found" }, { status: 404 });

    const body = (await req.json()) as Partial<MealRecord>;
    const mergedWithBody: MealRecord = {
      ...found.record,
      ...body,
      id,
    };
    const intakeMeta = normalizeIntakeMeta(mergedWithBody.intakeMeta);

    const merged: MealRecord = {
      id,
      date: assertIsoDate(mergedWithBody.date),
      food_name: assertFoodName(mergedWithBody.food_name),
      intakeMeta,
      amount: parseNonNegativeNumber(mergedWithBody.amount, "amount", { min: 1, max: 10000 }),
      calories: parseNonNegativeNumber(mergedWithBody.calories, "calories", { max: 20000 }),
      carbs: parseNonNegativeNumber(mergedWithBody.carbs, "carbs", { max: 5000 }),
      protein: parseNonNegativeNumber(mergedWithBody.protein, "protein", { max: 5000 }),
      fat: parseNonNegativeNumber(mergedWithBody.fat, "fat", { max: 5000 }),
      sugar: parseNonNegativeNumber(mergedWithBody.sugar, "sugar", { max: 5000 }),
      sodium: parseNonNegativeNumber(mergedWithBody.sodium, "sodium", { max: 100000 }),
    };

    await updateRow(RANGES.records, found.rowIndex, [
      merged.id,
      merged.date,
      serializeIntakeMeta(merged.intakeMeta),
      merged.food_name,
      merged.amount,
      merged.calories,
      merged.carbs,
      merged.protein,
      merged.fat,
      merged.sugar,
      merged.sodium,
    ]);

    revalidateCacheTag(CACHE_TAGS.records);
    return NextResponse.json(merged);
  } catch (error) {
    console.error(error);
    if (error instanceof ValidationError || error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Failed to update record" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    assertSameOrigin(_req);
    const { id } = await context.params;
    const found = await findRecordById(id);
    if (!found) return NextResponse.json({ error: "Record not found" }, { status: 404 });

    await deleteRowByIndex("records", found.rowIndex);
    revalidateCacheTag(CACHE_TAGS.records);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Failed to delete record" }, { status: 500 });
  }
}
