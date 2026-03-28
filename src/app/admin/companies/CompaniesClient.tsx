"use client";

import { useState } from "react";
import { 
  Building2, 
  Store, 
  Users, 
  UserCheck, 
  MoreVertical, 
  Plus, 
  ChevronRight,
  Phone,
  MapPin,
  Trash2,
  Edit2
} from "lucide-react";
import CompanyModal from "@/components/CompanyModal";
import OutletModal from "@/components/OutletModal";

export default function CompaniesClient({ 
  companies,
  onSaveCompany,
  onDeleteCompany,
  onSaveOutlet,
  onDeleteOutlet
}: { 
  companies: any[];
  onSaveCompany: (data: any) => Promise<void>;
  onDeleteCompany: (id: string) => Promise<void>;
  onSaveOutlet: (data: any) => Promise<void>;
  onDeleteOutlet: (id: string) => Promise<void>;
}) {
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<any>(null);
  
  const [isOutletModalOpen, setIsOutletModalOpen] = useState(false);
  const [editingOutlet, setEditingOutlet] = useState<any>(null);
  const [activeCompanyId, setActiveCompanyId] = useState<string>("");

  const handleAddCompany = () => {
    setEditingCompany(null);
    setIsCompanyModalOpen(true);
  };

  const handleEditCompany = (company: any) => {
    setEditingCompany(company);
    setIsCompanyModalOpen(true);
  };

  const handleAddOutlet = (companyId: string) => {
    setEditingOutlet(null);
    setActiveCompanyId(companyId);
    setIsOutletModalOpen(true);
  };

  const handleEditOutlet = (outlet: any, companyId: string) => {
    setEditingOutlet(outlet);
    setActiveCompanyId(companyId);
    setIsOutletModalOpen(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <Building2 className="text-blue-600" size={32} />
            Companies & Outlets
          </h1>
          <p className="text-slate-500 mt-1 font-medium">Manage organizational structure and outlet assignments</p>
        </div>
        <button 
          onClick={handleAddCompany}
          className="btn-primary h-11 px-6 shadow-lg shadow-blue-500/20"
        >
          <Plus size={18} className="mr-2" />
          Add New Company
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {companies.map((company) => (
          <div key={company.id} className="card-base overflow-hidden group/company">
            {/* Company Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-xl shadow-sm flex items-center justify-center border border-slate-200 dark:border-slate-800">
                  <Building2 className="text-blue-600" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">{company.name}</h3>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center">
                      <Users size={12} className="mr-1" />
                      {company._count.users} Employees
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center">
                      <Store size={12} className="mr-1" />
                      {company._count.outlets} Outlets
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center">
                      <UserCheck size={12} className="mr-1" />
                      {company.users.length} Supervisors
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleEditCompany(company)}
                  className="btn-secondary h-9 px-4 text-xs font-bold"
                >
                  Edit Details
                </button>
                <button 
                  onClick={() => {
                    if(confirm("Are you sure you want to delete this company? All outlets and staff will be affected.")) {
                      onDeleteCompany(company.id);
                    }
                  }}
                  className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            {/* Outlets List */}
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Outlets Management</h4>
                <button 
                  onClick={() => handleAddOutlet(company.id)}
                  className="text-xs font-bold text-blue-600 hover:underline flex items-center"
                >
                  <Plus size={14} className="mr-1" />
                  Add Outlet
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {company.outlets.map((outlet: any) => (
                  <div key={outlet.id} className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900 transition-all group/outlet relative">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center text-blue-600 group-hover/outlet:scale-110 transition-transform">
                        <Store size={20} />
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover/outlet:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleEditOutlet(outlet, company.id)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={() => {
                            if(confirm("Delete this outlet?")) {
                              onDeleteOutlet(outlet.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <h5 className="font-bold text-slate-900 dark:text-white mb-2">{outlet.name}</h5>
                    <div className="space-y-2">
                      <div className="flex items-start text-[11px] text-slate-500">
                        <MapPin size={14} className="mr-2 mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-1">{outlet.address || "No address set"}</span>
                      </div>
                      <div className="flex items-center text-[11px] text-slate-500">
                        <Phone size={14} className="mr-2 flex-shrink-0" />
                        <span>{outlet.phone || "No phone set"}</span>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-800 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                           <Users size={10} className="text-emerald-600" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                          {outlet._count.users} Staff
                        </span>
                      </div>
                      <ChevronRight size={14} className="text-slate-300" />
                    </div>
                  </div>
                ))}
                {company.outlets.length === 0 && (
                  <div className="col-span-full py-10 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
                    <p className="text-sm text-slate-400 italic font-medium">No outlets found for this company</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <CompanyModal 
        isOpen={isCompanyModalOpen}
        onClose={() => setIsCompanyModalOpen(false)}
        company={editingCompany}
        onSave={onSaveCompany}
      />

      <OutletModal 
        isOpen={isOutletModalOpen}
        onClose={() => setIsOutletModalOpen(false)}
        outlet={editingOutlet}
        companyId={activeCompanyId}
        onSave={onSaveOutlet}
      />
    </div>
  );
}
