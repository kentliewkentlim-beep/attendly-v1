"use client";

import { useState, useRef } from "react";
import {
  Megaphone,
  Plus,
  Search,
  Trash2,
  User,
  Store,
  ChevronRight,
  Send,
  XCircle,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { format } from "date-fns";
import { getDisplayName } from "@/lib/displayName";

export default function SupervisorAnnouncementClient({
  announcements,
  outlets,
  onCreateAnnouncement,
  onDeleteAnnouncement,
}: {
  announcements: any[];
  outlets: any[];
  onCreateAnnouncement: (formData: FormData) => Promise<void>;
  onDeleteAnnouncement: (id: string) => Promise<void>;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const filteredAnnouncements = announcements.filter(
    (a) =>
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setIsSubmitting(true);
    try {
      await onCreateAnnouncement(fd);
    } finally {
      setIsSubmitting(false);
    }
    setIsModalOpen(false);
    setPreviewUrl(null);
    formRef.current?.reset();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setPreviewUrl(URL.createObjectURL(file));
    else setPreviewUrl(null);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <Megaphone className="text-blue-600" size={32} />
            Announcements
          </h1>
          <p className="text-slate-500 mt-1 font-medium">
            Broadcast to your team with photo support and read tracking
          </p>
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
        <div className="lg:col-span-2 space-y-6">
          <div className="card-base p-4">
            <div className="relative group">
              <Search
                className="absolute left-3 top-2.5 text-slate-400 group-focus-within:text-blue-500 transition-colors"
                size={18}
              />
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
                <div
                  key={ann.id}
                  className="card-base p-6 hover:shadow-lg transition-all group relative border-l-4 border-blue-500"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="space-y-1 flex-1">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                        {ann.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3">
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
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full uppercase tracking-widest flex items-center gap-1">
                          <CheckCircle2 size={10} />
                          {ann._count?.acks ?? 0} Read
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm("Delete this announcement?")) onDeleteAnnouncement(ann.id);
                      }}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  {ann.imageUrl && (
                    <img
                      src={ann.imageUrl}
                      alt=""
                      className="w-full max-h-64 object-cover rounded-xl mb-4 border border-slate-100 dark:border-slate-800"
                    />
                  )}
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">
                    {ann.content}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card-base p-6 bg-blue-600 text-white shadow-xl shadow-blue-500/20">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] opacity-80 mb-6">
              Announcement Stats
            </h3>
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
                  <span className="opacity-70">With Photo</span>
                  <span className="font-bold">{announcements.filter((a) => a.imageUrl).length}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="opacity-70">Targeted to Outlets</span>
                  <span className="font-bold">{announcements.filter((a) => a.outletId).length}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="opacity-70">Total Read Count</span>
                  <span className="font-bold">
                    {announcements.reduce((sum, a) => sum + (a._count?.acks || 0), 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="card-base p-6">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
              Guidelines
            </h3>
            <ul className="space-y-3">
              <li className="flex gap-2 text-[11px] text-slate-500 leading-relaxed">
                <ChevronRight size={14} className="text-blue-500 flex-shrink-0" />
                <span>Optional outlet targeting reduces notification noise.</span>
              </li>
              <li className="flex gap-2 text-[11px] text-slate-500 leading-relaxed">
                <ChevronRight size={14} className="text-blue-500 flex-shrink-0" />
                <span>Attach a photo for posters, promos, or visual instructions.</span>
              </li>
              <li className="flex gap-2 text-[11px] text-slate-500 leading-relaxed">
                <ChevronRight size={14} className="text-blue-500 flex-shrink-0" />
                <span>Staff must tap "Acknowledge" after reading — counts appear here.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200 my-8">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="text-blue-600" size={20} />
                Create Announcement
              </h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setPreviewUrl(null);
                }}
                className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-400"
              >
                <XCircle size={20} />
              </button>
            </div>
            <form ref={formRef} onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">
                    Title
                  </label>
                  <input
                    required
                    name="title"
                    placeholder="Brief subject of announcement..."
                    className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">
                    Target Outlet (Optional)
                  </label>
                  <select
                    name="outletId"
                    className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none cursor-pointer"
                  >
                    <option value="">Company Wide (All Outlets)</option>
                    {outlets.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">
                    Photo (Optional)
                  </label>
                  <input
                    type="file"
                    name="image"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100"
                  />
                  {previewUrl && (
                    <img
                      src={previewUrl}
                      alt="preview"
                      className="mt-3 w-full max-h-48 object-cover rounded-xl border border-slate-200 dark:border-slate-700"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">
                    Message Content
                  </label>
                  <textarea
                    required
                    name="content"
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
                {isSubmitting ? (
                  "Sending..."
                ) : (
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
