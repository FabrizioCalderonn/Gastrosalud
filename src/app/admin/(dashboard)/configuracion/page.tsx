import { prisma } from "@/lib/prisma";
import { toDateKey } from "@/lib/schedule";
import { getMinLeadMinutes, getSlotDurationMinutes, getWorkingRangesByDay } from "@/lib/scheduling";
import { getEmailTemplate } from "@/lib/email";
import { WorkingHoursEditor } from "@/components/admin/WorkingHoursEditor";
import { BlockedPeriodsManager } from "@/components/admin/BlockedPeriodsManager";
import { EmailTemplateEditor } from "@/components/admin/EmailTemplateEditor";

export const dynamic = "force-dynamic";

export default async function ConfiguracionPage() {
  const [slotDurationMinutes, minLeadMinutes, days, periods, emailTemplate] = await Promise.all([
    getSlotDurationMinutes(),
    getMinLeadMinutes(),
    getWorkingRangesByDay(),
    prisma.blockedPeriod.findMany({ orderBy: { startDate: "desc" } }),
    getEmailTemplate(),
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
      <WorkingHoursEditor
        initialDays={days}
        initialSlotDuration={slotDurationMinutes}
        initialMinLeadMinutes={minLeadMinutes}
      />
      <BlockedPeriodsManager initialPeriods={initialPeriods} />
      <EmailTemplateEditor initialTemplate={emailTemplate} />
    </div>
  );
}
