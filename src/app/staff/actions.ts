"use server";

/**
 * Shared server actions for all /staff/* routes.
 *
 * These are used by:
 *   - src/app/staff/layout.tsx (passes to <BottomNav />)
 *   - src/app/staff/page.tsx   (passes to announcement Acknowledge button)
 *
 * Extracted from staff/page.tsx so BottomNav in the shared layout can call them.
 */

import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { format, addDays } from "date-fns";
import { haversineDistanceMeters, parseGpsFromForm } from "@/lib/geo";

export async function handleCheckIn(formData: FormData) {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) return;
  const localDate =
    (formData.get("localDate") as string) || format(new Date(), "yyyy-MM-dd");
  const gps = parseGpsFromForm(formData);

  const rosterForDay = await prisma.roster.findFirst({
    where: {
      userId: sessionUser.id,
      date: {
        gte: new Date(localDate),
        lt: addDays(new Date(localDate), 1),
      },
    },
    select: { outletId: true },
  });
  const targetOutletId =
    rosterForDay?.outletId || sessionUser.outletId || null;
  const userFlags = await (prisma as any).user.findUnique({
    where: { id: sessionUser.id },
    select: { requiresGeofence: true },
  });
  const isRemoteCheckin = userFlags?.requiresGeofence === false;
  if (targetOutletId) {
    const outlet = await (prisma as any).outlet
      .findUnique({
        where: { id: targetOutletId },
        select: { latitude: true, longitude: true, geofenceMeters: true },
      })
      .catch(() => null);
    const enforce =
      !!outlet?.latitude && !!outlet?.longitude && !!outlet?.geofenceMeters;
    if (enforce) {
      if (!gps.ok) redirect(`/staff?error=gps_required`);
      const distance = haversineDistanceMeters(
        { lat: gps.lat!, lng: gps.lng! },
        { lat: outlet!.latitude!, lng: outlet!.longitude! }
      );
      if (
        !isRemoteCheckin &&
        distance > (outlet!.geofenceMeters as number)
      )
        redirect(`/staff?error=gps_outside`);
    }
  }

  const nowMY = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Kuala_Lumpur" })
  );
  const isLate =
    nowMY.getHours() > 9 ||
    (nowMY.getHours() === 9 && nowMY.getMinutes() > 0);

  try {
    await (prisma as any).attendance.upsert({
      where: {
        userId_date: { userId: sessionUser.id, date: localDate },
      },
      update: {
        isRemoteCheckin,
        checkIn: new Date(),
        isLate,
        checkInLat: gps.lat,
        checkInLng: gps.lng,
        checkInAccuracy: gps.accuracy,
      },
      create: {
        isRemoteCheckin,
        userId: sessionUser.id,
        date: localDate,
        checkIn: new Date(),
        isLate,
        checkInLat: gps.lat,
        checkInLng: gps.lng,
        checkInAccuracy: gps.accuracy,
      },
    });
  } catch {
    await prisma.attendance.upsert({
      where: {
        userId_date: { userId: sessionUser.id, date: localDate },
      },
      update: { checkIn: new Date(), isLate },
      create: {
        userId: sessionUser.id,
        date: localDate,
        checkIn: new Date(),
        isLate,
      },
    });
  }
  revalidatePath("/staff");
  revalidatePath("/staff/calendar");
  revalidatePath("/staff/attendance");
  revalidatePath("/staff/leave");
}

export async function handleLunchStart(formData: FormData) {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) return;
  const localDate =
    (formData.get("localDate") as string) || format(new Date(), "yyyy-MM-dd");
  const gps = parseGpsFromForm(formData);
  try {
    await (prisma as any).attendance.update({
      where: { userId_date: { userId: sessionUser.id, date: localDate } },
      data: {
        lunchStart: new Date(),
        lunchStartLat: gps.lat,
        lunchStartLng: gps.lng,
        lunchStartAccuracy: gps.accuracy,
      },
    });
  } catch {
    await prisma.attendance.update({
      where: { userId_date: { userId: sessionUser.id, date: localDate } },
      data: { lunchStart: new Date() },
    });
  }
  revalidatePath("/staff");
  revalidatePath("/staff/calendar");
  revalidatePath("/staff/attendance");
  revalidatePath("/staff/leave");
}

export async function handleLunchEnd(formData: FormData) {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) return;
  const localDate =
    (formData.get("localDate") as string) || format(new Date(), "yyyy-MM-dd");
  const gps = parseGpsFromForm(formData);
  try {
    await (prisma as any).attendance.update({
      where: { userId_date: { userId: sessionUser.id, date: localDate } },
      data: {
        lunchEnd: new Date(),
        lunchEndLat: gps.lat,
        lunchEndLng: gps.lng,
        lunchEndAccuracy: gps.accuracy,
      },
    });
  } catch {
    await prisma.attendance.update({
      where: { userId_date: { userId: sessionUser.id, date: localDate } },
      data: { lunchEnd: new Date() },
    });
  }
  revalidatePath("/staff");
  revalidatePath("/staff/calendar");
  revalidatePath("/staff/attendance");
  revalidatePath("/staff/leave");
}

export async function handleCheckOut(formData: FormData) {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) return;
  const localDate =
    (formData.get("localDate") as string) || format(new Date(), "yyyy-MM-dd");
  const gps = parseGpsFromForm(formData);
  try {
    await (prisma as any).attendance.update({
      where: { userId_date: { userId: sessionUser.id, date: localDate } },
      data: {
        checkOut: new Date(),
        checkOutLat: gps.lat,
        checkOutLng: gps.lng,
        checkOutAccuracy: gps.accuracy,
      },
    });
  } catch {
    await prisma.attendance.update({
      where: { userId_date: { userId: sessionUser.id, date: localDate } },
      data: { checkOut: new Date() },
    });
  }
  revalidatePath("/staff");
  revalidatePath("/staff/calendar");
  revalidatePath("/staff/attendance");
  revalidatePath("/staff/leave");
}

export async function handleAcknowledgeAnnouncement(formData: FormData) {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) return;
  const announcementId = formData.get("announcementId") as string;
  if (!announcementId) return;
  await (prisma as any).announcementAck.upsert({
    where: {
      announcementId_userId: {
        announcementId,
        userId: sessionUser.id,
      },
    },
    update: {},
    create: { announcementId, userId: sessionUser.id },
  });
  revalidatePath("/staff");
  revalidatePath("/staff/calendar");
  revalidatePath("/staff/attendance");
  revalidatePath("/staff/leave");
  revalidatePath("/staff/profile");
}
