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

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <StaffCalendarClient rosters={rosters} />
    </div>
  );
}
