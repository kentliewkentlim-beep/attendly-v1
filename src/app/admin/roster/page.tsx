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

    const items = (payload.items || []).map((item: any) => {
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

    const items = lastWeekRosters.map((oldRoster) => {
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
      };
    });

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
      shiftTemplates={shiftTemplates}
      onSaveRoster={handleSaveRoster}
      onCopyRoster={handleCopyRoster}
    />
  );
}
