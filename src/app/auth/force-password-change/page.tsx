import prisma from "@/lib/prisma";
import { getCurrentUser, login } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Lock, Save, ArrowRight, ShieldCheck } from "lucide-react";
import { revalidatePath } from "next/cache";

export default async function ForcePasswordChangePage() {
  const user = await getCurrentUser();
  
  if (!user) redirect("/");
  if (!user.forcePasswordChange) {
    if (user.role === "ADMIN") redirect("/admin");
    if (user.role === "SUPERVISOR") redirect("/supervisor");
    redirect("/staff");
  }

  async function handleChangePassword(formData: FormData) {
    "use server";
    const user = await getCurrentUser();
    if (!user) return;

    const newPassword = formData.get("newPassword") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (!newPassword || newPassword.length < 4) {
      redirect("/auth/force-password-change?error=Password must be at least 4 characters");
    }

    if (newPassword !== confirmPassword) {
      redirect("/auth/force-password-change?error=Passwords do not match");
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { 
        password: newPassword,
        forcePasswordChange: false 
      }
    });

    revalidatePath("/");
    if (user.role === "ADMIN") redirect("/admin");
    if (user.role === "SUPERVISOR") redirect("/supervisor");
    redirect("/staff");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl shadow-xl shadow-blue-500/20 mb-4">
            <ShieldCheck className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Secure Your Account</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Please set a new password for your first login</p>
        </div>

        <div className="card-base p-8">
          <form action={handleChangePassword} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">New Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  name="newPassword"
                  required
                  placeholder="••••••••"
                  className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Confirm New Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  placeholder="••••••••"
                  className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full btn-primary h-14 text-lg shadow-xl shadow-blue-500/20 active:scale-[0.98] group"
            >
              Update & Continue
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
