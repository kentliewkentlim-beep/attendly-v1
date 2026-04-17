import prisma from "@/lib/prisma";
import { login } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Phone, Lock, ArrowRight, Fingerprint } from "lucide-react";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  async function handleLogin(formData: FormData) {
    "use server";
    const phone = formData.get("phone") as string;
    const password = formData.get("password") as string;
    const rememberMe = formData.get("rememberMe") === "on";

    if (!phone || !password) return;

    const user = await prisma.user.findUnique({
      where: { phone },
    });

    if (user && user.password === password) {
      await login(user.id);
      
      if (user.forcePasswordChange) {
        redirect("/auth/force-password-change");
      }

      if (user.role === "ADMIN") redirect("/admin");
      if (user.role === "SUPERVISOR") redirect("/supervisor");
      redirect("/staff");
    } else {
      redirect("/?error=Invalid credentials");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl shadow-xl shadow-blue-500/20 mb-4">
            <span className="text-white text-3xl font-bold">✓</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Welcome Back</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Log in to your account</p>
        </div>

        <div className="card-base p-8">
          {params.error && (
            <div className="mb-6 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-semibold text-center border border-red-100 dark:border-red-900/30">
              {params.error}
            </div>
          )}

          <form action={handleLogin} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Phone Number</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                  <Phone size={18} />
                </div>
                <input
                  type="text"
                  name="phone"
                  required
                  placeholder="e.g. 0101112222"
                  className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2 ml-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Password</label>
                <a href="/auth/forgot-password" className="text-[10px] font-bold text-blue-600 uppercase tracking-wider hover:underline">Forgot?</a>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  name="password"
                  required
                  placeholder="••••"
                  className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  name="rememberMe"
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20 transition-all cursor-pointer"
                />
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider group-hover:text-slate-700 transition-colors">Remember Me</span>
              </label>
              <button 
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 transition-all"
              >
                <Fingerprint size={14} />
                Biometrics
              </button>
            </div>

            <button
              type="submit"
              className="w-full btn-primary h-14 text-lg shadow-xl shadow-blue-500/20 active:scale-[0.98] group"
            >
              Sign In
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Don't have an account? <a href="#" className="font-bold text-blue-600 hover:underline">Contact Admin</a>
          </p>
          <div className="mt-6 flex justify-center gap-4 grayscale opacity-50 contrast-125">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Trusted by top companies</span>
          </div>
        </div>
      </div>
    </div>
  );
}
