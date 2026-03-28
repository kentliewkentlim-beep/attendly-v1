"use client";

import { useState } from "react";
import { 
  BarChart3, 
  Search, 
  Filter, 
  Calendar,
  Store,
  User,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Download,
  ArrowRight
} from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth } from "date-fns";
import ExportButton from "@/components/ExportButton";

export default function SupervisorReportClient({ 
  attendanceData,
  outlets
}: { 
  attendanceData: any[];
  outlets: any[];
}) {
  const [reportType, setReportType] = useState<"DAILY" | "MONTHLY">("DAILY");
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
  const [selectedOutletId, setSelectedOutletId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredData = attendanceData.filter(record => {
    const recordDate = new Date(record.date);
    
    let matchesTime = false;
    if (reportType === "DAILY") {
      matchesTime = format(recordDate, "yyyy-MM-dd") === selectedDate;
    } else {
      matchesTime = format(recordDate, "yyyy-MM") === selectedMonth;
    }

    const matchesOutlet = !selectedOutletId || record.user.outletId === selectedOutletId;
    const matchesSearch = !searchQuery || 
      record.user.name.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesTime && matchesOutlet && matchesSearch;
  });

  const exportData = filteredData.map(record => ({
    Date: format(new Date(record.date), "yyyy-MM-dd"),
    Employee: record.user.name,
    Phone: record.user.phone,
    Outlet: record.user.outlet?.name || "N/A",
    "Check In": record.checkIn ? format(new Date(record.checkIn), "HH:mm") : "-",
    "Check Out": record.checkOut ? format(new Date(record.checkOut), "HH:mm") : "-",
    Status: record.isLate ? "LATE" : (record.checkIn ? "PRESENT" : "ABSENT")
  }));

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <BarChart3 className="text-blue-600" size={32} />
            Outlet Reports
          </h1>
          <p className="text-slate-500 mt-1 font-medium">Daily and monthly attendance summaries for your team</p>
        </div>
        <ExportButton 
          data={exportData} 
          filename={`Attendance_Report_${reportType}_${reportType === "DAILY" ? selectedDate : selectedMonth}`} 
        />
      </div>

      {/* Report Controls */}
      <div className="card-base p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Report Type</label>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button 
                onClick={() => setReportType("DAILY")}
                className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${
                  reportType === "DAILY" ? "bg-white dark:bg-slate-900 text-blue-600 shadow-sm" : "text-slate-500"
                }`}
              >
                Daily
              </button>
              <button 
                onClick={() => setReportType("MONTHLY")}
                className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${
                  reportType === "MONTHLY" ? "bg-white dark:bg-slate-900 text-blue-600 shadow-sm" : "text-slate-500"
                }`}
              >
                Monthly
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
              {reportType === "DAILY" ? "Select Date" : "Select Month"}
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 text-slate-400" size={16} />
              <input 
                type={reportType === "DAILY" ? "date" : "month"}
                value={reportType === "DAILY" ? selectedDate : selectedMonth}
                onChange={(e) => reportType === "DAILY" ? setSelectedDate(e.target.value) : setSelectedMonth(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Outlet</label>
            <div className="relative">
              <Store className="absolute left-3 top-3 text-slate-400" size={16} />
              <select 
                value={selectedOutletId}
                onChange={(e) => setSelectedOutletId(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 transition-all outline-none appearance-none"
              >
                <option value="">All Managed Outlets</option>
                {outlets.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Search Staff</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 text-slate-400" size={16} />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
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
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  {reportType === "DAILY" ? "Staff Member" : "Date & Staff"}
                </th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Outlet</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">In / Out</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center">
                      <BarChart3 size={48} className="text-slate-200 mb-4" />
                      <p className="text-slate-500 font-medium">No records found for this period</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredData.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 font-bold text-xs">
                          {record.user.name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{record.user.name}</p>
                          {reportType === "MONTHLY" && (
                            <p className="text-[10px] text-slate-500 font-bold">{format(new Date(record.date), "MMM d, yyyy")}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{record.user.outlet?.name || "No Outlet"}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-4">
                        <div className="text-center">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">In</p>
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            {record.checkIn ? format(new Date(record.checkIn), "HH:mm") : "--:--"}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Out</p>
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            {record.checkOut ? format(new Date(record.checkOut), "HH:mm") : "--:--"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {record.isLate ? (
                        <span className="status-badge bg-red-50 text-red-700 border-red-100">
                          <AlertCircle size={12} className="mr-1.5" />
                          LATE
                        </span>
                      ) : record.checkIn ? (
                        <span className="status-badge bg-emerald-50 text-emerald-700 border-emerald-100">
                          <CheckCircle2 size={12} className="mr-1.5" />
                          PRESENT
                        </span>
                      ) : (
                        <span className="status-badge bg-slate-100 text-slate-500 border-slate-200">
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
