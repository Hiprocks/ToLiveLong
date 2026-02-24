import { NextRequest, NextResponse } from "next/server";
import { DailyTargets } from "@/lib/types";
import { appendRow, listRows, parseUserTargets, RANGES, updateRow } from "@/lib/sheets";
import { parseNonNegativeNumber, ValidationError } from "@/lib/apiValidation";
import { assertSameOrigin, AuthorizationError } from "@/lib/apiGuard";

const defaultTargets: DailyTargets = {
  calories: 2300,
  carbs: 320,
  protein: 120,
  fat: 60,
  sugar: 30,
  sodium: 2000,
};

export async function GET() {
  try {
    const rows = await listRows(RANGES.user);
    const targets = parseUserTargets(rows[0] ?? null) ?? defaultTargets;
    return NextResponse.json(targets);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch user targets" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    assertSameOrigin(req);
    const body = (await req.json()) as Partial<DailyTargets>;
    const targets: DailyTargets = {
      calories: parseNonNegativeNumber(body.calories ?? defaultTargets.calories, "calories", {
        max: 20000,
      }),
      carbs: parseNonNegativeNumber(body.carbs ?? defaultTargets.carbs, "carbs", { max: 5000 }),
      protein: parseNonNegativeNumber(body.protein ?? defaultTargets.protein, "protein", {
        max: 5000,
      }),
      fat: parseNonNegativeNumber(body.fat ?? defaultTargets.fat, "fat", { max: 5000 }),
      sugar: parseNonNegativeNumber(body.sugar ?? defaultTargets.sugar, "sugar", { max: 5000 }),
      sodium: parseNonNegativeNumber(body.sodium ?? defaultTargets.sodium, "sodium", {
        max: 100000,
      }),
    };

    const rows = await listRows(RANGES.user);
    const rowValues = [
      targets.calories,
      targets.carbs,
      targets.protein,
      targets.fat,
      targets.sugar,
      targets.sodium,
    ];

    if (rows.length === 0) {
      await appendRow(RANGES.user, rowValues);
    } else {
      await updateRow(RANGES.user, 2, rowValues);
    }

    return NextResponse.json(targets);
  } catch (error) {
    console.error(error);
    if (error instanceof ValidationError || error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Failed to update user targets" }, { status: 500 });
  }
}
