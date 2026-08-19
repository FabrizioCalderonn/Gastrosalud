import "server-only";
import { prisma } from "@/lib/prisma";
import { formatTime, isWithinCutoff, parseDateKey, toDateKey, todayDateKey } from "@/lib/schedule";

const DEFAULT_SLOT_DURATION = 30;

export async function getSlotDurationMinutes(): Promise<number> {
  const settings = await prisma.scheduleSettings.findUnique({ where: { id: 1 } });
  return settings?.slotDurationMinutes ?? DEFAULT_SLOT_DURATION;
}

/**
 * Minimum notice (in minutes) required before a slot's start time to still book/reschedule it.
 * Disabled at the user's request (2026-08-19) — always returns 0, so the only remaining
 * constraint is that a slot can't already be in the past. The `ScheduleSettings.minLeadMinutes`
 * column and its admin UI control are left in place (unused) in case this needs to come back.
 */
export async function getMinLeadMinutes(): Promise<number> {
  return 0;
}

export type WorkingRange = { startMinutes: number; endMinutes: number };

/** All working-hour ranges grouped by day of week (0 = Sunday ... 6 = Saturday). */
export async function getWorkingRangesByDay(): Promise<Record<number, WorkingRange[]>> {
  const rows = await prisma.workingHoursRange.findMany({ orderBy: { startMinutes: "asc" } });
  const byDay: Record<number, WorkingRange[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
  for (const row of rows) {
    byDay[row.dayOfWeek]?.push({ startMinutes: row.startMinutes, endMinutes: row.endMinutes });
  }
  return byDay;
}

function rangesToSlots(ranges: WorkingRange[], durationMinutes: number): number[] {
  const slots: number[] = [];
  for (const { startMinutes, endMinutes } of ranges) {
    let t = startMinutes;
    while (t < endMinutes) {
      slots.push(t);
      t += durationMinutes;
    }
  }
  return slots;
}

type BlockedPeriodRow = {
  startDate: Date;
  endDate: Date;
  startMinutes: number | null;
  endMinutes: number | null;
};

/** Blocked periods (admin-set unavailability) whose date range overlaps [from, to]. */
async function getBlockedPeriodsInRange(from: Date, to: Date): Promise<BlockedPeriodRow[]> {
  return prisma.blockedPeriod.findMany({
    where: { startDate: { lte: to }, endDate: { gte: from } },
    select: { startDate: true, endDate: true, startMinutes: true, endMinutes: true },
  });
}

function isDateWithinPeriod(date: Date, period: BlockedPeriodRow): boolean {
  return date.getTime() >= period.startDate.getTime() && date.getTime() <= period.endDate.getTime();
}

function isDateFullyBlockedBy(date: Date, periods: BlockedPeriodRow[]): boolean {
  return periods.some(
    (p) => p.startMinutes == null && p.endMinutes == null && isDateWithinPeriod(date, p),
  );
}

function isMinuteBlockedBy(date: Date, minutes: number, periods: BlockedPeriodRow[]): boolean {
  return periods.some((p) => {
    if (!isDateWithinPeriod(date, p)) return false;
    if (p.startMinutes == null || p.endMinutes == null) return true; // whole-day block
    return minutes >= p.startMinutes && minutes < p.endMinutes;
  });
}

function isRangeBlockedBy(date: Date, startMinutes: number, endMinutes: number, periods: BlockedPeriodRow[]): boolean {
  return periods.some((p) => {
    if (!isDateWithinPeriod(date, p)) return false;
    if (p.startMinutes == null || p.endMinutes == null) return true; // whole-day block
    return startMinutes < p.endMinutes && endMinutes > p.startMinutes;
  });
}

export type AvailabilitySlot = { minutes: number; label: string; booked: boolean };

export async function computeAvailability(dateKey: string): Promise<AvailabilitySlot[]> {
  const date = parseDateKey(dateKey);
  const [durationMinutes, minLeadMinutes, rangesByDay, appointments, blockedPeriods] = await Promise.all([
    getSlotDurationMinutes(),
    getMinLeadMinutes(),
    getWorkingRangesByDay(),
    prisma.appointment.findMany({
      where: { date, status: { not: "cancelada" } },
      select: { minutes: true, durationMinutes: true },
    }),
    getBlockedPeriodsInRange(date, date),
  ]);

  const slotMinutes = rangesToSlots(rangesByDay[date.getUTCDay()] ?? [], durationMinutes);

  return slotMinutes.map((minutes) => {
    const slotEnd = minutes + durationMinutes;
    const overlapsExisting = appointments.some(
      (a) => minutes < a.minutes + a.durationMinutes && slotEnd > a.minutes,
    );
    return {
      minutes,
      label: formatTime(minutes),
      booked:
        overlapsExisting ||
        isMinuteBlockedBy(date, minutes, blockedPeriods) ||
        isWithinCutoff(dateKey, minutes, minLeadMinutes * 60 * 1000),
    };
  });
}

export type BusyRange = { id: string; minutes: number; durationMinutes: number; patientName: string };

/** Existing non-cancelled appointments for a day, for staff to see what's already taken while free-picking a start time/duration. */
export async function getBusyRangesForDate(dateKey: string): Promise<BusyRange[]> {
  const date = parseDateKey(dateKey);
  return prisma.appointment.findMany({
    where: { date, status: { not: "cancelada" } },
    select: { id: true, minutes: true, durationMinutes: true, patientName: true },
    orderBy: { minutes: "asc" },
  });
}

/**
 * Whether an arbitrary [startMinutes, startMinutes + durationMinutes) range can be booked —
 * for the admin's free-duration ("Google Calendar style") appointment creation. Checks working
 * hours containment, blocked periods, overlap with existing non-cancelled appointments, and that
 * the start isn't already in the past. No minimum lead time is enforced (see getMinLeadMinutes).
 */
export async function isRangeAvailable(
  dateKey: string,
  startMinutes: number,
  durationMinutes: number,
  excludeAppointmentId?: string,
): Promise<{ available: boolean; reason?: string }> {
  if (durationMinutes < 5) return { available: false, reason: "La duración mínima es 5 minutos" };

  const date = parseDateKey(dateKey);
  const endMinutes = startMinutes + durationMinutes;

  const [rangesByDay, blockedPeriods, appointments] = await Promise.all([
    getWorkingRangesByDay(),
    getBlockedPeriodsInRange(date, date),
    prisma.appointment.findMany({
      where: {
        date,
        status: { not: "cancelada" },
        ...(excludeAppointmentId ? { id: { not: excludeAppointmentId } } : {}),
      },
      select: { minutes: true, durationMinutes: true },
    }),
  ]);

  const ranges = rangesByDay[date.getUTCDay()] ?? [];
  const withinWorkingHours = ranges.some((r) => startMinutes >= r.startMinutes && endMinutes <= r.endMinutes);
  if (!withinWorkingHours) return { available: false, reason: "Fuera del horario de atención configurado" };

  if (isRangeBlockedBy(date, startMinutes, endMinutes, blockedPeriods)) {
    return { available: false, reason: "Ese horario está bloqueado" };
  }

  const overlapping = appointments.some(
    (a) => startMinutes < a.minutes + a.durationMinutes && endMinutes > a.minutes,
  );
  if (overlapping) return { available: false, reason: "Ese horario se cruza con otra cita ya agendada" };

  if (isWithinCutoff(dateKey, startMinutes, 0)) {
    return { available: false, reason: "Ese horario ya pasó" };
  }

  return { available: true };
}

/** Whether a specific slot can currently be booked (working hours + not blocked + enough lead time; does not check for an existing appointment). */
export async function isSlotWithinScheduleAndUnblocked(dateKey: string, minutes: number): Promise<boolean> {
  const date = parseDateKey(dateKey);
  const [durationMinutes, minLeadMinutes, rangesByDay, blockedPeriods] = await Promise.all([
    getSlotDurationMinutes(),
    getMinLeadMinutes(),
    getWorkingRangesByDay(),
    getBlockedPeriodsInRange(date, date),
  ]);
  const validSlots = rangesToSlots(rangesByDay[date.getUTCDay()] ?? [], durationMinutes);
  if (!validSlots.includes(minutes)) return false;
  if (isMinuteBlockedBy(date, minutes, blockedPeriods)) return false;
  return !isWithinCutoff(dateKey, minutes, minLeadMinutes * 60 * 1000);
}

/** Next `count` bookable calendar days (has working hours and isn't fully blocked), starting today. */
export async function getBookableDateKeys(count: number): Promise<string[]> {
  const rangesByDay = await getWorkingRangesByDay();
  const startKey = todayDateKey();
  const start = parseDateKey(startKey);

  // Look ahead generously since some days may be closed/blocked and skipped.
  const horizonDays = Math.max(count * 3, count + 21);
  const horizonEnd = new Date(start);
  horizonEnd.setUTCDate(horizonEnd.getUTCDate() + horizonDays);
  const blockedPeriods = await getBlockedPeriodsInRange(start, horizonEnd);

  const dates: string[] = [];
  for (let offset = 0; dates.length < count && offset < horizonDays; offset++) {
    const d = new Date(start);
    d.setUTCDate(d.getUTCDate() + offset);
    const hasWorkingHours = (rangesByDay[d.getUTCDay()] ?? []).length > 0;
    if (hasWorkingHours && !isDateFullyBlockedBy(d, blockedPeriods)) {
      dates.push(toDateKey(d));
    }
  }
  return dates;
}
