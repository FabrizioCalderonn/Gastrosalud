"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type PatientBasicInfo = { name: string; phone: string; dui: string; email: string };

export function PatientEditForm({ patientId, initial }: { patientId: string; initial: PatientBasicInfo }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/patients/${patientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "No se pudo guardar");
        return;
      }
      setEditing(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="mt-4 text-sm font-bold text-teal-dark underline"
      >
        Editar información
      </button>
    );
  }

  return (
    <form onSubmit={save} className="mt-4 grid gap-3 rounded-xl border border-border bg-cream p-4 sm:grid-cols-2">
      <Field label="Nombre" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} />
      <Field label="Teléfono" value={form.phone} onChange={(v) => setForm((f) => ({ ...f, phone: v }))} />
      <Field label="DUI" value={form.dui} onChange={(v) => setForm((f) => ({ ...f, dui: v }))} />
      <Field
        label="Correo (opcional)"
        value={form.email}
        onChange={(v) => setForm((f) => ({ ...f, email: v }))}
        type="email"
      />
      {error && <div className="sm:col-span-2 text-sm font-semibold text-danger">{error}</div>}
      <div className="flex gap-2 sm:col-span-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-teal px-5 py-2 font-heading text-sm font-bold text-white disabled:opacity-60"
        >
          {saving ? "Guardando…" : "Guardar"}
        </button>
        <button
          type="button"
          onClick={() => {
            setEditing(false);
            setForm(initial);
            setError(null);
          }}
          className="rounded-full border-2 border-border-strong bg-surface px-5 py-2 font-heading text-sm font-bold text-ink"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-bold text-muted-2">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border-2 border-border-strong px-3 py-2 text-sm"
      />
    </div>
  );
}
