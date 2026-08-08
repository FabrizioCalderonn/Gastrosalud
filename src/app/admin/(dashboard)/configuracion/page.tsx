import { prisma } from "@/lib/prisma";
import { toDateKey } from "@/lib/schedule";
import { getSlotDurationMinutes, getWorkingRangesByDay } from "@/lib/scheduling";
import { WorkingHoursEditor } from "@/components/admin/WorkingHoursEditor";
import { BlockedPeriodsManager } from "@/components/admin/BlockedPeriodsManager";

export const dynamic = "force-dynamic";

export default async function ConfiguracionPage() {
  const [slotDurationMinutes, days, periods] = await Promise.all([
    getSlotDurationMinutes(),
    getWorkingRangesByDay(),
    prisma.blockedPeriod.findMany({ orderBy: { startDate: "desc" } }),
  ]);

  const initialPeriods = periods.map((p) => ({
    id: p.id,
    startDate: toDateKey(p.startDate),
    endDate: toDateKey(p.endDate),
    startMinutes: p.startMinutes,
    endMinutes: p.endMinutes,
    reason: p.reason,
  }));

  return (
    <div className="flex flex-col gap-6">
      <WorkingHoursEditor initialDays={days} initialSlotDuration={slotDurationMinutes} />
      <BlockedPeriodsManager initialPeriods={initialPeriods} />
    </div>
  );
}
