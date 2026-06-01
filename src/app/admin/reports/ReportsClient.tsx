"use client";

import { useState, useMemo } from "react";
import {
  BarChart3,
  Search,
  Calendar,
  Building2,
  Store,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Users,
} from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import ExportButton from "@/components/ExportButton";
import { fmtTimeMY } from "@/lib/datetime";

/** Leave types used by Attendly. Columns shown in the summary report. */
const LEAVE_TYPES = ["AL", "MC", "EL", "CO"] as const;
const LEAVE_LABELS: Record<string, string> = {
  AL: "AL 年假",
  MC: "MC 病假",
  EL: "EL 事假",
  CO: "CO 补假",
};

/** Normalise any date / date-string to a "YYYY-MM-DD" key (UTC, date-only safe). */
function dateKey(d: Date | string): string {
  return new Date(d).toISOString().slice(0, 10);
}

/** Inclusive list of "YYYY-MM-DD" between two date strings. */
function eachDay(fromStr: string, toStr: string): string[] {
  const out: string[] = [];
  if (!fromStr || !toStr || fromStr > toStr) return out;
  const cur = new Date(fromStr + "T00:00:00Z");
  const last = new Date(toStr + "T00:00:00Z");
  let guard = 0;
  while (cur <= last && guard < 1000) {
    out.push(cur.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 1);
    guard++;
  }
  return out;
}

function isOffShift(shift: any): boolean {
  return String(shift ?? "").trim().toLowerCase() === "off";
}

