import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import {
  User as UserIcon,
  Phone,
  Mail,
  Users,
  Heart,
  ChevronLeft,
  Save,
} from "lucide-react";

/**
 * Staff self-service edit page for personal details.
 *
 * Editable by staff:
 *   - nickname (display name)
 *   - email
 *   - phone
 *   - emergencyContactName
 *   - emergencyContactPhone
 *   - emergencyContactRelation
 *
 * NOT editable here (admin-only):
 *   - name (legal name), role, department, task, companyId, outletId,
 *     leaveBalance, status, password, avatarUrl, requiresGeofence
 */
export default async function StaffProfileEditPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) || {};
  const error = typeof params.error === "string" ? params.error : "";
  const saved = typeof params.saved === "string" ? params.saved === "1" : false;

  const sessionUser = await getCurrentUser();
  if (!sessionUser) redirect("/");

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
  });
  if (!user) redirect("/");

  async function handleUpdateDetails(formData: FormData) {
    "use server";
    const me = await getCurrentUser();
    if (!me) redirect("/");

    const nickname = ((formData.get("nickname") as string) || "").trim();
    const email = ((formData.get("email") as string) || "").trim();
    const phone = ((formData.get("phone") as string) || "").trim();
    const emergencyContactName = ((formData.get("emergencyContactName") as string) || "").trim();
    const emergencyContactPhone = ((formData.get("emergencyContactPhone") as string) || "").trim();
    const emergencyContactRelation = ((formData.get("emergencyContactRelation") as string) || "").trim();

    // Basic validation
    if (!phone) {
      redirect("/staff/profile/edit?error=phone_required");
    }
    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      redirect("/staff/profile/edit?error=invalid_email");
    }

    // Check phone/email uniqueness if changed
    const existingByPhone = await prisma.user.findFirst({
      where: { phone, NOT: { id: me.id } },
      select: { id: true },
    });
    if (existingByPhone) {
      redirect("/staff/profile/edit?error=phone_taken");
    }
    if (email) {
      const existingByEmail = await prisma.user.findFirst({
        where: { email, NOT: { id: me.id } },
        select: { id: true },
      });
      if (existingByEmail) {
        redirect("/staff/profile/edit?error=email_taken");
      }
    }

    await prisma.user.update({
      where: { id: me.id },
      data: {
        nickname: nickname || null,
        email: email || null,
        phone,
        emergencyContactName: emergencyContactName || null,
        emergencyContactPhone: emergencyContactPhone || null,
        emergencyContactRelation: emergencyContactRelation || null,
      },
    });

    revalidatePath("/staff/profile");
    revalidatePath("/staff/profile/edit");
    redirect("/staff/profile/edit?saved=1");
  }

  const errorMessages: Record<string, string> = {
    phone_required: "Phone number is required.",
    invalid_email: "Please enter a valid email address.",
    phone_taken: "This phone number is already registered to another account.",
    email_taken: "This email is already registered to another account.",
  };

  const relationOptions = ["Spouse", "Parent", "Sibling", "Child", "Friend", "Other"];

  return (
    <div className="max-w-2xl mx-auto py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
      {/* Back link */}
      <Link
        href="/staff/profile"
        className="inline-flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-blue-600 mb-6"
      >
        <ChevronLeft size={16} />
        Back to Profile
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
          Edit My Details
        </h1>
        <p className="text-sm font-medium text-slate-500 mt-1">
          Update your personal contact information. Your legal name and role
          can only be changed by an admin.
        </p>
      </div>

      {saved && (
        <div className="card-base p-4 mb-6 border-emerald-200 bg-emerald-50 text-emerald-700 font-bold text-sm">
          â Your details have been saved.
        </div>
      )}
      {error && errorMessages[error] && (
        <div className="card-base p-4 mb-6 border-red-200 bg-red-50 text-red-700 font-bold text-sm">
          {errorMessages[error]}
        </div>
      )}

      <form action={handleUpdateDetails} className="space-y-6">
        {/* Section: Personal */}
        <div className="card-base p-6 space-y-5">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <UserIcon size={16} className="text-blue-600" />
            <h2 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">
              Personal
            </h2>
          </div>

          {/* Read-only legal name */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Full Name (read-only)
            </label>
            <p className="mt-1 text-sm font-bold text-slate-700 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
              {user.name}
            </p>
          </div>

          <div>
            <label
              htmlFor="nickname"
              className="text-[10px] font-black text-slate-400 uppercase tracking-widest"
            >
              Nickname / Display Name
            </label>
            <input
              id="nickname"
              name="nickname"
              type="text"
              defaultValue={user.nickname || ""}
              placeholder="e.g. Khole"
              className="mt-1 w-full text-sm font-bold text-slate-900 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="phone"
              className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest"
            >
              <Phone size={10} /> Phone Number *
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              defaultValue={user.phone}
              placeholder="e.g. 012-3456789"
              className="mt-1 w-full text-sm font-bold text-slate-900 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest"
            >
              <Mail size={10} /> Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              defaultValue={user.email || ""}
              placeholder="name@example.com"
              className="mt-1 w-full text-sm font-bold text-slate-900 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Section: Emergency Contact */}
        <div className="card-base p-6 space-y-5">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Heart size={16} className="text-red-500" />
            <h2 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">
              Emergency Contact
            </h2>
          </div>

          <div>
            <label
              htmlFor="emergencyContactName"
              className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest"
            >
              <UserIcon size={10} /> Contact Name
            </label>
            <input
              id="emergencyContactName"
              name="emergencyContactName"
              type="text"
              defaultValue={user.emergencyContactName || ""}
              placeholder="Full name"
              className="mt-1 w-full text-sm font-bold text-slate-900 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="emergencyContactPhone"
              className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest"
            >
              <Phone size={10} /> Contact Phone
            </label>
            <input
              id="emergencyContactPhone"
              name="emergencyContactPhone"
              type="tel"
              defaultValue={user.emergencyContactPhone || ""}
              placeholder="e.g. 012-3456789"
              className="mt-1 w-full text-sm font-bold text-slate-900 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="emergencyContactRelation"
              className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest"
            >
              <Users size={10} /> Relation
            </label>
            <select
              id="emergencyContactRelation"
              name="emergencyContactRelation"
              defaultValue={user.emergencyContactRelation || ""}
              className="mt-1 w-full text-sm font-bold text-slate-900 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Select relation...</option>
              {relationOptions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          <Link
            href="/staff/profile"
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
