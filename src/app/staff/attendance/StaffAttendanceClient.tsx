"use client";

import { useState } from "react";
import { 
  History, 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  TrendingUp,
  BarChart3
} from "lucide-react";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  addMonths, 
  subMonths,
  differenceInMinutes,
  isToday,
  startOfWeek,
  endOfWeek,
  getDay
} from "date-fns";

export default function StaffAttendanceClient({ attendances }: { attendances: any[] }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const calculateHours = (checkIn: Date | null, checkOut: Date | null) => {
    if (!checkIn || !checkOut) return 0;
    const diff = differenceInMinutes(new Date(checkOut), new Date(checkIn));
    return (diff / 60).toFixed(1);
  };

  const monthStats = {
    totalDays: attendances.filter(a => isSameMonth(new Date(a.date), currentMonth)).length,
    totalHours: attendances
      .filter(a => isSameMonth(new Date(a.date), currentMonth) && a.checkIn && a.checkOut)
      .reduce((acc, curr) => acc + parseFloat(calculateHours(curr.checkIn, curr.checkOut) as string), 0)
      .toFixed(1),
    lateCount: attendances.filter(a => isSameMonth(new Date(a.date), currentMonth) && a.isLate).length
  };

  // Calendar grid math
  const startDay = getDay(monthStart);
  const blanks = Array.from({ length: startDay === 0 ? 6 : startDay - 1 }, (_, i) => i);

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <History className="text-blue-600" size={32} />
            Attendance History
          </h1>
          <p className="text-slate-500 mt-1 font-medium">Review your past performance and work hours</p>
        </div>

        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
          <button 
            onClick={() => setViewMode("list")}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              viewMode === "list" 
                ? "bg-white dark:bg-slate-900 text-blue-600 shadow-sm" 
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            List
          </button>
          <button 
            onClick={() => setViewMode("calendar")}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              viewMode === "calendar" 
                ? "bg-white dark:bg-slate-900 text-blue-600 shadow-sm" 
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            Calendar
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card-base p-6 bg-blue-50/50 dark:bg-blue-900/10 border-blue-100">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
              <TrendingUp size={18} />
            </div>
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Monthly</span>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white">{monthStats.totalDays}</p>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Days Present</p>
        </div>

        <div className="card-base p-6 bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
              <Clock size={18} />
            </div>
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Efficiency</span>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white">{monthStats.totalHours}</p>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Total Hours Worked</p>
        </div>

        <div className="card-base p-6 bg-red-50/50 dark:bg-red-900/10 border-red-100">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-red-100 text-red-600 rounded-xl">
              <AlertCircle size={18} />
            </div>
            <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">Alerts</span>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white">{monthStats.lateCount}</p>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Late Arrivals</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Detailed History Table */}
        <div className="lg:col-span-12 card-base overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
            <div className="flex items-center gap-4">
              <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Attendance Logs</h2>
              <div className="flex items-center bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                <button 
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-[10px] font-black uppercase tracking-widest px-4 min-w-[120px] text-center">
                  {format(currentMonth, "MMMM yyyy")}
                </span>
                <button 
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
          
          {viewMode === "list" ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
                <thead className="bg-white dark:bg-slate-900">
                  <tr>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Clock In</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Clock Out</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Work Hours</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
                  {daysInMonth.reverse().map(day => {
                    const att = attendances.find(a => isSameDay(new Date(a.date), day));
                    
                    return (
                      <tr key={day.toString()} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-xs font-bold text-slate-900 dark:text-white">{format(day, "EEE, MMM d")}</p>
                          {isToday(day) && <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest">Today</span>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs font-black text-slate-700 dark:text-slate-300 tabular-nums">
                          {att?.checkIn ? format(new Date(att.checkIn), "hh:mm a") : "--:--"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs font-black text-slate-700 dark:text-slate-300 tabular-nums">
                          {att?.checkOut ? format(new Date(att.checkOut), "hh:mm a") : "--:--"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs font-black text-slate-700 dark:text-slate-300 tabular-nums">
                          {att?.checkIn && att?.checkOut ? `${calculateHours(att.checkIn, att.checkOut)} hrs` : "--"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {att ? (
                            <span className={`status-badge ${att.isLate ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                              {att.isLate ? <AlertCircle size={12} /> : <CheckCircle2 size={12} />}
                              {att.isLate ? 'Late' : 'Present'}
                            </span>
                          ) : (
                            <span className="status-badge bg-slate-100 text-slate-400">
                              <XCircle size={12} />
                              Absent
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8">
              <div className="grid grid-cols-7 mb-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => (
                  <div key={d} className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {blanks.map(b => <div key={`b-${b}`} className="aspect-square" />)}
                {daysInMonth.map(day => {
                  const att = attendances.find(a => isSameDay(new Date(a.date), day));
                  const isTod = isToday(day);
                  
                  return (
                    <div 
                      key={day.toString()}
                      className={`aspect-square rounded-2xl border flex flex-col items-center justify-center relative transition-all ${
                        isTod 
                          ? "bg-blue-50 border-blue-200" 
                          : "bg-white dark:bg-slate-900 border-slate-50 dark:border-slate-800"
                      }`}
                    >
                      <span className={`text-[10px] font-black mb-1 ${isTod ? "text-blue-600" : "text-slate-400"}`}>
                        {format(day, "d")}
                      </span>
                      {att && (
                        <div className={`w-1.5 h-1.5 rounded-full ${att.isLate ? "bg-red-500" : "bg-emerald-500"}`} />
                      )}
                      {att?.checkIn && (
                        <span className="text-[8px] font-bold text-slate-500 mt-0.5 hidden sm:block">
                          {format(new Date(att.checkIn), "HH:mm")}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="mt-8 flex gap-6 border-t border-slate-100 dark:border-slate-800 pt-6">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Present</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Late Arrival</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-slate-200" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Absent / No Record</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function isSameMonth(date1: Date, date2: Date) {
  return date1.getMonth() === date2.getMonth() && date1.getFullYear() === date2.getFullYear();
}
