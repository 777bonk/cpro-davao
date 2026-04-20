import { useState, useEffect, useMemo } from "react";
import {
  ChevronLeft, ChevronRight, Search, SlidersHorizontal,
  Plus, Calendar, Car, Clock, Banknote, Shield, Layers,
  Sparkles, Wrench, Eye, XCircle, CalendarX, X,
  CheckCircle, AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../dashboard-ui/card";
import { Badge } from "../dashboard-ui/badge";
import { getAppointments, createAppointment } from "../../services/appointments";
import { getServices } from "../../services/settings";
import { getCustomers } from "../../services/customer";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type AppointmentStatus = "Confirmed" | "Pending" | "In Progress" | "Completed" | "Cancelled" | "Scheduled";

interface Appointment {
  id: string | number;
  service: string;
  vehicle: string;
  date: string;
  time: string;
  deposit: number;
  status: AppointmentStatus;
  notes?: string;
}

// ─── STATUS CONFIG ─────────────────────────────────────────────────────────────

const STATUS: Record<string, { bg: string; text: string; dot: string; border: string }> = {
  Confirmed:    { bg: "bg-green-500/20",  text: "text-green-400",  dot: "bg-green-500",  border: "border-green-500/30"  },
  Pending:      { bg: "bg-yellow-500/20", text: "text-yellow-400", dot: "bg-yellow-400", border: "border-yellow-500/30" },
  Scheduled:    { bg: "bg-green-500/20",  text: "text-green-400",  dot: "bg-green-500",  border: "border-green-500/30"  },
  "In Progress":{ bg: "bg-blue-500/20",   text: "text-blue-400",   dot: "bg-blue-500",   border: "border-blue-500/30"   },
  Completed:    { bg: "bg-white/10",      text: "text-white/50",   dot: "bg-white/30",   border: "border-white/10"      },
  Cancelled:    { bg: "bg-red-500/20",    text: "text-red-400",    dot: "bg-red-500",    border: "border-red-500/30"    },
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_NAMES   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function formatShort(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function serviceIcon(service: string) {
  const s = (service ?? "").toLowerCase();
  if (s.includes("coating"))                                return <Shield   className="w-4 h-4 text-[#E41E6A]"  />;
  if (s.includes("ppf") || s.includes("paint protection")) return <Layers   className="w-4 h-4 text-violet-400" />;
  if (s.includes("tint"))                                   return <Sparkles className="w-4 h-4 text-sky-400"    />;
  return                                                           <Wrench   className="w-4 h-4 text-white/50"   />;
}

// ─── STATUS BADGE ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const s = STATUS[status] ?? STATUS["Pending"];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${s.bg} ${s.text} ${s.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />{status}
    </span>
  );
}

// ─── CALENDAR ─────────────────────────────────────────────────────────────────

function CalendarCard({
  selected, onSelect, dotDates,
}: {
  selected: string;
  onSelect: (d: string) => void;
  dotDates: Record<string, string[]>;
}) {
  const today = todayStr();
  const selDate = new Date(selected + "T00:00:00");
  const [viewYear,  setViewYear]  = useState(selDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(selDate.getMonth());

  const firstDay    = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const prev = () => viewMonth === 0 ? (setViewMonth(11), setViewYear(y => y - 1)) : setViewMonth(m => m - 1);
  const next = () => viewMonth === 11 ? (setViewMonth(0),  setViewYear(y => y + 1)) : setViewMonth(m => m + 1);

  const cellKey = (day: number) =>
    `${viewYear}-${String(viewMonth+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;

  const dotColor = (statuses: string[]) => {
    if (statuses.includes("In Progress")) return "bg-blue-500";
    if (statuses.includes("Confirmed") || statuses.includes("Scheduled")) return "bg-green-500";
    if (statuses.includes("Pending"))   return "bg-yellow-400";
    return "bg-white/30";
  };

  return (
    <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur" style={{ borderRadius: "12px" }}>
      <CardHeader className="pb-3">
        <CardTitle className="text-white text-sm">Calendar</CardTitle>
        <p className="text-white/50 text-xs">Select a date to view appointments</p>
      </CardHeader>
      <CardContent style={{ paddingBottom: "20px" }}>
        {/* Month nav */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={prev} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors">
            <ChevronLeft className="w-4 h-4 text-white/60" />
          </button>
          <span className="text-white text-sm font-semibold">{MONTH_NAMES[viewMonth]} {viewYear}</span>
          <button onClick={next} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors">
            <ChevronRight className="w-4 h-4 text-white/60" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {DAY_NAMES.map(d => (
            <div key={d} className="text-center text-[10px] font-semibold text-white/30 py-1">{d}</div>
          ))}
        </div>

        {/* Cells */}
        <div className="grid grid-cols-7 gap-y-1">
          {cells.map((day, i) => {
            if (!day) return <div key={`e-${i}`} />;
            const key     = cellKey(day);
            const isToday = key === today;
            const isSel   = key === selected;
            const dots    = dotDates[key];
            return (
              <button key={key} onClick={() => onSelect(key)}
                className={`
                  relative flex flex-col items-center justify-center w-8 h-8 mx-auto rounded-full text-xs font-medium transition-all
                  ${isSel   ? "bg-[#E41E6A] text-white shadow-md shadow-[#E41E6A]/30" : ""}
                  ${isToday && !isSel ? "border border-[#E41E6A] text-[#E41E6A]" : ""}
                  ${!isSel && !isToday ? "text-white/60 hover:bg-white/10" : ""}
                `}
              >
                {day}
                {dots && (
                  <span className={`absolute bottom-0.5 w-1.5 h-1.5 rounded-full ${isSel ? "bg-white" : dotColor(dots)}`} />
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 pt-4 border-t border-white/10 flex flex-col gap-1.5">
          {[
            { dot: "bg-green-500",  label: "Confirmed"   },
            { dot: "bg-blue-500",   label: "In Progress" },
            { dot: "bg-yellow-400", label: "Pending"     },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${l.dot}`} />
              <span className="text-xs text-white/50">{l.label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── APPOINTMENTS PANEL ───────────────────────────────────────────────────────

function AppointmentsPanel({ selected, appts, onView }: {
  selected: string;
  appts: Appointment[];
  onView: (a: Appointment) => void;
}) {
  return (
    <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur flex flex-col min-h-[420px]" style={{ borderRadius: "12px" }}>
      <CardHeader className="pb-3">
        <CardTitle className="text-white text-sm">
          Appointments for <span className="text-[#E41E6A]">{formatShort(selected)}</span>
        </CardTitle>
        <p className="text-white/50 text-xs">{appts.length} appointment{appts.length !== 1 ? "s" : ""} scheduled</p>
      </CardHeader>
      <CardContent style={{ paddingBottom: "20px", flex: 1 }}>
        {appts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-10 text-center">
            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-3">
              <CalendarX className="w-6 h-6 text-white/20" />
            </div>
            <p className="text-white/50 text-sm">No appointments for this date</p>
          </div>
        ) : (
          <div className="space-y-3">
            {appts.map(a => (
              <div key={a.id} className="p-3 bg-white/5 rounded-xl border border-white/10 hover:border-[#E41E6A]/40 transition-colors">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                      {serviceIcon(a.service)}
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium leading-snug truncate max-w-[140px]">{a.service}</p>
                      <p className="text-white/50 text-xs flex items-center gap-1 mt-0.5"><Car className="w-3 h-3" />{a.vehicle}</p>
                    </div>
                  </div>
                  <StatusBadge status={a.status} />
                </div>
                <div className="flex flex-wrap gap-3 pt-2 border-t border-white/10">
                  <span className="flex items-center gap-1 text-xs text-white/50"><Clock className="w-3.5 h-3.5 text-[#E41E6A]" />{a.time}</span>
                  <span className="flex items-center gap-1 text-xs text-white/50"><Banknote className="w-3.5 h-3.5 text-green-400" />₱{Number(a.deposit).toLocaleString()} deposit</span>
                  <button onClick={() => onView(a)} className="ml-auto flex items-center gap-1 text-xs font-medium text-[#E41E6A] hover:text-pink-400 transition-colors">
                    <Eye className="w-3.5 h-3.5" />View
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── BOOK APPOINTMENT MODAL ───────────────────────────────────────────────────

function BookModal({
  onClose, onSave, services, vehicles,
}: {
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  services: string[];
  vehicles: string[];
}) {
  const [form, setForm] = useState({
    service: "", vehicle: "", date: todayStr(),
    time: "9:00 AM", deposit: "", notes: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  const TIME_OPTIONS = ["8:00 AM","9:00 AM","10:00 AM","10:30 AM","11:00 AM","1:00 PM","2:00 PM","3:00 PM","4:00 PM"];

  const handleSave = async () => {
    if (!form.service || !form.vehicle || !form.date || !form.time) {
      alert("Please fill in Service, Vehicle, Date, and Time."); return;
    }
    setIsSaving(true);
    try {
      await onSave({ ...form, deposit: parseFloat(form.deposit) || 0, status: "Pending" });
      onClose();
    } catch (error: any) {
      alert(`Error: ${error?.message || "Failed to book appointment."}`);
    } finally {
      setIsSaving(false);
    }
  };

  const inputCls = "w-full px-4 h-10 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/25 focus:outline-none focus:border-[#E41E6A] focus:ring-1 focus:ring-[#E41E6A]/30 transition-colors text-sm";
  const selCls   = inputCls + " appearance-none pr-8";

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm" style={{ backgroundColor: "rgba(0,0,0,0.8)" }}>
      <div className="bg-[#0a0a0a] border border-white/10 rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white">Book Appointment</h2>
            <p className="text-white/50 text-xs mt-0.5">Schedule a new service</p>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-white/70">Service <span className="text-red-500">*</span></label>
            <div className="relative">
              <select className={selCls} value={form.service} onChange={e => setForm({ ...form, service: e.target.value })}>
                <option value="" className="bg-[#0a0a0a]">Select a service...</option>
                {services.map(s => <option key={s} value={s} className="bg-[#0a0a0a]">{s}</option>)}
              </select>
              <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none rotate-90" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-white/70">Vehicle <span className="text-red-500">*</span></label>
            <div className="relative">
              <select className={selCls} value={form.vehicle} onChange={e => setForm({ ...form, vehicle: e.target.value })}>
                <option value="" className="bg-[#0a0a0a]">Select a vehicle...</option>
                {vehicles.map(v => <option key={v} value={v} className="bg-[#0a0a0a]">{v}</option>)}
              </select>
              <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none rotate-90" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white/70">Date <span className="text-red-500">*</span></label>
              <input type="date" className={inputCls + " [color-scheme:dark]"} value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white/70">Time <span className="text-red-500">*</span></label>
              <div className="relative">
                <select className={selCls} value={form.time} onChange={e => setForm({ ...form, time: e.target.value })}>
                  {TIME_OPTIONS.map(t => <option key={t} value={t} className="bg-[#0a0a0a]">{t}</option>)}
                </select>
                <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none rotate-90" />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-white/70">Deposit (₱)</label>
            <input type="number" className={inputCls} placeholder="0" value={form.deposit} onChange={e => setForm({ ...form, deposit: e.target.value })} />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-white/70">Notes</label>
            <textarea className={inputCls + " resize-none h-20 py-2.5"} placeholder="Any special requests..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>
        </div>

        <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium border border-white/10 text-white hover:bg-white/10 rounded-lg transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#E41E6A] to-pink-600 hover:from-[#c41559] rounded-lg shadow-md shadow-[#E41E6A]/25 transition-all disabled:opacity-50">
            {isSaving ? "Booking..." : "Confirm Booking"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── VIEW DETAIL MODAL ────────────────────────────────────────────────────────

function ViewModal({ appt, onClose }: { appt: Appointment; onClose: () => void }) {
  const Row = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
    <div className="p-3 bg-white/5 rounded-lg border border-white/10 flex items-start gap-3">
      <div className="mt-0.5 text-[#E41E6A] flex-shrink-0">{icon}</div>
      <div>
        <p className="text-white/50 text-xs">{label}</p>
        <p className="text-white text-sm font-medium mt-0.5">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm" style={{ backgroundColor: "rgba(0,0,0,0.8)" }}>
      <div className="bg-[#0a0a0a] border border-white/10 rounded-xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white">Appointment Details</h2>
            <p className="text-white/50 text-xs mt-0.5">{formatShort(appt.date)}</p>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-3">
          <Row icon={<Shield  className="w-4 h-4" />} label="Service"  value={appt.service} />
          <Row icon={<Car     className="w-4 h-4" />} label="Vehicle"  value={appt.vehicle} />
          <Row icon={<Calendar className="w-4 h-4"/>} label="Date"     value={formatShort(appt.date)} />
          <Row icon={<Clock   className="w-4 h-4" />} label="Time"     value={appt.time} />
          <Row icon={<Banknote className="w-4 h-4"/>} label="Deposit"  value={`₱${Number(appt.deposit).toLocaleString()}`} />
          {appt.notes && <Row icon={<Eye className="w-4 h-4" />} label="Notes" value={appt.notes} />}
          <div className="flex items-center justify-between pt-2">
            <span className="text-white/50 text-sm">Status</span>
            <StatusBadge status={appt.status} />
          </div>
        </div>
        <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium border border-white/10 text-white hover:bg-white/10 rounded-lg transition-colors">Close</button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export function CustomerAppointments() {
  const today = todayStr();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services,     setServices]     = useState<string[]>([]);
  const [vehicles,     setVehicles]     = useState<string[]>([]);
  const [isLoading,    setIsLoading]    = useState(true);
  const [selected,     setSelected]     = useState(today);
  const [search,       setSearch]       = useState("");
  const [filterStatus, setFilterStatus] = useState<"All" | string>("All");
  const [showBook,     setShowBook]     = useState(false);
  const [viewAppt,     setViewAppt]     = useState<Appointment | null>(null);

  const todayDisplay = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [rawAppts, rawServices, customers] = await Promise.all([
        getAppointments().catch(() => []),
        getServices().catch(() => []),
        getCustomers().catch(() => []),
      ]);

      // Normalize appointments to local shape
      const normalized: Appointment[] = rawAppts.map((a: any) => {
        const d = new Date(a.date || a.scheduled_date);
        return {
          id:      a.id,
          service: a.service_type ?? a.service ?? "Appointment",
          vehicle: a.customers?.vehicle ?? a.vehicle ?? "Vehicle",
          date:    `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`,
          time:    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          deposit: Number(a.deposit || a.deposit_amount || 0),
          status:  (a.status ?? "Pending") as AppointmentStatus,
          notes:   a.notes ?? "",
        };
      });
      setAppointments(normalized);

      // Services list from settings
      const svcNames = rawServices.map((s: any) => s.name).filter(Boolean);
      setServices(svcNames.length > 0 ? svcNames : [
        "Ceramic Coating - Full Body", "Ceramic Coating - Partial",
        "PPF - Hood & Fenders", "PPF - Full Body",
        "Window Tinting - Full Car", "Full Interior Detailing",
        "Nano Ceramic Spray", "Paint Decontamination",
      ]);

      // Vehicles from customer record
      const uniqueVehicles = Array.from(
        new Set(customers.map((c: any) => c.vehicle).filter(Boolean))
      ) as string[];
      setVehicles(uniqueVehicles);

    } catch (err) {
      console.error("CustomerAppointments fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBook = async (data: any) => {
    // Cast to any so field names match whatever your Appointment service type uses.
    // If your service uses different field names (e.g. scheduled_date, service_type),
    // update the keys below to match your actual Omit<Appointment, "id"> shape.
    const payload: any = {
      service:  data.service,
      vehicle:  data.vehicle,
      date:     `${data.date}T${data.time}`,
      deposit:  data.deposit,
      notes:    data.notes,
      status:   "Pending" as const,
    };
    const appt = await createAppointment(payload);
    const raw  = appt.date || appt.scheduled_date || data.date;
    const d    = new Date(raw);
    setAppointments(prev => [...prev, {
      id:      appt.id,
      service: appt.service ?? appt.service_type ?? data.service,
      vehicle: appt.vehicle ?? data.vehicle,
      date:    `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`,
      time:    data.time,
      deposit: Number(appt.deposit ?? data.deposit),
      status:  "Pending",
      notes:   appt.notes ?? data.notes,
    }]);
  };

  // Dot map for calendar
  const dotDates = useMemo(() => {
    const map: Record<string, string[]> = {};
    appointments.forEach(a => {
      if (!map[a.date]) map[a.date] = [];
      map[a.date].push(a.status);
    });
    return map;
  }, [appointments]);

  // Panel appointments for selected date
  const forSelected = useMemo(
    () => appointments.filter(a => a.date === selected),
    [appointments, selected]
  );

  // All appointments filtered
  const filtered = useMemo(() =>
    appointments
      .filter(a => filterStatus === "All" || a.status === filterStatus)
      .filter(a =>
        a.service.toLowerCase().includes(search.toLowerCase()) ||
        a.vehicle.toLowerCase().includes(search.toLowerCase()) ||
        a.status.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [appointments, search, filterStatus]
  );

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-white text-3xl font-bold mb-1">My Appointments</h1>
          <p className="text-white/60 text-sm">{todayDisplay}</p>
        </div>
        <button
          onClick={() => setShowBook(true)}
          className="self-start sm:self-auto inline-flex items-center gap-2 bg-gradient-to-r from-[#E41E6A] to-pink-600 hover:from-[#c41559] text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-[#E41E6A]/25 transition-all"
        >
          <Plus className="w-4 h-4" />New Appointment
        </button>
      </div>

      {/* ── Search + Filter ── */}
      <div className="flex items-center gap-3 max-w-lg">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
          <input
            type="text"
            placeholder="Search appointments..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#E41E6A] focus:ring-1 focus:ring-[#E41E6A]/30 transition-colors"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <SlidersHorizontal className="w-4 h-4 text-white/40 flex-shrink-0" />
          {(["All", "Confirmed", "Pending", "Completed"] as const).map(f => (
            <button key={f} onClick={() => setFilterStatus(f)}
              className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                filterStatus === f
                  ? "bg-[#E41E6A] text-white border-[#E41E6A]"
                  : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white"
              }`}>{f}</button>
          ))}
        </div>
      </div>

      {/* ── Calendar + Panel ── */}
      {isLoading ? (
        <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur" style={{ borderRadius: "12px" }}>
          <CardContent className="flex items-center justify-center h-40 text-white/50">Loading appointments...</CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4">
          <CalendarCard selected={selected} onSelect={setSelected} dotDates={dotDates} />
          <AppointmentsPanel selected={selected} appts={forSelected} onView={setViewAppt} />
        </div>
      )}

      {/* ── All Appointments Table ── */}
      <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur overflow-hidden" style={{ borderRadius: "12px" }}>
        <CardHeader className="border-b border-white/10 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">All Appointments</CardTitle>
            <span className="text-white/40 text-xs">{filtered.length} record{filtered.length !== 1 ? "s" : ""}</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Mobile */}
          <div className="sm:hidden divide-y divide-white/5">
            {filtered.map(a => (
              <div key={a.id} className="p-4 hover:bg-white/5 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <p className="text-white text-sm font-semibold max-w-[60%] leading-snug">{a.service}</p>
                  <StatusBadge status={a.status} />
                </div>
                <p className="text-white/50 text-xs flex items-center gap-1 mb-1"><Car className="w-3 h-3" />{a.vehicle}</p>
                <p className="text-white/50 text-xs flex items-center gap-1 mb-2"><Calendar className="w-3 h-3 text-[#E41E6A]" />{formatShort(a.date)} · {a.time}</p>
                <div className="flex gap-3">
                  <button onClick={() => setViewAppt(a)} className="flex items-center gap-1 text-xs font-medium text-[#E41E6A] hover:text-pink-400 transition-colors">
                    <Eye className="w-3.5 h-3.5" />View
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  {["Date","Service","Vehicle","Deposit","Status","Actions"].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-white/50 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12 text-white/40">
                    <CalendarX className="w-8 h-8 mx-auto mb-2 text-white/20" />No appointments found.
                  </td></tr>
                ) : filtered.map(a => (
                  <tr key={a.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="text-white text-xs font-medium">{formatShort(a.date)}</p>
                      <p className="text-white/40 text-xs">{a.time}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">{serviceIcon(a.service)}</div>
                        <span className="text-white text-sm font-medium max-w-[180px] truncate">{a.service}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-white/60 text-sm whitespace-nowrap">{a.vehicle}</td>
                    <td className="px-5 py-3.5 text-green-400 text-sm font-semibold whitespace-nowrap">₱{Number(a.deposit).toLocaleString()}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={a.status} /></td>
                    <td className="px-5 py-3.5">
                      <button onClick={() => setViewAppt(a)} className="flex items-center gap-1 text-xs font-medium text-[#E41E6A] hover:text-pink-400 transition-colors">
                        <Eye className="w-3.5 h-3.5" />View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ── Modals ── */}
      {showBook && <BookModal onClose={() => setShowBook(false)} onSave={handleBook} services={services} vehicles={vehicles} />}
      {viewAppt  && <ViewModal appt={viewAppt} onClose={() => setViewAppt(null)} />}
    </div>
  );
}

export default CustomerAppointments;