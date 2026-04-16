export function getAllowedOutletIds(user: {
  outletId?: bigint | null;
  supervisorOutlets?: Array<{ outletId: bigint }>;
} | null | undefined, companyOutletIds: string[]): string[] {
  const controlled = user?.supervisorOutlets?.map((x) => x.outletId.toString()).filter(Boolean) ?? [];
  if (controlled.length > 0) return Array.from(new Set(controlled));
  if (user?.outletId) return [user.outletId.toString()];
  return companyOutletIds;
}
