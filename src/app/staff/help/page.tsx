import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { 
  HelpCircle, 
  MessageCircle, 
  Mail, 
  Phone, 
  BookOpen, 
  ChevronRight,
  ExternalLink
} from "lucide-react";
import Link from "next/link";

export default async function StaffHelpPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const helpItems = [
    { 
      label: "Chat Support", 
      icon: MessageCircle, 
      description: "Talk to our support team", 
      href: "#", 
      color: "text-blue-600 bg-blue-50" 
    },
    { 
      label: "Email Us", 
      icon: Mail, 
      description: "support@attendly.com", 
      href: "mailto:support@attendly.com", 
      color: "text-emerald-600 bg-emerald-50" 
    },
    { 
      label: "Call Support", 
      icon: Phone, 
      description: "+60 3-1234 5678", 
      href: "tel:+60312345678", 
      color: "text-orange-600 bg-orange-50" 
    },
    { 
      label: "Help Center", 
      icon: BookOpen, 
      description: "Read guides and FAQs", 
      href: "#", 
      color: "text-purple-600 bg-purple-50" 
    },
  ];

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <HelpCircle className="text-blue-600" size={32} />
            Help & Support
          </h1>
          <p className="text-slate-500 mt-1 font-medium">We're here to help you with any issues</p>
        </div>

        <div className="card-base overflow-hidden">
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {helpItems.map((item) => (
              <Link 
                key={item.label} 
                href={item.href}
                className="flex items-center justify-between p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group"
              >
                <div className="flex items-center gap-5">
                  <div className={`p-3 rounded-2xl transition-transform group-hover:scale-110 ${item.color}`}>
                    <item.icon size={24} />
                  </div>
                  <div>
                    <p className="text-base font-bold text-slate-700 dark:text-slate-200">{item.label}</p>
                    <p className="text-sm text-slate-400 font-medium">{item.description}</p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
              </Link>
            ))}
          </div>
        </div>

        <div className="card-base p-8 bg-blue-600 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
          <div className="relative z-10">
            <h3 className="text-xl font-black mb-2">Need a quick guide?</h3>
            <p className="text-sm font-medium opacity-90 mb-6 max-w-sm">
              Check out our mobile app tutorial to learn how to clock in, apply for leave, and view your roster.
            </p>
            <button className="px-6 py-3 bg-white text-blue-600 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-blue-50 transition-colors">
              Watch Tutorial
              <ExternalLink size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
