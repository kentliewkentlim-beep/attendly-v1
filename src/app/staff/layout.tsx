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
} from "./actions";

/**
 * Shared layout for all /staff/* pages.
 *
 * Structure:
 *   - Desktop (>= sm): full <Navbar /> at top (sticky)
 *   - Mobile (< sm):   simplified <StaffTopBar /> at top (logo + bell + avatar)
 *                       + <BottomNav /> fixed at bottom (5 tabs + center button)
 *   - {children} wrapped with pb-24 sm:pb-0 so bottom nav doesn't cover content
 *
 * Data fetched here so every child page gets fresh:
 *   - user (with company + outlet)
 *   - today's attendance (for BottomNav center button state)
 *   - announcements (for bell unread badge + bottom sheet)
 */
export default async function StaffLayout({
  children,
}: {
  children: ReactNode;
}) {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) redirect("/");

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
        <Navbar user={user} />
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

      {/* Page content — extra bottom padding on mobile to clear BottomNav */}
      <div className="pb-24 sm:pb-0">{children}</div>

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
