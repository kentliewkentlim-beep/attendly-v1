import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import SupervisorTrackingClient from "./SupervisorTrackingClient";
import { format, startOfDay } from "date-fns";
import { getDisplayName } from "@/lib/displayName";

export default async function SupervisorTrackingPage() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "SUPERVISOR" && user.role !== "ADMIN")) redirect("/staff");

  const todayStr = format(new Date(), "yyyy-MM-dd");

  const staff = await prisma.user.findMany({
    where: { 
      companyId: user.companyId,
      role: "STAFF",
      ...(user.outletId ? { outletId: user.outletId } : {})
    },
    include: {
      attendances: {
        where: { date: todayStr }
      },
      rosters: {
        where: { date: { gte: startOfDay(new Date()) } },
        take: 1,
        orderBy: { date: "asc" }
      }
    },
    orderBy: { name: "asc" }
  });

  const attendance = await prisma.attendance.findMany({
    where: {
      date: todayStr,
      user: {
        companyId: user.companyId,
        ...(user.outletId ? { outletId: user.outletId } : {})
      }
    },
    include: { user: true }
  });

  // Simple alert logic for now
  const alerts = attendance
    .filter(a => a.isLate)
    .map(a => ({
      type: "LATE",
      message: `${getDisplayName(a.user as any)} clocked in late today`,
      time: a.checkIn ? format(new Date(a.checkIn), "HH:mm") : ""
    }));

  return (
    <SupervisorTrackingClient 
      staff={staff}
      attendance={attendance}
      alerts={alerts}
    />
  );
}
