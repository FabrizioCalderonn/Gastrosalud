import Link from "next/link";
import { PlaceholderPhoto } from "@/components/PlaceholderPhoto";

export function Hero() {
  return (
    <section className="mx-auto grid max-w-[1280px] items-center gap-12 px-6 py-14 md:grid-cols-[1.1fr_0.9fr] md:px-16 md:py-[72px]">
      <div>
        <div className="mb-5 inline-block rounded-full bg-teal-tint px-3.5 py-1.5 font-heading text-[13px] font-bold text-teal-dark">
          Gastroenterología · Endoscopía · Medicina interna
        </div>
        <h1 className="mb-5 text-balance font-heading text-[32px] font-extrabold leading-[1.15] text-ink md:text-[44px]">
          Cuidamos tu salud digestiva con calidez y experiencia
        </h1>
        <p className="mb-8 max-w-[520px] text-[17px] leading-[1.7] text-muted">
          La Dra. Angelica Salgado te acompaña con diagnóstico y tratamiento especializado en
          gastroenterología, endoscopía digestiva y medicina interna, en Santa Ana, El Salvador.
        </p>
        <Link
          href="/citas"
          className="inline-block w-[200px] rounded-full bg-teal px-8 py-4 text-center font-heading text-lg font-bold text-white shadow-[0_10px_24px_rgba(44,166,174,0.35)] transition hover:bg-teal-darker"
        >
          Haz tu cita
        </Link>
      </div>
      <PlaceholderPhoto
        label="Foto de la Dra. Angelica Salgado"
        className="h-[280px] w-full rounded-[28px] md:h-[420px]"
      />
    </section>
  );
}
