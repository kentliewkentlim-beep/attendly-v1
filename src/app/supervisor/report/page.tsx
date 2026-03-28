import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import SupervisorReportClient from "./SupervisorReportClient";

export default async function SupervisorReportPage() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "SUPERVISOR" && user.role !== "ADMIN")) redirect("/staff");

  const attendanceData = await prisma.attendance.findMany({
    where: {
      user: {
        companyId: user.companyId,
        // Only show staff and other supervisors, not admins
        role: { in: ["STAFF", "SUPERVISOR"] }
      }
    },
    include: {
      user: {
        include: {
          outlet: true
        }
      }
    },
    orderBy: { date: "desc" }
  });

  const outlets = await prisma.outlet.findMany({
    where: { companyId: user.companyId },
    orderBy: { name: "asc" }
  });

  return (
    <SupervisorReportClient 
      attendanceData={attendanceData}
      outlets={outlets}
    />
  );
}
