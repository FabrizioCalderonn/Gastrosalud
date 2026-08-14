import "server-only";
import { prisma } from "@/lib/prisma";
import { formatTime, isWithinCutoff, parseDateKey, toDateKey, todayDateKey } from "@/lib/schedule";

const DEFAULT_SLOT_DURATION = 30;
const DEFAULT_MIN_LEAD_MINUTES = 60;

export async function getSlotDurationMinutes(): Promise<number> {
  const settings = await prisma.scheduleSettings.findUnique({ where: { id: 1 } });
  return settings?.slotDurationMinutes ?? DEFAULT_SLOT_DURATION;
}

/** Minimum notice (in minutes) required before a slot's start time to still book/reschedule it. */
export async function getMinLeadMinutes(): Promise<number> {
  const settings = await prisma.scheduleSettings.findUnique({ where: { id: 1 } });
  return settings?.minLeadMinutes ?? DEFAULT_MIN_LEAD_MINUTES;
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

export type AvailabilitySlot = { minutes: number; label: string; booked: boolean };

export async function computeAvailability(dateKey: string): Promise<AvailabilitySlot[]> {
  const date = parseDateKey(dateKey);
  const [durationMinutes, minLeadMinutes, rangesByDay, appointments, blockedPeriods] = await Promise.all([
    getSlotDurationMinutes(),
    getMinLeadMinutes(),
    getWorkingRangesByDay(),
    prisma.appointment.findMany({ where: { date, status: { not: "cancelada" } }, select: { minutes: true } }),
    getBlockedPeriodsInRange(date, date),
  ]);

  const slotMinutes = rangesToSlots(rangesByDay[date.getUTCDay()] ?? [], durationMinutes);
  const bookedSet = new Set(appointments.map((a) => a.minutes));

  return slotMinutes.map((minutes) => ({
    minutes,
    label: formatTime(minutes),
    booked:
      bookedSet.has(minutes) ||
      isMinuteBlockedBy(date, minutes, blockedPeriods) ||
      isWithinCutoff(dateKey, minutes, minLeadMinutes * 60 * 1000),
  }));
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
