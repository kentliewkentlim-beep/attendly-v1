import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import StaffCalendarClient from "./StaffCalendarClient";

export default async function StaffCalendarPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const rosters = await prisma.roster.findMany({
    where: {
      userId: user.id
    },
    orderBy: { date: "asc" }
  });

  // Approved leaves so calendar can overlay a "LEAVE" marker on those dates.
  // Pass only the fields the client needs to keep the payload small.
  const leaves = await prisma.leave.findMany({
    where: {
      userId: user.id,
      status: "APPROVED",
    },
    select: {
      id: true,
      startDate: true,
      endDate: true,
      type: true,
      durationType: true,
    },
    orderBy: { startDate: "asc" },
  });

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <StaffCalendarClient rosters={rosters} leaves={leaves} />
    </div>
  );
}
