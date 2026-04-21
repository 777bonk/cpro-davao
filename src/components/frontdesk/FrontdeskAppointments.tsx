import {
  getAppointments,
  createAppointment,
  updateAppointmentStatus,
} from "../../services/appointments";
import { useState, useEffect, useMemo } from "react";
import {
  ChevronLeft, ChevronRight, Search, SlidersHorizontal, Plus,
  Calendar, Car, Clock, Banknote, Shield, Layers, Sparkles,
  Eye, XCircle, ChevronDown, X, User, Phone, FileText, CalendarX,
} from "lucide-react";

// ─── API PLACEHOLDERS (Replace with your actual service imports) ──────────────
// import { getAdminAppointments, createAdminAppointment, updateAppointmentStatus } from "../../services/appointments";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type AppointmentStatus = "Confirmed" | "Pending" | "In Progress" | "Completed" | "Cancelled";

interface Appointment {
  id: number | string;
  customer: string;
  contact: string;
  vehicle: string;
  service: string;
  date: string;       // "YYYY-MM-DD"
  time: string;
  deposit: number;
  notes: string;
  status: AppointmentStatus;
}

// ─── CONSTANTS & CONFIG ───────────────────────────────────────────────────────

const SERVICE_OPTIONS = [
  "Ceramic Coating - Full Body", "Ceramic Coating - Partial",
  "PPF - Hood & Fenders", "PPF - Full Body",
  "Window Tinting - Full Car", "Full Interior Detailing",
  "Nano Ceramic Spray", "Paint Decontamination",
];

const TIME_OPTIONS = [
  "8:00 AM","9:00 AM","10:00 AM","10:30 AM","11:00 AM",
  "1:00 PM","2:00 PM","3:00 PM","4:00 PM",
];

const ALL_STATUSES: AppointmentStatus[] = ["Confirmed", "Pending", "In Progress", "Completed", "Cancelled"];

const STATUS_STYLE: Record<AppointmentStatus, { bg: string; text: string; dot: string; border: string }> = {
  Confirmed:    { bg: "bg-green-500/20",  text: "text-green-400",  dot: "bg-green-500",  border: "border-green-500/30"  },
  Pending:      { bg: "bg-yellow-500/20", text: "text-yellow-400", dot: "bg-yellow-400", border: "border-yellow-500/30" },
  "In Progress":{ bg: "bg-blue-500/20",   text: "text-blue-400",   dot: "bg-blue-500",   border: "border-blue-500/30"   },
  Completed:    { bg: "bg-white/10",      text: "text-white/50",   dot: "bg-white/30",   border: "border-white/10"      },
  Cancelled:    { bg: "bg-red-500/20",    text: "text-red-400",    dot: "bg-red-500",    border: "border-red-500/30"    },
};

// ─── SHARED CLASSES ───────────────────────────────────────────────────────────

const inputCls = "w-full px-4 h-10 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/25 focus:outline-none focus:border-[#E41E6A] focus:ring-1 focus:ring-[#E41E6A]/30 transition-colors text-sm";
const cardCls  = "bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur rounded-xl border";

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_NAMES   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function formatShort(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" });
}
function serviceIcon(service: string) {
  const s = service.toLowerCase();
  if (s.includes("coating")) return <Shield   className="w-4 h-4 text-[#E41E6A]"  />;
  if (s.includes("ppf") || s.includes("paint protection")) return <Layers   className="w-4 h-4 text-violet-400" />;
  if (s.includes("tint"))    return <Sparkles className="w-4 h-4 text-sky-400"   />;
  return                            <Car      className="w-4 h-4 text-white/50"   />;
}

// ─── STATUS BADGE ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: AppointmentStatus }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.Pending;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${s.bg} ${s.text} ${s.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status}
    </span>
  );
}

// ─── CALENDAR ─────────────────────────────────────────────────────────────────

