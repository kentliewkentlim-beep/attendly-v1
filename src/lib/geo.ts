export function haversineDistanceMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return R * c;
}

export function parseGpsFromForm(formData: FormData) {
  const lat = formData.get("gpsLat");
  const lng = formData.get("gpsLng");
  const accuracy = formData.get("gpsAccuracy");
  const denied = formData.get("gpsDenied");

  const deniedFlag = denied === "1";
  const latNum = lat === null ? null : Number(lat);
  const lngNum = lng === null ? null : Number(lng);
  const accNum = accuracy === null ? null : Number(accuracy);

  const ok =
    !deniedFlag &&
    Number.isFinite(latNum) &&
    Number.isFinite(lngNum) &&
    latNum !== null &&
    lngNum !== null;

  return {
    ok,
    denied: deniedFlag,
    lat: ok ? (latNum as number) : null,
    lng: ok ? (lngNum as number) : null,
    accuracy: Number.isFinite(accNum) ? (accNum as number) : null,
  };
}

