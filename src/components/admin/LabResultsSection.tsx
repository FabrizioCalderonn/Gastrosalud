"use client";

import { useState } from "react";

type LabResult = {
  id: string;
  fileName: string;
  fileSize: number;
  label: string | null;
  uploadedBy: string;
  createdAt: string | Date;
};

function formatSize(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export function LabResultsSection({
  patientId,
  initialResults,
  canUpload,
}: {
  patientId: string;
  initialResults: LabResult[];
  canUpload: boolean;
}) {
  const [results, setResults] = useState(initialResults);
  const [file, setFile] = useState<File | null>(null);
  const [label, setLabel] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.set("file", file);
      if (label.trim()) form.set("label", label.trim());
      const res = await fetch(`/api/admin/patients/${patientId}/lab-results`, {
        method: "POST",
        body: form,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "No se pudo subir el archivo");
        return;
      }
      setResults((prev) => [data.result, ...prev]);
      setFile(null);
      setLabel("");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <h2 className="mb-4 font-heading text-lg font-bold text-ink">Resultados de laboratorio</h2>

      {canUpload && (
        <form onSubmit={upload} className="mb-5 flex flex-wrap items-end gap-3 rounded-xl border border-border bg-cream p-4">
          <div>
            <label className="mb-1 block text-xs font-bold text-muted-2">Archivo PDF</label>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="text-sm"
            />
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className="mb-1 block text-xs font-bold text-muted-2">Descripción (opcional)</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Ej. Hemograma completo"
              className="w-full rounded-lg border-2 border-border-strong px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={!file || uploading}
            className="rounded-full bg-teal px-5 py-2 font-heading text-sm font-bold text-white disabled:opacity-60"
          >
            {uploading ? "Subiendo…" : "Subir"}
          </button>
          {error && <div className="w-full text-sm font-semibold text-danger">{error}</div>}
        </form>
      )}

      {results.length === 0 ? (
        <p className="text-sm text-muted">Sin resultados todavía.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {results.map((r) => (
            <a
              key={r.id}
              href={`/api/admin/patients/${patientId}/lab-results/${r.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-cream px-4 py-3 hover:border-teal"
            >
              <div>
                <div className="text-sm font-bold text-ink">{r.label || r.fileName}</div>
                <div className="text-xs text-muted">
                  {r.fileName} · {formatSize(r.fileSize)} · subido por {r.uploadedBy} ·{" "}
                  {new Date(r.createdAt).toLocaleDateString("es-SV")}
                </div>
              </div>
              <span className="text-xs font-bold text-teal-dark">Ver PDF →</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
