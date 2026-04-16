export function getAllowedOutletIds(user: {
  outletId?: bigint | null;
  supervisorOutlets?: Array<{ outletId: bigint }>;
} | null | undefined, companyOutletIds: bigint[]): bigint[] {
  const controlled = user?.supervisorOutlets?.map((x) => x.outletId).filter(Boolean) ?? [];
  if (controlled.length > 0) return Array.from(new Set(controlled));
  if (user?.outletId) return [user.outletId];
  return companyOutletIds;
}
