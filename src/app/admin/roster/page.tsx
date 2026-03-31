import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import RosterClient from "./RosterClient";
import { startOfWeek, addDays, subWeeks, format } from "date-fns";

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

  async function handleSaveRoster(data: any[]) {
    "use server";
    
    // We'll perform a sync: delete existing for the dates in data, then re-insert
    // For simplicity in this demo, we'll update based on userId and date
    for (const item of data) {
      const date = new Date(item.date);
      date.setHours(0, 0, 0, 0);

      await prisma.roster.upsert({
        where: {
          id: item.id || `roster-${item.userId}-${format(date, "yyyy-MM-dd")}`
        },
        update: {
          shift: item.shift,
          date: date
        },
        create: {
          id: `roster-${item.userId}-${format(date, "yyyy-MM-dd")}`,
          userId: item.userId,
          date: date,
          shift: item.shift
        }
      });
    }
    revalidatePath("/admin/roster");
  }

  async function handleCopyRoster(fromStart: Date, toStart: Date) {
    "use server";
    
    const fromEnd = addDays(fromStart, 6);
    const lastWeekRosters = await prisma.roster.findMany({
      where: {
        date: {
          gte: fromStart,
          lte: fromEnd
        }
      }
    });

    for (const oldRoster of lastWeekRosters) {
      const daysDiff = Math.round((oldRoster.date.getTime() - fromStart.getTime()) / (1000 * 60 * 60 * 24));
      const newDate = addDays(toStart, daysDiff);
      newDate.setHours(0, 0, 0, 0);

      await prisma.roster.upsert({
        where: {
          id: `roster-${oldRoster.userId}-${format(newDate, "yyyy-MM-dd")}`
        },
        update: {
          shift: oldRoster.shift,
          date: newDate
        },
        create: {
          id: `roster-${oldRoster.userId}-${format(newDate, "yyyy-MM-dd")}`,
          userId: oldRoster.userId,
          date: newDate,
          shift: oldRoster.shift
        }
      });
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
