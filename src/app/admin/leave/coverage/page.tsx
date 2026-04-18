import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import CoverageCalendarClient from "./CoverageCalendarClient";

export default async function AdminLeaveCoveragePage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string; days?: string; company?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/staff");

  const params = (await searchParams) || {};
  const startParam = params.start;
  const daysParam = params.days;
  const companyFilter = params.company || "";

  // Validate start date (YYYY-MM-DD). Default: today.
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const startStr = startParam && /^\d{4}-\d{2}-\d{2}$/.test(startParam) ? startParam : todayStr;
  const daysParsed = parseInt(daysParam || "30", 10);
  const days = Number.isFinite(daysParsed) ? Math.min(Math.max(daysParsed, 7), 90) : 30;

  const startDate = new Date(startStr + "T00:00:00.000Z");
  const endDate = new Date(startDate);
  endDate.setUTCDate(endDate.getUTCDate() + days - 1);

  const companies = await prisma.company.findMany({ orderBy: { name: "asc" } });

  const outlets = await prisma.outlet.findMany({
    where: companyFilter ? { companyId: companyFilter } : {},
    select: { id: true, name: true, companyId: true, minStaffRequired: true, status: true } as any,
    orderBy: { name: "asc" },
  }) as any;

  const staff = await prisma.user.findMany({
    where: {
      status: "ACTIVE",
      role: { in: ["STAFF", "PROMOTER", "SUPERVISOR"] },
      outletId: { not: null },
      ...(companyFilter ? { companyId: companyFilter } : {}),
    },
    select: { id: true, name: true, outletId: true },
  });

  const leaves = await prisma.leave.findMany({
    where: {
      status: "APPROVED",
      // Overlap filter: leave.startDate <= end AND leave.endDate >= start
      startDate: { lte: endDate },
      endDate: { gte: startDate },
      ...(companyFilter ? { user: { companyId: companyFilter } } : {}),
    },
    select: {
      id: true,
      startDate: true,
      endDate: true,
      type: true,
      durationType: true,
      user: { select: { id: true, name: true, outletId: true, companyId: true } },
    },
  });

  const outletsNormalized = (outlets as any[])
    .filter((o) => o.status !== false)
    .map((o) => ({
      id: String(o.id),
      name: o.name,
      companyId: o.companyId,
      minStaffRequired: typeof o.minStaffRequired === "number" ? o.minStaffRequired : 1,
    }));

  const staffNormalized = staff.map((s: any) => ({
    id: s.id,
    name: s.name,
    outletId: s.outletId != null ? String(s.outletId) : null,
  }));

  const leavesNormalized = leaves.map((l: any) => ({
    id: l.id,
    startDate: l.startDate.toISOString().slice(0, 10),
    endDate: l.endDate.toISOString().slice(0, 10),
    type: l.type,
    durationType: l.durationType,
    user: {
      id: l.user.id,
      name: l.user.name,
      outletId: l.user.outletId != null ? String(l.user.outletId) : null,
    },
  }));

  return (
    <CoverageCalendarClient
      outlets={outletsNormalized}
      staff={staffNormalized}
      leaves={leavesNormalized}
      companies={companies}
      startStr={startStr}
      days={days}
      selectedCompanyId={companyFilter}
    />
  );
}
