"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function BackButton({ href = "/staff" }: { href?: string }) {
  return (
    <Link 
      href={href}
      className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 text-slate-500 hover:text-blue-600 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:shadow-md hover:scale-[1.02] active:scale-[0.98] mb-6"
    >
      <ChevronLeft size={18} />
      <span className="text-xs font-black uppercase tracking-widest">Back</span>
    </Link>
  );
}
