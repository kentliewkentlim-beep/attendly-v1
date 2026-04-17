import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { ChevronLeft, Lock, Save, ShieldCheck } from "lucide-react";

/**
 * Staff self-service Change Password page.
 *
 * Verifies the current password (stored plain text per schema) and updates
 * to the new one. Redirects back with saved / error query params.
 */
export default async function ChangePasswordPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) || {};
  const error = typeof params.error === "string" ? params.error : "";
  const saved = typeof params.saved === "string" ? params.saved === "1" : false;

  const sessionUser = await getCurrentUser();
  if (!sessionUser) redirect("/");

  async function handleChangePassword(formData: FormData) {
    "use server";
    const me = await getCurrentUser();
    if (!me) redirect("/");

    const currentPassword = ((formData.get("currentPassword") as string) || "").trim();
    const newPassword = ((formData.get("newPassword") as string) || "").trim();
    const confirmPassword = ((formData.get("confirmPassword") as string) || "").trim();

    if (!currentPassword || !newPassword || !confirmPassword) {
      redirect("/staff/settings/password?error=all_required");
    }

    if (newPassword.length < 4) {
      redirect("/staff/settings/password?error=too_short");
    }

    if (newPassword === currentPassword) {
      redirect("/staff/settings/password?error=same_as_old");
    }

    if (newPassword !== confirmPassword) {
      redirect("/staff/settings/password?error=mismatch");
    }

    // Verify current password
    const fresh = await prisma.user.findUnique({
      where: { id: me.id },
      select: { password: true },
    });
    if (!fresh || fresh.password !== currentPassword) {
      redirect("/staff/settings/password?error=wrong_current");
    }

    await prisma.user.update({
      where: { id: me.id },
      data: { password: newPassword, forcePasswordChange: false },
    });

    revalidatePath("/staff/profile");
    redirect("/staff/settings/password?saved=1");
  }

  const errorMessages: Record<string, string> = {
    all_required: "All fields are required.",
    too_short: "New password must be at least 4 characters.",
    same_as_old: "New password cannot be the same as the current one.",
    mismatch: "New password and confirmation do not match.",
    wrong_current: "Current password is incorrect.",
  };

  return (
    <div className="max-w-lg mx-auto py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
      {/* Back link */}
      <Link
        href="/staff/profile"
        className="inline-flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-blue-600 mb-6"
      >
        <ChevronLeft size={16} />
        Back to Profile
      </Link>

      <div className="mb-8 flex items-center gap-3">
        <div className="h-12 w-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-xl shadow-blue-500/20">
          <ShieldCheck size={22} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            Change Password
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-0.5">
            Choose a strong password you haven't used before.
          </p>
        </div>
      </div>

      {saved && (
        <div className="card-base p-4 mb-6 border-emerald-200 bg-emerald-50 text-emerald-700 font-bold text-sm">
          â Your password has been updated.
        </div>
      )}
      {error && errorMessages[error] && (
        <div className="card-base p-4 mb-6 border-red-200 bg-red-50 text-red-700 font-bold text-sm">
          {errorMessages[error]}
        </div>
      )}

      <form action={handleChangePassword} className="card-base p-6 space-y-5">
        <div>
          <label
            htmlFor="currentPassword"
            className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2"
          >
            <Lock size={10} /> Current Password *
          </label>
          <input
            id="currentPassword"
            name="currentPassword"
            type="password"
            required
            autoComplete="current-password"
            className="w-full text-sm font-bold text-slate-900 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label
            htmlFor="newPassword"
            className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2"
          >
            <Lock size={10} /> New Password *
          </label>
          <input
            id="newPassword"
            name="newPassword"
            type="password"
            required
            minLength={4}
            autoComplete="new-password"
            className="w-full text-sm font-bold text-slate-900 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-[10px] text-slate-400 font-medium mt-1">
            At least 4 characters.
          </p>
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2"
          >
            <Lock size={10} /> Confirm New Password *
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            autoComplete="new-password"
            className="w-full text-sm font-bold text-slate-900 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Action buttons — sticky on mobile above BottomNav, inline on desktop */}
        <div className="sticky bottom-[calc(env(safe-area-inset-bottom)+92px)] z-20 -mx-6 sm:mx-0 px-6 sm:px-0 py-3 sm:py-0 bg-slate-50/90 sm:bg-transparent backdrop-blur-md sm:backdrop-blur-none border-t border-slate-200 sm:border-0 sm:pt-2">
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
              Update Password
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
