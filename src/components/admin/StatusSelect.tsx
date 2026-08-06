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

  async function onChange(next: AppointmentStatus) {
    setValue(next);
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) {
        setValue(status);
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <select
      value={value}
      disabled={loading}
      onChange={(e) => onChange(e.target.value as AppointmentStatus)}
      className={statusClass(value) + " rounded-full border-2 px-3 py-1.5 text-xs font-bold"}
    >
      {APPOINTMENT_STATUSES.map((s) => (
        <option key={s} value={s}>
          {STATUS_LABELS[s]}
        </option>
      ))}
    </select>
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
