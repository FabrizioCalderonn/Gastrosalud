import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseDateKey, toDateKey, todayDateKey } from "@/lib/schedule";
import { sendAppointmentReminderEmail } from "@/lib/email";

function tomorrowDateKey(): string {
  const today = parseDateKey(todayDateKey());
  today.setUTCDate(today.getUTCDate() + 1);
  return toDateKey(today);
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const date = parseDateKey(tomorrowDateKey());
  const appointments = await prisma.appointment.findMany({
    where: { date, status: "confirmada", reminderSentAt: null },
  });

  let sent = 0;
  let failed = 0;
  for (const appointment of appointments) {
    if (!appointment.email) continue;
    const result = await sendAppointmentReminderEmail({
      patientName: appointment.patientName,
      email: appointment.email,
      dateKey: toDateKey(appointment.date),
      minutes: appointment.minutes,
      manageToken: appointment.manageToken,
    });
    if (result.sent) {
      sent++;
      await prisma.appointment.update({
        where: { id: appointment.id },
        data: { reminderSentAt: new Date() },
      });
    } else {
      failed++;
    }
  }

  return NextResponse.json({ sent, failed });
}
