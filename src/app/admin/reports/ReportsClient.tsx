"use client";

import { useState } from "react";
import { 
  BarChart3, 
  Search, 
  Filter, 
  Calendar,
  Building2,
  Store,
  User,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Download
} from "lucide-react";
import { format, isValid, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import ExportButton from "@/components/ExportButton";
import { fmtTimeMY } from "@/lib/datetime";

export default function ReportsClient({ 
  attendanceData,
  companies,
  outlets
}: { 
  attendanceData: any[];
  companies: any[];
  outlets: any[];
}) {
  const [dateFrom, setDateFrom] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [dateTo, setDateTo] = useState(format(endOfMonth(new Date()), "yyyy-MM-dd"));
  const [companyId, setCompanyId] = useState("");
  const [outletId, setOutletId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredOutlets = companyId 
    ? outlets.filter(o => o.companyId === companyId)
    : outlets;

  const filteredData = attendanceData.filter(record => {
    const recordDate = new Date(record.date);
    const from = new Date(dateFrom);
    const to = new Date(dateTo);
    
    const matchesDate = recordDate >= from && recordDate <= to;
    const matchesCompany = !companyId || record.user.companyId === companyId;
    const matchesOutlet = !outletId || record.user.outletId === outletId;
    const matchesSearch = !searchQuery || 
      record.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.user.phone.includes(searchQuery);

    return matchesDate && matchesCompany && matchesOutlet && matchesSearch;
  });

  const stats = {
    total: filteredData.length,
    present: filteredData.filter(r => !!r.checkIn).length,
    late: filteredData.filter(r => r.isLate).length,
    missing: filteredData.filter(r => !r.checkIn).length
  };

  const exportData = filteredData.map(record => ({
    Date: record.date,
    Employee: record.user.name,
    Phone: record.user.phone,
    Company: record.user.company.name,
    Outlet: record.user.outlet?.name || "N/A",
    "Check In": fmtTimeMY(record.checkIn) || "-",
    "Check Out": fmtTimeMY(record.checkOut) || "-",
    "Lunch Start": fmtTimeMY(record.lunchStart) || "-",
    "Lunch End": fmtTimeMY(record.lunchEnd) || "-",
    Status: record.isLate ? "LATE" : (record.checkIn ? "PRESENT" : "ABSENT")
  }));

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <BarChart3 className="text-blue-600" size={32} />
            Attendance Reports
          </h1>
          <p className="text-slate-500 mt-1 font-medium">Generate and export detailed attendance records</p>
        </div>
        <ExportButton 
          data={exportData} 
          filename={`Attendance_Report_${dateFrom}_to_${dateTo}`} 
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card-base p-6 bg-white dark:bg-slate-900">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Records</p>
          <p className="text-3xl font-black text-slate-900 dark:text-white">{stats.total}</p>
        </div>
        <div className="card-base p-6 bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30">
          <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">Present</p>
          <p className="text-3xl font-black text-emerald-700 dark:text-emerald-300">{stats.present}</p>
        </div>
        <div className="card-base p-6 bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/30">
          <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-1">Late Today</p>
          <p className="text-3xl font-black text-amber-700 dark:text-amber-300">{stats.late}</p>
        </div>
        <div className="card-base p-6 bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30">
          <p className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-widest mb-1">Absent/Missing</p>
          <p className="text-3xl font-black text-red-700 dark:text-red-300">{stats.missing}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card-base p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">From Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 text-slate-400" size={16} />
              <input 
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">To Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 text-slate-400" size={16} />
              <input 
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Company</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-3 text-slate-400" size={16} />
              <select 
                value={companyId}
                onChange={(e) => {
                  setCompanyId(e.target.value);
                  setOutletId("");
                }}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
              >
                <option value="">All Companies</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Outlet</label>
            <div className="relative">
              <Store className="absolute left-3 top-3 text-slate-400" size={16} />
              <select 
                value={outletId}
                onChange={(e) => setOutletId(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
              >
                <option value="">All Outlets</option>
                {filteredOutlets.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Search Staff</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 text-slate-400" size={16} />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Name or phone..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="card-base overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
            <thead className="bg-slate-50/50 dark:bg-slate-800/50">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Date & Staff</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Company & Outlet</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Check In/Out</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Lunch Break</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center">
                      <Search size={48} className="text-slate-200 mb-4" />
                      <p className="text-slate-500 font-medium">No records matching your filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredData.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 font-bold text-sm">
                          {record.user.name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{record.user.name}</p>
                          <p className="text-[10px] text-slate-500 font-bold">{format(new Date(record.date), "EEE, MMM d, yyyy")}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{record.user.company.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{record.user.outlet?.name || "No Outlet"}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-6">
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">In</p>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">
                            {fmtTimeMY(record.checkIn)}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Out</p>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">
                            {fmtTimeMY(record.checkOut)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-6">
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Start</p>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">
                            {fmtTimeMY(record.lunchStart)}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">End</p>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">
                            {fmtTimeMY(record.lunchEnd)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {record.isRemoteCheckin && <span className="status-badge bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400 mr-1.5">REMOTE</span>}
                      {record.isLate ? (
                        <span className="status-badge bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400">
                          <AlertCircle size={12} className="mr-1.5" />
                          LATE
                        </span>
                      ) : record.checkIn ? (
                        <span className="status-badge bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
                          <CheckCircle2 size={12} className="mr-1.5" />
                          PRESENT
                        </span>
                      ) : (
                        <span className="status-badge bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          <XCircle size={12} className="mr-1.5" />
                          ABSENT
                        </span>
                      )}
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
