import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession, hasRole } from "@/lib/auth";
import { parseDateKey, todayDateKey } from "@/lib/schedule";
import { getBusyRangesForDate, isRangeAvailable } from "@/lib/scheduling";
import { createAdminAppointmentSchema } from "@/lib/validation";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const date = req.nextUrl.searchParams.get("date");
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Fecha inválida" }, { status: 400 });
  }
  const busy = await getBusyRangesForDate(date);
  return NextResponse.json({ busy });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!hasRole(session, ["doctora", "recepcion"])) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createAdminAppointmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", issues: parsed.error.flatten() }, { status: 400 });
  }

  const { dateKey, minutes, durationMinutes, patientId, name, phone, dui, email } = parsed.data;

  let date: Date;
  try {
    date = parseDateKey(dateKey);
  } catch {
    return NextResponse.json({ error: "Fecha inválida" }, { status: 400 });
  }
  if (dateKey < todayDateKey()) {
    return NextResponse.json({ error: "No se puede agendar en una fecha pasada" }, { status: 400 });
  }
  const availability = await isRangeAvailable(dateKey, minutes, durationMinutes);
  if (!availability.available) {
    return NextResponse.json({ error: availability.reason ?? "Ese horario no está disponible" }, { status: 400 });
  }

  // Find-or-create the patient: prefer an explicit selection from the autocomplete,
  // then fall back to matching by DUI (unique — reliable), then by an exact
  // phone+name match. Phone ALONE is never enough to match — it's common for
  // several different people (spouses, parent/child) to share one phone number,
  // and matching on phone alone would silently merge them into one patient record.
  let patient = patientId ? await prisma.patient.findUnique({ where: { id: patientId } }) : null;
  if (!patient && dui) {
    patient = await prisma.patient.findUnique({ where: { dui } });
  }
  if (!patient) {
    patient = await prisma.patient.findFirst({
      where: { phone, name: { equals: name, mode: "insensitive" } },
      orderBy: { updatedAt: "desc" },
    });
  }
  if (!patient) {
    patient = await prisma.patient.create({
      data: { name, phone, dui, email: email || null },
    });
  }

  const priorVisits = await prisma.appointment.count({
    where: { patientId: patient.id, status: { not: "cancelada" } },
  });
  const visitType = priorVisits > 0 ? "seguimiento" : "primera";

  try {
    const appointment = await prisma.appointment.create({
      data: {
        date,
        minutes,
        durationMinutes,
        patientId: patient.id,
        patientName: name,
        phone,
        dui,
        email: email || null,
        visitType,
        status: "pendiente",
        attendanceStatus: "pendiente",
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
