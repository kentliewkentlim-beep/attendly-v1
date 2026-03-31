"use client";

import { useState } from "react";
import { 
  Megaphone, 
  Plus, 
  Search, 
  Trash2, 
  Calendar, 
  User, 
  Store,
  ChevronRight,
  Send,
  XCircle,
  Clock
} from "lucide-react";
import { format } from "date-fns";
import { getDisplayName } from "@/lib/displayName";

export default function SupervisorAnnouncementClient({ 
  announcements,
  outlets,
  onCreateAnnouncement,
  onDeleteAnnouncement
}: { 
  announcements: any[];
  outlets: any[];
  onCreateAnnouncement: (data: any) => Promise<void>;
  onDeleteAnnouncement: (id: string) => Promise<void>;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [outletId, setOutletId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAnnouncements = announcements.filter(a => 
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    
    setIsSubmitting(true);
    await onCreateAnnouncement({ title, content, outletId: outletId || null });
    setIsSubmitting(false);
    setIsModalOpen(false);
    setTitle("");
    setContent("");
    setOutletId("");
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <Megaphone className="text-blue-600" size={32} />
            Announcements
          </h1>
          <p className="text-slate-500 mt-1 font-medium">Broadcast messages to your staff and outlets</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-primary h-11 px-6 shadow-lg shadow-blue-500/20 flex items-center gap-2"
        >
          <Plus size={18} />
          <span>Create Announcement</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Create Panel (Desktop) or History List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card-base p-4">
            <div className="relative group">
              <Search className="absolute left-3 top-2.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search past announcements..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>
          </div>

          <div className="space-y-4">
            {filteredAnnouncements.length === 0 ? (
              <div className="card-base py-20 text-center">
                <Megaphone size={48} className="text-slate-200 mx-auto mb-4" />
                <p className="text-slate-500 font-medium">No announcements found</p>
              </div>
            ) : (
              filteredAnnouncements.map((ann) => (
                <div key={ann.id} className="card-base p-6 hover:shadow-lg transition-all group relative border-l-4 border-blue-500">
                  <div className="flex justify-between items-start mb-4">
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                        {ann.title}
                      </h3>
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                          <User size={12} />
                          {getDisplayName(ann.author)}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                          <Clock size={12} />
                          {format(new Date(ann.createdAt), "MMM d, yyyy HH:mm")}
                        </span>
                        {ann.outlet && (
                          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full uppercase tracking-widest flex items-center gap-1">
                            <Store size={10} />
                            {ann.outlet.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        if(confirm("Delete this announcement?")) onDeleteAnnouncement(ann.id);
                      }}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">
                    {ann.content}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Summary/Stats */}
        <div className="space-y-6">
          <div className="card-base p-6 bg-blue-600 text-white shadow-xl shadow-blue-500/20">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] opacity-80 mb-6">Announcement Stats</h3>
            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-2xl font-black">{announcements.length}</p>
                  <p className="text-[10px] font-bold uppercase opacity-60">Total Broadcasts</p>
                </div>
                <Megaphone size={32} className="opacity-20" />
              </div>
              <div className="pt-6 border-t border-white/10 space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="opacity-70">Targeted to Outlets</span>
                  <span className="font-bold">{announcements.filter(a => a.outletId).length}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="opacity-70">Company Wide</span>
                  <span className="font-bold">{announcements.filter(a => !a.outletId).length}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card-base p-6">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Guidelines</h3>
            <ul className="space-y-3">
              <li className="flex gap-2 text-[11px] text-slate-500 leading-relaxed">
                <ChevronRight size={14} className="text-blue-500 flex-shrink-0" />
                <span>Keep messages concise and actionable for staff.</span>
              </li>
              <li className="flex gap-2 text-[11px] text-slate-500 leading-relaxed">
                <ChevronRight size={14} className="text-blue-500 flex-shrink-0" />
                <span>Target specific outlets to reduce notification noise.</span>
              </li>
              <li className="flex gap-2 text-[11px] text-slate-500 leading-relaxed">
                <ChevronRight size={14} className="text-blue-500 flex-shrink-0" />
                <span>Urgent updates should be marked in the title.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="text-blue-600" size={20} />
                Create Announcement
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-400">
                <XCircle size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Title</label>
                  <input 
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Brief subject of announcement..."
                    className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Target Outlet (Optional)</label>
                  <select 
                    value={outletId}
                    onChange={(e) => setOutletId(e.target.value)}
                    className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none cursor-pointer"
                  >
                    <option value="">Company Wide (All Outlets)</option>
                    {outlets.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Message Content</label>
                  <textarea 
                    required
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write your message here..."
                    className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm h-32 resize-none focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                  />
                </div>
              </div>

              <button 
                disabled={isSubmitting}
                type="submit"
                className="w-full btn-primary h-12 shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? "Sending..." : (
                  <>
                    <span>Broadcast Message</span>
                    <Send size={18} />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
