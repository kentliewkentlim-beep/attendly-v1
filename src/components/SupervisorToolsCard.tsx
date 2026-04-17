import prisma from "@/lib/prisma";
import Link from "next/link";
import {
  ShieldCheck,
  Users,
  CalendarCheck,
  CalendarDays,
  Activity,
  Megaphone,
  FileText,
  MoveRight,
} from "lucide-react";

/**
 * Supervisor-only tools card, shown at the top of the staff Home page
 * (/staff/page.tsx) when the viewer has role === "SUPERVISOR" or "ADMIN".
 *
 * Provides quick shortcuts into /supervisor/* management pages plus a
 * live "Leave Approval" pending-count badge so nothing gets missed.
 *
 * Design: purple accent to visually separate it from the rest of the
 * staff-focused Home (which is blue-tinted). Inspired by the
 * supervisor-ui-mockup.html reviewed by Kent.
 */
export default async function SupervisorToolsCard() {
  // Live count of PENDING leave requests awaiting approval.
  const pendingLeaveCount = await prisma.leave.count({
    where: { status: "PENDING" },
  });

  type Tool = {
    href: string;
    label: string;
    subtitle: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    color: string; // tailwind bg + text combo
    badge?: number | string;
  };

  const tools: Tool[] = [
    {
      href: "/supervisor/staff",
      label: "Staff",
      subtitle: "Team members",
      icon: Users,
      color: "text-blue-600 bg-blue-50",
    },
    {
      href: "/supervisor/leave",
      label: "Leave",
      subtitle: "Approval",
      icon: CalendarCheck,
      color: "text-emerald-600 bg-emerald-50",
      badge: pendingLeaveCount > 0 ? pendingLeaveCount : undefined,
    },
    {
      href: "/supervisor/roster",
      label: "Roster",
      subtitle: "Schedule",
      icon: CalendarDays,
      color: "text-orange-600 bg-orange-50",
    },
    {
      href: "/supervisor/tracking",
      label: "Tracking",
      subtitle: "Live status",
      icon: Activity,
      color: "text-pink-600 bg-pink-50",
    },
    {
      href: "/supervisor/announcement",
      label: "Broadcast",
      subtitle: "Announce",
      icon: Megaphone,
      color: "text-amber-600 bg-amber-50",
    },
    {
      href: "/supervisor/report",
      label: "Reports",
      subtitle: "Summary",
      icon: FileText,
      color: "text-indigo-600 bg-indigo-50",
    },
    {
      href: "/supervisor/transfer",
      label: "Transfer",
      subtitle: "Requests",
      icon: MoveRight,
      color: "text-slate-600 bg-slate-100",
    },
  ];

  return (
    <div className="card-base p-5 border-2 border-purple-200 dark:border-purple-900/40 bg-gradient-to-br from-purple-50 via-white to-indigo-50 dark:from-purple-900/10 dark:via-slate-900 dark:to-indigo-900/10">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center text-white flex-shrink-0">
          <ShieldCheck size={16} strokeWidth={2.5} />
        </div>
        <div>
          <p className="text-[10px] font-black text-purple-700 dark:text-purple-300 uppercase tracking-[0.25em]">
            Supervisor Tools
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Quick access to team management
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {tools.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="relative flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all border border-slate-100 dark:border-slate-800"
          >
            <div className={`p-2 rounded-lg ${t.color} flex-shrink-0`}>
              <t.icon size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-black text-slate-700 dark:text-slate-200 truncate">
                {t.label}
              </p>
              <p className="text-[9px] text-slate-400 dark:text-slate-500 font-medium truncate">
                {t.subtitle}
              </p>
            </div>
            {t.badge !== undefined && (
              <span className="absolute -top-1.5 -right-1.5 h-5 min-w-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center ring-2 ring-white dark:ring-slate-900">
                {t.badge}
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
