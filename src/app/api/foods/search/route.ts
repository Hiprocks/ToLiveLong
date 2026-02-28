import { NextRequest, NextResponse } from "next/server";
import { searchFoodsIndex } from "@/lib/foodsIndex";

const parseLimit = (raw: string | null): number => {
  if (!raw) return 20;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 1) return 20;
  return Math.min(50, Math.floor(parsed));
};

export async function GET(req: NextRequest) {
  try {
    const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
    const limit = parseLimit(req.nextUrl.searchParams.get("limit"));

    if (!q) {
      return NextResponse.json({ error: "q is required" }, { status: 400 });
    }

    const items = searchFoodsIndex(q, limit);
    return NextResponse.json({ items });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to search foods" }, { status: 500 });
  }
}
