"use client";

import { useState } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Info
} from "lucide-react";
import BackButton from "@/components/BackButton";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  addMonths, 
  subMonths,
  isToday,
  getDay
} from "date-fns";

export default function StaffCalendarClient({ rosters }: { rosters: any[] }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getShiftColor = (shift: string) => {
    switch (shift) {
      case "Day": return "bg-emerald-500";
      case "Evening": return "bg-orange-500";
      case "Full": return "bg-purple-500";
      case "Off": return "bg-slate-400";
      case "Leave": return "bg-blue-500";
      default: return "bg-slate-200";
    }
  };

  const getRosterForDay = (date: Date) => {
    return rosters.find(r => isSameDay(new Date(r.date), date));
  };

  const selectedRoster = getRosterForDay(selectedDate);

  // Calendar grid math
  const startDay = getDay(monthStart);
  const blanks = Array.from({ length: startDay === 0 ? 6 : startDay - 1 }, (_, i) => i);

  return (
    <div className="space-y-4">
      <BackButton />
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <CalendarIcon className="text-blue-600" size={32} />
            My Schedule
          </h1>
          <p className="text-slate-500 mt-1 font-medium">Monthly view of your assigned shifts</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Calendar Grid */}
        <div className="lg:col-span-8 card-base p-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider">
              {format(currentMonth, "MMMM yyyy")}
            </h2>
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 mb-2">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => (
              <div key={d} className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest py-2">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {blanks.map(b => <div key={`b-${b}`} className="aspect-square" />)}
            {daysInMonth.map(day => {
              const roster = getRosterForDay(day);
              const isSel = isSameDay(day, selectedDate);
              const isTod = isToday(day);

              return (
                <button
                  key={day.toString()}
                  onClick={() => setSelectedDate(day)}
                  className={`aspect-square relative flex flex-col items-center justify-center rounded-2xl transition-all border ${
                    isSel 
                      ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20" 
                      : isTod
                        ? "bg-blue-50 border-blue-100 text-blue-600"
                        : "bg-white dark:bg-slate-900 border-slate-50 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-blue-200"
                  }`}
                >
                  <span className={`text-sm font-black ${isSel ? "" : "tabular-nums"}`}>{format(day, "d")}</span>
                  {roster && (
                    <div className={`absolute bottom-2 w-1.5 h-1.5 rounded-full ${isSel ? "bg-white" : getShiftColor(roster.shift)}`} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Shift Legend</p>
            <div className="flex flex-wrap gap-4">
              {[
                { name: "Day", color: "bg-emerald-500", time: "10:00 AM - 07:00 PM" },
                { name: "Evening", color: "bg-orange-500", time: "11:00 AM - 08:00 PM" },
                { name: "Full", color: "bg-purple-500", time: "10:00 AM - 07:00 PM" },
                { name: "Off", color: "bg-slate-400", time: "N/A" },
                { name: "Leave", color: "bg-blue-500", time: "N/A" },
              ].map(item => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${item.color}`} />
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tighter">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Selected Day Details */}
        <div className="lg:col-span-4 space-y-6">
          <div className="card-base p-8 relative overflow-hidden group">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-50 dark:bg-blue-900/10 rounded-full blur-2xl" />
            
            <div className="relative z-10">
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-2">Shift Details</p>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6">
                {format(selectedDate, "EEEE, MMM d")}
              </h3>

              {selectedRoster ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${getShiftColor(selectedRoster.shift)}`}>
                      <Clock size={24} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 dark:text-white uppercase">{selectedRoster.shift} Shift</p>
                      <p className="text-xs text-slate-500 font-bold">
                        {selectedRoster.shift === "Day" ? "10:00 AM - 07:00 PM" : 
                         selectedRoster.shift === "Evening" ? "11:00 AM - 08:00 PM" : 
                         selectedRoster.shift === "Full" ? "10:00 AM - 07:00 PM" : 
                         "Not Applicable"}
                      </p>
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center gap-3">
                    <MapPin className="text-blue-500" size={18} />
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reporting To</p>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{selectedRoster.location || "Main Outlet"}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-10 text-center">
                  <Info size={32} className="text-slate-200 mx-auto mb-4" />
                  <p className="text-sm text-slate-400 font-medium italic px-4">No shift scheduled for this date.</p>
                </div>
              )}
            </div>
          </div>

          <div className="card-base p-6 bg-blue-600 text-white shadow-xl shadow-blue-500/20">
            <h4 className="text-xs font-black uppercase tracking-[0.2em] opacity-80 mb-4">Quick Tip</h4>
            <p className="text-xs leading-relaxed opacity-90 font-medium">
              Check your schedule regularly for changes. If you need to swap shifts, please contact your supervisor at least 24 hours in advance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
