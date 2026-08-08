import { NextRequest, NextResponse } from "next/server";
import { getBookableDateKeys } from "@/lib/scheduling";

export async function GET(req: NextRequest) {
  const countParam = req.nextUrl.searchParams.get("count");
  const count = Math.min(Math.max(Number(countParam) || 12, 1), 60);
  const dates = await getBookableDateKeys(count);
  return NextResponse.json({ dates });
}
