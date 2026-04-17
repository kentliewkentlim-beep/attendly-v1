"use client";

import { useRef, useState } from "react";
import { Settings, ChevronRight, Camera } from "lucide-react";

/**
 * Collapsible Settings row for the staff Profile page.
 *
 * Replaces the old static Settings <Link>. Expands inline to reveal sub-items
 * (currently just "Change Photo"). Photo upload triggers a hidden <input type="file">
 * and submits to the server action passed in via props.
 */
export default function SettingsAccordion({
  onUpload,
}: {
  onUpload: (formData: FormData) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

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
        <div className="bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800">
          {/* Change Photo sub-item */}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-full flex items-center gap-3 pl-16 pr-5 py-4 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all"
          >
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Camera size={16} />
            </div>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
              Change Photo
            </span>
          </button>

          {/* Hidden file input form */}
          <form
            ref={formRef}
            action={onUpload}
            encType="multipart/form-data"
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
