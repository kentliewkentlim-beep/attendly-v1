"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CheckCircle2, Loader2 } from "lucide-react";
import { acknowledgeChapter } from "../actions";

export default function HandbookChapterClient({
  chapterId,
  version,
  content,
  isAcknowledged,
  acknowledgedAt,
}: {
  chapterId: string;
  version: string;
  content: string;
  isAcknowledged: boolean;
  acknowledgedAt: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleAcknowledge() {
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("chapterId", chapterId);
      fd.set("version", version);
      const res = await acknowledgeChapter(fd);
      if (!res?.success) {
        setError(res?.error || "签收失败,请重试");
        return;
      }
      router.refresh();
    });
  }

  return (
    <>
      <article className="prose prose-slate max-w-none prose-headings:scroll-mt-16 prose-h2:mt-8 prose-h2:text-lg prose-h3:mt-6 prose-h3:text-base prose-p:leading-[1.8] prose-p:text-slate-700 prose-li:text-slate-700 prose-strong:text-slate-900 prose-a:text-purple-600 prose-table:text-sm prose-th:bg-slate-100 prose-img:rounded-xl dark:prose-invert dark:prose-p:text-slate-300 dark:prose-li:text-slate-300 dark:prose-strong:text-slate-100 dark:prose-a:text-purple-400 dark:prose-th:bg-slate-800">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </article>

      <div className="my-8 h-px bg-slate-200 dark:bg-slate-800" />

      <section className="pb-4">
        {isAcknowledged ? (
          <div className="flex items-center justify-center gap-2 rounded-xl bg-slate-100 py-4 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span>
              你已于{" "}
              {acknowledgedAt
                ? new Date(acknowledgedAt).toLocaleString("zh-CN", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: "Asia/Kuala_Lumpur",
                  })
                : "已"}{" "}
              签收
            </span>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={handleAcknowledge}
              disabled={pending}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-4 text-sm font-semibold text-white shadow-sm transition-all hover:bg-green-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70 dark:bg-green-600 dark:hover:bg-green-500"
            >
              {pending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>签收中…</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>我已阅读并理解本章</span>
                </>
              )}
            </button>
            <p className="mt-2 text-center text-xs text-slate-500 dark:text-slate-400">
              签收即表示你已阅读本章内容并同意遵守
            </p>
            {error && (
              <div className="mt-3 rounded-lg bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/30 dark:text-red-400">
                {error}
              </div>
            )}
          </>
        )}
      </section>
    </>
  );
}
