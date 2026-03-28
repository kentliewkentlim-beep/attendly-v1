"use client";

import { useState } from "react";
import { 
  ArrowRightLeft, 
  Users, 
  Search, 
  Store, 
  User, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Clock,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Plus
} from "lucide-react";
import { format } from "date-fns";

export default function SupervisorTransferClient({ 
  myStaff,
  availableStaff,
  activeTransfers,
  outlets,
  onRequestTransfer,
  onApproveTransfer,
  onReturnStaff
}: { 
  myStaff: any[];
  availableStaff: any[];
  activeTransfers: any[];
  outlets: any[];
  onRequestTransfer: (staffId: string, toOutletId: string, date: string) => Promise<void>;
  onApproveTransfer: (requestId: string, status: string) => Promise<void>;
  onReturnStaff: (requestId: string) => Promise<void>;
}) {
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [targetOutletId, setTargetOutletId] = useState("");
  const [transferDate, setTransferDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff || !targetOutletId || !transferDate) return;
    
    setIsSubmitting(true);
    await onRequestTransfer(selectedStaff.id, targetOutletId, transferDate);
    setIsSubmitting(false);
    setSelectedStaff(null);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <ArrowRightLeft className="text-blue-600" size={32} />
            Staff Transfer
          </h1>
          <p className="text-slate-500 mt-1 font-medium">Borrow or lend staff members across outlets</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Borrow Staff Panel */}
        <div className="space-y-6">
          <div className="card-base">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-blue-50/30 dark:bg-blue-900/10">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ArrowLeft className="text-blue-600" size={18} />
                Available to Borrow
              </h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{availableStaff.length} Staff Available</span>
            </div>
            <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto">
              {availableStaff.map((staff) => (
                <div key={staff.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex justify-between items-center group hover:border-blue-200 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center text-blue-600 font-bold text-sm shadow-sm border border-slate-100 dark:border-slate-800">
                      {staff.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{staff.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
                        <Store size={10} />
                        {staff.outlet.name}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedStaff(staff)}
                    className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-xl transition-all"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              ))}
              {availableStaff.length === 0 && (
                <div className="text-center py-10">
                  <User className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm italic">No external staff available</p>
                </div>
              )}
            </div>
          </div>

          {/* Transfer Form (Conditional) */}
          {selectedStaff && (
            <div className="card-base p-6 border-2 border-blue-500 animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="flex justify-between items-center mb-6">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  Request Transfer for {selectedStaff.name}
                </h4>
                <button onClick={() => setSelectedStaff(null)} className="text-slate-400 hover:text-slate-600">
                  <XCircle size={20} />
                </button>
              </div>
              <form onSubmit={handleRequest} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">To My Outlet</label>
                    <select 
                      required
                      value={targetOutletId}
                      onChange={(e) => setTargetOutletId(e.target.value)}
                      className="block w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    >
                      <option value="">Select Outlet</option>
                      {outlets.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Date</label>
                    <input 
                      type="date"
                      required
                      value={transferDate}
                      onChange={(e) => setTransferDate(e.target.value)}
                      className="block w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>
                <button 
                  disabled={isSubmitting}
                  type="submit"
                  className="w-full btn-primary h-11 shadow-lg shadow-blue-500/20 disabled:opacity-50"
                >
                  {isSubmitting ? "Sending Request..." : "Send Transfer Request"}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* My Staff & Active Transfers Panel */}
        <div className="space-y-6">
          <div className="card-base">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-emerald-50/30 dark:bg-emerald-900/10">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ArrowRight className="text-emerald-600" size={18} />
                Active Transfers
              </h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{activeTransfers.length} Active</span>
            </div>
            <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto">
              {activeTransfers.map((req) => (
                <div key={req.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 flex items-center justify-center text-emerald-600 font-bold text-xs shadow-sm">
                        {req.staff.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{req.staff.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                          {req.fromOutlet.name} <ArrowRight size={8} className="inline mx-1" /> {req.toOutlet.name}
                        </p>
                      </div>
                    </div>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter ${
                      req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {req.status}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold">
                      <Calendar size={12} />
                      {format(new Date(req.requestDate), "MMM d, yyyy")}
                    </div>
                    {req.status === 'APPROVED' && (
                      <button 
                        onClick={() => onReturnStaff(req.id)}
                        className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1 hover:underline"
                      >
                        <RefreshCw size={12} />
                        Return Staff
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {activeTransfers.length === 0 && (
                <div className="text-center py-10">
                  <ArrowRightLeft className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm italic">No active transfers</p>
                </div>
              )}
            </div>
          </div>

          <div className="card-base">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="text-slate-400" size={18} />
                My Staff Panel
              </h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {myStaff.map((staff) => (
                <div key={staff.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 font-bold text-xs">
                    {staff.name[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{staff.name}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase truncate">{staff.department}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
