import { useState, useEffect, useMemo } from "react";
import {
  ChevronLeft, ChevronRight, Search, SlidersHorizontal,
  Plus, Calendar, Car, Clock, Banknote, Shield, Layers,
  Sparkles, Wrench, Eye, CalendarX, CheckCircle, X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../dashboard-ui/card";
import { Badge } from "../dashboard-ui/badge";
import { getCustomerAppointments, createAppointment } from "../../services/appointments";
import { getServices } from "../../services/settings";
import { useAuth } from "../../hooks/useAuth";
import { getVehicles, Vehicle } from "../../services/vehicles";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type AppointmentStatus =
  | "Pending Verification" | "Confirmed" | "Pending"
  | "In Progress" | "Completed" | "Cancelled" | "Scheduled" | "Rejected";

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

// ── Service catalog item (name + price from API or defaults) ──────────────────
interface ServiceItem {
  name: string;
  price: number;
}

// ─── STATUS CONFIG ────────────────────────────────────────────────────────────

const STATUS: Record<string, { bg: string; text: string; dot: string; border: string }> = {
  "Pending Verification": { bg: "bg-orange-500/20", text: "text-orange-300", dot: "bg-orange-400", border: "border-orange-500/30" },
  Confirmed:    { bg: "bg-green-500/20",  text: "text-green-400",  dot: "bg-green-500",  border: "border-green-500/30"  },
  Pending:      { bg: "bg-yellow-500/20", text: "text-yellow-400", dot: "bg-yellow-400", border: "border-yellow-500/30" },
  Scheduled:    { bg: "bg-green-500/20",  text: "text-green-400",  dot: "bg-green-500",  border: "border-green-500/30"  },
  "In Progress":{ bg: "bg-blue-500/20",   text: "text-blue-400",   dot: "bg-blue-500",   border: "border-blue-500/30"   },
  Completed:    { bg: "bg-white/10",      text: "text-white/50",   dot: "bg-white/30",   border: "border-white/10"      },
  Cancelled:    { bg: "bg-red-500/20",    text: "text-red-400",    dot: "bg-red-500",    border: "border-red-500/30"    },
  Rejected:     { bg: "bg-red-500/20",    text: "text-red-400",    dot: "bg-red-500",    border: "border-red-500/30"    },
};

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_NAMES   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const VEHICLE_CLASS_OPTIONS = [
  { label: "Sedan",        value: "Sedan"        },
  { label: "Hatchback",    value: "Hatchback"    },
  { label: "Crossover",    value: "Crossover"    },
  { label: "SUV",          value: "SUV"          },
  { label: "Pickup",       value: "Pickup"       },
  { label: "Van",          value: "Van"          },
  { label: "MPV",          value: "MPV"          },
  { label: "Full-size SUV",value: "Full-size SUV"},
  { label: "Scooter",      value: "Scooter"      },
  { label: "Underbone",    value: "Underbone"    },
  { label: "Small Displacement Motorcycle", value: "Small Displacement Motorcycle" },
  { label: "Naked Bike",   value: "Naked Bike"   },
  { label: "Sport Bike",   value: "Sport Bike"   },
  { label: "Cruiser",      value: "Cruiser"      },
  { label: "Adventure Bike",value:"Adventure Bike"},
  { label: "Big Bike",     value: "Big Bike"     },
];

// Default fallback services — used only when API returns nothing
const DEFAULT_SERVICES: ServiceItem[] = [
  { name: "Ceramic Coating - Full Body", price: 12000 },
  { name: "Ceramic Coating - Partial",   price: 7000  },
  { name: "PPF - Hood & Fenders",        price: 15000 },
  { name: "PPF - Full Body",             price: 65000 },
  { name: "Window Tinting - Full Car",   price: 5000  },
  { name: "Full Interior Detailing",     price: 3500  },
  { name: "Nano Ceramic Spray",          price: 2500  },
  { name: "Paint Decontamination",       price: 3000  },
];

const DEFAULT_ADDONS: ServiceItem[] = [
  { name: "Glass Coating",        price: 1500 },
  { name: "Wheel Coating",        price: 2000 },
  { name: "Engine Bay Detailing", price: 1200 },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function formatShort(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function formatMoney(value: number) {
  return `₱${Number(value || 0).toLocaleString()}`;
}

function serviceIcon(service: string) {
  const s = (service ?? "").toLowerCase();
  if (s.includes("coating")) return <Shield   className="w-4 h-4 text-[#E41E6A]"  />;
  if (s.includes("ppf") || s.includes("paint protection")) return <Layers className="w-4 h-4 text-violet-400" />;
  if (s.includes("tint"))    return <Sparkles className="w-4 h-4 text-sky-400"    />;
  return                            <Wrench   className="w-4 h-4 text-white/50"   />;
}

function normalizeAppointment(a: any): Appointment {
  const d = new Date(a.scheduled_date || a.date);
  const vehicle =
    a.customers?.vehicle ??
    a.customer?.vehicle ??
    a.vehicle ??
    [a.vehicle_make, a.vehicle_model, a.vehicle_class].filter(Boolean).join(" ") ??
    "Vehicle";
  return {
    id:      a.id,
    service: a.service_type ?? a.service ?? "Appointment",
    vehicle,
    date:    `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,"0")}-${String(d.getUTCDate()).padStart(2,"0")}`,
    time:    a.appointment_time ?? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    deposit: Number(a.deposit ?? a.deposit_amount ?? a.total_cost ?? 0),
    status:  (a.status ?? "Pending") as AppointmentStatus,
    notes:   a.notes ?? "",
  };
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

function CalendarCard({ selected, onSelect, dotDates }: {
  selected: string; onSelect: (d: string) => void; dotDates: Record<string, string[]>;
}) {
  const today = todayStr();
  const selDate = new Date(selected + "T00:00:00");
  const [viewYear,  setViewYear]  = useState(selDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(selDate.getMonth());

  const firstDay    = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  const prev = () => viewMonth === 0  ? (setViewMonth(11), setViewYear(y => y-1)) : setViewMonth(m => m-1);
  const next = () => viewMonth === 11 ? (setViewMonth(0),  setViewYear(y => y+1)) : setViewMonth(m => m+1);
  const cellKey = (day: number) => `${viewYear}-${String(viewMonth+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
  const dotColor = (statuses: string[]) => {
    if (statuses.includes("In Progress"))          return "bg-blue-500";
    if (statuses.includes("Confirmed") || statuses.includes("Scheduled")) return "bg-green-500";
    if (statuses.includes("Pending Verification")) return "bg-orange-400";
    if (statuses.includes("Pending"))              return "bg-yellow-400";
    if (statuses.includes("Rejected"))             return "bg-red-500";
    return "bg-white/30";
  };

  return (
    <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur" style={{ borderRadius: "12px" }}>
      <CardHeader className="pb-3">
        <CardTitle className="text-white text-sm">Calendar</CardTitle>
        <p className="text-white/50 text-xs">Select a date to view appointments</p>
      </CardHeader>
      <CardContent style={{ paddingBottom: "20px" }}>
        <div className="flex items-center justify-between mb-4">
          <button onClick={prev} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"><ChevronLeft className="w-4 h-4 text-white/60" /></button>
          <span className="text-white text-sm font-semibold">{MONTH_NAMES[viewMonth]} {viewYear}</span>
          <button onClick={next} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"><ChevronRight className="w-4 h-4 text-white/60" /></button>
        </div>
        <div className="grid grid-cols-7 mb-1">
          {DAY_NAMES.map(d => <div key={d} className="text-center text-[10px] font-semibold text-white/30 py-1">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-y-1">
          {cells.map((day, i) => {
            if (!day) return <div key={`e-${i}`} />;
            const key = cellKey(day);
            const isToday = key === today;
            const isSel   = key === selected;
            const dots    = dotDates[key];
            return (
              <button key={key} onClick={() => onSelect(key)}
                className={["relative flex flex-col items-center justify-center w-8 h-8 mx-auto rounded-full text-xs font-medium transition-all",
                  isSel ? "bg-[#E41E6A] text-white shadow-md shadow-[#E41E6A]/30" : "",
                  isToday && !isSel ? "border border-[#E41E6A] text-[#E41E6A]" : "",
                  !isSel && !isToday ? "text-white/60 hover:bg-white/10" : "",
                ].join(" ")}>
                {day}
                {dots && <span className={`absolute bottom-0.5 w-1.5 h-1.5 rounded-full ${isSel ? "bg-white" : dotColor(dots)}`} />}
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
      </CardContent>
    </Card>
  );
}

// ─── APPOINTMENTS PANEL ───────────────────────────────────────────────────────

function AppointmentsPanel({ selected, appts, onView }: {
  selected: string; appts: Appointment[]; onView: (a: Appointment) => void;
}) {
  return (
    <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur flex flex-col min-h-[420px]" style={{ borderRadius: "12px" }}>
      <CardHeader className="pb-3">
        <CardTitle className="text-white text-sm">Appointments for <span className="text-[#E41E6A]">{formatShort(selected)}</span></CardTitle>
        <p className="text-white/50 text-xs">{appts.length} appointment{appts.length !== 1 ? "s" : ""} scheduled</p>
      </CardHeader>
      <CardContent style={{ paddingBottom: "20px", flex: 1 }}>
        {appts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-10 text-center">
            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-3"><CalendarX className="w-6 h-6 text-white/20" /></div>
            <p className="text-white/50 text-sm">No appointments for this date</p>
          </div>
        ) : (
          <div className="space-y-3">
            {appts.map(a => (
              <div key={a.id} className="p-3 bg-white/5 rounded-xl border border-white/10 hover:border-[#E41E6A]/40 transition-colors">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">{serviceIcon(a.service)}</div>
                    <div>
                      <p className="text-white text-sm font-medium leading-snug truncate max-w-[140px]">{a.service}</p>
                      <p className="text-white/50 text-xs flex items-center gap-1 mt-0.5"><Car className="w-3 h-3" />{a.vehicle}</p>
                    </div>
                  </div>
                  <StatusBadge status={a.status} />
                </div>
                <div className="flex flex-wrap gap-3 pt-2 border-t border-white/10">
                  <span className="flex items-center gap-1 text-xs text-white/50"><Clock className="w-3.5 h-3.5 text-[#E41E6A]" />{a.time}</span>
                  <span className="flex items-center gap-1 text-xs text-white/50"><Banknote className="w-3.5 h-3.5 text-green-400" />₱{Number(a.deposit).toLocaleString()} paid</span>
                  <button onClick={() => onView(a)} className="ml-auto flex items-center gap-1 text-xs font-medium text-[#E41E6A] hover:text-pink-400 transition-colors"><Eye className="w-3.5 h-3.5" />View</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── BOOK MODAL ───────────────────────────────────────────────────────────────

function BookModal({ onClose, onSave, services, vehicles }: {
  onClose:   () => void;
  onSave:    (data: any) => Promise<void>;
  services:  ServiceItem[];
  vehicles:  Vehicle[];   // ← replaces "vehicle: string"
}) {
  const TIME_OPTIONS = ["8:00 AM","9:00 AM","10:00 AM","10:30 AM","11:00 AM","1:00 PM","2:00 PM","3:00 PM","4:00 PM"];

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [form, setForm] = useState({
    fullName: "", mobileNumber: "", service: "",
    addons: [] as string[],
    vehicleMake: "", vehicleModel: "", vehicleYear: "",
    vehicleClass: "", vehiclePlateNumber: "",
    date: todayStr(), time: "9:00 AM",
    paymentMethod: "", paymentType: "" as "" | "Full Payment" | "Down Payment",
    proofFile: null as File | null, termsAccepted: false, notes: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  // Auto-fill vehicle fields when a saved vehicle is selected
  const handleVehicleSelect = (id: string) => {
    setSelectedVehicleId(id);
    if (!id) return;
    const v = vehicles.find(v => v.id === id);
    if (v) {
      setForm(f => ({
        ...f,
        vehicleMake:        v.brand,
        vehicleModel:       v.model,
        vehicleYear:        v.year,
        vehicleClass:       v.vehicle_class ?? "",// not stored in vehicles table
        vehiclePlateNumber: v.plate_number ?? "",
      }));
    }
  };
  // ── Pricing — uses API service prices directly ────────────────────────────
  const selectedService = services.find(s => s.name === form.service);
  const addonObjects    = DEFAULT_ADDONS.filter(a => form.addons.includes(a.name));
  const baseServiceTotal = selectedService?.price ?? 0;
  const addonsTotal      = addonObjects.reduce((sum, item) => sum + item.price, 0);
  const grandTotal       = baseServiceTotal + addonsTotal;
  const downPaymentAmount = grandTotal > 0 ? Math.max(Math.round(grandTotal * 0.3), 1000) : 0;
  const amountToPayNow   = form.paymentType === "Full Payment" ? grandTotal : form.paymentType === "Down Payment" ? downPaymentAmount : 0;
  const remainingBalance = Math.max(grandTotal - amountToPayNow, 0);

  const isPastDate = form.date < todayStr();
  const yearNum    = Number(form.vehicleYear);
  const validVehicleYear = !!form.vehicleYear && Number.isInteger(yearNum) && yearNum >= 1950 && yearNum <= new Date().getFullYear() + 1;

  const inputCls = "w-full px-4 h-10 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/25 focus:outline-none focus:border-[#E41E6A] focus:ring-1 focus:ring-[#E41E6A]/30 transition-colors text-sm";
  const selCls   = inputCls + " appearance-none";
  const checkCard = (active: boolean) => `flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${active ? "border-[#E41E6A] bg-[#E41E6A]/10" : "border-white/10 bg-white/5 hover:bg-white/10"}`;

  const handleAddonToggle = (name: string) =>
    setForm(f => ({ ...f, addons: f.addons.includes(name) ? f.addons.filter(a => a !== name) : [...f.addons, name] }));

  const handlePaymentTypeChange = (type: "Full Payment" | "Down Payment") =>
    setForm(f => ({ ...f, paymentType: f.paymentType === type ? "" : type }));

  const validateStep1 = () => {
    if (!form.fullName.trim())    { alert("Full name is required."); return false; }
    if (!form.mobileNumber.trim()){ alert("Mobile number is required."); return false; }
    if (!/^(\+63|09)\d{9}$/.test(form.mobileNumber.replace(/\s+/g,""))) { alert("Enter a valid mobile number."); return false; }
    if (!form.vehicleMake.trim()) { alert("Vehicle make is required."); return false; }
    if (!form.vehicleModel.trim()){ alert("Vehicle model is required."); return false; }
    if (!validVehicleYear)        { alert("Enter a valid vehicle year."); return false; }
    if (!form.vehicleClass)       { alert("Please select vehicle size/class."); return false; }
    return true;
  };
  const validateStep2 = () => {
    if (!form.service)            { alert("Please select a service package."); return false; }
    if (!form.date || isPastDate) { alert("Please select a valid appointment date."); return false; }
    if (!form.time)               { alert("Please select a time."); return false; }
    return true;
  };
  const validateStep3 = () => {
    if (!form.paymentMethod) { alert("Please select a payment method."); return false; }
    if (!form.paymentType)   { alert("Please select full payment or down payment."); return false; }
    if (!form.proofFile)     { alert("Please upload proof of payment."); return false; }
    if (!form.termsAccepted) { alert("You must agree to the terms."); return false; }
    return true;
  };

  const goNext = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    if (step < 3) setStep(p => (p + 1) as 1|2|3);
  };
  const goBack = () => { if (step > 1) setStep(p => (p - 1) as 1|2|3); };

  const handleSave = async () => {
    if (!validateStep1() || !validateStep2() || !validateStep3()) return;
    setIsSaving(true);
    try {
      await onSave({ ...form, baseServiceTotal, addonsTotal, grandTotal, amountToPayNow, remainingBalance, deposit: amountToPayNow, status: "Pending Verification" });
      onClose();
    } catch (error: any) {
      alert(`Error: ${error?.message || "Failed to book appointment."}`);
    } finally {
      setIsSaving(false);
    }
  };

  const StepPill = ({ index, title, active, done }: { index:number; title:string; active:boolean; done:boolean }) => (
    <div className="flex items-center gap-2">
      <div className={["w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border transition-colors",
        active ? "bg-[#E41E6A] border-[#E41E6A] text-white" : done ? "bg-green-500/20 border-green-500/30 text-green-400" : "bg-white/5 border-white/10 text-white/50"].join(" ")}>
        {index}
      </div>
      <span className={active ? "text-white text-sm font-semibold" : "text-white/50 text-sm"}>{title}</span>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm" style={{ backgroundColor: "rgba(0,0,0,0.8)" }}>
      <div className="bg-[#0a0a0a] border border-white/10 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <div><h2 className="text-xl font-bold text-white">Book Appointment</h2><p className="text-white/50 text-xs mt-0.5">Submit your booking for admin verification</p></div>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="px-6 pt-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <StepPill index={1} title="Customer & Vehicle" active={step===1} done={step>1} />
            <div className="hidden md:block h-px flex-1 bg-white/10 mx-3" />
            <StepPill index={2} title="Service & Schedule" active={step===2} done={step>2} />
            <div className="hidden md:block h-px flex-1 bg-white/10 mx-3" />
            <StepPill index={3} title="Payment & Submit" active={step===3} done={false} />
          </div>
        </div>

        <div className="p-6 space-y-6">

          {/* ── STEP 1 ── */}
{step === 1 && (
  <div>
    <h3 className="text-white text-sm font-semibold mb-3">Step 1: Customer & Vehicle Information</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-white/70">Full Name <span className="text-red-500">*</span></label>
        <input className={inputCls} value={form.fullName} onChange={e => setForm(f=>({...f,fullName:e.target.value}))} placeholder="Enter your full name" />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-white/70">Mobile Number <span className="text-red-500">*</span></label>
        <input className={inputCls} value={form.mobileNumber} onChange={e => setForm(f=>({...f,mobileNumber:e.target.value}))} placeholder="09xxxxxxxxx" />
      </div>
    </div>

    {/* Vehicle selector */}
    {vehicles.length > 0 && (
      <div className="space-y-1.5 mb-4">
        <label className="text-sm font-medium text-white/70">Select Saved Vehicle</label>
        <select
          className={selCls}
          value={selectedVehicleId}
          onChange={e => handleVehicleSelect(e.target.value)}
        >
          <option value="" className="bg-[#0a0a0a]">— Enter manually or select saved vehicle —</option>
          {vehicles.map(v => (
            <option key={v.id} value={v.id} className="bg-[#0a0a0a]">
              {v.name ? `${v.name} — ` : ""}{v.brand} {v.model} {v.year}{v.plate_number ? ` (${v.plate_number})` : ""}
            </option>
          ))}
        </select>
        {selectedVehicleId && (
          <p className="text-xs text-emerald-400 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />Vehicle details auto-filled below
          </p>
        )}
      </div>
    )}

    {vehicles.length === 0 && (
      <div className="mb-4 p-3 bg-sky-500/10 border border-sky-500/20 rounded-lg">
        <p className="text-sky-400 text-xs">💡 Tip: Add vehicles in your dashboard to pre-fill this form next time.</p>
      </div>
    )}

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-1.5"><label className="text-sm font-medium text-white/70">Vehicle Make <span className="text-red-500">*</span></label><input className={inputCls} value={form.vehicleMake} onChange={e => setForm(f=>({...f,vehicleMake:e.target.value}))} placeholder="Toyota" /></div>
      <div className="space-y-1.5"><label className="text-sm font-medium text-white/70">Vehicle Model <span className="text-red-500">*</span></label><input className={inputCls} value={form.vehicleModel} onChange={e => setForm(f=>({...f,vehicleModel:e.target.value}))} placeholder="Fortuner" /></div>
      <div className="space-y-1.5"><label className="text-sm font-medium text-white/70">Vehicle Year <span className="text-red-500">*</span></label><input type="number" className={inputCls} value={form.vehicleYear} onChange={e => setForm(f=>({...f,vehicleYear:e.target.value}))} placeholder="2022" /></div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-white/70">Vehicle Size/Class <span className="text-red-500">*</span></label>
        <select className={selCls} value={form.vehicleClass} onChange={e => setForm(f=>({...f,vehicleClass:e.target.value}))}>
          <option value="" className="bg-[#0a0a0a]">Select vehicle class...</option>
          {VEHICLE_CLASS_OPTIONS.map(v => <option key={v.value} value={v.value} className="bg-[#0a0a0a]">{v.label}</option>)}
        </select>
      </div>
      <div className="space-y-1.5 md:col-span-2"><label className="text-sm font-medium text-white/70">Vehicle Plate Number</label><input className={inputCls} value={form.vehiclePlateNumber} onChange={e => setForm(f=>({...f,vehiclePlateNumber:e.target.value}))} placeholder="ABC 1234" /></div>
    </div>
  </div>
)}

          {/* ── STEP 2 ── */}
          {step === 2 && (
            <div>
              <h3 className="text-white text-sm font-semibold mb-3">Step 2: Service & Schedule</h3>

              {/* Service — uses live API prices */}
              <div className="space-y-1.5 mb-4">
                <label className="text-sm font-medium text-white/70">Service Package <span className="text-red-500">*</span></label>
                <select className={selCls} value={form.service} onChange={e => setForm(f=>({...f,service:e.target.value}))}>
                  <option value="" className="bg-[#0a0a0a]">Select a service...</option>
                  {services.map(s => (
                    <option key={s.name} value={s.name} className="bg-[#0a0a0a]">
                      {s.name} — {formatMoney(s.price)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 mb-6">
                <label className="text-sm font-medium text-white/70">Add-ons</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {DEFAULT_ADDONS.map(addon => {
                    const active = form.addons.includes(addon.name);
                    return (
                      <button type="button" key={addon.name} onClick={() => handleAddonToggle(addon.name)} className={checkCard(active)}>
                        <span className="text-left"><span className="block text-sm font-medium text-white">{addon.name}</span><span className="block text-xs text-white/50">{formatMoney(addon.price)}</span></span>
                        <span className={`w-4 h-4 rounded border ${active ? "bg-[#E41E6A] border-[#E41E6A]" : "border-white/20"}`} />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5"><label className="text-sm font-medium text-white/70">Date <span className="text-red-500">*</span></label><input type="date" min={todayStr()} className={`${inputCls} [color-scheme:dark]`} value={form.date} onChange={e => setForm(f=>({...f,date:e.target.value}))} /></div>
                <div className="space-y-1.5"><label className="text-sm font-medium text-white/70">Time <span className="text-red-500">*</span></label>
                  <select className={selCls} value={form.time} onChange={e => setForm(f=>({...f,time:e.target.value}))}>
                    {TIME_OPTIONS.map(t => <option key={t} value={t} className="bg-[#0a0a0a]">{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <p className="text-sm font-semibold text-white">Current Summary</p>
                <div className="flex justify-between text-xs text-white/60"><span>Base service</span><span>{formatMoney(baseServiceTotal)}</span></div>
                <div className="flex justify-between text-xs text-white/60"><span>Add-ons</span><span>{formatMoney(addonsTotal)}</span></div>
                <div className="flex justify-between text-sm text-white font-semibold pt-2 border-t border-white/10"><span>Total Amount</span><span>{formatMoney(grandTotal)}</span></div>
              </div>
            </div>
          )}

          {/* ── STEP 3 ── */}
          {step === 3 && (
            <div>
              <h3 className="text-white text-sm font-semibold mb-3">Step 3: Payment & Submit</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-white/70">Payment Method <span className="text-red-500">*</span></label>
                  <select className={selCls} value={form.paymentMethod} onChange={e => setForm(f=>({...f,paymentMethod:e.target.value}))}>
                    <option value="" className="bg-[#0a0a0a]">Select payment method...</option>
                    <option value="Bank Transfer" className="bg-[#0a0a0a]">Bank Transfer</option>
                    <option value="QR Payment" className="bg-[#0a0a0a]">QR Payment</option>
                  </select>
                </div>
              </div>

              {form.paymentMethod === "Bank Transfer" && (
                <div className="mb-4 rounded-xl border border-violet-500/20 bg-violet-500/10 p-4 space-y-3">
                  <div><p className="text-sm font-semibold text-white">Bank Transfer Details</p><p className="text-xs text-white/50 mt-1">Transfer the exact amount, then upload your proof of payment below.</p></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[["Bank Name","BDO"],["Account Name","Ceramic Pro Davao"],["Account Number","1234 5678 9012"],["Reference", form.fullName ? `${form.fullName} - ${form.date}` : "Use your full name"]].map(([l,v]) => (
                      <div key={l} className="rounded-lg bg-white/5 border border-white/10 p-3"><p className="text-[11px] uppercase tracking-wide text-white/40">{l}</p><p className="text-sm font-medium text-white mt-1">{v}</p></div>
                    ))}
                  </div>
                  <p className="text-xs text-violet-200/80">Make sure the account name and number are correct before sending payment.</p>
                </div>
              )}

              {form.paymentMethod === "QR Payment" && (
                <div className="mb-4 rounded-xl border border-sky-500/20 bg-sky-500/10 p-4 space-y-3">
                  <div><p className="text-sm font-semibold text-white">QR Payment</p><p className="text-xs text-white/50 mt-1">Scan the QR code below, send the payment, then upload your proof of payment.</p></div>
                  <div className="flex flex-col items-center justify-center rounded-xl bg-white p-4 border border-white/10">
                    <img src="/images/payment-qr.png" alt="QR Payment" className="w-56 h-56 object-contain" />
                    <p className="text-xs text-gray-600 mt-3 text-center">Scan this QR code using your banking or e-wallet app.</p>
                  </div>
                  <p className="text-xs text-sky-200/80">After payment, please upload a clear screenshot or receipt as proof.</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                <button type="button" onClick={() => handlePaymentTypeChange("Full Payment")} className={checkCard(form.paymentType === "Full Payment")}>
                  <span className="text-sm font-medium text-white">Full Payment</span>
                  <span className={`w-4 h-4 rounded border ${form.paymentType === "Full Payment" ? "bg-[#E41E6A] border-[#E41E6A]" : "border-white/20"}`} />
                </button>
                <button type="button" onClick={() => handlePaymentTypeChange("Down Payment")} className={checkCard(form.paymentType === "Down Payment")}>
                  <span className="text-sm font-medium text-white">Down Payment</span>
                  <span className={`w-4 h-4 rounded border ${form.paymentType === "Down Payment" ? "bg-[#E41E6A] border-[#E41E6A]" : "border-white/20"}`} />
                </button>
              </div>

              <div className="space-y-1.5 mb-4">
                <label className="text-sm font-medium text-white/70">Deposit Proof Upload <span className="text-red-500">*</span></label>
                <input type="file" accept="image/*,.pdf" className={`${inputCls} py-2 h-auto`} onChange={e => setForm(f=>({...f,proofFile:e.target.files?.[0]??null}))} />
                {form.proofFile && <p className="text-xs text-white/50">{form.proofFile.name}</p>}
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2 mb-4">
                <p className="text-sm font-semibold text-white">Booking Summary</p>
                {[
                  ["Customer", form.fullName||"—"],
                  ["Vehicle", [form.vehicleMake,form.vehicleModel,form.vehicleClass].filter(Boolean).join(" ")||"—"],
                  ["Service", form.service||"—"],
                  ["Schedule", form.date?`${form.date} ${form.time}`:"—"],
                ].map(([l,v]) => <div key={l} className="flex justify-between text-xs text-white/60"><span>{l}</span><span>{v}</span></div>)}
                <div className="flex justify-between text-xs text-white/60"><span>Base service</span><span>{formatMoney(baseServiceTotal)}</span></div>
                <div className="flex justify-between text-xs text-white/60"><span>Add-ons</span><span>{formatMoney(addonsTotal)}</span></div>
                <div className="flex justify-between text-sm text-white font-semibold pt-2 border-t border-white/10"><span>Total Amount</span><span>{formatMoney(grandTotal)}</span></div>
                <div className="flex justify-between text-xs text-white/60"><span>Payment Type</span><span>{form.paymentType||"—"}</span></div>
                <div className="flex justify-between text-sm text-[#E41E6A] font-semibold"><span>Amount to Pay Now</span><span>{formatMoney(amountToPayNow)}</span></div>
                <div className="flex justify-between text-xs text-yellow-400"><span>Remaining Balance</span><span>{formatMoney(remainingBalance)}</span></div>
              </div>

              <p className="text-xs text-yellow-300/80 mb-4">Submitting this booking does not automatically confirm your appointment. All bookings are subject to payment verification and admin approval.</p>

              <div className="space-y-2 mb-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.termsAccepted} onChange={e => setForm(f=>({...f,termsAccepted:e.target.checked}))} className="mt-1" />
                  <span className="text-sm text-white/70">I agree to the booking terms, payment policy, and appointment confirmation process.</span>
                </label>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-white/70">Additional Notes</label>
                <textarea className={`${inputCls} resize-none h-20 py-2.5`} placeholder="Any special requests..." value={form.notes} onChange={e => setForm(f=>({...f,notes:e.target.value}))} />
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-white/10 bg-white/5 flex justify-between gap-3">
          <div>{step > 1 && <button onClick={goBack} className="px-4 py-2 text-sm font-medium border border-white/10 text-white hover:bg-white/10 rounded-lg transition-colors">Back</button>}</div>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium border border-white/10 text-white hover:bg-white/10 rounded-lg transition-colors">Cancel</button>
            {step < 3
              ? <button onClick={goNext} className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#E41E6A] to-pink-600 hover:from-[#c41559] rounded-lg shadow-md shadow-[#E41E6A]/25 transition-all">Next</button>
              : <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#E41E6A] to-pink-600 hover:from-[#c41559] rounded-lg shadow-md shadow-[#E41E6A]/25 transition-all disabled:opacity-50">{isSaving ? "Submitting..." : "Submit Booking"}</button>
            }
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── VIEW MODAL ───────────────────────────────────────────────────────────────

function ViewModal({ appt, onClose }: { appt: Appointment; onClose: () => void }) {
  const Row = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
    <div className="p-3 bg-white/5 rounded-lg border border-white/10 flex items-start gap-3">
      <div className="mt-0.5 text-[#E41E6A] flex-shrink-0">{icon}</div>
      <div><p className="text-white/50 text-xs">{label}</p><p className="text-white text-sm font-medium mt-0.5">{value}</p></div>
    </div>
  );
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm" style={{ backgroundColor: "rgba(0,0,0,0.8)" }}>
      <div className="bg-[#0a0a0a] border border-white/10 rounded-xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <div><h2 className="text-xl font-bold text-white">Appointment Details</h2><p className="text-white/50 text-xs mt-0.5">{formatShort(appt.date)}</p></div>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-3">
          <Row icon={<Shield  className="w-4 h-4" />} label="Service"     value={appt.service} />
          <Row icon={<Car     className="w-4 h-4" />} label="Vehicle"     value={appt.vehicle} />
          <Row icon={<Calendar className="w-4 h-4" />} label="Date"       value={formatShort(appt.date)} />
          <Row icon={<Clock   className="w-4 h-4" />} label="Time"        value={appt.time} />
          <Row icon={<Banknote className="w-4 h-4" />} label="Amount Paid" value={`₱${Number(appt.deposit).toLocaleString()}`} />
          {appt.notes && <Row icon={<Eye className="w-4 h-4" />} label="Notes" value={appt.notes} />}
          <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-3">
            <p className="text-yellow-300 text-xs">Appointment submission is subject to payment verification and admin approval.</p>
          </div>
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
  const { profile, isLoading: profileLoading } = useAuth();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services,     setServices]     = useState<ServiceItem[]>([]);  // ← ServiceItem[] not string[]
  const [isLoading,    setIsLoading]    = useState(true);
  const [selected,     setSelected]     = useState(today);
  const [search,       setSearch]       = useState("");
  const [filterStatus, setFilterStatus] = useState<"All" | string>("All");
  const [showBook,     setShowBook]     = useState(false);
  const [viewAppt,     setViewAppt]     = useState<Appointment | null>(null);
  const [vehicles,     setVehicles]     = useState<Vehicle[]>([]);

  const todayDisplay = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

// Fetch services independently — doesn't need customer profile
useEffect(() => {
  getServices()
    .then(raw => setServices(
      raw.length > 0
        ? raw.map((s: any) => ({ name: s.name, price: Number(s.price ?? 0) }))
        : DEFAULT_SERVICES
    ))
    .catch(() => setServices(DEFAULT_SERVICES));
}, []);

// Fetch appointments only when customer profile is ready
useEffect(() => {
  if (profile?.customerId) {
    fetchData();
    getVehicles(profile.customerId).then(setVehicles).catch(() => {});
  }
}, [profile?.customerId]);
  const fetchData = async () => {
    if (!profile?.customerId) return;
    setIsLoading(true);
    try {
      const rawAppts = await getCustomerAppointments(profile.customerId).catch(() => []);

      setAppointments(rawAppts.map(normalizeAppointment));

      // ── Use full service objects {name, price} from API ──────────────────
      // Falls back to DEFAULT_SERVICES only if API returns nothing
      // services fetched separately above
    } catch (err) {
      console.error("CustomerAppointments fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBook = async (data: any) => {
    if (!profile?.customerId) return;

    const [time, meridiem] = data.time.split(" ");
    const [h, m] = time.split(":").map(Number);
    let hour = h;
    if (meridiem === "PM" && h !== 12) hour += 12;
    if (meridiem === "AM" && h === 12) hour = 0;

    const payload = {
      customerId:         profile.customerId,
      service:            data.service,
      date:               data.date,
      time:               `${String(hour).padStart(2,"0")}:${String(m).padStart(2,"0")}`,
      totalAmount:        data.grandTotal || data.deposit || 0,
      deposit:            data.amountToPayNow || 0,
      paymentMethod:      data.paymentMethod,
      paymentType:        data.paymentType,
      status:             "Pending Verification",
      notes:              data.notes,
      fullName:           data.fullName,
      mobileNumber:       data.mobileNumber,
      vehicleMake:        data.vehicleMake,
      vehicleModel:       data.vehicleModel,
      vehicleYear:        data.vehicleYear,
      vehicleClass:       data.vehicleClass,
      vehiclePlateNumber: data.vehiclePlateNumber,
      addons:             data.addons,
      remainingBalance:   data.remainingBalance,
      proofFile:          data.proofFile,
    };

    await createAppointment(payload);

    await fetch(`${import.meta.env.VITE_API_BASE_URL}/customers/${profile.customerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vehicle:       [data.vehicleMake, data.vehicleModel, data.vehicleClass].filter(Boolean).join(" "),
        full_name:     data.fullName,
        mobile_number: data.mobileNumber,
      }),
    });

    await fetchData();
  };

  const dotDates = useMemo(() => {
    const map: Record<string, string[]> = {};
    appointments.forEach(a => { if (!map[a.date]) map[a.date] = []; map[a.date].push(a.status); });
    return map;
  }, [appointments]);

  const forSelected = useMemo(() => appointments.filter(a => a.date === selected), [appointments, selected]);

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

  const customerVehicle = appointments[0]?.vehicle ?? "";

  if (profileLoading) {
    return <div className="flex items-center justify-center h-40 text-white/50">Loading profile...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-white text-3xl font-bold mb-1">My Appointments</h1><p className="text-white/60 text-sm">{todayDisplay}</p></div>
        <button onClick={() => setShowBook(true)}
          className="self-start sm:self-auto inline-flex items-center gap-2 bg-gradient-to-r from-[#E41E6A] to-pink-600 hover:from-[#c41559] text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-[#E41E6A]/25 transition-all">
          <Plus className="w-4 h-4" />New Appointment
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
          <input type="text" placeholder="Search appointments..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#E41E6A] focus:ring-1 focus:ring-[#E41E6A]/30 transition-colors" />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <SlidersHorizontal className="w-4 h-4 text-white/40 flex-shrink-0" />
          {(["All","Pending Verification","Confirmed","Pending","Completed","Rejected"] as const).map(f => (
            <button key={f} onClick={() => setFilterStatus(f)}
              className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-colors ${filterStatus===f ? "bg-[#E41E6A] text-white border-[#E41E6A]" : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white"}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

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

      <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur overflow-hidden" style={{ borderRadius: "12px" }}>
        <CardHeader className="border-b border-white/10 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">All Appointments</CardTitle>
            <span className="text-white/40 text-xs">{filtered.length} record{filtered.length!==1?"s":""}</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="sm:hidden divide-y divide-white/5">
            {filtered.length === 0 ? (
              <div className="py-12 flex flex-col items-center text-center"><CalendarX className="w-8 h-8 text-white/20 mb-2" /><p className="text-white/50 text-sm">No appointments found.</p></div>
            ) : filtered.map(a => (
              <div key={a.id} className="p-4 hover:bg-white/5 transition-colors">
                <div className="flex items-start justify-between mb-2"><p className="text-white text-sm font-semibold max-w-[60%] leading-snug">{a.service}</p><StatusBadge status={a.status} /></div>
                <p className="text-white/50 text-xs flex items-center gap-1 mb-1"><Car className="w-3 h-3" />{a.vehicle}</p>
                <p className="text-white/50 text-xs flex items-center gap-1 mb-2"><Calendar className="w-3 h-3 text-[#E41E6A]" />{formatShort(a.date)} · {a.time}</p>
                <button onClick={() => setViewAppt(a)} className="flex items-center gap-1 text-xs font-medium text-[#E41E6A] hover:text-pink-400 transition-colors"><Eye className="w-3.5 h-3.5" />View</button>
              </div>
            ))}
          </div>
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  {["Date","Service","Vehicle","Paid","Status","Actions"].map(h => <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-white/50 uppercase tracking-wide">{h}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12 text-white/40"><CalendarX className="w-8 h-8 mx-auto mb-2 text-white/20" />No appointments found.</td></tr>
                ) : filtered.map(a => (
                  <tr key={a.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-5 py-3.5"><p className="text-white text-xs font-medium">{formatShort(a.date)}</p><p className="text-white/40 text-xs">{a.time}</p></td>
                    <td className="px-5 py-3.5"><div className="flex items-center gap-2"><div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">{serviceIcon(a.service)}</div><span className="text-white text-sm font-medium max-w-[180px] truncate">{a.service}</span></div></td>
                    <td className="px-5 py-3.5 text-white/60 text-sm whitespace-nowrap">{a.vehicle}</td>
                    <td className="px-5 py-3.5 text-green-400 text-sm font-semibold whitespace-nowrap">₱{Number(a.deposit).toLocaleString()}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={a.status} /></td>
                    <td className="px-5 py-3.5"><button onClick={() => setViewAppt(a)} className="flex items-center gap-1 text-xs font-medium text-[#E41E6A] hover:text-pink-400 transition-colors"><Eye className="w-3.5 h-3.5" />View</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {showBook && <BookModal onClose={() => setShowBook(false)} onSave={handleBook} services={services} vehicles={vehicles} />}
      {viewAppt  && <ViewModal appt={viewAppt} onClose={() => setViewAppt(null)} />}
    </div>
  );
}

export default CustomerAppointments;