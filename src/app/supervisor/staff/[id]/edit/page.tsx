import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  User as UserIcon,
  Phone,
  Mail,
  Heart,
  Users as UsersIcon,
  ShieldCheck,
  Store,
} from "lucide-react";
import { getAllowedOutletIds } from "@/lib/supervisorOutlets";
import { getDisplayName } from "@/lib/displayName";

/**
 * Supervisor edit page for a single staff member they manage.
 *
 * Editable here:
 *   - nickname
 *   - phone
 *   - email
 *   - emergencyContactName / Phone / Relation
 *
 * NOT editable (admin-only):
 *   - name (legal), role, department, task, companyId, outletId,
 *     requiresGeofence, status, password, leaveBalance, avatarUrl
 *
 * Access control:
 *   - Only SUPERVISOR or ADMIN
 *   - The target staff must be in the supervisor's allowed outlets
 *     (admins always pass)
 */
export default async function SupervisorStaffEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const sp = (await searchParams) || {};
  const error = typeof sp.error === "string" ? sp.error : "";
  const saved = typeof sp.saved === "string" && sp.saved === "1";

  const me = await getCurrentUser();
  if (!me) redirect("/");
  if (me.role !== "SUPERVISOR" && me.role !== "ADMIN") redirect("/staff");

  const employee = await prisma.user.findUnique({
    where: { id },
    include: { outlet: true, company: true },
  });
  if (!employee) notFound();

  // Access gate: must be same company. For SUPERVISOR also must be in allowed outlets.
  if (employee.companyId !== me.companyId) redirect("/supervisor/staff");

  if (me.role === "SUPERVISOR") {
    const companyOutlets = await prisma.outlet.findMany({
      where: { companyId: me.companyId },
      select: { id: true },
    });
    const allowed = getAllowedOutletIds(
      me as any,
      companyOutlets.map((o) => o.id)
    );
    if (
      !employee.outletId ||
      !allowed.map((x) => x.toString()).includes(employee.outletId.toString())
    ) {
      redirect("/supervisor/staff");
    }
  }

  async function save(formData: FormData) {
    "use server";
    const actor = await getCurrentUser();
    if (!actor) redirect("/");
    if (actor.role !== "SUPERVISOR" && actor.role !== "ADMIN") redirect("/staff");

    const target = await prisma.user.findUnique({
      where: { id },
      select: { id: true, companyId: true, outletId: true },
    });
    if (!target) notFound();

    // Re-check access on the server action too (don't trust client state)
    if (target.companyId !== actor.companyId) redirect("/supervisor/staff");
    if (actor.role === "SUPERVISOR") {
      const companyOutlets = await prisma.outlet.findMany({
        where: { companyId: actor.companyId },
        select: { id: true },
      });
      const allowed = getAllowedOutletIds(
        actor as any,
        companyOutlets.map((o) => o.id)
      );
      if (
        !target.outletId ||
        !allowed.map((x) => x.toString()).includes(target.outletId.toString())
      ) {
        redirect("/supervisor/staff");
      }
    }

    const nickname = ((formData.get("nickname") as string) || "").trim();
    const email = ((formData.get("email") as string) || "").trim();
    const phone = ((formData.get("phone") as string) || "").trim();
    const emergencyContactName = ((formData.get("emergencyContactName") as string) || "").trim();
    const emergencyContactPhone = ((formData.get("emergencyContactPhone") as string) || "").trim();
    const emergencyContactRelation = ((formData.get("emergencyContactRelation") as string) || "").trim();

    if (!phone) {
      redirect(`/supervisor/staff/${id}/edit?error=phone_required`);
    }
    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      redirect(`/supervisor/staff/${id}/edit?error=invalid_email`);
    }

    const existingByPhone = await prisma.user.findFirst({
      where: { phone, NOT: { id } },
      select: { id: true },
    });
    if (existingByPhone) {
      redirect(`/supervisor/staff/${id}/edit?error=phone_taken`);
    }
    if (email) {
      const existingByEmail = await prisma.user.findFirst({
        where: { email, NOT: { id } },
        select: { id: true },
      });
      if (existingByEmail) {
        redirect(`/supervisor/staff/${id}/edit?error=email_taken`);
      }
    }

    await prisma.user.update({
      where: { id },
      data: {
        nickname: nickname || null,
        email: email || null,
        phone,
        emergencyContactName: emergencyContactName || null,
        emergencyContactPhone: emergencyContactPhone || null,
        emergencyContactRelation: emergencyContactRelation || null,
      },
    });

    revalidatePath(`/supervisor/staff`);
    revalidatePath(`/supervisor/staff/${id}/edit`);
    redirect(`/supervisor/staff/${id}/edit?saved=1`);
  }

  const errorMessages: Record<string, string> = {
    phone_required: "Phone number is required.",
    invalid_email: "Please enter a valid email address.",
    phone_taken: "This phone number is already registered to another account.",
    email_taken: "This email is already registered to another account.",
  };

  const relationOptions = ["Spouse", "Parent", "Sibling", "Child", "Friend", "Other"];

  const displayName = getDisplayName(employee as any);

  return (
    <div className="max-w-2xl mx-auto py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
      <Link
        href="/supervisor/staff"
        className="inline-flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-blue-600 mb-6"
      >
        <ArrowLeft size={16} />
        Back to Staff
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
          Edit Staff Details
        </h1>
        <p className="text-sm font-medium text-slate-500 mt-1">
          Update contact info on behalf of <span className="font-bold">{displayName}</span>.
          Role, outlet and other admin settings can only be changed by an admin.
        </p>
      </div>

      {saved && (
        <div className="card-base p-4 mb-6 border-emerald-200 bg-emerald-50 text-emerald-700 font-bold text-sm">
          Saved successfully.
        </div>
      )}
      {error && errorMessages[error] && (
        <div className="card-base p-4 mb-6 border-red-200 bg-red-50 text-red-700 font-bold text-sm">
          {errorMessages[error]}
        </div>
      )}

      {/* Read-only summary card */}
      <div className="card-base p-6 mb-6 bg-slate-50/40">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-slate-100 text-slate-500"><UserIcon size={14} /></div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Name</p>
              <p className="text-sm font-bold text-slate-700 mt-0.5">{employee.name}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-slate-100 text-slate-500"><ShieldCheck size={14} /></div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Role</p>
              <p className="text-sm font-bold text-slate-700 mt-0.5">{employee.role}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-slate-100 text-slate-500"><Store size={14} /></div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Outlet</p>
              <p className="text-sm font-bold text-slate-700 mt-0.5">{employee.outlet?.name || "Unassigned"}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-slate-100 text-slate-500"><UsersIcon size={14} /></div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Department</p>
              <p className="text-sm font-bold text-slate-700 mt-0.5">{employee.department || "\u2014"}</p>
            </div>
          </div>
        </div>
      </div>

      <form action={save} className="space-y-6">
        {/* Personal */}
        <div className="card-base p-6 space-y-5">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <UserIcon size={16} className="text-blue-600" />
            <h2 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">Personal</h2>
          </div>

          <div>
            <label htmlFor="nickname" className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Nickname / Display Name
            </label>
            <input
              id="nickname"
              name="nickname"
              type="text"
              defaultValue={(employee as any).nickname || ""}
              placeholder="Optional"
              className="mt-1 w-full text-sm font-bold text-slate-900 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="phone" className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <Phone size={10} /> Phone Number *
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              defaultValue={employee.phone}
              placeholder="e.g. 0123456789"
              className="mt-1 w-full text-sm font-bold text-slate-900 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="email" className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <Mail size={10} /> Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              defaultValue={employee.email || ""}
              placeholder="name@example.com"
              className="mt-1 w-full text-sm font-bold text-slate-900 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="card-base p-6 space-y-5">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Heart size={16} className="text-red-500" />
            <h2 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">Emergency Contact</h2>
          </div>

          <div>
            <label htmlFor="emergencyContactName" className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <UserIcon size={10} /> Contact Name
            </label>
            <input
              id="emergencyContactName"
              name="emergencyContactName"
              type="text"
              defaultValue={(employee as any).emergencyContactName || ""}
              placeholder="Full name"
              className="mt-1 w-full text-sm font-bold text-slate-900 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="emergencyContactPhone" className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <Phone size={10} /> Contact Phone
            </label>
            <input
              id="emergencyContactPhone"
              name="emergencyContactPhone"
              type="tel"
              defaultValue={(employee as any).emergencyContactPhone || ""}
              placeholder="e.g. 0123456789"
              className="mt-1 w-full text-sm font-bold text-slate-900 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="emergencyContactRelation" className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <UsersIcon size={10} /> Relation
            </label>
            <select
              id="emergencyContactRelation"
              name="emergencyContactRelation"
              defaultValue={(employee as any).emergencyContactRelation || ""}
              className="mt-1 w-full text-sm font-bold text-slate-900 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Select relation...</option>
              {relationOptions.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/supervisor/staff"
            className="flex-1 flex items-center justify-center gap-2 p-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-all"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="flex-1 flex items-center justify-center gap-2 p-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-xs transition-all active:scale-[0.98]"
          >
            <Save size={16} />
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
