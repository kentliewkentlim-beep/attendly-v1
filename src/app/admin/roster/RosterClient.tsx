"use client";

import { useState } from "react";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Copy, 
  Users, 
  Clock, 
  Save,
  CheckCircle2,
  XCircle,
  AlertCircle
} from "lucide-react";
import { 
  format, 
  startOfWeek, 
  addDays, 
  isSameDay, 
  startOfDay, 
  addWeeks, 
  subWeeks 
} from "date-fns";

export default function RosterClient({ 
  staff, 
  rosters, 
  shiftTemplates,
  onSaveRoster,
  onCopyRoster
}: { 
  staff: any[]; 
  rosters: any[]; 
  shiftTemplates: any[];
  onSaveRoster: (data: any[]) => Promise<void>;
  onCopyRoster: (fromStart: Date, toStart: Date) => Promise<void>;
}) {
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedShift, setSelectedShift] = useState<string>("Day");
  const [isSaving, setIsSaving] = useState(false);
  const [localRosters, setLocalRosters] = useState<any[]>(rosters);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  const handleShiftClick = (userId: string, date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const existingIndex = localRosters.findIndex(r => r.userId === userId && format(new Date(r.date), "yyyy-MM-dd") === dateStr);
    
    let newRosters = [...localRosters];
    if (existingIndex > -1) {
      if (newRosters[existingIndex].shift === selectedShift) {
        newRosters.splice(existingIndex, 1);
      } else {
        newRosters[existingIndex] = { ...newRosters[existingIndex], shift: selectedShift };
      }
    } else {
      newRosters.push({ userId, date, shift: selectedShift });
    }
    setLocalRosters(newRosters);
  };

  const getShiftForUserAndDate = (userId: string, date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return localRosters.find(r => r.userId === userId && format(new Date(r.date), "yyyy-MM-dd") === dateStr);
  };

  const handleSave = async () => {
    setIsSaving(true);
    await onSaveRoster(localRosters);
    setIsSaving(false);
  };

  const handleCopyLastWeek = async () => {
    if (confirm("Copy roster from last week to this week?")) {
      const lastWeekStart = subWeeks(currentWeekStart, 1);
      await onCopyRoster(lastWeekStart, currentWeekStart);
    }
  };

  const shiftTypes = [
    { name: "Day", color: "bg-blue-100 text-blue-700 border-blue-200" },
    { name: "Evening", color: "bg-purple-100 text-purple-700 border-purple-200" },
    { name: "Full", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    { name: "Off", color: "bg-slate-100 text-slate-700 border-slate-200" },
    { name: "Leave", color: "bg-red-100 text-red-700 border-red-200" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <CalendarIcon className="text-blue-600" size={32} />
            Roster Management
          </h1>
          <p className="text-slate-500 mt-1 font-medium">Plan and assign weekly staff schedules</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={handleCopyLastWeek}
            className="btn-secondary h-11 px-6 border-slate-200 dark:border-slate-700 flex items-center gap-2"
          >
            <Copy size={18} />
            <span>Copy Last Week</span>
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="btn-primary h-11 px-8 shadow-lg shadow-blue-500/20 flex items-center gap-2 disabled:opacity-50"
          >
            <Save size={18} />
            <span>{isSaving ? "Saving..." : "Save Changes"}</span>
          </button>
        </div>
      </div>

      {/* Week Selector & Shift Tools */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 card-base p-6 flex flex-col justify-between">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Select Week</p>
          <div className="flex items-center justify-between">
            <button 
              onClick={() => setCurrentWeekStart(subWeeks(currentWeekStart, 1))}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              <ChevronLeft size={24} className="text-slate-600" />
            </button>
            <div className="text-center">
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {format(currentWeekStart, "MMM d")} - {format(addDays(currentWeekStart, 6), "MMM d, yyyy")}
              </p>
              <p className="text-[10px] text-blue-600 font-bold uppercase mt-1">Week {format(currentWeekStart, "w")}</p>
            </div>
            <button 
              onClick={() => setCurrentWeekStart(addWeeks(currentWeekStart, 1))}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              <ChevronRight size={24} className="text-slate-600" />
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 card-base p-6">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Select Shift to Assign</p>
          <div className="flex flex-wrap gap-3">
            {shiftTypes.map((type) => (
              <button
                key={type.name}
                onClick={() => setSelectedShift(type.name)}
                className={`px-6 py-3 rounded-2xl border-2 font-bold text-sm transition-all flex items-center gap-2 ${
                  selectedShift === type.name 
                    ? `${type.color} ring-4 ring-offset-2 ring-blue-500/10` 
                    : "bg-white dark:bg-slate-900 text-slate-400 border-slate-100 dark:border-slate-800"
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${type.color.split(' ')[0]}`} />
                {type.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Roster Table */}
      <div className="card-base overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
            <thead className="bg-slate-50/50 dark:bg-slate-800/50">
              <tr>
                <th className="sticky left-0 z-10 bg-slate-50/50 dark:bg-slate-800/50 px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest border-r border-slate-100 dark:border-slate-800 min-w-[200px]">
                  Staff Member
                </th>
                {weekDays.map((day) => (
                  <th key={day.toString()} className="px-4 py-4 text-center min-w-[120px]">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{format(day, "EEE")}</p>
                    <p className={`text-sm font-black mt-1 ${isSameDay(day, new Date()) ? "text-blue-600" : "text-slate-700 dark:text-slate-300"}`}>
                      {format(day, "d MMM")}
                    </p>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
              {staff.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="sticky left-0 z-10 bg-white dark:bg-slate-900 px-6 py-4 whitespace-nowrap border-r border-slate-100 dark:border-slate-800 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 font-bold text-xs">
                        {member.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{member.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{member.role}</p>
                      </div>
                    </div>
                  </td>
                  {weekDays.map((day) => {
                    const roster = getShiftForUserAndDate(member.id, day);
                    const shiftType = shiftTypes.find(t => t.name === roster?.shift);
                    return (
                      <td 
                        key={day.toString()} 
                        className="px-2 py-3 cursor-pointer group"
                        onClick={() => handleShiftClick(member.id, day)}
                      >
                        <div className={`h-12 w-full rounded-xl flex items-center justify-center transition-all border-2 ${
                          roster 
                            ? `${shiftType?.color} scale-[0.98]` 
                            : "border-dashed border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900 hover:bg-blue-50/50"
                        }`}>
                          <span className="text-[10px] font-black uppercase tracking-wider">
                            {roster ? roster.shift : ""}
                          </span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-6 items-center p-6 card-base bg-slate-50/30">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Shift Legend:</p>
        <div className="flex flex-wrap gap-4">
          {shiftTypes.map(type => (
            <div key={type.name} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${type.color.split(' ')[0]}`} />
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{type.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
