"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

/**
 * Small avatar thumbnail that opens a full-screen lightbox on click.
 * Falls back to the provided `fallback` node when no src is available.
 *
 * Used on /admin/employee to let admins click any staff photo and see it enlarged.
 */
export default function AvatarLightbox({
  src,
  alt,
  fallback,
  caption,
}: {
  src: string | null | undefined;
  alt: string;
  fallback?: React.ReactNode;
  caption?: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!src) {
    return (
      <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 font-bold mr-4 border border-blue-100/50 dark:border-blue-900/30">
        {fallback}
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        className="w-10 h-10 rounded-xl overflow-hidden mr-4 border border-blue-100/50 dark:border-blue-900/30 hover:ring-2 hover:ring-blue-400 hover:ring-offset-1 transition-all cursor-zoom-in block p-0 bg-transparent"
        aria-label={`View ${alt} photo`}
      >
        <img
          src={src}
          alt={alt}
          className="w-10 h-10 object-cover"
          loading="lazy"
        />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8 cursor-zoom-out animate-in fade-in duration-150"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={alt}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={src}
              alt={alt}
              className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl"
            />
            {caption && (
              <p className="mt-4 text-white text-sm font-bold bg-black/50 px-4 py-2 rounded-full">
                {caption}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur-md transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
    </>
  );
}
