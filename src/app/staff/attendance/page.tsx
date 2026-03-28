import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import StaffAttendanceClient from "./StaffAttendanceClient";

export default async function StaffAttendancePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const attendances = await prisma.attendance.findMany({
    where: {
      userId: user.id
    },
    orderBy: { date: "desc" }
  });

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <StaffAttendanceClient attendances={attendances} />
    </div>
  );
}
