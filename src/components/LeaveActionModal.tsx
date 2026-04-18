"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, MessageSquare, X, MoreVertical, Calendar, Clock, Save, Users, AlertTriangle, ShieldAlert } from "lucide-react";
import { format } from "date-fns";
import { getLeaveType, getDuration, leaveDays } from "@/lib/leaveTypes";
import type { DateCoverage } from "@/lib/leaveCoverage";

/**
 * Single entry point for reviewing / updating a leave request.
 *
 * - Trigger: 3-dot (MoreVertical) icon button.
 * - Opens a modal that shows full leave details + relevant actions:
 *   - PENDING:    [Approve] / [Reject] + optional supervisor note
 *   - APPROVED / REJECTED: shows current decision, allows updating note,
 *                          and offers "Revert to Pending" to re-open review.
 *
 * Backed by the existing `onAction(id, status, note)` server action, so the
 * parent (admin or supervisor leave page) handles balance deduction / refund.
 */
export default function LeaveActionModal({
  leave,
  onAction,
  coverage,
}: {
  leave: any;
  onAction: (id: string, status: string, note: string) => Promise<void>;
  coverage?: DateCoverage[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<"APPROVED" | "REJECTED" | null>(null);
  const [note, setNote] = useState<string>(leave.supervisorNote || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const typeDef = getLeaveType(leave.type);
  const durDef = getDuration(leave.durationType);
  const totalDays = leaveDays(leave.startDate, leave.endDate, leave.durationType);
  const isPending = leave.status === "PENDING";
  const isApproved = leave.status === "APPROVED";
  const isRejected = leave.status === "REJECTED";
  const durCode = leave.durationType || "FULL_DAY";
  const isHalfAM = durCode === "HALF_DAY_AM";
  const isHalfPM = durCode === "HALF_DAY_PM";

  const close = () => {
    setIsOpen(false);
    setPendingStatus(null);
    setNote(leave.supervisorNote || "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingStatus) return;
    setIsSubmitting(true);
    await onAction(leave.id, pendingStatus, note);
    setIsSubmitting(false);
    close();
  };

  const handleNoteUpdate = async () => {
    // Keep current status, just update note
    setIsSubmitting(true);
    await onAction(leave.id, leave.status, note);
    setIsSubmitting(false);
    close();
  };

  const handleRevert = async () => {
    if (!confirm("Revert this leave back to PENDING? This will refund the deducted balance (if any).")) return;
    setIsSubmitting(true);
    await onAction(leave.id, "PENDING", note);
    setIsSubmitting(false);
    close();
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
        title="Actions"
        aria-label="Leave actions"
      >
        <MoreVertical size={18} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={close}>
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50 flex-shrink-0">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Leave Request</h3>
                <p className="text-xs text-slate-500 font-medium mt-1 uppercase tracking-widest">
                  {leave.user?.name || "Unknown Staff"}
                </p>
              </div>
              <button
                onClick={close}
                className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="overflow-y-auto flex-1">
              {/* Details Section */}
              <div className="p-6 space-y-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-start gap-3">
                  <Calendar size={16} className="text-slate-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Dates</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {format(new Date(leave.startDate), "MMM d, yyyy")}
                      {!isHalfAM && !isHalfPM && ` – ${format(new Date(leave.endDate), "MMM d, yyyy")}`}
                    </p>
                    <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                      <span className={`inline-flex items-center text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${typeDef.badge}`}>
                        {typeDef.shortLabel} — {typeDef.label}
                      </span>
                      {isHalfAM && <span className="inline-flex items-center text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Half · AM</span>}
                      {isHalfPM && <span className="inline-flex items-center text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">Half · PM</span>}
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                        {totalDays} {totalDays === 1 ? "Day" : "Days"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MessageSquare size={16} className="text-slate-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Reason</p>
                    <p className="text-xs text-slate-700 dark:text-slate-300 italic whitespace-pre-wrap break-words bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                      {leave.reason || "No reason provided"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock size={16} className="text-slate-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Current Status</p>
                    <span className={`inline-flex items-center text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${
                      isApproved ? "bg-emerald-100 text-emerald-700" :
                      isRejected ? "bg-red-100 text-red-700" :
                      "bg-amber-100 text-amber-700"
                    }`}>
                      {leave.status}
                    </span>
                  </div>
                </div>

                {coverage && coverage.length > 0 && (
                  <div className="flex items-start gap-3 pt-1">
                    <Users size={16} className="text-slate-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                        Coverage Impact {isPending ? "(If Approved)" : "(At Approval)"}
                      </p>
                      <div className="space-y-1.5">
                        {coverage.map((d) => {
                          const bg =
                            d.status === "CRITICAL"
                              ? "bg-red-50 border-red-200 text-red-800"
                              : d.status === "WARNING"
                              ? "bg-amber-50 border-amber-200 text-amber-800"
                              : "bg-emerald-50 border-emerald-200 text-emerald-800";
                          const icon =
                            d.status === "CRITICAL" ? (
                              <ShieldAlert size={14} />
                            ) : d.status === "WARNING" ? (
                              <AlertTriangle size={14} />
                            ) : (
                              <CheckCircle2 size={14} />
                            );
                          return (
                            <div key={d.date} className={`flex items-start gap-2 p-2.5 rounded-xl border text-[11px] ${bg}`}>
                              <span className="mt-0.5">{icon}</span>
                              <div className="flex-1">
                                <div className="flex items-center justify-between flex-wrap gap-1">
                                  <span className="font-black uppercase tracking-wider">
                                    {format(new Date(d.date + "T00:00:00"), "EEE, MMM d")}
                                  </span>
                                  <span className="font-black">
                                    {d.workingIfApproved}/{d.totalStaff} working
                                  </span>
                                </div>
                                <p className="text-[10px] font-bold opacity-80 mt-0.5">
                                  {d.outletName} · Min required: {d.minRequired}
                                  {d.othersOnLeaveCount > 0 && (
                                    <> · {d.othersOnLeaveCount} other{d.othersOnLeaveCount === 1 ? "" : "s"} on leave ({d.othersOnLeaveNames.slice(0, 3).join(", ")}{d.othersOnLeaveNames.length > 3 ? "…" : ""})</>
                                  )}
                                </p>
                                {d.status === "CRITICAL" && (
                                  <p className="text-[10px] font-black uppercase tracking-widest mt-1">
                                    ⚠ Below minimum — approving will leave outlet understaffed
                                  </p>
                                )}
                                {d.status === "WARNING" && (
                                  <p className="text-[10px] font-black uppercase tracking-widest mt-1">
                                    ⚠ Exactly at minimum — no buffer
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Section */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {isPending && (
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Decision</p>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setPendingStatus("APPROVED")}
                        className={`flex items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                          pendingStatus === "APPROVED"
                            ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 shadow-sm"
                            : "border-slate-100 dark:border-slate-800 text-slate-400 hover:border-slate-200"
                        }`}
                      >
                        <CheckCircle2 size={20} />
                        <span className="font-bold text-sm">Approve</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingStatus("REJECTED")}
                        className={`flex items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                          pendingStatus === "REJECTED"
                            ? "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 shadow-sm"
                            : "border-slate-100 dark:border-slate-800 text-slate-400 hover:border-slate-200"
                        }`}
                      >
                        <XCircle size={20} />
                        <span className="font-bold text-sm">Reject</span>
                      </button>
                    </div>
                    {pendingStatus === "APPROVED" && typeDef.deducts && (
                      <p className="text-[10px] text-emerald-700 font-bold mt-2 ml-1">
                        Will deduct {totalDays} {totalDays === 1 ? "day" : "days"} from {leave.user?.name}&apos;s balance.
                      </p>
                    )}
                    {pendingStatus === "APPROVED" && !typeDef.deducts && (
                      <p className="text-[10px] text-slate-500 font-medium mt-2 ml-1">
                        {typeDef.label} does not deduct from annual balance.
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">
                    Supervisor Note {isPending ? "(Optional)" : ""}
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Provide a reason or feedback..."
                    className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none min-h-[100px] resize-none"
                  />
                </div>
              </form>
            </div>

            {/* Footer Actions (sticky) */}
            <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex-shrink-0">
              <div className="flex flex-wrap justify-end gap-3">
                {!isPending && (
                  <button
                    type="button"
                    onClick={handleRevert}
                    disabled={isSubmitting}
                    className="btn-secondary px-4 h-11 text-xs disabled:opacity-50"
                  >
                    Revert to Pending
                  </button>
                )}
                {!isPending && (
                  <button
                    type="button"
                    onClick={handleNoteUpdate}
                    disabled={isSubmitting || note === (leave.supervisorNote || "")}
                    className="btn-primary px-6 h-11 shadow disabled:opacity-40 bg-slate-700 hover:bg-slate-800 flex items-center gap-2"
                  >
                    <Save size={14} />
                    {isSubmitting ? "Saving..." : "Save Note"}
                  </button>
                )}
                {isPending && (
                  <>
                    <button
                      type="button"
                      onClick={close}
                      className="btn-secondary px-6 h-11"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={isSubmitting || !pendingStatus}
                      onClick={handleSubmit as any}
                      className={`btn-primary px-8 h-11 shadow-lg disabled:opacity-40 ${
                        pendingStatus === "REJECTED" ? "bg-red-600 hover:bg-red-700 shadow-red-500/20" :
                        pendingStatus === "APPROVED" ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20" :
                        "bg-blue-600"
                      }`}
                    >
                      {isSubmitting ? "Processing..." : pendingStatus ? `Confirm ${pendingStatus === "APPROVED" ? "Approval" : "Rejection"}` : "Select a decision"}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
