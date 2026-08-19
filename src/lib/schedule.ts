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

/**
 * Converts a clinic-local (dateKey, minutes) instant into the real UTC Date it
 * represents. El Salvador is UTC-6 year-round (no DST), so this is a fixed
 * offset — safe as long as CLINIC_TIMEZONE stays "America/El_Salvador".
 */
export function dateKeyAndMinutesToUtcDate(dateKey: string, minutes: number): Date {
  const localMidnightUtc = parseDateKey(dateKey);
  return new Date(localMidnightUtc.getTime() + (minutes + 6 * 60) * 60 * 1000);
}

/** Whether the current moment is within `cutoffMs` of the clinic-local (dateKey, minutes) instant. */
export function isWithinCutoff(dateKey: string, minutes: number, cutoffMs: number): boolean {
  return Date.now() >= dateKeyAndMinutesToUtcDate(dateKey, minutes).getTime() - cutoffMs;
}

/** Shifts a "YYYY-MM-DD" key by `delta` calendar days (can be negative). */
export function addDaysToDateKey(dateKey: string, delta: number): string {
  const date = parseDateKey(dateKey);
  date.setUTCDate(date.getUTCDate() + delta);
  return toDateKey(date);
}

export function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const mi = minutes % 60;
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${mi === 0 ? "00" : String(mi).padStart(2, "0")} ${period}`;
}

/** e.g. "8:00 AM – 8:30 AM" for a free-duration appointment. */
export function formatTimeRange(minutes: number, durationMinutes: number): string {
  return `${formatTime(minutes)} – ${formatTime(minutes + durationMinutes)}`;
}

/** "HH:MM" (24h, for <input type="time">) from minutes-after-midnight. */
export function minutesToTimeInput(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

/** Inverse of minutesToTimeInput — parses an <input type="time"> value ("HH:MM") to minutes-after-midnight. */
export function timeInputToMinutes(value: string): number {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}
