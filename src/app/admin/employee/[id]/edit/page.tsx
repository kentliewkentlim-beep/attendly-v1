import prisma from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";

export default async function EmployeeEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const employee = await prisma.user.findUnique({
    where: { id },
  });

  if (!employee) notFound();

  const companies = await prisma.company.findMany({ orderBy: { name: "asc" } });
  const outlets = await prisma.outlet.findMany({ where: { companyId: employee.companyId }, orderBy: { name: "asc" } });
  const supervisorOutletRows = await (prisma as any).supervisorOutlet
    .findMany({
      where: { supervisorId: employee.id },
    })
    .catch(() => []);
  const supervisorOutletIds = new Set<string>(supervisorOutletRows.map((r: any) => String(r.outletId)));

  async function save(formData: FormData) {
    "use server";

    const name = (formData.get("name") as string) || "";
    const nickname = (formData.get("nickname") as string) || null;
    const email = (formData.get("email") as string) || null;
    const phone = (formData.get("phone") as string) || "";
    const role = (formData.get("role") as string) || "STAFF";
    const department = (formData.get("department") as string) || null;
    const task = (formData.get("task") as string) || null;
    const status = (formData.get("status") as string) || "ACTIVE";
    const companyId = (formData.get("companyId") as string) || "";
    const outletId = (formData.get("outletId") as string) || "";
    const selectedSupervisorOutletIds = formData
      .getAll("supervisorOutletIds")
      .map((v) => String(v));
    const requiresGeofence = formData.get("requiresGeofence") !== "NO";
    await (prisma as any).user.update({
      where: { id },
      data: {
        name,
        nickname,
        email,
        phone,
        role,
        department,
        task,
        status,
        companyId,
        outletId: outletId ? BigInt(outletId as string) : null,
        requiresGeofence,
      },
    });

    if (role === "SUPERVISOR") {
      const validOutlets = await prisma.outlet.findMany({
        where: {
          companyId,
          id: { in: (selectedSupervisorOutletIds as string[]).map((x) => BigInt(x)) },
        },
        select: { id: true },
      });

      await (prisma as any).supervisorOutlet.deleteMany({
        where: { supervisorId: id },
      });

      if (validOutlets.length > 0) {
        await (prisma as any).supervisorOutlet.createMany({
          data: validOutlets.map((o: any) => ({
            supervisorId: id,
            outletId: o.id,
          })),
          skipDuplicates: true,
        });
      }
    } else {
      await (prisma as any).supervisorOutlet
        .deleteMany({
          where: { supervisorId: id },
        })
        .catch(() => {});
    }

    redirect(`/admin/employee/${id}`);
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link
          href={`/admin/employee/${id}`}
          className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-blue-600 transition-all shadow-sm"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Edit Employee
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-1">
            Update profile and assignment details
          </p>
        </div>
      </div>

      <form action={save} className="card-base p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
              Full Name
            </label>
            <input
              type="text"
              name="name"
              defaultValue={employee.name}
              required
              className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
              Nickname
            </label>
            <input
              type="text"
              name="nickname"
              defaultValue={(employee as any).nickname || ""}
              className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
              Phone
            </label>
            <input
              type="tel"
              name="phone"
              defaultValue={employee.phone}
              required
              className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              defaultValue={employee.email || ""}
              className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
              Role
            </label>
            <select
              name="role"
              defaultValue={employee.role}
              className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer"
            >
              <option value="STAFF">Staff</option>
              <option value="PROMOTER">Promoter</option>
              <option value="SUPERVISOR">Supervisor</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
              Status
            </label>
            <select
              name="status"
              defaultValue={employee.status}
              className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer"
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
              Geofence Check-in
            </label>
            <select
              name="requiresGeofence"
              defaultValue={(employee as any).requiresGeofence === false ? "NO" : "YES"}
              className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer"
            >
              <option value="YES">Enforced (10m Geofence)</option>
              <option value="NO">Disabled (Remote Staff)</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
              Company
            </label>
            <select
              name="companyId"
              defaultValue={employee.companyId}
              required
              className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer"
            >
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
              Outlet
            </label>
            <select
              name="outletId"
              defaultValue={employee.outletId?.toString() ?? ""}
              className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer"
            >
              <option value="">Unassigned</option>
              {outlets.map((o) => (
                <option key={o.id.toString()} value={o.id.toString()}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
              Supervisor Controlled Outlets
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {outlets.map((o) => (
                <label
                  key={o.id.toString()}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                >
                  <input
                    type="checkbox"
                    name="supervisorOutletIds"
                    value={o.id.toString()}
                    defaultChecked={supervisorOutletIds.has(o.id.toString())}
                    className="h-4 w-4"
                  />
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{o.name}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Used only when Role is Supervisor. Leave empty to allow the supervisor to see all outlets in the company.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
              Department
            </label>
            <input
              type="text"
              name="department"
              defaultValue={employee.department || ""}
              className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
              Task
            </label>
            <input
              type="text"
              name="task"
              defaultValue={employee.task || ""}
              className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" className="btn-primary h-11 px-6 shadow-lg shadow-blue-500/20">
            <Save size={18} className="mr-2" />
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
