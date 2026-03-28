"use client";

import { useState } from "react";
import { 
  CalendarCheck, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  MoreVertical,
  User,
  Calendar,
  MessageSquare,
  Plus,
  ArrowRight
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import LeaveActionModal from "@/components/LeaveActionModal";

export default function SupervisorLeaveClient({ 
  staff,
  leaveRequests,
  onLeaveAction,
  onApplyLeave
}: { 
  staff: any[];
  leaveRequests: any[];
  onLeaveAction: (id: string, status: string, note: string) => Promise<void>;
  onApplyLeave: (data: any) => Promise<void>;
}) {
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [searchQuery, setSearchQuery] = useState("");
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

  // Form state for applying leave
  const [applyStaffId, setApplyStaffId] = useState("");
  const [applyStartDate, setApplyStartDate] = useState("");
  const [applyEndDate, setApplyEndDate] = useState("");
  const [applyReason, setApplyReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredRequests = leaveRequests.filter(req => {
    const matchesStatus = statusFilter === "ALL" || req.status === statusFilter;
    const matchesSearch = req.user.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const stats = {
    pending: leaveRequests.filter(r => r.status === "PENDING").length,
    approved: leaveRequests.filter(r => r.status === "APPROVED").length,
    rejected: leaveRequests.filter(r => r.status === "REJECTED").length,
    onLeaveToday: staff.filter(s => s.leaves.length > 0).length
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyStaffId || !applyStartDate || !applyEndDate) return;
    
    setIsSubmitting(true);
    await onApplyLeave({
      userId: applyStaffId,
      startDate: new Date(applyStartDate),
      endDate: new Date(applyEndDate),
      reason: applyReason,
      status: "APPROVED" // Supervisor applied leave is auto-approved
    });
    setIsSubmitting(false);
    setIsApplyModalOpen(false);
    setApplyStaffId("");
    setApplyStartDate("");
    setApplyEndDate("");
    setApplyReason("");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED": return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "REJECTED": return "bg-red-50 text-red-700 border-red-100";
      default: return "bg-amber-50 text-amber-700 border-amber-100";
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <CalendarCheck className="text-blue-600" size={32} />
            Leave Approvals
          </h1>
          <p className="text-slate-500 mt-1 font-medium">Review and manage team leave requests</p>
        </div>
        <button 
          onClick={() => setIsApplyModalOpen(true)}
          className="btn-primary h-11 px-6 shadow-lg shadow-blue-500/20 flex items-center gap-2"
        >
          <Plus size={18} />
          <span>Apply for Staff</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card-base p-6 border-l-4 border-amber-500">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Pending</p>
          <p className="text-3xl font-black text-slate-900 dark:text-white">{stats.pending}</p>
        </div>
        <div className="card-base p-6 border-l-4 border-emerald-500">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Approved</p>
          <p className="text-3xl font-black text-slate-900 dark:text-white">{stats.approved}</p>
        </div>
        <div className="card-base p-6 border-l-4 border-red-500">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Rejected</p>
          <p className="text-3xl font-black text-slate-900 dark:text-white">{stats.rejected}</p>
        </div>
        <div className="card-base p-6 border-l-4 border-blue-500 bg-blue-50/30">
          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">On Leave Today</p>
          <p className="text-3xl font-black text-blue-700 dark:text-blue-400">{stats.onLeaveToday}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card-base p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Search Requests</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                <Search size={16} />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Employee name..."
                className="block w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Status</label>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer"
            >
              <option value="PENDING">Pending Only</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="ALL">All Requests</option>
            </select>
          </div>
        </div>
      </div>

      {/* Requests Table */}
      <div className="card-base overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
            <thead className="bg-slate-50/50 dark:bg-slate-800/50">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Employee</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Dates & Days</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Reason</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-500 uppercase tracking-widest">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center">
                      <Calendar size={48} className="text-slate-200 mb-4" />
                      <p className="text-slate-500 font-medium">No leave requests found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => {
                  const days = differenceInDays(new Date(req.endDate), new Date(req.startDate)) + 1;
                  return (
                    <tr key={req.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-600 font-bold text-sm">
                            {req.user.name[0]}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">{req.user.name}</p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{req.user.department}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            {format(new Date(req.startDate), "MMM d")} - {format(new Date(req.endDate), "MMM d, yyyy")}
                          </p>
                          <p className="text-[10px] text-slate-400 font-bold">{days} {days === 1 ? 'Day' : 'Days'}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs text-slate-600 dark:text-slate-400 italic line-clamp-1">"{req.reason || "No reason"}"</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`status-badge border ${getStatusBadge(req.status)}`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {req.status === "PENDING" ? (
                          <LeaveActionModal leave={req} onAction={onLeaveAction} />
                        ) : (
                          <button className="p-2 text-slate-300 cursor-not-allowed">
                            <MoreVertical size={18} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Currently On Leave Section */}
      <div className="card-base p-6">
        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
          <User className="text-blue-500" size={18} />
          Currently On Leave Today
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {staff.filter(s => s.leaves.length > 0).map(member => (
            <div key={member.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-bold">
                {member.name[0]}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{member.name}</p>
                <p className="text-[9px] text-slate-400 font-bold uppercase truncate">Until {format(new Date(member.leaves[0].endDate), "MMM d")}</p>
              </div>
            </div>
          ))}
          {staff.filter(s => s.leaves.length > 0).length === 0 && (
            <p className="text-xs text-slate-400 italic col-span-full py-4 text-center">No staff currently on leave</p>
          )}
        </div>
      </div>

      {/* Apply Leave Modal */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="text-blue-600" size={20} />
                Apply Leave for Staff
              </h3>
              <button onClick={() => setIsApplyModalOpen(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-400">
                <XCircle size={20} />
              </button>
            </div>

            <form onSubmit={handleApplySubmit} className="p-8 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Select Staff</label>
                  <select 
                    required
                    value={applyStaffId}
                    onChange={(e) => setApplyStaffId(e.target.value)}
                    className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  >
                    <option value="">Choose a staff member...</option>
                    {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Start Date</label>
                    <input 
                      type="date"
                      required
                      value={applyStartDate}
                      onChange={(e) => setApplyStartDate(e.target.value)}
                      className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">End Date</label>
                    <input 
                      type="date"
                      required
                      value={applyEndDate}
                      onChange={(e) => setApplyEndDate(e.target.value)}
                      className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Reason (Optional)</label>
                  <textarea 
                    value={applyReason}
                    onChange={(e) => setApplyReason(e.target.value)}
                    placeholder="Provide a reason for the leave..."
                    className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm h-24 resize-none"
                  />
                </div>
              </div>

              <button 
                disabled={isSubmitting}
                type="submit"
                className="w-full btn-primary h-12 shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? "Processing..." : (
                  <>
                    <span>Submit Approval</span>
                    <ArrowRight size={18} />
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
