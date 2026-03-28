"use client";
import { useState, useEffect } from "react";
import { format } from "date-fns";

export default function LiveClock() {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (!time) return <div className="h-8 w-24 bg-slate-100 dark:bg-slate-800 animate-pulse rounded"></div>;

  return (
    <div className="flex flex-col items-end">
      <span className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 tabular-nums">
        {format(time, "HH:mm:ss")}
      </span>
      <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
        {format(time, "EEEE, MMMM do")}
      </span>
    </div>
  );
}