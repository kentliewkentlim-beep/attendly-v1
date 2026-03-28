import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import SupervisorStaffClient from "./SupervisorStaffClient";
import { format } from "date-fns";

export default async function SupervisorStaffPage() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "SUPERVISOR" && user.role !== "ADMIN")) redirect("/staff");

  const todayStr = format(new Date(), "yyyy-MM-dd");

  const staff = await prisma.user.findMany({
    where: { 
      companyId: user.companyId,
      role: "STAFF",
      outletId: user.outletId
    },
    include: {
      attendances: {
        where: { date: todayStr }
      },
      rosters: {
        where: { date: { gte: new Date() } },
        take: 1,
        orderBy: { date: "asc" }
      },
      leaves: {
        where: {
          startDate: { lte: new Date() },
          endDate: { gte: new Date() },
          status: "APPROVED"
        }
      }
    },
    orderBy: { name: "asc" }
  });

  async function handleManualCheckIn(userId: string) {
    "use server";
    
    const today = format(new Date(), "yyyy-MM-dd");
    
    await prisma.attendance.upsert({
      where: {
        userId_date: {
          userId,
          date: today
        }
      },
      update: {
        checkIn: new Date(),
        isLate: false // Manual check-in by supervisor
      },
      create: {
        userId,
        date: today,
        checkIn: new Date(),
        isLate: false
      }
    });
    
    revalidatePath("/supervisor/staff");
  }

  return (
    <SupervisorStaffClient 
      staff={staff}
      onManualCheckIn={handleManualCheckIn}
    />
  );
}
