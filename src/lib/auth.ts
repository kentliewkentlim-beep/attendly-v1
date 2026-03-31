import { cookies } from "next/headers";
import prisma from "./prisma";

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;

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

export async function login(userId: string) {
  const cookieStore = await cookies();
  cookieStore.set("userId", userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("userId");
}
