import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { format, startOfMonth, endOfMonth, addDays } from "date-fns";
import {
  Clock,
  Coffee,
  LogOut,
  LogIn,
  CheckCircle2,
  AlertCircle,
  Megaphone,
  User,
  Calendar,
  MapPinHouse,
  History,
  TrendingUp,
  Wallet,
} from "lucide-react";
import LiveClock from "@/components/LiveClock";
import Link from "next/link";
import LocalDateInput from "@/components/LocalDateInput";
import { headers } from "next/headers";
import { getShortName } from "@/lib/displayName";
import GpsAwareForm from "@/components/GpsAwareForm";
import {
  handleCheckIn,
  handleLunchStart,
  handleLunchEnd,
  handleCheckOut,
  handleAcknowledgeAnnouncement,
} from "./actions";

/**
 * Staff dashboard (Home tab).
 *
 * Changes vs. previous version (Apr 17, 2026 mobile redesign):
 *   - Navbar is rendered by src/app/staff/layout.tsx — removed from this page.
 *   - Server actions moved to src/app/staff/actions.ts — imported here.
 *   - Big center clock-in/out circle button is MOBILE-HIDDEN
 *     (still shown on desktop since desktop has no BottomNav).
 *     Mobile users use the floating center button in <BottomNav /> instead.
 *   - Added top announcement banner (latest unread, amber gradient) as
 *     specified in mobile-nav-mockup.html.
 */
