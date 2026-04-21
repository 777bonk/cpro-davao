import {
  getAppointments, updateAppointmentStatus,
  approveAppointment, rejectAppointment,
} from "../../services/appointments";
import { useState, useEffect, useMemo } from "react";
import {
  ChevronLeft, ChevronRight, Search, SlidersHorizontal,
  Calendar, Car, Clock, Banknote, Shield, Layers, Sparkles,
  Eye, XCircle, ChevronDown, X, User, Phone, FileText, CalendarX,
  CheckCircle, AlertCircle, ImageIcon, CreditCard, Wallet, RefreshCw,
} from "lucide-react";

const API = import.meta.env.VITE_API_BASE_URL;

type AppointmentStatus =
  | "Pending Verification" | "Confirmed" | "Pending"
  | "In Progress" | "Completed" | "Cancelled" | "Rejected";

interface Appt {
  id: string | number;
  customerId?: string;
  customer: string;
  contact: string;
  vehicle: string;
  service: string;
  date: string;
  time: string;
  deposit: number;
  totalAmount: number;
  remainingBalance: number;
  notes: string;
  status: AppointmentStatus;
  fullName?: string;
  mobileNumber?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleYear?: number;
  vehicleClass?: string;
  vehiclePlateNumber?: string;
  paymentMethod?: string;
  paymentType?: string;
  proofOfPayment?: string;
  adminRemarks?: string;
  addons?: any[];
}

const STATUS: Record<string, { bg: string; text: string; dot: string; border: string }> = {
  "Pending Verification": { bg: "bg-orange-500/20", text: "text-orange-300", dot: "bg-orange-400", border: "border-orange-500/30" },
  Confirmed:    { bg: "bg-emerald-500/20", text: "text-emerald-400", dot: "bg-emerald-500", border: "border-emerald-500/30" },
  Pending:      { bg: "bg-yellow-500/20",  text: "text-yellow-400",  dot: "bg-yellow-400",  border: "border-yellow-500/30"  },
  "In Progress":{ bg: "bg-blue-500/20",    text: "text-blue-400",    dot: "bg-blue-500",    border: "border-blue-500/30"    },
  Completed:    { bg: "bg-white/10",       text: "text-white/50",    dot: "bg-white/30",    border: "border-white/10"       },
  Cancelled:    { bg: "bg-red-500/20",     text: "text-red-400",     dot: "bg-red-500",     border: "border-red-500/30"     },
  Rejected:     { bg: "bg-red-500/20",     text: "text-red-400",     dot: "bg-red-500",     border: "border-red-500/30"     },
};

const ALL_STATUSES: AppointmentStatus[] = [
  "Pending Verification","Confirmed","Pending","In Progress","Completed","Cancelled","Rejected",
];

const inputCls = "w-full px-4 h-10 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/25 focus:outline-none focus:border-[#E41E6A] focus:ring-1 focus:ring-[#E41E6A]/30 transition-colors text-sm";
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function fmtDate(s: string) {
  return new Date(s + "T00:00:00").toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" });
}
function svcIcon(service: string) {
  const s = (service ?? "").toLowerCase();
  if (s.includes("coating")) return <Shield   className="w-4 h-4 text-[#E41E6A]"  />;
  if (s.includes("ppf"))     return <Layers   className="w-4 h-4 text-violet-400" />;
  if (s.includes("tint"))    return <Sparkles className="w-4 h-4 text-sky-400"    />;
  return                            <Car      className="w-4 h-4 text-white/50"    />;
}

