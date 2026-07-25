import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  if (user.role !== "ADMIN") {
    redirect("/staff");
  }
  // Read fresh from the DB on every request, so an admin-triggered password
  // reset takes effect immediately instead of waiting for the next login.
  if (user.forcePasswordChange) redirect("/auth/force-password-change");

  return (
    <div className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 flex flex-col">
      <Navbar user={user} />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
