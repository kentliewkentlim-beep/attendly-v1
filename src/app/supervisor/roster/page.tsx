import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import SupervisorRosterClient from "./SupervisorRosterClient";
import { format, addDays, startOfMonth, endOfMonth } from "date-fns";

export default async function SupervisorRosterPage() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "SUPERVISOR" && user.role !== "ADMIN")) redirect("/staff");

  const staff = await prisma.user.findMany({
    where: { 
      companyId: user.companyId,
      role: "STAFF",
      outletId: user.outletId
    },
    orderBy: { name: "asc" }
  });

  const rosters = await prisma.roster.findMany({
    where: {
      userId: { in: staff.map(s => s.id) }
    },
    orderBy: { date: "asc" }
  });

  async function handleSaveRoster(data: any[]) {
    "use server";
    const sessionUser = await getCurrentUser();
    if (!sessionUser) return;
    
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
          shift: item.shift,
          outletId: sessionUser.outletId
        }
      });
    }
    revalidatePath("/supervisor/roster");
  }

  async function handleCopyRoster(fromStart: Date, toStart: Date) {
    "use server";
    const sessionUser = await getCurrentUser();
    if (!sessionUser) return;
    
    const fromEnd = addDays(fromStart, 6);
    const lastWeekRosters = await prisma.roster.findMany({
      where: {
        userId: { in: staff.map(s => s.id) },
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
          shift: oldRoster.shift,
          outletId: sessionUser.outletId
        }
      });
    }
    revalidatePath("/supervisor/roster");
  }

  return (
    <SupervisorRosterClient 
      staff={staff} 
      rosters={rosters}
      onSaveRoster={handleSaveRoster}
      onCopyRoster={handleCopyRoster}
    />
  );
}