// Handles both raw API fields AND pre-normalized service fields
function norm(a: any): Appt {
  let date = a.date ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const d = new Date(a.scheduled_date || a.date || new Date());
    date = `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,"0")}-${String(d.getUTCDate()).padStart(2,"0")}`;
  }
  const vehicle =
    a.vehicle ??
    (a.vehicle_make ? [a.vehicle_make, a.vehicle_model, a.vehicle_class].filter(Boolean).join(" ") : "—");

  return {
    id:               a.id,
    customerId:       a.customerId       ?? a.customer_id,
    customer:         a.customerName     ?? a.fullName ?? a.full_name ?? a.customer?.name ?? "—",
    contact:          a.mobileNumber     ?? a.mobile_number ?? a.customer?.contact ?? "—",
    vehicle,
    service:          a.service          ?? a.service_type ?? "—",
    date,
    time:             a.time             ?? a.appointment_time ?? "—",
    deposit:          Number(a.deposit   ?? a.total_cost ?? 0),
    totalAmount:      Number(a.totalAmount ?? a.total_amount ?? a.total_cost ?? 0),
    remainingBalance: Number(a.remainingBalance ?? a.remaining_balance ?? 0),
    notes:            a.notes            ?? "",
    status:           (a.status          ?? "Pending") as AppointmentStatus,
    fullName:         a.fullName         ?? a.full_name,
    mobileNumber:     a.mobileNumber     ?? a.mobile_number,
    vehicleMake:      a.vehicleMake      ?? a.vehicle_make,
    vehicleModel:     a.vehicleModel     ?? a.vehicle_model,
    vehicleYear:      a.vehicleYear      ?? a.vehicle_year,
    vehicleClass:     a.vehicleClass     ?? a.vehicle_class,
    vehiclePlateNumber: a.vehiclePlateNumber ?? a.vehicle_plate_number,
    paymentMethod:    a.paymentMethod    ?? a.payment_method,
    paymentType:      a.paymentType      ?? a.payment_type,
    proofOfPayment:   a.proofOfPayment   ?? a.proof_of_payment,
    adminRemarks:     a.adminRemarks     ?? a.admin_remarks,
    addons:           a.addons           ?? [],
  };
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS[status] ?? STATUS["Pending"];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${s.bg} ${s.text} ${s.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />{status}
    </span>
  );
}

// ─── CALENDAR ─────────────────────────────────────────────────────────────────