function CalendarCard({
  selected, onSelect, dotDates,
}: {
  selected: string;
  onSelect: (d: string) => void;
  dotDates: Record<string, AppointmentStatus[]>;
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

  const dotColor = (statuses: AppointmentStatus[]) => {
    if (statuses.includes("In Progress")) return "bg-blue-500";
    if (statuses.includes("Confirmed"))   return "bg-green-500";
    if (statuses.includes("Pending"))     return "bg-yellow-400";
    return "bg-white/30";
  };

  return (
    <div className={`${cardCls} p-5`}>
      <div className="mb-4">
        <h2 className="text-sm font-bold text-white">Calendar</h2>
        <p className="text-xs text-white/50 mt-0.5">Select a date to filter appointments</p>
      </div>

      <div className="flex items-center justify-between mb-4">
        <button onClick={prev} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors">
          <ChevronLeft className="w-4 h-4 text-white/60" />
        </button>
        <span className="text-sm font-semibold text-white">{MONTH_NAMES[viewMonth]} {viewYear}</span>
        <button onClick={next} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors">
          <ChevronRight className="w-4 h-4 text-white/60" />
        </button>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {DAY_NAMES.map(d => <div key={d} className="text-center text-[10px] font-semibold text-white/30 py-1">{d}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />;
          const key     = cellKey(day);
          const isToday = key === today;
          const isSel   = key === selected;
          const dots    = dotDates[key];
          return (
            <button
              key={key}
              onClick={() => onSelect(key)}
              className={`
                relative flex flex-col items-center justify-center w-8 h-8 mx-auto rounded-full text-xs font-medium transition-all
                ${isSel   ? "bg-[#E41E6A] text-white shadow-md shadow-[#E41E6A]/30" : ""}
                ${isToday && !isSel ? "border border-[#E41E6A] text-[#E41E6A]" : ""}
                ${!isSel && !isToday ? "text-white/60 hover:bg-white/10" : ""}
              `}
            >
              {day}
              {dots && <span className={`absolute bottom-0.5 w-1.5 h-1.5 rounded-full ${isSel ? "bg-white" : dotColor(dots)}`} />}
            </button>
          );
        })}
      </div>

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
    </div>
  );
}

// ─── APPOINTMENT PANEL ────────────────────────────────────────────────────────

