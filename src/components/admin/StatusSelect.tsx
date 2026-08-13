"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { APPOINTMENT_STATUSES, type AppointmentStatus } from "@/lib/validation";

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  pendiente: "Pendiente",
  confirmada: "Confirmada",
  cancelada: "Cancelada",
  completada: "Completada",
};

export function StatusSelect({ id, status }: { id: string; status: AppointmentStatus }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [value, setValue] = useState(status);
  const [pending, setPending] = useState<AppointmentStatus | null>(null);
  const [emailWarning, setEmailWarning] = useState<string | null>(null);

  function onSelect(next: AppointmentStatus) {
    if (next === value) return;
    setPending(next);
  }

  function cancelPending() {
    setPending(null);
  }

  async function confirmPending() {
    if (!pending) return;
    const next = pending;
    setLoading(true);
    setEmailWarning(null);
    try {
      const res = await fetch(`/api/admin/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) return;
      setValue(next);
      if (data?.email && data.email.sent === false) {
        setEmailWarning("No se pudo enviar el correo automático");
      }
      router.refresh();
    } finally {
      setLoading(false);
      setPending(null);
    }
  }

  return (
    <div>
      <select
        value={pending ?? value}
        disabled={loading}
        onChange={(e) => onSelect(e.target.value as AppointmentStatus)}
        className={statusClass(pending ?? value) + " rounded-full border-2 px-3 py-1.5 text-xs font-bold"}
      >
        {APPOINTMENT_STATUSES.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABELS[s]}
          </option>
        ))}
      </select>

      {pending && (
        <div className="mt-1.5 flex items-center gap-2">
          <span className="text-[11px] text-muted">Cambiar a {STATUS_LABELS[pending]}?</span>
          <button
            type="button"
            onClick={confirmPending}
            disabled={loading}
            className="text-[11px] font-bold text-teal-dark underline disabled:opacity-60"
          >
            {loading ? "Guardando…" : "Confirmar"}
          </button>
          <button
            type="button"
            onClick={cancelPending}
            disabled={loading}
            className="text-[11px] font-bold text-danger underline disabled:opacity-60"
          >
            Cancelar
          </button>
        </div>
      )}

      {emailWarning && <div className="mt-1 max-w-[160px] text-[11px] text-warning">{emailWarning}</div>}
    </div>
  );
}

function statusClass(status: AppointmentStatus) {
  switch (status) {
    case "confirmada":
      return "border-success bg-success-tint text-success";
    case "cancelada":
      return "border-danger bg-danger-tint text-danger";
    case "completada":
      return "border-border-strong bg-cream text-muted";
    default:
      return "border-warning bg-warning-tint text-warning";
  }
}
