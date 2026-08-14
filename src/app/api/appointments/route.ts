import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parseDateKey, todayDateKey } from "@/lib/schedule";
import { isSlotWithinScheduleAndUnblocked } from "@/lib/scheduling";
import { createAppointmentSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = createAppointmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { dateKey, minutes, name, phone, email, visitType } = parsed.data;

  let date: Date;
  try {
    date = parseDateKey(dateKey);
  } catch {
    return NextResponse.json({ error: "Fecha inválida" }, { status: 400 });
  }

  // Reject past days and slots outside business hours / blocked by the admin.
  if (dateKey < todayDateKey()) {
    return NextResponse.json({ error: "No se puede agendar en una fecha pasada" }, { status: 400 });
  }

  const available = await isSlotWithinScheduleAndUnblocked(dateKey, minutes);
  if (!available) {
    return NextResponse.json({ error: "Ese horario no está disponible" }, { status: 400 });
  }

  try {
    const appointment = await prisma.appointment.create({
      data: {
        date,
        minutes,
        patientName: name,
        phone,
        email,
        visitType,
        status: "pendiente",
        manageToken: crypto.randomUUID(),
      },
    });
    return NextResponse.json({ appointment }, { status: 201 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ error: "Ese horario acaba de ser reservado, elige otro" }, { status: 409 });
    }
    throw err;
  }
}
