import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const ADMIN_PHONE = "0101112222";
const SUPERVISOR_PHONE = "0103334444";
const DEFAULT_PASSWORD = "1234";

export default async function SetupPage() {
  const cookieStore = await cookies();
  const setupDoneCookie = cookieStore.get("setup_done")?.value === "1";

  const existingUsers = await prisma.user.count();
  if (existingUsers > 0 && !setupDoneCookie) {
    redirect("/");
  }

  async function handleSetup() {
    "use server";

    const company =
      (await prisma.company.findFirst({ where: { name: "Demo Company" } })) ??
      (await prisma.company.create({ data: { name: "Demo Company" } }));

    const outlet =
      (await prisma.outlet.findFirst({
        where: { companyId: company.id, name: "Main Outlet" },
      })) ??
      (await prisma.outlet.create({
        data: {
          name: "Main Outlet",
          address: "Online Deployment",
          phone: "000-0000000",
          companyId: company.id,
        },
      }));

    await prisma.user.upsert({
      where: { phone: ADMIN_PHONE },
      update: {
        name: "Admin",
        password: DEFAULT_PASSWORD,
        role: "ADMIN",
        companyId: company.id,
        outletId: null,
        forcePasswordChange: false,
        status: "ACTIVE",
      },
      create: {
        name: "Admin",
        phone: ADMIN_PHONE,
        password: DEFAULT_PASSWORD,
        role: "ADMIN",
        department: "Admin",
        companyId: company.id,
        outletId: null,
        forcePasswordChange: false,
        status: "ACTIVE",
      },
    });

    await prisma.user.upsert({
      where: { phone: SUPERVISOR_PHONE },
      update: {
        name: "Supervisor",
        password: DEFAULT_PASSWORD,
        role: "SUPERVISOR",
        companyId: company.id,
        outletId: outlet.id,
        forcePasswordChange: false,
        status: "ACTIVE",
      },
      create: {
        name: "Supervisor",
        phone: SUPERVISOR_PHONE,
        password: DEFAULT_PASSWORD,
        role: "SUPERVISOR",
        department: "Retail",
        companyId: company.id,
        outletId: outlet.id,
        forcePasswordChange: false,
        status: "ACTIVE",
      },
    });

    const cookieStore = await cookies();
    cookieStore.set("setup_done", "1", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 10,
    });

    redirect("/setup");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16 bg-slate-50 dark:bg-slate-950">
      <div className="w-full max-w-lg card-base p-8">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Initial Setup</h1>
        <p className="text-sm text-slate-500 font-medium mb-8">
          Create your first Admin and Supervisor login for the live database.
        </p>

        <div className="space-y-4 mb-8">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
              Admin Login
            </p>
            <p className="text-sm font-black text-slate-900 dark:text-white">
              {ADMIN_PHONE}
            </p>
            <p className="text-xs font-bold text-slate-500 mt-1">
              Password: {DEFAULT_PASSWORD}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
              Supervisor Login
            </p>
            <p className="text-sm font-black text-slate-900 dark:text-white">
              {SUPERVISOR_PHONE}
            </p>
            <p className="text-xs font-bold text-slate-500 mt-1">
              Password: {DEFAULT_PASSWORD}
            </p>
          </div>
        </div>

        {existingUsers === 0 ? (
          <form action={handleSetup}>
            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-widest transition-colors"
            >
              Create Accounts
            </button>
          </form>
        ) : (
          <a
            href="/"
            className="block w-full text-center py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black uppercase tracking-widest transition-colors"
          >
            Go To Login
          </a>
        )}
      </div>
    </div>
  );
}
