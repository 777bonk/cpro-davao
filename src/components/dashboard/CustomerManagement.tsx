import { useState, useEffect, useMemo } from "react";
import {
  Search, Plus, X, User, Phone, Car, Clock,
  Eye, ChevronDown, ChevronUp, SlidersHorizontal,
  UserCheck, Calendar, Archive, TrendingUp, Edit2,
  Shield, Layers, Sparkles, Wrench, CheckCircle,
  Mail, Hash, CarFront, Trash2, Palette,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../dashboard-ui/card";
import { Button } from "../dashboard-ui/button";
import { Badge } from "../dashboard-ui/badge";
import {
  getCustomers, createCustomer, updateCustomer, Customer,
} from "../../services/customer";
import {
  getVehicles, createVehicle, updateVehicle, deleteVehicle, Vehicle,
} from "../../services/vehicles";

// VehicleForm = Vehicle without id, user_id, created_at
type VehicleForm = Omit<Vehicle, 'id' | 'user_id' | 'created_at'>;

// Display helper
function vehicleDisplayName(v: Vehicle): string {
  return [v.year, v.brand, v.model, v.vehicle_class].filter(Boolean).join(" ");
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const VEHICLE_CLASS_OPTIONS = [
  "Sedan","Hatchback","Crossover","SUV","Pickup","Van","MPV","Full-size SUV",
  "Scooter","Underbone","Small Displacement Motorcycle","Naked Bike",
  "Sport Bike","Cruiser","Adventure Bike","Big Bike",
];

const SERVICE_CATALOG = [
  { name: "Ceramic Coating - Full Body", price: 12000 },
  { name: "Ceramic Coating - Partial",   price: 7000  },
  { name: "PPF - Hood & Fenders",        price: 15000 },
  { name: "PPF - Full Body",             price: 65000 },
  { name: "Window Tinting - Full Car",   price: 5000  },
  { name: "Full Interior Detailing",     price: 3500  },
  { name: "Nano Ceramic Spray",          price: 2500  },
  { name: "Paint Decontamination",       price: 3000  },
];

const DEFAULT_ADDONS = [
  { name: "Glass Coating",        price: 1500 },
  { name: "Wheel Coating",        price: 2000 },
  { name: "Engine Bay Detailing", price: 1200 },
];

const TIME_OPTIONS = [
  "8:00 AM","9:00 AM","10:00 AM","10:30 AM",
  "11:00 AM","1:00 PM","2:00 PM","3:00 PM","4:00 PM",
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function formatDate(dateStr?: string | null) {
  if (!dateStr || dateStr === "N/A" || dateStr.trim() === "") return "N/A";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "N/A";
  return d.toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" });
}

function formatMoney(val: any) {
  return `₱${Number(val || 0).toLocaleString()}`;
}

function initials(name: string) {
  return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
}

function avatarColor(id: string | number) {
  const COLORS = [
    "from-[#E41E6A] to-pink-400","from-sky-500 to-blue-400",
    "from-violet-500 to-purple-400","from-emerald-500 to-green-400",
    "from-amber-500 to-orange-400",
  ];
  const n = typeof id === "string"
    ? id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)
    : Number(id);
  return COLORS[n % COLORS.length];
}

// ─── SHARED STYLES ────────────────────────────────────────────────────────────

const inputCls = "w-full px-4 h-10 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/25 focus:outline-none focus:border-[#E41E6A] focus:ring-1 focus:ring-[#E41E6A]/30 transition-colors text-sm";
const selCls   = inputCls + " appearance-none pr-8";

function ModalWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm"
      style={{ backgroundColor: "rgba(0,0,0,0.85)" }}>
      {children}
    </div>
  );
}

function StatusBadge({ status }: { status?: string | null }) {
  const isActive = (status ?? "Active") === "Active";
  return (
    <Badge className={isActive
      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
      : "bg-white/10 text-white/50 border border-white/20"}>
      {status || "Active"}
    </Badge>
  );
}

