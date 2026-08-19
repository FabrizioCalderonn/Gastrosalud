import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { toDateKey } from "@/lib/schedule";
import { formatDateFull } from "@/lib/format";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function PacientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  const where: Prisma.PatientWhereInput = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { phone: { contains: q } },
          { dui: { contains: q } },
        ],
      }
    : {};

  const patients = await prisma.patient.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take: 200,
    include: {
      appointments: { orderBy: [{ date: "desc" }, { minutes: "desc" }], take: 1 },
    },
  });

  return (
    <div>
      <h1 className="mb-6 font-heading text-2xl font-extrabold text-ink">Pacientes</h1>

      <form className="mb-6 flex flex-wrap items-end gap-4 rounded-2xl border border-border bg-surface p-5">
        <div className="flex-1 min-w-[220px]">
          <label className="mb-1 block text-xs font-bold text-muted-2">Buscar</label>
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Nombre, teléfono o DUI"
            className="w-full rounded-lg border-2 border-border-strong px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          className="rounded-full bg-teal px-5 py-2 font-heading text-sm font-bold text-white"
        >
          Buscar
        </button>
        {q && (
          <Link href="/admin/pacientes" className="text-sm font-bold text-muted underline">
            Limpiar
          </Link>
        )}
      </form>

      <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-2">
              <th className="px-5 py-3 font-bold">Nombre</th>
              <th className="px-5 py-3 font-bold">Teléfono</th>
              <th className="px-5 py-3 font-bold">DUI</th>
              <th className="px-5 py-3 font-bold">Última cita</th>
            </tr>
          </thead>
          <tbody>
            {patients.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-muted">
                  No hay pacientes con estos filtros.
                </td>
              </tr>
            )}
            {patients.map((p) => (
              <tr key={p.id} className="border-b border-border last:border-0">
                <td className="px-5 py-4 font-semibold text-ink">
                  <Link href={`/admin/pacientes/${p.id}`} className="hover:underline">
                    {p.name}
                  </Link>
                </td>
                <td className="px-5 py-4 text-muted">{p.phone}</td>
                <td className="px-5 py-4 text-muted">{p.dui ?? "—"}</td>
                <td className="px-5 py-4 text-muted">
                  {p.appointments[0] ? formatDateFull(toDateKey(p.appointments[0].date)) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
