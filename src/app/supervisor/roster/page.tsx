import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import SupervisorRosterClient from "./SupervisorRosterClient";
import { addDays, differenceInCalendarDays, format } from "date-fns";
import { getAllowedOutletIds } from "@/lib/supervisorOutlets";

export default async function SupervisorRosterPage() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "SUPERVISOR" && user.role !== "ADMIN")) redirect("/staff");

  const companyOutlets = await prisma.outlet.findMany({
    where: { companyId: user.companyId },
    select: { id: true },
  });
  const allowedOutletIds = getAllowedOutletIds(user as any, companyOutlets.map((o) => o.id));

  const staff = await prisma.user.findMany({
    where: { 
      companyId: user.companyId,
      role: "STAFF",
      ...(allowedOutletIds.length > 0 ? { outletId: { in: allowedOutletIds } } : {})
    },
    include: { outlet: true },
    orderBy: { name: "asc" }
  });

  const rosters = await prisma.roster.findMany({
    where: {
      userId: { in: staff.map(s => s.id) }
    },
    include: { user: true },
    orderBy: { date: "asc" }
  });

  // Approved leaves for overlay on the roster grid.
  const approvedLeaves = await prisma.leave.findMany({
    where: {
      status: "APPROVED",
      userId: { in: staff.map(s => s.id) },
    },
    select: {
      id: true,
      userId: true,
      startDate: true,
      endDate: true,
      type: true,
      durationType: true,
    },
  });

  const shiftTemplates = await prisma.shiftTemplate.findMany({
    where: { companyId: user.companyId },
    orderBy: { name: "asc" },
  });

  async function handleSaveRoster(payload: { staffIds: string[]; monthStart: string; monthEnd: string; items: any[] }) {
    "use server";

    const sessionUser = await getCurrentUser();
    if (!sessionUser) return;

    const staffIds = (payload.staffIds || []).map(String);
    const monthStart = String(payload.monthStart);
    const monthEnd = String(payload.monthEnd);

    const startDate = new Date(`${monthStart}T00:00:00.000Z`);
    const endDate = new Date(`${monthEnd}T00:00:00.000Z`);

    await prisma.roster.deleteMany({
      where: {
        userId: { in: staffIds },
        date: { gte: startDate, lte: endDate },
      },
    });

    // Leaves within window — skip shift items that would land on an approved leave
    const leavesInWindow = await prisma.leave.findMany({
      where: {
        status: "APPROVED",
        userId: { in: staffIds },
        OR: [
          { startDate: { lte: endDate }, endDate: { gte: startDate } },
        ],
      },
      select: { userId: true, startDate: true, endDate: true },
    });
    const isLeaveDay = (userId: string, dateStr: string) =>
      leavesInWindow.some((l) => {
        if (l.userId !== userId) return false;
        const s = l.startDate.toISOString().slice(0, 10);
        const e = l.endDate.toISOString().slice(0, 10);
        return dateStr >= s && dateStr <= e;
      });

    const items = (payload.items || [])
      .filter((item: any) => !isLeaveDay(item.userId, String(item.date)))
      .map((item: any) => {
        const dateStr = String(item.date);
        const date = new Date(`${dateStr}T00:00:00.000Z`);
        return {
          id: `roster-${item.userId}-${dateStr}`,
          userId: item.userId,
          date,
          shift: item.shift,
          outletId: item.outletId || null,
          location: item.location || null,
        };
      });

    if (items.length > 0) {
      await prisma.roster.createMany({ data: items, skipDuplicates: true });
    }

    revalidatePath("/supervisor/roster");
  }

  async function handleCopyRoster(payload: { staffIds: string[]; fromStart: string; toStart: string }) {
    "use server";

    const sessionUser = await getCurrentUser();
    if (!sessionUser) return;

    const staffIds = (payload.staffIds || []).map(String);
    const fromStartStr = String(payload.fromStart);
    const toStartStr = String(payload.toStart);

    const fromStartDate = new Date(`${fromStartStr}T00:00:00.000Z`);
    const toStartDate = new Date(`${toStartStr}T00:00:00.000Z`);
    const fromEnd = addDays(fromStartDate, 6);

    const lastWeekRosters = await prisma.roster.findMany({
      where: {
        userId: { in: staffIds },
        date: {
          gte: fromStartDate,
          lte: fromEnd
        }
      }
    });

    const toEnd = addDays(toStartDate, 6);
    await prisma.roster.deleteMany({
      where: {
        userId: { in: staffIds },
        date: { gte: toStartDate, lte: toEnd },
      },
    });

    // Approved leaves in the target week — skip copying shifts into leave days
    const leavesInTarget = await prisma.leave.findMany({
      where: {
        status: "APPROVED",
        userId: { in: staffIds },
        OR: [
          { startDate: { lte: toEnd }, endDate: { gte: toStartDate } },
        ],
      },
      select: { userId: true, startDate: true, endDate: true },
    });
    const isLeaveDay = (userId: string, dateStr: string) =>
      leavesInTarget.some((l) => {
        if (l.userId !== userId) return false;
        const s = l.startDate.toISOString().slice(0, 10);
        const e = l.endDate.toISOString().slice(0, 10);
        return dateStr >= s && dateStr <= e;
      });

    const items = lastWeekRosters
      .map((oldRoster) => {
        const daysDiff = differenceInCalendarDays(oldRoster.date, fromStartDate);
        const newDate = addDays(toStartDate, daysDiff);
        newDate.setUTCHours(0, 0, 0, 0);
        const newDateStr = format(newDate, "yyyy-MM-dd");
        return {
          id: `roster-${oldRoster.userId}-${newDateStr}`,
          userId: oldRoster.userId,
          date: newDate,
          shift: oldRoster.shift,
          outletId: oldRoster.outletId || null,
          location: oldRoster.location || null,
          _dateStr: newDateStr,
        };
      })
      .filter((item: any) => !isLeaveDay(item.userId, item._dateStr))
      .map(({ _dateStr, ...rest }: any) => rest);

    if (items.length > 0) {
      await prisma.roster.createMany({ data: items, skipDuplicates: true });
    }
    revalidatePath("/supervisor/roster");
  }

  return (
    <SupervisorRosterClient 
      staff={staff} 
      rosters={rosters}
      leaves={approvedLeaves}
      shiftTemplates={shiftTemplates}
      onSaveRoster={handleSaveRoster}
      onCopyRoster={handleCopyRoster}
    />
  );
}
