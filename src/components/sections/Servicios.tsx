const SERVICES = [
  {
    title: "Endoscopía digestiva",
    desc: "Diagnóstico preciso del tracto digestivo superior con equipo especializado.",
    color: "teal",
  },
  {
    title: "Gastroenterología general",
    desc: "Evaluación y seguimiento de enfermedades digestivas y hepáticas.",
    color: "green",
  },
  {
    title: "Medicina interna",
    desc: "Manejo integral de la salud del adulto y enfermedades crónicas.",
    color: "teal",
  },
  {
    title: "Colonoscopía",
    desc: "Prevención y detección temprana de afecciones del colon.",
    color: "green",
  },
  {
    title: "Reflujo y gastritis",
    desc: "Diagnóstico y tratamiento personalizado para molestias digestivas.",
    color: "teal",
  },
  {
    title: "Chequeos preventivos",
    desc: "Revisiones periódicas para cuidar tu salud digestiva a tiempo.",
    color: "green",
  },
] as const;

export function Servicios() {
  return (
    <section id="servicios" className="mx-auto max-w-[1200px] px-6 py-14 md:px-16 md:py-[72px]">
      <div className="mb-11 text-center">
        <div className="mb-2.5 text-[13px] font-bold uppercase tracking-wider text-green">
          Nuestros servicios
        </div>
        <h2 className="font-heading text-[28px] font-bold text-ink md:text-[32px]">
          Atención especializada en salud digestiva
        </h2>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {SERVICES.map((s) => (
          <div key={s.title} className="rounded-[20px] border border-border bg-cream p-7">
            <div className="mb-5 flex h-[52px] w-[52px] items-center justify-center rounded-full bg-teal-tint">
              <div className={`h-5 w-5 rounded-full ${s.color === "teal" ? "bg-teal" : "bg-green"}`} />
            </div>
            <h3 className="mb-2.5 font-heading text-lg font-bold text-ink">{s.title}</h3>
            <p className="text-sm leading-[1.6] text-muted">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
