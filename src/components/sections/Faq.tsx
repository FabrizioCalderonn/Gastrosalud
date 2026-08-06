"use client";

import { useState } from "react";

const FAQS = [
  {
    q: "¿Necesito ayuno para una endoscopía?",
    a: "Sí, se requiere ayuno de al menos 8 horas antes del procedimiento. Te daremos indicaciones completas al confirmar tu cita.",
  },
  {
    q: "¿Cuánto dura una consulta?",
    a: "Una consulta general dura entre 30 y 45 minutos, dependiendo del motivo de la visita.",
  },
  {
    q: "¿Qué debo llevar a mi primera cita?",
    a: "Documento de identidad, referencia médica (si tienes) y cualquier estudio o examen previo relacionado.",
  },
  {
    q: "¿Puedo cancelar o reprogramar mi cita?",
    a: "Sí, puedes hacerlo escribiéndonos con al menos 24 horas de anticipación por WhatsApp o correo.",
  },
  {
    q: "¿Atienden pacientes con seguro médico?",
    a: "Sí, trabajamos con varias aseguradoras. Consulta con nosotros la cobertura específica de tu póliza.",
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="mx-auto max-w-[800px] px-6 py-14 md:py-[72px]">
      <h2 className="mb-2 text-center font-heading text-[26px] font-bold text-ink md:text-[30px]">
        Preguntas frecuentes
      </h2>
      <p className="mb-8 text-center text-[15px] text-muted">
        Todo lo que necesitas saber antes de tu visita
      </p>
      <div className="flex flex-col gap-3">
        {FAQS.map((f, i) => (
          <div key={f.q} className="overflow-hidden rounded-2xl border border-border bg-surface">
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left font-heading text-base font-bold text-ink"
              aria-expanded={open === i}
            >
              <span>{f.q}</span>
              <span className="shrink-0 text-xl text-teal">{open === i ? "−" : "+"}</span>
            </button>
            {open === i && (
              <div className="px-6 pb-5 text-[15px] leading-[1.7] text-muted">{f.a}</div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
