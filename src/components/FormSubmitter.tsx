"use client";

import { ReactNode } from "react";

export default function FormSubmitter({ children }: { children: ReactNode }) {
  const handleChange = (e: React.ChangeEvent<any>) => {
    e.target.form?.requestSubmit();
  };

  // We clone the child to add the onChange handler
  // This is a bit hacky but works for simple cases.
  // Better would be to create specific client components.
  return (
    <div onChange={handleChange}>
      {children}
    </div>
  );
}