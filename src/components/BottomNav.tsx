"use client";

import type { ReactNode, CSSProperties } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  CalendarCheck,
  History,
  Clock,
  Coffee,
  LogOut,
  CheckCircle2,
} from "lucide-react";
import GpsAwareForm from "./GpsAwareForm";
import LocalDateInput from "./LocalDateInput";

type Attendance = {
  checkIn?: Date | string | null;
  lunchStart?: Date | string | null;
  lunchEnd?: Date | string | null;
  checkOut?: Date | string | null;
} | null | undefined;

/**
 * Fixed bottom navigation visible ONLY on mobile (sm:hidden).
 *
 * Center button dynamically changes based on today's attendance state:
 *   1. !checkIn      â "Clock In"    (blue)     â handleCheckIn
 *   2. !lunchStart   â "Lunch Out"   (orange)   â handleLunchStart
 *   3. !lunchEnd     â "Lunch Back"  (emerald)  â handleLunchEnd
 *   4. !checkOut     â "Clock Out"   (slate)    â handleCheckOut
 *   5. all done      â "Done"        (disabled)
 *
 * Layout follows mobile-nav-mockup.html: 68Ã68 px floating center button
 * that sits 28px above the bar, with a white 6px ring.
 */
export default function BottomNav({
  attendance,
  handleCheckIn,
  handleLunchStart,
  handleLunchEnd,
  handleCheckOut,
}: {
  attendance: Attendance;
  handleCheckIn: (formData: FormData) => void | Promise<void>;
  handleLunchStart: (formData: FormData) => void | Promise<void>;
  handleLunchEnd: (formData: FormData) => void | Promise<void>;
  handleCheckOut: (formData: FormData) => void | Promise<void>;
}) {
  const pathname = usePathname() || "";
  const isActive = (href: string) =>
    href === "/staff"
      ? pathname === "/staff"
      : pathname === href || pathname.startsWith(href + "/");

  // Determine center button state
  type CenterState =
    | "clockIn"
    | "lunchOut"
    | "lunchBack"
    | "clockOut"
    | "done";
  let state: CenterState = "clockIn";
  if (!attendance?.checkIn) state = "clockIn";
  else if (!attendance.lunchStart) state = "lunchOut";
  else if (!attendance.lunchEnd) state = "lunchBack";
  else if (!attendance.checkOut) state = "clockOut";
  else state = "done";

  return (
    <div
      className="sm:hidden fixed left-0 right-0 bottom-0 z-50"
      style={{
        padding: "12px 16px calc(24px + env(safe-area-inset-bottom))",
      }}
    >
      <div
        className="relative bg-white rounded-[28px] px-2 py-2.5 flex justify-around items-center"
        style={{
          boxShadow:
            "0 10px 40px rgba(15, 23, 42, 0.12), 0 2px 8px rgba(15, 23, 42, 0.06)",
        }}
      >
        {/* 1. Home */}
        <NavItem
          href="/staff"
          label="Home"
          active={isActive("/staff") && !pathname.startsWith("/staff/")}
          icon={<LayoutDashboard className="w-[22px] h-[22px]" strokeWidth={2.2} />}
        />

        {/* 2. Schedule */}
        <NavItem
          href="/staff/calendar"
          label="Schedule"
          active={isActive("/staff/calendar")}
          icon={<CalendarDays className="w-[22px] h-[22px]" strokeWidth={2.2} />}
        />

        {/* 3. Center floating button (dynamic) */}
        <CenterButton
          state={state}
          handleCheckIn={handleCheckIn}
          handleLunchStart={handleLunchStart}
          handleLunchEnd={handleLunchEnd}
          handleCheckOut={handleCheckOut}
        />

        {/* 4. Leave */}
        <NavItem
          href="/staff/leave"
          label="Leave"
          active={isActive("/staff/leave")}
          icon={<CalendarCheck className="w-[22px] h-[22px]" strokeWidth={2.2} />}
        />

        {/* 5. Attendance */}
        <NavItem
          href="/staff/attendance"
          label="Attend."
          active={isActive("/staff/attendance")}
          icon={<History className="w-[22px] h-[22px]" strokeWidth={2.2} />}
        />
      </div>
    </div>
  );
}

