"use client";

import { useState } from "react";
import type { WorkingRange } from "@/lib/scheduling";

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Monday ... Sunday
const DAY_LABELS: Record<number, string> = {
  0: "Domingo",
  1: "Lunes",
  2: "Martes",
  3: "Miércoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sábado",
};

function minutesToTime(m: number): string {
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export function WorkingHoursEditor({
  initialDays,
  initialSlotDuration,
  initialMinLeadMinutes,
}: {
  initialDays: Record<number, WorkingRange[]>;
  initialSlotDuration: number;
  initialMinLeadMinutes: number;
}) {
  const [days, setDays] = useState(initialDays);
  const [slotDuration, setSlotDuration] = useState(initialSlotDuration);
  const [minLeadMinutes, setMinLeadMinutes] = useState(initialMinLeadMinutes);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  function addRange(day: number) {
    setDays((d) => ({
      ...d,
      [day]: [...(d[day] ?? []), { startMinutes: 8 * 60, endMinutes: 12 * 60 }],
    }));
  }

  function removeRange(day: number, index: number) {
    setDays((d) => ({ ...d, [day]: d[day].filter((_, i) => i !== index) }));
  }

  function updateRange(day: number, index: number, key: "startMinutes" | "endMinutes", value: string) {
    setDays((d) => ({
      ...d,
      [day]: d[day].map((r, i) => (i === index ? { ...r, [key]: timeToMinutes(value) } : r)),
    }));
  }

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/settings/working-hours", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotDurationMinutes: slotDuration, minLeadMinutes, days }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setMessage({ type: "error", text: data?.error ?? "No se pudo guardar" });
        return;
      }
      setMessage({ type: "ok", text: "Horario guardado" });
    } catch {
      setMessage({ type: "error", text: "No se pudo conectar con el servidor" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <h2 className="mb-1 font-heading text-lg font-bold text-ink">Horario de trabajo</h2>
      <p className="mb-5 text-sm text-muted">
        Define los días y horas en que se pueden agendar citas. Un día sin horarios queda cerrado.
      </p>

      <div className="mb-5 flex flex-wrap gap-6">
        <div>
          <label className="mb-1 block text-xs font-bold text-muted-2">Duración de cada cita (minutos)</label>
          <input
            type="number"
            min={5}
            max={240}
            step={5}
            value={slotDuration}
            onChange={(e) => setSlotDuration(Number(e.target.value))}
            className="w-28 rounded-lg border-2 border-border-strong px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold text-muted-2">
            Anticipación mínima para agendar/reprogramar (minutos)
          </label>
          <input
            type="number"
            min={0}
            step={15}
            value={minLeadMinutes}
            onChange={(e) => setMinLeadMinutes(Number(e.target.value))}
            className="w-28 rounded-lg border-2 border-border-strong px-3 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-faint">
            Ej. 60 = ya no se puede agendar un horario con menos de 1 hora de anticipación.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {DAY_ORDER.map((day) => (
          <div key={day} className="border-t border-border pt-4 first:border-t-0 first:pt-0">
            <div className="mb-2 flex items-center justify-between">
              <div className="font-heading text-sm font-bold text-ink">{DAY_LABELS[day]}</div>
              <button
                type="button"
                onClick={() => addRange(day)}
                className="text-xs font-bold text-teal-dark underline"
              >
                + Agregar horario
              </button>
            </div>
            {(days[day] ?? []).length === 0 ? (
              <div className="text-sm text-faint">Cerrado</div>
            ) : (
              <div className="flex flex-col gap-2">
                {days[day].map((range, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="time"
                      value={minutesToTime(range.startMinutes)}
                      onChange={(e) => updateRange(day, i, "startMinutes", e.target.value)}
                      className="rounded-lg border-2 border-border-strong px-2 py-1.5 text-sm"
                    />
                    <span className="text-sm text-muted">a</span>
                    <input
                      type="time"
                      value={minutesToTime(range.endMinutes)}
                      onChange={(e) => updateRange(day, i, "endMinutes", e.target.value)}
                      className="rounded-lg border-2 border-border-strong px-2 py-1.5 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => removeRange(day, i)}
                      className="text-xs font-bold text-danger"
                    >
                      Quitar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {message && (
        <div
          className={`mt-4 rounded-xl px-4 py-2.5 text-sm font-semibold ${
            message.type === "ok" ? "bg-success-tint text-success" : "bg-danger-tint text-danger"
          }`}
        >
          {message.text}
        </div>
      )}

      <button
        onClick={save}
        disabled={saving}
        className="mt-5 rounded-full bg-teal px-6 py-3 font-heading text-sm font-bold text-white disabled:opacity-60"
      >
        {saving ? "Guardando…" : "Guardar horario"}
      </button>
    </div>
  );
}
