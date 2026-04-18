import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { format, subDays, startOfDay } from "date-fns";
import { Users, Clock, CheckCircle, AlertCircle, TrendingUp, PieChart as PieChartIcon, UserPlus, Store, Bell, ArrowUpRight } from "lucide-react";
import { AttendanceTrendChart, CompanyDistributionChart } from "@/components/AdminCharts";
import Link from "next/link";
import { headers } from "next/headers";

export default async function AdminDashboard() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/staff");

  // Use Malaysia timezone so "today" matches the date staff check-in records use
  const hdrs = await headers();
  const tz = hdrs.get("x-vercel-ip-timezone") || "Asia/Kuala_Lumpur";
  const nowLocal = new Date(new Date().toLocaleString("en-US", { timeZone: tz }));
  const today = format(nowLocal, "yyyy-MM-dd");
  const fmtTime = (d: Date | string | null | undefined) =>
    d
      ? new Date(d).toLocaleTimeString("en-GB", {
          timeZone: tz,
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
      : "--:--";

  // Stats
  // Total employees across ALL roles (Admin + Supervisor + Staff), excluding inactive accounts
  const totalEmployees = await prisma.user.count({ where: { status: "ACTIVE" } });
  const attendancesToday = await prisma.attendance.findMany({
    where: { date: today },
    include: { user: true }
  });
  const presentToday = attendancesToday.filter(a => a.checkIn).length;
  const lateToday = attendancesToday.filter(a => a.isLate).length;

  const onLeaveToday = await prisma.leave.count({
    where: {
      startDate: { lte: new Date() },
      endDate: { gte: new Date() },
      status: "APPROVED"
    }
  });

  // Chart Data: Company Distribution
  const companies = await prisma.company.findMany({
    include: { _count: { select: { users: { where: { role: "STAFF" } } } } }
  });
  const distributionData = companies.map(c => ({ name: c.name, value: c._count.users }));

  // Chart Data: Trend (last 7 days) - also use local time
  const last7Days = Array.from({ length: 7 }).map((_, i) => format(subDays(nowLocal, 6 - i), "yyyy-MM-dd"));
  const trendData = await Promise.all(last7Days.map(async (date) => {
    const atts = await prisma.attendance.findMany({ where: { date } });
    return {
      date: format(new Date(date), "MMM d"),
      present: atts.filter(a => a.checkIn).length,
      late: atts.filter(a => a.isLate).length
    };
  }));

  // Recent Activity
  const recentActivities = await prisma.attendance.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: { user: true }
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-slate-500 mt-1">Real-time insights across all companies</p>
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary text-xs h-10 px-4">
            <Bell size={16} className="mr-2" /> Alerts
          </button>
          <div className="h-10 w-px bg-slate-200 dark:bg-slate-800 mx-1" />
          <p className="text-right">
            <span className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Today</span>
            <span className="text-sm font-bold text-slate-900 dark:text-white">{format(nowLocal, "EEEE, MMMM do")}</span>
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Employees" value={totalEmployees} icon={Users} color="blue" trend="+2.5%" />
        <StatCard title="Present Today" value={presentToday} icon={CheckCircle} color="emerald" trend="94%" />
        <StatCard title="On Leave" value={onLeaveToday} icon={AlertCircle} color="orange" trend="3 today" />
        <StatCard title="Late Today" value={lateToday} icon={Clock} color="red" trend="5.2%" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Attendance Trend */}
        <div className="lg:col-span-2 card-base p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-blue-500" />
              Attendance Trends
            </h3>
            <select className="text-xs font-bold bg-slate-50 dark:bg-slate-800 border-none rounded-lg px-3 py-1.5 focus:ring-0">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <AttendanceTrendChart data={trendData} />
        </div>

        {/* Company Distribution */}
        <div className="card-base p-6">
          <h3 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center">
            <PieChartIcon className="w-5 h-5 mr-2 text-indigo-500" />
            Staff Distribution
          </h3>
          <CompanyDistributionChart data={distributionData} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions & Recent Activity */}
        <div className="space-y-8 lg:col-span-1">
          <section className="card-base p-6">
            <h3 className="font-bold text-slate-900 dark:text-white mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/admin/employee" className="flex flex-col items-center justify-center p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 hover:bg-blue-100 transition-colors group">
                <UserPlus className="w-6 h-6 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 text-center">Add Employee</span>
              </Link>
              <Link href="/admin/companies" className="flex flex-col items-center justify-center p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-900/30 hover:bg-purple-100 transition-colors group">
                <Store className="w-6 h-6 text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400 text-center">Manage Outlets</span>
              </Link>
            </div>
          </section>

          <section className="card-base p-6">
            <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center justify-between">
              <span>Recent Activity</span>
              <ArrowUpRight size={14} className="text-slate-400" />
            </h3>
            <div className="space-y-4">
              {recentActivities.map((act) => (
                <div key={act.id} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold">
                    {act.user.name[0]}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{act.user.name}</p>
                    <p className="text-[10px] text-slate-500">Checked In at {fmtTime(act.checkIn)}</p>
                  </div>
                  <span className="ml-auto text-[10px] text-slate-400">{fmtTime(act.createdAt)}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Today's Attendance Table */}
        <div className="lg:col-span-2 card-base overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <h3 className="font-bold text-slate-900 dark:text-white">Today&apos;s Attendance</h3>
            <Link href="/admin/reports" className="text-[10px] font-bold text-blue-600 uppercase tracking-widest hover:underline">View Full Log</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
              <thead className="bg-slate-50/50 dark:bg-slate-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Employee</th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">In/Out</th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
                {attendancesToday.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-10 text-center text-xs text-slate-400 italic">No activity yet today</td>
                  </tr>
                ) : (
                  attendancesToday.map((att) => (
                    <tr key={att.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-slate-900 dark:text-white">{att.user.name}</span>
                          <span className="text-[10px] text-slate-500 uppercase tracking-tighter">{att.user.department}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm tabular-nums font-medium">
                        {fmtTime(att.checkIn)} - {fmtTime(att.checkOut)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`status-badge ${att.isLate ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>
                          {att.isLate ? "Late" : "On Time"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
            }

function StatCard({ title, value, icon: Icon, color, trend }: any) {
  const colors: any = {
    blue: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    emerald: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
    orange: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
    red: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  };

  return (
    <div className="card-interactive p-6">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${colors[color]}`}>
          <Icon size={24} />
        </div>
        <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${trend.includes('+') || trend.includes('%') ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-500'}`}>
          {trend}
        </span>
      </div>
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{title}</p>
        <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">{value}</p>
      </div>
    </div>
  );
}
