"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  Settings,
  ChevronRight,
  Camera,
  Lock,
  ShieldCheck,
  Bell,
  Languages,
  Moon,
  Smartphone,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * Collapsible Settings row for the staff Profile page.
 *
 * Sub-items with an `href` navigate to an existing settings sub-route.
 * "Change Photo" triggers a hidden file input.
 * Items with a `badge` are shown but disabled (Coming Soon / Beta).
 */
export default function SettingsAccordion({
  onUpload,
}: {
  onUpload: (formData: FormData) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  type SubItem = {
    key: string;
    label: string;
    icon: LucideIcon;
    color: string;
    href?: string;
    onClick?: () => void;
    badge?: string; // "Coming Soon" / "Beta"
    value?: string;
  };

  const subItems: SubItem[] = [
    {
      key: "change-photo",
      label: "Change Photo",
      icon: Camera,
      color: "text-blue-600 bg-blue-50",
      onClick: () => fileRef.current?.click(),
    },
    {
      key: "change-password",
      label: "Change Password",
      icon: Lock,
      color: "text-blue-600 bg-blue-50",
      href: "/staff/settings/password",
    },
    {
      key: "two-factor",
      label: "Two-Factor Auth",
      icon: ShieldCheck,
      color: "text-emerald-600 bg-emerald-50",
      badge: "Coming Soon",
    },
    {
      key: "notifications",
      label: "Notifications",
      icon: Bell,
      color: "text-orange-600 bg-orange-50",
      badge: "Coming Soon",
    },
    {
      key: "language",
      label: "Language",
      icon: Languages,
      color: "text-purple-600 bg-purple-50",
      badge: "Coming Soon",
      value: "English",
    },
    {
      key: "appearance",
      label: "Appearance",
      icon: Moon,
      color: "text-slate-600 bg-slate-100",
      badge: "Coming Soon",
      value: "System",
    },
    {
      key: "biometric",
      label: "Biometric Login",
      icon: Smartphone,
      color: "text-pink-600 bg-pink-50",
      badge: "Coming Soon",
    },
  ];

  function renderSubItem(item: SubItem) {
    const inner = (
      <>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${item.color}`}>
            <item.icon size={16} />
          </div>
          <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
            {item.label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {item.value && (
            <span className="text-[11px] font-bold text-slate-400">{item.value}</span>
          )}
          {item.badge && (
            <span className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-[8px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              {item.badge}
            </span>
          )}
          {item.href && (
            <ChevronRight size={14} className="text-slate-300" />
          )}
        </div>
      </>
    );

    const className =
      "w-full flex items-center justify-between pl-16 pr-5 py-3 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all";

    if (item.href) {
      return (
        <Link key={item.key} href={item.href} className={className}>
          {inner}
        </Link>
      );
    }

    return (
      <button
        key={item.key}
        type="button"
        onClick={item.onClick}
        disabled={!item.onClick}
        className={`${className} ${!item.onClick ? "opacity-60 cursor-not-allowed" : ""}`}
      >
        {inner}
      </button>
    );
  }

  return (
    <div>
      {/* Main Settings row */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group"
        aria-expanded={open}
      >
        <div className="flex items-center gap-4">
          <div className="p-2.5 rounded-xl bg-slate-100 text-slate-600 transition-transform group-hover:scale-110">
            <Settings size={20} />
          </div>
          <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
            Settings
          </span>
        </div>
        <ChevronRight
          size={18}
          className={`text-slate-300 group-hover:text-blue-500 transition-all ${
            open ? "rotate-90 text-blue-500" : ""
          }`}
        />
      </button>

      {/* Sub-items panel */}
      {open && (
        <div className="bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
          {subItems.map(renderSubItem)}

          {/* Hidden file-input form for Change Photo */}
          <form
            ref={formRef}
            action={onUpload}
            encType="multipart/form-data"
            className="hidden"
          >
            <input
              ref={fileRef}
              type="file"
              name="avatar"
              accept="image/*"
              className="hidden"
              onChange={() => formRef.current?.requestSubmit()}
            />
          </form>
        </div>
      )}
    </div>
  );
}
