import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import RosterClient from "./RosterClient";
import { addDays, differenceInCalendarDays, format } from "date-fns";

export default async function AdminRosterPage() {
  const companies = await prisma.company.findMany({
    orderBy: { name: "asc" }
  });
  const staff = await prisma.user.findMany({
    where: { role: { not: "ADMIN" } },
    include: { company: true, outlet: true },
    orderBy: { name: "asc" }
  });

  const rosters = await prisma.roster.findMany({
    include: { user: true },
    orderBy: { date: "asc" }
  });

  // Approved leaves for overlay on the roster grid.
  const approvedLeaves = await prisma.leave.findMany({
    where: { status: "APPROVED", user: { status: "ACTIVE" } },
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
    include: { company: true }
  });

  async function handleSaveRoster(payload: { companyId: string; weekStart: string; items: any[] }) {
    "use server";


    const companyId = String(payload.companyId);
    const weekStartStr = String(payload.weekStart);
    const startDate = new Date(`${weekStartStr}T00:00:00.000Z`);
    const endDate = addDays(startDate, 6);

    const userIds = (
      await prisma.user.findMany({
        where: { companyId, role: { not: "ADMIN" } },
        select: { id: true },
      })
    ).map((u) => u.id);

    await prisma.roster.deleteMany({
      where: {
        userId: { in: userIds },
        date: { gte: startDate, lte: endDate },
      },
    });

    // Approved leaves in window — skip shift items that land on a leave day
    const leavesInWindow = await prisma.leave.findMany({
      where: {
        status: "APPROVED",
        userId: { in: userIds },
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

    revalidatePath("/admin/roster");
  }

  async function handleCopyRoster(payload: { companyId: string; fromStart: string; toStart: string }) {
    "use server";

    const companyId = String(payload.companyId);
    const fromStart = String(payload.fromStart);
    const toStart = String(payload.toStart);

    const fromStartDate = new Date(`${fromStart}T00:00:00.000Z`);
    const toStartDate = new Date(`${toStart}T00:00:00.000Z`);
    const fromEnd = addDays(fromStartDate, 6);

    const userIds = (
      await prisma.user.findMany({
        where: { companyId, role: { not: "ADMIN" } },
        select: { id: true },
      })
    ).map((u) => u.id);

    const lastWeekRosters = await prisma.roster.findMany({
      where: {
        userId: { in: userIds },
        date: {
          gte: fromStartDate,
          lte: fromEnd
        }
      }
    });

    const toEnd = addDays(toStartDate, 6);
    await prisma.roster.deleteMany({
      where: {
        userId: { in: userIds },
        date: { gte: toStartDate, lte: toEnd },
      },
    });

    // Approved leaves in target week
    const leavesInTarget = await prisma.leave.findMany({
      where: {
        status: "APPROVED",
        userId: { in: userIds },
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
    revalidatePath("/admin/roster");
  }

  return (
    <RosterClient 
      companies={companies}
      staff={staff} 
      rosters={rosters}
      leaves={approvedLeaves}
      shiftTemplates={shiftTemplates}
      onSaveRoster={handleSaveRoster}
      onCopyRoster={handleCopyRoster}
    />
  );
}
