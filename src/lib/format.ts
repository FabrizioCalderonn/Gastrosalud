import { parseDateKey } from "@/lib/schedule";

/** Short label for the date-picker chips: weekday, day number, month — read as UTC to match the date key. */
export function formatDateShort(dateKey: string) {
  const date = parseDateKey(dateKey);
  const weekday = new Intl.DateTimeFormat("es-ES", { weekday: "short", timeZone: "UTC" })
    .format(date)
    .replace(".", "");
  const month = new Intl.DateTimeFormat("es-ES", { month: "short", timeZone: "UTC" })
    .format(date)
    .replace(".", "");
  return {
    weekday: weekday.charAt(0).toUpperCase() + weekday.slice(1),
    day: date.getUTCDate(),
    month: month.toUpperCase(),
  };
}

/** Full label used in headings/confirmations, e.g. "lunes, 12 de enero". */
export function formatDateFull(dateKey: string) {
  const date = parseDateKey(dateKey);
  const label = new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
}
