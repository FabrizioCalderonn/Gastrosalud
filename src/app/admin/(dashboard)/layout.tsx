import Image from "next/image";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { LogoutButton } from "@/components/admin/LogoutButton";
import type { Role } from "@prisma/client";

const ROLE_LABELS: Record<Role, string> = {
  doctora: "Doctora",
  laboratorista: "Laboratorista",
  recepcion: "Recepción",
};

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  return (
    <div className="min-h-screen bg-cream">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface px-6 py-3.5 md:px-8">
        <div className="flex items-center gap-3">
          <Image
            src="/images/logo-gastrosalud.png"
            alt="GastroSalud"
            width={40}
            height={40}
            className="h-10 w-10 rounded-full object-cover"
          />
          <div className="leading-tight">
            <div className="font-heading text-base font-bold text-ink">GastroSalud</div>
            <div className="text-[11px] text-muted-2">Panel administrativo</div>
          </div>
        </div>
        <nav className="flex items-center gap-5">
          <Link href="/admin" className="text-sm font-bold text-ink hover:text-teal-dark">
            Citas
          </Link>
          <Link href="/admin/pacientes" className="text-sm font-bold text-ink hover:text-teal-dark">
            Pacientes
          </Link>
          {session?.role !== "laboratorista" && (
            <Link href="/admin/configuracion" className="text-sm font-bold text-ink hover:text-teal-dark">
              Horario y bloqueos
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-4">
          {session && (
            <span className="text-sm text-muted">
              Hola, {session.username} <span className="text-faint">({ROLE_LABELS[session.role]})</span>
            </span>
          )}
          <LogoutButton />
        </div>
      </header>
      <main className="mx-auto max-w-[1200px] px-6 py-8 md:px-8">{children}</main>
    </div>
  );
}
