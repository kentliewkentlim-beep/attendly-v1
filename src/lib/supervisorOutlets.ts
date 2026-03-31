export function getAllowedOutletIds(user: {
  outletId?: string | null;
  supervisorOutlets?: Array<{ outletId: string }>;
} | null | undefined, companyOutletIds: string[]) {
  const controlled = user?.supervisorOutlets?.map((x) => x.outletId).filter(Boolean) ?? [];
  if (controlled.length > 0) return Array.from(new Set(controlled));
  if (user?.outletId) return [user.outletId];
  return companyOutletIds;
}

