import { NextRequest, NextResponse } from "next/server";
import {
  appendRow,
  listRows,
  parseUserAi,
  parseUserDietReview,
  parseUserProfile,
  parseUserTargets,
  RANGES,
  serializeUserRow,
  updateRow,
} from "@/lib/sheets";
import { CACHE_TAGS, revalidateCacheTag } from "@/lib/sheetsCache";
import { assertSameOrigin, AuthorizationError } from "@/lib/apiGuard";

type DietReviewBody = {
  text: string;
  generatedAt: string;
  from: string;
  to: string;
};

const defaultTargets = {
  calories: 2300,
  carbs: 320,
  protein: 120,
  fat: 60,
  sugar: 30,
  sodium: 2000,
};

const isDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);

export async function GET() {
  try {
    const rows = await listRows(RANGES.user);
    const row = rows[0] ?? null;
    const dietReview = parseUserDietReview(row);
    return NextResponse.json({ dietReview });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch diet review" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    assertSameOrigin(req);
    const body = (await req.json()) as Partial<DietReviewBody>;
    const text = typeof body.text === "string" ? body.text.trim() : "";
    const generatedAt = typeof body.generatedAt === "string" ? body.generatedAt.trim() : "";
    const from = typeof body.from === "string" ? body.from.trim() : "";
    const to = typeof body.to === "string" ? body.to.trim() : "";

    if (!text || !generatedAt || !from || !to || !isDate(from) || !isDate(to)) {
      return NextResponse.json({ error: "Invalid diet review payload" }, { status: 400 });
    }

    const rows = await listRows(RANGES.user);
    const existingRow = rows[0] ?? null;
    const targets = parseUserTargets(existingRow) ?? defaultTargets;
    const profile = parseUserProfile(existingRow);
    const ai = parseUserAi(existingRow);
    const nextDietReview = { text, generatedAt, from, to };
    const rowValues = serializeUserRow(targets, profile, ai, nextDietReview);

    if (rows.length === 0) {
      await appendRow(RANGES.user, rowValues);
    } else {
      await updateRow(RANGES.user, 2, rowValues);
    }

    revalidateCacheTag(CACHE_TAGS.user);
    return NextResponse.json({ dietReview: nextDietReview });
  } catch (error) {
    console.error(error);
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Failed to save diet review" }, { status: 500 });
  }
}
