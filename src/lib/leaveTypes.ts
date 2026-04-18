/**
 * Leave type + duration definitions.
 *
 * Used across:
 *   - /staff/leave  (apply form: type + duration selection)
 *   - /admin/leave  (list + approval badges)
 *   - /supervisor/leave (same as admin)
 *   - Any balance-deduction logic
 */

export type LeaveTypeCode = "AL" | "MC" | "EL" | "UL" | "CO";
export type DurationType = "FULL_DAY" | "HALF_DAY_AM" | "HALF_DAY_PM";

export type LeaveTypeDef = {
  code: LeaveTypeCode;
  label: string;
  shortLabel: string;
  /** Whether approved leave of this type subtracts from User.leaveBalance */
  deducts: boolean;
  /** Whether half-day duration is allowed for this type */
  allowHalf: boolean;
  /** Tailwind badge colour classes (bg + text) */
  badge: string;
  /** Tailwind dot colour (for small circles in dropdowns) */
  dot: string;
  description: string;
};

export const LEAVE_TYPES: Record<LeaveTypeCode, LeaveTypeDef> = {
  AL: {
    code: "AL",
    label: "Annual Leave",
    shortLabel: "AL",
    deducts: true,
    allowHalf: true,
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
    dot: "bg-blue-500",
    description: "Annual leave — deducts from balance",
  },
  MC: {
    code: "MC",
    label: "Medical Leave",
    shortLabel: "MC",
    deducts: true,
    allowHalf: true,
    badge: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400",
    dot: "bg-red-500",
    description: "Medical / sick leave — attach MC if possible",
  },
  EL: {
    code: "EL",
    label: "Emergency Leave",
    shortLabel: "EL",
    deducts: true,
    allowHalf: true,
    badge: "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400",
    dot: "bg-orange-500",
    description: "Emergency leave — deducts from balance",
  },
  UL: {
    code: "UL",
    label: "Unpaid Leave",
    shortLabel: "UL",
    deducts: false,
    allowHalf: true,
    badge: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    dot: "bg-slate-500",
    description: "Unpaid leave — does not deduct from balance",
  },
  CO: {
    code: "CO",
    label: "Change Off Day",
    shortLabel: "CO",
    deducts: false,
    allowHalf: false,
    badge: "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400",
    dot: "bg-purple-500",
    description: "Swap off day — must be full day, does not deduct balance",
  },
};

export const LEAVE_TYPE_OPTIONS = (Object.values(LEAVE_TYPES) as LeaveTypeDef[]);

export const DURATION_TYPES: Record<DurationType, { label: string; short: string; days: number; badge: string }> = {
  FULL_DAY: {
    label: "Full Day",
    short: "Full",
    days: 1,
    badge: "bg-slate-100 text-slate-700",
  },
  HALF_DAY_AM: {
    label: "Half Day (AM)",
    short: "AM",
    days: 0.5,
    badge: "bg-amber-100 text-amber-700",
  },
  HALF_DAY_PM: {
    label: "Half Day (PM)",
    short: "PM",
    days: 0.5,
    badge: "bg-indigo-100 text-indigo-700",
  },
};

/**
 * Resolve the canonical type definition. Falls back to AL for safety
 * (also handles legacy values like "ANNUAL" just in case something sneaks in).
 */
export function getLeaveType(code: string | null | undefined): LeaveTypeDef {
  if (!code) return LEAVE_TYPES.AL;
  const upper = code.toUpperCase();
  if (upper in LEAVE_TYPES) return LEAVE_TYPES[upper as LeaveTypeCode];
  // Legacy migration fallback
  if (upper === "ANNUAL") return LEAVE_TYPES.AL;
  if (upper === "MEDICAL" || upper === "SICK") return LEAVE_TYPES.MC;
  if (upper === "EMERGENCY") return LEAVE_TYPES.EL;
  if (upper === "UNPAID") return LEAVE_TYPES.UL;
  return LEAVE_TYPES.AL;
}

export function getDuration(code: string | null | undefined) {
  if (!code) return DURATION_TYPES.FULL_DAY;
  const upper = code.toUpperCase();
  if (upper in DURATION_TYPES) return DURATION_TYPES[upper as DurationType];
  return DURATION_TYPES.FULL_DAY;
}

/**
 * Number of calendar days this leave spans (inclusive).
 * For half-day leaves, startDate === endDate and this still returns 1 calendar day;
 * the `days` value (below) accounts for the 0.5 multiplier.
 */
export function calendarDaysInclusive(startDate: Date | string, endDate: Date | string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const ms = end.getTime() - start.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24)) + 1;
}

/**
 * Total leave days to display / deduct. Half-day leaves always count as 0.5
 * regardless of calendar span (half day = one date anyway).
 */
export function leaveDays(startDate: Date | string, endDate: Date | string, durationType: string | null | undefined): number {
  const duration = getDuration(durationType);
  if (duration.days < 1) return duration.days;
  return calendarDaysInclusive(startDate, endDate);
}
