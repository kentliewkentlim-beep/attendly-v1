"use client";

import Link from "next/link";
import { User } from "lucide-react";
import AnnouncementSheet from "./AnnouncementSheet";

type Announcement = {
  id: string;
  title: string;
  content: string;
  imageUrl?: string | null;
  createdAt: Date | string;
  author?: { name?: string | null } | null;
  acks?: Array<{ userId: string }>;
};

/**
 * Mobile simplified top bar — only visible on mobile (sm:hidden).
 * Desktop uses the full <Navbar /> (rendered separately in layout).
 *
 * Contains: App logo/name, bell (with unread count → opens AnnouncementSheet),
 * and avatar (links to /staff/profile).
 */
export default function StaffTopBar({
  user,
  announcements,
  onAcknowledge,
}: {
  user: {
    id: string;
    name: string;
    avatarUrl?: string | null;
    updatedAt?: Date | string | null;
  };
  announcements: Announcement[];
  onAcknowledge: (formData: FormData) => void | Promise<void>;
}) {
  const unreadCount = announcements.filter(
    (a) => !a.acks || a.acks.length === 0
  ).length;

  const avatarSrc =
    user.avatarUrl && user.updatedAt
      ? `${user.avatarUrl}${user.avatarUrl.includes("?") ? "&" : "?"}v=${new Date(
          user.updatedAt
        ).getTime()}`
      : user.avatarUrl || null;

  return (
    <nav
      className="sm:hidden sticky top-0 z-40 border-b border-slate-100"
      style={{
        background: "rgba(255,255,255,0.9)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      <div className="flex justify-between items-center px-5 py-3">
        <Link
          href="/staff"
          className="text-base font-black text-slate-900 whitespace-nowrap hover:opacity-80"
        >
          CDSB Attendance
        </Link>

        <div className="flex items-center gap-2">
          {/* Bell — opens announcement sheet */}
          <AnnouncementSheet
            announcements={announcements}
            unreadCount={unreadCount}
            onAcknowledge={onAcknowledge}
          />

          {/* Avatar → profile */}
          <Link
            href="/staff/profile"
            className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 border border-blue-200 flex items-center justify-center overflow-hidden"
            aria-label="Profile"
          >
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt="Avatar"
                className="h-9 w-9 rounded-full object-cover"
              />
            ) : (
              <User className="w-4 h-4 text-blue-700" strokeWidth={2.5} />
            )}
          </Link>
        </div>
      </div>
    </nav>
  );
}
