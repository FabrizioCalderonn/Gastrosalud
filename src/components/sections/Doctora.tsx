import { PlaceholderPhoto } from "@/components/PlaceholderPhoto";

export function Doctora() {
  return (
    <section id="doctora" className="bg-surface px-6 py-14 md:px-16 md:py-[72px]">
      <div className="mx-auto grid max-w-[1100px] items-center gap-10 md:grid-cols-[0.7fr_1.3fr] md:gap-14">
        <PlaceholderPhoto
          label="Foto de la Dra. Angelica Salgado"
          className="h-[280px] w-full rounded-3xl md:h-[360px]"
        />
        <div>
          <div className="mb-2.5 text-[13px] font-bold uppercase tracking-wider text-green">
            Conoce a tu doctora
          </div>
          <h2 className="mb-4 font-heading text-[28px] font-bold text-ink md:text-[32px]">
            Dra. Angelica Salgado
          </h2>
          <p className="mb-4 text-base leading-[1.8] text-muted">
            Especialista en Gastroenterología, Endoscopía digestiva y Medicina interna. Combina un
            trato cercano con un enfoque clínico riguroso para ofrecer diagnósticos precisos y
            tratamientos efectivos.
          </p>
          <p className="text-base leading-[1.8] text-muted">
            Su prioridad es que cada paciente se sienta escuchado y acompañado durante todo su
            proceso de salud digestiva.
          </p>
        </div>
      </div>
    </section>
  );
}
