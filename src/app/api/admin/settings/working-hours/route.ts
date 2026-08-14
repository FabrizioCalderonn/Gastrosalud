import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMinLeadMinutes, getSlotDurationMinutes, getWorkingRangesByDay } from "@/lib/scheduling";
import { updateWorkingHoursSchema } from "@/lib/validation";

export async function GET() {
  const [slotDurationMinutes, minLeadMinutes, days] = await Promise.all([
    getSlotDurationMinutes(),
    getMinLeadMinutes(),
    getWorkingRangesByDay(),
  ]);
  return NextResponse.json({ slotDurationMinutes, minLeadMinutes, days });
}

export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = updateWorkingHoursSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { slotDurationMinutes, minLeadMinutes, days } = parsed.data;
  const rows = Object.entries(days).flatMap(([dayOfWeek, ranges]) =>
    ranges.map((r) => ({ dayOfWeek: Number(dayOfWeek), startMinutes: r.startMinutes, endMinutes: r.endMinutes })),
  );

  for (const dayOfWeek of Object.keys(days)) {
    const n = Number(dayOfWeek);
    if (!Number.isInteger(n) || n < 0 || n > 6) {
      return NextResponse.json({ error: `Día inválido: ${dayOfWeek}` }, { status: 400 });
    }
  }

  await prisma.$transaction([
    prisma.scheduleSettings.upsert({
      where: { id: 1 },
      update: { slotDurationMinutes, minLeadMinutes },
      create: { id: 1, slotDurationMinutes, minLeadMinutes },
    }),
    prisma.workingHoursRange.deleteMany({}),
    ...(rows.length ? [prisma.workingHoursRange.createMany({ data: rows })] : []),
  ]);

  return NextResponse.json({ ok: true });
}
