"use client";

import { useState } from "react";

type Note = { id: string; content: string; authorName: string; authorRole: string; createdAt: string | Date };

const ROLE_LABELS: Record<string, string> = {
  doctora: "Doctora",
  laboratorista: "Laboratorista",
  recepcion: "Recepción",
};

export function PatientNotes({ patientId, initialNotes }: { patientId: string; initialNotes: Note[] }) {
  const [notes, setNotes] = useState(initialNotes);
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addNote(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/patients/${patientId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "No se pudo guardar la nota");
        return;
      }
      setNotes((prev) => [data.note, ...prev]);
      setContent("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <h2 className="mb-4 font-heading text-lg font-bold text-ink">Notas</h2>
      <form onSubmit={addNote} className="mb-5 flex flex-col gap-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Escribe una nota…"
          rows={3}
          className="w-full rounded-xl border-2 border-border-strong px-3 py-2 text-sm"
        />
        {error && <div className="text-sm font-semibold text-danger">{error}</div>}
        <button
          type="submit"
          disabled={saving || !content.trim()}
          className="self-start rounded-full bg-teal px-5 py-2 font-heading text-sm font-bold text-white disabled:opacity-60"
        >
          {saving ? "Guardando…" : "Agregar nota"}
        </button>
      </form>

      {notes.length === 0 ? (
        <p className="text-sm text-muted">Sin notas todavía.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {notes.map((n) => (
            <div key={n.id} className="rounded-xl border border-border bg-cream p-3">
              <div className="mb-1 text-xs font-bold text-muted-2">
                {n.authorName} · {ROLE_LABELS[n.authorRole] ?? n.authorRole} ·{" "}
                {new Date(n.createdAt).toLocaleString("es-SV")}
              </div>
              <div className="whitespace-pre-wrap text-sm text-ink">{n.content}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
