"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onClick() {
    setLoading(true);
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="rounded-full border-2 border-border-strong bg-surface px-4 py-2 text-sm font-bold text-ink hover:bg-cream"
    >
      {loading ? "Saliendo…" : "Cerrar sesión"}
    </button>
  );
}
