"use client";
import { usePathname } from "next/navigation";
import {
  LogOut,
  LayoutDashboard,
  Calendar,
  Settings,
  User,
  Users,
  MoveRight,
  CalendarCheck,
  CalendarDays,
  Activity,
  FileText,
  Megaphone,
  Building2,
  UserCheck,
  Clock3,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";

export default function Navbar({ user }: { user: any }) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const avatarSrc =
    user?.avatarUrl && user?.updatedAt
      ? `${user.avatarUrl}${user.avatarUrl.includes("?") ? "&" : "?"}v=${new Date(user.updatedAt).getTime()}`
      : user?.avatarUrl || null;

  const staffMenuItems = [
    { name: "Dashboard", href: "/staff", icon: LayoutDashboard },
    { name: "Attendance", href: "/staff/attendance", icon: Calendar },
    { name: "Leave", href: "/staff/leave", icon: CalendarCheck },
    { name: "Profile", href: "/staff/profile", icon: User },
  ];

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

  const menuItems =
    user.role === "ADMIN"
      ? adminMenuItems
      : user.role === "SUPERVISOR"
        ? supervisorMenuItems
        : staffMenuItems;

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const primaryItems = menuItems.slice(0, 3);
  const moreItems = menuItems.slice(3);

  return (
    <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-2">
                <span className="text-white font-bold">✓</span>
              </div>
            </div>
            <div className="hidden sm:-my-px sm:ml-8 sm:flex sm:space-x-4">
              {primaryItems.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMoreOpen(false)}
                  className={`${
                    isActive(item.href)
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  } inline-flex items-center px-3 py-2 text-sm font-semibold transition-colors rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 mt-2 h-12`}
                >
                  <item.icon className={`w-4 h-4 mr-2 ${isActive(item.href) ? "text-blue-600" : ""}`} />
                  {item.name}
                </a>
              ))}
              {moreItems.length > 0 && (
                <div className="relative flex items-center">
                  <button
                    type="button"
                    onClick={() => setIsMoreOpen((v) => !v)}
                    className="inline-flex items-center px-3 py-2 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 mt-2 h-12"
                  >
                    More
                    <ChevronDown className="w-4 h-4 ml-1" />
                  </button>
                  {isMoreOpen && (
                    <div className="absolute left-0 top-14 min-w-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-2 z-50">
                      {moreItems.map((item) => (
                        <a
                          key={item.name}
                          href={item.href}
                          onClick={() => setIsMoreOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                            isActive(item.href)
                              ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                              : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                          }`}
                        >
                          <item.icon className="w-4 h-4" />
                          <span className="whitespace-nowrap">{item.name}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center">
            <div className="hidden sm:flex items-center space-x-4">
              <div className="flex flex-col items-end">
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{user.name}</span>
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tighter">
                  {user.role} • {user.department}
                </span>
              </div>
              <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt="Avatar"
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-5 h-5 text-slate-500" />
                )}
              </div>
              <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-2" />
              <form action="/api/logout" method="POST">
                <button
                  type="submit"
                  className="flex items-center px-3 py-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all text-sm font-semibold border border-transparent hover:border-red-200 dark:hover:border-red-900/30"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </button>
              </form>
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center sm:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-slate-500 hover:bg-slate-100 focus:outline-none"
              >
                <span className="sr-only">Open main menu</span>
                <svg className={`${isMenuOpen ? 'hidden' : 'block'} h-6 w-6`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <svg className={`${isMenuOpen ? 'block' : 'hidden'} h-6 w-6`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`${isMenuOpen ? 'block' : 'hidden'} sm:hidden bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800`}>
        <div className="pt-2 pb-3 space-y-1">
          {menuItems.map((item) => (
            <a
              key={item.name}
              href={item.href}
              className={`${
                isActive(item.href)
                  ? "bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-700 dark:text-blue-400"
                  : "border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
              } block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors`}
              onClick={() => setIsMenuOpen(false)}
            >
              <div className="flex items-center">
                <item.icon className="w-5 h-5 mr-3" />
                {item.name}
              </div>
            </a>
          ))}
        </div>
        <div className="pt-4 pb-3 border-t border-slate-200 dark:border-slate-800 px-4">
          <div className="flex items-center mb-3">
            <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt="Avatar"
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <User className="w-5 h-5 text-slate-500" />
              )}
            </div>
            <div className="ml-3">
              <div className="text-base font-medium text-slate-800 dark:text-slate-200">{user.name}</div>
              <div className="text-sm font-medium text-slate-500">{user.role} • {user.department}</div>
            </div>
          </div>
          <form action="/api/logout" method="POST">
            <button
              type="submit"
              className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors"
            >
              <LogOut className="w-5 h-5 mr-2" />
              Sign Out
            </button>
          </form>
        </div>
      </div>
    </nav>
  );
}
