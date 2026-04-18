import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import SupervisorLeaveClient from "./SupervisorLeaveClient";
import { differenceInDays } from "date-fns";
import { getLeaveType, leaveDays } from "@/lib/leaveTypes";
import { getAllowedOutletIds } from "@/lib/supervisorOutlets";

export default async function SupervisorLeavePage() {
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
    include: {
      leaves: {
        where: {
          status: "APPROVED",
          startDate: { lte: new Date() },
          endDate: { gte: new Date() }
        }
      }
    },
    orderBy: { name: "asc" }
  });

  const leaveRequests = await prisma.leave.findMany({
    where: {
      user: {
        companyId: user.companyId,
        ...(allowedOutletIds.length > 0 ? { outletId: { in: allowedOutletIds } } : {})
      }
    },
    include: {
      user: true
    },
    orderBy: { createdAt: "desc" }
  });

  async function handleLeaveAction(id: string, status: string, note: string) {
    "use server";
    const sessionUser = await getCurrentUser();
    if (!sessionUser) return;
    
    const leave = await prisma.leave.findUnique({
      where: { id },
      include: { user: true }
    });
    if (!leave) return;

    const typeDef = getLeaveType(leave.type);
    const days = leaveDays(leave.startDate, leave.endDate, (leave as any).durationType);
    const wasApproved = leave.status === "APPROVED";
    const willBeApproved = status === "APPROVED";

    // Balance: AL/MC/EL deduct; UL/CO do not. Only APPROVED deducts.
    if (typeDef.deducts) {
      if (!wasApproved && willBeApproved) {
        await prisma.user.update({
          where: { id: leave.userId },
          data: { leaveBalance: { decrement: days } }
        });
      } else if (wasApproved && !willBeApproved) {
        await prisma.user.update({
          where: { id: leave.userId },
          data: { leaveBalance: { increment: days } }
        });
      }
    }

    await prisma.leave.update({
      where: { id },
      data: { status, supervisorNote: note }
    });

    revalidatePath("/supervisor/leave");
  }

  async function handleApplyLeave(data: any) {
    "use server";
    const sessionUser = await getCurrentUser();
    if (!sessionUser) return;
    
    const type = data.type || "AL";
    const durationType = data.durationType || "FULL_DAY";

    await prisma.leave.create({
      data: {
        userId: data.userId,
        startDate: data.startDate,
        endDate: data.endDate,
        type,
        durationType,
        reason: data.reason,
        status: data.status
      }
    });

    if (data.status === "APPROVED") {
      const typeDef = getLeaveType(type);
      if (typeDef.deducts) {
        const days = leaveDays(data.startDate, data.endDate, durationType);
        await prisma.user.update({
          where: { id: data.userId },
          data: { leaveBalance: { decrement: days } }
        });
      }
    }

    revalidatePath("/supervisor/leave");
  }

  return (
    <SupervisorLeaveClient 
      staff={staff}
      leaveRequests={leaveRequests}
      onLeaveAction={handleLeaveAction}
      onApplyLeave={handleApplyLeave}
    />
  );
}
