import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import StaffAttendanceClient from "./StaffAttendanceClient";

/**
 * Staff attendance history page.
 *
 * NOTE (Apr 17, 2026): Limited to the last 12 months of records.
 * Previously loaded all-time records which grew unbounded.
 */
export default async function StaffAttendancePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
  const cutoff = twelveMonthsAgo.toISOString().split("T")[0]; // YYYY-MM-DD

  const attendances = await prisma.attendance.findMany({
    where: {
      userId: user.id,
      date: { gte: cutoff },
    },
    orderBy: { date: "desc" },
  });

  return (
    <div className="max-w-5xl mx-auto py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
      <StaffAttendanceClient attendances={attendances} />
    </div>
  );
}
