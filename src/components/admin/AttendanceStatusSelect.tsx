"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ATTENDANCE_STATUSES, type AttendanceStatus } from "@/lib/validation";

const LABELS: Record<AttendanceStatus, string> = {
  pendiente: "Pendiente",
  visto: "Visto",
  cancelado: "Cancelado",
  reprogramado: "Reprogramado",
};

export function AttendanceStatusSelect({ id, attendanceStatus }: { id: string; attendanceStatus: AttendanceStatus }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [value, setValue] = useState(attendanceStatus);

  async function onChange(next: AttendanceStatus) {
    if (next === value) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/appointments/${id}/attendance`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attendanceStatus: next }),
      });
      if (!res.ok) return;
      setValue(next);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <select
      value={value}
      disabled={loading}
      onChange={(e) => onChange(e.target.value as AttendanceStatus)}
      className={statusClass(value) + " rounded-full border-2 px-3 py-1.5 text-xs font-bold"}
    >
      {ATTENDANCE_STATUSES.map((s) => (
        <option key={s} value={s}>
          {LABELS[s]}
        </option>
      ))}
    </select>
  );
}

function statusClass(status: AttendanceStatus) {
  switch (status) {
    case "visto":
      return "border-success bg-success-tint text-success";
    case "cancelado":
      return "border-danger bg-danger-tint text-danger";
    case "reprogramado":
      return "border-teal bg-teal-tint text-teal-dark";
    default:
      return "border-warning bg-warning-tint text-warning";
  }
}
