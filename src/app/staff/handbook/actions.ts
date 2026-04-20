"use server";

import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type Language = "zh" | "en" | "ms";

export type ChapterListItem = {
  chapterId: string;
  chapterNum: string;
  title: string;
  version: string;
  sortOrder: number;
  updatedAt: Date;
  isAcknowledged: boolean;
  acknowledgedAt: Date | null;
  hasEn: boolean;
  hasMs: boolean;
};

export type ChapterDetail = {
  chapterId: string;
  chapterNum: string;
  title: string;
  content: string;
  version: string;
  language: Language;
  updatedAt: Date;
  isAcknowledged: boolean;
  acknowledgedAt: Date | null;
  hasEn: boolean;
  hasMs: boolean;
};

// Default language when query uses an unavailable translation
function pickContent(
  chapter: { content: string; contentEn: string | null; contentMs: string | null },
  language: Language
): { content: string; actualLanguage: Language } {
  if (language === "en" && chapter.contentEn) return { content: chapter.contentEn, actualLanguage: "en" };
  if (language === "ms" && chapter.contentMs) return { content: chapter.contentMs, actualLanguage: "ms" };
  return { content: chapter.content, actualLanguage: "zh" };
}

export async function getChapters(language: Language = "zh"): Promise<ChapterListItem[]> {
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
        contentEn: true,
        contentMs: true,
      },
    }),
    (prisma as any).sopAcknowledgment.findMany({
      where: { userId: sessionUser.id, language },
      select: { chapterId: true, version: true, acknowledgedAt: true },
    }),
  ]);

  const ackMap = new Map<string, Date>();
  for (const a of acks as Array<any>) {
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
      hasEn: !!c.contentEn,
      hasMs: !!c.contentMs,
    };
  });
}

export async function getChapter(
  chapterId: string,
  language: Language = "zh"
): Promise<ChapterDetail | null> {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) redirect("/");

  const chapter = await (prisma as any).sopChapter.findFirst({
    where: { chapterId, isActive: true },
    select: {
      chapterId: true,
      chapterNum: true,
      title: true,
      content: true,
      contentEn: true,
      contentMs: true,
      version: true,
      updatedAt: true,
    },
  });
  if (!chapter) return null;

  const { content, actualLanguage } = pickContent(chapter, language);

  const ack = await (prisma as any).sopAcknowledgment.findUnique({
    where: {
      userId_chapterId_version_language: {
        userId: sessionUser.id,
        chapterId: chapter.chapterId,
        version: chapter.version,
        language: actualLanguage,
      },
    },
    select: { acknowledgedAt: true },
  });

  return {
    chapterId: chapter.chapterId,
    chapterNum: chapter.chapterNum,
    title: chapter.title,
    content,
    version: chapter.version,
    language: actualLanguage,
    updatedAt: chapter.updatedAt,
    isAcknowledged: !!ack,
    acknowledgedAt: ack?.acknowledgedAt ?? null,
    hasEn: !!chapter.contentEn,
    hasMs: !!chapter.contentMs,
  };
}

export async function acknowledgeChapter(formData: FormData) {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) redirect("/");

  const chapterId = formData.get("chapterId") as string;
  const version = formData.get("version") as string;
  const language = (formData.get("language") as Language) || "zh";
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
      userId_chapterId_version_language: {
        userId: sessionUser.id,
        chapterId,
        version,
        language,
      },
    },
    update: {},
    create: { userId: sessionUser.id, chapterId, version, language },
  });

  revalidatePath("/staff/handbook");
  revalidatePath(`/staff/handbook/${chapterId}`);

  return { success: true };
}
