import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getChapter, type Language } from "../actions";
import HandbookChapterClient from "./HandbookChapterClient";

export default async function HandbookChapterPage({
  params,
  searchParams,
}: {
  params: Promise<{ chapterId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { chapterId } = await params;
  const sp = (await searchParams) || {};
  const rawLang = typeof sp.lang === "string" ? sp.lang : "zh";
  const language: Language =
    rawLang === "en" || rawLang === "ms" ? rawLang : "zh";

  const chapter = await getChapter(chapterId, language);
  if (!chapter) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-5 sm:py-6">
      <div className="mb-4 flex items-center gap-2">
        <Link
          href="/staff/handbook"
          className="flex h-9 w-9 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-slate-100 active:scale-95 dark:text-slate-300 dark:hover:bg-slate-800"
          aria-label="Back"
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

      {/* Language Tabs */}
      <nav className="mb-4 flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
        {(
          [
            { code: "zh", label: "中文", available: true },
            { code: "en", label: "English", available: chapter.hasEn },
            { code: "ms", label: "Bahasa", available: chapter.hasMs },
          ] as const
        ).map((t) => {
          const isActive = chapter.language === t.code;
          const disabled = !t.available;
          return (
            <Link
              key={t.code}
              href={`/staff/handbook/${chapter.chapterId}?lang=${t.code}`}
              aria-disabled={disabled}
              className={`flex-1 rounded-lg px-3 py-2 text-center text-sm font-medium transition-all ${
                isActive
                  ? "bg-white text-purple-700 shadow-sm dark:bg-slate-900 dark:text-purple-300"
                  : disabled
                  ? "cursor-not-allowed text-slate-400 dark:text-slate-600"
                  : "text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-slate-100"
              }`}
              onClick={disabled ? (e) => e.preventDefault() : undefined}
            >
              {t.label}
              {!t.available && <span className="ml-1 text-[10px]">(暂无)</span>}
            </Link>
          );
        })}
      </nav>

      <div className="my-4 h-px bg-slate-200 dark:bg-slate-800" />

      <HandbookChapterClient
        chapterId={chapter.chapterId}
        version={chapter.version}
        language={chapter.language}
        content={chapter.content}
        isAcknowledged={chapter.isAcknowledged}
        acknowledgedAt={
          chapter.acknowledgedAt ? chapter.acknowledgedAt.toISOString() : null
        }
      />
    </div>
  );
}
