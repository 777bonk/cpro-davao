import { useState, useMemo } from "react";
import {
  ChevronLeft, ChevronRight, Search, SlidersHorizontal, Plus,
  Calendar, Car, Clock, Banknote, Shield, Layers, Sparkles,
  Eye, XCircle, ChevronDown, X, User, Phone, FileText, CalendarX,
} from "lucide-react";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type AppointmentStatus = "Confirmed" | "Pending" | "In Progress" | "Completed" | "Cancelled";

interface Appointment {
  id: number;
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

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

const INITIAL_APPOINTMENTS: Appointment[] = [
  { id: 1, customer: "Juan dela Cruz",   contact: "09171234567", vehicle: "2023 Toyota Fortuner",    service: "Ceramic Coating - Full Body",   date: "2026-04-19", time: "9:00 AM",  deposit: 3000, notes: "Prefers morning slot.", status: "In Progress" },
  { id: 2, customer: "Maria Santos",     contact: "09181234567", vehicle: "2021 Honda Civic",         service: "Window Tinting - Full Car",     date: "2026-04-19", time: "10:30 AM", deposit: 1000, notes: "",                    status: "Confirmed"   },
  { id: 3, customer: "Carlo Reyes",      contact: "09191234567", vehicle: "2022 Mitsubishi Xpander",  service: "PPF - Hood & Fenders",          date: "2026-04-19", time: "1:00 PM",  deposit: 2500, notes: "Check for scratches first.", status: "Confirmed" },
  { id: 4, customer: "Ana Villanueva",   contact: "09201234567", vehicle: "2020 Ford Ranger",         service: "Full Interior Detailing",       date: "2026-04-24", time: "9:00 AM",  deposit: 800,  notes: "",                    status: "Confirmed"   },
  { id: 5, customer: "Ramon Gutierrez",  contact: "09211234567", vehicle: "2023 Nissan Terra",        service: "Nano Ceramic Spray",            date: "2026-05-03", time: "2:00 PM",  deposit: 500,  notes: "Walk-in referral.",   status: "Pending"     },
  { id: 6, customer: "Liza Mendoza",     contact: "09221234567", vehicle: "2021 Kia Stinger",         service: "Ceramic Coating - Partial",     date: "2026-05-10", time: "10:00 AM", deposit: 1500, notes: "",                    status: "Pending"     },
  { id: 7, customer: "Paolo Cruz",       contact: "09231234567", vehicle: "2019 Toyota Vios",         service: "Full Interior Detailing",       date: "2026-03-20", time: "3:00 PM",  deposit: 800,  notes: "",                    status: "Completed"   },
  { id: 8, customer: "Sofia Reyes",      contact: "09241234567", vehicle: "2022 Honda BRV",           service: "Window Tinting - Full Car",     date: "2026-03-28", time: "11:00 AM", deposit: 1000, notes: "",                    status: "Completed"   },
];

const SERVICE_OPTIONS = [
  "Ceramic Coating - Full Body",
  "Ceramic Coating - Partial",
  "PPF - Hood & Fenders",
  "PPF - Full Body",
  "Window Tinting - Full Car",
  "Full Interior Detailing",
  "Nano Ceramic Spray",
  "Paint Decontamination",
];

const TIME_OPTIONS = [
  "8:00 AM","9:00 AM","10:00 AM","10:30 AM","11:00 AM",
  "1:00 PM","2:00 PM","3:00 PM","4:00 PM",
];

// ─── STATUS CONFIG ─────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<AppointmentStatus, { bg: string; text: string; dot: string; border: string }> = {
  Confirmed:    { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", border: "border-emerald-200" },
  Pending:      { bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-400",   border: "border-amber-200"   },
  "In Progress":{ bg: "bg-blue-50",    text: "text-blue-700",    dot: "bg-blue-500",    border: "border-blue-200"    },
  Completed:    { bg: "bg-gray-100",   text: "text-gray-600",    dot: "bg-gray-400",    border: "border-gray-200"    },
  Cancelled:    { bg: "bg-red-50",     text: "text-red-600",     dot: "bg-red-400",     border: "border-red-200"     },
};

const ALL_STATUSES: AppointmentStatus[] = ["Confirmed", "Pending", "In Progress", "Completed", "Cancelled"];

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
  if (s.includes("coating"))  return <Shield   className="w-4 h-4 text-[#E41E6A]"  />;
  if (s.includes("ppf") || s.includes("paint protection"))
                               return <Layers   className="w-4 h-4 text-violet-500" />;
  if (s.includes("tint"))      return <Sparkles className="w-4 h-4 text-sky-500"   />;
  return                              <Car      className="w-4 h-4 text-gray-400"   />;
}

// ─── STATUS BADGE ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: AppointmentStatus }) {
  const s = STATUS_STYLE[status];
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
    if (statuses.includes("Confirmed"))   return "bg-emerald-500";
    if (statuses.includes("Pending"))     return "bg-amber-400";
    return "bg-gray-400";
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <div className="mb-4">
        <h2 className="text-sm font-bold text-gray-800">Calendar</h2>
        <p className="text-xs text-gray-400 mt-0.5">Select a date to filter appointments</p>
      </div>

