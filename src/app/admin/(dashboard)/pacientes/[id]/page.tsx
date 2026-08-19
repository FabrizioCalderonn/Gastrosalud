import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { toDateKey, formatTime } from "@/lib/schedule";
import { formatDateFull } from "@/lib/format";
import { buildGenericWhatsAppLink } from "@/lib/whatsapp";
import { getSession, hasRole } from "@/lib/auth";
import { PatientEditForm } from "@/components/admin/PatientEditForm";
import { PatientNotes } from "@/components/admin/PatientNotes";
import { LabResultsSection } from "@/components/admin/LabResultsSection";
import { ClinicalRecordSection } from "@/components/admin/ClinicalRecordSection";

export const dynamic = "force-dynamic";

const ATTENDANCE_LABELS: Record<string, string> = {
  pendiente: "Pendiente",
  visto: "Visto",
  cancelado: "Cancelado",
  reprogramado: "Reprogramado",
};

export default async function PatientProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  const isDoctora = hasRole(session, ["doctora"]);
  const canUploadLabResults = hasRole(session, ["laboratorista"]);

  const patient = await prisma.patient.findUnique({ where: { id } });
  if (!patient) notFound();

  const [appointments, notes, labResults, clinicalRecords] = await Promise.all([
    prisma.appointment.findMany({
      where: { patientId: id },
      orderBy: [{ date: "desc" }, { minutes: "desc" }],
    }),
    prisma.patientNote.findMany({ where: { patientId: id }, orderBy: { createdAt: "desc" } }),
    prisma.labResult.findMany({
      where: { patientId: id },
      orderBy: { createdAt: "desc" },
      select: { id: true, fileName: true, fileSize: true, label: true, uploadedBy: true, createdAt: true },
    }),
    isDoctora
      ? prisma.clinicalRecordEntry.findMany({ where: { patientId: id }, orderBy: { createdAt: "desc" } })
      : Promise.resolve(null),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-border bg-surface p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-extrabold text-ink">{patient.name}</h1>
            <div className="mt-1 text-sm text-muted">
              {patient.phone} · DUI: {patient.dui ?? "—"} {patient.email ? `· ${patient.email}` : ""}
            </div>
          </div>
          <a
            href={buildGenericWhatsAppLink({ phone: patient.phone, patientName: patient.name })}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border-2 border-success bg-success-tint px-4 py-2 text-sm font-bold text-success"
          >
            Escribir por WhatsApp
          </a>
        </div>
        <PatientEditForm
          patientId={patient.id}
          initial={{ name: patient.name, phone: patient.phone, dui: patient.dui ?? "", email: patient.email ?? "" }}
        />
      </div>

      <div className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="mb-4 font-heading text-lg font-bold text-ink">Citas</h2>
        {appointments.length === 0 ? (
          <p className="text-sm text-muted">Este paciente no tiene citas registradas.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-2">
                  <th className="py-2 pr-4 font-bold">Fecha</th>
                  <th className="py-2 pr-4 font-bold">Hora</th>
                  <th className="py-2 pr-4 font-bold">Visita</th>
                  <th className="py-2 pr-4 font-bold">Estado</th>
                  <th className="py-2 pr-4 font-bold">Asistencia</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((a) => (
                  <tr key={a.id} className="border-b border-border last:border-0">
                    <td className="py-2 pr-4 text-ink">{formatDateFull(toDateKey(a.date))}</td>
                    <td className="py-2 pr-4 text-ink">{formatTime(a.minutes)}</td>
                    <td className="py-2 pr-4 text-muted">
                      {a.visitType === "primera" ? "Primera vez" : "Seguimiento"}
                    </td>
                    <td className="py-2 pr-4 text-muted">{a.status}</td>
                    <td className="py-2 pr-4 text-muted">{ATTENDANCE_LABELS[a.attendanceStatus] ?? a.attendanceStatus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <PatientNotes patientId={patient.id} initialNotes={notes} />

      <LabResultsSection patientId={patient.id} initialResults={labResults} canUpload={canUploadLabResults} />

      {isDoctora && (
        <ClinicalRecordSection patientId={patient.id} initialEntries={clinicalRecords ?? []} />
      )}
    </div>
  );
}
