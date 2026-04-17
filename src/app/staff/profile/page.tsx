import { getCurrentUser, logout } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import {
  User,
  Store,
  Building2,
  LogOut,
  ChevronRight,
  History,
  Wallet,
  CalendarCheck,
  Settings,
  HelpCircle,
  Shield
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import BackButton from "@/components/BackButton";
import { revalidatePath } from "next/cache";
import { getSupabaseServiceClient } from "@/lib/supabase";
import AvatarUploader from "@/components/AvatarUploader";
import { getDisplayName, getSecondaryName } from "@/lib/displayName";

export default async function StaffProfilePage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/");

  const user = await prisma.user.findUnique({
    where: { id: currentUser.id },
    include: { company: true, outlet: true }
  });

  if (!user) redirect("/");

  const menuItems = [
    { label: "My Attendance", icon: History, href: "/staff/attendance", color: "text-blue-600 bg-blue-50" },
    { label: "Leave Balance", icon: Wallet, href: "/staff/leave", color: "text-emerald-600 bg-emerald-50" },
    { label: "Apply Leave", icon: CalendarCheck, href: "/staff/leave", color: "text-orange-600 bg-orange-50" },
    { label: "Settings", icon: Settings, href: "/staff/settings", color: "text-slate-600 bg-slate-100" },
    { label: "Help & Support", icon: HelpCircle, href: "/staff/help", color: "text-purple-600 bg-purple-50" },
  ];

  async function handleLogout() {
    "use server";
    await logout();
    redirect("/");
  }

  async function handleUpload(formData: FormData) {
    "use server";
    const me = await getCurrentUser();
    if (!me) return;
    const file = formData.get("avatar") as File | null;
    if (!file) return;
    const supabase = getSupabaseServiceClient();
    await supabase.storage.createBucket("avatars", { public: true }).catch(() => {});
    const ext = file.name.split(".").pop() || "jpg";
    const path = `users/${me.id}.${ext}`;
    await supabase.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type || "image/jpeg" });
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    await (prisma as any).user.update({ where: { id: me.id }, data: { avatarUrl: data.publicUrl } });
    revalidatePath("/staff/profile");
  }

  const avatar = (user as any).avatarUrl as string | undefined;
  const avatarSrc =
    avatar
      ? `${avatar}${avatar.includes("?") ? "&" : "?"}v=${user.updatedAt.getTime()}`
      : `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(user.name)}`;
  const displayName = getDisplayName(user as any);
  const secondaryName = getSecondaryName(user as any);

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <BackButton />
      <div className="space-y-8">
        <div className="card-base p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-24 bg-blue-600" />
          <div className="relative z-10 pt-4">
            <div className="inline-flex items-center justify-center rounded-3xl bg-white shadow-xl border-4 border-white mb-4 overflow-hidden">
              <AvatarUploader
                size={96}
                src={avatarSrc}
                onUpload={handleUpload}
              />
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">{displayName}</h1>
            {secondaryName && (
              <p className="text-xs font-bold text-slate-500 mt-1">{secondaryName}</p>
            )}
            <p className="text-sm font-bold text-blue-600 uppercase tracking-widest mt-1">{user.role}</p>
            
            <div className="mt-6 flex flex-wrap justify-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800">
                <Store size={14} className="text-slate-400" />
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{user.outlet?.name || "Main Outlet"}</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800">
                <Building2 size={14} className="text-slate-400" />
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{user.company.name}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card-base p-6 flex items-center justify-between bg-blue-50/30 border-blue-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
              <Shield size={18} />
            </div>
            <div>
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Security Status</p>
              <p className="text-xs font-bold text-slate-600">Password last updated recently</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Last Login</p>
            <p className="text-xs font-bold text-slate-600">{format(new Date(), "MMM d, HH:mm")}</p>
          </div>
        </div>

        <div className="card-base p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Profile Photo</p>
              <p className="text-xs font-bold text-slate-600">Tap photo to change</p>
            </div>
          </div>
          <AvatarUploader
            src={avatarSrc}
            onUpload={handleUpload}
          />
        </div>

        <div className="card-base overflow-hidden">
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {menuItems.map((item) => (
              <Link 
                key={item.label} 
                href={item.href}
                className="flex items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-xl transition-transform group-hover:scale-110 ${item.color}`}>
                    <item.icon size={20} />
                  </div>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{item.label}</span>
                </div>
                <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
              </Link>
            ))}
          </div>
        </div>

        <form action={handleLogout}>
          <button 
            type="submit"
            className="w-full flex items-center justify-center gap-3 p-5 rounded-3xl bg-red-50 hover:bg-red-100 text-red-600 font-black uppercase tracking-[0.2em] text-xs transition-all active:scale-[0.98] border border-red-100"
          >
            <LogOut size={18} />
            Sign Out Account
          </button>
        </form>
      </div>
    </div>
  );
}
