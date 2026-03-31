import prisma from "@/lib/prisma";
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  Download, 
  Upload, 
  MoreVertical,
  Pencil,
  User,
  MapPin,
  Building2,
  ShieldCheck,
  ChevronRight,
  UserX,
  UserCheck
} from "lucide-react";
import Link from "next/link";
import { format, isValid } from "date-fns";
import { AutoSubmit } from "@/components/AutoSubmit";
import ExportButton from "@/components/ExportButton";
import BulkImportModal from "@/components/BulkImportModal";

export default async function EmployeeListPage({
  searchParams,
}: {
  searchParams: Promise<{ 
    q?: string; 
    company?: string; 
    outlet?: string; 
    role?: string; 
    status?: string;
  }>;
}) {
  const params = await searchParams;
  const query = params.q || "";
  const companyFilter = params.company || "";
  const outletFilter = params.outlet || "";
  const roleFilter = params.role || "";
  const statusFilter = params.status || "";

  // Fetch data for filters
  const companies = await prisma.company.findMany({ orderBy: { name: "asc" } });
  const outlets = await prisma.outlet.findMany({ 
    where: companyFilter ? { companyId: companyFilter } : {},
    orderBy: { name: "asc" } 
  });

  // Fetch employees with filters
  const employees = await prisma.user.findMany({
    where: {
      AND: [
        {
          OR: [
            { name: { contains: query } },
            { nickname: { contains: query } },
            { phone: { contains: query } },
            { email: { contains: query } },
          ],
        },
        companyFilter ? { companyId: companyFilter } : {},
        outletFilter ? { outletId: outletFilter } : {},
        roleFilter ? { role: roleFilter } : {},
        statusFilter ? { status: statusFilter } : {},
      ],
    },
    include: {
      company: true,
      outlet: true,
    },
    orderBy: { name: "asc" },
  });

  const exportData = employees.map(emp => ({
    Name: emp.name,
    Nickname: emp.nickname || "N/A",
    Phone: emp.phone,
    Email: emp.email || "N/A",
    Role: emp.role,
    Company: emp.company?.name || "N/A",
    Outlet: emp.outlet?.name || "N/A",
    Department: emp.department || "N/A",
    Task: emp.task || "N/A",
    Status: emp.status,
    Joined: emp.createdAt && isValid(new Date(emp.createdAt)) ? format(new Date(emp.createdAt), "yyyy-MM-dd") : "N/A",
  }));

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center">
            <Users className="mr-3 text-blue-600" size={32} />
            Employee Directory
          </h1>
          <p className="text-slate-500 mt-1 font-medium">Manage and monitor all staff members across the organization</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <BulkImportModal onImport={async (data) => { "use server"; console.log("Importing", data.length); }} />
          <ExportButton data={exportData} filename={`employee_list_${format(new Date(), "yyyyMMdd")}`} />
          <Link href="/admin/employee/add" className="btn-primary h-11 px-6 shadow-lg shadow-blue-500/20">
            <Plus size={18} className="mr-2" />
            Add Employee
          </Link>
        </div>
      </div>

      {/* Filters Card */}
      <div className="card-base p-6">
        <form method="GET" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Search Staff</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                <Search size={16} />
              </div>
              <input
                type="text"
                name="q"
                defaultValue={query}
                  placeholder="Name, Nickname, Phone, Email..."
                className="block w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          <AutoSubmit>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:col-span-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Company</label>
                <select 
                  name="company" 
                  defaultValue={companyFilter}
                  className="block w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer"
                >
                  <option value="">All Companies</option>
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Outlet</label>
                <select 
                  name="outlet" 
                  defaultValue={outletFilter}
                  className="block w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer"
                >
                  <option value="">All Outlets</option>
                  {outlets.map(o => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Role</label>
                <select 
                  name="role" 
                  defaultValue={roleFilter}
                  className="block w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer"
                >
                  <option value="">All Roles</option>
                  <option value="STAFF">Staff</option>
                  <option value="SUPERVISOR">Supervisor</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Status</label>
                <select 
                  name="status" 
                  defaultValue={statusFilter}
                  className="block w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer"
                >
                  <option value="">All Status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
            </div>
          </AutoSubmit>
        </form>
      </div>

      {/* Employee Table */}
      <div className="card-base overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
          <h3 className="font-bold text-slate-900 dark:text-white">Staff List</h3>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{employees.length} Members Found</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
            <thead className="bg-slate-50/50 dark:bg-slate-800/50">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Employee</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Organization</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Role & Dept</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-500 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center">
                      <UserX size={48} className="text-slate-200 mb-4" />
                      <p className="text-slate-500 font-medium">No employees matching your criteria</p>
                      <button className="text-blue-600 text-sm font-bold mt-2 hover:underline">Clear all filters</button>
                    </div>
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 font-bold mr-4 border border-blue-100/50 dark:border-blue-900/30">
                          {emp.name ? emp.name.split(' ').map(n => n[0]).join('').slice(0, 2) : "?"}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">{emp.name || "Unknown"}</p>
                          {emp.nickname && (
                            <p className="text-[11px] text-slate-500">{emp.nickname}</p>
                          )}
                          <p className="text-xs text-slate-500 tabular-nums">{emp.phone || "No Phone"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="flex items-center text-xs text-slate-700 dark:text-slate-300">
                          <Building2 size={12} className="mr-2 text-slate-400" />
                          {emp.company?.name || "N/A"}
                        </div>
                        <div className="flex items-center text-[11px] text-slate-500">
                          <MapPin size={12} className="mr-2 text-slate-400" />
                          {emp.outlet?.name || "Unassigned"}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className={`inline-flex items-center text-[10px] font-black uppercase tracking-widest mb-1 ${
                          emp.role === "ADMIN" ? "text-red-600" :
                          emp.role === "SUPERVISOR" ? "text-purple-600" :
                          "text-blue-600"
                        }`}>
                          {emp.role === "SUPERVISOR" && <ShieldCheck size={10} className="mr-1" />}
                          {emp.role}
                        </span>
                        <span className="text-xs text-slate-500">{emp.department}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`status-badge ${
                        emp.status === "ACTIVE" 
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400" 
                          : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500"
                      }`}>
                        {emp.status === "ACTIVE" ? <UserCheck size={12} className="mr-1.5" /> : <UserX size={12} className="mr-1.5" />}
                        {emp.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <Link 
                          href={`/admin/employee/${emp.id}/edit`}
                          className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-all"
                        >
                          <Pencil size={18} />
                        </Link>
                        <Link 
                          href={`/admin/employee/${emp.id}`}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                        >
                          <User size={18} />
                        </Link>
                        <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-all">
                          <MoreVertical size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
