"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDateFull } from "@/lib/format";
import { formatTime } from "@/lib/schedule";

type BlockedPeriod = {
  id: string;
  startDate: string;
  endDate: string;
  startMinutes: number | null;
  endMinutes: number | null;
  reason: string | null;
};

type Conflict = { id: string; dateKey: string; minutes: number; patientName: string; phone: string };

function minutesToTime(m: number): string {
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}
function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export function BlockedPeriodsManager({ initialPeriods }: { initialPeriods: BlockedPeriod[] }) {
  const router = useRouter();
  const [periods, setPeriods] = useState(initialPeriods);
  const [wholeDay, setWholeDay] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("12:00");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);

  async function createBlock(e: React.FormEvent) {
    e.preventDefault();
    if (!startDate) {
      setError("Elige al menos una fecha de inicio");
      return;
    }
    setSaving(true);
    setError(null);
    setConflicts([]);
    try {
      const res = await fetch("/api/admin/blocked-periods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate,
          endDate: endDate || startDate,
          startMinutes: wholeDay ? null : timeToMinutes(startTime),
          endMinutes: wholeDay ? null : timeToMinutes(endTime),
          reason: reason.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo crear el bloqueo");
        return;
      }
      setPeriods((p) => [
        {
          ...data.period,
          startDate: String(data.period.startDate).slice(0, 10),
          endDate: String(data.period.endDate).slice(0, 10),
        },
        ...p,
      ]);
      setConflicts(data.conflictingAppointments ?? []);
      setStartDate("");
      setEndDate("");
      setReason("");
      router.refresh();
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setSaving(false);
    }
  }

  async function deleteBlock(id: string) {
    setPeriods((p) => p.filter((x) => x.id !== id));
    await fetch(`/api/admin/blocked-periods/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <h2 className="mb-1 font-heading text-lg font-bold text-ink">Bloquear fechas u horas</h2>
      <p className="mb-5 text-sm text-muted">
        Bloquea un día completo, una semana o solo un rango de horas — por ejemplo vacaciones o una tarde
        que no podrás atender.
      </p>

      <form onSubmit={createBlock} className="mb-6 flex flex-col gap-3 rounded-xl bg-cream p-4">
        <div className="flex flex-wrap gap-3">
          <div>
            <label className="mb-1 block text-xs font-bold text-muted-2">Desde</label>
            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-lg border-2 border-border-strong px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-muted-2">Hasta (opcional)</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-lg border-2 border-border-strong px-3 py-2 text-sm"
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" checked={wholeDay} onChange={(e) => setWholeDay(e.target.checked)} />
          Bloquear el/los día(s) completo(s)
        </label>

        {!wholeDay && (
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="rounded-lg border-2 border-border-strong px-2 py-1.5 text-sm"
            />
            <span className="text-sm text-muted">a</span>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="rounded-lg border-2 border-border-strong px-2 py-1.5 text-sm"
            />
            <span className="text-xs text-faint">(aplica cada día del rango)</span>
          </div>
        )}

        <div>
          <label className="mb-1 block text-xs font-bold text-muted-2">Motivo (opcional, solo para ti)</label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ej. Vacaciones, congreso médico…"
            className="w-full rounded-lg border-2 border-border-strong px-3 py-2 text-sm"
          />
        </div>

        {error && (
          <div className="rounded-xl bg-danger-tint px-4 py-2.5 text-sm font-semibold text-danger">{error}</div>
        )}

        {conflicts.length > 0 && (
          <div className="rounded-xl bg-warning-tint px-4 py-3 text-sm text-warning">
            <div className="mb-1 font-bold">
              Hay {conflicts.length} cita(s) existente(s) en este rango — contáctalas para reprogramar:
            </div>
            <ul className="list-inside list-disc">
              {conflicts.map((c) => (
                <li key={c.id}>
                  {c.patientName} — {formatDateFull(c.dateKey)} {formatTime(c.minutes)} ({c.phone})
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="self-start rounded-full bg-teal px-6 py-2.5 font-heading text-sm font-bold text-white disabled:opacity-60"
        >
          {saving ? "Guardando…" : "Bloquear"}
        </button>
      </form>

      <div className="flex flex-col gap-2">
        {periods.length === 0 && <div className="text-sm text-muted">No hay bloqueos activos.</div>}
        {periods.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3"
          >
            <div className="text-sm text-ink">
              <div className="font-semibold">
                {formatDateFull(p.startDate)}
                {p.endDate !== p.startDate ? ` — ${formatDateFull(p.endDate)}` : ""}
              </div>
              <div className="text-xs text-muted">
                {p.startMinutes != null && p.endMinutes != null
                  ? `${formatTime(p.startMinutes)} a ${formatTime(p.endMinutes)}`
                  : "Todo el día"}
                {p.reason ? ` · ${p.reason}` : ""}
              </div>
            </div>
            <button onClick={() => deleteBlock(p.id)} className="text-xs font-bold text-danger">
              Quitar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
