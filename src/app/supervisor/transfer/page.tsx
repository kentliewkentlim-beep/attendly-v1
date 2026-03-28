import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import SupervisorTransferClient from "./SupervisorTransferClient";

export default async function SupervisorTransferPage() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "SUPERVISOR" && user.role !== "ADMIN")) redirect("/staff");

  const myStaff = await prisma.user.findMany({
    where: { 
      companyId: user.companyId,
      role: "STAFF",
      outletId: user.outletId
    },
    orderBy: { name: "asc" }
  });

  const availableStaff = await prisma.user.findMany({
    where: { 
      companyId: user.companyId,
      role: "STAFF",
      outletId: { not: user.outletId }
    },
    include: { outlet: true },
    orderBy: { name: "asc" }
  });

  const activeTransfers = await prisma.transferRequest.findMany({
    where: {
      OR: [
        { fromOutletId: user.outletId || "" },
        { toOutletId: user.outletId || "" }
      ],
      status: { not: "RETURNED" }
    },
    include: {
      staff: true,
      fromOutlet: true,
      toOutlet: true
    },
    orderBy: { createdAt: "desc" }
  });

  const outlets = await prisma.outlet.findMany({
    where: { companyId: user.companyId },
    orderBy: { name: "asc" }
  });

  async function handleRequestTransfer(staffId: string, toOutletId: string, date: string) {
    "use server";
    
    const staff = await prisma.user.findUnique({
      where: { id: staffId }
    });

    if (!staff) return;

    await prisma.transferRequest.create({
      data: {
        staffId,
        fromOutletId: staff.outletId || "",
        toOutletId,
        requestDate: new Date(date),
        requesterId: user.id,
        status: "APPROVED" // Auto-approve for demo, usually would be PENDING
      }
    });

    // Update roster to reflect transfer
    await prisma.roster.upsert({
      where: {
        id: `roster-${staffId}-${date}`
      },
      update: {
        outletId: toOutletId,
        location: "Borrowed"
      },
      create: {
        id: `roster-${staffId}-${date}`,
        userId: staffId,
        date: new Date(date),
        shift: "FULL_DAY",
        outletId: toOutletId,
        location: "Borrowed"
      }
    });

    revalidatePath("/supervisor/transfer");
  }

  async function handleApproveTransfer(requestId: string, status: string) {
    "use server";
    await prisma.transferRequest.update({
      where: { id: requestId },
      data: { status, approverId: user.id }
    });
    revalidatePath("/supervisor/transfer");
  }

  async function handleReturnStaff(requestId: string) {
    "use server";
    await prisma.transferRequest.update({
      where: { id: requestId },
      data: { status: "RETURNED" }
    });
    revalidatePath("/supervisor/transfer");
  }

  return (
    <SupervisorTransferClient 
      myStaff={myStaff}
      availableStaff={availableStaff}
      activeTransfers={activeTransfers}
      outlets={outlets}
      onRequestTransfer={handleRequestTransfer}
      onApproveTransfer={handleApproveTransfer}
      onReturnStaff={handleReturnStaff}
    />
  );
}
