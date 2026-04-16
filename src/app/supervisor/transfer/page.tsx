import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import SupervisorTransferClient from "./SupervisorTransferClient";
import { getAllowedOutletIds } from "@/lib/supervisorOutlets";

export default async function SupervisorTransferPage() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "SUPERVISOR" && user.role !== "ADMIN")) redirect("/staff");

  const companyOutlets = await prisma.outlet.findMany({
    where: { companyId: user.companyId },
    select: { id: true },
  });
  const allowedOutletIds = getAllowedOutletIds(user as any, companyOutlets.map((o) => o.id));

  const myStaff = await prisma.user.findMany({
    where: { 
      companyId: user.companyId,
      role: "STAFF",
      ...(allowedOutletIds.length > 0 ? { outletId: { in: allowedOutletIds } } : {})
    },
    orderBy: { name: "asc" }
  });

  const availableStaff = await prisma.user.findMany({
    where: { 
      companyId: user.companyId,
      role: "STAFF",
      ...(allowedOutletIds.length > 0 ? { outletId: { notIn: allowedOutletIds } } : {})
    },
    include: { outlet: true },
    orderBy: { name: "asc" }
  });

  const activeTransfersWhere = allowedOutletIds.length > 0
    ? {
        OR: [
          { fromOutletId: { in: allowedOutletIds } },
          { toOutletId: { in: allowedOutletIds } }
        ],
        status: { not: "RETURNED" as const },
      }
    : {
        staff: { companyId: user.companyId },
        status: { not: "RETURNED" as const },
      };

  const activeTransfers = await prisma.transferRequest.findMany({
    where: activeTransfersWhere,
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
    const sessionUser = await getCurrentUser();
    if (!sessionUser) return;
    
    const staff = await prisma.user.findUnique({
      where: { id: staffId }
    });

    if (!staff || !staff.outletId) return;

    await prisma.transferRequest.create({
      data: {
        staffId,
        fromOutletId: staff.outletId,
        toOutletId: BigInt(toOutletId),
        requestDate: new Date(date),
        requesterId: sessionUser.id,
        status: "APPROVED" // Auto-approve for demo, usually would be PENDING
      }
    });

    // Update roster to reflect transfer
    await prisma.roster.upsert({
      where: {
        id: `roster-${staffId}-${date}`
      },
      update: {
        outletId: BigInt(toOutletId),
        location: "Borrowed"
      },
      create: {
        id: `roster-${staffId}-${date}`,
        userId: staffId,
        date: new Date(date),
        shift: "FULL_DAY",
        outletId: BigInt(toOutletId),
        location: "Borrowed"
      }
    });

    revalidatePath("/supervisor/transfer");
  }

  async function handleApproveTransfer(requestId: string, status: string) {
    "use server";
    const sessionUser = await getCurrentUser();
    if (!sessionUser) return;
    
    await prisma.transferRequest.update({
      where: { id: requestId },
      data: { status, approverId: sessionUser.id }
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
