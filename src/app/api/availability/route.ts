import { NextRequest, NextResponse } from "next/server";
import { computeAvailability } from "@/lib/scheduling";

export async function GET(req: NextRequest) {
  const dateKey = req.nextUrl.searchParams.get("date");
  if (!dateKey || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    return NextResponse.json({ error: "Parámetro 'date' inválido" }, { status: 400 });
  }

  try {
    const slots = await computeAvailability(dateKey);
    return NextResponse.json({ date: dateKey, slots });
  } catch {
    return NextResponse.json({ error: "Parámetro 'date' inválido" }, { status: 400 });
  }
}
