"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { formatDateFull, formatDateShort } from "@/lib/format";

type Slot = { minutes: number; label: string; booked: boolean };
type PatientMatch = { id: string; name: string; phone: string; dui: string | null; email: string | null };

const DATE_COUNT = 14;

export function NewAppointmentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedDate = searchParams.get("date") ?? undefined;

  const [form, setForm] = useState({ name: "", phone: "", dui: "", email: "" });
  const [patientId, setPatientId] = useState<string | null>(null);
  const [matches, setMatches] = useState<PatientMatch[]>([]);
  const [showMatches, setShowMatches] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [dateKeys, setDateKeys] = useState<string[]>([]);
  const [loadingDates, setLoadingDates] = useState(true);
  const [dateIdx, setDateIdx] = useState(0);
  const [minutes, setMinutes] = useState<number | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedDateKey = dateKeys[dateIdx];

  useEffect(() => {
    fetch(`/api/booking-days?count=${DATE_COUNT}`)
      .then((res) => res.json())
      .then((data) => {
        const keys: string[] = data.dates ?? [];
        setDateKeys(keys);
        if (preselectedDate) {
          const idx = keys.indexOf(preselectedDate);
          if (idx >= 0) setDateIdx(idx);
        }
      })
      .finally(() => setLoadingDates(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedDateKey) return;
    let cancelled = false;
    setLoadingSlots(true);
    setMinutes(null);
    fetch(`/api/availability?date=${selectedDateKey}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setSlots(data.slots ?? []);
      })
      .finally(() => {
        if (!cancelled) setLoadingSlots(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedDateKey]);

  function updateField(field: "name" | "phone" | "dui" | "email", value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setPatientId(null);
    if (field !== "phone" && field !== "dui") return;
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (value.trim().length < 3) {
      setMatches([]);
      return;
    }
    searchTimer.current = setTimeout(async () => {
      const res = await fetch(`/api/admin/patients/search?q=${encodeURIComponent(value.trim())}`);
      const data = await res.json().catch(() => null);
      setMatches(data?.patients ?? []);
      setShowMatches(true);
    }, 300);
  }

  function selectMatch(p: PatientMatch) {
    setForm({ name: p.name, phone: p.phone, dui: p.dui ?? "", email: p.email ?? "" });
    setPatientId(p.id);
    setMatches([]);
    setShowMatches(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (minutes == null || !selectedDateKey) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dateKey: selectedDateKey,
          minutes,
          patientId: patientId ?? undefined,
          name: form.name,
          phone: form.phone,
          dui: form.dui,
          email: form.email || undefined,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "No se pudo crear la cita");
        return;
      }
      router.push(`/admin?date=${selectedDateKey}`);
    } catch {
      setError("No se pudo conectar con el servidor. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      <div className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="mb-4 font-heading text-base font-bold text-ink">Datos del paciente</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="relative sm:col-span-2">
            <label className="mb-1.5 block text-sm font-bold text-ink">Nombre completo</label>
            <input
              required
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              className="w-full rounded-xl border-2 border-border-strong px-4 py-3 text-[15px]"
            />
          </div>
          <div className="relative">
            <label className="mb-1.5 block text-sm font-bold text-ink">Teléfono</label>
            <input
              required
              value={form.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              onFocus={() => setShowMatches(matches.length > 0)}
              placeholder="Ej. 7000 0000"
              className="w-full rounded-xl border-2 border-border-strong px-4 py-3 text-[15px]"
            />
          </div>
          <div className="relative">
            <label className="mb-1.5 block text-sm font-bold text-ink">DUI</label>
            <input
              required
              value={form.dui}
              onChange={(e) => updateField("dui", e.target.value)}
              onFocus={() => setShowMatches(matches.length > 0)}
              placeholder="00000000-0"
              className="w-full rounded-xl border-2 border-border-strong px-4 py-3 text-[15px]"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-bold text-ink">Correo (opcional)</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              className="w-full rounded-xl border-2 border-border-strong px-4 py-3 text-[15px]"
            />
          </div>
        </div>

        {showMatches && matches.length > 0 && (
          <div className="mt-3 rounded-xl border-2 border-teal bg-teal-tint p-3">
            <div className="mb-2 text-xs font-bold text-teal-dark">Pacientes existentes que coinciden:</div>
            <div className="flex flex-col gap-1">
              {matches.map((p) => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => selectMatch(p)}
                  className="rounded-lg bg-surface px-3 py-2 text-left text-sm hover:bg-cream"
                >
                  <span className="font-bold text-ink">{p.name}</span>{" "}
                  <span className="text-muted">
                    · {p.phone} {p.dui ? `· ${p.dui}` : ""}
                  </span>
                </button>
              ))}
              <button
                type="button"
                onClick={() => setShowMatches(false)}
                className="mt-1 self-start text-xs font-bold text-muted underline"
              >
                Ninguno de estos, es un paciente nuevo
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="mb-4 font-heading text-base font-bold text-ink">Fecha y hora</h2>
        {loadingDates ? (
          <div className="py-4 text-sm text-muted">Cargando fechas disponibles…</div>
        ) : (
          <div className="mb-5 flex gap-2.5 overflow-x-auto pb-2">
            {dateKeys.map((key, i) => {
              const lbl = formatDateShort(key);
              const selected = dateIdx === i;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setDateIdx(i)}
                  className={`flex shrink-0 flex-col items-center gap-0.5 rounded-2xl border-2 px-2 py-3 font-heading ${
                    selected ? "border-teal bg-teal text-white" : "border-border-strong bg-cream text-ink"
                  }`}
                  style={{ minWidth: 64 }}
                >
                  <span className="text-[11px] font-semibold uppercase">{lbl.weekday}</span>
                  <span className="text-lg font-extrabold">{lbl.day}</span>
                  <span className="text-[10px]">{lbl.month}</span>
                </button>
              );
            })}
          </div>
        )}

        {selectedDateKey && (
          <>
            <div className="mb-3 text-sm font-bold text-ink">
              Horarios disponibles — {formatDateFull(selectedDateKey)}
            </div>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-2.5">
              {loadingSlots ? (
                <div className="col-span-full py-4 text-sm text-muted">Cargando horarios…</div>
              ) : slots.length === 0 ? (
                <div className="col-span-full py-4 text-sm text-muted">No hay horarios disponibles este día.</div>
              ) : (
                slots.map((s) => {
                  const selected = minutes === s.minutes;
                  return (
                    <button
                      key={s.minutes}
                      type="button"
                      disabled={s.booked}
                      onClick={() => setMinutes(s.minutes)}
                      className={`rounded-xl border-2 px-2 py-3 font-heading text-sm font-bold ${
                        s.booked
                          ? "cursor-not-allowed border-[#F2EFE8] bg-[#F2EFE8] text-faint opacity-60"
                          : selected
                            ? "border-teal bg-teal text-white"
                            : "border-border-strong bg-cream text-ink"
                      }`}
                    >
                      {s.label}
                    </button>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>

      {error && (
        <div className="rounded-xl bg-danger-tint px-4 py-3 text-sm font-semibold text-danger">{error}</div>
      )}

      <button
        type="submit"
        disabled={submitting || minutes == null}
        className="rounded-full bg-teal py-4 font-heading text-base font-bold text-white disabled:opacity-50"
      >
        {submitting ? "Agendando…" : "Crear cita"}
      </button>
    </form>
  );
}
