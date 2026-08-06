// Business hours and slot generation, shared by the public booking API and
// the admin dashboard. Times are expressed as minutes after midnight.

export const SLOT_DURATION_MINUTES = 30;

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

// 0 = Sunday ... 6 = Saturday. Each entry is [startHour, startMin, endHour, endMin].
export const BUSINESS_HOURS: Record<number, [number, number, number, number][]> = {
  0: [],
  1: [
    [8, 0, 12, 0],
    [14, 0, 17, 0],
  ],
  2: [
    [8, 0, 12, 0],
    [14, 0, 17, 0],
  ],
  3: [
    [8, 0, 12, 0],
    [14, 0, 17, 0],
  ],
  4: [
    [8, 0, 12, 0],
    [14, 0, 17, 0],
  ],
  5: [
    [8, 0, 12, 0],
    [14, 0, 17, 0],
  ],
  6: [[9, 0, 13, 0]],
};

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

/** All bookable slot start times (minutes after midnight) for the given day-of-week. */
export function slotsForDayOfWeek(dayOfWeek: number, durationMinutes = SLOT_DURATION_MINUTES): number[] {
  const ranges = BUSINESS_HOURS[dayOfWeek] ?? [];
  const slots: number[] = [];
  for (const [sh, sm, eh, em] of ranges) {
    let t = sh * 60 + sm;
    const end = eh * 60 + em;
    while (t < end) {
      slots.push(t);
      t += durationMinutes;
    }
  }
  return slots;
}

export function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const mi = minutes % 60;
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${mi === 0 ? "00" : String(mi).padStart(2, "0")} ${period}`;
}

/** Next N bookable calendar days (skipping Sundays), starting today, as "YYYY-MM-DD" keys. */
export function nextBookableDateKeys(count: number, from = new Date()): string[] {
  const days: string[] = [];
  let offset = 0;
  while (days.length < count) {
    const d = new Date(Date.UTC(from.getFullYear(), from.getMonth(), from.getDate() + offset));
    offset += 1;
    if (d.getUTCDay() !== 0) days.push(toDateKey(d));
  }
  return days;
}
