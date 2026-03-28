"use client";

import { useState } from "react";
import { X, Building2, Save } from "lucide-react";

export default function CompanyModal({ 
  company, 
  onSave,
  isOpen,
  onClose
}: { 
  company?: any; 
  onSave: (data: any) => Promise<void>;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [name, setName] = useState(company?.name || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setIsSubmitting(true);
    await onSave({ id: company?.id, name });
    setIsSubmitting(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Building2 size={20} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {company ? "Edit Company" : "Add New Company"}
              </h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                {company ? "Update organizational details" : "Register a new organization"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-400">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Company Name</label>
              <input
                autoFocus
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter company name..."
                className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button 
              type="button"
              onClick={onClose}
              className="btn-secondary px-6 h-11 text-xs font-bold"
            >
              Cancel
            </button>
            <button 
              disabled={isSubmitting}
              type="submit"
              className="btn-primary px-8 h-11 shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                "Saving..."
              ) : (
                <>
                  <Save size={16} />
                  <span>{company ? "Update Company" : "Create Company"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
