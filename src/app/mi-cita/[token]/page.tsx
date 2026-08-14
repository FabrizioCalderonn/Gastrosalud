import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isWithinCutoff, toDateKey } from "@/lib/schedule";
import { ManageAppointment } from "@/components/ManageAppointment";

export const metadata: Metadata = {
  title: "Mi cita — GastroSalud",
};

const CUTOFF_MS = 24 * 60 * 60 * 1000;

export default async function ManageAppointmentPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const appointment = await prisma.appointment.findUnique({ where: { manageToken: token } });
  if (!appointment) notFound();

  const dateKey = toDateKey(appointment.date);
  const withinCutoff = isWithinCutoff(dateKey, appointment.minutes, CUTOFF_MS);

  return (
    <main className="mx-auto max-w-[720px] px-6 pb-24 pt-12 md:pt-14">
      <h1 className="mb-8 font-heading text-[26px] font-extrabold text-ink md:text-[28px]">Mi cita</h1>
      <ManageAppointment
        token={token}
        patientName={appointment.patientName}
        dateKey={dateKey}
        minutes={appointment.minutes}
        status={appointment.status}
        withinCutoff={withinCutoff}
      />
    </main>
  );
}