function NavItem({
  href,
  label,
  icon,
  active,
}: {
  href: string;
  label: string;
  icon: ReactNode;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex-1 flex flex-col items-center justify-center gap-[3px] py-2 px-1.5 transition-colors ${
        active ? "text-blue-600" : "text-slate-400 hover:text-blue-600"
      }`}
    >
      {icon}
      <span className="text-[10px] font-black uppercase leading-none tracking-tight">
        {label}
      </span>
    </Link>
  );
}

function CenterButton({
  state,
  handleCheckIn,
  handleLunchStart,
  handleLunchEnd,
  handleCheckOut,
}: {
  state: "clockIn" | "lunchOut" | "lunchBack" | "clockOut" | "done";
  handleCheckIn: (formData: FormData) => void | Promise<void>;
  handleLunchStart: (formData: FormData) => void | Promise<void>;
  handleLunchEnd: (formData: FormData) => void | Promise<void>;
  handleCheckOut: (formData: FormData) => void | Promise<void>;
}) {
  // Common shared classes for the floating circle
  const circleBase =
    "relative -top-7 w-[68px] h-[68px] min-w-[68px] rounded-full flex flex-col items-center justify-center text-white transition-transform active:scale-95";
  const ringStyle = {
    boxShadow: "0 10px 24px rgba(37, 99, 235, 0.4), 0 0 0 6px white",
  } as CSSProperties;

  if (state === "done") {
    return (
      <div
        className={`${circleBase} bg-emerald-50 border-2 border-emerald-400 text-emerald-600 cursor-default`}
        style={{ boxShadow: "0 0 0 6px white" }}
        aria-label="Shift complete"
      >
        <CheckCircle2 className="w-[22px] h-[22px]" strokeWidth={2.3} />
        <span className="text-[9px] font-black uppercase leading-none mt-1">
          Done
        </span>
      </div>
    );
  }

  if (state === "clockIn") {
    return (
      <GpsAwareForm action={handleCheckIn} captureGps={true} requireGps={true}>
        <LocalDateInput />
        <button
          type="submit"
          className={`${circleBase} bg-gradient-to-br from-blue-600 to-blue-500`}
          style={ringStyle}
          aria-label="Clock in"
        >
          <Clock className="w-[22px] h-[22px]" strokeWidth={2.3} />
          <span className="text-[9px] font-black uppercase leading-none mt-1">
            Clock In
          </span>
        </button>
      </GpsAwareForm>
    );
  }

  if (state === "lunchOut") {
    return (
      <GpsAwareForm action={handleLunchStart} captureGps={false}>
        <LocalDateInput />
        <button
          type="submit"
          className={`${circleBase} bg-gradient-to-br from-orange-500 to-orange-400`}
          style={{
            boxShadow:
              "0 10px 24px rgba(249, 115, 22, 0.4), 0 0 0 6px white",
          }}
          aria-label="Start lunch"
        >
          <Coffee className="w-[22px] h-[22px]" strokeWidth={2.3} />
          <span className="text-[9px] font-black uppercase leading-none mt-1">
            Lunch Out
          </span>
        </button>
      </GpsAwareForm>
    );
  }

  if (state === "lunchBack") {
    return (
      <GpsAwareForm action={handleLunchEnd} captureGps={false}>
        <LocalDateInput />
        <button
          type="submit"
          className={`${circleBase} bg-gradient-to-br from-emerald-500 to-emerald-400`}
          style={{
            boxShadow:
              "0 10px 24px rgba(16, 185, 129, 0.4), 0 0 0 6px white",
          }}
          aria-label="End lunch"
        >
          <Coffee className="w-[22px] h-[22px]" strokeWidth={2.3} />
          <span className="text-[9px] font-black uppercase leading-none mt-1">
            Lunch Back
          </span>
        </button>
      </GpsAwareForm>
    );
  }

  // clockOut
  return (
    <GpsAwareForm action={handleCheckOut} captureGps={true}>
      <LocalDateInput />
      <button
        type="submit"
        className={`${circleBase} bg-gradient-to-br from-slate-900 to-slate-700`}
        style={{
          boxShadow: "0 10px 24px rgba(15, 23, 42, 0.4), 0 0 0 6px white",
        }}
        aria-label="Clock out"
      >
        <LogOut className="w-[22px] h-[22px]" strokeWidth={2.3} />
        <span className="text-[9px] font-black uppercase leading-none mt-1">
          Clock Out
        </span>
      </button>
    </GpsAwareForm>
  );
}
