import prisma from "@/lib/prisma";
import ReportsClient from "./ReportsClient";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  const [attendanceData, companies, outlets, users, rosters, leaves] =
    await Promise.all([
      prisma.attendance.findMany({
        include: {
          user: {
            include: {
              company: true,
              outlet: true,
            },
          },
        },
        orderBy: { date: "desc" },
      }),
      prisma.company.findMany({ orderBy: { name: "asc" } }),
      prisma.outlet.findMany({ orderBy: { name: "asc" } }),
      prisma.user.findMany({
        where: { status: "ACTIVE" },
        include: { company: true, outlet: true },
        orderBy: { name: "asc" },
      }),
      prisma.roster.findMany({
        select: { userId: true, date: true, shift: true },
      }),
      prisma.leave.findMany({
        where: { status: "APPROVED" },
        select: {
          userId: true,
          type: true,
          startDate: true,
          endDate: true,
          durationType: true,
        },
      }),
    ]);

  return (
    <ReportsClient
      attendanceData={attendanceData}
      companies={companies}
      outlets={outlets}
      users={users}
      rosters={rosters}
      leaves={leaves}
    />
  );
}
