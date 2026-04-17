"use client";

import { useEffect, useState } from "react";
import { Bell, CheckCircle2, X, Megaphone } from "lucide-react";
import { format } from "date-fns";

type Announcement = {
  id: string;
  title: string;
  content: string;
  imageUrl?: string | null;
  createdAt: Date | string;
  author?: { name?: string | null } | null;
  acks?: Array<{ userId: string }>;
};

export default function AnnouncementSheet({
  announcements,
  unreadCount,
  onAcknowledge,
}: {
  announcements: Announcement[];
  unreadCount: number;
  onAcknowledge: (formData: FormData) => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);

  // Close on ESC
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  // Lock body scroll while open.
  // IMPORTANT: use `overflow-y: clip` instead of `overflow: hidden`.
  // `overflow: hidden` creates a scroll container on <body>, which permanently
  // breaks any `position: sticky` descendants (StaffTopBar, desktop Navbar) on
  // iOS Safari â even after the style is removed, sticky doesn't recover without
  // a full reflow, so the top bar visually disappears on subsequent pages.
  // `clip` prevents UI scroll WITHOUT establishing a scroll container, so
  // sticky keeps working.
  useEffect(() => {
    if (!open) return;
    document.body.style.overflowY = "clip";
    return () => {
      document.body.style.overflowY = "";
    };
  }, [open]);

  return (
    <>
      {/* Bell button â trigger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative h-9 w-9 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 border border-blue-200 flex items-center justify-center hover:brightness-105 transition-all"
        aria-label="Announcements"
      >
        <Bell className="w-[18px] h-[18px] text-blue-700" strokeWidth={2.5} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center ring-2 ring-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Overlay + Sheet */}
      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-end sm:items-center sm:justify-center"
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Sheet */}
          <div
            className="relative w-full sm:max-w-lg sm:rounded-2xl rounded-t-3xl bg-white shadow-2xl max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-200"
          >
            {/* Handle + Header */}
            <div className="flex flex-col items-center pt-3 px-5 border-b border-slate-100">
              <div className="w-10 h-1 rounded-full bg-slate-200 sm:hidden mb-3" />
              <div className="flex items-center justify-between w-full pb-3">
                <div className="flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-black text-slate-900">Announcements</h2>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-black uppercase tracking-widest bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="h-9 w-9 rounded-full hover:bg-slate-100 flex items-center justify-center"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
            </div>

            {/* Latest unread banner (amber, matches Home page) */}
            {(() => {
              const latest = announcements.find(
                (a) => !a.acks || a.acks.length === 0
              );
              if (!latest) return null;
              return (
                <div className="px-5 pt-4">
                  <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 p-4 relative overflow-hidden">
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-xl bg-amber-500 flex items-center justify-center flex-shrink-0">
                        <Megaphone className="w-4 h-4 text-white" strokeWidth={2.5} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[9px] font-black uppercase tracking-widest text-amber-700 bg-amber-200 px-2 py-0.5 rounded-full">
                            Latest
                          </span>
                          <span className="text-[10px] font-bold text-amber-700 uppercase">
                            {format(new Date(latest.createdAt), "MMM d")}
                          </span>
                        </div>
                        <p className="font-black text-slate-900 text-sm leading-tight">
                          {latest.title}
                        </p>
                        <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                          {latest.content}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* List */}
            <div className="overflow-y-auto flex-1 p-5 space-y-4">
              {announcements.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-500">No announcements yet</p>
                  <p className="text-xs text-slate-400 mt-1">You're all caught up</p>
                </div>
              ) : (
                announcements.map((ann) => {
                  const isUnread = !(ann.acks && ann.acks.length > 0);
                  return (
                    <div
                      key={ann.id}
                      className={`rounded-2xl p-4 border transition-colors ${
                        isUnread
                          ? "border-l-4 border-l-blue-500 border-slate-200 bg-blue-50/30"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {isUnread && (
                          <span className="text-[9px] font-black uppercase tracking-widest bg-blue-600 text-white px-2 py-0.5 rounded-full">
                            New
                          </span>
                        )}
                        <span className="text-[10px] font-bold text-slate-500 uppercase">
                          {format(new Date(ann.createdAt), "MMM d, yyyy")}
                        </span>
                      </div>
                      <h3
                        className={`text-sm leading-snug mb-1 ${
                          isUnread ? "font-black text-slate-900" : "font-bold text-slate-700"
                        }`}
                      >
                        {ann.title}
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                        {ann.content}
                      </p>
                      {ann.imageUrl && (
                        <img
                          src={ann.imageUrl}
                          alt=""
                          className="mt-3 w-full max-h-56 object-cover rounded-xl border border-slate-200"
                        />
                      )}
                      <div className="flex items-center justify-between mt-3">
                        {ann.author?.name && (
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[8px] font-bold">
                              {ann.author.name[0]}
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase">
                              {ann.author.name.split(" ")[0]}
                            </span>
                          </div>
                        )}
                        {isUnread ? (
                          <form action={onAcknowledge}>
                            <input type="hidden" name="announcementId" value={ann.id} />
                            <button
                              type="submit"
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-full uppercase tracking-widest transition-colors"
                            >
                              <CheckCircle2 size={12} /> Acknowledge
                            </button>
                          </form>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-widest">
                            <CheckCircle2 size={12} /> Read
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
