import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import { revalidatePath } from "next/cache";
import { 
  UserPlus, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  MapPin, 
  Clock, 
  Users, 
  Store,
  ArrowRight,
  Bell,
  CheckCircle2,
  CalendarCheck,
  Briefcase,
  AlertTriangle,
  BarChart3
} from "lucide-react";
import { format, startOfDay } from "date-fns";
import Link from "next/link";
import { AutoSubmit } from "@/components/AutoSubmit";
import { getAllowedOutletIds } from "@/lib/supervisorOutlets";

export default async function SupervisorDashboard({
  searchParams,
}: {
  searchParams: Promise<{ outletId?: string }>;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();
  if (!user || (user.role !== "SUPERVISOR" && user.role !== "ADMIN")) redirect("/staff");

  const companyOutlets = await prisma.outlet.findMany({
    where: { companyId: user.companyId },
    orderBy: { name: "asc" },
  });
  const allowedOutletIds = getAllowedOutletIds(user as any, companyOutlets.map((o) => o.id));
  const requestedOutletId = params.outletId || "";
  const selectedOutletId = allowedOutletIds.includes(requestedOutletId)
    ? requestedOutletId
    : allowedOutletIds.length === 1
      ? allowedOutletIds[0]
      : "";

  const outlets = companyOutlets.filter((o) => allowedOutletIds.includes(o.id));
  const outletWhere =
    selectedOutletId
      ? { outletId: selectedOutletId }
      : allowedOutletIds.length > 0
        ? { outletId: { in: allowedOutletIds } }
        : {};

  const todayStr = format(new Date(), "yyyy-MM-dd");

  const companyStaff = await prisma.user.findMany({
    where: { 
      companyId: user.companyId, 
      role: "STAFF",
      ...outletWhere
    },
    include: { 
      rosters: { 
        where: { date: { gte: startOfDay(new Date()) } },
        take: 1, 
        orderBy: { date: "asc" } 
      },
      attendances: {
        where: { date: todayStr }
      }
    },
    orderBy: { name: "asc" },
  });

  const todayAttendance = await prisma.attendance.findMany({
    where: { 
      date: todayStr,
      user: { 
        companyId: user.companyId,
        ...outletWhere
      }
    },
    include: { user: true }
  });

  const todayLeaves = await prisma.leave.findMany({
    where: {
      status: "APPROVED",
      startDate: { lte: new Date() },
      endDate: { gte: new Date() },
      user: { 
        companyId: user.companyId,
        ...outletWhere
      }
    }
  });

  const pendingLeaves = await prisma.leave.findMany({
    where: { 
      user: { 
        companyId: user.companyId,
        ...outletWhere
      }, 
      status: "PENDING" 
    },
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });

  // Stats calculation
  const stats = {
    present: todayAttendance.filter(a => a.checkIn && !a.checkOut).length,
    offsite: companyStaff.filter(s => s.rosters[0]?.location && s.rosters[0].location !== "Office").length,
    absent: companyStaff.length - todayAttendance.length - todayLeaves.length,
    onLeave: todayLeaves.length
  };

  // Alerts (dummy logic for now)
  const alerts = [
    ...todayAttendance.filter(a => a.isLate).map(a => ({
      type: "LATE",
      message: `${a.user.name} clocked in late today`,
      time: a.checkIn ? format(a.checkIn, "HH:mm") : ""
    })),
    ...companyStaff.filter(s => s.rosters[0]?.location && s.rosters[0].location !== "Office").map(s => ({
      type: "OFFSITE",
      message: `${s.name} is assigned to ${s.rosters[0].location}`,
      time: "Scheduled"
    }))
  ];

  async function approveLeave(formData: FormData) {
    "use server";
    const leaveId = formData.get("leaveId") as string;
    await prisma.leave.update({
      where: { id: leaveId },
      data: { status: "APPROVED" },
    });
    revalidatePath("/supervisor");
  }

  async function rejectLeave(formData: FormData) {
    "use server";
    const leaveId = formData.get("leaveId") as string;
    await prisma.leave.update({
      where: { id: leaveId },
      data: { status: "REJECTED" },
    });
    revalidatePath("/supervisor");
  }

  async function transferStaff(formData: FormData) {
    "use server";
    const userId = formData.get("userId") as string;
    const newDepartment = formData.get("department") as string;
    await prisma.user.update({
      where: { id: userId },
      data: { department: newDepartment },
    });
    revalidatePath("/supervisor");
  }

  async function assignShift(formData: FormData) {
    "use server";
    const userId = formData.get("userId") as string;
    const shift = formData.get("shift") as string;
    const date = new Date(formData.get("date") as string);
    await prisma.roster.create({
      data: { userId, shift, date },
    });
    revalidatePath("/supervisor");
  }

  return (
    <div className="space-y-8">
      {/* Header & Outlet Selector */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <UserPlus className="text-blue-600" size={32} />
            Supervisor Dashboard
          </h1>
          <p className="text-slate-500 mt-1 font-medium">Monitoring {outlets.find(o => o.id === selectedOutletId)?.name || "All Outlets"} at {user.company.name}</p>
        </div>
        
        <div className="w-full md:w-64">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Switch Outlet</label>
          <form method="GET">
            <AutoSubmit>
              <div className="relative">
                <Store className="absolute left-3 top-3 text-slate-400" size={16} />
                <select 
                  name="outletId" 
                  defaultValue={selectedOutletId}
                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer font-bold text-slate-700 dark:text-slate-200 shadow-sm"
                >
                  <option value="">All Managed Outlets</option>
                  {outlets.map(o => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </select>
              </div>
            </AutoSubmit>
          </form>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card-base p-6 bg-white dark:bg-slate-900 border-l-4 border-emerald-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Present Now</p>
              <p className="text-3xl font-black text-slate-900 dark:text-white">{stats.present}</p>
            </div>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-emerald-600">
              <CheckCircle2 size={20} />
            </div>
          </div>
        </div>
        
        <div className="card-base p-6 bg-white dark:bg-slate-900 border-l-4 border-blue-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Off-site</p>
              <p className="text-3xl font-black text-slate-900 dark:text-white">{stats.offsite}</p>
            </div>
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600">
              <MapPin size={20} />
            </div>
          </div>
        </div>

        <div className="card-base p-6 bg-white dark:bg-slate-900 border-l-4 border-red-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Absent</p>
              <p className="text-3xl font-black text-slate-900 dark:text-white">{stats.absent}</p>
            </div>
            <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600">
              <XCircle size={20} />
            </div>
          </div>
        </div>

        <div className="card-base p-6 bg-white dark:bg-slate-900 border-l-4 border-amber-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">On Leave</p>
              <p className="text-3xl font-black text-slate-900 dark:text-white">{stats.onLeave}</p>
            </div>
            <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-amber-600">
              <CalendarCheck size={20} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Live Status & Alerts */}
        <div className="lg:col-span-2 space-y-8">
          {/* Live Status Grid */}
          <div className="card-base overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="text-blue-600" size={18} />
                Live Status Grid
              </h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Real-time Tracking</span>
            </div>
            <div className="p-6 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 max-h-[500px] overflow-y-auto">
              {companyStaff.map((staff) => {
                const attendance = staff.attendances[0];
                const isPresent = attendance?.checkIn && !attendance?.checkOut;
                const isOnLeave = todayLeaves.some(l => l.userId === staff.id);
                const isOffsite = staff.rosters[0]?.location && staff.rosters[0].location !== "Office";

                return (
                  <div key={staff.id} className={`p-4 rounded-2xl border-2 transition-all ${
                    isPresent ? "bg-emerald-50/30 border-emerald-100 dark:border-emerald-900/20" :
                    isOnLeave ? "bg-amber-50/30 border-amber-100 dark:border-amber-900/20" :
                    "bg-slate-50/30 border-slate-100 dark:border-slate-800"
                  }`}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                        isPresent ? "bg-emerald-100 text-emerald-600" :
                        isOnLeave ? "bg-amber-100 text-amber-600" :
                        "bg-slate-100 text-slate-400"
                      }`}>
                        {staff.name[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{staff.name}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase truncate">{staff.department}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex gap-1">
                        {isPresent && <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Present" />}
                        {isOffsite && <div className="w-2 h-2 rounded-full bg-blue-500" title="Off-site" />}
                        {isOnLeave && <div className="w-2 h-2 rounded-full bg-amber-500" title="On Leave" />}
                      </div>
                      <span className="text-[9px] font-black text-slate-500 uppercase">
                        {isPresent ? format(attendance.checkIn!, "HH:mm") : 
                         isOnLeave ? "LEAVE" : "OUT"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Attendance Table (simplified) */}
          <div className="card-base">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="text-blue-600" size={18} />
                Staff Attendance
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
                <thead className="bg-slate-50/50 dark:bg-slate-800/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Staff</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Roster</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Check In/Out</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
                  {companyStaff.map((staff) => (
                    <tr key={staff.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 font-bold text-xs">
                            {staff.name[0]}
                          </div>
                          <span className="text-sm font-bold text-slate-900 dark:text-white">{staff.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {staff.rosters[0] ? (
                          <span className="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-lg">
                            {staff.rosters[0].shift}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">No shift</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-4">
                          <div className="text-center">
                            <p className="text-[9px] font-bold text-slate-400 uppercase">In</p>
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                              {staff.attendances[0]?.checkIn ? format(staff.attendances[0].checkIn, "HH:mm") : "--:--"}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-[9px] font-bold text-slate-400 uppercase">Out</p>
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                              {staff.attendances[0]?.checkOut ? format(staff.attendances[0].checkOut, "HH:mm") : "--:--"}
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Alerts & Quick Actions */}
        <div className="space-y-8">
          {/* Quick Actions */}
          <div className="card-base p-6 bg-blue-600 text-white shadow-xl shadow-blue-500/20">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] opacity-80 mb-6 flex items-center">
              <Briefcase size={14} className="mr-2" />
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 gap-3">
              <Link href="/staff" className="flex items-center justify-between p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all group">
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={18} />
                  <span className="text-sm font-bold">Self Check-in</span>
                </div>
                <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
              </Link>
              <Link href="/admin/roster" className="flex items-center justify-between p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all group">
                <div className="flex items-center gap-3">
                  <Calendar size={18} />
                  <span className="text-sm font-bold">Manage Roster</span>
                </div>
                <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
              </Link>
              <Link href="/admin/reports" className="flex items-center justify-between p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all group">
                <div className="flex items-center gap-3">
                  <BarChart3 size={18} />
                  <span className="text-sm font-bold">View Reports</span>
                </div>
                <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
              </Link>
            </div>
          </div>

          {/* Real-time Alerts */}
          <div className="card-base p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Bell className="text-orange-500" size={18} />
                Recent Alerts
              </h3>
              <span className="text-[10px] font-bold text-orange-600 bg-orange-50 dark:bg-orange-900/20 px-2 py-0.5 rounded-full">
                {alerts.length} NEW
              </span>
            </div>
            <div className="space-y-4">
              {alerts.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-8 h-8 text-slate-100 mx-auto mb-2" />
                  <p className="text-slate-400 text-xs italic">No critical alerts</p>
                </div>
              ) : (
                alerts.map((alert, i) => (
                  <div key={i} className="flex gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 group hover:border-orange-200 transition-colors">
                    <div className={`p-2 rounded-lg flex-shrink-0 ${
                      alert.type === "LATE" ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
                    }`}>
                      {alert.type === "LATE" ? <AlertTriangle size={16} /> : <MapPin size={16} />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{alert.message}</p>
                      <p className="text-[10px] text-slate-500 font-medium">{alert.time}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Pending Leave (Compact) */}
          <div className="card-base p-6">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
              <CalendarCheck className="text-orange-500" size={18} />
              Leave Approvals
            </h3>
            <div className="space-y-4">
              {pendingLeaves.slice(0, 3).map((leave) => (
                <div key={leave.id} className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-[10px] font-bold">
                        {leave.user.name[0]}
                      </div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">{leave.user.name}</span>
                    </div>
                    <div className="flex gap-1">
                      <form action={approveLeave}>
                        <input type="hidden" name="leaveId" value={leave.id} />
                        <button type="submit" className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors">
                          <CheckCircle size={14} />
                        </button>
                      </form>
                      <form action={rejectLeave}>
                        <input type="hidden" name="leaveId" value={leave.id} />
                        <button type="submit" className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors">
                          <XCircle size={14} />
                        </button>
                      </form>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium bg-slate-50 dark:bg-slate-800 p-2 rounded italic line-clamp-2">
                    "{leave.reason}"
                  </p>
                </div>
              ))}
              {pendingLeaves.length > 3 && (
                <button className="w-full py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors">
                  View {pendingLeaves.length - 3} More Requests
                </button>
              )}
              {pendingLeaves.length === 0 && (
                <p className="text-center text-xs text-slate-400 italic py-4">No pending requests</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
