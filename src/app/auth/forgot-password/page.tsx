import Link from "next/link";
import { ArrowLeft, ShieldAlert, MessageCircle, UserCog } from "lucide-react";

/**
 * Forgot Password landing page (Phase 1 â admin-reset flow).
 *
 * We don't have a self-service OTP flow yet. Staff who forgot their password
 * should contact their Admin or Supervisor. Admin resets it via
 * `/admin/employee/[id]` â the next login will force a password change.
 *
 * Phase 2: replace this page with a real OTP-based reset flow (FCM + WhatsApp).
 */
export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-500 rounded-2xl shadow-xl shadow-amber-500/20 mb-4">
            <ShieldAlert className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
            Forgot Your Password?
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
            Don't worry, we'll help you get back in.
          </p>
        </div>

        <div className="card-base p-8 space-y-6">
          <div className="text-center">
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-relaxed">
              Please contact your{" "}
              <span className="text-blue-600 dark:text-blue-400">
                Admin or Supervisor
              </span>{" "}
              to reset your password.
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 leading-relaxed">
              Once they reset it, you'll be asked to set a new password the next
              time you sign in.
            </p>
          </div>

          <div className="space-y-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl p-5 border border-blue-100 dark:border-blue-900/30">
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
              What happens next
            </p>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-white dark:bg-slate-900 rounded-xl text-blue-600 flex-shrink-0">
                <MessageCircle size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  1. Contact your Admin / Supervisor
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Send them a WhatsApp or give them a call.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-white dark:bg-slate-900 rounded-xl text-blue-600 flex-shrink-0">
                <UserCog size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  2. They reset your password
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Your password will be reset to the default{" "}
                  <code className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-mono text-[10px]">
                    1234
                  </code>
                  .
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-white dark:bg-slate-900 rounded-xl text-blue-600 flex-shrink-0">
                <ShieldAlert size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  3. Log in &amp; set a new password
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Log in with{" "}
                  <code className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-mono text-[10px]">
                    1234
                  </code>
                  ; the app will ask you to set a new one.
                </p>
              </div>
            </div>
          </div>

          <Link
            href="/"
            className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm transition-all"
          >
            <ArrowLeft size={16} />
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
