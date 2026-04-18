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
  MousePointer2,
  Trash2,
  RotateCcw
} from "lucide-react";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  addMonths, 
  subMonths,
  startOfWeek,
  endOfWeek,
  subWeeks
} from "date-fns";
import { getDisplayName, getInitials } from "@/lib/displayName";
import { getLeaveType } from "@/lib/leaveTypes";
import ExportButton from "@/components/ExportButton";

export default function SupervisorRosterClient({ 
  staff, 
  rosters,
  leaves = [],
  shiftTemplates,
  onSaveRoster,
  onCopyRoster
}: { 
  staff: any[]; 
  rosters: any[];
  leaves?: any[];
  shiftTemplates: any[];
  onSaveRoster: (payload: { staffIds: string[]; monthStart: string; monthEnd: string; items: any[] }) => Promise<void>;
  onCopyRoster: (payload: { staffIds: string[]; fromStart: string; toStart: string }) => Promise<void>;
}) {
  // Lookup: for (userId, YYYY-MM-DD) return matching approved leave, if any
  const getLeaveFor = (userId: string, dateStr: string) => {
    return leaves.find((l: any) => {
      if (l.userId !== userId) return false;
      const s = format(new Date(l.startDate), "yyyy-MM-dd");
      const e = format(new Date(l.endDate), "yyyy-MM-dd");
      return dateStr >= s && dateStr <= e;
    });
  };
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedShift, setSelectedShift] = useState<string>(shiftTemplates?.[0]?.name || "Off");
  const [isSaving, setIsSaving] = useState(false);
  const [localRosters, setLocalRosters] = useState<any[]>(
    (rosters || []).map((r: any) => ({ ...r, date: format(new Date(r.date), "yyyy-MM-dd") }))
  );
  const [selectedCells, setSelectedCells] = useState<string[]>([]); // "userId-date"

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const monthStartStr = format(monthStart, "yyyy-MM-dd");
  const monthEndStr = format(monthEnd, "yyyy-MM-dd");
  const monthDateSet = new Set(daysInMonth.map((d) => format(d, "yyyy-MM-dd")));

  const shiftTypes = [
    ...(shiftTemplates || []).map((t: any) => ({
      name: t.name,
      color: "bg-blue-100 text-blue-700 border-blue-200",
      dotColor: t.color || "#2563eb",
    })),
    { name: "Off", color: "bg-slate-100 text-slate-700 border-slate-200", dotColor: "#64748b" },
    { name: "Leave", color: "bg-red-100 text-red-700 border-red-200", dotColor: "#ef4444" },
  ];

  const staffById = new Map(staff.map((s: any) => [s.id, s]));

  const getShiftAbbrev = (name: string) => {
    const t = name.trim().toUpperCase();
    if (t === "OFF") return "OFF";
    if (t === "LEAVE") return "LV";
    const parts = t.split(/\s+/).filter(Boolean);
    const initials = parts.map((p) => p[0]).join("");
    return (initials || t.slice(0, 2)).slice(0, 3);
  };

  const handleCellClick = (userId: string, date: Date, e: React.MouseEvent) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const cellKey = `${userId}-${dateStr}`;

    if (e.metaKey || e.ctrlKey) {
      // Toggle selection
      setSelectedCells(prev => 
        prev.includes(cellKey) ? prev.filter(k => k !== cellKey) : [...prev, cellKey]
      );
    } else {
      // Direct assign
      const existingIndex = localRosters.findIndex((r) => r.userId === userId && r.date === dateStr);
      let newRosters = [...localRosters];
      if (existingIndex > -1) {
        if (newRosters[existingIndex].shift === selectedShift) {
          newRosters.splice(existingIndex, 1);
        } else {
          newRosters[existingIndex] = { ...newRosters[existingIndex], shift: selectedShift };
        }
      } else {
        const member = staffById.get(userId);
        newRosters.push({ userId, date: dateStr, shift: selectedShift, outletId: member?.outletId || null });
      }
      setLocalRosters(newRosters);
      setSelectedCells([]);
    }
  };

  const handleBulkAssign = () => {
    if (selectedCells.length === 0) return;
    
    let newRosters = [...localRosters];
    selectedCells.forEach(cellKey => {
      const [userId, ...rest] = cellKey.split("-");
      const dateStr = rest.join("-");
      const existingIndex = newRosters.findIndex((r) => r.userId === userId && r.date === dateStr);
      
      if (existingIndex > -1) {
        newRosters[existingIndex] = { ...newRosters[existingIndex], shift: selectedShift };
      } else {
        const member = staffById.get(userId);
        newRosters.push({ userId, date: dateStr, shift: selectedShift, outletId: member?.outletId || null });
      }
    });
    
    setLocalRosters(newRosters);
    setSelectedCells([]);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const items = localRosters.filter((r) => monthDateSet.has(r.date));
    await onSaveRoster({
      staffIds: staff.map((s: any) => s.id),
      monthStart: monthStartStr,
      monthEnd: monthEndStr,
      items,
    });
    setIsSaving(false);
  };

  const handleCopyPrevious = async () => {
    if (confirm("Copy roster from last week? This will overwrite existing shifts for the current view's first 7 days.")) {
      const firstDay = daysInMonth[0];
      const prevWeekStart = subWeeks(firstDay, 1);
      await onCopyRoster({
        staffIds: staff.map((s: any) => s.id),
        fromStart: format(prevWeekStart, "yyyy-MM-dd"),
        toStart: format(firstDay, "yyyy-MM-dd"),
      });
    }
  };

  const exportRows = staff
    .flatMap((m: any) =>
      daysInMonth.map((d) => {
        const dateStr = format(d, "yyyy-MM-dd");
        const roster = localRosters.find((r) => r.userId === m.id && r.date === dateStr);
        return {
          Date: dateStr,
          Outlet: m.outlet?.name || "",
          Employee: getDisplayName(m),
          Phone: m.phone || "",
          Shift: roster?.shift || "",
        };
      })
    )
    .filter((r) => r.Shift);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <CalendarIcon className="text-blue-600" size={32} />
            Monthly Roster
          </h1>
          <p className="text-slate-500 mt-1 font-medium">Plan staff schedules for {format(currentMonth, "MMMM yyyy")}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <ExportButton data={exportRows} filename={`supervisor_roster_${monthStartStr}`} />
          <button 
            onClick={handleCopyPrevious}
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

      {/* Month Selector & Tools */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card-base p-6">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Navigation</p>
          <div className="flex items-center justify-between">
            <button 
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              <ChevronLeft size={24} className="text-slate-600" />
            </button>
            <p className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              {format(currentMonth, "MMMM yyyy")}
            </p>
            <button 
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              <ChevronRight size={24} className="text-slate-600" />
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 card-base p-6">
          <div className="flex justify-between items-center mb-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Shift: <span className="text-blue-600">{selectedShift}</span></p>
            {selectedCells.length > 0 && (
              <button 
                onClick={handleBulkAssign}
                className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1 animate-bounce"
              >
                <MousePointer2 size={12} />
                Assign {selectedShift} to {selectedCells.length} cells
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {shiftTypes.map((type) => (
              <button
                key={type.name}
                onClick={() => setSelectedShift(type.name)}
                className={`px-4 py-2 rounded-xl border-2 font-bold text-xs transition-all flex items-center gap-2 ${
                  selectedShift === type.name 
                    ? `${type.color} ring-4 ring-offset-2 ring-blue-500/10` 
                    : "bg-white dark:bg-slate-900 text-slate-400 border-slate-100 dark:border-slate-800"
                }`}
              >
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: (type as any).dotColor || "#2563eb" }} />
                {type.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Roster Grid */}
      <div className="card-base overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead className="bg-slate-50/50 dark:bg-slate-800/50">
              <tr>
                <th className="sticky left-0 z-20 bg-slate-50/50 dark:bg-slate-800/50 px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest border-r border-slate-100 dark:border-slate-800 min-w-[180px]">
                  Staff Member
                </th>
                {daysInMonth.map((day) => (
                  <th key={day.toString()} className={`px-2 py-4 text-center min-w-[45px] border-r border-slate-100 dark:border-slate-800 ${isSameDay(day, new Date()) ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{format(day, "EEE")}</p>
                    <p className={`text-xs font-black mt-0.5 ${isSameDay(day, new Date()) ? "text-blue-600" : "text-slate-700 dark:text-slate-300"}`}>
                      {format(day, "d")}
                    </p>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
              {staff.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50/30 transition-colors">
                  <td className="sticky left-0 z-10 bg-white dark:bg-slate-900 px-6 py-3 whitespace-nowrap border-r border-slate-100 dark:border-slate-800 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-bold text-[10px]">
                        {getInitials(member)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{getDisplayName(member)}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase truncate">{member.department}</p>
                      </div>
                    </div>
                  </td>
                  {daysInMonth.map((day) => {
                    const dateStr = format(day, "yyyy-MM-dd");
                    const cellKey = `${member.id}-${dateStr}`;
                    const roster = localRosters.find((r) => r.userId === member.id && r.date === dateStr);
                    const isSelected = selectedCells.includes(cellKey);
                    const shiftType = shiftTypes.find(t => t.name === roster?.shift);
                    const leaveHit = getLeaveFor(member.id, dateStr);
                    const leaveTypeDef = leaveHit ? getLeaveType(leaveHit.type) : null;
                    const isHalfAM = leaveHit?.durationType === "HALF_DAY_AM";
                    const isHalfPM = leaveHit?.durationType === "HALF_DAY_PM";

                    return (
                      <td 
                        key={day.toString()} 
                        onClick={(e) => handleCellClick(member.id, day, e)}
                        className={`p-1 border-r border-slate-100 dark:border-slate-800 cursor-pointer select-none transition-all ${
                          isSelected ? 'ring-2 ring-inset ring-blue-500 bg-blue-50/50' : ''
                        } ${isSameDay(day, new Date()) ? 'bg-blue-50/20' : ''} ${
                          leaveHit ? 'bg-red-50/70' : ''
                        }`}
                        title={leaveHit ? `On Leave (${leaveTypeDef?.shortLabel}${isHalfAM ? ' · AM' : isHalfPM ? ' · PM' : ''})` : undefined}
                      >
                        <div className={`relative h-8 w-full rounded-lg flex items-center justify-center text-[9px] font-black uppercase transition-all ${
                          leaveHit ? 'bg-red-100 text-red-700 border border-red-200' :
                          roster ? shiftType?.color : 'hover:bg-slate-50'
                        }`}>
                          {leaveHit ? (
                            <span className="flex items-center gap-0.5">
                              {leaveTypeDef?.shortLabel || "LV"}
                              {isHalfAM && <span className="text-[7px]">AM</span>}
                              {isHalfPM && <span className="text-[7px]">PM</span>}
                            </span>
                          ) : (
                            roster ? getShiftAbbrev(roster.shift) : ""
                          )}
                          {leaveHit && roster && (
                            <span className="absolute -bottom-0.5 right-0.5 text-[6px] font-bold text-slate-400 bg-white/80 rounded px-0.5">
                              ({getShiftAbbrev(roster.shift)})
                            </span>
                          )}
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

      {/* Legend & Instructions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card-base p-6 bg-slate-50/30">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Shift Legend</p>
          <div className="flex flex-wrap gap-4">
            {shiftTypes.map(type => (
              <div key={type.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: (type as any).dotColor || "#2563eb" }} />
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{type.name}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card-base p-6 bg-blue-50/30 border-blue-100">
          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-2 flex items-center gap-2">
            <MousePointer2 size={12} />
            Bulk Selection Tip
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Hold <kbd className="px-1.5 py-0.5 rounded border border-slate-200 bg-white text-[10px] font-bold">CMD/CTRL</kbd> and click multiple cells to select them, then use the <strong>Bulk Assign</strong> action to schedule shifts all at once.
          </p>
        </div>
      </div>
    </div>
  );
}
