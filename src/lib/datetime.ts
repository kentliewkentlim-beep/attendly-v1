/**
 * Malaysia timezone date/time formatting helpers.
 *
 * Background:
 *   Vercel runs in UTC. date-fns `format()` uses server (UTC) local time, so
 *   calling `format(attendance.checkIn, "HH:mm")` on a server component shows
 *   the UTC time (e.g. 03:46) instead of the Malaysia time staff actually
 *   checked in at (11:46 MY).
 *
 * These helpers always render in Asia/Kuala_Lumpur regardless of server or
 * browser timezone. Safe to use in both server and client components.
 */

export const MY_TZ = "Asia/Kuala_Lumpur";

/** "11:46" — 24h time */
export function fmtTimeMY(d: Date | string | null | undefined): string {
  if (!d) return "--:--";
  return new Date(d).toLocaleTimeString("en-GB", {
    timeZone: MY_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/** "11:46 AM" — 12h with AM/PM */
export function fmtTime12MY(d: Date | string | null | undefined): string {
  if (!d) return "--:--";
  return new Date(d).toLocaleTimeString("en-US", {
    timeZone: MY_TZ,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/** "Apr 18, 2026 11:46" */
export function fmtDateTimeMY(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = new Date(d);
  const dateStr = date.toLocaleDateString("en-US", {
    timeZone: MY_TZ,
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  return `${dateStr} ${fmtTimeMY(d)}`;
}

/** "2026-04-18 11:46" — excel/report export */
export function fmtIsoDateTimeMY(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = new Date(d);
  // en-CA gives "YYYY-MM-DD"
  const datePart = date.toLocaleDateString("en-CA", { timeZone: MY_TZ });
  return `${datePart} ${fmtTimeMY(d)}`;
}
