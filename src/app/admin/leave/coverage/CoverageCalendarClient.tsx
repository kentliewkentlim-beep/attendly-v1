"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format, addDays, parseISO, isSameDay, isWeekend } from "date-fns";
import {
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  Users,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Building2,
  Calendar as CalendarIcon,
} from "lucide-react";
import Link from "next/link";
import { getLeaveType } from "@/lib/leaveTypes";

type Outlet = { id: string; name: string; companyId: string | null; minStaffRequired: number };
type Staff = { id: string; name: string; outletId: string | null };
type LeaveRec = {
  id: string;
  startDate: string;
  endDate: string;
  type: string;
  durationType: string;
  user: { id: string; name: string; outletId: string | null };
};
type Company = { id: string; name: string };

type CellInfo = {
  dateStr: string;
  outletId: string;
  totalStaff: number;
  onLeave: LeaveRec[];
  working: number;
  minRequired: number;
  status: "OK" | "WARNING" | "CRITICAL";
};

export default function CoverageCalendarClient({
  outlets,
  staff,
  leaves,
  companies,
  startStr,
  days,
  selectedCompanyId,
}: {
  outlets: Outlet[];
  staff: Staff[];
  leaves: LeaveRec[];
  companies: Company[];
  startStr: string;
  days: number;
  selectedCompanyId: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selected, setSelected] = useState<CellInfo | null>(null);

  const startDate = parseISO(startStr + "T00:00:00.000Z");
  const dateList = useMemo(() => {
    const arr: Date[] = [];
    for (let i = 0; i < days; i++) arr.push(addDays(startDate, i));
    return arr;
  }, [startStr, days]);

  const outletStaffCount = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of staff) {
      if (!s.outletId) continue;
      map.set(s.outletId, (map.get(s.outletId) || 0) + 1);
    }
    return map;
  }, [staff]);

  // Build per (outletId, date) cell info
  const cellMap = useMemo(() => {
    const map = new Map<string, CellInfo>();
    for (const o of outlets) {
      const totalStaff = outletStaffCount.get(o.id) || 0;
      for (const d of dateList) {
        const dStr = d.toISOString().slice(0, 10);
        const onLeave = leaves.filter(
          (l) => l.user.outletId === o.id && dStr >= l.startDate && dStr <= l.endDate
        );
        const working = Math.max(0, totalStaff - onLeave.length);
        const status: CellInfo["status"] =
          working < o.minStaffRequired
            ? "CRITICAL"
            : working === o.minStaffRequired
            ? "WARNING"
            : "OK";
        map.set(`${o.id}|${dStr}`, {
          dateStr: dStr,
          outletId: o.id,
          totalStaff,
          onLeave,
          working,
          minRequired: o.minStaffRequired,
          status,
        });
      }
    }
    return map;
  }, [outlets, dateList, leaves, outletStaffCount]);

  const updateParams = (patch: Record<string, string | null>) => {
    const sp = new URLSearchParams(searchParams?.toString() || "");
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === "") sp.delete(k);
      else sp.set(k, v);
    }
    router.push(`/admin/leave/coverage?${sp.toString()}`);
  };

  const shiftRange = (deltaDays: number) => {
    const newStart = addDays(startDate, deltaDays);
    updateParams({ start: format(newStart, "yyyy-MM-dd") });
  };

  const colorFor = (status: CellInfo["status"]) =>
    status === "CRITICAL"
      ? "bg-red-100 text-red-700 border-red-300 hover:bg-red-200"
      : status === "WARNING"
      ? "bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-200"
      : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100";

  // Summary stats
  const summary = useMemo(() => {
    let crit = 0;
    let warn = 0;
    let ok = 0;
    for (const v of cellMap.values()) {
      if (v.status === "CRITICAL") crit++;
      else if (v.status === "WARNING") warn++;
      else ok++;
    }
    return { crit, warn, ok, total: crit + warn + ok };
  }, [cellMap]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-1">
            <Link href="/admin/leave" className="hover:text-blue-600">Leave Management</Link>
            <span>/</span>
            <span className="text-slate-700 dark:text-slate-300">Coverage Calendar</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center">
            <CalendarCheck className="mr-3 text-blue-600" size={32} />
            Leave Coverage Calendar
          </h1>
          <p className="text-slate-500 mt-1 font-medium">
            Spot understaffed days before approving new leave — especially festive periods.
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="card-base p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">
              Start Date
            </label>
            <input
              type="date"
              value={startStr}
              onChange={(e) => updateParams({ start: e.target.value })}
              className="block w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">
              Days
            </label>
            <select
              value={days}
              onChange={(e) => updateParams({ days: e.target.value })}
              className="block px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
            >
              <option value="7">7 days</option>
              <option value="14">14 days</option>
              <option value="30">30 days</option>
              <option value="60">60 days</option>
              <option value="90">90 days</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">
              Company
            </label>
            <select
              value={selectedCompanyId}
              onChange={(e) => updateParams({ company: e.target.value || null })}
              className="block w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
            >
              <option value="">All Companies</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => shiftRange(-days)}
              className="btn-secondary px-3 h-10"
              title="Previous window"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => updateParams({ start: format(new Date(), "yyyy-MM-dd") })}
              className="btn-secondary px-4 h-10 text-xs font-bold"
            >
              Today
            </button>
            <button
              onClick={() => shiftRange(days)}
              className="btn-secondary px-3 h-10"
              title="Next window"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-5 flex flex-wrap gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-50 border border-red-200 text-red-700 text-[11px] font-black uppercase tracking-widest">
            <ShieldAlert size={12} />
            {summary.crit} critical
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-black uppercase tracking-widest">
            <AlertTriangle size={12} />
            {summary.warn} at min
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-black uppercase tracking-widest">
            <CheckCircle2 size={12} />
            {summary.ok} ok
          </div>
        </div>
      </div>

      {/* Grid */}
      {outlets.length === 0 ? (
        <div className="card-base p-12 text-center">
          <Building2 size={48} className="text-slate-200 mx-auto mb-4" />
          <p className="text-sm text-slate-500 font-medium">No outlets to show.</p>
        </div>
      ) : (
        <div className="card-base overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-50/80 dark:bg-slate-800/80 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap bg-slate-50/80 dark:bg-slate-800/80 sticky left-0 z-20">
                    Outlet
                  </th>
                  {dateList.map((d) => {
                    const weekend = isWeekend(d);
                    return (
                      <th
                        key={d.toISOString()}
                        className={`px-2 py-2 text-center text-[9px] font-bold uppercase tracking-tighter min-w-[52px] ${
                          weekend ? "text-blue-600 bg-blue-50/40" : "text-slate-500"
                        }`}
                      >
                        <div>{format(d, "EEE")}</div>
                        <div className="text-[11px] font-black text-slate-900 dark:text-white mt-0.5 tabular-nums">{format(d, "d")}</div>
                        <div className="text-[8px] opacity-70">{format(d, "MMM")}</div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {outlets.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20">
                    <td className="px-4 py-2 whitespace-nowrap bg-white dark:bg-slate-900 sticky left-0 z-10 border-r border-slate-100 dark:border-slate-800">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{o.name}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          Min {o.minStaffRequired} · Total {outletStaffCount.get(o.id) || 0}
                        </span>
                      </div>
                    </td>
                    {dateList.map((d) => {
                      const dStr = d.toISOString().slice(0, 10);
                      const info = cellMap.get(`${o.id}|${dStr}`)!;
                      return (
                        <td key={d.toISOString()} className="px-1 py-1">
                          <button
                            type="button"
                            onClick={() => setSelected(info)}
                            className={`w-full px-1 py-2 rounded-lg border text-center transition-all ${colorFor(info.status)} cursor-pointer`}
                            title={`${info.working}/${info.totalStaff} working · Min ${info.minRequired}${info.onLeave.length > 0 ? "\n" + info.onLeave.map((l) => `${l.user.name} (${getLeaveType(l.type).shortLabel})`).join(", ") : ""}`}
                          >
                            <div className="text-xs font-black tabular-nums">
                              {info.working}/{info.totalStaff}
                            </div>
                            {info.onLeave.length > 0 && (
                              <div className="text-[8px] font-black opacity-80">
                                {info.onLeave.length} off
                              </div>
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail popup */}
      {selected && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {outlets.find((o) => o.id === selected.outletId)?.name}
                </h3>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">
                  {format(parseISO(selected.dateStr + "T00:00:00"), "EEEE, MMM d, yyyy")}
                </p>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 hover:bg-slate-200 rounded-full">
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                  <div className="text-2xl font-black text-slate-900">{selected.working}</div>
                  <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Working</div>
                </div>
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-center">
                  <div className="text-2xl font-black text-blue-700">{selected.totalStaff}</div>
                  <div className="text-[9px] font-bold text-blue-600 uppercase tracking-widest">Total</div>
                </div>
                <div className="p-3 rounded-xl bg-orange-50 border border-orange-100 text-center">
                  <div className="text-2xl font-black text-orange-700">{selected.minRequired}</div>
                  <div className="text-[9px] font-bold text-orange-600 uppercase tracking-widest">Min Req</div>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                  On Leave ({selected.onLeave.length})
                </p>
                {selected.onLeave.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">Nobody on leave.</p>
                ) : (
                  <div className="space-y-1.5">
                    {selected.onLeave.map((l) => {
                      const t = getLeaveType(l.type);
                      return (
                        <div key={l.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                          <span className="text-xs font-bold text-slate-700">{l.user.name}</span>
                          <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${t.badge}`}>
                            {t.shortLabel}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div
                className={`p-3 rounded-xl border text-xs font-bold ${
                  selected.status === "CRITICAL"
                    ? "bg-red-50 border-red-200 text-red-700"
                    : selected.status === "WARNING"
                    ? "bg-amber-50 border-amber-200 text-amber-700"
                    : "bg-emerald-50 border-emerald-200 text-emerald-700"
                }`}
              >
                {selected.status === "CRITICAL" && "⚠ Below minimum — outlet is understaffed"}
                {selected.status === "WARNING" && "⚠ Exactly at minimum — no buffer"}
                {selected.status === "OK" && "✓ Coverage is healthy"}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
