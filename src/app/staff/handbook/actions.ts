"use server";

/**
 * Staff Handbook — Server Actions
 *
 * 3 actions:
 *   - getChapters()        list + current user ack state
 *   - getChapter(id)       single chapter with Markdown
 *   - acknowledgeChapter() per-version, idempotent
 *
 * Auth: existing getCurrentUser() cookie session (same as other /staff/* routes).
 */

import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type ChapterListItem = {
  chapterId: string;
  chapterNum: string;
  title: string;
  version: string;
  sortOrder: number;
  updatedAt: Date;
  isAcknowledged: boolean;
  acknowledgedAt: Date | null;
};

export type ChapterDetail = {
  chapterId: string;
  chapterNum: string;
  title: string;
  content: string;
  version: string;
  updatedAt: Date;
  isAcknowledged: boolean;
  acknowledgedAt: Date | null;
};

export async function getChapters(): Promise<ChapterListItem[]> {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) redirect("/");

  const [chapters, acks] = await Promise.all([
    (prisma as any).sopChapter.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: {
        chapterId: true,
        chapterNum: true,
        title: true,
        version: true,
        sortOrder: true,
        updatedAt: true,
      },
    }),
    (prisma as any).sopAcknowledgment.findMany({
      where: { userId: sessionUser.id },
      select: { chapterId: true, version: true, acknowledgedAt: true },
    }),
  ]);

  const ackMap = new Map<string, Date>();
  for (const a of acks as Array<{ chapterId: string; version: string; acknowledgedAt: Date }>) {
    ackMap.set(`${a.chapterId}::${a.version}`, a.acknowledgedAt);
  }

  return (chapters as Array<any>).map((c) => {
    const ackedAt = ackMap.get(`${c.chapterId}::${c.version}`) ?? null;
    return {
      chapterId: c.chapterId,
      chapterNum: c.chapterNum,
      title: c.title,
      version: c.version,
      sortOrder: c.sortOrder,
      updatedAt: c.updatedAt,
      isAcknowledged: !!ackedAt,
      acknowledgedAt: ackedAt,
    };
  });
}

export async function getChapter(chapterId: string): Promise<ChapterDetail | null> {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) redirect("/");

  const chapter = await (prisma as any).sopChapter.findFirst({
    where: { chapterId, isActive: true },
    select: {
      chapterId: true,
      chapterNum: true,
      title: true,
      content: true,
      version: true,
      updatedAt: true,
    },
  });
  if (!chapter) return null;

  const ack = await (prisma as any).sopAcknowledgment.findUnique({
    where: {
      userId_chapterId_version: {
        userId: sessionUser.id,
        chapterId: chapter.chapterId,
        version: chapter.version,
      },
    },
    select: { acknowledgedAt: true },
  });

  return {
    chapterId: chapter.chapterId,
    chapterNum: chapter.chapterNum,
    title: chapter.title,
    content: chapter.content,
    version: chapter.version,
    updatedAt: chapter.updatedAt,
    isAcknowledged: !!ack,
    acknowledgedAt: ack?.acknowledgedAt ?? null,
  };
}

export async function acknowledgeChapter(formData: FormData) {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) redirect("/");

  const chapterId = formData.get("chapterId") as string;
  const version = formData.get("version") as string;
  if (!chapterId || !version) return { success: false, error: "Missing chapterId or version" };

  const chapter = await (prisma as any).sopChapter.findFirst({
    where: { chapterId, isActive: true },
    select: { chapterId: true, version: true },
  });
  if (!chapter) return { success: false, error: "Chapter not found" };
  if (chapter.version !== version) {
    return { success: false, error: `Chapter version mismatch. Current: ${chapter.version}, submitted: ${version}` };
  }

  await (prisma as any).sopAcknowledgment.upsert({
    where: {
      userId_chapterId_version: {
        userId: sessionUser.id,
        chapterId,
        version,
      },
    },
    update: {},
    create: { userId: sessionUser.id, chapterId, version },
  });

  revalidatePath("/staff/handbook");
  revalidatePath(`/staff/handbook/${chapterId}`);

  return { success: true };
}