function AppointmentsPanel({
  selected, appts, onViewDetail,
}: {
  selected: string;
  appts: Appointment[];
  onViewDetail: (a: Appointment) => void;
}) {
  return (
    <div className={`${cardCls} p-5 flex flex-col min-h-[420px]`}>
      <div className="mb-4">
        <h2 className="text-sm font-bold text-white">
          Appointments for <span className="text-[#E41E6A]">{formatShort(selected)}</span>
        </h2>
        <p className="text-xs text-white/50 mt-0.5">{appts.length} appointment{appts.length !== 1 ? "s" : ""} scheduled</p>
      </div>

      {appts.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-10">
          <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-3">
            <CalendarX className="w-6 h-6 text-white/20" />
          </div>
          <p className="text-sm font-medium text-white/40">No appointments for this date</p>
        </div>
      ) : (
        <div className="space-y-3 overflow-y-auto">
          {appts.map(a => (
            <div key={a.id} className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-[#E41E6A]/40 transition-all">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                    {serviceIcon(a.service)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white leading-snug">{a.service}</p>
                    <p className="text-xs text-white/50 mt-0.5">{a.customer} · {a.vehicle}</p>
                  </div>
                </div>
                <StatusBadge status={a.status} />
              </div>
              <div className="flex flex-wrap gap-3 pt-2 border-t border-white/10">
                <span className="flex items-center gap-1 text-xs text-white/50"><Clock className="w-3.5 h-3.5 text-[#E41E6A]" />{a.time}</span>
                <span className="flex items-center gap-1 text-xs text-white/50"><Banknote className="w-3.5 h-3.5 text-green-400" />₱{a.deposit.toLocaleString()}</span>
                <button onClick={() => onViewDetail(a)} className="ml-auto flex items-center gap-1 text-xs font-medium text-[#E41E6A] hover:text-pink-400 transition-colors">
                  <Eye className="w-3.5 h-3.5" />View
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── ALL APPOINTMENTS TABLE ───────────────────────────────────────────────────

function AppointmentTable({
  appts, onViewDetail, onCancel,
}: {
  appts: Appointment[];
  onViewDetail: (a: Appointment) => void;
  onCancel: (id: number | string) => void;
}) {
  return (
    <div className={`${cardCls} overflow-hidden`}>
      <div className="px-5 py-4 border-b border-white/10 flex justify-between items-center">
        <h2 className="text-sm font-bold text-white">All Appointments</h2>
        <span className="text-xs text-white/40">{appts.length} total records</span>
      </div>

      {/* Mobile */}
      <div className="sm:hidden divide-y divide-white/5">
        {appts.map(a => (
          <div key={a.id} className="p-4 flex flex-col gap-2 hover:bg-white/5 transition-colors">
            <div className="flex items-start justify-between">
              <p className="text-sm font-semibold text-white max-w-[65%] leading-snug">{a.service}</p>
              <StatusBadge status={a.status} />
            </div>
            <p className="text-xs text-white/50 flex items-center gap-1"><User className="w-3 h-3" />{a.customer}</p>
            <p className="text-xs text-white/50 flex items-center gap-1"><Car className="w-3 h-3" />{a.vehicle}</p>
            <p className="text-xs text-white/50 flex items-center gap-1"><Calendar className="w-3 h-3 text-[#E41E6A]" />{formatShort(a.date)} · {a.time}</p>
            <div className="flex gap-3 mt-2 pt-2 border-t border-white/5">
              <button onClick={() => onViewDetail(a)} className="flex items-center gap-1 text-xs font-medium text-[#E41E6A] hover:text-pink-400">
                <Eye className="w-3.5 h-3.5" />View
              </button>
              {a.status !== "Completed" && a.status !== "Cancelled" && (
                <button onClick={() => onCancel(a.id)} className="flex items-center gap-1 text-xs font-medium text-red-400 hover:text-red-300">
                  <XCircle className="w-3.5 h-3.5" />Cancel
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left">
              {["Date","Customer","Service","Vehicle","Status","Actions"].map(h => (
                <th key={h} className="px-5 py-3.5 text-xs font-semibold text-white/50 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {appts.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-10 text-white/40 text-sm">No appointments found.</td></tr>
            ) : (
              appts.map(a => (
                <tr key={a.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className="block text-xs font-medium text-white">{formatShort(a.date)}</span>
                    <span className="text-xs text-white/40">{a.time}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="block text-sm font-medium text-white">{a.customer}</span>
                    <span className="text-xs text-white/50 flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3" />{a.contact}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">{serviceIcon(a.service)}</div>
                      <span className="text-sm text-white max-w-[180px] truncate">{a.service}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-white/60 whitespace-nowrap">{a.vehicle}</td>
                  <td className="px-5 py-3.5"><StatusBadge status={a.status} /></td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <button onClick={() => onViewDetail(a)} className="flex items-center gap-1 text-xs font-medium text-[#E41E6A] hover:text-pink-400 transition-colors">
                        <Eye className="w-3.5 h-3.5" />View
                      </button>
                      {a.status !== "Completed" && a.status !== "Cancelled" && (
                        <button onClick={() => onCancel(a.id)} className="flex items-center gap-1 text-xs font-medium text-red-400 hover:text-red-300 transition-colors">
                          <XCircle className="w-3.5 h-3.5" />Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── ADD APPOINTMENT MODAL ────────────────────────────────────────────────────

function AddAppointmentModal({
  onClose, onSave,
}: {
  onClose: () => void;
  onSave: (a: Omit<Appointment, "id">) => void;
}) {
  const [form, setForm] = useState({
    customer: "", contact: "", vehicle: "",
    service: "", date: todayStr(), time: "9:00 AM",
    deposit: "", notes: "", status: "Confirmed" as AppointmentStatus,
  });
  const [error, setError] = useState("");

  const handleSave = () => {
    if (!form.customer || !form.vehicle || !form.service || !form.date || !form.time) {
      setError("Please fill in all required fields."); return;
    }
    onSave({ ...form, deposit: parseFloat(form.deposit) || 0 });
    onClose();
  };

  const field = (label: string, required = false) => (
    <span className="text-sm font-medium text-white/70 block mb-1.5">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </span>
  );

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm" style={{ backgroundColor: "rgba(0,0,0,0.8)" }}>
      <div className="bg-[#0a0a0a] border border-white/10 rounded-xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl">
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white">New Appointment</h2>
            <p className="text-xs text-white/50 mt-0.5">Fill in the appointment details</p>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              {field("Customer Name", true)}
              <input className={inputCls} placeholder="Full name" value={form.customer} onChange={e => setForm({...form, customer: e.target.value})} />
            </div>
            <div>
              {field("Contact Number")}
              <input className={inputCls} placeholder="09XX-XXX-XXXX" value={form.contact} onChange={e => setForm({...form, contact: e.target.value})} />
            </div>
          </div>
          <div>
            {field("Vehicle", true)}
            <input className={inputCls} placeholder="Year Make Model (e.g. 2023 Toyota Fortuner)" value={form.vehicle} onChange={e => setForm({...form, vehicle: e.target.value})} />
          </div>
          <div>
            {field("Service", true)}
            <div className="relative">
              <select className={`${inputCls} appearance-none pr-8`} value={form.service} onChange={e => setForm({...form, service: e.target.value})}>
                <option value="" className="bg-[#0a0a0a]">Select a service...</option>
                {SERVICE_OPTIONS.map(s => <option key={s} value={s} className="bg-[#0a0a0a]">{s}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              {field("Date", true)}
              <input type="date" className={`${inputCls} [color-scheme:dark]`} value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
            </div>
            <div>
              {field("Time", true)}
              <div className="relative">
                <select className={`${inputCls} appearance-none pr-8`} value={form.time} onChange={e => setForm({...form, time: e.target.value})}>
                  {TIME_OPTIONS.map(t => <option key={t} value={t} className="bg-[#0a0a0a]">{t}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              {field("Deposit (₱)")}
              <input type="number" className={inputCls} placeholder="0" value={form.deposit} onChange={e => setForm({...form, deposit: e.target.value})} />
            </div>
            <div>
              {field("Status")}
              <div className="relative">
                <select className={`${inputCls} appearance-none pr-8`} value={form.status} onChange={e => setForm({...form, status: e.target.value as AppointmentStatus})}>
                  {ALL_STATUSES.map(s => <option key={s} value={s} className="bg-[#0a0a0a]">{s}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
              </div>
            </div>
          </div>
          <div>
            {field("Notes")}
            <textarea className={`${inputCls} resize-none h-20 py-2.5`} placeholder="Optional notes..." value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
          </div>
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              <X className="w-4 h-4 flex-shrink-0" />{error}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-white/10 bg-white/5 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium border border-white/10 text-white hover:bg-white/10 rounded-lg transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#E41E6A] to-pink-600 hover:from-[#c41559] rounded-lg shadow-md shadow-[#E41E6A]/25 transition-all">
            Save Appointment
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── VIEW / EDIT DETAIL MODAL ─────────────────────────────────────────────────

function DetailModal({
  appt, onClose, onStatusChange,
}: {
  appt: Appointment;
  onClose: () => void;
  onStatusChange: (id: number | string, status: AppointmentStatus) => void;
}) {
  const [status, setStatus] = useState<AppointmentStatus>(appt.status);

  const handleUpdate = () => {
    onStatusChange(appt.id, status);
    onClose();
  };

  const Row = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
    <div className="flex items-start gap-3 py-3 border-b border-white/10 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 mt-0.5 border border-white/5">
        {icon}
      </div>
      <div>
        <p className="text-xs text-white/50 font-medium">{label}</p>
        <p className="text-sm text-white font-semibold mt-0.5">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm" style={{ backgroundColor: "rgba(0,0,0,0.8)" }}>
      <div className="bg-[#0a0a0a] border border-white/10 rounded-xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-white/10 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white">Appointment Details</h2>
            <p className="text-xs text-white/50 mt-0.5">#{appt.id} · {formatShort(appt.date)}</p>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors flex-shrink-0"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 overflow-y-auto">
          <Row icon={<User      className="w-4 h-4 text-white/50" />} label="Customer"  value={appt.customer} />
          <Row icon={<Phone     className="w-4 h-4 text-white/50" />} label="Contact"   value={appt.contact || "N/A"} />
          <Row icon={<Car       className="w-4 h-4 text-white/50" />} label="Vehicle"   value={appt.vehicle} />
          <Row icon={<Shield    className="w-4 h-4 text-[#E41E6A]"/>} label="Service"   value={appt.service} />
          <Row icon={<Clock     className="w-4 h-4 text-[#E41E6A]"/>} label="Schedule"  value={`${formatShort(appt.date)} · ${appt.time}`} />
          <Row icon={<Banknote  className="w-4 h-4 text-green-400"/>} label="Deposit" value={`₱${appt.deposit.toLocaleString()}`} />
          {appt.notes && <Row icon={<FileText className="w-4 h-4 text-white/50" />} label="Notes" value={appt.notes} />}

          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-xs text-white/50 font-medium mb-2">Update Status</p>
            <div className="relative">
              <select
                className={`${inputCls} appearance-none pr-8 font-semibold`}
                value={status}
                onChange={e => setStatus(e.target.value as AppointmentStatus)}
              >
                {ALL_STATUSES.map(s => <option key={s} value={s} className="bg-[#0a0a0a]">{s}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-white/10 bg-white/5 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium border border-white/10 text-white hover:bg-white/10 rounded-lg transition-colors">
            Close
          </button>
          <button onClick={handleUpdate} className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#E41E6A] to-pink-600 hover:from-[#c41559] rounded-lg shadow-md shadow-[#E41E6A]/25 transition-all">
            Update Status
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export function FrontDeskAppointments() {
  const today = todayStr();
  
  // State is now initialized as an empty array, ready for backend data.
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading,    setIsLoading]    = useState(true);
  
  const [selected,     setSelected]     = useState(today);
  const [search,       setSearch]       = useState("");
  const [showAdd,      setShowAdd]      = useState(false);
  const [detailAppt,   setDetailAppt]   = useState<Appointment | null>(null);

  const todayDisplay = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  // ─── DATA FETCHING (Simulated) ───
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = await getAppointments();
      // Map Appointment service shape → component shape
      const mapped: Appointment[] = data.map((a) => ({
        id:       a.id,
        customer: a.customerName,
        contact:  "",
        vehicle:  a.vehicle,
        service:  a.service,
        date:     a.date,
        time:     a.time,
        deposit:  a.totalAmount,
        notes:    "",
        status:   a.status as AppointmentStatus,
      }));
      setAppointments(mapped);
    } catch (err) {
      console.error("Failed to fetch appointments:", err);
    } finally {
      setIsLoading(false);
    }
  };
  // ─── HANDLERS ───
  const handleAdd = async (appt: Omit<Appointment, "id">) => {
    try {
      // Convert "9:00 AM" → "09:00" for the service layer
      const [timePart, meridiem] = appt.time.split(" ");
      let [hours, minutes]       = timePart.split(":").map(Number);
      if (meridiem === "PM" && hours !== 12) hours += 12;
      if (meridiem === "AM" && hours === 12) hours  = 0;
      const time24 = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;

      const created = await createAppointment({
        customerId:  appt.customer, // adjust if you have a real ID
        service:     appt.service,
        date:        appt.date,
        time:        time24,
        totalAmount: appt.deposit,
      });

      setAppointments(prev => [...prev, {
        id:       created.id,
        customer: created.customerName,
        contact:  appt.contact,
        vehicle:  created.vehicle,
        service:  created.service,
        date:     created.date,
        time:     appt.time,
        deposit:  created.totalAmount,
        notes:    appt.notes,
        status:   created.status as AppointmentStatus,
      }]);
    } catch (err) {
      console.error("Failed to create appointment:", err);
    }
  };

  const handleCancel = async (id: number | string) => {
    try {
      await updateAppointmentStatus(String(id), "Cancelled");
      setAppointments(prev =>
        prev.map(a => a.id === id ? { ...a, status: "Cancelled" } : a)
      );
    } catch (err) {
      console.error("Failed to cancel appointment:", err);
    }
  };
  
  const handleStatusChange = async (id: number | string, status: AppointmentStatus) => {
    try {
      await updateAppointmentStatus(String(id), status);
      setAppointments(prev =>
        prev.map(a => a.id === id ? { ...a, status } : a)
      );
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };
  // ─── COMPUTED DATA ───
  const dotDates = useMemo(() => {
    const map: Record<string, AppointmentStatus[]> = {};
    appointments.forEach(a => {
      if (!map[a.date]) map[a.date] = [];
      map[a.date].push(a.status);
    });
    return map;
  }, [appointments]);

  const forSelected = useMemo(
    () => appointments.filter(a => a.date === selected),
    [appointments, selected]
  );

  const filtered = useMemo(
    () => appointments
      .filter(a =>
        a.customer.toLowerCase().includes(search.toLowerCase()) ||
        a.service.toLowerCase().includes(search.toLowerCase()) ||
        a.vehicle.toLowerCase().includes(search.toLowerCase()) ||
        a.status.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [appointments, search]
  );

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-white text-3xl font-bold mb-1">Manage Appointments</h1>
          <p className="text-white/60 text-sm">{todayDisplay}</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="self-start sm:self-auto inline-flex items-center gap-2 bg-gradient-to-r from-[#E41E6A] to-pink-600 hover:from-[#c41559] text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-[#E41E6A]/25 transition-all"
        >
          <Plus className="w-4 h-4" />
          New Appointment
        </button>
      </div>

      {/* ── Search + Filter ── */}
      <div className="flex items-center gap-3 max-w-lg">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by customer, service, vehicle..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#E41E6A] focus:ring-1 focus:ring-[#E41E6A]/30 transition-colors"
          />
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white/60 bg-white/5 border border-white/10 rounded-xl shadow-sm hover:border-white/20 hover:text-white hover:bg-white/10 transition-colors">
          <SlidersHorizontal className="w-4 h-4" />Filter
        </button>
      </div>

      {/* ── Content Area ── */}
      {isLoading ? (
        <div className={`${cardCls} flex items-center justify-center h-40 text-white/50`}>
          Loading appointments...
        </div>
      ) : (
        <>
          {/* ── Calendar + Panel ── */}
          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4">
            <CalendarCard selected={selected} onSelect={setSelected} dotDates={dotDates} />
            <AppointmentsPanel selected={selected} appts={forSelected} onViewDetail={setDetailAppt} />
          </div>

          {/* ── All Appointments Table ── */}
          <AppointmentTable appts={filtered} onViewDetail={setDetailAppt} onCancel={handleCancel} />
        </>
      )}

      {/* ── Modals ── */}
      {showAdd    && <AddAppointmentModal onClose={() => setShowAdd(false)} onSave={handleAdd} />}
      {detailAppt && <DetailModal appt={detailAppt} onClose={() => setDetailAppt(null)} onStatusChange={handleStatusChange} />}

    </div>
  );
}

export default FrontDeskAppointments;