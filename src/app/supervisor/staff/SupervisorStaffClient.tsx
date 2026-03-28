"use client";

import { useState } from "react";
import { 
  Users, 
  Search, 
  Filter, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  MoreVertical,
  Calendar,
  LogIn
} from "lucide-react";
import { format } from "date-fns";
import { AutoSubmit } from "@/components/AutoSubmit";

export default function SupervisorStaffClient({ 
  staff,
  onManualCheckIn
}: { 
  staff: any[];
  onManualCheckIn: (userId: string) => Promise<void>;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const filteredStaff = staff.filter(member => {
    const attendance = member.attendances[0];
    const isPresent = attendance?.checkIn && !attendance?.checkOut;
    const isLate = attendance?.isLate;
    const isOnLeave = member.leaves.some((l: any) => l.status === "APPROVED");
    
    let status = "Absent";
    if (isPresent) status = "Present";
    if (isLate) status = "Late";
    if (isOnLeave) status = "On Leave";

    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         member.phone.includes(searchQuery);
    const matchesStatus = !statusFilter || status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <Users className="text-blue-600" size={32} />
            Staff Directory
          </h1>
          <p className="text-slate-500 mt-1 font-medium">Manage and monitor your outlet's team</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card-base p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Search Staff</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                <Search size={16} />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or phone..."
                className="block w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Status Filter</label>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer"
            >
              <option value="">All Status</option>
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
              <option value="Late">Late</option>
              <option value="On Leave">On Leave</option>
            </select>
          </div>
        </div>
      </div>

      {/* Staff Table */}
      <div className="card-base overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
            <thead className="bg-slate-50/50 dark:bg-slate-800/50">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Staff Member</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Today's Status</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Work Hours</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Location</th>
                <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-500 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center">
                      <Users size={48} className="text-slate-200 mb-4" />
                      <p className="text-slate-500 font-medium">No staff members found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredStaff.map((member) => {
                  const attendance = member.attendances[0];
                  const roster = member.rosters[0];
                  const isOnLeave = member.leaves.some((l: any) => l.status === "APPROVED");
                  
                  return (
                    <tr key={member.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 font-bold text-sm">
                            {member.name[0]}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">{member.name}</p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{member.department}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          {attendance?.checkIn ? (
                            <div className="flex items-center gap-2">
                              <span className={`status-badge ${attendance.isLate ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                                {attendance.isLate ? <AlertCircle size={12} /> : <CheckCircle2 size={12} />}
                                {attendance.isLate ? 'Late' : 'Present'}
                              </span>
                              <span className="text-[10px] font-bold text-slate-400">{format(new Date(attendance.checkIn), "HH:mm")}</span>
                            </div>
                          ) : isOnLeave ? (
                            <span className="status-badge bg-amber-50 text-amber-700">On Leave</span>
                          ) : (
                            <span className="status-badge bg-slate-100 text-slate-500">Absent</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
                          <Clock size={14} className="text-slate-400" />
                          {attendance?.checkIn && !attendance?.checkOut ? "On Duty" : attendance?.checkOut ? "Shift Ended" : "Not Started"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
                          <MapPin size={14} className="text-slate-400" />
                          {roster?.location || "Main Outlet"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {!attendance?.checkIn && !isOnLeave && (
                          <button 
                            onClick={() => onManualCheckIn(member.id)}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all shadow-lg shadow-blue-500/20"
                          >
                            <LogIn size={12} />
                            Manual In
                          </button>
                        )}
                        <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors ml-2">
                          <MoreVertical size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
