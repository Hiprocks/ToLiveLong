import { NextRequest, NextResponse } from "next/server";
import { DailyTargets } from "@/lib/types";
import { appendRow, listRows, parseUserTargets, RANGES, updateRow } from "@/lib/sheets";

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
    const body = (await req.json()) as Partial<DailyTargets>;
    const targets: DailyTargets = {
      calories: Number(body.calories ?? defaultTargets.calories),
      carbs: Number(body.carbs ?? defaultTargets.carbs),
      protein: Number(body.protein ?? defaultTargets.protein),
      fat: Number(body.fat ?? defaultTargets.fat),
      sugar: Number(body.sugar ?? defaultTargets.sugar),
      sodium: Number(body.sodium ?? defaultTargets.sodium),
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
    return NextResponse.json({ error: "Failed to update user targets" }, { status: 500 });
  }
}

