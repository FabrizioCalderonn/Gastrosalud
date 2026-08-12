import Image from "next/image";
import Link from "next/link";

export function Footer() {
  return (
    <footer id="contacto" className="bg-footer px-6 pb-8 pt-14 text-footer-text md:px-16">
      <div className="mx-auto grid max-w-[1200px] gap-10 md:grid-cols-[1.3fr_1fr_1fr]">
        <div>
          <div className="mb-4 flex items-center gap-3">
            <Image
              src="/images/logo-gastrosalud.png"
              alt="GastroSalud"
              width={40}
              height={40}
              className="h-10 w-10 rounded-full object-cover"
            />
            <div className="font-heading text-lg font-bold text-white">GastroSalud</div>
          </div>
          <p className="mb-5 max-w-[320px] text-sm leading-7 text-footer-muted">
            Clínica de la Dra. Angelica Salgado — Gastroenterología, Endoscopía digestiva y Medicina
            interna en Santa Ana, El Salvador.
          </p>
          <Link
            href="/citas"
            className="inline-block rounded-full bg-teal px-[26px] py-3.5 font-heading text-sm font-bold text-white transition hover:bg-teal-darker hover:text-white"
          >
            Haz tu cita
          </Link>
        </div>
        <div>
          <div className="mb-3.5 font-heading text-sm font-bold text-white">Contacto</div>
          <div className="space-y-1 text-sm leading-8 text-footer-muted">
            <div>Tel: 7867 9475</div>
            <div>gastrosaludsv@gmail.com</div>
            <div className="mt-2">
              25 Calle Poniente entre 8ª y 10ª av. Sur #33, Centro Médico de Santa Ana, Clínica 24,
              Santa Ana, El Salvador
            </div>
          </div>
        </div>
        <div>
          <div className="mb-3.5 font-heading text-sm font-bold text-white">Horario</div>
          <div className="space-y-1 text-sm leading-8 text-footer-muted">
            <div>Lunes a viernes: 8:00am–12:00pm y 2:00pm–5:00pm</div>
            <div>Sábados: 9:00am–1:00pm</div>
            <div>Domingos: cerrado</div>
          </div>
        </div>
      </div>
      <div className="mx-auto mt-8 max-w-[1200px] border-t border-footer-border pt-5 text-xs text-faint">
        © 2026 GastroSalud · Dra. Angelica Salgado
      </div>
    </footer>
  );
}
