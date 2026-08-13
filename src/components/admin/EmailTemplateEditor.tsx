"use client";

import { useState } from "react";

type Template = {
  confirmSubject: string;
  confirmBody: string;
  cancelSubject: string;
  cancelBody: string;
};

export function EmailTemplateEditor({ initialTemplate }: { initialTemplate: Template }) {
  const [template, setTemplate] = useState(initialTemplate);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  function update(key: keyof Template, value: string) {
    setTemplate((t) => ({ ...t, [key]: value }));
  }

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/settings/email", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(template),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setMessage({ type: "error", text: data?.error ?? "No se pudo guardar" });
        return;
      }
      setMessage({ type: "ok", text: "Mensajes de correo guardados" });
    } catch {
      setMessage({ type: "error", text: "No se pudo conectar con el servidor" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <h2 className="mb-1 font-heading text-lg font-bold text-ink">Mensajes de correo</h2>
      <p className="mb-5 text-sm text-muted">
        Se envían automáticamente al confirmar o cancelar una cita. Puedes usar{" "}
        <code className="rounded bg-cream px-1 py-0.5 text-xs">{"{{nombre}}"}</code>,{" "}
        <code className="rounded bg-cream px-1 py-0.5 text-xs">{"{{fecha}}"}</code> y{" "}
        <code className="rounded bg-cream px-1 py-0.5 text-xs">{"{{hora}}"}</code> en el mensaje; se
        reemplazan por los datos de la cita.
      </p>

      <div className="flex flex-col gap-6">
        <div>
          <div className="mb-2 font-heading text-sm font-bold text-ink">Cita confirmada</div>
          <label className="mb-1 block text-xs font-bold text-muted-2">Asunto</label>
          <input
            type="text"
            value={template.confirmSubject}
            onChange={(e) => update("confirmSubject", e.target.value)}
            className="mb-3 w-full rounded-lg border-2 border-border-strong px-3 py-2 text-sm"
          />
          <label className="mb-1 block text-xs font-bold text-muted-2">Mensaje</label>
          <textarea
            value={template.confirmBody}
            onChange={(e) => update("confirmBody", e.target.value)}
            rows={5}
            className="w-full rounded-lg border-2 border-border-strong px-3 py-2 text-sm"
          />
        </div>

        <div className="border-t border-border pt-4">
          <div className="mb-2 font-heading text-sm font-bold text-ink">Cita cancelada</div>
          <label className="mb-1 block text-xs font-bold text-muted-2">Asunto</label>
          <input
            type="text"
            value={template.cancelSubject}
            onChange={(e) => update("cancelSubject", e.target.value)}
            className="mb-3 w-full rounded-lg border-2 border-border-strong px-3 py-2 text-sm"
          />
          <label className="mb-1 block text-xs font-bold text-muted-2">Mensaje</label>
          <textarea
            value={template.cancelBody}
            onChange={(e) => update("cancelBody", e.target.value)}
            rows={5}
            className="w-full rounded-lg border-2 border-border-strong px-3 py-2 text-sm"
          />
        </div>
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
        {saving ? "Guardando…" : "Guardar mensajes"}
      </button>
    </div>
  );
}
