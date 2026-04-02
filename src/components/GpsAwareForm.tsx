"use client";

import { useRef, useState } from "react";

export default function GpsAwareForm({
  action,
  children,
  requireGps = false,
  captureGps = true,
}: {
  action: (formData: FormData) => void | Promise<void>;
  children: React.ReactNode;
  requireGps?: boolean;
  captureGps?: boolean;
}) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const setHidden = (name: string, value: string) => {
    const form = formRef.current;
    if (!form) return;
    const el = form.querySelector<HTMLInputElement>(`input[name="${name}"]`);
    if (!el) return;
    el.value = value;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    const form = e.currentTarget;
    if (!captureGps) return;
    if (form.dataset.gpsReady === "1") return;

    e.preventDefault();

    if (!("geolocation" in navigator)) {
      setHidden("gpsDenied", requireGps ? "1" : "0");
      form.dataset.gpsReady = "1";
      form.requestSubmit();
      return;
    }

    setIsLocating(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 0,
        })
      );

      setHidden("gpsLat", String(pos.coords.latitude));
      setHidden("gpsLng", String(pos.coords.longitude));
      setHidden("gpsAccuracy", pos.coords.accuracy ? String(pos.coords.accuracy) : "");
      setHidden("gpsDenied", "0");
    } catch {
      setHidden("gpsDenied", "1");
    } finally {
      setIsLocating(false);
      form.dataset.gpsReady = "1";
      form.requestSubmit();
    }
  };

  return (
    <form ref={formRef} action={action} onSubmit={handleSubmit}>
      <input type="hidden" name="gpsLat" defaultValue="" />
      <input type="hidden" name="gpsLng" defaultValue="" />
      <input type="hidden" name="gpsAccuracy" defaultValue="" />
      <input type="hidden" name="gpsDenied" defaultValue="0" />
      <input type="hidden" name="gpsLocating" value={isLocating ? "1" : "0"} readOnly />
      {children}
    </form>
  );
}
