"use client";

import { useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { addDaysToDateKey, todayDateKey } from "@/lib/schedule";
import { formatDateFull } from "@/lib/format";

export function DayNav({ dateKey }: { dateKey: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateInputRef = useRef<HTMLInputElement>(null);

  function goTo(nextDateKey: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("date", nextDateKey);
    router.push(`/admin?${params.toString()}`);
  }

  return (
    <div className="mb-6 flex items-center gap-3">
      <button
        type="button"
        aria-label="Día anterior"
        onClick={() => goTo(addDaysToDateKey(dateKey, -1))}
        className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-border-strong bg-surface text-ink"
      >
        ←
      </button>
      <div className="min-w-[220px] text-center font-heading text-lg font-bold text-ink">
        {formatDateFull(dateKey)}
      </div>
      <button
        type="button"
        aria-label="Día siguiente"
        onClick={() => goTo(addDaysToDateKey(dateKey, 1))}
        className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-border-strong bg-surface text-ink"
      >
        →
      </button>
      <div className="relative">
        <button
          type="button"
          aria-label="Elegir fecha"
          onClick={() => dateInputRef.current?.showPicker?.() ?? dateInputRef.current?.focus()}
          className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-border-strong bg-surface text-ink"
        >
          📅
        </button>
        <input
          ref={dateInputRef}
          type="date"
          value={dateKey}
          onChange={(e) => e.target.value && goTo(e.target.value)}
          className="absolute inset-0 h-9 w-9 cursor-pointer opacity-0"
        />
      </div>
      <button
        type="button"
        onClick={() => goTo(todayDateKey())}
        className="ml-1 text-sm font-bold text-teal-dark underline"
      >
        Hoy
      </button>
    </div>
  );
}
