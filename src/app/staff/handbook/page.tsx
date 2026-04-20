import Link from "next/link";
import { BookOpen, CheckCircle2, ChevronRight } from "lucide-react";
import { getChapters, type Language } from "./actions";

const LANG_LABELS: Record<Language, { header: string; directory: string; progress: string; acked: string; notAcked: string; empty: string; remainingPrefix: string; remainingSuffix: string; allDone: string; heading: string; subheading: string }> = {
  zh: {
    header: "员工手册",
    subheading: "Staff Handbook",
    directory: "章节目录",
    progress: "签收进度",
    acked: "已签收",
    notAcked: "未签收",
    empty: "暂无章节。请联系管理员导入 SOP 内容。",
    remainingPrefix: "还有 ",
    remainingSuffix: " 章待阅读和签收",
    allDone: "🎉 全部章节已完成签收",
    heading: "员工手册",
  },
  en: {
    header: "Staff Handbook",
    subheading: "员工手册",
    directory: "Chapters",
    progress: "Acknowledgment progress",
    acked: "Acknowledged",
    notAcked: "Not acknowledged",
    empty: "No chapters yet. Please contact admin to import SOP content.",
    remainingPrefix: "",
    remainingSuffix: " chapter(s) left to read and acknowledge",
    allDone: "🎉 All chapters acknowledged",
    heading: "Staff Handbook",
  },
  ms: {
    header: "Buku Panduan Staf",
    subheading: "Staff Handbook",
    directory: "Senarai Bab",
    progress: "Kemajuan pengesahan",
    acked: "Disahkan",
    notAcked: "Belum disahkan",
    empty: "Belum ada bab. Sila hubungi admin untuk import kandungan SOP.",
    remainingPrefix: "Masih ada ",
    remainingSuffix: " bab untuk dibaca dan disahkan",
    allDone: "🎉 Semua bab telah disahkan",
    heading: "Buku Panduan Staf",
  },
};

export default async function HandbookListPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await searchParams) || {};
  const rawLang = typeof sp.lang === "string" ? sp.lang : "en";
  const language: Language =
    rawLang === "zh" || rawLang === "en" || rawLang === "ms" ? rawLang : "en";

  const chapters = await getChapters(language);
  const L = LANG_LABELS[language];

  const total = chapters.length;
  const ackedCount = chapters.filter((c) => c.isAcknowledged).length;
  const progressPct = total === 0 ? 0 : Math.round((ackedCount / total) * 100);
  const currentVersion = chapters[0]?.version ?? "V1.0";

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:py-8">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-100 dark:bg-purple-900/30">
          <BookOpen className="h-6 w-6 text-purple-600 dark:text-purple-400" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            {L.heading}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {L.subheading} · {currentVersion}
          </p>
        </div>
      </div>

      {/* Language switcher */}
      <nav className="mb-4 flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
        {([
          { code: "en" as const, label: "English" },
          { code: "zh" as const, label: "中文" },
          { code: "ms" as const, label: "Bahasa" },
        ]).map((t) => {
          const isActive = language === t.code;
          return (
            <Link
              key={t.code}
              href={`/staff/handbook?lang=${t.code}`}
              className={`flex-1 rounded-lg px-3 py-2 text-center text-sm font-medium transition-all ${
                isActive
                  ? "bg-white text-purple-700 shadow-sm dark:bg-slate-900 dark:text-purple-300"
                  : "text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-slate-100"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>

      <section className="mb-5 rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50 to-indigo-50 p-4 dark:border-purple-900/40 dark:from-purple-950/30 dark:to-indigo-950/30">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
              {L.progress}
            </span>
          </div>
          <span className="text-sm font-semibold tabular-nums text-purple-700 dark:text-purple-300">
            {ackedCount} / {total}
          </span>
        </div>

        <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/70 dark:bg-slate-800/50">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-green-500 transition-all duration-500 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          {ackedCount === total
            ? L.allDone
            : `${L.remainingPrefix}${total - ackedCount}${L.remainingSuffix}`}
        </p>
      </section>

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
          <BookOpen className="h-4 w-4" />
          {L.directory}
        </h2>

        {chapters.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {L.empty}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {chapters.map((c) => (
              <Link
                key={c.chapterId}
                href={`/staff/handbook/${c.chapterId}?lang=${language}`}
                className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-purple-300 hover:shadow-md active:scale-[0.99] dark:border-slate-800 dark:bg-slate-900 dark:hover:border-purple-700"
              >
                <div className="flex h-11 min-w-[56px] flex-shrink-0 items-center justify-center rounded-xl bg-slate-100 px-2 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {c.chapterNum}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                    {c.title}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2">
                    {c.isAcknowledged ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        <CheckCircle2 className="h-3 w-3" />
                        {L.acked}
                      </span>
                    ) : (
                      <span className="inline-flex rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        {L.notAcked}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">
                      {c.version}
                    </span>
                  </div>
                </div>

                <ChevronRight className="h-5 w-5 flex-shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 dark:text-slate-500" />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
