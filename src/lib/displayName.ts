export function getDisplayName(user: { name?: string | null; nickname?: string | null } | null | undefined) {
  const nickname = user?.nickname?.trim();
  if (nickname) return nickname;
  const name = user?.name?.trim();
  if (name) return name;
  return "Unknown";
}

export function getSecondaryName(user: { name?: string | null; nickname?: string | null } | null | undefined) {
  const nickname = user?.nickname?.trim();
  const name = user?.name?.trim();
  if (nickname && name && nickname !== name) return name;
  return null;
}

export function getInitials(user: { name?: string | null; nickname?: string | null } | null | undefined) {
  const base = getDisplayName(user);
  const parts = base.split(/\s+/).filter(Boolean);
  const initials = parts.map((p) => p[0]?.toUpperCase()).join("");
  return initials.slice(0, 2) || "?";
}

export function getShortName(user: { name?: string | null; nickname?: string | null } | null | undefined) {
  const base = getDisplayName(user);
  const first = base.split(/\s+/).filter(Boolean)[0];
  return first || base || "User";
}

