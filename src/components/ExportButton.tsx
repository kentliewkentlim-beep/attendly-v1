"use client";
import * as XLSX from "xlsx";
import { Download } from "lucide-react";

export default function ExportButton({ data, filename }: { data: any[], filename: string }) {
  const handleExport = () => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  };

  return (
    <button
      onClick={handleExport}
      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
    >
      <Download className="w-4 h-4 mr-2" />
      Export to Excel
    </button>
  );
}