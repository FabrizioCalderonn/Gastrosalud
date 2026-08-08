import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseDateKey, toDateKey } from "@/lib/schedule";
import { createBlockedPeriodSchema } from "@/lib/validation";

export async function GET() {
  const periods = await prisma.blockedPeriod.findMany({ orderBy: { startDate: "desc" } });
  return NextResponse.json({ periods });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = createBlockedPeriodSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { startDate, endDate, startMinutes, endMinutes, reason } = parsed.data;
  const start = parseDateKey(startDate);
  const end = parseDateKey(endDate);

  const period = await prisma.blockedPeriod.create({
    data: { startDate: start, endDate: end, startMinutes, endMinutes, reason: reason || null },
  });

  // Warn the admin about existing non-cancelled appointments that now fall inside
  // the blocked window, so they can be manually contacted/rescheduled.
  const overlapping = await prisma.appointment.findMany({
    where: {
      date: { gte: start, lte: end },
      status: { not: "cancelada" },
      ...(startMinutes != null && endMinutes != null
        ? { minutes: { gte: startMinutes, lt: endMinutes } }
        : {}),
    },
    orderBy: [{ date: "asc" }, { minutes: "asc" }],
  });

  return NextResponse.json({
    period,
    conflictingAppointments: overlapping.map((a) => ({
      id: a.id,
      dateKey: toDateKey(a.date),
      minutes: a.minutes,
      patientName: a.patientName,
      phone: a.phone,
    })),
  });
}
