import prisma from "@/lib/prisma";
import { 
  UserPlus, 
  ArrowLeft, 
  Save, 
  Phone, 
  Mail, 
  User, 
  Shield, 
  Building2, 
  Store, 
  Briefcase,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export default async function AddEmployeePage() {
  const companies = await prisma.company.findMany({ 
    include: { outlets: true },
    orderBy: { name: "asc" } 
  });

  async function handleSubmit(formData: FormData) {
    "use server";
    
    const name = formData.get("name") as string;
    const nickname = formData.get("nickname") as string;
    const phone = formData.get("phone") as string;
    const email = formData.get("email") as string;
    const role = formData.get("role") as string;
    const companyId = formData.get("companyId") as string;
    const outletId = formData.get("outletId") as string;
    const department = formData.get("department") as string;
    const task = formData.get("task") as string;
    const supervisorOutletIds = formData.getAll("supervisorOutletIds").map((v) => String(v));

    if (!name || !phone || !role || !companyId) {
      return;
    }

    try {
      const created = await prisma.user.create({
        data: {
          name,
          nickname: nickname || null,
          phone,
          email: email || null,
          role,
          companyId,
          outletId: outletId || null,
          department: department || null,
          task: task || null,
          password: "1234", // Default password
        },
      });

      if (role === "SUPERVISOR") {
        const validOutlets = await prisma.outlet.findMany({
          where: { companyId, id: { in: supervisorOutletIds } },
          select: { id: true },
        });
        if (validOutlets.length > 0) {
          await (prisma as any).supervisorOutlet.createMany({
            data: validOutlets.map((o: any) => ({ supervisorId: created.id, outletId: o.id })),
            skipDuplicates: true,
          });
        }
      }
    } catch (error) {
      console.error("Failed to create employee:", error);
      return;
    }

    revalidatePath("/admin/employee");
    redirect("/admin/employee");
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link 
          href="/admin/employee" 
          className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-blue-600 transition-all shadow-sm"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Add New Employee</h1>
          <p className="text-slate-500 text-sm font-medium">Create a new staff account and assign roles</p>
        </div>
      </div>

      <div className="card-base p-8">
        <form action={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <section>
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-600 mb-6 flex items-center">
              <User size={14} className="mr-2" />
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    <User size={18} />
                  </div>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="e.g. John Doe"
                    className="block w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nickname (Optional)</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    <User size={18} />
                  </div>
                  <input
                    type="text"
                    name="nickname"
                    placeholder="e.g. Liew, Kent"
                    className="block w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    <Phone size={18} />
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    required
                    placeholder="e.g. 0123456789"
                    className="block w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email Address (Optional)</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    name="email"
                    placeholder="e.g. john@example.com"
                    className="block w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                  />
                </div>
              </div>
            </div>
          </section>

          <hr className="border-slate-100 dark:border-slate-800" />

          {/* Role & Assignment */}
          <section>
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-600 mb-6 flex items-center">
              <Shield size={14} className="mr-2" />
              Role & Assignment
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Company</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    <Building2 size={18} />
                  </div>
                  <select
                    name="companyId"
                    required
                    className="block w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none appearance-none cursor-pointer"
                  >
                    <option value="">Select Company</option>
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Outlet (Optional)</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    <Store size={18} />
                  </div>
                  <select
                    name="outletId"
                    className="block w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none appearance-none cursor-pointer"
                  >
                    <option value="">Select Outlet</option>
                    {companies.flatMap(c => c.outlets).map(o => (
                      <option key={o.id} value={o.id}>{o.name} ({companies.find(c => c.id === o.companyId)?.name})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Supervisor Controlled Outlets</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {companies.flatMap((c) => c.outlets.map((o) => ({ ...o, companyName: c.name }))).map((o) => (
                    <label
                      key={o.id}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    >
                      <input type="checkbox" name="supervisorOutletIds" value={o.id} className="h-4 w-4" />
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                        {o.name} <span className="text-slate-400">({o.companyName})</span>
                      </span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  Used only when Role is Supervisor. Pick outlets under the selected company.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">System Role</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    <Shield size={18} />
                  </div>
                  <select
                    name="role"
                    required
                    className="block w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none appearance-none cursor-pointer"
                  >
                    <option value="STAFF">Staff Member</option>
                    <option value="SUPERVISOR">Supervisor</option>
                    <option value="ADMIN">Administrator</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Department</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    <Briefcase size={18} />
                  </div>
                  <input
                    type="text"
                    name="department"
                    placeholder="e.g. Retail, Logistics"
                    className="block w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Primary Task / Responsibility</label>
                <input
                  type="text"
                  name="task"
                  placeholder="e.g. Floor Manager, Delivery Driver"
                  className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                />
              </div>
            </div>
          </section>

          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-2xl p-4 flex gap-3">
            <AlertCircle className="text-amber-600 flex-shrink-0" size={20} />
            <p className="text-xs text-amber-700 dark:text-amber-400 font-medium leading-relaxed">
              Default password for new accounts is set to <span className="font-bold underline text-amber-800 dark:text-amber-300">1234</span>. 
              Users will be prompted to change it upon their first successful login.
            </p>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <Link href="/admin/employee" className="btn-secondary h-12 px-8">
              Cancel
            </Link>
            <button type="submit" className="btn-primary h-12 px-10 shadow-lg shadow-blue-500/20">
              <Save size={18} className="mr-2" />
              Save Employee
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
