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
import BackButton from "@/components/BackButton";
import { format, differenceInDays } from "date-fns";

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
  const [leaveType, setLeaveType] = useState("ANNUAL");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) return;
    
    setIsSubmitting(true);
    await onApplyLeave({
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      type: leaveType,
      reason
    });
    setIsSubmitting(false);
    setIsApplyModalOpen(false);
    setStartDate("");
    setEndDate("");
    setLeaveType("ANNUAL");
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
      <BackButton />
      
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
            {[
              { label: "Annual Leave", balance: leaveBalance, color: "bg-emerald-500" },
              { label: "Medical Leave", balance: "14", color: "bg-red-500" },
              { label: "Emergency", balance: "3", color: "bg-orange-500" },
              { label: "Unpaid", balance: "∞", color: "bg-slate-400" },
            ].map(type => (
              <div key={type.label} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${type.color}`} />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{type.label}</span>
                </div>
                <span className="text-xs font-black text-slate-900 dark:text-white">{type.balance} Days</span>
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
                  const days = differenceInDays(new Date(leave.endDate), new Date(leave.startDate)) + 1;
                  return (
                    <div key={leave.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all group">
                      <div className="flex justify-between items-start mb-2">
                        <div className="space-y-1">
                          <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                            {format(new Date(leave.startDate), "MMM d")} - {format(new Date(leave.endDate), "MMM d, yyyy")}
                          </h4>
                          <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{days} Days • {leave.type || "Annual"}</p>
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
                    onChange={(e) => setLeaveType(e.target.value)}
                    className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                  >
                    <option value="ANNUAL">Annual Leave</option>
                    <option value="MEDICAL">Medical Leave (MC)</option>
                    <option value="EMERGENCY">Emergency Leave</option>
                    <option value="UNPAID">Unpaid Leave</option>
                  </select>
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

                {leaveType === "MEDICAL" && (
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