function Field({ label, required, error, children }: {
  label: string; required?: boolean; error?: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-white/70 block">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}

// ─── VEHICLE FORM FIELDS ──────────────────────────────────────────────────────

function VehicleFormFields({ v, onChange }: {
  v: VehicleForm;
  onChange: (updated: VehicleForm) => void;
}) {
  const set = (key: keyof VehicleForm, val: string) => onChange({ ...v, [key]: val });
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field label="Brand / Make" required>
        <input className={inputCls} placeholder="Toyota" value={v.brand} onChange={e => set("brand", e.target.value)} />
      </Field>
      <Field label="Model" required>
        <input className={inputCls} placeholder="Fortuner" value={v.model} onChange={e => set("model", e.target.value)} />
      </Field>
      <Field label="Year" required>
        <input type="number" className={inputCls} placeholder="2022" value={v.year} onChange={e => set("year", e.target.value)} />
      </Field>
      <Field label="Vehicle Size/Class" required>
        <div className="relative">
          <select className={selCls} value={v.vehicle_class ?? ""} onChange={e => set("vehicle_class", e.target.value)}>
            <option value="" className="bg-[#0a0a0a]">Select class...</option>
            {VEHICLE_CLASS_OPTIONS.map(c => <option key={c} value={c} className="bg-[#0a0a0a]">{c}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
        </div>
      </Field>
      <Field label="Plate Number">
        <input className={inputCls} placeholder="ABC 1234" value={v.plate_number ?? ""} onChange={e => set("plate_number", e.target.value)} />
      </Field>
      <Field label="Color">
        <input className={inputCls} placeholder="Pearl White" value={v.color ?? ""} onChange={e => set("color", e.target.value)} />
      </Field>
      <div className="md:col-span-2">
        <Field label="Vehicle Name (optional)">
          <input className={inputCls} placeholder='e.g. "My Fortuner"' value={v.name ?? ""} onChange={e => set("name", e.target.value)} />
        </Field>
      </div>
    </div>
  );
}

// ─── ADD VEHICLE MODAL ────────────────────────────────────────────────────────

function AddVehicleModal({ customers, onClose, onSave }: {
  customers: Customer[];
  onClose: () => void;
  onSave: (customerId: string, vehicle: VehicleForm) => Promise<void>;
}) {
  const [selectedId, setSelectedId] = useState("");
  const [vehicle,    setVehicle]    = useState<VehicleForm>({ brand: "", model: "", year: "", plate_number: "", color: "", vehicle_class: "", name: "" });
  const [isSaving,   setIsSaving]   = useState(false);
  const [error,      setError]      = useState("");

  const handleSave = async () => {
    setError("");
    if (!selectedId)             { setError("Please select a customer."); return; }
    if (!vehicle.brand.trim())   { setError("Brand / Make is required."); return; }
    if (!vehicle.model.trim())   { setError("Model is required."); return; }
    if (!vehicle.year)           { setError("Year is required."); return; }
    if (!vehicle.vehicle_class)  { setError("Vehicle class is required."); return; }
    setIsSaving(true);
    try {
      await onSave(selectedId, vehicle);
      onClose();
    } catch (e: any) { setError(e?.message ?? "Failed to add vehicle."); }
    finally { setIsSaving(false); }
  };

  const selected = customers.find(c => c.id === selectedId);

  return (
    <ModalWrapper>
      <div className="bg-[#0a0a0a] border border-white/10 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white">Add Vehicle</h2>
            <p className="text-white/50 text-xs mt-0.5">Attach a new vehicle to an existing customer</p>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-5">
          <Field label="Select Customer" required>
            <div className="relative">
              <select className={selCls} value={selectedId} onChange={e => setSelectedId(e.target.value)}>
                <option value="" className="bg-[#0a0a0a]">Choose a customer...</option>
                {customers.filter(c => c.status === "Active").map(c => (
                  <option key={c.id} value={c.id} className="bg-[#0a0a0a]">{c.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
            </div>
          </Field>

          {selected && (
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
              <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${avatarColor(selected.id)} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                {initials(selected.name)}
              </div>
              <div>
                <p className="text-white text-sm font-semibold">{selected.name}</p>
                <p className="text-white/50 text-xs">{selected.contact || "No contact"}</p>
              </div>
            </div>
          )}

          <div className="pt-1 border-t border-white/10">
            <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-4">Vehicle Details</p>
            <VehicleFormFields v={vehicle} onChange={setVehicle} />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              <X className="w-4 h-4 flex-shrink-0" />{error}
            </div>
          )}
        </div>
        <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium border border-white/10 text-white hover:bg-white/10 rounded-lg transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={isSaving}
            className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#E41E6A] to-pink-600 hover:from-[#c41559] rounded-lg shadow-md shadow-[#E41E6A]/25 transition-all disabled:opacity-50">
            {isSaving ? "Saving..." : "Add Vehicle"}
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
}

// ─── ADD CUSTOMER MODAL ───────────────────────────────────────────────────────

function AddCustomerModal({ onClose, onSave }: {
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}) {
  const [step,     setStep]     = useState<1 | 2>(1);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    name: "", contact: "", email: "", status: "Active" as "Active" | "Inactive",
    service: "", addons: [] as string[], date: todayStr(), time: "9:00 AM", notes: "",
  });
  const [vehicle, setVehicle] = useState<VehicleForm>({
    brand: "", model: "", year: "", plate_number: "", color: "", vehicle_class: "", name: "",
  });

  const selectedSvc = SERVICE_CATALOG.find(s => s.name === form.service);
  const addonObjs   = DEFAULT_ADDONS.filter(a => form.addons.includes(a.name));
  const grandTotal  = (selectedSvc?.price ?? 0) + addonObjs.reduce((s, a) => s + a.price, 0);

  const toggleAddon = (name: string) =>
    setForm(f => ({ ...f, addons: f.addons.includes(name) ? f.addons.filter(a => a !== name) : [...f.addons, name] }));

  const validateStep1 = () => {
    if (!form.name.trim())   { alert("Full name is required."); return false; }
    if (!form.contact.trim()){ alert("Contact number is required."); return false; }
    if (!/^(\+63|09)\d{9}$/.test(form.contact.replace(/\s+/g,""))) { alert("Enter a valid PH mobile number."); return false; }
    if (!vehicle.brand.trim()) { alert("Vehicle brand is required."); return false; }
    if (!vehicle.model.trim()) { alert("Vehicle model is required."); return false; }
    if (!vehicle.year)         { alert("Vehicle year is required."); return false; }
    if (!vehicle.vehicle_class){ alert("Please select vehicle size/class."); return false; }
    return true;
  };

  const validateStep2 = () => {
    if (!form.service)                       { alert("Please select a service package."); return false; }
    if (!form.date || form.date < todayStr()) { alert("Please select a valid future date."); return false; }
    return true;
  };

  const handleSave = async () => {
    if (!validateStep1() || !validateStep2()) return;
    setIsSaving(true);
    try {
      await onSave({
        name: form.name.trim(), contact: form.contact.trim(), email: form.email.trim(),
        // Pass a combined vehicle string for the legacy vehicle field
        vehicle: [vehicle.year, vehicle.brand, vehicle.model, vehicle.vehicle_class].filter(Boolean).join(" "),
        vehicleForm: vehicle,
        status: form.status, service: form.service, addons: form.addons,
        date: form.date, time: form.time, notes: form.notes, grandTotal,
      });
      onClose();
    } catch (err: any) { alert(`Error: ${err?.message || "Failed to register customer."}`); }
    finally { setIsSaving(false); }
  };

  const StepPill = ({ index, title, active, done }: { index: number; title: string; active: boolean; done: boolean }) => (
    <div className="flex items-center gap-2">
      <div className={["w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border transition-colors",
        active ? "bg-[#E41E6A] border-[#E41E6A] text-white" : done ? "bg-green-500/20 border-green-500/30 text-green-400" : "bg-white/5 border-white/10 text-white/50"].join(" ")}>
        {done ? <CheckCircle className="w-4 h-4" /> : index}
      </div>
      <span className={active ? "text-white text-sm font-semibold" : "text-white/50 text-sm"}>{title}</span>
    </div>
  );

  return (
    <ModalWrapper>
      <div className="bg-[#0a0a0a] border border-white/10 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <div><h2 className="text-xl font-bold text-white">Register Customer</h2><p className="text-white/50 text-xs mt-0.5">Fill in customer details and first appointment</p></div>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-6 pt-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <StepPill index={1} title="Customer & Vehicle" active={step===1} done={step>1} />
            <div className="hidden md:block h-px flex-1 bg-white/10 mx-3" />
            <StepPill index={2} title="Service & Schedule" active={step===2} done={false} />
          </div>
        </div>
        <div className="p-6 space-y-5">
          {step === 1 && (
            <div className="space-y-5">
              <h3 className="text-white text-sm font-semibold">Step 1: Customer & Vehicle Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Full Name" required><input className={inputCls} placeholder="Juan dela Cruz" value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} /></Field>
                <Field label="Contact Number" required><input className={inputCls} placeholder="09xxxxxxxxx" value={form.contact} onChange={e => setForm(f=>({...f,contact:e.target.value}))} /></Field>
                <div className="md:col-span-2"><Field label="Email Address"><input className={inputCls} placeholder="email@example.com" value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))} /></Field></div>
              </div>
              <div className="pt-2 border-t border-white/10">
                <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-4">Vehicle Information</p>
                <VehicleFormFields v={vehicle} onChange={setVehicle} />
                <div className="mt-4">
                  <Field label="Status">
                    <div className="relative">
                      <select className={selCls} value={form.status} onChange={e => setForm(f=>({...f,status:e.target.value as "Active"|"Inactive"}))}>
                        <option value="Active" className="bg-[#0a0a0a]">Active</option>
                        <option value="Inactive" className="bg-[#0a0a0a]">Inactive</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                    </div>
                  </Field>
                </div>
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-5">
              <h3 className="text-white text-sm font-semibold">Step 2: Service & Schedule</h3>
              <Field label="Service Package" required>
                <select className={selCls} value={form.service} onChange={e => setForm(f=>({...f,service:e.target.value}))}>
                  <option value="" className="bg-[#0a0a0a]">Select a service...</option>
                  {SERVICE_CATALOG.map(s => <option key={s.name} value={s.name} className="bg-[#0a0a0a]">{s.name} — {formatMoney(s.price)}</option>)}
                </select>
              </Field>
              <div>
                <label className="text-sm font-medium text-white/70 block mb-2">Add-ons</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {DEFAULT_ADDONS.map(addon => {
                    const active = form.addons.includes(addon.name);
                    return (
                      <button type="button" key={addon.name} onClick={() => toggleAddon(addon.name)}
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${active ? "border-[#E41E6A] bg-[#E41E6A]/10" : "border-white/10 bg-white/5 hover:bg-white/10"}`}>
                        <span className="text-left"><span className="block text-sm font-medium text-white">{addon.name}</span><span className="block text-xs text-white/50">{formatMoney(addon.price)}</span></span>
                        <span className={`w-4 h-4 rounded border ${active ? "bg-[#E41E6A] border-[#E41E6A]" : "border-white/20"}`} />
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Date" required><input type="date" min={todayStr()} className={`${inputCls} [color-scheme:dark]`} value={form.date} onChange={e => setForm(f=>({...f,date:e.target.value}))} /></Field>
                <Field label="Time" required>
                  <select className={selCls} value={form.time} onChange={e => setForm(f=>({...f,time:e.target.value}))}>
                    {TIME_OPTIONS.map(t => <option key={t} value={t} className="bg-[#0a0a0a]">{t}</option>)}
                  </select>
                </Field>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <p className="text-sm font-semibold text-white">Booking Summary</p>
                {[
                  ["Customer", form.name||"—"],
                  ["Vehicle",  [vehicle.year,vehicle.brand,vehicle.model].filter(Boolean).join(" ")||"—"],
                  ["Service",  form.service||"—"],
                  ["Schedule", form.date?`${form.date} ${form.time}`:"—"],
                ].map(([l,v]) => (
                  <div key={l} className="flex justify-between text-xs text-white/60"><span>{l}</span><span>{v}</span></div>
                ))}
                <div className="border-t border-white/10 pt-2">
                  <div className="flex justify-between text-sm text-white font-semibold"><span>Total</span><span>{formatMoney(grandTotal)}</span></div>
                </div>
              </div>
              <Field label="Additional Notes"><textarea className={`${inputCls} resize-none h-20 py-2.5`} placeholder="Any special requests..." value={form.notes} onChange={e => setForm(f=>({...f,notes:e.target.value}))} /></Field>
            </div>
          )}
        </div>
        <div className="p-6 border-t border-white/10 bg-white/5 flex justify-between gap-3">
          <div>{step > 1 && <button onClick={() => setStep(1)} className="px-4 py-2 text-sm font-medium border border-white/10 text-white hover:bg-white/10 rounded-lg transition-colors">Back</button>}</div>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium border border-white/10 text-white hover:bg-white/10 rounded-lg transition-colors">Cancel</button>
            {step < 2
              ? <button onClick={() => { if (validateStep1()) setStep(2); }} className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#E41E6A] to-pink-600 hover:from-[#c41559] rounded-lg transition-all">Next</button>
              : <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#E41E6A] to-pink-600 hover:from-[#c41559] rounded-lg transition-all disabled:opacity-50">{isSaving ? "Registering..." : "Register Customer"}</button>
            }
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
}

// ─── EDIT CUSTOMER MODAL ──────────────────────────────────────────────────────

function EditCustomerModal({ customer, onClose, onSave }: {
  customer: Customer; onClose: () => void; onSave: (updated: Customer) => void;
}) {
  const [form, setForm] = useState({
    name:         customer.name         ?? "",
    contact:      customer.contact      ?? customer.phone ?? "",
    email:        customer.email        ?? "",
    vehicle:      customer.vehicle      ?? "",
    last_service: customer.last_service && customer.last_service !== "N/A" ? customer.last_service.split("T")[0] : "",
    total_spent:  String(customer.total_spent ?? "0"),
    status:       (customer.status ?? "Active") as "Active" | "Inactive",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [errors,   setErrors]   = useState<Record<string, string>>({});
  const set = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (form.contact && !/^(\+63|09)\d{9}$/.test(form.contact.replace(/\s+/g, ""))) e.contact = "Enter a valid PH mobile number";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email address";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setIsSaving(true);
    const updated: Customer = {
      ...customer,
      name: form.name.trim(), contact: form.contact.trim(), phone: form.contact.trim(),
      email: form.email.trim(), vehicle: form.vehicle.trim(),
      last_service: form.last_service || null, lastService: form.last_service || null,
      total_spent: parseFloat(form.total_spent) || 0, totalSpent: parseFloat(form.total_spent) || 0,
      status: form.status,
    };
    try {
      await updateCustomer(customer.id, { name: updated.name, contact: updated.contact, email: updated.email, vehicle: updated.vehicle, last_service: updated.last_service, total_spent: updated.total_spent, status: updated.status });
    } catch (err: any) { console.warn("API update failed:", err?.message); }
    finally { onSave(updated); setIsSaving(false); onClose(); }
  };

  const changed = form.name !== (customer.name ?? "") || form.contact !== (customer.contact ?? customer.phone ?? "") || form.status !== (customer.status ?? "Active");

  return (
    <ModalWrapper>
      <div className="bg-[#0a0a0a] border border-white/10 rounded-xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-white/10 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${avatarColor(customer.id)} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>{initials(customer.name)}</div>
            <div><h2 className="text-base font-bold text-white">Edit Customer</h2><p className="text-xs text-white/40 mt-0.5">Updating {customer.name}</p></div>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Full Name" required error={errors.name}>
              <div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" /><input className={`${inputCls} pl-10`} value={form.name} onChange={e => set("name", e.target.value)} /></div>
            </Field>
            <Field label="Contact Number" error={errors.contact}>
              <div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" /><input className={`${inputCls} pl-10`} value={form.contact} onChange={e => set("contact", e.target.value)} /></div>
            </Field>
          </div>
          <Field label="Email" error={errors.email}>
            <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" /><input className={`${inputCls} pl-10`} value={form.email} onChange={e => set("email", e.target.value)} /></div>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Last Service">
              <div className="relative"><Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" /><input type="date" className={`${inputCls} pl-10 [color-scheme:dark]`} value={form.last_service} onChange={e => set("last_service", e.target.value)} /></div>
            </Field>
            <Field label="Total Spent (₱)">
              <div className="relative"><Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" /><input type="number" className={`${inputCls} pl-10`} value={form.total_spent} onChange={e => set("total_spent", e.target.value)} /></div>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {(["Active","Inactive"] as const).map(s => (
              <button key={s} type="button" onClick={() => set("status", s)}
                className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${form.status === s ? s === "Active" ? "border-emerald-500/50 bg-emerald-500/10" : "border-white/20 bg-white/10" : "border-white/10 bg-white/5 hover:bg-white/10"}`}>
                <div className="flex items-center gap-2"><span className={`w-2 h-2 rounded-full ${s === "Active" ? "bg-emerald-400" : "bg-white/30"}`} /><span className={`text-sm font-medium ${form.status === s ? "text-white" : "text-white/50"}`}>{s}</span></div>
                <span className={`w-4 h-4 rounded border transition-colors ${form.status === s ? "bg-[#E41E6A] border-[#E41E6A]" : "border-white/20"}`} />
              </button>
            ))}
          </div>
          {changed && <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20"><p className="text-xs text-amber-300">You have unsaved changes.</p></div>}
        </div>
        <div className="p-6 border-t border-white/10 bg-white/5 flex justify-between items-center gap-3">
          <p className="text-xs text-white/30">ID: {String(customer.id).slice(0,8)}...</p>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium border border-white/10 text-white hover:bg-white/10 rounded-lg transition-colors">Cancel</button>
            <button onClick={handleSave} disabled={isSaving || !changed}
              className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#E41E6A] to-pink-600 hover:from-[#c41559] rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2">
              {isSaving ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</> : <><CheckCircle className="w-3.5 h-3.5" />Save Changes</>}
            </button>
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
}

// ─── DETAIL MODAL ─────────────────────────────────────────────────────────────

function DetailModal({ customer, vehicles, onClose, onEdit }: {
  customer: Customer; vehicles: Vehicle[]; onClose: () => void; onEdit: () => void;
}) {
  const Row = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
    <div className="p-4 bg-white/5 rounded-lg border border-white/10 flex items-start gap-3">
      <div className="mt-0.5 text-[#E41E6A] flex-shrink-0">{icon}</div>
      <div><p className="text-white/50 text-xs">{label}</p><p className="text-white text-sm font-medium mt-0.5">{value}</p></div>
    </div>
  );
  return (
    <ModalWrapper>
      <div className="bg-[#0a0a0a] border border-white/10 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        <div className="p-6 border-b border-white/10 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${avatarColor(customer.id)} flex items-center justify-center text-white text-sm font-bold`}>{initials(customer.name)}</div>
            <div><h2 className="text-lg font-bold text-white">{customer.name}</h2><div className="mt-1"><StatusBadge status={customer.status} /></div></div>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-3">
          <Row icon={<Phone    className="w-4 h-4" />} label="Contact"     value={customer.contact||customer.phone||"No contact"} />
          <Row icon={<Mail     className="w-4 h-4" />} label="Email"       value={customer.email||"No email"} />
          <Row icon={<Clock    className="w-4 h-4" />} label="Last Service" value={formatDate(customer.last_service)} />
          <Row icon={<Calendar className="w-4 h-4" />} label="Registered"  value={formatDate(customer.created_at)} />
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-4 bg-[#E41E6A]/10 rounded-lg border border-[#E41E6A]/20 text-center">
              <p className="text-white/50 text-xs">Total Spent</p>
              <p className="text-[#E41E6A] text-xl font-bold mt-1">{formatMoney(customer.total_spent)}</p>
            </div>
            <div className="p-4 bg-white/5 rounded-lg border border-white/10 text-center">
              <p className="text-white/50 text-xs">Vehicles</p>
              <p className="text-white text-xl font-bold mt-1">{vehicles.length}</p>
            </div>
          </div>

          {/* Vehicles list */}
          {vehicles.length > 0 && (
            <div className="pt-2">
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Registered Vehicles</p>
              <div className="space-y-2">
                {vehicles.map(v => (
                  <div key={v.id} className="p-3 bg-white/5 rounded-xl border border-white/10 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#E41E6A]/10 flex items-center justify-center flex-shrink-0">
                      <CarFront className="w-4 h-4 text-[#E41E6A]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      {/* Plate first */}
                      <span className="text-xs font-bold tracking-widest text-white bg-white/10 px-2 py-0.5 rounded">
                        {v.plate_number || "No Plate"}
                      </span>
                      <p className="text-white/70 text-xs mt-1 truncate">{vehicleDisplayName(v)}</p>
                      {v.color && <p className="text-white/30 text-[10px] flex items-center gap-1 mt-0.5"><Palette className="w-3 h-3" />{v.color}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3">
          <button onClick={onEdit} className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-[#E41E6A]/30 text-[#E41E6A] hover:bg-[#E41E6A]/10 rounded-lg transition-colors"><Edit2 className="w-4 h-4" />Edit</button>
          <Button variant="outline" className="border-white/10 text-white" onClick={onClose}>Close</Button>
        </div>
      </div>
    </ModalWrapper>
  );
}

// ─── ARCHIVE MODAL ────────────────────────────────────────────────────────────

function ArchiveModal({ customer, onClose, onConfirm }: {
  customer: Customer; onClose: () => void; onConfirm: () => void;
}) {
  return (
    <ModalWrapper>
      <div className="bg-[#0a0a0a] border border-white/10 rounded-xl w-full max-w-sm shadow-2xl">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Archive Customer</h2>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4"><Archive className="w-6 h-6 text-amber-400" /></div>
          <p className="text-white text-center text-sm leading-relaxed">Archive <span className="font-bold text-[#E41E6A]">{customer.name}</span>? They will be marked <span className="font-semibold text-amber-400">Inactive</span> and can be restored anytime.</p>
        </div>
        <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3">
          <Button variant="outline" className="border-white/10 text-white" onClick={onClose}>Cancel</Button>
          <Button className="bg-amber-500 hover:bg-amber-600 text-white border-none flex items-center gap-2" onClick={onConfirm}><Archive className="w-4 h-4" />Archive</Button>
        </div>
      </div>
    </ModalWrapper>
  );
}

// ─── EXPANDABLE CUSTOMER ROW ──────────────────────────────────────────────────

function CustomerRow({ c, refreshKey, onView, onEdit, onArchive }: {
  c: Customer & { vehicles?: Vehicle[] };
  refreshKey: number;
  onView: () => void; onEdit: () => void; onArchive: () => void;
}) {
  const [expanded,  setExpanded]  = useState(false);
  const [vehicles,  setVehicles]  = useState<Vehicle[]>(c.vehicles ?? []);
  const [loading,   setLoading]   = useState(false);
  const [fetched,   setFetched]   = useState(false);

  // ── Silently fetch on mount so we know the vehicle count immediately ──────
  // This prevents the chevron from showing before we know if there are multiple vehicles
  useEffect(() => {
    let cancelled = false;
    getVehicles(c.id)
      .then(data => {
        if (!cancelled) { setVehicles(data); setFetched(true); }
      })
      .catch(() => { if (!cancelled) setFetched(true); }); // still mark fetched on error
    return () => { cancelled = true; };
  }, [c.id]);

  // ── Re-fetch when a vehicle is added ──────────────────────────────────────
  useEffect(() => {
    if (refreshKey > 0) {
      getVehicles(c.id)
        .then(data => { setVehicles(data); setFetched(true); })
        .catch(err => console.error(err));
    }
  }, [refreshKey]);

  const handleExpand = () => setExpanded(v => !v);

  // Primary vehicle — first in list or parsed from vehicle string
  const primary = vehicles[0];

  return (
    <>
      <tr className={`hover:bg-white/5 transition-colors ${expanded ? "bg-white/[0.03]" : ""}`}>
        {/* Customer */}
        <td className="px-5 py-3.5">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${avatarColor(c.id)} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>{initials(c.name)}</div>
            <div>
              <p className="text-white text-sm font-semibold">{c.name}</p>
              {c.email && <p className="text-white/40 text-xs">{c.email}</p>}
            </div>
          </div>
        </td>
        {/* Contact */}
        <td className="px-5 py-3.5 text-white/70 text-sm whitespace-nowrap">
          <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-white/40"/>{c.contact || c.phone || <span className="text-white/30 italic text-xs">No contact</span>}</span>
        </td>
        {/* Vehicle — plate first, chevron only if multiple */}
        <td className="px-5 py-3.5">
          <div className="flex items-center gap-2">
            <div className="flex flex-col">
              {primary ? (
                <>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-[#E41E6A] bg-[#E41E6A]/10 border border-[#E41E6A]/20 px-2 py-0.5 rounded-md w-fit mb-1">
                    <Hash className="w-3 h-3" />{primary.plate_number || "No Plate"}
                  </span>
                  <span className="text-white/60 text-xs">{vehicleDisplayName(primary)}</span>
                  {/* Vehicle count badge — no dropdown needed */}
                  {fetched && vehicles.length > 1 && (
                    <span className="text-[10px] text-white/30 mt-0.5">+{vehicles.length - 1} more vehicle{vehicles.length - 1 > 1 ? "s" : ""}</span>
                  )}
                </>
              ) : c.vehicle ? (
                <span className="text-white/60 text-xs flex items-center gap-1"><Car className="w-3 h-3 text-white/30" />{c.vehicle}</span>
              ) : (
                <span className="text-white/30 text-xs italic">No vehicle</span>
              )}
            </div>
            {/* Only show chevron if multiple vehicles confirmed */}
            {fetched && vehicles.length > 1 && (
              <button onClick={handleExpand} title={expanded ? "Collapse" : "Show all vehicles"}
                className="ml-1 flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/40 hover:text-white transition-colors flex-shrink-0">
                <span className="text-[10px] font-bold text-white/60">{vehicles.length}</span>
                {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        </td>
        {/* Last Service */}
        <td className="px-5 py-3.5"><span className="text-white/60 text-xs">{formatDate(c.last_service)}</span></td>
        {/* Total Spent */}
        <td className="px-5 py-3.5"><span className="text-white text-sm font-semibold">{formatMoney(c.total_spent)}</span></td>
        {/* Status */}
        <td className="px-5 py-3.5"><StatusBadge status={c.status}/></td>
        {/* Actions — Edit is inside the View modal */}
        <td className="px-5 py-3.5">
          <div className="flex items-center gap-2">
            <button onClick={onView}    className="flex items-center gap-1 text-xs font-medium text-[#E41E6A] hover:text-pink-400 transition-colors"><Eye     className="w-3.5 h-3.5"/>View</button>
            <button onClick={onArchive} className="flex items-center gap-1 text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors"><Archive className="w-3.5 h-3.5"/>Archive</button>
          </div>
        </td>
      </tr>

      {/* ── Expanded vehicles row ── */}
      {expanded && (
        <tr className="bg-white/[0.02]">
          <td colSpan={7} className="px-5 py-4 border-t border-white/5">
            <div className="pl-12">
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-3">Registered Vehicles</p>
              {loading ? (
                <div className="flex items-center gap-2 text-white/40 text-xs">
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin flex-shrink-0" />
                  Loading vehicles...
                </div>
              ) : vehicles.length === 0 ? (
                <p className="text-white/30 text-xs italic">No vehicles linked yet. Use "Add Vehicle" to attach one.</p>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {vehicles.map((v, i) => (
                    <div key={v.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10 min-w-[220px] max-w-[280px]">
                      <div className="w-9 h-9 rounded-xl bg-[#E41E6A]/10 flex items-center justify-center flex-shrink-0">
                        <CarFront className="w-5 h-5 text-[#E41E6A]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        {/* PLATE NUMBER — most unique identifier, shown first */}
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-xs font-bold tracking-widest text-white bg-white/10 border border-white/20 px-2 py-0.5 rounded">
                            {v.plate_number || "No Plate"}
                          </span>
                          {i === 0 && <span className="text-[9px] text-white/30 font-medium">Primary</span>}
                        </div>
                        <p className="text-white/70 text-xs truncate">{vehicleDisplayName(v)}</p>
                        {v.color && (
                          <p className="text-white/30 text-[10px] flex items-center gap-1 mt-0.5">
                            <Palette className="w-3 h-3" />{v.color}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function CustomerManagement() {
  const [customers,       setCustomers]       = useState<Customer[]>([]);
  const [isLoading,       setIsLoading]       = useState(true);
  const [search,          setSearch]          = useState("");
  const [filterStatus,    setFilterStatus]    = useState<"All"|"Active"|"Inactive">("All");
  const [viewCustomer,    setViewCustomer]    = useState<Customer | null>(null);
  const [viewVehicles,    setViewVehicles]    = useState<Vehicle[]>([]);
  const [editCustomer,    setEditCustomer]    = useState<Customer | null>(null);
  const [archiveCustomer, setArchiveCustomer] = useState<Customer | null>(null);
  const [addOpen,         setAddOpen]         = useState(false);
  const [addVehicleOpen,      setAddVehicleOpen]      = useState(false);
  // Increments when a vehicle is added for a customer → forces CustomerRow to re-fetch
  const [vehicleRefreshKeys, setVehicleRefreshKeys] = useState<Record<string, number>>({});

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try { setCustomers(await getCustomers()); }
    catch (err) { console.error("Failed to fetch customers", err); }
    finally { setIsLoading(false); }
  };

  const totalCustomers  = customers.length;
  const activeCustomers = customers.filter(c => c.status === "Active").length;
  const vipCount        = customers.filter(c => Number(c.total_spent) > 150000).length;
  const newThisMonth    = customers.filter(c => {
    if (!c.created_at || c.created_at === "N/A") return false;
    const d = new Date(c.created_at), now = new Date();
    return !isNaN(d.getTime()) && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const filtered = useMemo(() =>
    customers
      .filter(c => filterStatus === "All" || c.status === filterStatus)
      .filter(c => {
        const q = search.toLowerCase();
        return c.name.toLowerCase().includes(q) || (c.contact??"").toLowerCase().includes(q) ||
          (c.phone??"").toLowerCase().includes(q) || (c.vehicle??"").toLowerCase().includes(q) ||
          (c.email??"").toLowerCase().includes(q);
      })
      .sort((a, b) => a.name.localeCompare(b.name)),
    [customers, search, filterStatus]
  );

  const handleAdd = async (data: any) => {
    // 1. Create the customer
    const created = await createCustomer({
      name: data.name, contact: data.contact, email: data.email,
      vehicle: data.vehicle, status: data.status,
    });
    // 2. Create their first vehicle linked to the customer's id
    if (data.vehicleForm && created.id) {
      try {
        await createVehicle(created.id, data.vehicleForm);
      } catch (err) {
        console.warn("Vehicle creation failed:", err);
      }
    }
    setCustomers(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
  };

  const handleAddVehicle = async (customerId: string, vehicle: VehicleForm) => {
    await createVehicle(customerId, vehicle);
    // Increment refresh key for this customer so CustomerRow re-fetches vehicles
    setVehicleRefreshKeys(prev => ({ ...prev, [customerId]: (prev[customerId] ?? 0) + 1 }));
  };

  const handleViewCustomer = async (c: Customer) => {
    setViewCustomer(c);
    try {
      const vehicles = await getVehicles(c.id);
      setViewVehicles(vehicles);
    } catch { setViewVehicles([]); }
  };

  const handleEdit    = (updated: Customer) => setCustomers(prev => prev.map(c => c.id === updated.id ? updated : c));
  const handleArchive = (id: string) => { setCustomers(prev => prev.map(c => c.id === id ? { ...c, status: "Inactive" } : c)); setArchiveCustomer(null); setViewCustomer(null); };

  return (
    <div className="space-y-6 w-full">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-white text-3xl font-bold mb-1">Customer Management</h1>
          <p className="text-white/60 text-sm">Manage your customer database and vehicle information</p>
        </div>
        {/* TWO BUTTONS */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button onClick={() => setAddVehicleOpen(true)}
            className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
            <CarFront className="w-4 h-4 text-sky-400" />Add Vehicle
          </button>
          <button onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#E41E6A] to-pink-600 hover:from-[#c41559] text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-[#E41E6A]/25 transition-all">
            <Plus className="w-4 h-4" />Add Customer
          </button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:"Total Customers",  value:totalCustomers,  icon:<User       className="w-4 h-4"/>, color:"text-[#E41E6A]",  bg:"bg-[#E41E6A]/10"  },
          { label:"VIP Customers",    value:vipCount,        icon:<TrendingUp className="w-4 h-4"/>, color:"text-violet-400", bg:"bg-violet-500/10" },
          { label:"Active Customers", value:activeCustomers, icon:<UserCheck  className="w-4 h-4"/>, color:"text-emerald-400",bg:"bg-emerald-500/10"},
          { label:"New This Month",   value:newThisMonth,    icon:<Calendar   className="w-4 h-4"/>, color:"text-sky-400",    bg:"bg-sky-500/10"    },
        ].map((s,i) => (
          <Card key={i} className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-white/70">{s.label}</CardTitle>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.bg}`}><span className={s.color}>{s.icon}</span></div>
              </div>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="text-white text-2xl font-bold">{isLoading ? "..." : s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Search + Filter ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
          <input type="text" placeholder="Search by name, contact, or vehicle..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#E41E6A] transition-colors" />
        </div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-white/40 flex-shrink-0" />
          {(["All","Active","Inactive"] as const).map(f => (
            <button key={f} onClick={() => setFilterStatus(f)}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg border transition-colors ${filterStatus===f?"bg-[#E41E6A] text-white border-[#E41E6A]":"bg-white/5 text-white/60 border-white/10 hover:bg-white/10"}`}>{f}</button>
          ))}
        </div>
      </div>

      {/* ── Table ── */}
      <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur overflow-hidden">
        <CardHeader className="border-b border-white/10 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Customer List</CardTitle>
            <span className="text-white/40 text-xs">{isLoading ? "Loading..." : `${filtered.length} result${filtered.length!==1?"s":""}`}</span>
          </div>
        </CardHeader>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-[#E41E6A]/30 border-t-[#E41E6A] rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Mobile */}
            <div className="sm:hidden divide-y divide-white/5">
              {filtered.length === 0
                ? <div className="py-12 flex flex-col items-center"><User className="w-8 h-8 text-white/20 mb-2"/><p className="text-white/40 text-sm">No customers found</p></div>
                : filtered.map(c => (
                  <div key={c.id} className="p-4 flex items-center gap-3 hover:bg-white/5 transition-colors">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarColor(c.id)} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>{initials(c.name)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-semibold truncate">{c.name}</p>
                      <p className="text-white/50 text-xs">{c.contact||c.phone||"No contact"}</p>
                      <p className="text-white/40 text-xs truncate">{c.vehicle||"No vehicle"}</p>
                    </div>
                    <StatusBadge status={c.status} />
                    <button onClick={() => handleViewCustomer(c)} className="text-white/50 hover:text-white transition-colors ml-1"><Eye className="w-4 h-4" /></button>
                  </div>
                ))
              }
            </div>

            {/* Desktop — expandable rows */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    {["Customer","Contact","Vehicle","Last Service","Total Spent","Status","Actions"].map(h => (
                      <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-white/50 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filtered.length === 0
                    ? <tr><td colSpan={7} className="text-center py-12"><User className="w-8 h-8 text-white/20 mx-auto mb-2"/><p className="text-white/40 text-sm">No customers found</p></td></tr>
                    : filtered.map(c => (
                      <CustomerRow
                        key={c.id}
                        c={c}
                        refreshKey={vehicleRefreshKeys[c.id] ?? 0}
                        onView={() => handleViewCustomer(c)}
                        onEdit={() => setEditCustomer(c)}
                        onArchive={() => setArchiveCustomer(c)}
                      />
                    ))
                  }
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>

      {/* ── Modals ── */}
      {addOpen         && <AddCustomerModal  onClose={() => setAddOpen(false)}              onSave={handleAdd} />}
      {addVehicleOpen  && <AddVehicleModal   customers={customers} onClose={() => setAddVehicleOpen(false)} onSave={handleAddVehicle} />}
      {editCustomer    && <EditCustomerModal customer={editCustomer}    onClose={() => setEditCustomer(null)}    onSave={handleEdit} />}
      {viewCustomer    && <DetailModal       customer={viewCustomer}    vehicles={viewVehicles} onClose={() => setViewCustomer(null)} onEdit={() => { setEditCustomer(viewCustomer); setViewCustomer(null); }} />}
      {archiveCustomer && <ArchiveModal      customer={archiveCustomer} onClose={() => setArchiveCustomer(null)} onConfirm={() => handleArchive(archiveCustomer.id)} />}
    </div>
  );
}