"use client";

import { useState } from "react";

type Entry = { id: string; content: string; authorName: string; createdAt: string | Date };

export function ClinicalRecordSection({ patientId, initialEntries }: { patientId: string; initialEntries: Entry[] }) {
  const [entries, setEntries] = useState(initialEntries);
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addEntry(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/patients/${patientId}/clinical-records`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "No se pudo guardar el registro");
        return;
      }
      setEntries((prev) => [data.entry, ...prev]);
      setContent("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border-2 border-teal-dark bg-teal-tint/30 p-6">
      <div className="mb-1 text-xs font-bold uppercase tracking-wide text-teal-dark">Solo Doctora</div>
      <h2 className="mb-4 font-heading text-lg font-bold text-ink">Expediente clínico</h2>

      <form onSubmit={addEntry} className="mb-5 flex flex-col gap-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Diagnóstico, evolución, indicaciones…"
          rows={4}
          className="w-full rounded-xl border-2 border-border-strong bg-surface px-3 py-2 text-sm"
        />
        {error && <div className="text-sm font-semibold text-danger">{error}</div>}
        <button
          type="submit"
          disabled={saving || !content.trim()}
          className="self-start rounded-full bg-teal-dark px-5 py-2 font-heading text-sm font-bold text-white disabled:opacity-60"
        >
          {saving ? "Guardando…" : "Agregar al expediente"}
        </button>
      </form>

      {entries.length === 0 ? (
        <p className="text-sm text-muted">Sin registros todavía.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {entries.map((e) => (
            <div key={e.id} className="rounded-xl border border-border bg-surface p-3">
              <div className="mb-1 text-xs font-bold text-muted-2">
                {e.authorName} · {new Date(e.createdAt).toLocaleString("es-SV")}
              </div>
              <div className="whitespace-pre-wrap text-sm text-ink">{e.content}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
