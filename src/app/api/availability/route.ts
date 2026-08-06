import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatTime, parseDateKey, slotsForDayOfWeek } from "@/lib/schedule";

export async function GET(req: NextRequest) {
  const dateKey = req.nextUrl.searchParams.get("date");
  if (!dateKey || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    return NextResponse.json({ error: "Parámetro 'date' inválido" }, { status: 400 });
  }

  let date: Date;
  try {
    date = parseDateKey(dateKey);
  } catch {
    return NextResponse.json({ error: "Parámetro 'date' inválido" }, { status: 400 });
  }

  const dayOfWeek = date.getUTCDay();
  const slotMinutes = slotsForDayOfWeek(dayOfWeek);

  const booked = await prisma.appointment.findMany({
    where: { date, status: { not: "cancelada" } },
    select: { minutes: true },
  });
  const bookedSet = new Set(booked.map((b) => b.minutes));

  const slots = slotMinutes.map((minutes) => ({
    minutes,
    label: formatTime(minutes),
    booked: bookedSet.has(minutes),
  }));

  return NextResponse.json({ date: dateKey, slots });
}
