import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getChapter } from "../actions";
import HandbookChapterClient from "./HandbookChapterClient";

export default async function HandbookChapterPage({
  params,
}: {
  params: Promise<{ chapterId: string }>;
}) {
  const { chapterId } = await params;
  const chapter = await getChapter(chapterId);

  if (!chapter) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-5 sm:py-6">
      <div className="mb-4 flex items-center gap-2">
        <Link
          href="/staff/handbook"
          className="flex h-9 w-9 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-slate-100 active:scale-95 dark:text-slate-300 dark:hover:bg-slate-800"
          aria-label="返回章节列表"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <span className="text-sm text-slate-500 dark:text-slate-400">
          {chapter.chapterNum}
        </span>
      </div>

      <header className="mb-6">
        <div className="mb-1 text-xs font-medium uppercase tracking-wide text-purple-600 dark:text-purple-400">
          {chapter.chapterNum}
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          {chapter.title}
        </h1>
        <div className="mt-2 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span>版本 {chapter.version}</span>
          <span>·</span>
          <span>
            更新于{" "}
            {chapter.updatedAt.toLocaleDateString("zh-CN", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        </div>
      </header>

      <div className="my-4 h-px bg-slate-200 dark:bg-slate-800" />

      <HandbookChapterClient
        chapterId={chapter.chapterId}
        version={chapter.version}
        content={chapter.content}
        isAcknowledged={chapter.isAcknowledged}
        acknowledgedAt={
          chapter.acknowledgedAt ? chapter.acknowledgedAt.toISOString() : null
        }
      />
    </div>
  );
}