function CalendarCard({ selected, onSelect, dots }: {
  selected: string; onSelect: (d: string) => void; dots: Record<string, string[]>;
}) {
  const today = todayStr();
  const [viewYear,  setVY] = useState(new Date(selected + "T00:00:00").getFullYear());
  const [viewMonth, setVM] = useState(new Date(selected + "T00:00:00").getMonth());

  const firstDay    = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i+1)];
  while (cells.length % 7 !== 0) cells.push(null);

  const prev = () => viewMonth === 0  ? (setVM(11), setVY(y => y-1)) : setVM(m => m-1);
  const next = () => viewMonth === 11 ? (setVM(0),  setVY(y => y+1)) : setVM(m => m+1);
  const key  = (d: number) => `${viewYear}-${String(viewMonth+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
  const dotColor = (ss: string[]) => {
    if (ss.includes("In Progress"))          return "bg-blue-500";
    if (ss.includes("Confirmed"))            return "bg-emerald-500";
    if (ss.includes("Pending Verification")) return "bg-orange-400";
    if (ss.includes("Pending"))              return "bg-yellow-400";
    if (ss.includes("Rejected"))             return "bg-red-500";
    return "bg-white/30";
  };

  return (
    <div className="bg-gradient-to-br from-white/5 to-white/10 border border-white/10 rounded-xl p-5">
      <p className="text-sm font-bold text-white mb-0.5">Calendar</p>
      <p className="text-xs text-white/50 mb-4">Filter by date</p>
      <div className="flex items-center justify-between mb-4">
        <button onClick={prev} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"><ChevronLeft className="w-4 h-4 text-white/60" /></button>
        <span className="text-sm font-semibold text-white">{MONTHS[viewMonth]} {viewYear}</span>
        <button onClick={next} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"><ChevronRight className="w-4 h-4 text-white/60" /></button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map(d => <div key={d} className="text-center text-[10px] font-semibold text-white/30 py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />;
          const k = key(day);
          const isSel   = k === selected;
          const isToday = k === today;
          const d       = dots[k];
          return (
            <button key={k} onClick={() => onSelect(k)}
              className={`relative flex flex-col items-center justify-center w-8 h-8 mx-auto rounded-full text-xs font-medium transition-all
                ${isSel   ? "bg-[#E41E6A] text-white shadow-lg shadow-[#E41E6A]/30" : ""}
                ${isToday && !isSel ? "border border-[#E41E6A] text-[#E41E6A]" : ""}
                ${!isSel && !isToday ? "text-white/60 hover:bg-white/10" : ""}`}
            >
              {day}
              {d && <span className={`absolute bottom-0.5 w-1.5 h-1.5 rounded-full ${isSel ? "bg-white" : dotColor(d)}`} />}
            </button>
          );
        })}
      </div>
      <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 gap-1.5">
        {[
          { dot: "bg-orange-400", label: "Pending Verification" },
          { dot: "bg-emerald-500",label: "Confirmed"            },
          { dot: "bg-blue-500",   label: "In Progress"          },
          { dot: "bg-yellow-400", label: "Pending"              },
          { dot: "bg-red-500",    label: "Rejected"             },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${l.dot}`} />
            <span className="text-[10px] text-white/50">{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── APPOINTMENTS PANEL ────────────────────────────────────────────────────────

function DayPanel({ selected, appts, onView }: {
  selected: string; appts: Appt[]; onView: (a: Appt) => void;
}) {
  return (
    <div className="bg-gradient-to-br from-white/5 to-white/10 border border-white/10 rounded-xl p-5 flex flex-col min-h-[420px]">
      <div className="mb-4">
        <h2 className="text-sm font-bold text-white">
          Appointments for <span className="text-[#E41E6A]">{fmtDate(selected)}</span>
        </h2>
        <p className="text-xs text-white/50 mt-0.5">{appts.length} appointment{appts.length !== 1 ? "s" : ""}</p>
      </div>
      {appts.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-10 text-center">
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
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">{svcIcon(a.service)}</div>
                  <div>
                    <p className="text-sm font-semibold text-white">{a.service}</p>
                    <p className="text-xs text-white/50">{a.customer} · {a.vehicle}</p>
                  </div>
                </div>
                <StatusBadge status={a.status} />
              </div>
              <div className="flex flex-wrap gap-3 pt-2 border-t border-white/10">
                <span className="flex items-center gap-1 text-xs text-white/50"><Clock className="w-3.5 h-3.5 text-[#E41E6A]" />{a.time}</span>
                <span className="flex items-center gap-1 text-xs text-white/50"><Banknote className="w-3.5 h-3.5 text-emerald-400" />₱{a.deposit.toLocaleString()}</span>
                <button onClick={() => onView(a)} className="ml-auto flex items-center gap-1 text-xs font-medium text-[#E41E6A] hover:text-pink-400 transition-colors">
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

// ─── TABLE ─────────────────────────────────────────────────────────────────────

function ApptTable({ appts, onView, onCancel }: {
  appts: Appt[]; onView: (a: Appt) => void; onCancel: (id: string | number) => void;
}) {
  return (
    <div className="bg-gradient-to-br from-white/5 to-white/10 border border-white/10 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-white/10 flex justify-between items-center">
        <h2 className="text-sm font-bold text-white">All Appointments</h2>
        <span className="text-xs text-white/40">{appts.length} records</span>
      </div>
      {/* Mobile */}
      <div className="sm:hidden divide-y divide-white/5">
        {appts.length === 0 ? (
          <div className="py-12 flex flex-col items-center"><CalendarX className="w-8 h-8 text-white/20 mb-2" /><p className="text-white/50 text-sm">No appointments found.</p></div>
        ) : appts.map(a => (
          <div key={a.id} className="p-4 hover:bg-white/5 transition-colors space-y-1.5">
            <div className="flex items-start justify-between"><p className="text-sm font-semibold text-white max-w-[65%]">{a.service}</p><StatusBadge status={a.status} /></div>
            <p className="text-xs text-white/50 flex items-center gap-1"><User className="w-3 h-3" />{a.customer}</p>
            <p className="text-xs text-white/50 flex items-center gap-1"><Car className="w-3 h-3" />{a.vehicle}</p>
            <p className="text-xs text-white/50 flex items-center gap-1"><Calendar className="w-3 h-3 text-[#E41E6A]" />{fmtDate(a.date)} · {a.time}</p>
            <div className="flex gap-3 pt-1">
              <button onClick={() => onView(a)} className="flex items-center gap-1 text-xs font-medium text-[#E41E6A] hover:text-pink-400"><Eye className="w-3.5 h-3.5" />View</button>
              {!["Completed","Cancelled","Rejected"].includes(a.status) && (
                <button onClick={() => onCancel(a.id)} className="flex items-center gap-1 text-xs font-medium text-red-400 hover:text-red-300"><XCircle className="w-3.5 h-3.5" />Cancel</button>
              )}
            </div>
          </div>
        ))}
      </div>
      {/* Desktop */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              {["Date","Customer","Service","Vehicle","Payment","Status","Actions"].map(h => (
                <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-white/50 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {appts.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-10 text-white/40">No appointments found.</td></tr>
            ) : appts.map(a => (
              <tr key={a.id} className="hover:bg-white/5 transition-colors">
                <td className="px-5 py-3.5 whitespace-nowrap">
                  <span className="block text-xs font-medium text-white">{fmtDate(a.date)}</span>
                  <span className="text-xs text-white/40">{a.time}</span>
                </td>
                <td className="px-5 py-3.5">
                  <span className="block text-sm font-medium text-white">{a.customer}</span>
                  <span className="text-xs text-white/50 flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3" />{a.contact}</span>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center">{svcIcon(a.service)}</div>
                    <span className="text-sm text-white max-w-[160px] truncate">{a.service}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-sm text-white/60 whitespace-nowrap">{a.vehicle}</td>
                <td className="px-5 py-3.5 whitespace-nowrap">
                  <span className="block text-sm font-semibold text-emerald-400">₱{a.deposit.toLocaleString()}</span>
                  {a.remainingBalance > 0 && <span className="text-xs text-yellow-400">+₱{a.remainingBalance.toLocaleString()} due</span>}
                </td>
                <td className="px-5 py-3.5"><StatusBadge status={a.status} /></td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <button onClick={() => onView(a)} className="flex items-center gap-1 text-xs font-medium text-[#E41E6A] hover:text-pink-400 transition-colors"><Eye className="w-3.5 h-3.5" />View</button>
                    {!["Completed","Cancelled","Rejected"].includes(a.status) && (
                      <button onClick={() => onCancel(a.id)} className="flex items-center gap-1 text-xs font-medium text-red-400 hover:text-red-300 transition-colors"><XCircle className="w-3.5 h-3.5" />Cancel</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── DETAIL MODAL ─────────────────────────────────────────────────────────────

function DetailModal({ appt, onClose, onStatusChange, onApprove, onReject }: {
  appt: Appt;
  onClose: () => void;
  onStatusChange: (id: string | number, s: AppointmentStatus) => void;
  onApprove: (id: string | number, r: string) => Promise<void>;
  onReject:  (id: string | number, r: string) => Promise<void>;
}) {
  const [status,   setStatus]   = useState<AppointmentStatus>(appt.status);
  const [remarks,  setRemarks]  = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const isPending = appt.status === "Pending Verification";
  const proofUrl  = appt.proofOfPayment ? `${API}/${appt.proofOfPayment}` : null;

  const approve = async () => { setIsSaving(true); try { await onApprove(appt.id, remarks); onClose(); } finally { setIsSaving(false); } };
  const reject  = async () => {
    if (!remarks.trim()) { alert("Please provide a rejection reason."); return; }
    setIsSaving(true); try { await onReject(appt.id, remarks); onClose(); } finally { setIsSaving(false); }
  };

  const Row = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
    <div className="flex items-start gap-3 py-3 border-b border-white/10 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 mt-0.5 border border-white/5">{icon}</div>
      <div><p className="text-xs text-white/50">{label}</p><p className="text-sm text-white font-semibold mt-0.5">{value}</p></div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm" style={{ backgroundColor: "rgba(0,0,0,0.85)" }}>
      <div className="bg-[#0a0a0a] border border-white/10 rounded-xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white">Appointment Details</h2>
            <p className="text-xs text-white/40 mt-0.5">#{String(appt.id).slice(0,8)} · {fmtDate(appt.date)}</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={appt.status} />
            <button onClick={onClose} className="text-white/50 hover:text-white transition-colors ml-1"><X className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto space-y-5">
          {/* Customer */}
          <div>
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Customer & Vehicle</p>
            <div className="bg-white/5 rounded-xl border border-white/10 divide-y divide-white/10">
              <Row icon={<User     className="w-4 h-4 text-white/50"  />} label="Full Name"     value={appt.fullName ?? appt.customer} />
              <Row icon={<Phone    className="w-4 h-4 text-white/50"  />} label="Mobile"        value={appt.mobileNumber ?? appt.contact ?? "—"} />
              <Row icon={<Car      className="w-4 h-4 text-white/50"  />} label="Vehicle"       value={appt.vehicle} />
              {appt.vehiclePlateNumber && <Row icon={<FileText className="w-4 h-4 text-white/50" />} label="Plate No." value={appt.vehiclePlateNumber} />}
            </div>
          </div>

          {/* Service */}
          <div>
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Service & Schedule</p>
            <div className="bg-white/5 rounded-xl border border-white/10 divide-y divide-white/10">
              <Row icon={<Shield className="w-4 h-4 text-[#E41E6A]" />} label="Service"  value={appt.service} />
              <Row icon={<Clock  className="w-4 h-4 text-[#E41E6A]" />} label="Schedule" value={`${fmtDate(appt.date)} at ${appt.time}`} />
              {appt.notes && <Row icon={<FileText className="w-4 h-4 text-white/50" />} label="Notes" value={appt.notes} />}
            </div>
          </div>

          {/* Payment */}
          <div>
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Payment</p>
            <div className="bg-white/5 rounded-xl border border-white/10 divide-y divide-white/10">
              {appt.paymentMethod && <Row icon={<CreditCard className="w-4 h-4 text-violet-400" />} label="Method" value={appt.paymentMethod} />}
              {appt.paymentType   && <Row icon={<Wallet     className="w-4 h-4 text-violet-400" />} label="Type"   value={appt.paymentType}   />}
              <Row icon={<Banknote className="w-4 h-4 text-emerald-400" />} label="Total Amount"   value={`₱${appt.totalAmount.toLocaleString()}`} />
              <Row icon={<Banknote className="w-4 h-4 text-emerald-400" />} label="Deposit Paid"   value={`₱${appt.deposit.toLocaleString()}`} />
              {appt.remainingBalance > 0 && <Row icon={<Banknote className="w-4 h-4 text-yellow-400" />} label="Remaining" value={`₱${appt.remainingBalance.toLocaleString()}`} />}
            </div>
          </div>

          {/* Proof */}
          {proofUrl && (
            <div>
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Proof of Payment</p>
              <div className="bg-white/5 rounded-xl border border-white/10 p-3">
                {proofUrl.endsWith(".pdf") ? (
                  <a href={proofUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-[#E41E6A] hover:text-pink-400">
                    <FileText className="w-4 h-4" />View PDF Receipt
                  </a>
                ) : (
                  <div className="space-y-2">
                    <img src={proofUrl} alt="Proof of payment" className="w-full max-h-52 object-contain rounded-lg border border-white/10 bg-black/20"
                      onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    <a href={proofUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-[#E41E6A] hover:text-pink-400">
                      <ImageIcon className="w-3.5 h-3.5" />Open full image
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Admin remarks */}
          {appt.adminRemarks && (
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <p className="text-xs text-white/50 mb-1">Admin Remarks</p>
              <p className="text-sm text-white">{appt.adminRemarks}</p>
            </div>
          )}

          {/* Approve / Reject */}
          {isPending && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
                <p className="text-xs text-orange-300 font-semibold">⚠ Awaiting Payment Verification</p>
                <p className="text-xs text-orange-200/70 mt-1">Review the proof above then approve or reject.</p>
              </div>
              <div>
                <label className="text-xs font-medium text-white/60 block mb-1.5">
                  Remarks <span className="text-red-400">(required for rejection)</span>
                </label>
                <textarea
                  className={`${inputCls} resize-none h-20 py-2.5`}
                  placeholder="e.g. BDO Ref# 20250701 confirmed  —or—  Screenshot unclear, please resubmit."
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={reject} disabled={isSaving}
                  className="flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 rounded-lg transition-colors disabled:opacity-50">
                  <AlertCircle className="w-4 h-4" />{isSaving ? "..." : "Reject"}
                </button>
                <button onClick={approve} disabled={isSaving}
                  className="flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 rounded-lg shadow-md disabled:opacity-50">
                  <CheckCircle className="w-4 h-4" />{isSaving ? "..." : "Approve"}
                </button>
              </div>
            </div>
          )}

          {/* Status update (non-pending) */}
          {!isPending && (
            <div>
              <p className="text-xs text-white/50 font-medium mb-2">Update Status</p>
              <div className="relative">
                <select className={`${inputCls} appearance-none pr-8`} value={status} onChange={e => setStatus(e.target.value as AppointmentStatus)}>
                  {ALL_STATUSES.map(s => <option key={s} value={s} className="bg-[#0a0a0a]">{s}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-white/5 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium border border-white/10 text-white hover:bg-white/10 rounded-lg transition-colors">Close</button>
          {!isPending && (
            <button onClick={() => { onStatusChange(appt.id, status); onClose(); }}
              className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#E41E6A] to-pink-600 hover:from-[#c41559] rounded-lg shadow-md">
              Update Status
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

export function FrontDeskAppointments() {
  const today = todayStr();
  const [appointments, setAppointments] = useState<Appt[]>([]);
  const [isLoading,    setIsLoading]    = useState(true);
  const [selected,     setSelected]     = useState(today);
  const [search,       setSearch]       = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [detailAppt,   setDetailAppt]   = useState<Appt | null>(null);

  const todayDisplay = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  useEffect(() => { load(); }, []);

  const load = async () => {
    setIsLoading(true);
    try {
      const data = await getAppointments().catch(() => []);
      setAppointments(data.map(norm));
    } catch (err) { console.error("FrontdeskAppointments fetch error:", err); }
    finally { setIsLoading(false); }
  };

  const handleCancel = async (id: string | number) => {
    try {
      await updateAppointmentStatus(String(id), "Cancelled");
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: "Cancelled" as AppointmentStatus } : a));
    } catch (err) { console.error(err); }
  };

  const handleStatusChange = async (id: string | number, status: AppointmentStatus) => {
    try {
      await updateAppointmentStatus(String(id), status);
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    } catch (err) { console.error(err); }
  };

  const handleApprove = async (id: string | number, remarks: string) => {
    await approveAppointment(String(id), remarks);
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: "Confirmed" as AppointmentStatus, adminRemarks: remarks } : a));
  };

  const handleReject = async (id: string | number, remarks: string) => {
    await rejectAppointment(String(id), remarks);
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: "Rejected" as AppointmentStatus, adminRemarks: remarks } : a));
  };

  const pendingCount = useMemo(() => appointments.filter(a => a.status === "Pending Verification").length, [appointments]);

  const dots = useMemo(() => {
    const map: Record<string, string[]> = {};
    appointments.forEach(a => { if (!map[a.date]) map[a.date] = []; map[a.date].push(a.status); });
    return map;
  }, [appointments]);

  const forDay = useMemo(() => appointments.filter(a => a.date === selected), [appointments, selected]);

  const filtered = useMemo(() =>
    appointments
      .filter(a => filterStatus === "All" || a.status === filterStatus)
      .filter(a => [a.customer, a.service, a.vehicle, a.status, a.contact]
        .some(v => v?.toLowerCase().includes(search.toLowerCase())))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [appointments, search, filterStatus]
  );

  const FILTERS = ["All", "Pending Verification", "Confirmed", "Pending", "In Progress", "Completed", "Cancelled", "Rejected"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-white text-3xl font-bold mb-1">Manage Appointments</h1>
          <p className="text-white/60 text-sm">{todayDisplay}</p>
        </div>
        <div className="flex items-center gap-3">
          {pendingCount > 0 && (
            <button onClick={() => setFilterStatus("Pending Verification")}
              className="inline-flex items-center gap-2 bg-orange-500/20 border border-orange-500/30 text-orange-300 text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-orange-500/30 transition-all animate-pulse">
              <AlertCircle className="w-4 h-4" />{pendingCount} Pending Verification
            </button>
          )}
          <button onClick={load} className="w-9 h-9 flex items-center justify-center bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors" title="Refresh">
            <RefreshCw className="w-4 h-4 text-white/50" />
          </button>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
          <input type="text" placeholder="Search customer, service, vehicle..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#E41E6A] focus:ring-1 focus:ring-[#E41E6A]/30 transition-colors" />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <SlidersHorizontal className="w-4 h-4 text-white/40 flex-shrink-0" />
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilterStatus(f)}
              className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                filterStatus === f
                  ? f === "Pending Verification" ? "bg-orange-500 text-white border-orange-500" : "bg-[#E41E6A] text-white border-[#E41E6A]"
                  : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white"
              }`}>
              {f}{f === "Pending Verification" && pendingCount > 0 ? ` (${pendingCount})` : ""}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="bg-gradient-to-br from-white/5 to-white/10 border border-white/10 rounded-xl flex items-center justify-center h-40 text-white/50">
          Loading appointments...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4">
            <CalendarCard selected={selected} onSelect={setSelected} dots={dots} />
            <DayPanel selected={selected} appts={forDay} onView={setDetailAppt} />
          </div>
          <ApptTable appts={filtered} onView={setDetailAppt} onCancel={handleCancel} />
        </>
      )}

      {detailAppt && (
        <DetailModal appt={detailAppt} onClose={() => setDetailAppt(null)}
          onStatusChange={handleStatusChange} onApprove={handleApprove} onReject={handleReject} />
      )}
    </div>
  );
}

export default FrontDeskAppointments;