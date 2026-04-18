"use client";

import { useState, useEffect } from "react";
import { X, Store, Save, MapPin, Phone, Users } from "lucide-react";

export default function OutletModal({ 
  outlet, 
  companyId,
  onSave,
  isOpen,
  onClose
}: { 
  outlet?: any; 
  companyId: string;
  onSave: (data: any) => Promise<void>;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [name, setName] = useState(outlet?.name || "");
  const [address, setAddress] = useState(outlet?.address || "");
  const [phone, setPhone] = useState(outlet?.phone || "");
  const [latitude, setLatitude] = useState<string>(outlet?.latitude?.toString?.() || "");
  const [longitude, setLongitude] = useState<string>(outlet?.longitude?.toString?.() || "");
  const [geofenceMeters, setGeofenceMeters] = useState<string>(outlet?.geofenceMeters?.toString?.() || "");
  const [minStaffRequired, setMinStaffRequired] = useState<string>(outlet?.minStaffRequired?.toString?.() || "1");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    setName(outlet?.name || "");
    setAddress(outlet?.address || "");
    setPhone(outlet?.phone || "");
    setLatitude(outlet?.latitude?.toString?.() || "");
    setLongitude(outlet?.longitude?.toString?.() || "");
    setGeofenceMeters(outlet?.geofenceMeters?.toString?.() || "");
    setMinStaffRequired(outlet?.minStaffRequired?.toString?.() || "1");
    setError("");
  }, [outlet, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setIsSubmitting(true);
    setError("");
    try {
      await onSave({ 
        id: outlet?.id, 
        name, 
        address, 
        phone, 
        latitude: latitude.trim() ? Number(latitude) : null,
        longitude: longitude.trim() ? Number(longitude) : null,
        geofenceMeters: geofenceMeters.trim() ? Number(geofenceMeters) : null,
        minStaffRequired: minStaffRequired.trim() ? Math.max(1, Math.round(Number(minStaffRequired))) : 1,
        companyId 
      });
      onClose();
    } catch (e: any) {
      setError(e?.message || "Failed to save outlet");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Store size={20} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {outlet ? "Edit Outlet" : "Add New Outlet"}
              </h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                {outlet ? "Update outlet information" : "Register a new branch"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-400">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="p-3 rounded-2xl border border-red-200 bg-red-50 text-red-700 text-sm font-bold">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Outlet Name</label>
              <input
                autoFocus
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter outlet name..."
                className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Address</label>
              <div className="relative">
                <div className="absolute top-3.5 left-3.5 text-slate-400">
                  <MapPin size={16} />
                </div>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street address, city, etc."
                  className="block w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none resize-none h-24"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Phone Number</label>
              <div className="relative">
                <div className="absolute top-3.5 left-3.5 text-slate-400">
                  <Phone size={16} />
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Outlet contact number"
                  className="block w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Latitude</label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="e.g. 5.9782"
                  className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Longitude</label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="e.g. 116.0743"
                  className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Geofence Radius (meters)</label>
              <input
                type="number"
                inputMode="numeric"
                value={geofenceMeters}
                onChange={(e) => setGeofenceMeters(e.target.value)}
                placeholder="e.g. 200"
                className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
              />
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 ml-1">
                If set with lat/lng, GPS check-in can be enforced.
              </p>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Minimum Staff Required (per day)</label>
              <div className="relative">
                <div className="absolute top-3.5 left-3.5 text-slate-400">
                  <Users size={16} />
                </div>
                <input
                  type="number"
                  inputMode="numeric"
                  min="1"
                  value={minStaffRequired}
                  onChange={(e) => setMinStaffRequired(e.target.value)}
                  placeholder="e.g. 3"
                  className="block w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                />
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 ml-1">
                Used for leave coverage warnings. Staff count below this triggers a red alert.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button 
              type="button"
              onClick={onClose}
              className="btn-secondary px-6 h-11 text-xs font-bold"
            >
              Cancel
            </button>
            <button 
              disabled={isSubmitting}
              type="submit"
              className="btn-primary px-8 h-11 shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                "Saving..."
              ) : (
                <>
                  <Save size={16} />
                  <span>{outlet ? "Update Outlet" : "Create Outlet"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
