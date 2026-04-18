import prisma from "@/lib/prisma";
import { fmtIsoDateTimeMY } from "@/lib/datetime";
import { 
  CalendarCheck, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  MoreVertical,
  User,
  Calendar,
  Building2,
  ChevronRight,
  MessageSquare,
  ShieldCheck,
  Users
} from "lucide-react";
import { format, differenceInDays, isValid } from "date-fns";
import { AutoSubmit } from "@/components/AutoSubmit";
import LeaveActionModal from "@/components/LeaveActionModal";
import { getLeaveType, getDuration, leaveDays, LEAVE_TYPES } from "@/lib/leaveTypes";
import ExportButton from "@/components/ExportButton";
import { FileDown } from "lucide-react";
import { revalidatePath } from "next/cache";

export default async function AdminLeavePage({
  searchParams,
}: {
  searchParams: Promise<{ 
    q?: string; 
    status?: string;
  }>;
}) {
  const params = await searchParams;
  const query = params.q || "";
  const statusFilter = params.status || "";

  const leaveRequests = await prisma.leave.findMany({
    where: {
      AND: [
        {
          OR: [
            { user: { name: { contains: query } } },
            { reason: { contains: query } },
          ],
        },
        statusFilter ? { status: statusFilter } : {},
      ],
    },
    include: {
      user: {
        include: { company: true, outlet: true }
      }
    },
    orderBy: { createdAt: "desc" },
  });

  // HR export payload — one row per leave request with all relevant fields
  const exportData = leaveRequests.map((l) => {
    const days = leaveDays(l.startDate, l.endDate, (l as any).durationType);
    return {
      "Employee Name": l.user?.name || "",
      "Nickname": l.user?.nickname || "",
      "Phone": l.user?.phone || "",
      "Email": l.user?.email || "",
      "Role": l.user?.role || "",
      "Department": l.user?.department || "",
      "Task": l.user?.task || "",
      "Company": l.user?.company?.name || "",
      "Outlet": l.user?.outlet?.name || "",
      "Leave Type": getLeaveType(l.type).label,
      "Duration": getDuration((l as any).durationType).label,
      "Start Date":
        l.startDate && isValid(new Date(l.startDate))
          ? format(new Date(l.startDate), "yyyy-MM-dd")
          : "",
      "End Date":
        l.endDate && isValid(new Date(l.endDate))
          ? format(new Date(l.endDate), "yyyy-MM-dd")
          : "",
      "Days": days,
      "Reason": l.reason || "",
      "Status": l.status || "",
      "Supervisor Note": l.supervisorNote || "",
      "Applied Date":
        l.createdAt && isValid(new Date(l.createdAt))
          ? fmtIsoDateTimeMY(l.createdAt)
          : "",
      "Remaining Balance (days)": l.user?.leaveBalance ?? 0,
    };
  });

  async function handleLeaveAction(id: string, status: string, note: string) {
    "use server";
    const leave = await prisma.leave.findUnique({
      where: { id },
      include: { user: true }
    });
    if (!leave) return;

    const typeDef = getLeaveType(leave.type);
    const days = leaveDays(leave.startDate, leave.endDate, (leave as any).durationType);
    const wasApproved = leave.status === "APPROVED";
    const willBeApproved = status === "APPROVED";

    // Balance: AL/MC/EL deduct; UL/CO do not. Only APPROVED deducts.
    if (typeDef.deducts) {
      if (!wasApproved && willBeApproved) {
        await prisma.user.update({
          where: { id: leave.userId },
          data: { leaveBalance: { decrement: days } }
        });
      } else if (wasApproved && !willBeApproved) {
        // Refund balance when un-approving
        await prisma.user.update({
          where: { id: leave.userId },
          data: { leaveBalance: { increment: days } }
        });
      }
    }

    await prisma.leave.update({
      where: { id },
      data: { 
        status, 
        supervisorNote: note 
      }
    });
    revalidatePath("/admin/leave");
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400";
      case "REJECTED":
        return "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400";
      default:
        return "bg-amber-50 text-orange-700 dark:bg-amber-900/20 dark:text-orange-400";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <CheckCircle2 size={12} className="mr-1.5" />;
      case "REJECTED":
        return <XCircle size={12} className="mr-1.5" />;
      default:
        return <Clock size={12} className="mr-1.5" />;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center">
            <CalendarCheck className="mr-3 text-blue-600" size={32} />
            Leave Management
          </h1>
          <p className="text-slate-500 mt-1 font-medium">Review and manage employee leave requests and balances</p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButton
            data={exportData}
            filename={`leave_report_${format(new Date(), "yyyyMMdd")}`}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="card-base p-6">
        <form method="GET" className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Search Requests</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                <Search size={16} />
              </div>
              <input
                type="text"
                name="q"
                defaultValue={query}
                placeholder="Employee name or reason..."
                className="block w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          <AutoSubmit>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Status</label>
              <select 
                name="status" 
                defaultValue={statusFilter}
                className="block w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer"
              >
                <option value="">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </AutoSubmit>
        </form>
      </div>

      {/* Requests Table */}
      <div className="card-base overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
          <h3 className="font-bold text-slate-900 dark:text-white">Leave Requests</h3>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{leaveRequests.length} Requests Found</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
            <thead className="bg-slate-50/50 dark:bg-slate-800/50">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Employee</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Dates & Duration</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Reason & Notes</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-500 uppercase tracking-widest">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
              {leaveRequests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center">
                      <Calendar size={48} className="text-slate-200 mb-4" />
                      <p className="text-slate-500 font-medium">No leave requests found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                leaveRequests.map((leave) => {
                  const typeDef = getLeaveType(leave.type);
                  const durAny = (leave as any).durationType;
                  const days = leaveDays(leave.startDate, leave.endDate, durAny);
                  const isHalfAM = durAny === "HALF_DAY_AM";
                  const isHalfPM = durAny === "HALF_DAY_PM";
                  return (
                    <tr key={leave.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-600 font-bold mr-4 border border-orange-100/50 dark:border-orange-900/30">
                            {leave.user?.name?.[0] || "?"}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">{leave.user?.name || "Unknown"}</p>
                            <p className="text-[10px] text-slate-500 uppercase font-bold">{leave.user?.company?.name || "No Company"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1.5">
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            {format(new Date(leave.startDate), "MMM d")}
                            {!isHalfAM && !isHalfPM && ` - ${format(new Date(leave.endDate), "MMM d, yyyy")}`}
                            {(isHalfAM || isHalfPM) && `, ${format(new Date(leave.startDate), "yyyy")}`}
                          </p>
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className={`inline-flex items-center text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${typeDef.badge}`}>
                              {typeDef.shortLabel}
                            </span>
                            {isHalfAM && <span className="inline-flex items-center text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Half · AM</span>}
                            {isHalfPM && <span className="inline-flex items-center text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">Half · PM</span>}
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                              {days} {days === 1 ? "Day" : "Days"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <div className="max-w-sm space-y-1">
                          <p className="text-xs text-slate-600 dark:text-slate-400 italic whitespace-pre-wrap break-words">"{leave.reason || "No reason"}"</p>
                          {leave.supervisorNote && (
                            <p className="text-[10px] text-blue-600 dark:text-blue-400 font-medium flex items-start gap-1 mt-2 whitespace-pre-wrap break-words">
                              <MessageSquare size={10} className="mt-0.5 flex-shrink-0" />
                              <span>{leave.supervisorNote}</span>
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`status-badge ${getStatusBadge(leave.status)}`}>
                          {getStatusIcon(leave.status)}
                          {leave.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right align-top">
                        <div className="flex items-center justify-end gap-2">
                          <LeaveActionModal leave={leave} onAction={handleLeaveAction} />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Leave Balances Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 card-base p-6 bg-blue-600 text-white shadow-xl shadow-blue-500/20">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] opacity-80 mb-6 flex items-center">
            <AlertCircle size={14} className="mr-2" />
            Quick Policy Tip
          </h3>
          <p className="text-sm font-medium leading-relaxed">
            Standard annual leave balance is set to <span className="font-bold underline">14 days</span> per year. 
            Balance is automatically updated upon approval of requests.
          </p>
          <div className="mt-8 pt-6 border-t border-white/10">
            <button className="w-full bg-white/20 hover:bg-white/30 text-white text-xs font-bold py-3 rounded-xl transition-colors backdrop-blur-sm">
              Configure Leave Policies
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 card-base overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center">
              <Users className="w-4 h-4 mr-2 text-blue-500" />
              Employee Leave Balances
            </h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto">
            {leaveRequests
              .map(leave => leave.user)
              .filter((v, i, a): v is NonNullable<typeof v> => !!v && a.findIndex(t => t?.id === v.id) === i)
              .map((emp) => (
              <div key={emp.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-bold text-xs">
                    {emp.name?.[0] || "?"}
                  </div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{emp.name || "Unknown"}</span>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-slate-900 dark:text-white">{emp.leaveBalance ?? 0} Days</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Remaining</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
