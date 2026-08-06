import { PlaceholderPhoto } from "@/components/PlaceholderPhoto";

const POSTS = [
  {
    title: "5 señales de alerta digestiva que no debes ignorar",
    desc: "Aprende a reconocer síntomas que ameritan una consulta oportuna.",
  },
  {
    title: "Qué esperar en tu primera endoscopía",
    desc: "Preparación, procedimiento y recuperación explicados con calma.",
  },
  {
    title: "Alimentación saludable para tu sistema digestivo",
    desc: "Hábitos simples que marcan una gran diferencia.",
  },
];

export function Blog() {
  return (
    <section id="blog" className="bg-surface px-6 py-14 md:px-16 md:py-[72px]">
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-11 text-center">
          <div className="mb-2.5 text-[13px] font-bold uppercase tracking-wider text-green">Blog</div>
          <h2 className="font-heading text-[26px] font-bold text-ink md:text-[30px]">
            Artículos de salud digestiva
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {POSTS.map((p) => (
            <article key={p.title} className="overflow-hidden rounded-[20px] border border-border bg-cream">
              <PlaceholderPhoto label="Imagen del artículo" className="h-[180px] w-full" />
              <div className="p-[22px]">
                <h3 className="mb-2 font-heading text-[17px] font-bold text-ink">{p.title}</h3>
                <p className="text-sm leading-[1.6] text-muted">{p.desc}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
