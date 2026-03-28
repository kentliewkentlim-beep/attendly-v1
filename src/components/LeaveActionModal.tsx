"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, MessageSquare, X } from "lucide-react";

export default function LeaveActionModal({ 
  leave, 
  onAction 
}: { 
  leave: any; 
  onAction: (id: string, status: string, note: string) => Promise<void> 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await onAction(leave.id, status, note);
    setIsSubmitting(false);
    setIsOpen(false);
    setNote("");
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
        title="Review Request"
      >
        <MessageSquare size={18} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Review Leave Request</h3>
                <p className="text-xs text-slate-500 font-medium mt-1 uppercase tracking-widest">{leave.user.name}</p>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setStatus("APPROVED")}
                    className={`flex items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                      status === "APPROVED" 
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 shadow-sm" 
                        : "border-slate-100 dark:border-slate-800 text-slate-400 hover:border-slate-200"
                    }`}
                  >
                    <CheckCircle2 size={20} />
                    <span className="font-bold text-sm">Approve</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus("REJECTED")}
                    className={`flex items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                      status === "REJECTED" 
                        ? "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 shadow-sm" 
                        : "border-slate-100 dark:border-slate-800 text-slate-400 hover:border-slate-200"
                    }`}
                  >
                    <XCircle size={20} />
                    <span className="font-bold text-sm">Reject</span>
                  </button>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Supervisor Note (Optional)</label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Provide a reason or feedback..."
                    className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none min-h-[120px] resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button 
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="btn-secondary px-6 h-11"
                >
                  Cancel
                </button>
                <button 
                  disabled={isSubmitting}
                  type="submit"
                  className={`btn-primary px-8 h-11 shadow-lg shadow-blue-500/20 disabled:opacity-50 ${
                    status === "REJECTED" ? "bg-red-600 hover:bg-red-700 shadow-red-500/20" : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20"
                  }`}
                >
                  {isSubmitting ? "Processing..." : `Confirm ${status === "APPROVED" ? "Approval" : "Rejection"}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}