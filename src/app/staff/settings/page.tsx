import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { 
  Settings, 
  Lock, 
  Bell, 
  Languages, 
  ChevronRight,
  ShieldCheck,
  Moon,
  Smartphone,
  LucideIcon
} from "lucide-react";
import Link from "next/link";

interface SettingItem {
  label: string;
  icon: LucideIcon;
  description: string;
  href: string;
  color: string;
  badge?: string;
  value?: string;
}

interface SettingSection {
  title: string;
  items: SettingItem[];
}

export default async function StaffSettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const settingsSections: SettingSection[] = [
    {
      title: "Security",
      items: [
        { label: "Change Password", icon: Lock, description: "Update your login password", href: "/staff/settings/password", color: "text-blue-600 bg-blue-50" },
        { label: "Two-Factor Auth", icon: ShieldCheck, description: "Add an extra layer of security", href: "#", color: "text-emerald-600 bg-emerald-50", badge: "Coming Soon" },
      ]
    },
    {
      title: "Preferences",
      items: [
        { label: "Notifications", icon: Bell, description: "Manage push and email alerts", href: "/staff/settings/notifications", color: "text-orange-600 bg-orange-50" },
        { label: "Language", icon: Languages, description: "English / Malay / Chinese", href: "/staff/settings/language", color: "text-purple-600 bg-purple-50", value: "English" },
        { label: "Appearance", icon: Moon, description: "Dark mode and theme settings", href: "#", color: "text-slate-600 bg-slate-100", value: "System" },
      ]
    },
    {
      title: "Device",
      items: [
        { label: "Biometric Login", icon: Smartphone, description: "Face ID / Fingerprint login", href: "#", color: "text-pink-600 bg-pink-50", badge: "Beta" },
      ]
    }
  ];

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <Settings className="text-blue-600" size={32} />
            Settings
          </h1>
          <p className="text-slate-500 mt-1 font-medium">Manage your account preferences and security</p>
        </div>

        {settingsSections.map((section) => (
          <div key={section.title} className="space-y-4">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-4">
              {section.title}
            </h2>
            <div className="card-base overflow-hidden">
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {section.items.map((item) => (
                  <Link 
                    key={item.label} 
                    href={item.href}
                    className="flex items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2.5 rounded-xl transition-transform group-hover:scale-110 ${item.color}`}>
                        <item.icon size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{item.label}</p>
                        <p className="text-xs text-slate-400 font-medium">{item.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {item.value && (
                        <span className="text-xs font-bold text-slate-400">{item.value}</span>
                      )}
                      {item.badge && (
                        <span className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[8px] font-black text-slate-500 uppercase tracking-widest">
                          {item.badge}
                        </span>
                      )}
                      <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
