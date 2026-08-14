"use client";

import { useEffect, useState } from "react";
import { formatDateFull, formatDateShort } from "@/lib/format";
import { formatTime } from "@/lib/schedule";
import type { AppointmentStatus } from "@/lib/validation";

type Slot = { minutes: number; label: string; booked: boolean };

const DATE_COUNT = 12;
const CLINIC_PHONE = "7867 9475";

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  pendiente: "Pendiente de confirmación",
  confirmada: "Confirmada",
  cancelada: "Cancelada",
  completada: "Completada",
};

export function ManageAppointment({
  token,
  patientName,
  dateKey: initialDateKey,
  minutes: initialMinutes,
  status: initialStatus,
  withinCutoff,
}: {
  token: string;
  patientName: string;
  dateKey: string;
  minutes: number;
  status: string;
  withinCutoff: boolean;
}) {
  const [dateKey, setDateKey] = useState(initialDateKey);
  const [minutes, setMinutes] = useState(initialMinutes);
  const [status, setStatus] = useState<AppointmentStatus>(initialStatus as AppointmentStatus);
  const [mode, setMode] = useState<"view" | "reschedule">("view");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cancelPending, setCancelPending] = useState(false);

  const [dateKeys, setDateKeys] = useState<string[]>([]);
  const [loadingDates, setLoadingDates] = useState(false);
  const [dateIdx, setDateIdx] = useState(0);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [newMinutes, setNewMinutes] = useState<number | null>(null);

  const pickerDateKey = dateKeys[dateIdx];

  useEffect(() => {
    if (mode !== "reschedule") return;
    setLoadingDates(true);
    fetch(`/api/booking-days?count=${DATE_COUNT}`)
      .then((res) => res.json())
      .then((data) => setDateKeys(data.dates ?? []))
      .finally(() => setLoadingDates(false));
  }, [mode]);

  useEffect(() => {
    if (!pickerDateKey) return;
    let cancelled = false;
    setLoadingSlots(true);
    setNewMinutes(null);
    fetch(`/api/availability?date=${pickerDateKey}`)
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
  }, [pickerDateKey]);

  async function submitReschedule() {
    if (newMinutes == null || !pickerDateKey) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/appointments/${token}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reschedule", dateKey: pickerDateKey, minutes: newMinutes }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "No se pudo reprogramar, intenta de nuevo.");
        return;
      }
      setDateKey(pickerDateKey);
      setMinutes(newMinutes);
      setStatus("pendiente");
      setMode("view");
      setMessage("Tu cita fue reprogramada y quedó pendiente de confirmación.");
    } catch {
      setError("No se pudo conectar con el servidor. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  async function confirmCancel() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/appointments/${token}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "No se pudo cancelar, intenta de nuevo.");
        return;
      }
      setStatus("cancelada");
      setMessage("Tu cita fue cancelada.");
    } catch {
      setError("No se pudo conectar con el servidor. Intenta de nuevo.");
    } finally {
      setLoading(false);
      setCancelPending(false);
    }
  }

  const canManage = status !== "cancelada" && !withinCutoff;

  return (
    <div>
      <div className="mb-6 rounded-2xl border-2 border-border-strong bg-surface px-5 py-4">
        <div className="mb-1 text-sm text-muted">Hola, {patientName}</div>
        <div className="mb-1 font-heading text-lg font-bold text-ink">
          {formatDateFull(dateKey)} · {formatTime(minutes)}
        </div>
        <div className="text-sm font-semibold text-teal-dark">{STATUS_LABELS[status]}</div>
      </div>

      {message && (
        <div className="mb-5 rounded-xl bg-success-tint px-4 py-3 text-sm font-semibold text-success">
          {message}
        </div>
      )}
      {error && (
        <div className="mb-5 rounded-xl bg-danger-tint px-4 py-3 text-sm font-semibold text-danger">
          {error}
        </div>
      )}

      {status === "cancelada" && (
        <p className="text-sm text-muted">
          Esta cita ya está cancelada. Si deseas agendar una nueva, visita la página de citas.
        </p>
      )}

      {status !== "cancelada" && withinCutoff && (
        <p className="text-sm text-muted">
          Faltan menos de 24 horas para tu cita, así que ya no se puede reprogramar ni cancelar desde aquí.
          Contáctanos directamente al {CLINIC_PHONE} si necesitas hacer un cambio.
        </p>
      )}

      {canManage && mode === "view" && (
        <div className="flex gap-3">
          <button
            onClick={() => setMode("reschedule")}
            className="flex-1 rounded-full border-2 border-border-strong bg-surface py-3.5 font-heading font-bold text-ink"
          >
            Reprogramar
          </button>
          {!cancelPending ? (
            <button
              onClick={() => setCancelPending(true)}
              className="flex-1 rounded-full border-2 border-danger bg-danger-tint py-3.5 font-heading font-bold text-danger"
            >
              Cancelar cita
            </button>
          ) : (
            <div className="flex flex-1 items-center justify-center gap-2 rounded-full border-2 border-danger px-3 py-2">
              <span className="text-[13px] font-semibold text-danger">¿Seguro?</span>
              <button
                onClick={confirmCancel}
                disabled={loading}
                className="text-[13px] font-bold text-danger underline disabled:opacity-60"
              >
                {loading ? "Cancelando…" : "Sí"}
              </button>
              <button
                onClick={() => setCancelPending(false)}
                disabled={loading}
                className="text-[13px] font-bold text-muted underline"
              >
                No
              </button>
            </div>
          )}
        </div>
      )}

      {canManage && mode === "reschedule" && (
        <div>
          <div className="mb-3 text-[15px] font-bold text-ink">Elige una nueva fecha</div>
          {loadingDates ? (
            <div className="mb-7 py-4 text-sm text-muted">Cargando fechas disponibles…</div>
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

          {pickerDateKey && (
            <>
              <div className="mb-3 text-[15px] font-bold text-ink">
                Horarios disponibles — {formatDateFull(pickerDateKey)}
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
                    const selected = newMinutes === s.minutes;
                    return (
                      <button
                        key={s.minutes}
                        disabled={s.booked}
                        onClick={() => setNewMinutes(s.minutes)}
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
            </>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setMode("view")}
              className="flex-1 rounded-full border-2 border-border-strong bg-surface py-4 font-heading font-bold text-ink"
            >
              Atrás
            </button>
            <button
              onClick={submitReschedule}
              disabled={newMinutes == null || loading}
              className="flex-[2] rounded-full bg-teal py-4 font-heading font-bold text-white disabled:opacity-60"
            >
              {loading ? "Guardando…" : "Guardar nuevo horario"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
