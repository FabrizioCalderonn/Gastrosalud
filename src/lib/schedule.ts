// Pure date/time helpers safe to import from client components — no database
// access here. Working hours and blocked periods (DB-driven) live in
// src/lib/scheduling.ts, which is server-only.

// The clinic operates in a single timezone regardless of where the server runs.
export const CLINIC_TIMEZONE = "America/El_Salvador";

/** Today's calendar day in the clinic's timezone, as "YYYY-MM-DD" — safe to compare lexicographically. */
export function todayDateKey(timeZone = CLINIC_TIMEZONE): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Parses a "YYYY-MM-DD" string into a UTC-midnight Date, used as the canonical day key. */
export function parseDateKey(dateKey: string): Date {
  const [y, m, d] = dateKey.split("-").map(Number);
  if (!y || !m || !d) throw new Error("Invalid date key");
  return new Date(Date.UTC(y, m - 1, d));
}

/** Formats a Date (or its UTC calendar day) back into "YYYY-MM-DD". */
export function toDateKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(
    date.getUTCDate(),
  ).padStart(2, "0")}`;
}

export function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const mi = minutes % 60;
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${mi === 0 ? "00" : String(mi).padStart(2, "0")} ${period}`;
}
