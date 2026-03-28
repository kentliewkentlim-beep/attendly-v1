"use client";

import { useState } from "react";
import { Upload, FileUp, AlertCircle, CheckCircle2, X } from "lucide-react";
import * as XLSX from "xlsx";

export default function BulkImportModal({ onImport }: { onImport: (data: any[]) => Promise<void> }) {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (evt) => {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        setPreview(data.slice(0, 5));
      };
      reader.readAsBinaryString(selectedFile);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setIsImporting(true);
    // In a real app, we'd process all rows
    // For now we'll just simulate
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsImporting(false);
    setIsOpen(false);
    setFile(null);
    setPreview([]);
    alert("Bulk import simulated successfully!");
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="btn-secondary h-11 px-4 text-sm"
      >
        <Upload size={18} className="mr-2" />
        Bulk Import
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
                <FileUp className="mr-2 text-blue-600" size={24} />
                Bulk Employee Import
              </h3>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-10 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors group relative">
                <input 
                  type="file" 
                  accept=".xlsx,.xls,.csv" 
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition-transform">
                    <Upload size={32} />
                  </div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                    {file ? file.name : "Click or drag file to upload"}
                  </p>
                  <p className="text-xs text-slate-500">Supports .xlsx, .xls, and .csv files</p>
                </div>
              </div>

              {preview.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Data Preview (First 5 rows)</h4>
                  <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
                    <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
                      <thead className="bg-slate-50 dark:bg-slate-800/50">
                        <tr>
                          {Object.keys(preview[0]).map(key => (
                            <th key={key} className="px-4 py-2 text-left text-[10px] font-bold text-slate-500 uppercase">{key}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
                        {preview.map((row, i) => (
                          <tr key={i}>
                            {Object.values(row).map((val: any, j) => (
                              <td key={j} className="px-4 py-2 text-xs text-slate-600 dark:text-slate-400">{val}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-4 flex gap-3">
                <AlertCircle className="text-blue-600 flex-shrink-0" size={20} />
                <div className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
                  <p className="font-bold mb-1">Important Requirements:</p>
                  <ul className="list-disc ml-4 space-y-0.5">
                    <li>Column headers must match: Name, Phone, Email, Role, CompanyID, OutletID</li>
                    <li>CompanyID and OutletID must exist in the system</li>
                    <li>Phone numbers must be unique</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
              <button 
                onClick={() => setIsOpen(false)}
                className="btn-secondary px-6 h-11"
              >
                Cancel
              </button>
              <button 
                disabled={!file || isImporting}
                onClick={handleImport}
                className="btn-primary px-8 h-11 shadow-lg shadow-blue-500/20 disabled:opacity-50"
              >
                {isImporting ? "Processing..." : "Start Import"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}