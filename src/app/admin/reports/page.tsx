import prisma from "@/lib/prisma";
import ReportsClient from "./ReportsClient";

export default async function AdminReportsPage() {
  const attendanceData = await prisma.attendance.findMany({
    include: {
      user: {
        include: {
          company: true,
          outlet: true,
        }
      }
    },
    orderBy: { date: "desc" }
  });

  const companies = await prisma.company.findMany({
    orderBy: { name: "asc" }
  });

  const outlets = await prisma.outlet.findMany({
    orderBy: { name: "asc" }
  });

  return (
    <ReportsClient 
      attendanceData={attendanceData}
      companies={companies}
      outlets={outlets}
    />
  );
}