export default async function StaffDashboard({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) || {};
  const error = typeof params.error === "string" ? params.error : "";
  const hdrs = await headers();
  const tz = hdrs.get("x-vercel-ip-timezone") || "Asia/Kuala_Lumpur";
  const nowLocal = new Date(
    new Date().toLocaleString("en-US", { timeZone: tz })
  );
  const todayStr = `${nowLocal.getFullYear()}-${String(
    nowLocal.getMonth() + 1
  ).padStart(2, "0")}-${String(nowLocal.getDate()).padStart(2, "0")}`;
  const user = await prisma.user.findFirst({
    where: { id: (await getCurrentUser())?.id },
    include: {
      company: true,
      outlet: true,
    },
  });

  if (!user) redirect("/");

  const attendance = await prisma.attendance.findUnique({
    where: {
      userId_date: {
        userId: user.id,
        date: todayStr,
      },
    },
  });

  const roster = await prisma.roster.findFirst({
    where: {
      userId: user.id,
      date: {
        gte: new Date(todayStr),
        lt: addDays(new Date(todayStr), 1),
      },
    },
  });

  // Stats for the month
  const monthStart = startOfMonth(new Date());
  const monthEnd = endOfMonth(new Date());

  const monthAttendances = await prisma.attendance.findMany({
    where: {
      userId: user.id,
      date: {
        gte: format(monthStart, "yyyy-MM-dd"),
        lte: format(monthEnd, "yyyy-MM-dd"),
      },
    },
  });

  const stats = {
    presentDays: monthAttendances.filter((a) => a.checkIn).length,
    lateCount: monthAttendances.filter((a) => a.isLate).length,
    leaveBalance: user.leaveBalance,
  };

  const formatTime = (date: Date | null) =>
    date ? format(date, "HH:mm") : "--:--";

  const getStatus = () => {
    if (!attendance?.checkIn)
      return {
        label: "Not Started",
        color: "text-slate-500 bg-slate-100",
        icon: AlertCircle,
        theme: "slate",
      };
    if (!attendance.lunchStart)
      return {
        label: "Working",
        color: "text-blue-600 bg-blue-100",
        icon: Clock,
        theme: "blue",
      };
    if (!attendance.lunchEnd)
      return {
        label: "On Lunch",
        color: "text-orange-600 bg-orange-100",
        icon: Coffee,
        theme: "orange",
      };
    if (!attendance.checkOut)
      return {
        label: "Working",
        color: "text-blue-600 bg-blue-100",
        icon: Clock,
        theme: "blue",
      };
    return {
      label: "Done",
      color: "text-green-600 bg-green-100",
      icon: CheckCircle2,
      theme: "emerald",
    };
  };

  const status = getStatus();

  const getGreeting = () => {
    const hour = nowLocal.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const quickActions = [
    {
      label: "My Profile",
      icon: User,
      href: "/staff/profile",
      color: "text-blue-600 bg-blue-50",
    },
    {
      label: "Schedule",
      icon: Calendar,
      href: "/staff/calendar",
      color: "text-purple-600 bg-purple-50",
    },
    {
      label: "Attendance",
      icon: History,
      href: "/staff/attendance",
      color: "text-emerald-600 bg-emerald-50",
    },
    {
      label: "Leave Hub",
      icon: Wallet,
      href: "/staff/leave",
      color: "text-orange-600 bg-orange-50",
    },
  ];

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
    take: 3,
  });

  // Latest unread announcement — for the top banner
  const unread = announcements.filter(
    (a) => !a.acks || a.acks.length === 0
  );
  const latestUnread = unread[0] || null;
  const totalUnreadCount = unread.length;

  return (
    <main className="max-w-5xl mx-auto py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
      {error && (
        <div className="card-base p-4 mb-6 border border-red-200 bg-red-50 text-red-700 font-bold text-sm">
          {error === "gps_required"
            ? "GPS permission is required for this outlet. Please allow location and try again."
            : error === "gps_outside"
              ? "You are outside the allowed outlet area. Please move closer to the outlet and try again."
              : "Action failed. Please try again."}
        </div>
      )}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6 sm:mb-12">
        <div>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            {getGreeting()}, {getShortName(user)}! 👋
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span
              className={`status-badge ${status.color} px-3 py-1 text-xs font-black uppercase tracking-widest`}
            >
              <status.icon className="w-3.5 h-3.5 mr-1.5" />
              {status.label}
            </span>
            <div className="flex items-center text-sm font-bold text-slate-500 bg-white dark:bg-slate-900 px-3 py-1 rounded-full border border-slate-100 dark:border-slate-800 shadow-sm">
              <MapPinHouse className="w-3.5 h-3.5 mr-1.5 text-blue-500" />
              {user.outlet?.name || "Main Office"}
            </div>
          </div>
        </div>
        <div className="hidden sm:block bg-white dark:bg-slate-900 p-4 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800">
          <LiveClock />
        </div>
      </header>

      {/* Latest announcement banner (mobile-first, also shown on desktop) */}
      {latestUnread && (
        <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 p-4 mb-6 relative overflow-hidden">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-xl bg-amber-500 flex items-center justify-center flex-shrink-0">
              <Megaphone className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] font-black uppercase tracking-widest text-amber-700 bg-amber-200 px-2 py-0.5 rounded-full">
                  New
                </span>
                <span className="text-[10px] font-bold text-amber-700 uppercase">
                  {format(new Date(latestUnread.createdAt), "MMM d")}
                </span>
              </div>
              <p className="font-black text-slate-900 text-sm leading-tight">
                {latestUnread.title}
              </p>
              <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                {latestUnread.content}
              </p>
              <form
                action={handleAcknowledgeAnnouncement}
                className="mt-2 inline-flex items-center gap-2"
              >
                <input
                  type="hidden"
                  name="announcementId"
                  value={latestUnread.id}
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-white bg-amber-600 hover:bg-amber-700 px-3 py-1.5 rounded-full"
                >
                  <CheckCircle2 size={12} /> Acknowledge
                </button>
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-700">
                  {totalUnreadCount > 1
                    ? `+${totalUnreadCount - 1} more — tap 🔔`
                    : ""}
                </span>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions Grid — desktop only (mobile uses bottom nav) */}
      <div className="hidden sm:grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        {quickActions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="card-base p-4 flex flex-col items-center justify-center gap-3 hover:scale-[1.02] hover:shadow-lg transition-all group"
          >
            <div
              className={`p-3 rounded-2xl transition-transform group-hover:scale-110 ${action.color}`}
            >
              <action.icon size={20} />
            </div>
            <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest text-center">
              {action.label}
            </span>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 mb-12">
        {/* Action Center — big button hidden on mobile (replaced by BottomNav) */}
        <div className="lg:col-span-7 space-y-6 sm:space-y-8">
          {/* Today's shift card (always visible) */}
          <div className="card-base p-6 sm:p-10 relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-50 dark:bg-blue-900/10 rounded-full blur-3xl" />
            <div className="relative z-10">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                Today's Shift
              </p>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-2">
                {roster ? roster.shift : "No Shift Assigned"}
              </h2>
              <p className="text-sm font-bold text-blue-600 bg-blue-50 dark:bg-slue-900/30 inline-block px-4 py-1 rounded-full mt-2">
                {roster ? "09:00 AM - 06:00 PM" : "Check with supervisor"}
              </p>

              {/* Big circular clock-in/out button — DESKTOP ONLY */}
              <div className="hidden sm:flex justify-center py-8">
                {!attendance?.checkIn ? (
                  <GpsAwareForm
                    action={handleCheckIn}
                    captureGps={true}
                    requireGps={true}
                  >
                    <LocalDateInput />
                    <button
                      type="submit"
                      className="relative group/btn flex flex-col items-center justify-center w-48 h-48 mx-auto rounded-full bg-blue-600 hover:bg-blue-700 shadow-2xl shadow-blue-500/40 transition-all active:scale-95"
                    >
                      <div className="absolute inset-0 rounded-full border-4 border-white/20 scale-110 group-hover/btn:scale-125 transition-transform duration-500" />
                      <LogIn className="w-12 h-12 text-white mb-2" />
                      <span className="text-white font-black uppercase tracking-widest text-sm">
                        Clock In
                      </span>
                    </button>
                  </GpsAwareForm>
                ) : !attendance.lunchStart ? (
                  <GpsAwareForm action={handleLunchStart} captureGps={false}>
                    <LocalDateInput />
                    <button
                      type="submit"
                      className="relative group/btn flex flex-col items-center justify-center w-48 h-48 mx-auto rounded-full bg-orange-500 hover:bg-orange-600 shadow-2xl shadow-orange-500/40 transition-all active:scale-95"
                    >
                      <div className="absolute inset-0 rounded-full border-4 border-white/20 scale-110 group-hover/btn:scale-125 transition-transform duration-500" />
                      <Coffee className="w-12 h-12 text-white mb-2" />
                      <span className="text-white font-black uppercase tracking-widest text-sm">
                        Start Lunch
                      </span>
                    </button>
                  </GpsAwareForm>
                ) : !attendance.lunchEnd ? (
                  <GpsAwareForm action={handleLunchEnd} captureGps={false}>
                    <LocalDateInput />
                    <button
                      type="submit"
                      className="relative group/btn flex flex-col items-center justify-center w-48 h-48 mx-auto rounded-full bg-emerald-500 hover:bg-emerald-600 shadow-2xl shadow-emerald-500/40 transition-all active:scale-95"
                    >
                      <div className="absolute inset-0 rounded-full border-4 border-white/20 scale-110 group-hover/btn:scale-125 transition-transform duration-500" />
                      <Coffee className="w-12 h-12 text-white mb-2" />
                      <span className="text-white font-black uppercase tracking-widest text-sm">
                        End Lunch
                      </span>
                    </button>
                  </GpsAwareForm>
                ) : !attendance.checkOut ? (
                  <GpsAwareForm action={handleCheckOut} captureGps={true}>
                    <LocalDateInput />
                    <button
                      type="submit"
                      className="relative group/btn flex flex-col items-center justify-center w-48 h-48 mx-auto rounded-full bg-slate-900 hover:bg-black shadow-2xl shadow-slate-900/40 transition-all active:scale-95"
                    >
                      <div className="absolute inset-0 rounded-full border-4 border-white/20 scale-110 group-hover/btn:scale-125 transition-transform duration-500" />
                      <LogOut className="w-12 h-12 text-white mb-2" />
                      <span className="text-white font-black uppercase tracking-widest text-sm">
                        Clock Out
                      </span>
                    </button>
                  </GpsAwareForm>
                ) : (
                  <div className="flex flex-col items-center justify-center w-48 h-48 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-900/20 border-4 border-emerald-100 dark:border-emerald-900/30">
                    <CheckCircle2 className="w-16 h-16 text-emerald-500" />
                    <span className="mt-2 text-emerald-700 dark:text-emerald-400 font-black uppercase tracking-widest text-xs text-center px-4">
                      Shift
                      <br />
                      Complete
                    </span>
                  </div>
                )}
              </div>

              {/* Mobile hint: point to bottom nav */}
              <div className="sm:hidden mt-4 p-3 rounded-xl bg-blue-50 border border-blue-100">
                <p className="text-xs text-blue-800 font-bold text-center">
                  👇 Tap the big blue button at the bottom to{" "}
                  {!attendance?.checkIn
                    ? "Clock In"
                    : !attendance.lunchStart
                      ? "start Lunch"
                      : !attendance.lunchEnd
                        ? "end Lunch"
                        : !attendance.checkOut
                          ? "Clock Out"
                          : "(shift complete)"}
                </p>
              </div>
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="card-base p-6 sm:p-8">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 sm:mb-8 flex items-center">
              <History size={14} className="mr-2 text-blue-500" />
              Today's Activity
            </h3>
            <div className="relative pl-8 space-y-6 sm:space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100 dark:before:bg-slate-800">
              {[
                {
                  label: "Clock In",
                  time: attendance?.checkIn,
                  icon: LogIn,
                  color: "text-blue-600 bg-blue-100",
                },
                {
                  label: "Lunch Start",
                  time: attendance?.lunchStart,
                  icon: Coffee,
                  color: "text-orange-600 bg-orange-100",
                },
                {
                  label: "Lunch End",
                  time: attendance?.lunchEnd,
                  icon: Coffee,
                  color: "text-emerald-600 bg-emerald-100",
                },
                {
                  label: "Clock Out",
                  time: attendance?.checkOut,
                  icon: LogOut,
                  color: "text-slate-600 bg-slate-100",
                },
              ].map((item, i) => (
                <div key={i} className="relative">
                  <div
                    className={`absolute -left-11 w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-white dark:ring-slate-900 ${item.time ? item.color : "bg-slate-50 text-slate-300"}`}
                  >
                    <item.icon size={12} />
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <p
                        className={`text-sm font-bold ${item.time ? "text-slate-900 dark:text-white" : "text-slate-400"}`}
                      >
                        {item.label}
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">
                        {item.time ? "Completed" : "Pending"}
                      </p>
                    </div>
                    <p
                      className={`text-sm font-black tabular-nums ${item.time ? "text-slate-700 dark:text-slate-300" : "text-slate-300"}`}
                    >
                      {item.time
                        ? new Date(item.time).toLocaleTimeString("en-US", {
                            timeZone: tz,
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          })
                        : "--:--"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Side Info & Stats */}
        <div className="lg:col-span-5 space-y-6 sm:space-y-8">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="card-base p-4 sm:p-6 bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100/50">
              <div className="flex justify-between items-start mb-3 sm:mb-4">
                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
                  <TrendingUp size={16} />
                </div>
                <span className="text-[9px] sm:text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                  This Month
                </span>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                {stats.presentDays}
              </p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                Present Days
              </p>
            </div>

            <div className="card-base p-4 sm:p-6 bg-blue-50/50 dark:bg-blue-900/10 border-blue-100/50">
              <div className="flex justify-between items-start mb-3 sm:mb-4">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                  <Wallet size={16} />
                </div>
                <span className="text-[9px] sm:text-[10px] font-black text-blue-600 uppercase tracking-widest">
                  Balance
                </span>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                {stats.leaveBalance}
              </p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                Leave Days
              </p>
            </div>

            <div className="card-base p-4 sm:p-6 bg-red-50/50 dark:bg-red-900/10 border-red-100/50 col-span-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-red-100 text-red-600 rounded-xl">
                    <AlertCircle size={16} />
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                      {stats.lateCount}
                    </p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      Late Arrivals
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">
                    Attention Needed
                  </p>
                  <p className="text-[9px] text-slate-400 font-bold">
                    Try to clock in by 09:00 AM
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Announcements (full list — already acknowledged + remaining) */}
          {announcements.length > 0 && (
            <div className="card-base overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] flex items-center">
                  <Megaphone size={14} className="mr-2 text-blue-600" />
                  Latest Broadcasts
                </h3>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {announcements.map((ann) => (
                  <div
                    key={ann.id}
                    className="p-4 sm:p-6 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all group"
                  >
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-2 group-hover:text-blue-600 transition-colors">
                      {ann.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed italic mb-4">
                      "{ann.content}"
                    </p>
                    {(ann as any).imageUrl && (
                      <img
                        src={(ann as any).imageUrl}
                        alt=""
                        className="mt-3 w-full max-h-56 object-cover rounded-xl border border-slate-200 dark:border-slate-700"
                      />
                    )}
                    <form
                      action={handleAcknowledgeAnnouncement}
                      className="mt-3"
                    >
                      <input
                        type="hidden"
                        name="announcementId"
                        value={ann.id}
                      />
                      {ann.acks && ann.acks.length > 0 ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 rounded-full uppercase tracking-widest">
                          <CheckCircle2 size={12} /> Acknowledged
                        </span>
                      ) : (
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-full uppercase tracking-widest transition-colors"
                        >
                          <CheckCircle2 size={12} /> Acknowledge
                        </button>
                      )}
                    </form>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[8px] font-bold">
                          {ann.author.name[0]}
                        </div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                          {ann.author.name.split(" ")[0]}
                        </span>
                      </div>
                      <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
                        {format(new Date(ann.createdAt), "MMM d")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
