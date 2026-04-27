import { useState, useEffect } from "react";
import {
  Calendar, Car, CheckCircle, Clock, Plus, Edit2, Trash2,
  Banknote, Shield, Layers, Sparkles, Wrench,
  Star, ChevronRight, X, AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../dashboard-ui/card";
import { Badge } from "../dashboard-ui/badge";
import { useAuth } from "../../hooks/useAuth";
import { getCustomerAppointments } from "../../services/appointments";
import { getVehicles, createVehicle, updateVehicle, deleteVehicle as deleteVehicleAPI, Vehicle } from "../../services/vehicles";

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function serviceIcon(service: string) {
  const s = (service ?? "").toLowerCase();
  if (s.includes("coating"))                                return <Shield   className="w-4 h-4 text-[#E41E6A]"  />;
  if (s.includes("ppf") || s.includes("paint protection")) return <Layers   className="w-4 h-4 text-violet-400" />;
  if (s.includes("tint"))                                   return <Sparkles className="w-4 h-4 text-sky-400"    />;
  return                                                           <Wrench   className="w-4 h-4 text-white/50"   />;
}

const STATUS_STYLE: Record<string, { bg: string; text: string; dot: string; border: string }> = {
  Confirmed:     { bg: "bg-green-500/20",  text: "text-green-400",  dot: "bg-green-500",  border: "border-green-500/30"  },
  Pending:       { bg: "bg-yellow-500/20", text: "text-yellow-400", dot: "bg-yellow-400", border: "border-yellow-500/30" },
  "In Progress": { bg: "bg-blue-500/20",   text: "text-blue-400",   dot: "bg-blue-500",   border: "border-blue-500/30"   },
  Scheduled:     { bg: "bg-green-500/20",  text: "text-green-400",  dot: "bg-green-500",  border: "border-green-500/30"  },
  Completed:     { bg: "bg-white/10",      text: "text-white/50",   dot: "bg-white/30",   border: "border-white/10"      },
};

const inputCls = "w-full px-4 h-10 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/25 focus:outline-none focus:border-[#E41E6A] focus:ring-1 focus:ring-[#E41E6A]/30 transition-colors text-sm";

// ─── VEHICLE MODAL ────────────────────────────────────────────────────────────

function VehicleModal({ mode, initial, onClose, onSave }: {
  mode:     "add" | "edit";
  initial?: Vehicle;
  onClose:  () => void;
  onSave:   (data: Omit<Vehicle, "id" | "user_id" | "created_at">) => Promise<void>;
}) {
  const [form, setForm] = useState({
    name:         initial?.name         ?? "",
    brand:        initial?.brand        ?? "",
    model:        initial?.model        ?? "",
    year:         initial?.year         ?? "",
    plate_number: initial?.plate_number ?? "",
    color:        initial?.color        ?? "",
    vehicle_class: initial?.vehicle_class ?? "",
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!form.brand.trim()) { alert("Brand is required.");  return; }
    if (!form.model.trim()) { alert("Model is required.");  return; }
    if (!form.year.trim())  { alert("Year is required.");   return; }
    setIsSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch (e: any) {
      alert(e.message ?? "Failed to save vehicle.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm" style={{ backgroundColor: "rgba(0,0,0,0.85)" }}>
      <div className="bg-[#0a0a0a] border border-white/10 rounded-xl w-full max-w-md shadow-2xl flex flex-col">
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white">{mode === "add" ? "Add Vehicle" : "Edit Vehicle"}</h2>
            <p className="text-xs text-white/50 mt-0.5">{mode === "add" ? "Register a new vehicle" : "Update vehicle details"}</p>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-white/70">Vehicle Nickname <span className="text-white/30">(optional)</span></label>
            <input className={inputCls} placeholder='e.g. "My Daily Driver"' value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white/70">Brand <span className="text-red-500">*</span></label>
              <input className={inputCls} placeholder="Toyota" value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white/70">Model <span className="text-red-500">*</span></label>
              <input className={inputCls} placeholder="Fortuner" value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white/70">Year <span className="text-red-500">*</span></label>
              <input type="number" className={inputCls} placeholder="2022" value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white/70">Color</label>
              <input className={inputCls} placeholder="Pearl White" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-1.5">
  <label className="text-sm font-medium text-white/70">Vehicle Size/Class</label>
  <select
    className={inputCls + " appearance-none"}
    value={form.vehicle_class}
    onChange={e => setForm(f => ({ ...f, vehicle_class: e.target.value }))}
  >
    <option value="" className="bg-[#0a0a0a]">Select vehicle class...</option>
    {["Sedan","Hatchback","Crossover","SUV","Pickup","Van","MPV",
      "Full-size SUV","Scooter","Underbone","Naked Bike","Sport Bike",
      "Cruiser","Adventure Bike","Big Bike"].map(c => (
      <option key={c} value={c} className="bg-[#0a0a0a]">{c}</option>
    ))}
  </select>
</div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-white/70">Plate Number</label>
            <input className={inputCls} placeholder="ABC 1234" value={form.plate_number} onChange={e => setForm(f => ({ ...f, plate_number: e.target.value }))} />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-white/10 bg-white/5 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium border border-white/10 text-white hover:bg-white/10 rounded-lg transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={isSaving}
            className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#E41E6A] to-pink-600 hover:from-[#c41559] rounded-lg transition-all disabled:opacity-50">
            {isSaving ? "Saving..." : mode === "add" ? "Add Vehicle" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── DELETE CONFIRM MODAL ─────────────────────────────────────────────────────

function DeleteVehicleModal({ vehicle, onClose, onConfirm }: {
  vehicle:   Vehicle;
  onClose:   () => void;
  onConfirm: () => Promise<void>;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const handleConfirm = async () => {
    setIsDeleting(true);
    try { await onConfirm(); onClose(); }
    catch (e: any) { alert(e.message ?? "Failed to delete."); }
    finally { setIsDeleting(false); }
  };
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm" style={{ backgroundColor: "rgba(0,0,0,0.85)" }}>
      <div className="bg-[#0a0a0a] border border-white/10 rounded-xl w-full max-w-sm shadow-2xl">
        <div className="p-6 text-center">
          <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6 text-red-400" />
          </div>
          <h2 className="text-white font-bold text-base mb-1">Delete Vehicle?</h2>
          <p className="text-white/50 text-sm">
            Remove <span className="text-white font-semibold">{vehicle.name || `${vehicle.brand} ${vehicle.model}`}</span>? This cannot be undone.
          </p>
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2 text-sm font-medium border border-white/10 text-white hover:bg-white/10 rounded-lg transition-colors">Cancel</button>
          <button onClick={handleConfirm} disabled={isDeleting}
            className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50">
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export function CustomerDashboardHome({ onNavigate }: { onNavigate?: (section: string) => void }) {
  const { profile, isLoading: profileLoading } = useAuth();

  const [isLoading,      setIsLoading]      = useState(true);
  const [totalSpent,     setTotalSpent]     = useState(0);
  const [loyaltyPts,     setLoyaltyPts]     = useState(0);
  const [servicesDone,   setServicesDone]   = useState(0);
  const [upcomingAppts,  setUpcomingAppts]  = useState<any[]>([]);
  const [recentServices, setRecentServices] = useState<any[]>([]);
  const [vehicles,       setVehicles]       = useState<Vehicle[]>([]);

  const [vehicleModal,  setVehicleModal]  = useState<{ mode: "add" | "edit"; item?: Vehicle } | null>(null);
  const [deleteVehicle, setDeleteVehicle] = useState<Vehicle | null>(null);

  useEffect(() => {
    if (profile?.customerId) fetchData();
  }, [profile?.customerId]);

  const fetchData = async () => {
    if (!profile?.customerId) return;
    setIsLoading(true);
    try {
      const [appts, vehs] = await Promise.all([
        getCustomerAppointments(profile.customerId),
        getVehicles(profile.customerId),
      ]);

      setVehicles(vehs);

      const now = new Date();
      const upcoming = appts
        .filter((a: any) => new Date(a.scheduled_date) >= now && a.status !== "Completed" && a.status !== "Cancelled")
        .sort((a: any, b: any) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime())
        .slice(0, 3);
      setUpcomingAppts(upcoming);

      const completed = appts.filter((a: any) => a.status === "Completed");
      setServicesDone(completed.length);
      setRecentServices([...completed].sort((a: any, b: any) => new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime()).slice(0, 3));

      const spent = completed.reduce((sum: number, a: any) => sum + Number(a.total_cost ?? 0), 0);
      setTotalSpent(spent);
      setLoyaltyPts(Math.floor(spent / 100));
    } catch (err) {
      console.error("CustomerDashboardHome fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveVehicle = async (data: Omit<Vehicle, "id" | "user_id" | "created_at">) => {
    if (!profile?.customerId) return;
    if (vehicleModal?.mode === "add") {
      const created = await createVehicle(profile.customerId, data);
      setVehicles(prev => [...prev, created]);
    } else if (vehicleModal?.item) {
      const updated = await updateVehicle(vehicleModal.item.id, profile.customerId, data);
      setVehicles(prev => prev.map(v => v.id === updated.id ? updated : v));
    }
  };

  const handleDeleteVehicle = async () => {
  if (!deleteVehicle || !profile?.customerId) return;
  await deleteVehicleAPI(deleteVehicle.id, profile.customerId);  // ← use alias
  setVehicles(prev => prev.filter(v => v.id !== deleteVehicle.id));
};

  const fullName     = profile?.full_name ?? "Customer";
  const firstName    = fullName.split(" ")[0];
  const nextAppt     = upcomingAppts[0];
  const nextApptDate = nextAppt
    ? new Date(nextAppt.date || nextAppt.scheduled_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : "—";

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-white text-3xl font-bold mb-1">
            Welcome back, <span className="text-[#E41E6A]">{(isLoading || profileLoading) ? "..." : firstName}!</span>
          </h1>
          <p className="text-white/60 text-sm">{`Welcome, ${fullName}! Here's what's happening with your vehicles.`}</p>
        </div>
        <button onClick={() => onNavigate?.("appointments")}
          className="self-start sm:self-auto inline-flex items-center gap-2 bg-gradient-to-r from-[#E41E6A] to-pink-600 hover:from-[#c41559] text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-[#E41E6A]/25 transition-all">
          <Plus className="w-4 h-4" />Book Appointment
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Upcoming",      value: isLoading ? "..." : upcomingAppts.length,  sub: "scheduled services",    icon: <Calendar    className="w-4 h-4" />, iconBg: "bg-[#E41E6A]/10", iconColor: "text-[#E41E6A]"   },
          { title: "My Vehicles",   value: isLoading ? "..." : vehicles.length,        sub: `registered vehicle${vehicles.length !== 1 ? "s" : ""}`, icon: <Car className="w-4 h-4" />, iconBg: "bg-sky-500/10", iconColor: "text-sky-400" },
          { title: "Services Done", value: isLoading ? "..." : servicesDone,           sub: "completed jobs",        icon: <CheckCircle className="w-4 h-4" />, iconBg: "bg-green-500/10",  iconColor: "text-green-400"   },
          { title: "Next Service",  value: isLoading ? "..." : nextApptDate,           sub: nextAppt ? (nextAppt.service_type ?? "Appointment") : "No upcoming", icon: <Clock className="w-4 h-4" />, iconBg: "bg-violet-500/10", iconColor: "text-violet-400" },
        ].map((s, i) => (
          <Card key={i} className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur" style={{ borderRadius: "12px" }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-white/70">{s.title}</CardTitle>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${s.iconBg}`}>
                <span className={s.iconColor}>{s.icon}</span>
              </div>
            </CardHeader>
            <CardContent style={{ paddingBottom: "20px" }}>
              <div className="text-white text-2xl font-bold">{s.value}</div>
              <p className="text-xs text-white/50 mt-1 truncate">{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Loyalty Banner */}
      <div className="bg-gradient-to-r from-[#E41E6A] to-pink-600 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-lg shadow-[#E41E6A]/20">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Star className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-white/80 text-xs font-semibold uppercase tracking-wide">Loyalty Points</p>
            <p className="text-white text-3xl font-bold">{isLoading ? "..." : loyaltyPts.toLocaleString()} pts</p>
            <p className="text-white/70 text-xs mt-0.5">Total spent: {isLoading ? "..." : `₱${totalSpent.toLocaleString()}`}</p>
          </div>
        </div>
        <div className="flex flex-col sm:items-end gap-2">
          <span className="text-white/90 text-sm font-semibold">
            {loyaltyPts >= 1000 ? "🥇 Gold Member" : loyaltyPts >= 500 ? "🥈 Silver Member" : "🥉 Bronze Member"}
          </span>
          <div className="w-full sm:w-48 h-2 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${Math.min((loyaltyPts % 1000) / 10, 100)}%` }} />
          </div>
          <p className="text-white/60 text-xs">
            {loyaltyPts >= 1000 ? "Max tier reached!" : `${1000 - (loyaltyPts % 1000)} pts to next tier`}
          </p>
        </div>
      </div>

      {/* Upcoming + Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Upcoming Appointments */}
        <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur" style={{ borderRadius: "12px" }}>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#E41E6A]" />Upcoming Appointments
            </CardTitle>
            <button onClick={() => onNavigate?.("appointments")} className="flex items-center gap-1 text-xs text-[#E41E6A] hover:text-pink-400 transition-colors">
              View all <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </CardHeader>
          <CardContent style={{ paddingBottom: "20px" }}>
            <div className="space-y-3">
              {isLoading ? (
                <p className="text-white/50 text-sm text-center py-4">Loading...</p>
              ) : upcomingAppts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <Calendar className="w-8 h-8 text-white/20 mb-2" />
                  <p className="text-white/50 text-sm">No upcoming appointments</p>
                  <button onClick={() => onNavigate?.("appointments")} className="mt-2 text-xs text-[#E41E6A] hover:text-pink-400 transition-colors">Book one now →</button>
                </div>
              ) : upcomingAppts.map((apt: any) => {
                const apptDate = new Date(apt.date || apt.scheduled_date);
                const statusKey = apt.status ?? "Pending";
                const s = STATUS_STYLE[statusKey] ?? STATUS_STYLE["Pending"];
                return (
                  <div key={apt.id} className="p-3 bg-white/5 rounded-xl border border-white/10 hover:border-[#E41E6A]/40 transition-colors">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">{serviceIcon(apt.service_type ?? "")}</div>
                        <div>
                          <p className="text-white text-sm font-medium truncate max-w-[150px]">{apt.service_type ?? "Appointment"}</p>
                          {(apt.vehicle_make || apt.vehicle_model) && (
                            <p className="text-white/40 text-xs flex items-center gap-1 mt-0.5">
                              <Car className="w-3 h-3" />{[apt.vehicle_make, apt.vehicle_model].filter(Boolean).join(" ")}
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge className={`${s.bg} ${s.text} ${s.border} flex-shrink-0 text-xs`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${s.dot} mr-1.5`} />{statusKey}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-white/50">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-[#E41E6A]" />{apptDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-[#E41E6A]" />{apptDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Services */}
        <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur" style={{ borderRadius: "12px" }}>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-white flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />Recent Services
            </CardTitle>
            <button onClick={() => onNavigate?.("history")} className="flex items-center gap-1 text-xs text-[#E41E6A] hover:text-pink-400 transition-colors">
              View all <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </CardHeader>
          <CardContent style={{ paddingBottom: "20px" }}>
            <div className="space-y-3">
              {isLoading ? (
                <p className="text-white/50 text-sm text-center py-4">Loading...</p>
              ) : recentServices.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <CheckCircle className="w-8 h-8 text-white/20 mb-2" />
                  <p className="text-white/50 text-sm">No completed services yet</p>
                </div>
              ) : recentServices.map((svc: any) => {
                const svcDate = new Date(svc.date || svc.scheduled_date);
                return (
                  <div key={svc.id} className="p-3 bg-white/5 rounded-xl border border-white/10 hover:border-green-500/30 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">{serviceIcon(svc.service_type ?? "")}</div>
                        <div className="min-w-0">
                          <p className="text-white text-sm font-medium truncate">{svc.service_type ?? "Service"}</p>
                          <p className="text-white/50 text-xs flex items-center gap-1 mt-0.5">
                            <Car className="w-3 h-3" />{[svc.vehicle_make, svc.vehicle_model].filter(Boolean).join(" ") || svc.customers?.vehicle || "Vehicle"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-white text-sm font-bold">₱{Number(svc.total_cost || 0).toLocaleString()}</p>
                        <p className="text-white/40 text-xs mt-0.5">{svcDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* My Vehicles */}
      <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur" style={{ borderRadius: "12px" }}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <Car className="w-5 h-5 text-[#E41E6A]" />My Vehicles
              {vehicles.length > 0 && (
                <span className="text-xs font-normal text-white/40 ml-1">{vehicles.length} registered</span>
              )}
            </CardTitle>
            <button
              onClick={() => setVehicleModal({ mode: "add" })}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-gradient-to-r from-[#E41E6A] to-pink-600 hover:from-[#c41559] px-3 py-1.5 rounded-lg transition-all"
            >
              <Plus className="w-3.5 h-3.5" />Add Vehicle
            </button>
          </div>
        </CardHeader>
        <CardContent style={{ paddingBottom: "20px" }}>
          {(isLoading || profileLoading) ? (
            <p className="text-white/50 text-sm text-center py-4">Loading...</p>
          ) : vehicles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Car className="w-10 h-10 text-white/20 mb-3" />
              <p className="text-white/50 text-sm font-medium">No vehicles registered yet</p>
              <p className="text-white/30 text-xs mt-1">Add your vehicle to speed up future bookings</p>
              <button
                onClick={() => setVehicleModal({ mode: "add" })}
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-gradient-to-r from-[#E41E6A] to-pink-600 px-4 py-2 rounded-lg transition-all"
              >
                <Plus className="w-3.5 h-3.5" />Add Your First Vehicle
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {vehicles.map(v => (
                <div key={v.id} className="p-4 bg-white/5 rounded-xl border border-white/10 hover:border-[#E41E6A]/40 transition-colors">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[#E41E6A]/10 flex items-center justify-center flex-shrink-0">
                        <Car className="w-5 h-5 text-[#E41E6A]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-white text-sm font-bold truncate">
                          {v.name || `${v.brand} ${v.model}`}
                        </p>
                        {v.name && (
                          <p className="text-white/50 text-xs truncate">{v.brand} {v.model}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => setVehicleModal({ mode: "edit", item: v })}
                        className="w-7 h-7 flex items-center justify-center rounded-lg border border-sky-500/30 text-sky-400 hover:bg-sky-500/10 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteVehicle(v)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/40">Year</span>
                      <span className="text-white/70">{v.year}</span>
                    </div>
                    {v.color && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-white/40">Color</span>
                        <span className="text-white/70">{v.color}</span>
                      </div>
                    )}
                    {v.plate_number && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-white/40">Plate</span>
                        <span className="text-white font-mono font-semibold">{v.plate_number}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      {vehicleModal && (
        <VehicleModal
          mode={vehicleModal.mode}
          initial={vehicleModal.item}
          onClose={() => setVehicleModal(null)}
          onSave={handleSaveVehicle}
        />
      )}
      {deleteVehicle && (
        <DeleteVehicleModal
          vehicle={deleteVehicle}
          onClose={() => setDeleteVehicle(null)}
          onConfirm={handleDeleteVehicle}
        />
      )}
    </div>
  );
}

export default CustomerDashboardHome;