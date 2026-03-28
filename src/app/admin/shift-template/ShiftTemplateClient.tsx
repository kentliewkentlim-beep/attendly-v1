"use client";

import { useState } from "react";
import { 
  Clock, 
  Plus, 
  MoreVertical, 
  Trash2, 
  Edit2,
  Calendar,
  Building2,
  ChevronRight
} from "lucide-react";
import ShiftTemplateModal from "@/components/ShiftTemplateModal";

export default function ShiftTemplateClient({ 
  templates,
  companies,
  onSaveTemplate,
  onDeleteTemplate,
  onSeedDefaults
}: { 
  templates: any[];
  companies: any[];
  onSaveTemplate: (data: any) => Promise<void>;
  onDeleteTemplate: (id: string) => Promise<void>;
  onSeedDefaults: (companyId: string) => Promise<void>;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [isSeeding, setIsSeeding] = useState(false);

  const handleAddTemplate = () => {
    setEditingTemplate(null);
    setIsModalOpen(true);
  };

  const handleEditTemplate = (template: any) => {
    setEditingTemplate(template);
    setIsModalOpen(true);
  };

  const handleSeedDefaults = async () => {
    if (companies.length === 0) {
      alert("Please create a company first.");
      return;
    }
    const companyId = companies[0].id; // Seed for the first company by default
    if (confirm(`This will create default shifts (Day, Evening, Full) for ${companies[0].name}. Proceed?`)) {
      setIsSeeding(true);
      await onSeedDefaults(companyId);
      setIsSeeding(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <Clock className="text-blue-600" size={32} />
            Shift Templates
          </h1>
          <p className="text-slate-500 mt-1 font-medium">Define reusable work schedule patterns for your companies</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            disabled={isSeeding || companies.length === 0}
            onClick={handleSeedDefaults}
            className="btn-secondary h-11 px-6 border-slate-200 dark:border-slate-700 disabled:opacity-50"
          >
            {isSeeding ? "Seeding..." : "Seed Default Shifts"}
          </button>
          <button 
            onClick={handleAddTemplate}
            className="btn-primary h-11 px-6 shadow-lg shadow-blue-500/20"
          >
            <Plus size={18} className="mr-2" />
            Create Template
          </button>
        </div>
      </div>

      <div className="card-base overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
            <thead className="bg-slate-50/50 dark:bg-slate-800/50">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Color & Name</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Company</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Start Time</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">End Time</th>
                <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-500 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
              {templates.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center">
                      <Clock size={48} className="text-slate-200 mb-4" />
                      <p className="text-slate-500 font-medium">No shift templates defined yet</p>
                      <button 
                        onClick={handleAddTemplate}
                        className="mt-4 text-blue-600 font-bold hover:underline"
                      >
                        Create your first template
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                templates.map((template) => (
                  <tr key={template.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full shadow-sm" 
                          style={{ backgroundColor: template.color || "#3b82f6" }}
                        />
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{template.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Building2 size={12} className="text-slate-400" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{template.company.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-black text-slate-700 dark:text-slate-300">{template.startTime}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-black text-slate-700 dark:text-slate-300">{template.endTime}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleEditTemplate(template)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => {
                            if(confirm("Delete this shift template?")) {
                              onDeleteTemplate(template.id);
                            }
                          }}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ShiftTemplateModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        template={editingTemplate}
        companies={companies}
        onSave={onSaveTemplate}
      />
    </div>
  );
}
