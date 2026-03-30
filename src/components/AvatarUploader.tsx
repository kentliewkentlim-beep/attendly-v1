"use client";

import { useRef } from "react";

export default function AvatarUploader({
  src,
  onUpload,
  size = 64,
}: {
  src: string;
  onUpload: (formData: FormData) => Promise<void>;
  size?: number;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        className="rounded-2xl overflow-hidden border border-slate-200 active:scale-[0.98]"
        onClick={() => fileRef.current?.click()}
        style={{ width: size, height: size }}
      >
        <img src={src} alt="Avatar" className="w-full h-full object-cover" />
      </button>
      <form
        ref={formRef}
        action={onUpload}
        className="flex items-center gap-3"
        encType="multipart/form-data"
      >
        <input
          ref={fileRef}
          type="file"
          name="avatar"
          accept="image/*"
          capture="user"
          className="hidden"
          onChange={() => formRef.current?.requestSubmit()}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="px-4 py-2 rounded-xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest"
        >
          Upload
        </button>
      </form>
    </div>
  );
}
