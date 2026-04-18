import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import StaffLeaveClient from "./StaffLeaveClient";
import { revalidatePath } from "next/cache";

export default async function StaffLeavePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: { leaves: { orderBy: { createdAt: "desc" } } }
  });

  if (!dbUser) redirect("/");

  async function handleApplyLeave(data: { 
    startDate: Date; 
    endDate: Date; 
    type: string; 
    durationType?: string;
    reason: string;
    attachment?: string;
  }) {
    "use server";
    const sessionUser = await getCurrentUser();
    if (!sessionUser) return;

    await prisma.leave.create({
      data: {
        userId: sessionUser.id,
        startDate: data.startDate,
        endDate: data.endDate,
        type: data.type,
        durationType: data.durationType || "FULL_DAY",
        reason: data.reason,
        status: "PENDING",
        attachment: data.attachment
      }
    });

    revalidatePath("/staff/leave");
  }

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <StaffLeaveClient 
        leaveBalance={dbUser.leaveBalance} 
        leaveHistory={dbUser.leaves}
        onApplyLeave={handleApplyLeave}
      />
    </div>
  );
}
