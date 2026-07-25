import { cookies } from "next/headers";
import prisma from "./prisma";
import {
  SESSION_COOKIE,
  SESSION_TTL_MS,
  SESSION_TTL_REMEMBER_MS,
  signSession,
  verifySession,
} from "./session";

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const userId = await verifySession(cookieStore.get(SESSION_COOKIE)?.value);

  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      company: true,
      outlet: true,
    },
  });
  if (!user) return null;

  try {
    const supervisorOutlets = await (prisma as any).supervisorOutlet.findMany({
      where: { supervisorId: user.id },
      include: { outlet: true },
    });
    return { ...user, supervisorOutlets };
  } catch {
    return { ...user, supervisorOutlets: [] };
  }
}

export async function login(userId: string, rememberMe = false) {
  const ttlMs = rememberMe ? SESSION_TTL_REMEMBER_MS : SESSION_TTL_MS;
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, await signSession(userId, ttlMs), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(ttlMs / 1000),
  });
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  // Clear the pre-signed-session cookie too, so anyone still holding one from
  // before this change is fully logged out rather than left with a stale cookie.
  cookieStore.delete("userId");
}
