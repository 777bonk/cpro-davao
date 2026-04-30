import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  Plus, X, CheckCircle2, Clock, CreditCard, ChevronDown,
  RotateCcw, AlertCircle, BanknoteIcon, CheckCircle, XCircle,
  Loader2,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "../dashboard-ui/card";
import { Badge }   from "../dashboard-ui/badge";
import { Button }  from "../dashboard-ui/button";
import { Label }   from "../dashboard-ui/label";
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from "../dashboard-ui/table";

import {
  getAppointments, updateAppointmentStatus, updateAppointment,
  deleteAppointment, Appointment, RefundStatus,
  confirmRefund, rejectRefund, processRefund,
} from "../../services/appointments";
import { getCustomers, Customer } from "../../services/customer";

const API = import.meta.env.VITE_API_BASE_URL;

// ─── TYPES ────────────────────────────────────────────────────────────────────

type AppointmentWithRefund = Appointment & {
  refundStatus?:      RefundStatus;
  refundAmount?:      number;
  refundMethod?:      string;
  refundAccount?:     string;
  refundAccountName?: string;
  refundNote?:        string;
  customerEmail?:     string;
  mobileNumber?:      string;
  paymentMethod?:     string;
  adminRemarks?:      string;
};

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const SERVICE_OPTIONS = [
  "Ceramic Coating","Paint Protection Film (PPF)",
  "Interior Detailing","Exterior Detailing",
  "Premium Wash","Window Tinting","Scheduled Maintenance",
];

const STATUS_OPTIONS: Appointment["status"][] = [
  "Pending Verification","Confirmed","Pending",
  "In Progress","Completed","Cancelled","Rejected",
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function toDateOnly(value?: string) {
  return value?.split("T")[0] ?? "";
}

function formatDateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatShortDate(dateString?: string) {
  if (!dateString) return "—";
  const parsed = new Date(`${dateString}T12:00:00.000Z`);
  if (isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric", timeZone: "UTC",
  });
}

function getStatusBadgeClass(status: string) {
  switch (status) {
    case "Completed":            return "bg-green-500/15 text-green-400 border border-green-500/30";
    case "In Progress":          return "bg-[#E41E6A]/15 text-[#E41E6A] border border-[#E41E6A]/30";
    case "Cancelled":            return "bg-red-500/15 text-red-400 border border-red-500/30";
    case "Rejected":             return "bg-red-500/15 text-red-400 border border-red-500/30";
    case "Pending Verification": return "bg-orange-500/15 text-orange-300 border border-orange-500/30";
    case "Confirmed":            return "bg-green-500/15 text-green-400 border border-green-500/30";
    default:                     return "bg-blue-500/15 text-blue-400 border border-blue-500/30";
  }
}

function getRefundBadgeClass(status: RefundStatus) {
  switch (status) {
    case "Requested":         return "bg-orange-500/20 text-orange-400 border-orange-500/30";
    case "Approved":          return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    case "Details Submitted": return "bg-violet-500/20 text-violet-400 border-violet-500/30";
    case "Processed":         return "bg-green-500/20 text-green-400 border-green-500/30";
    case "Rejected":          return "bg-red-500/20 text-red-400 border-red-500/30";
    default:                  return "bg-white/10 text-white/50 border-white/10";
  }
}

function getCalendarDotClass(statuses: string[]) {
  if (statuses.includes("In Progress"))          return "bg-[#E41E6A]";
  if (statuses.includes("Pending Verification")) return "bg-orange-400";
  if (statuses.includes("Confirmed"))            return "bg-green-500";
  if (statuses.includes("Pending"))              return "bg-blue-500";
  if (statuses.includes("Completed"))            return "bg-green-500";
  return "bg-white/40";
}

