import { NextRequest, NextResponse } from "next/server";
import {
  deleteRowByIndex,
  listRows,
  parseRecord,
  RANGES,
  updateRow,
} from "@/lib/sheets";
import { MealRecord } from "@/lib/types";

const findRecordById = async (id: string) => {
  const rows = await listRows(RANGES.records);
  const rowIndex = rows.findIndex((row) => row[0] === id);
  if (rowIndex < 0) return null;
  return { rowIndex: rowIndex + 2, record: parseRecord(rows[rowIndex]) };
};

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const found = await findRecordById(id);
    if (!found) return NextResponse.json({ error: "Record not found" }, { status: 404 });

    const body = (await req.json()) as Partial<MealRecord>;
    const merged: MealRecord = {
      ...found.record,
      ...body,
      id,
    };

    await updateRow(RANGES.records, found.rowIndex, [
      merged.id,
      merged.date,
      merged.meal_type,
      merged.food_name,
      merged.amount,
      merged.calories,
      merged.carbs,
      merged.protein,
      merged.fat,
      merged.sugar,
      merged.sodium,
    ]);

    return NextResponse.json(merged);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update record" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const found = await findRecordById(id);
    if (!found) return NextResponse.json({ error: "Record not found" }, { status: 404 });

    await deleteRowByIndex("records", found.rowIndex);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete record" }, { status: 500 });
  }
}

