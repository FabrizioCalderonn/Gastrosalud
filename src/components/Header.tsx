"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/#doctora", label: "Doctora" },
  { href: "/#servicios", label: "Servicios" },
  { href: "/#seguros", label: "Seguros" },
  { href: "/#faq", label: "Preguntas" },
  { href: "/#contacto", label: "Contacto" },
];

export function Header() {
  const pathname = usePathname();
  const isBooking = pathname.startsWith("/citas");

  return (
    <header className="sticky top-0 z-50 flex flex-wrap items-center justify-between gap-4 border-b border-border bg-surface px-6 py-3.5 md:px-8">
      <Link href="/" className="flex items-center gap-3">
        <Image
          src="/images/logo-gastrosalud.png"
          alt="GastroSalud"
          width={44}
          height={44}
          className="h-11 w-11 rounded-full object-cover"
        />
        <div className="leading-tight">
          <div className="font-heading text-[19px] font-bold text-ink">GastroSalud</div>
          <div className="text-[11px] tracking-wide text-muted-2">Dra. Angelica Salgado</div>
        </div>
      </Link>

      {!isBooking && (
        <nav className="flex flex-wrap items-center gap-5">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="text-sm font-bold text-ink hover:text-teal-dark">
              {link.label}
            </a>
          ))}
        </nav>
      )}

      {isBooking ? (
        <Link
          href="/"
          className="rounded-full bg-[#F2EFE8] px-[22px] py-3 font-heading text-sm font-bold text-ink transition hover:bg-[#E7E1D2]"
        >
          ← Volver al inicio
        </Link>
      ) : (
        <Link
          href="/citas"
          className="rounded-full bg-teal px-[26px] py-3 font-heading text-[15px] font-bold text-white shadow-[0_6px_16px_rgba(44,166,174,0.35)] transition hover:bg-teal-darker hover:text-white"
        >
          Haz tu cita
        </Link>
      )}
    </header>
  );
}
