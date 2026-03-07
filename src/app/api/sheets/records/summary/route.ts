import { NextRequest, NextResponse } from "next/server";
import { assertIsoDate, ValidationError } from "@/lib/apiValidation";
import { getCachedSummary } from "@/lib/sheetsCache";

export async function GET(req: NextRequest) {
  try {
    const fromParam = req.nextUrl.searchParams.get("from");
    const toParam = req.nextUrl.searchParams.get("to");

    if (!fromParam || !toParam) {
      return NextResponse.json(
        { error: "from and to query params are required" },
        { status: 400 }
      );
    }

    const from = assertIsoDate(fromParam);
    const to = assertIsoDate(toParam);

    if (from > to) {
      return NextResponse.json(
        { error: "from must be before or equal to to" },
        { status: 400 }
      );
    }

    const summary = await getCachedSummary(from, to);
    return NextResponse.json(summary);
  } catch (error) {
    console.error(error);
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Failed to fetch summary" }, { status: 500 });
  }
}
