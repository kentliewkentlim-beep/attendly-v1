"use client";

import { useEffect, useState } from "react";

export default function LocalDateInput() {
  const [val, setVal] = useState("");
  useEffect(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    setVal(`${yyyy}-${mm}-${dd}`);
  }, []);
  return <input type="hidden" name="localDate" value={val} readOnly />;
}

