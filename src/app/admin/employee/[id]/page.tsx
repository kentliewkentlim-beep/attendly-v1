import prisma from "@/lib/prisma";
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Building2, 
  Store, 
  Phone, 
  Mail, 
  Briefcase, 
  ShieldCheck,
  User,
  UserX,
  UserCheck,
  MoreVertical,
  Edit,
  History,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { format, isValid } from "date-fns";
import { revalidatePath } from "next/cache";

export default async function EmployeeProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  const employee = await prisma.user.findUnique({
    where: { id },
    include: {
      company: true,
      outlet: true,
      attendances: {
        take: 10,
        orderBy: { date: "desc" },
      },
      rosters: {
        take: 5,
        orderBy: { date: "desc" },
      }
    }
  });

  if (!employee) notFound();

  async function toggleStatus() {
    "use server";
    const newStatus = employee?.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    await prisma.user.update({
      where: { id },
      data: { status: newStatus }
    });
    revalidatePath(`/admin/employee/${id}`);
    revalidatePath("/admin/employee");
  }

  async function updateNickname(formData: FormData) {
    "use server";
    const nickname = (formData.get("nickname") as string) || null;
    await prisma.user.update({
      where: { id },
      data: { nickname },
    });
    revalidatePath(`/admin/employee/${id}`);
    revalidatePath("/admin/employee");
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link 
            href="/admin/employee" 
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-blue-600 transition-all shadow-sm"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">{employee.name}</h1>
            {employee.nickname && (
              <p className="text-sm font-bold text-slate-500 mt-1">{employee.nickname}</p>
            )}
            <div className="flex items-center gap-2 mt-1">
              <span className={`status-badge ${
                employee.status === "ACTIVE" 
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400" 
                  : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
              }`}>
                {employee.status}
              </span>
              <span className="text-slate-400 text-xs font-medium uppercase tracking-widest">• Joined {employee.createdAt && isValid(new Date(employee.createdAt)) ? format(new Date(employee.createdAt), "MMM yyyy") : "N/A"}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <form action={toggleStatus}>
            <button 
              type="submit"
              className={`btn-secondary h-11 px-4 text-sm font-bold ${
                employee.status === "ACTIVE" ? "hover:text-red-600 hover:bg-red-50" : "hover:text-emerald-600 hover:bg-emerald-50"
              }`}
            >
              {employee.status === "ACTIVE" ? (
                <><UserX size={18} className="mr-2" /> Deactivate</>
              ) : (
                <><UserCheck size={18} className="mr-2" /> Activate</>
              )}
            </button>
          </form>
          <Link
            href={`/admin/employee/${id}/edit`}
            className="btn-primary h-11 px-6 shadow-lg shadow-blue-500/20 inline-flex items-center justify-center"
          >
            <Edit size={18} className="mr-2" />
            Edit Profile
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Details */}
        <div className="space-y-8 lg:col-span-1">
          <section className="card-base p-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center">
              <History size={14} className="mr-2" />
              Information
            </h3>
            <form action={updateNickname} className="mb-6">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nickname</label>
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  name="nickname"
                  defaultValue={employee.nickname || ""}
                  placeholder="Optional"
                  className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
                <button type="submit" className="btn-primary h-11 px-5 whitespace-nowrap">
                  Save
                </button>
              </div>
            </form>
            <div className="space-y-6">
              <DetailItem icon={User} label="Nickname" value={employee.nickname || "Not provided"} />
              <DetailItem icon={Phone} label="Phone Number" value={employee.phone} />
              <DetailItem icon={Mail} label="Email Address" value={employee.email || "Not provided"} />
              <DetailItem icon={Building2} label="Company" value={employee.company?.name || "N/A"} />
              <DetailItem icon={Store} label="Outlet" value={employee.outlet?.name || "Not assigned"} />
              <DetailItem icon={ShieldCheck} label="System Role" value={employee.role} />
              <DetailItem icon={Briefcase} label="Department" value={employee.department || "General"} />
              <DetailItem icon={Clock} label="Primary Task" value={employee.task || "No specific task"} />
            </div>
          </section>

          <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-6">
            <h4 className="text-sm font-bold text-blue-900 dark:text-blue-100 mb-2">Assigned Supervisor</h4>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
                SV
              </div>
              <div>
                <p className="text-sm font-bold text-blue-900 dark:text-blue-100">Supervisor User</p>
                <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase">Main Street Branch</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: History */}
        <div className="lg:col-span-2 space-y-8">
          {/* Attendance History */}
          <section className="card-base overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center">
                <History className="w-5 h-5 mr-2 text-blue-500" />
                Recent Attendance
              </h3>
              <button className="text-[10px] font-bold text-blue-600 uppercase tracking-widest hover:underline">Full History</button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
                <thead className="bg-slate-50/50 dark:bg-slate-800/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Date</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Check In</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Check Out</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
                  {employee.attendances.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-xs text-slate-400 italic">No attendance records yet</td>
                    </tr>
                  ) : (
                    employee.attendances.map((att) => (
                      <tr key={att.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">
                          {format(new Date(att.date), "EEE, MMM d")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm tabular-nums text-slate-600 dark:text-slate-400">
                          {att.checkIn ? format(att.checkIn, "HH:mm") : "--:--"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm tabular-nums text-slate-600 dark:text-slate-400">
                          {att.checkOut ? format(att.checkOut, "HH:mm") : "--:--"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`status-badge ${att.isLate ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
                            {att.isLate ? "Late" : "On Time"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Roster / Schedule */}
          <section className="card-base overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-purple-500" />
                Upcoming Schedule
              </h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {employee.rosters.length === 0 ? (
                <div className="col-span-full py-6 text-center text-xs text-slate-400 italic">No shifts scheduled</div>
              ) : (
                employee.rosters.map((shift) => (
                  <div key={shift.id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-between items-center">
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{format(shift.date, "EEEE, MMM d")}</p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">{shift.shift} SHIFT</p>
                    </div>
                    <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
                      <Clock size={16} className="text-blue-600" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function DetailItem({ icon: Icon, label, value }: any) {
  return (
    <div className="flex items-start gap-4">
      <div className="mt-1 p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-400">
        <Icon size={16} />
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{value}</p>
      </div>
    </div>
  );
}
