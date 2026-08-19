import { redirect } from "next/navigation";
import { getSession, hasRole } from "@/lib/auth";
import { NewAppointmentForm } from "@/components/admin/NewAppointmentForm";

export default async function NuevaCitaPage() {
  const session = await getSession();
  if (!hasRole(session, ["doctora", "recepcion"])) redirect("/admin");

  return (
    <div className="mx-auto max-w-[640px]">
      <h1 className="mb-6 font-heading text-2xl font-extrabold text-ink">Nueva cita</h1>
      <NewAppointmentForm />
    </div>
  );
}
