import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import SupervisorLeaveClient from "./SupervisorLeaveClient";
import { differenceInDays } from "date-fns";

export default async function SupervisorLeavePage() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "SUPERVISOR" && user.role !== "ADMIN")) redirect("/staff");

  const staff = await prisma.user.findMany({
    where: { 
      companyId: user.companyId,
      role: "STAFF",
      ...(user.outletId ? { outletId: user.outletId } : {})
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
        ...(user.outletId ? { outletId: user.outletId } : {})
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

    if (status === "APPROVED" && leave) {
      const days = differenceInDays(new Date(leave.endDate), new Date(leave.startDate)) + 1;
      await prisma.user.update({
        where: { id: leave.userId },
        data: { leaveBalance: { decrement: days } }
      });
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
    
    const leave = await prisma.leave.create({
      data: {
        userId: data.userId,
        startDate: data.startDate,
        endDate: data.endDate,
        reason: data.reason,
        status: data.status
      }
    });

    if (data.status === "APPROVED") {
      const days = differenceInDays(new Date(data.endDate), new Date(data.startDate)) + 1;
      await prisma.user.update({
        where: { id: data.userId },
        data: { leaveBalance: { decrement: days } }
      });
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
