/**
 * Leave coverage — compute "how many staff will be working" per date
 * when a proposed leave is approved.
 *
 * Rules (per Kent):
 *   - Scope: per outlet
 *   - Count STAFF + PROMOTER + SUPERVISOR (active only)
 *   - Half-day still counts as 1 staff out of office (simplified)
 *   - Threshold: outlet.minStaffRequired (Int, default 1)
 */

export type CoverageStatus = "OK" | "WARNING" | "CRITICAL";

export type DateCoverage = {
  /** YYYY-MM-DD in UTC */
  date: string;
  outletId: string;
  outletName: string;
  /** Total active STAFF/PROMOTER/SUPERVISOR assigned to this outlet */
  totalStaff: number;
  /** Other approved leaves overlapping this date at the same outlet */
  othersOnLeaveCount: number;
  /** Names of the other staff on leave that day */
  othersOnLeaveNames: string[];
  /** Working headcount if THIS leave is approved (total - others - 1) */
  workingIfApproved: number;
  /** Working headcount right now (before this leave is approved) */
  workingNow: number;
  /** Minimum staff required at this outlet */
  minRequired: number;
  status: CoverageStatus;
};

function toIsoDate(d: Date | string): string {
  return new Date(d).toISOString().slice(0, 10);
}

export function computeLeaveCoverage(params: {
  leave: { id: string; startDate: Date | string; endDate: Date | string; user: { outletId: any } };
  allStaff: Array<{ id: string; outletId: any }>;
  approvedLeaves: Array<{
    id: string;
    startDate: Date | string;
    endDate: Date | string;
    user: { id: string; name: string; outletId: any };
  }>;
  outlets: Array<{ id: any; name: string; minStaffRequired: number }>;
}): DateCoverage[] {
  const { leave, allStaff, approvedLeaves, outlets } = params;
  const outletId = leave.user?.outletId;
  if (outletId === null || outletId === undefined) return [];

  const outletKey = String(outletId);
  const outlet = outlets.find((o) => String(o.id) === outletKey);
  const outletStaff = allStaff.filter((s) => String(s.outletId) === outletKey);
  const totalStaff = outletStaff.length;
  const minRequired = outlet?.minStaffRequired ?? 1;

  const startStr = toIsoDate(leave.startDate);
  const endStr = toIsoDate(leave.endDate);
  const cur = new Date(startStr + "T00:00:00.000Z");
  const last = new Date(endStr + "T00:00:00.000Z");
  if (isNaN(cur.getTime()) || isNaN(last.getTime())) return [];

  const out: DateCoverage[] = [];
  while (cur <= last) {
    const dStr = cur.toISOString().slice(0, 10);
    const others = approvedLeaves.filter((l) => {
      if (l.id === leave.id) return false;
      if (String(l.user.outletId) !== outletKey) return false;
      const s = toIsoDate(l.startDate);
      const e = toIsoDate(l.endDate);
      return dStr >= s && dStr <= e;
    });
    const othersOnLeaveCount = others.length;
    const othersOnLeaveNames = others.map((l) => l.user.name);
    const workingNow = Math.max(0, totalStaff - othersOnLeaveCount);
    const workingIfApproved = Math.max(0, totalStaff - othersOnLeaveCount - 1);
    const status: CoverageStatus =
      workingIfApproved < minRequired
        ? "CRITICAL"
        : workingIfApproved === minRequired
        ? "WARNING"
        : "OK";
    out.push({
      date: dStr,
      outletId: outletKey,
      outletName: outlet?.name || "Unknown Outlet",
      totalStaff,
      othersOnLeaveCount,
      othersOnLeaveNames,
      workingIfApproved,
      workingNow,
      minRequired,
      status,
    });
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return out;
}

/**
 * Reduce DateCoverage[] into a single "worst-case" summary for quick display.
 */
export function summarizeCoverage(days: DateCoverage[]): { worst: CoverageStatus; criticalCount: number; warningCount: number } {
  let worst: CoverageStatus = "OK";
  let criticalCount = 0;
  let warningCount = 0;
  for (const d of days) {
    if (d.status === "CRITICAL") {
      criticalCount++;
      worst = "CRITICAL";
    } else if (d.status === "WARNING") {
      warningCount++;
      if (worst === "OK") worst = "WARNING";
    }
  }
  return { worst, criticalCount, warningCount };
}
