"use client";

import { useEffect, useState } from "react";
import { formatDateFull, formatDateShort } from "@/lib/format";

type Slot = { minutes: number; label: string; booked: boolean };
type Step = "select" | "form" | "done";

const DATE_COUNT = 12;

export function BookingFlow() {
  const [dateKeys, setDateKeys] = useState<string[]>([]);
  const [loadingDates, setLoadingDates] = useState(true);
  const [dateIdx, setDateIdx] = useState(0);
  const [minutes, setMinutes] = useState<number | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [step, setStep] = useState<Step>("select");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    visitType: "primera" as "primera" | "seguimiento",
  });

  const selectedDateKey = dateKeys[dateIdx];

  useEffect(() => {
    fetch(`/api/booking-days?count=${DATE_COUNT}`)
      .then((res) => res.json())
      .then((data) => setDateKeys(data.dates ?? []))
      .finally(() => setLoadingDates(false));
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

  async function submitForm(e: React.FormEvent) {
    e.preventDefault();
    if (minutes == null) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dateKey: selectedDateKey,
          minutes,
          name: form.name,
          phone: form.phone,
          email: form.email,
          visitType: form.visitType,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error ?? "No se pudo agendar la cita, intenta de nuevo.");
        if (res.status === 409) {
          // Slot was taken in the meantime — refresh availability.
          const avail = await fetch(`/api/availability?date=${selectedDateKey}`).then((r) => r.json());
          setSlots(avail.slots ?? []);
          setMinutes(null);
          setStep("select");
        }
        return;
      }
      setStep("done");
    } catch {
      setSubmitError("No se pudo conectar con el servidor. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  function resetBooking() {
    setStep("select");
    setDateIdx(0);
    setMinutes(null);
    setForm({ name: "", phone: "", email: "", visitType: "primera" });
    setSubmitError(null);
  }

  const selectedTimeLabel = slots.find((s) => s.minutes === minutes)?.label ?? "";
  const stepLabel =
    step === "select"
      ? "Paso 1 de 3 · Fecha y hora"
      : step === "form"
        ? "Paso 2 de 3 · Tus datos"
        : "Paso 3 de 3 · Confirmación";

  return (
    <main className="mx-auto max-w-[720px] px-6 pb-24 pt-12 md:pt-14">
      <div className="mb-2 text-[13px] font-bold uppercase tracking-wide text-teal">{stepLabel}</div>
      <h1 className="mb-8 font-heading text-[26px] font-extrabold text-ink md:text-[28px]">
        Agenda tu cita
      </h1>

      {step === "select" && (
        <div>
          <div className="mb-3 text-[15px] font-bold text-ink">Elige una fecha</div>
          {loadingDates ? (
            <div className="mb-7 py-4 text-sm text-muted">Cargando fechas disponibles…</div>
          ) : dateKeys.length === 0 ? (
            <div className="mb-7 py-4 text-sm text-muted">
              No hay fechas disponibles por ahora. Contáctanos directamente para agendar.
            </div>
          ) : (
            <div className="mb-7 flex gap-2.5 overflow-x-auto pb-2">
              {dateKeys.map((key, i) => {
                const lbl = formatDateShort(key);
                const selected = dateIdx === i;
                return (
                  <button
                    key={key}
                    onClick={() => setDateIdx(i)}
                    className={`flex shrink-0 flex-col items-center gap-0.5 rounded-2xl border-2 px-2 py-3 font-heading ${
                      selected ? "border-teal bg-teal text-white" : "border-border-strong bg-surface text-ink"
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
              <div className="mb-3 text-[15px] font-bold text-ink">
                Horarios disponibles — {formatDateFull(selectedDateKey)}
              </div>
              <div className="mb-8 grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-2.5">
                {loadingSlots ? (
                  <div className="col-span-full py-4 text-sm text-muted">Cargando horarios…</div>
                ) : slots.length === 0 ? (
                  <div className="col-span-full py-4 text-sm text-muted">
                    No hay horarios disponibles este día.
                  </div>
                ) : (
                  slots.map((s) => {
                    const selected = minutes === s.minutes;
                    return (
                      <button
                        key={s.minutes}
                        disabled={s.booked}
                        onClick={() => setMinutes(s.minutes)}
                        className={`rounded-xl border-2 px-2 py-3 font-heading text-sm font-bold ${
                          s.booked
                            ? "cursor-not-allowed border-[#F2EFE8] bg-[#F2EFE8] text-faint opacity-60"
                            : selected
                              ? "border-teal bg-teal text-white"
                              : "border-border-strong bg-surface text-ink"
                        }`}
                      >
                        {s.label}
                      </button>
                    );
                  })
                )}
              </div>

              <button
                onClick={() => setStep("form")}
                disabled={minutes == null}
                className="w-full rounded-full bg-teal py-4 font-heading text-base font-bold text-white disabled:opacity-50"
              >
                Continuar
              </button>
            </>
          )}
        </div>
      )}

      {step === "form" && (
        <form onSubmit={submitForm} className="flex flex-col gap-5">
          <div className="rounded-2xl bg-teal-tint px-5 py-4 text-sm font-bold text-teal-dark">
            Fecha: {formatDateFull(selectedDateKey)} · Hora: {selectedTimeLabel}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-bold text-ink">Nombre completo</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Ej. María Pérez"
              className="w-full rounded-xl border-2 border-border-strong px-4 py-3.5 text-[15px]"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-bold text-ink">Teléfono</label>
            <input
              required
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="Ej. 7000 0000"
              className="w-full rounded-xl border-2 border-border-strong px-4 py-3.5 text-[15px]"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-bold text-ink">Correo electrónico</label>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="Ej. maria@correo.com"
              className="w-full rounded-xl border-2 border-border-strong px-4 py-3.5 text-[15px]"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-bold text-ink">¿Primera vez o seguimiento?</label>
            <div className="flex gap-3">
              {(["primera", "seguimiento"] as const).map((type) => {
                const selected = form.visitType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, visitType: type }))}
                    className={`flex-1 rounded-xl border-2 py-3 font-heading font-bold ${
                      selected ? "border-teal bg-teal text-white" : "border-border-strong bg-surface text-ink"
                    }`}
                  >
                    {type === "primera" ? "Primera vez" : "Seguimiento"}
                  </button>
                );
              })}
            </div>
          </div>

          {submitError && (
            <div className="rounded-xl bg-danger-tint px-4 py-3 text-sm font-semibold text-danger">
              {submitError}
            </div>
          )}

          <div className="mt-2 flex gap-3">
            <button
              type="button"
              onClick={() => setStep("select")}
              className="flex-1 rounded-full border-2 border-border-strong bg-surface py-4 font-heading font-bold text-ink"
            >
              Atrás
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-[2] rounded-full bg-teal py-4 font-heading font-bold text-white disabled:opacity-60"
            >
              {submitting ? "Agendando…" : "Confirmar cita"}
            </button>
          </div>
        </form>
      )}

      {step === "done" && (
        <div className="px-5 py-10 text-center">
          <div className="mx-auto mb-6 flex h-[72px] w-[72px] items-center justify-center rounded-full bg-teal-tint">
            <div
              className="h-3.5 w-6 border-b-4 border-l-4 border-teal"
              style={{ transform: "rotate(-45deg) translate(2px, -3px)" }}
            />
          </div>
          <h2 className="mb-3 font-heading text-2xl font-extrabold text-ink">¡Tu cita fue agendada!</h2>
          <p className="mx-auto mb-2 max-w-[440px] text-base leading-[1.7] text-muted">
            Te esperamos el {formatDateFull(selectedDateKey)} a las {selectedTimeLabel}.
          </p>
          <p className="mb-8 text-sm text-faint">
            Hemos registrado tu solicitud con el correo {form.email} y el teléfono {form.phone}. El
            consultorio confirmará tu cita antes de la fecha agendada.
          </p>
          <button
            onClick={resetBooking}
            className="rounded-full border-2 border-border-strong bg-surface px-7 py-3.5 font-heading font-bold text-ink"
          >
            Agendar otra cita
          </button>
        </div>
      )}
    </main>
  );
}
