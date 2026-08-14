import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isWithinCutoff, parseDateKey, toDateKey } from "@/lib/schedule";
import { isSlotWithinScheduleAndUnblocked } from "@/lib/scheduling";
import { manageAppointmentSchema } from "@/lib/validation";
import { sendPatientCancelEmail } from "@/lib/email";

const RESCHEDULE_CUTOFF_MS = 24 * 60 * 60 * 1000;

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const appointment = await prisma.appointment.findUnique({ where: { manageToken: token } });
  if (!appointment) {
    return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 });
  }

  const withinCutoff = isWithinCutoff(toDateKey(appointment.date), appointment.minutes, RESCHEDULE_CUTOFF_MS);

  return NextResponse.json({
    appointment: {
      patientName: appointment.patientName,
      dateKey: toDateKey(appointment.date),
      minutes: appointment.minutes,
      status: appointment.status,
      visitType: appointment.visitType,
    },
    withinCutoff,
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const body = await req.json().catch(() => null);
  const parsed = manageAppointmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const appointment = await prisma.appointment.findUnique({ where: { manageToken: token } });
  if (!appointment) {
    return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 });
  }
  if (appointment.status === "cancelada") {
    return NextResponse.json({ error: "Esta cita ya fue cancelada" }, { status: 400 });
  }

  if (isWithinCutoff(toDateKey(appointment.date), appointment.minutes, RESCHEDULE_CUTOFF_MS)) {
    return NextResponse.json(
      { error: "Faltan menos de 24 horas para tu cita — contáctanos directamente para hacer cambios." },
      { status: 400 },
    );
  }

  if (parsed.data.action === "cancel") {
    const updated = await prisma.appointment.update({
      where: { id: appointment.id },
      data: { status: "cancelada" },
    });
    const email = await sendPatientCancelEmail({
      patientName: updated.patientName,
      email: updated.email,
      dateKey: toDateKey(updated.date),
      minutes: updated.minutes,
      manageToken: updated.manageToken,
    });
    return NextResponse.json({ appointment: updated, email });
  }

  const { dateKey, minutes } = parsed.data;
  let date: Date;
  try {
    date = parseDateKey(dateKey);
  } catch {
    return NextResponse.json({ error: "Fecha inválida" }, { status: 400 });
  }

  const available = await isSlotWithinScheduleAndUnblocked(dateKey, minutes);
  if (!available) {
    return NextResponse.json({ error: "Ese horario no está disponible" }, { status: 400 });
  }

  try {
    const updated = await prisma.appointment.update({
      where: { id: appointment.id },
      data: { date, minutes, status: "pendiente" },
    });
    return NextResponse.json({ appointment: updated });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ error: "Ese horario acaba de ser reservado, elige otro" }, { status: 409 });
    }
    throw err;
  }
}
