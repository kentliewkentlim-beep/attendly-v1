"use client";

import { useState } from "react";
import { 
  CalendarCheck, 
  Plus, 
  Wallet, 
  History, 
  ChevronRight, 
  XCircle,
  Calendar,
  FileText,
  Paperclip,
  Send,
  AlertCircle
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import {
  LEAVE_TYPE_OPTIONS,
  LEAVE_TYPES,
  DURATION_TYPES,
  getLeaveType,
  leaveDays,
} from "@/lib/leaveTypes";
import type { LeaveTypeCode, DurationType } from "@/lib/leaveTypes";

export default function StaffLeaveClient({ 
  leaveBalance, 
  leaveHistory,
  onApplyLeave 
}: { 
  leaveBalance: number;
  leaveHistory: any[];
  onApplyLeave: (data: any) => Promise<void>;
}) {
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [leaveType, setLeaveType] = useState<LeaveTypeCode>("AL");
  const [durationType, setDurationType] = useState<DurationType>("FULL_DAY");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) return;
    
    setIsSubmitting(true);
    // Half-day must be same-day — snap endDate to startDate
    const effectiveEnd = durationType === "FULL_DAY" ? new Date(endDate) : new Date(startDate);
    await onApplyLeave({
      startDate: new Date(startDate),
      endDate: effectiveEnd,
      type: leaveType,
      durationType,
      reason
    });
    setIsSubmitting(false);
    setIsApplyModalOpen(false);
    setStartDate("");
    setEndDate("");
    setLeaveType("AL");
    setDurationType("FULL_DAY");
    setReason("");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED": return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "REJECTED": return "bg-red-50 text-red-700 border-red-100";
      default: return "bg-amber-50 text-amber-700 border-amber-100";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <CalendarCheck className="text-blue-600" size={32} />
            Leave Management
          </h1>
          <p className="text-slate-500 mt-1 font-medium">Track your balances and apply for time off</p>
        </div>
        <button 
          onClick={() => setIsApplyModalOpen(true)}
          className="btn-primary h-11 px-6 shadow-lg shadow-blue-500/20 flex items-center gap-2"
        >
          <Plus size={18} />
          <span>Apply Leave</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Leave Balance Grid */}
        <div className="lg:col-span-4 space-y-6">
          <div className="card-base p-8 bg-blue-600 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden">
            <Wallet size={64} className="absolute -bottom-4 -right-4 opacity-10 rotate-12" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-2">Total Balance</p>
            <h2 className="text-5xl font-black mb-2">{leaveBalance}</h2>
            <p className="text-sm font-bold opacity-90">Days Remaining</p>
          </div>

          <div className="card-base p-6 space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Leave Types</h3>
            {LEAVE_TYPE_OPTIONS.map(type => (
              <div key={type.code} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${type.dot}`} />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{type.label}</span>
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                  {type.code === "AL" ? `${leaveBalance} left` : type.deducts ? "Deducts" : "No deduct"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Leave History */}
        <div className="lg:col-span-8 space-y-6">
          <div className="card-base overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
              <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] flex items-center">
                <History size={14} className="mr-2 text-blue-600" />
                Request History
              </h3>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {leaveHistory.length === 0 ? (
                <div className="p-12 text-center">
                  <Calendar size={48} className="text-slate-200 mx-auto mb-4" />
                  <p className="text-sm text-slate-400 font-medium italic">No leave history found.</p>
                </div>
              ) : (
                leaveHistory.map((leave) => {
                  const typeDef = getLeaveType(leave.type);
                  const totalDays = leaveDays(leave.startDate, leave.endDate, leave.durationType);
                  const isHalfAM = leave.durationType === "HALF_DAY_AM";
                  const isHalfPM = leave.durationType === "HALF_DAY_PM";
                  return (
                    <div key={leave.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all group">
                      <div className="flex justify-between items-start mb-2">
                        <div className="space-y-1">
                          <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                            {format(new Date(leave.startDate), "MMM d")}
                            {!isHalfAM && !isHalfPM && ` - ${format(new Date(leave.endDate), "MMM d, yyyy")}`}
                            {(isHalfAM || isHalfPM) && `, ${format(new Date(leave.startDate), "yyyy")}`}
                          </h4>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`inline-flex items-center text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${typeDef.badge}`}>
                              {typeDef.shortLabel}
                            </span>
                            {isHalfAM && <span className="inline-flex items-center text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Half · AM</span>}
                            {isHalfPM && <span className="inline-flex items-center text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">Half · PM</span>}
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                              {totalDays} {totalDays === 1 ? "Day" : "Days"}
                            </span>
                          </div>
                        </div>
                        <span className={`status-badge border text-[10px] font-black ${getStatusBadge(leave.status)}`}>
                          {leave.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 italic mt-3 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                        "{leave.reason || "No reason provided"}"
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Apply Leave Modal */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="text-blue-600" size={20} />
                Apply for Leave
              </h3>
              <button onClick={() => setIsApplyModalOpen(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-400">
                <XCircle size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Leave Type</label>
                  <select 
                    required
                    value={leaveType}
                    onChange={(e) => {
                      const v = e.target.value as LeaveTypeCode;
                      setLeaveType(v);
                      // CO must be full day
                      if (v === "CO") setDurationType("FULL_DAY");
                    }}
                    className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                  >
                    {LEAVE_TYPE_OPTIONS.map(t => (
                      <option key={t.code} value={t.code}>{t.code} — {t.label}</option>
                    ))}
                  </select>
                </div>

                {/* Duration: Full Day / Half AM / Half PM */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Duration</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.keys(DURATION_TYPES) as DurationType[]).map((key) => {
                      const d = DURATION_TYPES[key];
                      const disabled = key !== "FULL_DAY" && !LEAVE_TYPES[leaveType].allowHalf;
                      const selected = durationType === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          disabled={disabled}
                          onClick={() => setDurationType(key)}
                          className={`px-3 py-3 rounded-xl text-xs font-black uppercase tracking-wider border transition-all ${
                            selected
                              ? "bg-blue-600 text-white border-blue-600 shadow"
                              : disabled
                                ? "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed"
                                : "bg-white text-slate-600 border-slate-200 hover:border-blue-400"
                          }`}
                        >
                          {d.short}
                        </button>
                      );
                    })}
                  </div>
                  {!LEAVE_TYPES[leaveType].allowHalf && (
                    <p className="text-[10px] text-slate-500 mt-1.5 ml-1">{LEAVE_TYPES[leaveType].label} must be full day</p>
                  )}
                  {durationType !== "FULL_DAY" && (
                    <p className="text-[10px] text-amber-700 font-bold mt-1.5 ml-1">Half-day deducts 0.5 day · start and end must be same date (auto-synced)</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">From</label>
                    <input 
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">To</label>
                    <input 
                      type="date"
                      required
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Reason</label>
                  <textarea 
                    required
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Briefly explain the reason..."
                    className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm h-24 resize-none focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                  />
                </div>

                {leaveType === "MC" && (
                  <div className="p-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-2 group cursor-pointer hover:border-blue-500 transition-all">
                    <Paperclip size={20} className="text-slate-400 group-hover:text-blue-500" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest group-hover:text-blue-600">Attach MC Document</span>
                  </div>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 flex gap-3">
                <AlertCircle size={18} className="text-amber-600 flex-shrink-0" />
                <p className="text-[10px] text-amber-700 font-medium leading-relaxed">
                  Submitting this request will notify your supervisor. Your balance will only be deducted once approved.
                </p>
              </div>

              <button 
                disabled={isSubmitting}
                type="submit"
                className="w-full btn-primary h-14 shadow-xl shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? "Sending..." : (
                  <>
                    <span>Submit Request</span>
                    <Send size={18} />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
