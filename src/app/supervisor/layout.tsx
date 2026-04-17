import type { ReactNode } from "react";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Navbar from "@/components/Navbar";
import StaffTopBar from "@/components/StaffTopBar";
import BottomNav from "@/components/BottomNav";
import {
  handleCheckIn,
  handleLunchStart,
  handleLunchEnd,
  handleCheckOut,
  handleAcknowledgeAnnouncement,
} from "../staff/actions";

/**
 * Shared layout for all /supervisor/* pages.
 *
 * UNIFIED WITH STAFF UI (per Kent's decision 2026-04-17):
 * - Supervisors see the SAME chrome as Staff (TopBar + BottomNav + Clock button).
 * - They can clock in/out the same way â supervisors are employees too.
 * - Role-gated access: only SUPERVISOR or ADMIN can view /supervisor/* pages.
 * - Supervisor-only tools live as a card on /staff (the home) instead of a
 *   separate nav â see <SupervisorToolsCard />.
 *
 * Structure is intentionally identical to src/app/staff/layout.tsx so both
 * role workflows look and behave the same.
 */
export default async function SupervisorLayout({
  children,
}: {
  children: ReactNode;
}) {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) redirect("/");
  if (sessionUser.role !== "SUPERVISOR" && sessionUser.role !== "ADMIN") {
    redirect("/staff");
  }

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    include: { company: true, outlet: true },
  });
  if (!user) redirect("/");

  const hdrs = await headers();
  const tz = hdrs.get("x-vercel-ip-timezone") || "Asia/Kuala_Lumpur";
  const nowLocal = new Date(
    new Date().toLocaleString("en-US", { timeZone: tz })
  );
  const todayStr = `${nowLocal.getFullYear()}-${String(
    nowLocal.getMonth() + 1
  ).padStart(2, "0")}-${String(nowLocal.getDate()).padStart(2, "0")}`;

  const attendance = await prisma.attendance.findUnique({
    where: {
      userId_date: { userId: user.id, date: todayStr },
    },
  });

  const announcements = await prisma.announcement.findMany({
    where: {
      companyId: user.companyId,
      OR: [{ outletId: user.outletId }, { outletId: null }],
    },
    include: {
      author: true,
      outlet: true,
      acks: { where: { userId: user.id } },
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Desktop navbar (hidden on mobile) */}
      <div className="hidden sm:block">
        <Navbar
          user={user}
          announcements={announcements.map((a) => ({
            id: a.id,
            title: a.title,
            content: a.content,
            imageUrl: (a as any).imageUrl,
            createdAt: a.createdAt,
            author: a.author ? { name: a.author.name } : null,
            acks: a.acks,
          }))}
          onAcknowledge={handleAcknowledgeAnnouncement}
        />
      </div>

      {/* Mobile top bar (hidden on desktop) */}
      <StaffTopBar
        user={{
          id: user.id,
          name: user.name,
          avatarUrl: (user as any).avatarUrl,
          updatedAt: user.updatedAt,
        }}
        announcements={announcements.map((a) => ({
          id: a.id,
          title: a.title,
          content: a.content,
          imageUrl: (a as any).imageUrl,
          createdAt: a.createdAt,
          author: a.author ? { name: a.author.name } : null,
          acks: a.acks,
        }))}
        onAcknowledge={handleAcknowledgeAnnouncement}
      />

      {/* Page content â bottom padding clears fixed BottomNav on mobile */}
      <div className="pb-[calc(env(safe-area-inset-bottom)+112px)] sm:pb-0">
        {children}
      </div>

      {/* Mobile bottom nav (hidden on desktop) */}
      <BottomNav
        attendance={attendance}
        handleCheckIn={handleCheckIn}
        handleLunchStart={handleLunchStart}
        handleLunchEnd={handleLunchEnd}
        handleCheckOut={handleCheckOut}
      />
    </div>
  );
}
