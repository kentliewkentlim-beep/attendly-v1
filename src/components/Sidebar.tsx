"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  MoveRight, 
  CalendarCheck, 
  CalendarDays, 
  Activity, 
  FileText, 
  Megaphone,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Building2,
  UserCheck,
  Clock3
} from "lucide-react";
import { useState } from "react";

const supervisorMenuItems = [
  { name: "Dashboard", href: "/supervisor", icon: LayoutDashboard },
  { name: "Staff", href: "/supervisor/staff", icon: Users },
  { name: "Staff Transfer", href: "/supervisor/transfer", icon: MoveRight },
  { name: "Leave Approval", href: "/supervisor/leave", icon: CalendarCheck },
  { name: "Roster", href: "/supervisor/roster", icon: CalendarDays },
  { name: "Tracking", href: "/supervisor/tracking", icon: Activity },
  { name: "Report", href: "/supervisor/report", icon: FileText },
  { name: "Announcement", href: "/supervisor/announcement", icon: Megaphone },
];

const adminMenuItems = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Companies and Outlets", href: "/admin/companies", icon: Building2 },
  { name: "Employee", href: "/admin/employee", icon: UserCheck },
  { name: "Leave Management", href: "/admin/leave", icon: CalendarCheck },
  { name: "Roster Management", href: "/admin/roster", icon: CalendarDays },
  { name: "Shift Template", href: "/admin/shift-template", icon: Clock3 },
  { name: "Reports", href: "/admin/reports", icon: FileText },
];

export default function Sidebar({ role }: { role: string }) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = role === "ADMIN" ? adminMenuItems : supervisorMenuItems;

  return (
    <aside 
      className={`bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 flex flex-col h-full sticky top-0 ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      <div className="p-6 flex items-center justify-between">
        {!isCollapsed && (
          <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">
            {role}
          </span>
        )}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-blue-600 transition-colors mx-auto"
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-3 py-3 rounded-xl transition-all group ${
                isActive 
                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shadow-sm" 
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-blue-600" : "text-slate-400 group-hover:text-blue-500"}`} />
              {!isCollapsed && (
                <span className="ml-3 text-sm font-semibold truncate">
                  {item.name}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto space-y-4">
        {!isCollapsed && (
          <div className="bg-blue-600 rounded-2xl p-4 text-white shadow-lg shadow-blue-500/20">
            <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">Help Center</p>
            <p className="text-xs mb-3">Need assistance with the system?</p>
            <button className="w-full bg-white/20 hover:bg-white/30 text-white text-[10px] font-bold py-2 rounded-lg transition-colors backdrop-blur-sm">
              View Guide
            </button>
          </div>
        )}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          <form action="/api/logout" method="POST">
            <button
              type="submit"
              className={`w-full flex items-center p-3 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-600 dark:hover:text-red-400 transition-all group ${
                isCollapsed ? "justify-center" : ""
              }`}
              title={isCollapsed ? "Logout" : ""}
            >
              <LogOut className={`w-5 h-5 flex-shrink-0 ${isCollapsed ? "" : "mr-3"}`} />
              {!isCollapsed && <span className="text-sm font-semibold">Logout</span>}
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}