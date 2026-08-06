import Image from "next/image";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth";
import { LogoutButton } from "@/components/admin/LogoutButton";

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  return (
    <div className="min-h-screen bg-cream">
      <header className="flex items-center justify-between border-b border-border bg-surface px-6 py-3.5 md:px-8">
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
        <div className="flex items-center gap-4">
          {session && <span className="text-sm text-muted">Hola, {session.username}</span>}
          <LogoutButton />
        </div>
      </header>
      <main className="mx-auto max-w-[1200px] px-6 py-8 md:px-8">{children}</main>
    </div>
  );
}