export default function ReportsClient({
  attendanceData,
  companies,
  outlets,
  users = [],
  rosters = [],
  leaves = [],
}: {
  attendanceData: any[];
  companies: any[];
  outlets: any[];
  users?: any[];
  rosters?: any[];
  leaves?: any[];
}) {
  const [view, setView] = useState<"summary" | "detail">("summary");
  const [dateFrom, setDateFrom] = useState(
    format(startOfMonth(new Date()), "yyyy-MM-dd")
  );
  const [dateTo, setDateTo] = useState(
    format(endOfMonth(new Date()), "yyyy-MM-dd")
  );
  const [companyId, setCompanyId] = useState("");
  const [outletId, setOutletId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredOutlets = companyId
    ? outlets.filter((o) => o.companyId === companyId)
    : outlets;

  /* ---------------- DETAIL VIEW (existing per-record list) ---------------- */
  const filteredData = attendanceData.filter((record) => {
    const recordDate = new Date(record.date);
    const from = new Date(dateFrom);
    const to = new Date(dateTo);

    const matchesDate = recordDate >= from && recordDate <= to;
    const matchesCompany = !companyId || record.user.companyId === companyId;
    const matchesOutlet =
      !outletId || String(record.user.outletId) === outletId;
    const matchesSearch =
      !searchQuery ||
      record.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.user.phone.includes(searchQuery);

    return matchesDate && matchesCompany && matchesOutlet && matchesSearch;
  });

  const detailExport = filteredData.map((record) => ({
    Date: dateKey(record.date),
    Employee: record.user.name,
    Phone: record.user.phone,
    Company: record.user.company.name,
    Outlet: record.user.outlet?.name || "N/A",
    "Check In": fmtTimeMY(record.checkIn) || "-",
    "Check Out": fmtTimeMY(record.checkOut) || "-",
    "Lunch Start": fmtTimeMY(record.lunchStart) || "-",
    "Lunch End": fmtTimeMY(record.lunchEnd) || "-",
    Status: record.isLate ? "LATE" : record.checkIn ? "PRESENT" : "ABSENT",
  }));

  /* ---------------- SUMMARY VIEW (per-staff over date range) ---------------- */
  const rangeDays = useMemo(() => eachDay(dateFrom, dateTo), [dateFrom, dateTo]);

  // Index attendance by userId -> dateKey -> record
  const attIndex = useMemo(() => {
    const m = new Map<string, Map<string, any>>();
    for (const r of attendanceData) {
      const uid = r.userId ?? r.user?.id;
      if (!uid) continue;
      if (!m.has(uid)) m.set(uid, new Map());
      m.get(uid)!.set(dateKey(r.date), r);
    }
    return m;
  }, [attendanceData]);

  // Index roster by userId -> dateKey -> shift
  const rosterIndex = useMemo(() => {
    const m = new Map<string, Map<string, any>>();
    for (const r of rosters) {
      if (!r.userId) continue;
      if (!m.has(r.userId)) m.set(r.userId, new Map());
      m.get(r.userId)!.set(dateKey(r.date), r.shift);
    }
    return m;
  }, [rosters]);

  // Index approved leave by userId -> dateKey -> { type, weight }
  const leaveIndex = useMemo(() => {
    const m = new Map<string, Map<string, { type: string; weight: number }>>();
    for (const lv of leaves) {
      if (!lv.userId) continue;
      const days = eachDay(dateKey(lv.startDate), dateKey(lv.endDate));
      const isHalf =
        days.length === 1 &&
        /half/i.test(String(lv.durationType ?? ""));
      const weight = isHalf ? 0.5 : 1;
      if (!m.has(lv.userId)) m.set(lv.userId, new Map());
      const inner = m.get(lv.userId)!;
      for (const d of days) {
        inner.set(d, { type: String(lv.type ?? "").toUpperCase(), weight });
      }
    }
    return m;
  }, [leaves]);

  const summaryUsers = users.filter((u) => {
    const matchesCompany = !companyId || u.companyId === companyId;
    const matchesOutlet = !outletId || String(u.outletId) === outletId;
    const matchesSearch =
      !searchQuery ||
      (u.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.phone || "").includes(searchQuery);
    return matchesCompany && matchesOutlet && matchesSearch;
  });

  const summaryRows = useMemo(() => {
    return summaryUsers.map((u) => {
      const att = attIndex.get(u.id);
      const ros = rosterIndex.get(u.id);
      const lv = leaveIndex.get(u.id);

      let present = 0;
      let late = 0;
      let absent = 0;
      let off = 0;
      let unscheduled = 0;
      let leaveTotal = 0;
      const byType: Record<string, number> = { AL: 0, MC: 0, EL: 0, CO: 0, OTHER: 0 };

      for (const d of rangeDays) {
        const a = att?.get(d);
        if (a && a.checkIn) {
          if (a.isLate) late++;
          else present++;
          continue;
        }
        const l = lv?.get(d);
        if (l) {
          leaveTotal += l.weight;
          if (byType[l.type] !== undefined) byType[l.type] += l.weight;
          else byType.OTHER += l.weight;
          continue;
        }
        const shift = ros?.get(d);
        if (shift !== undefined) {
          if (isOffShift(shift)) off++;
          else absent++;
        } else {
          unscheduled++;
        }
      }

      return {
        user: u,
        worked: present + late,
        present,
        late,
        absent,
        off,
        unscheduled,
        leaveTotal,
        byType,
      };
    });
  }, [summaryUsers, attIndex, rosterIndex, leaveIndex, rangeDays]);

  const summaryStats = useMemo(() => {
    return summaryRows.reduce(
      (acc, r) => {
        acc.staff += 1;
        acc.worked += r.worked;
        acc.absent += r.absent;
        acc.leave += r.leaveTotal;
        acc.off += r.off;
        return acc;
      },
      { staff: 0, worked: 0, absent: 0, leave: 0, off: 0 }
    );
  }, [summaryRows]);

  const summaryExport = summaryRows.map((r) => ({
    Employee: r.user.name,
    Phone: r.user.phone || "",
    Company: r.user.company?.name || "",
    Outlet: r.user.outlet?.name || "-",
    "Worked Days": r.worked,
    Present: r.present,
    Late: r.late,
    Absent: r.absent,
    "AL 年假": r.byType.AL,
    "MC 病假": r.byType.MC,
    "EL 事假": r.byType.EL,
    "CO 补假": r.byType.CO,
    "Leave Total": r.leaveTotal,
    "Off Days": r.off,
    Unscheduled: r.unscheduled,
  }));

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <BarChart3 className="text-blue-600" size={32} />
            Attendance Reports
          </h1>
          <p className="text-slate-500 mt-1 font-medium">
            {view === "summary"
              ? "每位员工的出勤汇总 — 出勤 / 缺勤 / 请假 / 休息"
              : "Generate and export detailed attendance records"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
            <button
              onClick={() => setView("summary")}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                view === "summary"
                  ? "bg-white dark:bg-slate-700 text-blue-600 shadow-sm"
                  : "text-slate-500"
              }`}
            >
              汇总 Summary
            </button>
            <button
              onClick={() => setView("detail")}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                view === "detail"
                  ? "bg-white dark:bg-slate-700 text-blue-600 shadow-sm"
                  : "text-slate-500"
              }`}
            >
              明细 Detail
            </button>
          </div>
          {view === "summary" ? (
            <ExportButton
              data={summaryExport}
              filename={`Attendance_Summary_${dateFrom}_to_${dateTo}`}
            />
          ) : (
            <ExportButton
              data={detailExport}
              filename={`Attendance_Report_${dateFrom}_to_${dateTo}`}
            />
          )}
        </div>
      </div>

      {/* Stats Cards */}
      {view === "summary" ? (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="card-base p-6 bg-white dark:bg-slate-900">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              Staff
            </p>
            <p className="text-3xl font-black text-slate-900 dark:text-white">
              {summaryStats.staff}
            </p>
          </div>
          <div className="card-base p-6 bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30">
            <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">
              Worked Days
            </p>
            <p className="text-3xl font-black text-emerald-700 dark:text-emerald-300">
              {summaryStats.worked}
            </p>
          </div>
          <div className="card-base p-6 bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30">
            <p className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-widest mb-1">
              Absent Days
            </p>
            <p className="text-3xl font-black text-red-700 dark:text-red-300">
              {summaryStats.absent}
            </p>
          </div>
          <div className="card-base p-6 bg-violet-50 dark:bg-violet-900/10 border-violet-100 dark:border-violet-900/30">
            <p className="text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-widest mb-1">
              Leave Days
            </p>
            <p className="text-3xl font-black text-violet-700 dark:text-violet-300">
              {summaryStats.leave}
            </p>
          </div>
          <div className="card-base p-6 bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
              Off Days
            </p>
            <p className="text-3xl font-black text-slate-700 dark:text-slate-300">
              {summaryStats.off}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card-base p-6 bg-white dark:bg-slate-900">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              Total Records
            </p>
            <p className="text-3xl font-black text-slate-900 dark:text-white">
              {filteredData.length}
            </p>
          </div>
          <div className="card-base p-6 bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30">
            <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">
              Present
            </p>
            <p className="text-3xl font-black text-emerald-700 dark:text-emerald-300">
              {filteredData.filter((r) => !!r.checkIn).length}
            </p>
          </div>
          <div className="card-base p-6 bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/30">
            <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-1">
              Late
            </p>
            <p className="text-3xl font-black text-amber-700 dark:text-amber-300">
              {filteredData.filter((r) => r.isLate).length}
            </p>
          </div>
          <div className="card-base p-6 bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30">
            <p className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-widest mb-1">
              Absent/Missing
            </p>
            <p className="text-3xl font-black text-red-700 dark:text-red-300">
              {filteredData.filter((r) => !r.checkIn).length}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card-base p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
              From Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 text-slate-400" size={16} />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
              To Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 text-slate-400" size={16} />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
              Company
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-3 text-slate-400" size={16} />
              <select
                value={companyId}
                onChange={(e) => {
                  setCompanyId(e.target.value);
                  setOutletId("");
                }}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
              >
                <option value="">All Companies</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
              Outlet
            </label>
            <div className="relative">
              <Store className="absolute left-3 top-3 text-slate-400" size={16} />
              <select
                value={outletId}
                onChange={(e) => setOutletId(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
              >
                <option value="">All Outlets</option>
                {filteredOutlets.map((o) => (
                  <option key={String(o.id)} value={String(o.id)}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
              Search Staff
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-3 text-slate-400" size={16} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Name or phone..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
          </div>
        </div>
        {view === "summary" && (
          <p className="text-[11px] text-slate-400 mt-4 leading-relaxed">
            缺勤 / 休息按排班表判定：排班为 <b>Off</b> → 休息日；排班为上班但当天没打卡 → 缺勤；
            该日没有排班则不计入（Unscheduled）。请假只统计<b>已批准</b>的申请。
          </p>
        )}
      </div>

      {/* Results */}
      {view === "summary" ? (
        <div className="card-base overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
              <thead className="bg-slate-50/50 dark:bg-slate-800/50">
                <tr>
                  <th className="px-5 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest sticky left-0 bg-slate-50/50 dark:bg-slate-800/50">
                    Staff
                  </th>
                  <th className="px-3 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Outlet
                  </th>
                  <th className="px-3 py-4 text-center text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                    出勤
                  </th>
                  <th className="px-3 py-4 text-center text-[10px] font-bold text-amber-600 uppercase tracking-widest">
                    迟到
                  </th>
                  <th className="px-3 py-4 text-center text-[10px] font-bold text-red-600 uppercase tracking-widest">
                    缺勤
                  </th>
                  {LEAVE_TYPES.map((t) => (
                    <th
                      key={t}
                      className="px-3 py-4 text-center text-[10px] font-bold text-violet-600 uppercase tracking-widest"
                    >
                      {LEAVE_LABELS[t]}
                    </th>
                  ))}
                  <th className="px-3 py-4 text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    休息
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
                {summaryRows.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center">
                        <Users size={48} className="text-slate-200 mb-4" />
                        <p className="text-slate-500 font-medium">
                          No staff matching your filters
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  summaryRows.map((r) => (
                    <tr
                      key={r.user.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="px-5 py-3 whitespace-nowrap sticky left-0 bg-white dark:bg-slate-900">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 font-bold text-sm">
                            {(r.user.name || "?")[0]}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">
                              {r.user.name}
                            </p>
                            <p className="text-[10px] text-slate-400 font-bold">
                              {r.user.company?.name || ""}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                        {r.user.outlet?.name || "-"}
                      </td>
                      <td className="px-3 py-3 text-center text-sm font-black text-emerald-600">
                        {r.worked || ""}
                      </td>
                      <td className="px-3 py-3 text-center text-sm font-bold text-amber-600">
                        {r.late || ""}
                      </td>
                      <td className="px-3 py-3 text-center text-sm font-bold text-red-600">
                        {r.absent || ""}
                      </td>
                      {LEAVE_TYPES.map((t) => (
                        <td
                          key={t}
                          className="px-3 py-3 text-center text-sm font-bold text-violet-600"
                        >
                          {r.byType[t] || ""}
                        </td>
                      ))}
                      <td className="px-3 py-3 text-center text-sm font-bold text-slate-400">
                        {r.off || ""}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card-base overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
              <thead className="bg-slate-50/50 dark:bg-slate-800/50">
                <tr>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Date &amp; Staff
                  </th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Company &amp; Outlet
                  </th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Check In/Out
                  </th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Lunch Break
                  </th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center">
                        <Search size={48} className="text-slate-200 mb-4" />
                        <p className="text-slate-500 font-medium">
                          No records matching your filters
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredData.map((record) => (
                    <tr
                      key={record.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 font-bold text-sm">
                            {record.user.name[0]}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">
                              {record.user.name}
                            </p>
                            <p className="text-[10px] text-slate-500 font-bold">
                              {format(new Date(record.date), "EEE, MMM d, yyyy")}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            {record.user.company.name}
                          </p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                            {record.user.outlet?.name || "No Outlet"}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-6">
                          <div className="space-y-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                              In
                            </p>
                            <p className="text-xs font-bold text-slate-900 dark:text-white">
                              {fmtTimeMY(record.checkIn)}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                              Out
                            </p>
                            <p className="text-xs font-bold text-slate-900 dark:text-white">
                              {fmtTimeMY(record.checkOut)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-6">
                          <div className="space-y-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                              Start
                            </p>
                            <p className="text-xs font-bold text-slate-900 dark:text-white">
                              {fmtTimeMY(record.lunchStart)}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                              End
                            </p>
                            <p className="text-xs font-bold text-slate-900 dark:text-white">
                              {fmtTimeMY(record.lunchEnd)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {record.isRemoteCheckin && (
                          <span className="status-badge bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400 mr-1.5">
                            REMOTE
                          </span>
                        )}
                        {record.isLate ? (
                          <span className="status-badge bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400">
                            <AlertCircle size={12} className="mr-1.5" />
                            LATE
                          </span>
                        ) : record.checkIn ? (
                          <span className="status-badge bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
                            <CheckCircle2 size={12} className="mr-1.5" />
                            PRESENT
                          </span>
                        ) : (
                          <span className="status-badge bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                            <XCircle size={12} className="mr-1.5" />
                            ABSENT
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