      {/* Month nav */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prev} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors">
          <ChevronLeft className="w-4 h-4 text-gray-500" />
        </button>
        <span className="text-sm font-semibold text-gray-700">{MONTH_NAMES[viewMonth]} {viewYear}</span>
        <button onClick={next} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors">
          <ChevronRight className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_NAMES.map(d => (
          <div key={d} className="text-center text-[10px] font-semibold text-gray-400 py-1">{d}</div>
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
            <button
              key={key}
              onClick={() => onSelect(key)}
              className={`
                relative flex flex-col items-center justify-center w-8 h-8 mx-auto rounded-full text-xs font-medium transition-all
                ${isSel   ? "bg-[#E41E6A] text-white shadow-md shadow-[#E41E6A]/30" : ""}
                ${isToday && !isSel ? "border border-[#E41E6A] text-[#E41E6A]" : ""}
                ${!isSel && !isToday ? "text-gray-600 hover:bg-gray-100" : ""}
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
      <div className="mt-4 pt-4 border-t border-gray-50 flex flex-col gap-1.5">
        {[
          { dot: "bg-emerald-500", label: "Confirmed"    },
          { dot: "bg-blue-500",    label: "In Progress"  },
          { dot: "bg-amber-400",   label: "Pending"      },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${l.dot}`} />
            <span className="text-xs text-gray-500">{l.label}</span>
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
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col min-h-[420px]">
      <div className="mb-4">
        <h2 className="text-sm font-bold text-gray-800">
          Appointments for <span className="text-[#E41E6A]">{formatShort(selected)}</span>
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">
          {appts.length} appointment{appts.length !== 1 ? "s" : ""} scheduled
        </p>
      </div>

      {appts.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-10">
          <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mb-3">
            <CalendarX className="w-6 h-6 text-gray-300" />
          </div>
          <p className="text-sm font-medium text-gray-400">No appointments for this date</p>
        </div>
      ) : (
        <div className="space-y-3 overflow-y-auto">
          {appts.map(a => (
            <div key={a.id} className="bg-gray-50 rounded-xl p-4 border border-gray-100 hover:border-[#E41E6A]/30 transition-all">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center flex-shrink-0">
                    {serviceIcon(a.service)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800 leading-snug">{a.service}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{a.customer} · {a.vehicle}</p>
                  </div>
                </div>
                <StatusBadge status={a.status} />
              </div>
              <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-100">
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock className="w-3.5 h-3.5 text-[#E41E6A]" />{a.time}
                </span>
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <Banknote className="w-3.5 h-3.5 text-emerald-500" />
                  ₱{a.deposit.toLocaleString()} deposit
                </span>
                <button
                  onClick={() => onViewDetail(a)}
                  className="ml-auto flex items-center gap-1 text-xs font-medium text-sky-600 hover:text-sky-800 transition-colors"
                >
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
  onCancel: (id: number) => void;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-50">
        <h2 className="text-sm font-bold text-gray-800">All Appointments</h2>
        <p className="text-xs text-gray-400 mt-0.5">{appts.length} total records</p>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden divide-y divide-gray-50">
        {appts.map(a => (
          <div key={a.id} className="p-4 flex flex-col gap-2">
            <div className="flex items-start justify-between">
              <p className="text-sm font-semibold text-gray-800 max-w-[65%] leading-snug">{a.service}</p>
              <StatusBadge status={a.status} />
            </div>
            <p className="text-xs text-gray-400 flex items-center gap-1"><User className="w-3 h-3" />{a.customer}</p>
            <p className="text-xs text-gray-400 flex items-center gap-1"><Car className="w-3 h-3" />{a.vehicle}</p>
            <p className="text-xs text-gray-400 flex items-center gap-1"><Calendar className="w-3 h-3 text-[#E41E6A]" />{formatShort(a.date)} · {a.time}</p>
            <div className="flex gap-3 mt-1">
              <button onClick={() => onViewDetail(a)} className="flex items-center gap-1 text-xs font-medium text-sky-600 hover:text-sky-800">
                <Eye className="w-3.5 h-3.5" />View
              </button>
              {a.status !== "Completed" && a.status !== "Cancelled" && (
                <button onClick={() => onCancel(a.id)} className="flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-700">
                  <XCircle className="w-3.5 h-3.5" />Cancel
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left">
              {["Date","Customer","Service","Vehicle","Status","Actions"].map(h => (
                <th key={h} className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {appts.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-10 text-gray-400 text-sm">No appointments found.</td></tr>
            ) : (
              appts.map(a => (
                <tr key={a.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className="block text-xs font-medium text-gray-700">{formatShort(a.date)}</span>
                    <span className="text-xs text-gray-400">{a.time}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="block text-sm font-medium text-gray-800">{a.customer}</span>
                    <span className="text-xs text-gray-400 flex items-center gap-1"><Phone className="w-3 h-3" />{a.contact}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center flex-shrink-0">
                        {serviceIcon(a.service)}
                      </div>
                      <span className="text-sm text-gray-800 max-w-[180px] truncate">{a.service}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-500 whitespace-nowrap">{a.vehicle}</td>
                  <td className="px-5 py-3.5"><StatusBadge status={a.status} /></td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <button onClick={() => onViewDetail(a)} className="flex items-center gap-1 text-xs font-medium text-sky-600 hover:text-sky-800 transition-colors">
                        <Eye className="w-3.5 h-3.5" />View
                      </button>
                      {a.status !== "Completed" && a.status !== "Cancelled" && (
                        <button onClick={() => onCancel(a.id)} className="flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-700 transition-colors">
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
    <span className="text-sm text-gray-700 font-medium">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </span>
  );

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-800">New Appointment</h2>
            <p className="text-xs text-gray-400 mt-0.5">Fill in the appointment details</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              {field("Customer Name", true)}
              <input className="input-field" placeholder="Full name" value={form.customer} onChange={e => setForm({...form, customer: e.target.value})} />
            </div>
            <div className="space-y-1.5">
              {field("Contact Number")}
              <input className="input-field" placeholder="09XX-XXX-XXXX" value={form.contact} onChange={e => setForm({...form, contact: e.target.value})} />
            </div>
          </div>
          <div className="space-y-1.5">
            {field("Vehicle", true)}
            <input className="input-field" placeholder="Year Make Model (e.g. 2023 Toyota Fortuner)" value={form.vehicle} onChange={e => setForm({...form, vehicle: e.target.value})} />
          </div>
          <div className="space-y-1.5">
            {field("Service", true)}
            <div className="relative">
              <select className="input-field appearance-none pr-8" value={form.service} onChange={e => setForm({...form, service: e.target.value})}>
                <option value="">Select a service...</option>
                {SERVICE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              {field("Date", true)}
              <input type="date" className="input-field" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
            </div>
            <div className="space-y-1.5">
              {field("Time", true)}
              <div className="relative">
                <select className="input-field appearance-none pr-8" value={form.time} onChange={e => setForm({...form, time: e.target.value})}>
                  {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              {field("Deposit (₱)")}
              <input type="number" className="input-field" placeholder="0" value={form.deposit} onChange={e => setForm({...form, deposit: e.target.value})} />
            </div>
            <div className="space-y-1.5">
              {field("Status")}
              <div className="relative">
                <select className="input-field appearance-none pr-8" value={form.status} onChange={e => setForm({...form, status: e.target.value as AppointmentStatus})}>
                  {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            {field("Notes")}
            <textarea className="input-field resize-none h-20" placeholder="Optional notes..." value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
          </div>
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              <X className="w-4 h-4 flex-shrink-0" />{error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} className="px-4 py-2 text-sm font-semibold text-white bg-[#E41E6A] hover:bg-[#c41559] rounded-lg shadow-md shadow-[#E41E6A]/25 transition-colors">
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
  onStatusChange: (id: number, status: AppointmentStatus) => void;
}) {
  const [status, setStatus] = useState<AppointmentStatus>(appt.status);

  const handleUpdate = () => {
    onStatusChange(appt.id, status);
    onClose();
  };

  const Row = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
    <div className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0 mt-0.5">
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-400 font-medium">{label}</p>
        <p className="text-sm text-gray-800 font-semibold mt-0.5">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-gray-800">Appointment Details</h2>
            <p className="text-xs text-gray-400 mt-0.5">#{appt.id} · {formatShort(appt.date)}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors flex-shrink-0">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto">
          <Row icon={<User      className="w-4 h-4 text-gray-400" />} label="Customer"  value={appt.customer} />
          <Row icon={<Phone     className="w-4 h-4 text-gray-400" />} label="Contact"   value={appt.contact || "N/A"} />
          <Row icon={<Car       className="w-4 h-4 text-gray-400" />} label="Vehicle"   value={appt.vehicle} />
          <Row icon={<Shield    className="w-4 h-4 text-[#E41E6A]"/>} label="Service"   value={appt.service} />
          <Row icon={<Clock     className="w-4 h-4 text-[#E41E6A]"/>} label="Schedule"  value={`${formatShort(appt.date)} · ${appt.time}`} />
          <Row icon={<Banknote  className="w-4 h-4 text-emerald-500"/>} label="Deposit" value={`₱${appt.deposit.toLocaleString()}`} />
          {appt.notes && (
            <Row icon={<FileText className="w-4 h-4 text-gray-400" />} label="Notes"   value={appt.notes} />
          )}

          {/* Status updater */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 font-medium mb-2">Update Status</p>
            <div className="relative">
              <select
                className="input-field appearance-none pr-8 font-semibold"
                value={status}
                onChange={e => setStatus(e.target.value as AppointmentStatus)}
              >
                {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
            Close
          </button>
          <button onClick={handleUpdate} className="px-4 py-2 text-sm font-semibold text-white bg-[#E41E6A] hover:bg-[#c41559] rounded-lg shadow-md shadow-[#E41E6A]/25 transition-colors">
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
  const [appointments, setAppointments] = useState<Appointment[]>(INITIAL_APPOINTMENTS);
  const [selected,     setSelected]     = useState(today);
  const [search,       setSearch]       = useState("");
  const [showAdd,      setShowAdd]      = useState(false);
  const [detailAppt,   setDetailAppt]   = useState<Appointment | null>(null);

  const todayDisplay = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  // Dot map for calendar
  const dotDates = useMemo(() => {
    const map: Record<string, AppointmentStatus[]> = {};
    appointments.forEach(a => {
      if (!map[a.date]) map[a.date] = [];
      map[a.date].push(a.status);
    });
    return map;
  }, [appointments]);

  // Panel: appointments for selected date
  const forSelected = useMemo(
    () => appointments.filter(a => a.date === selected),
    [appointments, selected]
  );

  // Table: all, filtered by search
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

  const handleAdd = (appt: Omit<Appointment, "id">) => {
    const newId = Math.max(...appointments.map(a => a.id), 0) + 1;
    setAppointments(prev => [...prev, { ...appt, id: newId }]);
  };

  const handleCancel = (id: number) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: "Cancelled" } : a));
  };

  const handleStatusChange = (id: number, status: AppointmentStatus) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  };

  return (
    <div className="min-h-full bg-gray-50 p-4 md:p-6 space-y-5">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Appointments</h1>
          <p className="text-gray-400 text-sm mt-1">{todayDisplay}</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="self-start sm:self-auto inline-flex items-center gap-2 bg-[#E41E6A] hover:bg-[#c41559] text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-[#E41E6A]/25 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Appointment
        </button>
      </div>

      {/* ── Search + Filter ── */}
      <div className="flex items-center gap-3 max-w-lg">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by customer, service, vehicle..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:border-[#E41E6A] focus:ring-1 focus:ring-[#E41E6A]/30 transition-colors placeholder:text-gray-400"
          />
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-gray-300 hover:bg-gray-50 transition-colors">
          <SlidersHorizontal className="w-4 h-4" />Filter
        </button>
      </div>

      {/* ── Calendar + Panel ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4">
        <CalendarCard selected={selected} onSelect={setSelected} dotDates={dotDates} />
        <AppointmentsPanel selected={selected} appts={forSelected} onViewDetail={setDetailAppt} />
      </div>

      {/* ── All Appointments Table ── */}
      <AppointmentTable appts={filtered} onViewDetail={setDetailAppt} onCancel={handleCancel} />

      {/* ── Modals ── */}
      {showAdd    && <AddAppointmentModal onClose={() => setShowAdd(false)} onSave={handleAdd} />}
      {detailAppt && <DetailModal appt={detailAppt} onClose={() => setDetailAppt(null)} onStatusChange={handleStatusChange} />}

      {/* ── Shared input style ── */}
      <style>{`
        .input-field {
          width: 100%;
          padding: 0 12px;
          height: 40px;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          font-size: 14px;
          color: #1f2937;
          background: #fff;
          outline: none;
          transition: border-color 0.15s;
        }
        .input-field:focus { border-color: #E41E6A; box-shadow: 0 0 0 3px rgba(228,30,106,0.08); }
        .input-field::placeholder { color: #9ca3af; }
        textarea.input-field { height: auto; padding-top: 10px; padding-bottom: 10px; }
      `}</style>

    </div>
  );
}

export default FrontDeskAppointments;