import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { parseDateKey, todayDateKey, toDateKey, formatTime } from "@/lib/schedule";
import { APPOINTMENT_STATUSES, type AppointmentStatus, type AttendanceStatus } from "@/lib/validation";
import { StatusSelect } from "@/components/admin/StatusSelect";
import { AttendanceStatusSelect } from "@/components/admin/AttendanceStatusSelect";
import { DayNav } from "@/components/admin/DayNav";
import { AutoRefresh } from "@/components/admin/AutoRefresh";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { getSession, hasRole } from "@/lib/auth";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  pendiente: "Pendiente",
  confirmada: "Confirmada",
  cancelada: "Cancelada",
  completada: "Completada",
};

type SearchParams = {
  date?: string;
  status?: string;
  q?: string;
};

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { date, status, q } = await searchParams;
  const todayKey = todayDateKey();
  const viewDateKey = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : todayKey;

  const session = await getSession();
  const canCreateAppointments = hasRole(session, ["doctora", "recepcion"]);

  const where: Prisma.AppointmentWhereInput = { date: parseDateKey(viewDateKey) };
  if (status && (APPOINTMENT_STATUSES as readonly string[]).includes(status)) where.status = status;
  if (q) {
    where.OR = [
      { patientName: { contains: q } },
      { phone: { contains: q } },
      { email: { contains: q } },
    ];
  }

  const [appointments, todayCount, pendingCount, confirmedTodayCount] = await Promise.all([
    prisma.appointment.findMany({
      where,
      orderBy: [{ minutes: "asc" }],
      take: 200,
    }),
    prisma.appointment.count({ where: { date: parseDateKey(todayKey), status: { not: "cancelada" } } }),
    prisma.appointment.count({ where: { status: "pendiente" } }),
    prisma.appointment.count({ where: { date: parseDateKey(todayKey), status: "confirmada" } }),
  ]);

  return (
    <div>
      <AutoRefresh />
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <StatCard label="Citas hoy" value={todayCount} />
        <StatCard label="Confirmadas hoy" value={confirmedTodayCount} />
        <StatCard label="Pendientes de confirmar" value={pendingCount} />
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <DayNav dateKey={viewDateKey} />
        {canCreateAppointments && (
          <Link
            href="/admin/citas/nueva"
            className="rounded-full bg-teal px-5 py-2.5 font-heading text-sm font-bold text-white"
          >
            + Nueva cita
          </Link>
        )}
      </div>

      <form className="mb-6 flex flex-wrap items-end gap-4 rounded-2xl border border-border bg-surface p-5">
        <input type="hidden" name="date" value={viewDateKey} />
        <div>
          <label className="mb-1 block text-xs font-bold text-muted-2">Estado</label>
          <select
            name="status"
            defaultValue={status ?? ""}
            className="rounded-lg border-2 border-border-strong px-3 py-2 text-sm"
          >
            <option value="">Todos</option>
            {APPOINTMENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[180px]">
          <label className="mb-1 block text-xs font-bold text-muted-2">Buscar</label>
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Nombre, teléfono o correo"
            className="w-full rounded-lg border-2 border-border-strong px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          className="rounded-full bg-teal px-5 py-2 font-heading text-sm font-bold text-white"
        >
          Filtrar
        </button>
        {(status || q) && (
          <Link href={`/admin?date=${viewDateKey}`} className="text-sm font-bold text-muted underline">
            Limpiar filtros
          </Link>
        )}
      </form>

      <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-2">
              <th className="px-5 py-3 font-bold">Hora / Paciente</th>
              <th className="px-5 py-3 font-bold">Contacto</th>
              <th className="px-5 py-3 font-bold">Visita</th>
              <th className="px-5 py-3 font-bold">Estado</th>
              <th className="px-5 py-3 font-bold">Asistencia</th>
              <th className="px-5 py-3 font-bold">WhatsApp</th>
            </tr>
          </thead>
          <tbody>
            {appointments.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-muted">
                  No hay citas con estos filtros.
                </td>
              </tr>
            )}
            {appointments.map((a) => (
              <tr key={a.id} className="border-b border-border last:border-0">
                <td className="px-5 py-4">
                  <Link href={`/admin/pacientes/${a.patientId}`} className="block hover:underline">
                    <div className="font-heading font-bold text-ink">{formatTime(a.minutes)}</div>
                    <div className="text-ink">{a.patientName}</div>
                  </Link>
                </td>
                <td className="px-5 py-4 text-muted">
                  <div>{a.phone}</div>
                  {a.email && <div className="text-xs text-faint">{a.email}</div>}
                </td>
                <td className="px-5 py-4 text-muted">
                  {a.visitType === "primera" ? "Primera vez" : "Seguimiento"}
                </td>
                <td className="px-5 py-4">
                  <StatusSelect id={a.id} status={a.status as AppointmentStatus} />
                </td>
                <td className="px-5 py-4">
                  <AttendanceStatusSelect id={a.id} attendanceStatus={a.attendanceStatus as AttendanceStatus} />
                </td>
                <td className="px-5 py-4">
                  <a
                    href={buildWhatsAppLink({
                      phone: a.phone,
                      patientName: a.patientName,
                      dateKey: toDateKey(a.date),
                      minutes: a.minutes,
                      status: a.status as AppointmentStatus,
                    })}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border-2 border-success bg-success-tint px-3 py-1.5 text-xs font-bold text-success"
                  >
                    Enviar
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="text-xs font-bold uppercase tracking-wide text-muted-2">{label}</div>
      <div className="mt-2 font-heading text-3xl font-extrabold text-ink">{value}</div>
    </div>
  );
}
