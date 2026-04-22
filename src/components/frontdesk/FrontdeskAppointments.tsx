import { getCustomers } from "../../services/customer";
import {
  getAppointments, createAppointment,
  updateAppointmentStatus, getPendingVerificationAppointments,
  approveAppointment, rejectAppointment,
} from "../../services/appointments";
import { useState, useEffect, useMemo } from "react";
import {
  ChevronLeft, ChevronRight, Search, SlidersHorizontal, Plus,
  Calendar, Car, Clock, Banknote, Shield, Layers, Sparkles,
  Eye, XCircle, ChevronDown, X, User, Phone, FileText,
  CalendarX, CheckCircle2, XOctagon, AlertTriangle, Bell,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type AppointmentStatus =
  | "Pending Verification"
  | "Confirmed"
  | "Pending"
  | "In Progress"
  | "Completed"
  | "Cancelled"
  | "Rejected";

interface Appointment {
  id:               number | string;
  customerId?:      string;
  customer:         string;
  contact:          string;
  vehicle:          string;
  service:          string;
  date:             string;
  time:             string;
  deposit:          number;
  notes:            string;
  status:           AppointmentStatus;
  fullName?:        string;
  mobileNumber?:    string;
  paymentMethod?:   string;
  paymentType?:     string;
  totalAmount?:     number;
  remainingBalance?:number;
  proofUrl?:        string;
  rejectionReason?: string;
  addons?:          string;
  vehicleMake?:     string;
  vehicleModel?:    string;
  vehicleYear?:     string;
  vehicleClass?:    string;
  vehiclePlate?:    string;
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

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

const ALL_STATUSES: AppointmentStatus[] = [
  "Confirmed","Pending","In Progress","Completed","Cancelled",
];

const STATUS_STYLE: Record<string, { bg: string; text: string; dot: string; border: string }> = {
  "Pending Verification": { bg: "bg-orange-500/20", text: "text-orange-300", dot: "bg-orange-400", border: "border-orange-500/30" },
  Confirmed:     { bg: "bg-green-500/20",  text: "text-green-400",  dot: "bg-green-500",  border: "border-green-500/30"  },
  Pending:       { bg: "bg-yellow-500/20", text: "text-yellow-400", dot: "bg-yellow-400", border: "border-yellow-500/30" },
  "In Progress": { bg: "bg-blue-500/20",   text: "text-blue-400",   dot: "bg-blue-500",   border: "border-blue-500/30"   },
  Completed:     { bg: "bg-white/10",      text: "text-white/50",   dot: "bg-white/30",   border: "border-white/10"      },
  Cancelled:     { bg: "bg-red-500/20",    text: "text-red-400",    dot: "bg-red-500",    border: "border-red-500/30"    },
  Rejected:      { bg: "bg-red-500/20",    text: "text-red-400",    dot: "bg-red-500",    border: "border-red-500/30"    },
};

const inputCls = "w-full px-4 h-10 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/25 focus:outline-none focus:border-[#E41E6A] focus:ring-1 focus:ring-[#E41E6A]/30 transition-colors text-sm";
const cardCls  = "bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur rounded-xl border";
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_NAMES   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function formatShort(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function serviceIcon(service: string) {
  const s = service.toLowerCase();
  if (s.includes("coating")) return <Shield   className="w-4 h-4 text-[#E41E6A]"  />;
  if (s.includes("ppf"))     return <Layers   className="w-4 h-4 text-violet-400" />;
  if (s.includes("tint"))    return <Sparkles className="w-4 h-4 text-sky-400"    />;
  return                            <Car      className="w-4 h-4 text-white/50"    />;
}

function mapRawAppointment(a: any): Appointment {
  const raw = a.scheduled_date || a.date || "";
  const d   = raw ? new Date(raw) : new Date();
  const dateStr = `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,"0")}-${String(d.getUTCDate()).padStart(2,"0")}`;
  return {
    id:               a.id,
    customerId:       a.customer_id ?? a.customerId,
    customer:         a.customer?.name ?? a.customerName ?? a.full_name ?? "Unknown",
    contact:          a.customer?.contact ?? a.mobile_number ?? a.contact ?? "",
    vehicle:          a.customer?.vehicle || [a.vehicle_make, a.vehicle_model, a.vehicle_class].filter(Boolean).join(" ").trim() || a.vehicle || "N/A",
    service:          a.service_type ?? a.service ?? "Service",
    date:             dateStr,
    time:             d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    deposit:          Number(a.deposit ?? a.total_cost ?? 0),
    notes:            a.notes ?? "",
    status:           (a.status ?? "Pending") as AppointmentStatus,
    fullName:         a.full_name,
    mobileNumber:     a.mobile_number,
    paymentMethod:    a.payment_method,
    paymentType:      a.payment_type,
    totalAmount:      Number(a.total_cost ?? 0),
    remainingBalance: Number(a.remaining_balance ?? 0),
    proofUrl:         a.proof_url,
    rejectionReason:  a.rejection_reason,
    addons:           a.addons,
    vehicleMake:      a.vehicle_make,
    vehicleModel:     a.vehicle_model,
    vehicleYear:      a.vehicle_year,
    vehicleClass:     a.vehicle_class,
    vehiclePlate:     a.vehicle_plate,
  };
}

// ─── STATUS BADGE ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE["Pending"];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${s.bg} ${s.text} ${s.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />{status}
    </span>
  );
}

// ─── INFO ROW ─────────────────────────────────────────────────────────────────

function InfoRow({ icon, label, value, highlight }: {
  icon:       React.ReactNode;
  label:      string;
  value:      string;
  highlight?: "green" | "yellow";
}) {
  const valueColor =
    highlight === "green"  ? "text-emerald-400 font-semibold" :
    highlight === "yellow" ? "text-yellow-400 font-semibold"  :
    "text-white font-medium";

  return (
    <div className="bg-white/5 rounded-lg p-3 border border-white/5">
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <p className="text-white/40 text-[10px] uppercase tracking-wide">{label}</p>
      </div>
      <p className={`text-sm ${valueColor} truncate`}>{value}</p>
    </div>
  );
}

// ─── PENDING REQUESTS PANEL ───────────────────────────────────────────────────

function PendingRequestsPanel({ requests, onApprove, onReject, processingAction }: {
  requests:     Appointment[];
  onApprove:    (id: string | number) => void;
  onReject:     (id: string | number) => void;
  processingAction: { id: string | number, type: 'approve' | 'reject' } | null;
}) {
  if (requests.length === 0) {
    return (
      <div className={`${cardCls} p-10 flex flex-col items-center text-center`}>
        <div className="w-14 h-14 bg-green-500/10 rounded-2xl flex items-center justify-center mb-4">
          <CheckCircle2 className="w-7 h-7 text-green-400" />
        </div>
        <p className="text-white font-semibold text-sm">All caught up!</p>
        <p className="text-white/40 text-xs mt-1">No pending appointment requests.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map(a => (
        <div key={a.id} className="bg-orange-500/5 border border-orange-500/20 rounded-xl overflow-hidden hover:border-orange-500/40 transition-all">

          {/* Header */}
          <div className="px-5 py-4 border-b border-orange-500/10 flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center flex-shrink-0">
                {serviceIcon(a.service)}
              </div>
              <div>
                <p className="text-white text-sm font-bold">{a.service}</p>
                <p className="text-white/50 text-xs mt-0.5">Submitted {formatShort(a.date)}</p>
              </div>
            </div>
            <StatusBadge status={a.status} />
          </div>

          {/* Body */}
          <div className="p-5 space-y-4">

            {/* Customer Info */}
            <div>
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Customer Information</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <InfoRow icon={<User  className="w-3.5 h-3.5 text-[#E41E6A]" />} label="Full Name"     value={a.fullName || a.customer || "—"} />
                <InfoRow icon={<Phone className="w-3.5 h-3.5 text-[#E41E6A]" />} label="Mobile Number" value={a.mobileNumber || a.contact || "—"} />
              </div>
            </div>

            {/* Vehicle Info */}
            <div>
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Vehicle Information</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <InfoRow icon={<Car className="w-3.5 h-3.5 text-sky-400" />} label="Vehicle"      value={a.vehicle || "—"} />
                <InfoRow icon={<Car className="w-3.5 h-3.5 text-sky-400" />} label="Make"         value={a.vehicleMake || "—"} />
                <InfoRow icon={<Car className="w-3.5 h-3.5 text-sky-400" />} label="Model"        value={a.vehicleModel || "—"} />
              </div>
            </div>

            {/* Appointment Details */}
            <div>
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Appointment Details</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <InfoRow icon={<Calendar className="w-3.5 h-3.5 text-violet-400" />} label="Date"    value={formatShort(a.date)} />
                <InfoRow icon={<Clock    className="w-3.5 h-3.5 text-violet-400" />} label="Time"    value={a.time} />
                <InfoRow icon={<Shield   className="w-3.5 h-3.5 text-[#E41E6A]"  />} label="Service" value={a.service} />
                {a.addons && a.addons !== "[]" && (
                  <InfoRow
                    icon={<Sparkles className="w-3.5 h-3.5 text-amber-400" />}
                    label="Add-ons"
                    value={(() => {
                      try {
                        const p = JSON.parse(a.addons!);
                        return Array.isArray(p) && p.length > 0 ? p.join(", ") : "None";
                      } catch {
                        return a.addons!;
                      }
                    })()}
                  />
                )}
              </div>
            </div>

            {/* Payment Info */}
            <div>
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Payment Information</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <InfoRow icon={<Banknote className="w-3.5 h-3.5 text-emerald-400" />} label="Payment Method" value={a.paymentMethod || "—"} />
                <InfoRow icon={<Banknote className="w-3.5 h-3.5 text-emerald-400" />} label="Payment Type"   value={a.paymentType || "—"} />
                <InfoRow icon={<Banknote className="w-3.5 h-3.5 text-emerald-400" />} label="Amount Paid"    value={`₱${Number(a.deposit).toLocaleString()}`} highlight="green" />
                {!!a.remainingBalance && (
                  <InfoRow icon={<AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />} label="Remaining Balance" value={`₱${Number(a.remainingBalance).toLocaleString()}`} highlight="yellow" />
                )}
                {!!a.totalAmount && (
                  <InfoRow icon={<Banknote className="w-3.5 h-3.5 text-white/40" />} label="Total Amount" value={`₱${Number(a.totalAmount).toLocaleString()}`} />
                )}
              </div>
            </div>

            {/* Proof of Payment */}
            {a.proofUrl && (
              <div>
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Proof of Payment</p>
                <a
                  href={`${import.meta.env.VITE_API_BASE_URL}${a.proofUrl}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-sky-400 hover:text-sky-300 border border-sky-500/20 bg-sky-500/10 hover:bg-sky-500/20 px-4 py-2 rounded-lg transition-colors"
                >
                  <FileText className="w-4 h-4" />View Proof of Payment
                </a>
              </div>
            )}

            {/* Notes */}
            {a.notes && (
              <div>
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Customer Notes</p>
                <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                  <p className="text-white/70 text-sm italic">"{a.notes}"</p>
                </div>
              </div>
            )}

          </div>{/* ← closes <div className="p-5 space-y-4"> */}

          {/* Action Buttons */}
          <div className="px-5 pb-5 flex items-center gap-3">
            <button
              onClick={() => onApprove(a.id)}
              disabled={processingAction?.id === a.id}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 rounded-xl shadow-md shadow-emerald-500/20 transition-all disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              {processingAction?.id === a.id && processingAction.type === 'approve' ? "Processing..." : "Approve Booking"}
            </button>
            <button
              onClick={() => onReject(a.id)}
              disabled={processingAction?.id === a.id}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-red-700 to-red-600 hover:from-red-800 rounded-xl shadow-md shadow-red-500/20 transition-all disabled:opacity-50"
            >
              <XOctagon className="w-4 h-4" />
              {processingAction?.id === a.id && processingAction.type === 'reject' ? "Processing..." : "Reject Booking"}
            </button>
          </div>{/* ← closes Action Buttons */}

        </div>/* ← closes card div */
      ))}
    </div>
  );
}

// ─── REJECT REASON MODAL ──────────────────────────────────────────────────────

function RejectReasonModal({ onClose, onConfirm }: {
  onClose:   () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm" style={{ backgroundColor: "rgba(0,0,0,0.8)" }}>
      <div className="bg-[#0a0a0a] border border-white/10 rounded-xl w-full max-w-md shadow-2xl flex flex-col">
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white">Reject Appointment</h2>
            <p className="text-xs text-white/50 mt-0.5">Provide a reason for rejection</p>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg mb-4 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-400 text-xs">This action cannot be undone. The customer will see the rejection reason.</p>
          </div>
          <label className="text-sm font-medium text-white/70 block mb-1.5">
            Rejection Reason <span className="text-white/30">(optional)</span>
          </label>
          <textarea
            className={inputCls + " resize-none h-24 py-2.5"}
            placeholder="e.g. Selected time slot is unavailable, please rebook..."
            value={reason}
            onChange={e => setReason(e.target.value)}
          />
        </div>
        <div className="px-6 py-4 border-t border-white/10 bg-white/5 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium border border-white/10 text-white hover:bg-white/10 rounded-lg transition-colors">
            Cancel
          </button>
          <button
            onClick={() => { onConfirm(reason); onClose(); }}
            className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center gap-2"
          >
            <XOctagon className="w-4 h-4" />Confirm Rejection
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── CALENDAR ─────────────────────────────────────────────────────────────────

function CalendarCard({ selected, onSelect, dotDates }: {
  selected:  string;
  onSelect:  (d: string) => void;
  dotDates:  Record<string, string[]>;
}) {
  const today   = todayStr();
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
  const next = () => viewMonth === 11 ? (setViewMonth(0), setViewYear(y => y + 1)) : setViewMonth(m => m + 1);
  const cellKey = (day: number) =>
    `${viewYear}-${String(viewMonth+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;

  const dotColor = (statuses: string[]) => {
    if (statuses.includes("Pending Verification")) return "bg-orange-400";
    if (statuses.includes("In Progress"))          return "bg-blue-500";
    if (statuses.includes("Confirmed"))            return "bg-green-500";
    if (statuses.includes("Pending"))              return "bg-yellow-400";
    return "bg-white/30";
  };

  return (
    <div className={`${cardCls} p-5`}>
      <div className="mb-4">
        <h2 className="text-sm font-bold text-white">Calendar</h2>
        <p className="text-xs text-white/50 mt-0.5">Select a date to filter</p>
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
        {DAY_NAMES.map(d => (
          <div key={d} className="text-center text-[10px] font-semibold text-white/30 py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />;
          const key     = cellKey(day);
          const isSel   = key === selected;
          const isToday = key === today;
          const dots    = dotDates[key];
          return (
            <button key={key} onClick={() => onSelect(key)}
              className={`relative flex flex-col items-center justify-center w-8 h-8 mx-auto rounded-full text-xs font-medium transition-all
                ${isSel ? "bg-[#E41E6A] text-white shadow-md shadow-[#E41E6A]/30" : ""}
                ${isToday && !isSel ? "border border-[#E41E6A] text-[#E41E6A]" : ""}
                ${!isSel && !isToday ? "text-white/60 hover:bg-white/10" : ""}`}
            >
              {day}
              {dots && (
                <span className={`absolute bottom-0.5 w-1.5 h-1.5 rounded-full ${isSel ? "bg-white" : dotColor(dots)}`} />
              )}
            </button>
          );
        })}
      </div>
      <div className="mt-4 pt-4 border-t border-white/10 flex flex-col gap-1.5">
        {[
          { dot: "bg-orange-400", label: "Pending Verification" },
          { dot: "bg-green-500",  label: "Confirmed"            },
          { dot: "bg-blue-500",   label: "In Progress"          },
          { dot: "bg-yellow-400", label: "Pending"              },
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

// ─── APPOINTMENTS PANEL ───────────────────────────────────────────────────────

function AppointmentsPanel({ selected, appts, onViewDetail }: {
  selected:     string;
  appts:        Appointment[];
  onViewDetail: (a: Appointment) => void;
}) {
  return (
    <div className={`${cardCls} p-5 flex flex-col min-h-[420px]`}>
      <div className="mb-4">
        <h2 className="text-sm font-bold text-white">
          Appointments for <span className="text-[#E41E6A]">{formatShort(selected)}</span>
        </h2>
        <p className="text-xs text-white/50 mt-0.5">
          {appts.length} appointment{appts.length !== 1 ? "s" : ""} scheduled
        </p>
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
                <span className="flex items-center gap-1 text-xs text-white/50">
                  <Clock className="w-3.5 h-3.5 text-[#E41E6A]" />{a.time}
                </span>
                <span className="flex items-center gap-1 text-xs text-white/50">
                  <Banknote className="w-3.5 h-3.5 text-green-400" />₱{a.deposit.toLocaleString()}
                </span>
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

// ─── APPOINTMENT TABLE ────────────────────────────────────────────────────────

function AppointmentTable({ appts, onViewDetail, onCancel }: {
  appts:        Appointment[];
  onViewDetail: (a: Appointment) => void;
  onCancel:     (id: number | string) => void;
}) {
  return (
    <div className={`${cardCls} overflow-hidden`}>
      <div className="px-5 py-4 border-b border-white/10 flex justify-between items-center">
        <h2 className="text-sm font-bold text-white">All Appointments</h2>
        <span className="text-xs text-white/40">{appts.length} total records</span>
      </div>
      <div className="sm:hidden divide-y divide-white/5">
        {appts.length === 0 ? (
          <div className="py-12 flex flex-col items-center">
            <CalendarX className="w-8 h-8 text-white/20 mb-2" />
            <p className="text-white/50 text-sm">No appointments found.</p>
          </div>
        ) : appts.map(a => (
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
              {a.status !== "Completed" && a.status !== "Cancelled" && a.status !== "Rejected" && (
                <button onClick={() => onCancel(a.id)} className="flex items-center gap-1 text-xs font-medium text-red-400 hover:text-red-300">
                  <XCircle className="w-3.5 h-3.5" />Cancel
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
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
              <tr>
                <td colSpan={6} className="text-center py-10 text-white/40 text-sm">No appointments found.</td>
              </tr>
            ) : appts.map(a => (
              <tr key={a.id} className="hover:bg-white/5 transition-colors">
                <td className="px-5 py-3.5 whitespace-nowrap">
                  <span className="block text-xs font-medium text-white">{formatShort(a.date)}</span>
                  <span className="text-xs text-white/40">{a.time}</span>
                </td>
                <td className="px-5 py-3.5">
                  <span className="block text-sm font-medium text-white">{a.customer}</span>
                  <span className="text-xs text-white/50 flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3" />{a.contact}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                      {serviceIcon(a.service)}
                    </div>
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
                    {a.status !== "Completed" && a.status !== "Cancelled" && a.status !== "Rejected" && (
                      <button onClick={() => onCancel(a.id)} className="flex items-center gap-1 text-xs font-medium text-red-400 hover:text-red-300 transition-colors">
                        <XCircle className="w-3.5 h-3.5" />Cancel
                      </button>
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

// ─── ADD APPOINTMENT MODAL ────────────────────────────────────────────────────

function AddAppointmentModal({ onClose, onSave, customers }: {
  onClose:   () => void;
  onSave:    (a: Omit<Appointment, "id">) => void;
  customers: any[];
}) {
  const [form, setForm] = useState({
    customerId: "", customer: "", contact: "", vehicle: "",
    service: "", date: todayStr(), time: "9:00 AM",
    deposit: "", notes: "", status: "Confirmed" as AppointmentStatus,
  });
  const [error, setError] = useState("");

  const handleCustomerChange = (id: string) => {
    const found = customers.find(c => c.id === id);
    setForm(f => ({
      ...f, customerId: id,
      customer: found?.name ?? "",
      contact:  found?.contact ?? "",
      vehicle:  found?.vehicle ?? "",
    }));
  };

  const handleSave = () => {
    if (!form.customerId || !form.vehicle || !form.service || !form.date || !form.time) {
      setError("Please select a customer and fill in all required fields."); return;
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
          <button onClick={onClose} className="text-white/50 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 overflow-y-auto space-y-4">
          <div>
            {field("Customer", true)}
            <div className="relative">
              <select className={`${inputCls} appearance-none pr-8`} value={form.customerId} onChange={e => handleCustomerChange(e.target.value)}>
                <option value="" className="bg-[#0a0a0a]">Select a customer...</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id} className="bg-[#0a0a0a]">
                    {c.name}{c.vehicle ? ` · ${c.vehicle}` : ""}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              {field("Contact Number")}
              <input className={inputCls + " opacity-60"} placeholder="Auto-filled" value={form.contact} onChange={e => setForm({...form, contact: e.target.value})} />
            </div>
            <div>
              {field("Vehicle", true)}
              <input className={inputCls} placeholder="Year Make Model" value={form.vehicle} onChange={e => setForm({...form, vehicle: e.target.value})} />
            </div>
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
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium border border-white/10 text-white hover:bg-white/10 rounded-lg transition-colors">Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#E41E6A] to-pink-600 hover:from-[#c41559] rounded-lg shadow-md shadow-[#E41E6A]/25 transition-all">
            Save Appointment
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── DETAIL MODAL ─────────────────────────────────────────────────────────────

function DetailModal({ appt, onClose, onStatusChange }: {
  appt:           Appointment;
  onClose:        () => void;
  onStatusChange: (id: number | string, status: AppointmentStatus) => void;
}) {
  const [status, setStatus] = useState<AppointmentStatus>(appt.status);

  const Row = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
    <div className="flex items-start gap-3 py-3 border-b border-white/10 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 mt-0.5 border border-white/5">{icon}</div>
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
            <p className="text-xs text-white/50 mt-0.5">#{String(appt.id).slice(0,8)} · {formatShort(appt.date)}</p>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white flex-shrink-0"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 overflow-y-auto">
          <Row icon={<User     className="w-4 h-4 text-white/50" />} label="Customer"       value={appt.fullName || appt.customer} />
          <Row icon={<Phone    className="w-4 h-4 text-white/50" />} label="Contact"        value={appt.mobileNumber || appt.contact || "N/A"} />
          <Row icon={<Car      className="w-4 h-4 text-white/50" />} label="Vehicle"        value={appt.vehicle} />
          <Row icon={<Shield   className="w-4 h-4 text-[#E41E6A]"/>} label="Service"        value={appt.service} />
          <Row icon={<Clock    className="w-4 h-4 text-[#E41E6A]"/>} label="Schedule"       value={`${formatShort(appt.date)} · ${appt.time}`} />
          <Row icon={<Banknote className="w-4 h-4 text-green-400"/>} label="Deposit"        value={`₱${appt.deposit.toLocaleString()}`} />
          {appt.paymentMethod && (
            <Row icon={<Banknote className="w-4 h-4 text-sky-400"/>} label="Payment Method" value={`${appt.paymentMethod} · ${appt.paymentType || ""}`} />
          )}
          {!!appt.remainingBalance && (
            <Row icon={<AlertTriangle className="w-4 h-4 text-yellow-400"/>} label="Balance Due" value={`₱${Number(appt.remainingBalance).toLocaleString()}`} />
          )}
          {appt.notes && (
            <Row icon={<FileText className="w-4 h-4 text-white/50" />} label="Notes" value={appt.notes} />
          )}
          {appt.rejectionReason && (
            <div className="mt-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-xs font-medium">Rejection Reason:</p>
              <p className="text-red-300 text-xs mt-1">{appt.rejectionReason}</p>
            </div>
          )}
          {appt.proofUrl && (
            <div className="mt-3">
              <a
                href={`${import.meta.env.VITE_API_BASE_URL}${appt.proofUrl}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-400 hover:text-sky-300 border border-sky-500/20 bg-sky-500/10 px-3 py-1.5 rounded-lg transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />View Proof of Payment
              </a>
            </div>
          )}
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
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium border border-white/10 text-white hover:bg-white/10 rounded-lg transition-colors">Close</button>
          <button
            onClick={() => { onStatusChange(appt.id, status); onClose(); }}
            className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#E41E6A] to-pink-600 hover:from-[#c41559] rounded-lg shadow-md"
          >
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
  const { profile } = useAuth();

  const [appointments,    setAppointments]    = useState<Appointment[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Appointment[]>([]);
  const [customers,       setCustomers]       = useState<any[]>([]);
  const [isLoading,       setIsLoading]       = useState(true);
  const [selected,        setSelected]        = useState(today);
  const [search,          setSearch]          = useState("");
  const [activeTab,       setActiveTab]       = useState<"pending" | "all">("pending");
  const [showAdd,         setShowAdd]         = useState(false);
  const [detailAppt,      setDetailAppt]      = useState<Appointment | null>(null);
  
  // FIXED: State tracks both ID and action type
  const [processingAction, setProcessingAction] = useState<{ id: string | number, type: 'approve' | 'reject' } | null>(null);
  const [rejectTarget,    setRejectTarget]    = useState<string | number | null>(null);

  const todayDisplay = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [cust, allData, pendingData] = await Promise.all([
        getCustomers().catch(() => []),
        getAppointments().catch(() => []),
        getPendingVerificationAppointments().catch(() => []),
      ]);
      setCustomers(cust);
      setAppointments(
        (Array.isArray(allData) ? allData : allData?.data ?? [])
          .map(mapRawAppointment)
          .filter((a: Appointment) => a.status !== "Pending Verification")
      );
      setPendingRequests(
        (Array.isArray(pendingData) ? pendingData : []).map(mapRawAppointment)
      );
    } catch (err) {
      console.error("Failed to fetch appointments:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id: string | number) => {
    // FIXED: Using the new processing action state
    setProcessingAction({ id, type: 'approve' });
    try {
      await approveAppointment(String(id), "Appointment confirmed by front desk");
      setPendingRequests(prev => prev.filter(a => a.id !== id));
      await fetchData();
    } catch (err) {
      console.error("Failed to approve:", err);
      alert("Failed to approve appointment.");
    } finally {
      setProcessingAction(null);
    }
  };

  const handleRejectConfirm = async (reason: string) => {
    if (!rejectTarget) return;
    // FIXED: Using the new processing action state
    setProcessingAction({ id: rejectTarget, type: 'reject' });
    try {
      await rejectAppointment(String(rejectTarget), reason);
      setPendingRequests(prev => prev.filter(a => a.id !== rejectTarget));
      await fetchData();
    } catch (err) {
      console.error("Failed to reject:", err);
      alert("Failed to reject appointment.");
    } finally {
      setProcessingAction(null);
      setRejectTarget(null);
    }
  };

  const handleAdd = async (appt: Omit<Appointment, "id">) => {
    try {
      const [timePart, meridiem] = appt.time.split(" ");
      let [hours, minutes] = timePart.split(":").map(Number);
      if (meridiem === "PM" && hours !== 12) hours += 12;
      if (meridiem === "AM" && hours === 12) hours = 0;
      const time24 = `${String(hours).padStart(2,"0")}:${String(minutes).padStart(2,"0")}`;
      await createAppointment({
        customerId:         appt.customerId!,
        fullName:           appt.customer,
        mobileNumber:       appt.contact,
        service:            appt.service,
        addons:             [],
        vehicleMake:        "",
        vehicleModel:       appt.vehicle,
        vehicleYear:        "",
        vehicleClass:       "",
        vehiclePlateNumber: "",
        date:               appt.date,
        time:               time24,
        paymentMethod:      "Cash",
        paymentType:        "Full Payment",
        totalAmount:        appt.deposit,
        deposit:            appt.deposit,
        remainingBalance:   0,
        notes:              appt.notes,
        proofFile:          new File([], "frontdesk-booking.txt"),
      });
      await fetchData();
    } catch (err) {
      console.error("Failed to create appointment:", err);
    }
  };

  const handleCancel = async (id: number | string) => {
    try {
      await updateAppointmentStatus(String(id), "Cancelled");
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: "Cancelled" } : a));
    } catch (err) {
      console.error("Failed to cancel:", err);
    }
  };

  const handleStatusChange = async (id: number | string, status: AppointmentStatus) => {
    try {
      await updateAppointmentStatus(String(id), status);
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const dotDates = useMemo(() => {
    const map: Record<string, string[]> = {};
    [...appointments, ...pendingRequests].forEach(a => {
      if (!map[a.date]) map[a.date] = [];
      map[a.date].push(a.status);
    });
    return map;
  }, [appointments, pendingRequests]);

  const forSelected = useMemo(
    () => appointments.filter(a => a.date === selected),
    [appointments, selected]
  );

  const filtered = useMemo(
    () => appointments
      .filter(a =>
        a.customer.toLowerCase().includes(search.toLowerCase()) ||
        a.service.toLowerCase().includes(search.toLowerCase())  ||
        a.vehicle.toLowerCase().includes(search.toLowerCase())  ||
        a.status.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [appointments, search]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-white text-3xl font-bold mb-1">Manage Appointments</h1>
          <p className="text-white/60 text-sm">{todayDisplay}</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 bg-gradient-to-r from-[#E41E6A] to-pink-600 hover:from-[#c41559] text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-[#E41E6A]/25 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />New Appointment
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/10 w-fit">
        <button
          onClick={() => setActiveTab("pending")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "pending"
              ? "bg-orange-500/20 text-orange-300 border border-orange-500/30"
              : "text-white/60 hover:text-white hover:bg-white/10"
          }`}
        >
          <Bell className="w-4 h-4" />
          Pending Requests
          {pendingRequests.length > 0 && (
            <span className="bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
              {pendingRequests.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("all")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "all"
              ? "bg-[#E41E6A] text-white"
              : "text-white/60 hover:text-white hover:bg-white/10"
          }`}
        >
          <Calendar className="w-4 h-4" />
          All Appointments
        </button>
      </div>

      {/* Pending Tab */}
      {activeTab === "pending" && (
        <div>
          <div className="mb-4">
            <h2 className="text-white font-semibold">Booking Requests</h2>
            <p className="text-white/50 text-xs mt-0.5">
              {pendingRequests.length} request{pendingRequests.length !== 1 ? "s" : ""} awaiting review
            </p>
          </div>
          {isLoading ? (
            <div className={`${cardCls} flex items-center justify-center h-40 text-white/50`}>
              Loading requests...
            </div>
          ) : (
            <PendingRequestsPanel
              requests={pendingRequests}
              onApprove={handleApprove}
              onReject={(id) => setRejectTarget(id)}
              processingAction={processingAction}
            />
          )}
        </div>
      )}

      {/* All Appointments Tab */}
      {activeTab === "all" && (
        <>
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
            <button className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white/60 bg-white/5 border border-white/10 rounded-xl hover:border-white/20 hover:text-white hover:bg-white/10 transition-colors">
              <SlidersHorizontal className="w-4 h-4" />Filter
            </button>
          </div>
          {isLoading ? (
            <div className={`${cardCls} flex items-center justify-center h-40 text-white/50`}>
              Loading appointments...
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4">
                <CalendarCard selected={selected} onSelect={setSelected} dotDates={dotDates} />
                <AppointmentsPanel selected={selected} appts={forSelected} onViewDetail={setDetailAppt} />
              </div>
              <AppointmentTable appts={filtered} onViewDetail={setDetailAppt} onCancel={handleCancel} />
            </>
          )}
        </>
      )}

      {/* Modals */}
      {showAdd && (
        <AddAppointmentModal onClose={() => setShowAdd(false)} onSave={handleAdd} customers={customers} />
      )}
      {detailAppt && (
        <DetailModal appt={detailAppt} onClose={() => setDetailAppt(null)} onStatusChange={handleStatusChange} />
      )}
      {rejectTarget !== null && (
        <RejectReasonModal onClose={() => setRejectTarget(null)} onConfirm={handleRejectConfirm} />
      )}
    </div>
  );
}

export default FrontDeskAppointments;