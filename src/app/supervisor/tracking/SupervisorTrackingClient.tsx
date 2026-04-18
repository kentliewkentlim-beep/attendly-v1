"use client";

import { useState, useEffect } from "react";
import { 
  MapPin, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Users, 
  Search,
  Filter,
  Navigation,
  Activity,
  ArrowRight
} from "lucide-react";
import { format } from "date-fns";
import { fmtTimeMY } from "@/lib/datetime";
import { getDisplayName, getInitials, getSecondaryName } from "@/lib/displayName";

export default function SupervisorTrackingClient({ 
  staff,
  attendance,
  alerts
}: { 
  staff: any[];
  attendance: any[];
  alerts: any[];
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"LIST" | "MAP">("LIST");

  const filteredStaff = staff.filter(s => 
    getDisplayName(s).toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.nickname || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.phone.includes(searchQuery)
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <Activity className="text-blue-600" size={32} />
            Live Staff Tracking
          </h1>
          <p className="text-slate-500 mt-1 font-medium">Real-time monitoring of team presence and location</p>
        </div>
        
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
          <button 
            onClick={() => setActiveTab("LIST")}
            className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "LIST" 
                ? "bg-white dark:bg-slate-900 text-blue-600 shadow-sm" 
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            List View
          </button>
          <button 
            onClick={() => setActiveTab("MAP")}
            className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "MAP" 
                ? "bg-white dark:bg-slate-900 text-blue-600 shadow-sm" 
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Map View
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Alerts & Status Summary */}
        <div className="space-y-6">
          <div className="card-base p-6 bg-orange-50/50 border-orange-100">
            <h3 className="font-bold text-orange-900 flex items-center gap-2 mb-4 text-sm">
              <AlertTriangle size={18} />
              Active Alerts
            </h3>
            <div className="space-y-3">
              {alerts.length === 0 ? (
                <p className="text-xs text-orange-600/60 italic py-4 text-center">No active alerts</p>
              ) : (
                alerts.map((alert, i) => (
                  <div key={i} className="p-3 rounded-xl bg-white border border-orange-100 shadow-sm flex gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg text-orange-600 flex-shrink-0">
                      <AlertTriangle size={14} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{alert.message}</p>
                      <p className="text-[10px] text-slate-500 font-medium">{alert.time}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="card-base p-6">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-6 text-sm">
              <Activity size={18} className="text-blue-600" />
              Presence Summary
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30">
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">On-site Now</span>
                <span className="text-lg font-black text-emerald-800 dark:text-emerald-300">{attendance.filter(a => a.checkIn && !a.checkOut).length}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30">
                <span className="text-xs font-bold text-blue-700 dark:text-blue-400">Borrowed/Lent</span>
                <span className="text-lg font-black text-blue-800 dark:text-blue-300">
                  {staff.filter(s => s.rosters[0]?.location === "Borrowed").length}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-500">Not Clocked In</span>
                <span className="text-lg font-black text-slate-700 dark:text-slate-300">
                  {staff.length - attendance.length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: List or Map View */}
        <div className="lg:col-span-2">
          {activeTab === "LIST" ? (
            <div className="space-y-6">
              <div className="card-base p-4">
                <div className="relative group">
                  <Search className="absolute left-3 top-2.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                  <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search name, nickname, phone..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
              </div>

              <div className="card-base overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
                    <thead className="bg-slate-50/50 dark:bg-slate-800/50">
                      <tr>
                        <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Staff Member</th>
                        <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Current Status</th>
                        <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Last Check-in</th>
                        <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Location</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredStaff.map((member) => {
                        const att = member.attendances[0];
                        const roster = member.rosters[0];
                        const isPresent = att?.checkIn && !att?.checkOut;

                        return (
                          <tr key={member.id} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 font-bold text-xs">
                                  {getInitials(member)}
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-slate-900 dark:text-white">{getDisplayName(member)}</p>
                                  {getSecondaryName(member) && (
                                    <p className="text-[11px] text-slate-500">{getSecondaryName(member)}</p>
                                  )}
                                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{member.department}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {isPresent ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter bg-emerald-100 text-emerald-700 border border-emerald-200">
                                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                                  ACTIVE IN
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter bg-slate-100 text-slate-500 border border-slate-200">
                                  OFF DUTY
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                {fmtTimeMY(att?.checkIn)}
                              </p>
                              <p className="text-[10px] text-slate-400 font-medium">
                                {att?.checkIn ? format(new Date(att.checkIn), "MMM d") : "No record today"}
                              </p>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
                                <MapPin size={14} className="text-slate-400" />
                                {roster?.location || "Main Outlet"}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="card-base h-[600px] flex flex-col items-center justify-center bg-slate-50/50 border-2 border-dashed border-slate-200">
              <div className="p-8 rounded-full bg-blue-50 text-blue-600 mb-6">
                <Navigation size={48} className="animate-bounce" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Live Location Map</h3>
              <p className="text-slate-500 text-sm max-w-sm text-center">
                Visualizing real-time staff GPS coordinates and route history. Integration with Google Maps / Mapbox is ready for configuration.
              </p>
              <div className="mt-8 grid grid-cols-2 gap-4">
                {staff.slice(0, 4).map(s => (
                  <div key={s.id} className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-bold text-slate-600">{getDisplayName(s)} (Active)</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