function parseTimeForSort(time?: string) {
  if (!time) return 0;
  if (time.includes("AM") || time.includes("PM")) {
    const [clock, meridiem] = time.split(" ");
    const [rawH, rawM] = clock.split(":").map(Number);
    let h = rawH;
    if (meridiem === "PM" && h !== 12) h += 12;
    if (meridiem === "AM" && h === 12) h = 0;
    return h * 60 + rawM;
  }
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

async function createAdminAppointment(payload: {
  customerId: string; service: string; date: string;
  time: string; totalAmount: number;
}): Promise<Appointment> {
  const scheduledDate = new Date(`${payload.date}T${payload.time}`);
  const res = await fetch(`${API}/appointments/admin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customer_id:    payload.customerId,
      service_type:   payload.service,
      scheduled_date: scheduledDate.toISOString(),
      total_cost:     payload.totalAmount,
      status:         "Confirmed",
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(err.message ?? `Server error ${res.status}`);
  }
  const data = await res.json();
  const d = new Date(data.scheduled_date);
  return {
    id:               data.id,
    customerId:       data.customer_id,
    customerName:     data.customer?.name ?? "—",
    vehicle:          data.customer?.vehicle ?? "—",
    service:          data.service_type ?? payload.service,
    date:             `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,"0")}-${String(d.getUTCDate()).padStart(2,"0")}`,
    time:             payload.time,
    totalAmount:      Number(data.total_cost ?? payload.totalAmount),
    deposit:          Number(data.deposit ?? 0),
    remainingBalance: Number(data.remaining_balance ?? 0),
    status:           data.status as Appointment["status"],
    notes:            data.notes ?? "",
  };
}

const inputCls =
  "w-full px-4 h-10 border border-white/10 bg-white/5 rounded-md " +
  "focus:outline-none focus:border-[#E41E6A] text-white text-sm placeholder:text-white/30";
const selectCls = inputCls + " appearance-none";

// ─── MINI CALENDAR ────────────────────────────────────────────────────────────

function MiniCalendar({ selectedDate, onSelect, dateStatusMap }: {
  selectedDate: Date;
  onSelect: (d: Date) => void;
  dateStatusMap: Record<string, string[]>;
}) {
  const [viewMonth, setViewMonth] = useState(selectedDate.getMonth());
  const [viewYear,  setViewYear]  = useState(selectedDate.getFullYear());

  useEffect(() => {
    setViewMonth(selectedDate.getMonth());
    setViewYear(selectedDate.getFullYear());
  }, [selectedDate]);

  const firstDay    = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const todayKey    = formatDateKey(new Date());
  const selectedKey = formatDateKey(selectedDate);

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const prev = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const next = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  return (
    <div className="bg-[#111111] border border-white/5 rounded-2xl p-5">
      <div className="mb-4">
        <h2 className="text-sm font-bold text-white">Calendar</h2>
        <p className="text-xs text-white/40 mt-0.5">Select a date to filter appointments</p>
      </div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={prev} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/5 text-white/70">‹</button>
        <span className="text-sm font-semibold text-white">{MONTH_NAMES[viewMonth]} {viewYear}</span>
        <button onClick={next} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/5 text-white/70">›</button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {DAY_NAMES.map(d => (
          <div key={d} className="text-center text-[10px] font-semibold text-white/35 py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />;
          const key = `${viewYear}-${String(viewMonth + 1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
          const isToday    = key === todayKey;
          const isSelected = key === selectedKey;
          const statuses   = dateStatusMap[key] ?? [];
          return (
            <button
              key={key}
              onClick={() => onSelect(new Date(`${key}T00:00:00`))}
              className={[
                "relative flex flex-col items-center justify-center w-9 h-9 mx-auto rounded-full text-xs font-medium transition-all",
                isSelected ? "bg-[#E41E6A] text-white shadow-md shadow-[#E41E6A]/30" : "",
                isToday && !isSelected ? "border border-[#E41E6A] text-[#E41E6A]" : "",
                !isSelected && !isToday ? "text-white/80 hover:bg-white/5" : "",
              ].join(" ")}
            >
              {day}
              {statuses.length > 0 && (
                <span className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white" : getCalendarDotClass(statuses)}`} />
              )}
            </button>
          );
        })}
      </div>
      <div className="mt-5 pt-4 border-t border-white/5 flex flex-col gap-2">
        {[
          { color: "bg-orange-400", label: "Pending Verification" },
          { color: "bg-green-500",  label: "Confirmed"            },
          { color: "bg-[#E41E6A]", label: "In Progress"           },
          { color: "bg-blue-500",   label: "Pending"              },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${l.color}`} />
            <span className="text-xs text-white/60">{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── APPOINTMENTS PANEL ───────────────────────────────────────────────────────

function AppointmentsPanel({ selectedDate, appointments, onViewDetails }: {
  selectedDate: Date;
  appointments: AppointmentWithRefund[];
  onViewDetails: (a: AppointmentWithRefund) => void;
}) {
  return (
    <div className="bg-[#121212] rounded-2xl border border-white/5 p-5 flex flex-col min-h-[420px]">
      <div className="mb-4">
        <h2 className="text-sm font-bold text-white">
          Appointments for{" "}
          <span className="text-[#E41E6A]">{format(selectedDate, "MMM dd, yyyy")}</span>
        </h2>
        <p className="text-xs text-white/40 mt-0.5">
          {appointments.length} appointment{appointments.length !== 1 ? "s" : ""} scheduled
        </p>
      </div>
      {appointments.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-white/40">No appointments for this date</p>
        </div>
      ) : (
        <div className="space-y-3 overflow-y-auto">
          {appointments.map(a => (
            <div key={a.id} className="bg-white/[0.03] rounded-xl p-4 border border-white/5 hover:border-[#E41E6A]/30 transition-all">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <p className="text-sm font-semibold text-white">{a.service || "N/A"}</p>
                  <p className="text-xs text-white/40 mt-0.5">{a.customerName} · {a.vehicle || "N/A"}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge className={getStatusBadgeClass(a.status)}>{a.status}</Badge>
                  {a.refundStatus && a.refundStatus !== "None" && (
                    <Badge className={`text-[10px] ${getRefundBadgeClass(a.refundStatus)}`}>
                      Refund: {a.refundStatus}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-3 pt-2 border-t border-white/5">
                <span className="flex items-center gap-1 text-xs text-white/55">
                  <Clock className="w-3.5 h-3.5 text-[#E41E6A]" />{a.time}
                </span>
                <span className="flex items-center gap-1 text-xs text-white/55">
                  <CreditCard className="w-3.5 h-3.5 text-green-400" />
                  ₱{a.totalAmount?.toLocaleString?.() ?? a.totalAmount}
                </span>
                <button onClick={() => onViewDetails(a)}
                  className="ml-auto text-xs font-medium text-sky-400 hover:text-sky-300 transition-colors">
                  View
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── SHARED FORM COMPONENTS ───────────────────────────────────────────────────

function CustomerSelect({ value, onChange, customers }: {
  value: string; onChange: (id: string) => void; customers: Customer[];
}) {
  const selected = customers.find(c => c.id === value);
  return (
    <div className="space-y-2">
      <Label className="text-white/70">Customer *</Label>
      <div className="relative">
        <select className={selectCls} value={value} onChange={e => onChange(e.target.value)}>
          <option value="" disabled className="bg-[#0a0a0a]">
            {customers.length === 0 ? "Loading customers..." : "Select a customer"}
          </option>
          {customers.map(c => (
            <option key={c.id} value={c.id} className="bg-[#0a0a0a]">
              {c.name}{c.vehicle ? ` — ${c.vehicle}` : ""}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
      </div>
      {selected?.vehicle && <p className="text-white/40 text-xs px-1">Vehicle: {selected.vehicle}</p>}
    </div>
  );
}

function ServiceSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <Label className="text-white/70">Service</Label>
      <div className="relative">
        <select className={selectCls} value={value} onChange={e => onChange(e.target.value)}>
          <option value="" className="bg-[#0a0a0a]">Select a service</option>
          {SERVICE_OPTIONS.map(s => (
            <option key={s} value={s} className="bg-[#0a0a0a]">{s}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
      </div>
    </div>
  );
}

// ─── CONFIRM REFUND MODAL ─────────────────────────────────────────────────────

function ConfirmRefundModal({ appointment, onClose, onConfirm }: {
  appointment: AppointmentWithRefund;
  onClose:   () => void;
  onConfirm: (amount: number) => Promise<void>;
}) {
  const [amount,    setAmount]    = useState(String(appointment.deposit ?? 0));
  const [isSaving,  setIsSaving]  = useState(false);

  const handleConfirm = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { alert("Please enter a valid refund amount."); return; }
    setIsSaving(true);
    try {
      await onConfirm(amt);
      onClose();
    } catch (err: any) { alert(`Error: ${err.message}`); }
    finally { setIsSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center backdrop-blur-sm p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.85)" }}>
      <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl flex flex-col">
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white">Confirm Refund</h2>
            <p className="text-white/50 text-xs mt-0.5">
              This will send an email to {appointment.customerName} to fill in their payment details.
            </p>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {/* Summary */}
          <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Customer</span>
              <span className="text-white font-medium">{appointment.customerName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Service</span>
              <span className="text-white">{appointment.service}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Total Paid</span>
              <span className="text-white">₱{(appointment.deposit ?? 0).toLocaleString()}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-white/70 text-sm">
              Refund Amount (₱) <span className="text-red-500">*</span>
            </Label>
            <input
              type="number"
              min="1"
              className={inputCls}
              value={amount}
              onChange={e => setAmount(e.target.value)}
            />
            <p className="text-white/40 text-xs">
              Deposit paid: ₱{(appointment.deposit ?? 0).toLocaleString()} · Adjust if partial refund
            </p>
          </div>

          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-start gap-2 text-xs text-blue-400">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            An email will be sent to the customer asking them to log in and fill in their GCash or bank details.
          </div>
        </div>
        <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3">
          <button onClick={onClose}
            className="px-4 py-2 text-sm font-medium border border-white/10 text-white hover:bg-white/10 rounded-lg transition-colors">
            Cancel
          </button>
          <button onClick={handleConfirm} disabled={isSaving}
            className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 rounded-lg transition-all disabled:opacity-50 flex items-center gap-2">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            {isSaving ? "Sending..." : "Confirm & Send Email"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── REJECT REFUND MODAL ──────────────────────────────────────────────────────

function RejectRefundModal({ onClose, onConfirm }: {
  onClose:   () => void;
  onConfirm: (reason: string) => Promise<void>;
}) {
  const [reason,   setReason]   = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleConfirm = async () => {
    setIsSaving(true);
    try { await onConfirm(reason); onClose(); }
    catch (err: any) { alert(`Error: ${err.message}`); }
    finally { setIsSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center backdrop-blur-sm p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.85)" }}>
      <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl flex flex-col">
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <h2 className="text-lg font-bold text-white">Reject Refund Request</h2>
          <button onClick={onClose} className="text-white/50 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-3">
          <p className="text-white/60 text-sm">Provide a reason to let the customer know why their request was rejected.</p>
          <div className="space-y-1.5">
            <Label className="text-white/70 text-sm">Reason (optional)</Label>
            <textarea
              className={inputCls + " resize-none h-20 py-2.5"}
              placeholder="e.g. Deposit is non-refundable per policy..."
              value={reason}
              onChange={e => setReason(e.target.value)}
            />
          </div>
        </div>
        <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3">
          <button onClick={onClose}
            className="px-4 py-2 text-sm font-medium border border-white/10 text-white hover:bg-white/10 rounded-lg transition-colors">
            Cancel
          </button>
          <button onClick={handleConfirm} disabled={isSaving}
            className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 rounded-lg transition-all disabled:opacity-50 flex items-center gap-2">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
            {isSaving ? "Rejecting..." : "Confirm Reject"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── EMPTY FORM STATES ────────────────────────────────────────────────────────

const emptyNew  = { customerId: "", date: "", time: "", service: "", totalAmount: "" };
const emptyEdit = { id: "", customerId: "", date: "", time: "", service: "", totalAmount: "", status: "Pending" as Appointment["status"] };

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export function Appointments() {
  const [appointments,  setAppointments]  = useState<AppointmentWithRefund[]>([]);
  const [customers,     setCustomers]     = useState<Customer[]>([]);
  const [isLoading,     setIsLoading]     = useState(true);
  const [isSubmitting,  setIsSubmitting]  = useState(false);
  const [selectedDate,  setSelectedDate]  = useState<Date>(new Date());

  const [viewDetailsOpen,     setViewDetailsOpen]     = useState(false);
  const [newAppointmentOpen,  setNewAppointmentOpen]  = useState(false);
  const [editAppointmentOpen, setEditAppointmentOpen] = useState(false);
  const [confirmRefundOpen,   setConfirmRefundOpen]   = useState(false);
  const [rejectRefundOpen,    setRejectRefundOpen]    = useState(false);

  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithRefund | null>(null);
  const [newForm,  setNewForm]  = useState(emptyNew);
  const [editForm, setEditForm] = useState(emptyEdit);

  // ── Fetch ─────────────────────────────────────────────────────────────────

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [aptsData, custsData] = await Promise.all([
        getAppointments(),
        getCustomers(),
      ]);
      const raw = Array.isArray(aptsData) ? aptsData : (aptsData?.data ?? []);
      setAppointments(raw.map((a: any) => {
        const d       = new Date(a.scheduled_date || a.date || new Date());
        const dateStr = `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,"0")}-${String(d.getUTCDate()).padStart(2,"0")}`;
        return {
          id:               a.id,
          customerId:       a.customer_id ?? "",
          customerName:     a.full_name ?? a.customer?.name ?? "—",
          vehicle:          a.vehicle_make
            ? [a.vehicle_make, a.vehicle_model, a.vehicle_class].filter(Boolean).join(" ")
            : (a.customer?.vehicle ?? "—"),
          service:          a.service_type ?? a.service ?? "—",
          date:             dateStr,
          time:             d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          totalAmount:      Number(a.total_cost ?? 0),
          deposit:          Number(a.deposit ?? 0),
          remainingBalance: Number(a.remaining_balance ?? 0),
          status:           a.status ?? "Pending",
          notes:            a.notes ?? "",
          mobileNumber:     a.mobile_number,
          paymentMethod:    a.payment_method,
          adminRemarks:     a.admin_remarks,
          customerEmail:    a.customer?.email,
          // ── Refund fields ──
          refundStatus:      (a.refund_status ?? "None") as RefundStatus,
          refundAmount:      Number(a.refund_amount ?? 0),
          refundMethod:      a.refund_method,
          refundAccount:     a.refund_account,
          refundAccountName: a.refund_account_name,
          refundNote:        a.refund_note,
        };
      }));
      setCustomers(custsData);
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleViewDetails = (a: AppointmentWithRefund) => {
    setSelectedAppointment(a);
    setViewDetailsOpen(true);
  };

  const handleOpenEdit = (a: AppointmentWithRefund) => {
    setEditForm({
      id:          a.id,
      customerId:  a.customerId,
      date:        toDateOnly(a.date),
      time:        a.time ?? "",
      service:     a.service ?? "",
      totalAmount: String(a.totalAmount ?? ""),
      status:      a.status,
    });
    setEditAppointmentOpen(true);
  };

  const handleArchive = async (id: string) => {
    try {
      await updateAppointmentStatus(id, "Cancelled");
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: "Cancelled" } : a));
      setEditAppointmentOpen(false);
    } catch (err) { alert("Failed to archive appointment."); }
  };

  const handleAddAppointment = async () => {
    if (!newForm.customerId || !newForm.date || !newForm.time || !newForm.totalAmount) {
      alert("Please fill in all required fields."); return;
    }
    setIsSubmitting(true);
    try {
      const created = await createAdminAppointment({
        customerId:  newForm.customerId,
        service:     newForm.service || "N/A",
        date:        newForm.date,
        time:        newForm.time,
        totalAmount: parseFloat(newForm.totalAmount),
      });
      setAppointments(prev => [...prev, { ...created, refundStatus: "None" }]);
      setNewAppointmentOpen(false);
      setNewForm(emptyNew);
    } catch (err: any) { alert(`Failed to create appointment: ${err.message}`); }
    finally { setIsSubmitting(false); }
  };

  const handleMarkComplete = async (id: string) => {
    try {
      const updated = await updateAppointmentStatus(id, "Completed");
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, ...updated } : a));
      if (selectedAppointment?.id === id) setSelectedAppointment(prev => prev ? { ...prev, ...updated } : prev);
    } catch (err) { alert("Failed to update status."); }
  };

  const handleSaveEdit = async () => {
    if (!editForm.customerId || !editForm.date || !editForm.time || !editForm.totalAmount) {
      alert("Please fill in all required fields."); return;
    }
    setIsSubmitting(true);
    try {
      const updated = await updateAppointment(editForm.id, {
        customer_id:    editForm.customerId,
        service_type:   editForm.service,
        scheduled_date: new Date(`${editForm.date}T${editForm.time}`).toISOString(),
        total_cost:     parseFloat(editForm.totalAmount),
        status:         editForm.status,
      });
      setAppointments(prev => prev.map(a => a.id === updated.id ? { ...a, ...updated } : a));
      setEditAppointmentOpen(false);
    } catch (err: any) { alert(`Failed to save changes: ${err.message}`); }
    finally { setIsSubmitting(false); }
  };

  // ── Refund handlers ───────────────────────────────────────────────────────

  const updateLocalRefund = (id: string, data: Partial<AppointmentWithRefund>) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, ...data } : a));
    setSelectedAppointment(prev => prev?.id === id ? { ...prev, ...data } : prev);
  };

  const handleConfirmRefund = async (amount: number) => {
    if (!selectedAppointment) return;
    await confirmRefund(selectedAppointment.id, amount);
    updateLocalRefund(selectedAppointment.id, { refundStatus: "Approved", refundAmount: amount });
  };

  const handleRejectRefund = async (reason: string) => {
    if (!selectedAppointment) return;
    await rejectRefund(selectedAppointment.id, reason);
    updateLocalRefund(selectedAppointment.id, { refundStatus: "Rejected", refundNote: reason });
  };

  const handleProcessRefund = async (id: string) => {
    try {
      await processRefund(id);
      updateLocalRefund(id, { refundStatus: "Processed" });
      alert("Refund marked as processed and logged to transactions.");
    } catch (err: any) { alert(`Failed to process refund: ${err.message}`); }
  };

  // ── Derived data ──────────────────────────────────────────────────────────

  const selectedDateKey = formatDateKey(selectedDate);
  const pendingRefunds  = appointments.filter(a => a.refundStatus === "Requested").length;

  const todaysAppointments = useMemo(() =>
    appointments
      .filter(a => toDateOnly(a.date) === selectedDateKey)
      .sort((a, b) => parseTimeForSort(a.time) - parseTimeForSort(b.time)),
  [appointments, selectedDateKey]);

  const allAppointments = useMemo(() =>
    [...appointments].sort((a, b) => {
      const dc =
        new Date(`${toDateOnly(a.date)}T00:00:00`).getTime() -
        new Date(`${toDateOnly(b.date)}T00:00:00`).getTime();
      return dc !== 0 ? dc : parseTimeForSort(a.time) - parseTimeForSort(b.time);
    }),
  [appointments]);

  const dateStatusMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const a of appointments) {
      const key = toDateOnly(a.date);
      if (!key) continue;
      if (!map[key]) map[key] = [];
      map[key].push(a.status);
    }
    return map;
  }, [appointments]);

  const completedCount = appointments.filter(a => a.status === "Completed").length;
  const pendingCount   = appointments.filter(a =>
    a.status !== "Completed" && a.status !== "Cancelled" && a.status !== "Rejected"
  ).length;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-full bg-[#0B0B0B] p-4 md:p-6 space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Appointments</h1>
          <p className="text-white/50 text-sm mt-1">{format(new Date(), "EEEE, MMMM dd, yyyy")}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Pending refunds badge */}
          {pendingRefunds > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-2 bg-orange-500/10 border border-orange-500/30 rounded-xl text-xs text-orange-400 font-semibold">
              <RotateCcw className="w-3.5 h-3.5" />
              {pendingRefunds} Refund{pendingRefunds > 1 ? "s" : ""} Pending
            </div>
          )}
          <Button
            onClick={() => setNewAppointmentOpen(true)}
            className="self-start sm:self-auto inline-flex items-center gap-2 bg-[#E41E6A] hover:bg-[#c41559] text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-[#E41E6A]/25"
          >
            <Plus className="w-4 h-4" />New Appointment
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: "Selected Day",       value: todaysAppointments.length,               sub: "Appointments listed",     subColor: ""               },
          { label: "Total Appointments", value: isLoading ? "..." : appointments.length,  sub: "All scheduled",           subColor: ""               },
          { label: "Completed",          value: isLoading ? "..." : completedCount,        sub: "Finished services",       subColor: "text-green-400" },
          { label: "Pending Refunds",    value: isLoading ? "..." : pendingRefunds,        sub: "Awaiting confirmation",   subColor: pendingRefunds > 0 ? "text-orange-400" : "" },
        ].map(s => (
          <Card key={s.label} className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-white/70">{s.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-white text-2xl">{s.value}</div>
              <p className={`text-xs mt-1 ${s.subColor || "text-white/50"}`}>{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Calendar + Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4">
        <MiniCalendar selectedDate={selectedDate} onSelect={setSelectedDate} dateStatusMap={dateStatusMap} />
        <AppointmentsPanel selectedDate={selectedDate} appointments={todaysAppointments} onViewDetails={handleViewDetails} />
      </div>

      {/* All Appointments Table */}
      <div className="bg-[#121212] rounded-2xl border border-white/5 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5">
          <h2 className="text-sm font-bold text-white">All Appointments</h2>
          <p className="text-xs text-white/40 mt-0.5">{appointments.length} total records</p>
        </div>

        {/* Desktop */}
        <div className="hidden sm:block overflow-x-auto">
          <Table className="w-full">
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-white/60">Date</TableHead>
                <TableHead className="text-white/60">Customer</TableHead>
                <TableHead className="text-white/60">Service</TableHead>
                <TableHead className="text-white/60">Status</TableHead>
                <TableHead className="text-white/60">Refund</TableHead>
                <TableHead className="text-white/60 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow className="border-white/5">
                  <TableCell colSpan={6} className="text-center text-white/40 py-10">Loading appointments...</TableCell>
                </TableRow>
              ) : allAppointments.length === 0 ? (
                <TableRow className="border-white/5">
                  <TableCell colSpan={6} className="text-center text-white/40 py-10">No appointments found.</TableCell>
                </TableRow>
              ) : allAppointments.map(a => (
                <TableRow key={a.id} className={`border-white/5 hover:bg-white/[0.03] ${a.refundStatus === "Requested" ? "bg-orange-500/5" : ""}`}>
                  <TableCell className="text-white">
                    <div className="flex flex-col">
                      <span className="text-sm">{formatShortDate(a.date)}</span>
                      <span className="text-xs text-white/40">{a.time}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-white">{a.customerName}</TableCell>
                  <TableCell className="text-white">{a.service || "N/A"}</TableCell>
                  <TableCell><Badge className={getStatusBadgeClass(a.status)}>{a.status}</Badge></TableCell>
                  <TableCell>
                    {a.refundStatus && a.refundStatus !== "None" ? (
                      <Badge className={getRefundBadgeClass(a.refundStatus)}>
                        {a.refundStatus === "Requested" && <span className="mr-1">⚠</span>}
                        {a.refundStatus}
                      </Badge>
                    ) : (
                      <span className="text-white/20 text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button size="sm" variant="outline"
                        className="border-white/10 text-white hover:bg-white/10"
                        onClick={() => handleOpenEdit(a)}>Edit</Button>
                      <Button size="sm" variant="outline"
                        className="border-[#E41E6A]/30 text-[#E41E6A] hover:bg-[#E41E6A]/10"
                        onClick={() => handleViewDetails(a)}>View</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile */}
        <div className="sm:hidden divide-y divide-white/5">
          {isLoading ? (
            <div className="p-6 text-center text-white/40">Loading appointments...</div>
          ) : allAppointments.length === 0 ? (
            <div className="p-6 text-center text-white/40">No appointments found.</div>
          ) : allAppointments.map(a => (
            <div key={a.id} className={`p-4 flex flex-col gap-2 ${a.refundStatus === "Requested" ? "bg-orange-500/5" : ""}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">{a.service || "N/A"}</p>
                  <p className="text-xs text-white/40">{a.customerName}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge className={getStatusBadgeClass(a.status)}>{a.status}</Badge>
                  {a.refundStatus && a.refundStatus !== "None" && (
                    <Badge className={`text-[10px] ${getRefundBadgeClass(a.refundStatus)}`}>{a.refundStatus}</Badge>
                  )}
                </div>
              </div>
              <p className="text-xs text-white/50">{formatShortDate(a.date)} · {a.time}</p>
              <div className="pt-1 flex gap-2">
                <Button size="sm" variant="outline" className="border-white/10 text-white hover:bg-white/10" onClick={() => handleOpenEdit(a)}>Edit</Button>
                <Button size="sm" variant="outline" className="border-[#E41E6A]/30 text-[#E41E6A] hover:bg-[#E41E6A]/10" onClick={() => handleViewDetails(a)}>View</Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── VIEW DETAILS MODAL ────────────────────────────────────────────────── */}
      {viewDetailsOpen && selectedAppointment && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center backdrop-blur-sm p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.8)" }}>
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white">Appointment Details</h2>
                <p className="text-xs text-white/40 mt-1">{formatShortDate(selectedAppointment.date)}</p>
              </div>
              <button onClick={() => setViewDetailsOpen(false)} className="text-white/50 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Details */}
              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <h3 className="text-white/60 text-sm mb-3">Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: "Date",     value: formatShortDate(selectedAppointment.date) },
                    { label: "Time",     value: selectedAppointment.time                  },
                    { label: "Customer", value: selectedAppointment.customerName          },
                    { label: "Vehicle",  value: selectedAppointment.vehicle || "N/A"      },
                    { label: "Mobile",   value: selectedAppointment.mobileNumber || "N/A" },
                  ].map(f => (
                    <div key={f.label}>
                      <p className="text-white/40 text-xs">{f.label}</p>
                      <p className="text-white">{f.value}</p>
                    </div>
                  ))}
                </div>
              </div>
              {/* Service */}
              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <h3 className="text-white/60 text-sm mb-2">Service</h3>
                <p className="text-white">{selectedAppointment.service || "N/A"}</p>
              </div>
              {/* Payment */}
              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <h3 className="text-white/60 text-sm mb-3">Payment</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-white/40 text-xs">Total Amount</p>
                    <p className="text-[#E41E6A] text-lg font-semibold">₱{selectedAppointment.totalAmount?.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-white/40 text-xs">Deposit Paid</p>
                    <p className="text-green-400 text-lg font-semibold">₱{selectedAppointment.deposit?.toLocaleString()}</p>
                  </div>
                  {selectedAppointment.remainingBalance > 0 && (
                    <div>
                      <p className="text-white/40 text-xs">Remaining</p>
                      <p className="text-yellow-400 text-lg font-semibold">₱{selectedAppointment.remainingBalance?.toLocaleString()}</p>
                    </div>
                  )}
                  {selectedAppointment.paymentMethod && (
                    <div>
                      <p className="text-white/40 text-xs">Method</p>
                      <p className="text-white">{selectedAppointment.paymentMethod}</p>
                    </div>
                  )}
                </div>
              </div>
              {/* Status */}
              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <h3 className="text-white/60 text-sm mb-2">Status</h3>
                <div className="flex items-center justify-between gap-3">
                  <Badge className={getStatusBadgeClass(selectedAppointment.status)}>
                    {selectedAppointment.status}
                  </Badge>
                  {selectedAppointment.status !== "Completed" && selectedAppointment.status !== "Cancelled" && selectedAppointment.status !== "Rejected" && (
                    <Button size="sm"
                      className="bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30"
                      onClick={() => handleMarkComplete(selectedAppointment.id)}>
                      <CheckCircle2 className="w-4 h-4 mr-1" />Mark as Complete
                    </Button>
                  )}
                </div>
              </div>

              {/* ── REFUND SECTION ──────────────────────────────────────────── */}
              {selectedAppointment.refundStatus && selectedAppointment.refundStatus !== "None" && (
                <div className={`p-4 rounded-xl border ${
                  selectedAppointment.refundStatus === "Requested"
                    ? "bg-orange-500/10 border-orange-500/30"
                    : selectedAppointment.refundStatus === "Processed"
                    ? "bg-green-500/10 border-green-500/30"
                    : "bg-white/5 border-white/10"
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-white text-sm font-semibold flex items-center gap-2">
                      <RotateCcw className="w-4 h-4 text-[#E41E6A]" />
                      Refund Request
                    </h3>
                    <Badge className={getRefundBadgeClass(selectedAppointment.refundStatus)}>
                      {selectedAppointment.refundStatus}
                    </Badge>
                  </div>

                  {/* REQUESTED — admin can confirm or reject */}
                  {selectedAppointment.refundStatus === "Requested" && (
                    <div className="space-y-3">
                      <p className="text-white/60 text-sm">
                        Customer has requested a refund of approximately
                        <span className="text-orange-400 font-semibold"> ₱{(selectedAppointment.refundAmount || selectedAppointment.deposit || 0).toLocaleString()}</span>.
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setConfirmRefundOpen(true)}
                          className="flex-1 py-2 text-sm font-semibold text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 rounded-lg transition-all flex items-center justify-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />Confirm Refund
                        </button>
                        <button
                          onClick={() => setRejectRefundOpen(true)}
                          className="flex-1 py-2 text-sm font-semibold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg transition-all flex items-center justify-center gap-2"
                        >
                          <XCircle className="w-4 h-4" />Reject
                        </button>
                      </div>
                    </div>
                  )}

                  {/* APPROVED — waiting for customer */}
                  {selectedAppointment.refundStatus === "Approved" && (
                    <div className="space-y-2">
                      <p className="text-blue-400 text-sm">
                        ✓ Refund of <span className="font-bold">₱{(selectedAppointment.refundAmount ?? 0).toLocaleString()}</span> approved.
                      </p>
                      <p className="text-white/50 text-xs">
                        An email was sent to the customer. Waiting for them to submit their GCash or bank details.
                      </p>
                    </div>
                  )}

                  {/* DETAILS SUBMITTED — admin can process */}
                  {selectedAppointment.refundStatus === "Details Submitted" && (
                    <div className="space-y-3">
                      <p className="text-violet-400 text-sm font-medium">Customer has submitted their payment details:</p>
                      <div className="p-3 bg-white/5 rounded-lg border border-white/10 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-white/50">Method</span>
                          <span className="text-white font-medium">{selectedAppointment.refundMethod ?? "—"}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-white/50">Account Number</span>
                          <span className="text-white font-mono font-bold">{selectedAppointment.refundAccount ?? "—"}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-white/50">Account Name</span>
                          <span className="text-white font-medium">{selectedAppointment.refundAccountName ?? "—"}</span>
                        </div>
                        {selectedAppointment.refundNote && (
                          <div className="flex justify-between text-sm">
                            <span className="text-white/50">Note</span>
                            <span className="text-white/70">{selectedAppointment.refundNote}</span>
                          </div>
                        )}
                      </div>
                      <div className="p-3 bg-[#E41E6A]/10 border border-[#E41E6A]/20 rounded-lg">
                        <p className="text-white/70 text-xs">Amount to transfer: <span className="text-[#E41E6A] font-bold">₱{(selectedAppointment.refundAmount ?? 0).toLocaleString()}</span></p>
                      </div>
                      <button
                        onClick={() => handleProcessRefund(selectedAppointment.id)}
                        className="w-full py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#E41E6A] to-pink-600 hover:from-[#c41559] rounded-lg transition-all flex items-center justify-center gap-2"
                      >
                        <BanknoteIcon className="w-4 h-4" />Mark Refund as Processed
                      </button>
                    </div>
                  )}

                  {/* PROCESSED */}
                  {selectedAppointment.refundStatus === "Processed" && (
                    <div className="space-y-1">
                      <p className="text-green-400 text-sm font-semibold">
                        ✓ Refund of ₱{(selectedAppointment.refundAmount ?? 0).toLocaleString()} has been processed.
                      </p>
                      <p className="text-white/40 text-xs">Logged to transactions as an expense.</p>
                    </div>
                  )}

                  {/* REJECTED */}
                  {selectedAppointment.refundStatus === "Rejected" && (
                    <div className="space-y-1">
                      <p className="text-red-400 text-sm">Refund request was rejected.</p>
                      {selectedAppointment.refundNote && (
                        <p className="text-white/50 text-xs">Reason: {selectedAppointment.refundNote}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {selectedAppointment.adminRemarks && (
                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                  <h3 className="text-white/60 text-sm mb-2">Admin Remarks</h3>
                  <p className="text-white">{selectedAppointment.adminRemarks}</p>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end">
              <Button variant="outline" className="border-white/10 text-white hover:bg-white/10"
                onClick={() => setViewDetailsOpen(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* ── NEW APPOINTMENT MODAL ───────────────────────────────────────────── */}
      {newAppointmentOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center backdrop-blur-sm p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.8)" }}>
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white">New Appointment</h2>
                <p className="text-xs text-white/40 mt-1">Admin-created — auto confirmed, no proof required</p>
              </div>
              <button onClick={() => setNewAppointmentOpen(false)} className="text-white/50 hover:text-white transition"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <CustomerSelect value={newForm.customerId} onChange={id => setNewForm({ ...newForm, customerId: id })} customers={customers} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white/70">Date *</Label>
                  <input type="date" className={`${inputCls} [color-scheme:dark]`}
                    value={newForm.date} onChange={e => setNewForm({ ...newForm, date: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/70">Time *</Label>
                  <input type="time" className={`${inputCls} [color-scheme:dark]`}
                    value={newForm.time} onChange={e => setNewForm({ ...newForm, time: e.target.value })} />
                </div>
              </div>
              <ServiceSelect value={newForm.service} onChange={v => setNewForm({ ...newForm, service: v })} />
              <div className="space-y-2">
                <Label className="text-white/70">Total Amount (₱) *</Label>
                <input type="number" placeholder="0" className={inputCls}
                  value={newForm.totalAmount} onChange={e => setNewForm({ ...newForm, totalAmount: e.target.value })} />
              </div>
            </div>
            <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3">
              <Button variant="outline" className="border-white/10 text-white hover:bg-white/10"
                onClick={() => setNewAppointmentOpen(false)} disabled={isSubmitting}>Cancel</Button>
              <Button className="bg-gradient-to-r from-[#E41E6A] to-pink-600 text-white border-none hover:opacity-90"
                onClick={handleAddAppointment} disabled={isSubmitting}>
                {isSubmitting ? "Adding..." : "Add Appointment"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT APPOINTMENT MODAL ──────────────────────────────────────────── */}
      {editAppointmentOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center backdrop-blur-sm p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.8)" }}>
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white">Edit Appointment</h2>
                <p className="text-xs text-white/40 mt-1">Update appointment details</p>
              </div>
              <button onClick={() => setEditAppointmentOpen(false)} className="text-white/50 hover:text-white transition"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <CustomerSelect value={editForm.customerId} onChange={id => setEditForm({ ...editForm, customerId: id })} customers={customers} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white/70">Date</Label>
                  <input type="date" className={`${inputCls} [color-scheme:dark]`}
                    value={editForm.date} onChange={e => setEditForm({ ...editForm, date: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/70">Time</Label>
                  <input type="time" className={`${inputCls} [color-scheme:dark]`}
                    value={editForm.time} onChange={e => setEditForm({ ...editForm, time: e.target.value })} />
                </div>
              </div>
              <ServiceSelect value={editForm.service} onChange={v => setEditForm({ ...editForm, service: v })} />
              <div className="space-y-2">
                <Label className="text-white/70">Total Amount (₱)</Label>
                <input type="number" className={inputCls}
                  value={editForm.totalAmount} onChange={e => setEditForm({ ...editForm, totalAmount: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label className="text-white/70">Status</Label>
                <div className="relative">
                  <select className={selectCls} value={editForm.status}
                    onChange={e => setEditForm({ ...editForm, status: e.target.value as Appointment["status"] })}>
                    {STATUS_OPTIONS.map(s => (
                      <option key={s} value={s} className="bg-[#0a0a0a]">{s}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-white/10 bg-white/5 flex justify-between items-center gap-3">
              <Button variant="outline"
                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                onClick={() => handleArchive(editForm.id)} disabled={isSubmitting}>Archive</Button>
              <div className="flex gap-3">
                <Button variant="outline" className="border-white/10 text-white hover:bg-white/10"
                  onClick={() => setEditAppointmentOpen(false)} disabled={isSubmitting}>Cancel</Button>
                <Button className="bg-gradient-to-r from-[#E41E6A] to-pink-600 text-white border-none hover:opacity-90"
                  onClick={handleSaveEdit} disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CONFIRM REFUND MODAL ─────────────────────────────────────────────── */}
      {confirmRefundOpen && selectedAppointment && (
        <ConfirmRefundModal
          appointment={selectedAppointment}
          onClose={() => setConfirmRefundOpen(false)}
          onConfirm={handleConfirmRefund}
        />
      )}

      {/* ── REJECT REFUND MODAL ──────────────────────────────────────────────── */}
      {rejectRefundOpen && (
        <RejectRefundModal
          onClose={() => setRejectRefundOpen(false)}
          onConfirm={handleRejectRefund}
        />
      )}
    </div>
  );
}

export default Appointments;