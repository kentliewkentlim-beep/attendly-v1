"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CheckCircle2, Loader2 } from "lucide-react";
import { acknowledgeChapter } from "../actions";

// Tailwind-styled Markdown renderers (replaces Tailwind typography plugin)
const mdComponents: React.ComponentProps<typeof ReactMarkdown>["components"] = {
  h1: ({ children }) => (
    <h1 className="mt-8 mb-4 text-2xl font-bold text-slate-900 dark:text-slate-100">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mt-10 mb-4 border-b border-slate-200 pb-2 text-xl font-bold text-slate-900 dark:border-slate-700 dark:text-slate-100">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-8 mb-3 text-lg font-bold text-slate-800 dark:text-slate-200">{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 className="mt-6 mb-2 text-base font-semibold text-slate-800 dark:text-slate-200">{children}</h4>
  ),
  h5: ({ children }) => (
    <h5 className="mt-5 mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">{children}</h5>
  ),
  p: ({ children }) => (
    <p className="my-4 text-[15px] leading-[1.85] text-slate-700 dark:text-slate-300">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="my-4 ml-6 list-disc space-y-2 text-[15px] leading-[1.75] text-slate-700 dark:text-slate-300 marker:text-purple-500">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="my-4 ml-6 list-decimal space-y-2 text-[15px] leading-[1.75] text-slate-700 dark:text-slate-300 marker:font-semibold marker:text-purple-600">{children}</ol>
  ),
  li: ({ children }) => <li className="pl-1">{children}</li>,
  strong: ({ children }) => (
    <strong className="font-semibold text-slate-900 dark:text-slate-100">{children}</strong>
  ),
  em: ({ children }) => <em className="italic text-slate-700 dark:text-slate-300">{children}</em>,
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-purple-600 underline underline-offset-2 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300">{children}</a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-5 rounded-r-lg border-l-4 border-purple-400 bg-purple-50 px-4 py-3 text-[15px] leading-[1.75] text-slate-700 dark:border-purple-600 dark:bg-purple-950/20 dark:text-slate-300">{children}</blockquote>
  ),
  hr: () => <hr className="my-8 border-0 border-t border-slate-200 dark:border-slate-700" />,
  code: ({ className, children, ...rest }) => {
    const inline = !className;
    return inline ? (
      <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[0.9em] font-mono text-pink-600 dark:bg-slate-800 dark:text-pink-400">{children}</code>
    ) : (
      <code className={className}>{children}</code>
    );
  },
  pre: ({ children }) => (
    <pre className="my-5 overflow-x-auto rounded-lg bg-slate-900 p-4 text-sm leading-6 text-slate-100 dark:bg-slate-950">{children}</pre>
  ),
  table: ({ children }) => (
    <div className="my-5 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
      <table className="w-full border-collapse text-[14px]">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-slate-100 dark:bg-slate-800">{children}</thead>
  ),
  th: ({ children }) => (
    <th className="border-b border-slate-200 px-3 py-2 text-left font-semibold text-slate-800 dark:border-slate-700 dark:text-slate-200">{children}</th>
  ),
  tr: ({ children }) => (
    <tr className="border-b border-slate-100 last:border-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40">{children}</tr>
  ),
  td: ({ children }) => (
    <td className="px-3 py-2 align-top text-slate-700 dark:text-slate-300">{children}</td>
  ),
  img: (props) => (
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    <img {...props} className="my-5 max-w-full rounded-xl" alt={props.alt ?? ""} />
  ),
};

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
      <article className="text-slate-700 dark:text-slate-300">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
          {content}
        </ReactMarkdown>
      </article>

      <div className="my-10 h-px bg-slate-200 dark:bg-slate-800" />

      <section className="pb-6">
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
