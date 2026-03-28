"use client";

import { ReactNode } from "react";

export function AutoSubmit({ children }: { children: ReactNode }) {
  return (
    <div onChange={(e) => {
      const form = (e.target as any).form;
      if (form) form.requestSubmit();
    }}>
      {children}
    </div>
  );
}