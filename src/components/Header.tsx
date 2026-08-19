"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";

const NAV_LINKS = [
  { id: "doctora", label: "Doctora" },
  { id: "servicios", label: "Servicios" },
  { id: "seguros", label: "Seguros" },
  { id: "faq", label: "Preguntas" },
  { id: "contacto", label: "Contacto" },
];

export function Header() {
  const headerRef = useRef<HTMLElement>(null);

  function scrollToSection(e: React.MouseEvent<HTMLAnchorElement>, id: string) {
    if (e.metaKey || e.ctrlKey || e.shiftKey) return;
    const target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    const offset = (headerRef.current?.offsetHeight ?? 0) + 12;
    const top = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: "smooth" });
  }

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-50 flex flex-wrap items-center justify-between gap-4 border-b border-border bg-surface px-6 py-3.5 md:px-8"
    >
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

      <nav className="flex flex-wrap items-center gap-5">
        {NAV_LINKS.map((link) => (
          <a
            key={link.id}
            href={`/#${link.id}`}
            onClick={(e) => scrollToSection(e, link.id)}
            className="text-sm font-bold text-ink hover:text-teal-dark"
          >
            {link.label}
          </a>
        ))}
      </nav>
    </header>
  );
}
