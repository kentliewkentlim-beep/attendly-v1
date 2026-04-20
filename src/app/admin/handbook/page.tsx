import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BookOpen, CheckCircle2, XCircle, Filter, ArrowLeft } from "lucide-react";

/**
 * Admin Handbook Reporting Page
 * 路由:/admin/handbook
 *
 * 展示 Staff × Chapter 签收矩阵,KPI 卡片,按 outlet/company 过滤
 * 权限:仅 ADMIN / SUPERVISOR 可访问
 */
export default async function AdminHandbookPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) redirect("/");

  const me = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { role: true },
  });
  if (!me || (me.role !== "ADMIN" && me.role !== "SUPERVISOR")) {
    redirect("/staff");
  }

  const params = (await searchParams) || {};
  const outletFilter = typeof params.outlet === "string" ? params.outlet : "";
  const companyFilter = typeof params.company === "string" ? params.company : "";

  // 查所有 ACTIVE 员工(带 outlet + company)
  const userWhere: any = { status: "ACTIVE" };
  if (outletFilter) userWhere.outletId = BigInt(outletFilter);
  if (companyFilter) userWhere.companyId = companyFilter;

  const [users, chapters, acks, outlets, companies] = await Promise.all([
    prisma.user.findMany({
      where: userWhere,
      select: {
        id: true,
        name: true,
        role: true,
        outlet: { select: { id: true, name: true } },
        company: { select: { id: true, name: true } },
      },
      orderBy: [{ outlet: { name: "asc" } }, { name: "asc" }],
    }),
    (prisma as any).sopChapter.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: {
        chapterId: true,
        chapterNum: true,
        title: true,
        version: true,
      },
    }),
    (prisma as any).sopAcknowledgment.findMany({
      select: {
        userId: true,
        chapterId: true,
        version: true,
        acknowledgedAt: true,
      },
    }),
    (prisma as any).outlet.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.company.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  // Map key: `${userId}::${chapterId}::${version}`
  const ackMap = new Map<string, Date>();
  for (const a of acks as Array<any>) {
    ackMap.set(`${a.userId}::${a.chapterId}::${a.version}`, a.acknowledgedAt);
  }

  // KPI
  const totalEmployees = users.length;
  const totalChapters = (chapters as Array<any>).length;
  const expectedAcks = totalEmployees * totalChapters;
  let acksDone = 0;
  for (const u of users) {
    for (const c of chapters as Array<any>) {
      if (ackMap.has(`${u.id}::${c.chapterId}::${c.version}`)) acksDone++;
    }
  }
  const completionPct =
    expectedAcks === 0 ? 0 : Math.round((acksDone / expectedAcks) * 100);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/admin"
          className="flex h-9 w-9 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-100 dark:bg-purple-900/30">
          <BookOpen className="h-6 w-6 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            员工手册签收报表
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Staff Handbook · Acknowledgment Report
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs text-slate-500 dark:text-slate-400">员工总数</div>
          <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {totalEmployees}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs text-slate-500 dark:text-slate-400">章节数</div>
          <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {totalChapters}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs text-slate-500 dark:text-slate-400">已签收 / 应签</div>
          <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
            <span className="text-green-600 dark:text-green-400">{acksDone}</span>
            <span className="text-slate-400 dark:text-slate-600"> / {expectedAcks}</span>
          </div>
        </div>
        <div className="rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50 p-4 shadow-sm dark:border-purple-800 dark:from-purple-950/30 dark:to-indigo-950/30">
          <div className="text-xs text-purple-600 dark:text-purple-400">整体完成率</div>
          <div className="mt-1 text-2xl font-bold text-purple-700 dark:text-purple-300">
            {completionPct}%
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <form
        method="get"
        className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      >
        <Filter className="h-4 w-4 text-slate-400" />
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
          Filter:
        </span>
        <select
          name="company"
          defaultValue={companyFilter}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
        >
          <option value="">All companies</option>
          {(companies as Array<any>).map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          name="outlet"
          defaultValue={outletFilter}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
        >
          <option value="">All outlets</option>
          {(outlets as Array<any>).map((o) => (
            <option key={String(o.id)} value={String(o.id)}>
              {o.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-lg bg-purple-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-purple-700"
        >
          Apply
        </button>
        {(outletFilter || companyFilter) && (
          <Link
            href="/admin/handbook"
            className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
          >
            Clear
          </Link>
        )}
      </form>

      {/* Matrix Table */}
      {users.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            无符合条件的员工。
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="sticky left-0 z-10 bg-slate-50 px-4 py-3 text-left font-semibold text-slate-700 dark:bg-slate-800/50 dark:text-slate-200">
                  员工
                </th>
                <th className="px-3 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">
                  门店
                </th>
                {(chapters as Array<any>).map((c) => (
                  <th
                    key={c.chapterId}
                    className="px-2 py-3 text-center font-semibold text-slate-700 dark:text-slate-200"
                    title={c.title}
                  >
                    <div className="whitespace-nowrap">{c.chapterNum}</div>
                    <div className="text-[10px] font-normal text-slate-500 dark:text-slate-400">
                      {c.title.length > 6 ? c.title.slice(0, 5) + "…" : c.title}
                    </div>
                  </th>
                ))}
                <th className="px-3 py-3 text-center font-semibold text-slate-700 dark:text-slate-200">
                  完成
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                let userAcksDone = 0;
                const cells = (chapters as Array<any>).map((c) => {
                  const ackedAt = ackMap.get(
                    `${u.id}::${c.chapterId}::${c.version}`
                  );
                  if (ackedAt) userAcksDone++;
                  return { chapterId: c.chapterId, ackedAt };
                });
                const userPct =
                  totalChapters === 0
                    ? 0
                    : Math.round((userAcksDone / totalChapters) * 100);
                const allDone = userAcksDone === totalChapters && totalChapters > 0;

                return (
                  <tr
                    key={u.id}
                    className="border-t border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40"
                  >
                    <td className="sticky left-0 z-10 bg-white px-4 py-2 dark:bg-slate-900">
                      <div className="font-medium text-slate-900 dark:text-slate-100">
                        {u.name}
                      </div>
                      <div className="text-[10px] uppercase tracking-wide text-slate-400">
                        {u.role}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                      <div>{u.outlet?.name ?? "—"}</div>
                      <div className="text-[10px] text-slate-400">
                        {u.company?.name ?? ""}
                      </div>
                    </td>
                    {cells.map((cell) => (
                      <td key={cell.chapterId} className="px-2 py-2 text-center">
                        {cell.ackedAt ? (
                          <span
                            title={new Date(cell.ackedAt).toLocaleString("zh-CN", {
                              timeZone: "Asia/Kuala_Lumpur",
                            })}
                          >
                            <CheckCircle2 className="mx-auto h-5 w-5 text-green-500" />
                          </span>
                        ) : (
                          <XCircle className="mx-auto h-5 w-5 text-slate-200 dark:text-slate-700" />
                        )}
                      </td>
                    ))}
                    <td className="px-3 py-2 text-center">
                      <span
                        className={
                          allDone
                            ? "inline-flex items-center gap-1 rounded-md bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : userPct === 0
                            ? "inline-flex rounded-md bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600 dark:bg-red-950/30 dark:text-red-400"
                            : "inline-flex rounded-md bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
                        }
                      >
                        {userAcksDone}/{totalChapters} · {userPct}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 text-center text-xs text-slate-400 dark:text-slate-500">
        鼠标悬停绿色 ✓ 可查看签收时间
      </p>
    </div>
  );
}
