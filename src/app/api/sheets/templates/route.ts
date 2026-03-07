import { NextRequest, NextResponse } from "next/server";
import {
  appendRow,
  deleteRowByIndex,
  listRows,
  RANGES,
  updateRow,
} from "@/lib/sheets";
import { TemplateItem } from "@/lib/types";
import {
  assertFoodName,
  parseNonNegativeNumber,
  ValidationError,
} from "@/lib/apiValidation";
import { assertSameOrigin, AuthorizationError } from "@/lib/apiGuard";
import { CACHE_TAGS, getCachedTemplates, revalidateCacheTag } from "@/lib/sheetsCache";

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export async function GET() {
  try {
    const templates = await getCachedTemplates();
    return NextResponse.json(templates);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
    const body = (await req.json()) as Partial<TemplateItem>;

    const template: TemplateItem = {
      id: body.id ?? createId(),
      food_name: assertFoodName(body.food_name),
      base_amount: parseNonNegativeNumber(body.base_amount ?? 100, "base_amount", {
        min: 1,
        max: 10000,
      }),
      calories: parseNonNegativeNumber(body.calories ?? 0, "calories", { max: 20000 }),
      carbs: parseNonNegativeNumber(body.carbs ?? 0, "carbs", { max: 5000 }),
      protein: parseNonNegativeNumber(body.protein ?? 0, "protein", { max: 5000 }),
      fat: parseNonNegativeNumber(body.fat ?? 0, "fat", { max: 5000 }),
      sugar: parseNonNegativeNumber(body.sugar ?? 0, "sugar", { max: 5000 }),
      sodium: parseNonNegativeNumber(body.sodium ?? 0, "sodium", { max: 100000 }),
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

    revalidateCacheTag(CACHE_TAGS.templates);
    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error(error);
    if (error instanceof ValidationError || error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Failed to create template" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    assertSameOrigin(req);
    const id = (req.nextUrl.searchParams.get("id") ?? "").trim();
    if (!id) {
      return NextResponse.json({ error: "Template id is required" }, { status: 400 });
    }

    const rows = await listRows(RANGES.templates);
    const rowOffset = rows.findIndex((row) => (row[0] ?? "").trim() === id);
    if (rowOffset < 0) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    const rowIndex = rowOffset + 2;
    await deleteRowByIndex("templates", rowIndex);
    revalidateCacheTag(CACHE_TAGS.templates);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Failed to delete template" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    assertSameOrigin(req);
    const body = (await req.json()) as Partial<TemplateItem>;
    const id = (body.id ?? "").trim();
    if (!id) {
      return NextResponse.json({ error: "Template id is required" }, { status: 400 });
    }

    const rows = await listRows(RANGES.templates);
    const rowOffset = rows.findIndex((row) => (row[0] ?? "").trim() === id);
    if (rowOffset < 0) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    const template: TemplateItem = {
      id,
      food_name: assertFoodName(body.food_name),
      base_amount: parseNonNegativeNumber(body.base_amount ?? 100, "base_amount", {
        min: 1,
        max: 10000,
      }),
      calories: parseNonNegativeNumber(body.calories ?? 0, "calories", { max: 20000 }),
      carbs: parseNonNegativeNumber(body.carbs ?? 0, "carbs", { max: 5000 }),
      protein: parseNonNegativeNumber(body.protein ?? 0, "protein", { max: 5000 }),
      fat: parseNonNegativeNumber(body.fat ?? 0, "fat", { max: 5000 }),
      sugar: parseNonNegativeNumber(body.sugar ?? 0, "sugar", { max: 5000 }),
      sodium: parseNonNegativeNumber(body.sodium ?? 0, "sodium", { max: 100000 }),
    };

    await updateRow(RANGES.templates, rowOffset + 2, [
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

    revalidateCacheTag(CACHE_TAGS.templates);
    return NextResponse.json(template);
  } catch (error) {
    console.error(error);
    if (error instanceof ValidationError || error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Failed to update template" }, { status: 500 });
  }
}
