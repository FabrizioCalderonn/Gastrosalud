import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateAppointmentStatusSchema } from "@/lib/validation";
import { sendAppointmentStatusEmail } from "@/lib/email";
import { toDateKey } from "@/lib/schedule";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = updateAppointmentStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
  }

  const previous = await prisma.appointment.findUnique({ where: { id } });
  if (!previous) {
    return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 });
  }

  const nextStatus = parsed.data.status;
  const appointment = await prisma.appointment.update({
    where: { id },
    data: { status: nextStatus },
  });

  let email: { sent: boolean; error?: string } | undefined;
  const shouldNotify =
    nextStatus !== previous.status && (nextStatus === "confirmada" || nextStatus === "cancelada");
  if (shouldNotify) {
    email = await sendAppointmentStatusEmail(
      {
        patientName: appointment.patientName,
        email: appointment.email,
        dateKey: toDateKey(appointment.date),
        minutes: appointment.minutes,
        manageToken: appointment.manageToken,
      },
      nextStatus,
    );
  }

  return NextResponse.json({ appointment, email });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.appointment.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
