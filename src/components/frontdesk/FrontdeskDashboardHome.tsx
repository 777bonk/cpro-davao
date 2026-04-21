import { getAppointments } from "../../services/appointments";
import { getCustomers } from "../../services/customer";
import { getInventory } from "../../services/inventory";
import { useState, useEffect, useCallback, type ReactNode } from "react";
import {
  Calendar, Users, ClipboardList, Package,
  Plus, UserPlus, FileText, Clock, Car,
  AlertTriangle, Eye, CheckCircle, Loader,
  CalendarX, X, ChevronDown, AlertCircle,
} from "lucide-react";

const API = import.meta.env.VITE_API_BASE_URL;

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface DashAppt {
  id: string | number;
  customer: string;
  vehicle: string;
  service: string;
  time: string;
  date: string;
  status: string;
}

interface CustomerOpt {
  id: string;
  name: string;
  email: string;
  vehicle: string;
  contact: string;
  registeredAt: string;
}

interface StockItem {
  id: string | number;
  name: string;
  category: string;
  quantity: number;
  minimum: number;
}

// ─── STATUS STYLE ─────────────────────────────────────────────────────────────

const STATUS_ICON: Record<string, { bg: string; text: string; icon: ReactNode }> = {
  Confirmed:             { bg: "bg-emerald-500/20", text: "text-emerald-400", icon: <CheckCircle className="w-3.5 h-3.5" /> },
  "In Progress":         { bg: "bg-blue-500/20",    text: "text-blue-400",    icon: <Loader className="w-3.5 h-3.5 animate-spin" /> },
  Pending:               { bg: "bg-yellow-500/20",  text: "text-yellow-400",  icon: <Clock className="w-3.5 h-3.5" /> },
  "Pending Verification":{ bg: "bg-orange-500/20",  text: "text-orange-300",  icon: <AlertCircle className="w-3.5 h-3.5" /> },
};
const DEFAULT_S = { bg: "bg-white/10", text: "text-white/50", icon: <Clock className="w-3.5 h-3.5" /> };

// ─── SHARED STYLES ────────────────────────────────────────────────────────────

const card    = "bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur rounded-xl border";
const inputCls = "w-full px-4 h-10 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/25 focus:outline-none focus:border-[#E41E6A] focus:ring-1 focus:ring-[#E41E6A]/30 transition-colors text-sm";
const selCls   = inputCls + " appearance-none";

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function todayFull() {
  return new Date().toLocaleDateString("en-US", { weekday:"long", year:"numeric", month:"long", day:"numeric" });
}
function todayShort() {
  return new Date().toLocaleDateString("en-US", { month:"long", day:"numeric", year:"numeric" });
}
function localToday() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}-${String(n.getDate()).padStart(2,"0")}`;
}

const TIME_OPTS = ["8:00 AM","9:00 AM","10:00 AM","10:30 AM","11:00 AM","1:00 PM","2:00 PM","3:00 PM","4:00 PM"];
const SVC_OPTS  = [
  "Ceramic Coating - Full Body","Ceramic Coating - Partial",
  "PPF - Hood & Fenders","PPF - Full Body",
  "Window Tinting - Full Car","Full Interior Detailing",
  "Nano Ceramic Spray","Paint Decontamination",
];

// ─── SMALL COMPONENTS ─────────────────────────────────────────────────────────

function StatCard({ icon, title, value, bg, color, accent }: {
  icon: ReactNode; title: string; value: number | string; bg: string; color: string; accent?: string;
}) {
  return (
    <div className={`${card} p-5 flex items-center gap-4`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${bg}`}>
        <span className={color}>{icon}</span>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-white/40">{title}</p>
        <p className={`text-2xl font-bold mt-0.5 ${accent ?? "text-white"}`}>{value}</p>
      </div>
    </div>
  );
}

function Section({ title, sub, children, action }: {
  title: string; sub?: string; children: ReactNode; action?: ReactNode;
}) {
  return (
    <div className={`${card} overflow-hidden flex flex-col`}>
      <div className="px-5 py-4 border-b border-white/10 flex items-start justify-between gap-3 bg-white/5">
        <div>
          <h2 className="text-sm font-bold text-white">{title}</h2>
          {sub && <p className="text-xs text-white/40 mt-0.5">{sub}</p>}
        </div>
        {action}
      </div>
      <div className="flex-1 divide-y divide-white/5">{children}</div>
    </div>
  );
}

function ApptRow({ a }: { a: DashAppt }) {
  const s = STATUS_ICON[a.status] ?? DEFAULT_S;
  return (
    <div className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/5 transition-colors">
      <div className="w-16 flex-shrink-0 text-center">
        <span className="text-xs font-bold text-pink-400 bg-[#E41E6A]/20 px-2 py-1 rounded-lg whitespace-nowrap">{a.time}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{a.service}</p>
        <p className="text-xs text-white/50 flex items-center gap-1 mt-0.5 truncate">
          <Car className="w-3 h-3 flex-shrink-0" />{a.customer} · {a.vehicle}
        </p>
      </div>
      <span className={`hidden sm:inline-flex flex-shrink-0 items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${s.bg} ${s.text}`}>
        {s.icon}{a.status}
      </span>
    </div>
  );
}

function CustRow({ c }: { c: CustomerOpt }) {
  return (
    <div className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/5 transition-colors">
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#E41E6A] to-pink-600 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold shadow-md shadow-[#E41E6A]/20">
        {c.name.split(" ").map(n => n[0]).slice(0,2).join("")}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{c.name}</p>
        <p className="text-xs text-white/40 truncate">{c.email || c.contact || "No contact"}</p>
      </div>
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <button className="inline-flex items-center gap-1 text-xs font-medium text-[#E41E6A] hover:text-pink-400 transition-colors">
          <Eye className="w-3.5 h-3.5" />View
        </button>
        <span className="text-[10px] text-white/30">{c.registeredAt}</span>
      </div>
    </div>
  );
}

function StockRow({ item }: { item: StockItem }) {
  const pct = item.minimum > 0 ? Math.round((item.quantity / item.minimum) * 100) : 0;
  return (
    <div className="flex items-center gap-3 px-5 py-3.5 hover:bg-red-500/10 transition-colors group">
      <div className="w-9 h-9 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0 border border-red-500/20 group-hover:border-red-500/40 transition-colors">
        <AlertTriangle className="w-4 h-4 text-red-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-white truncate">{item.name}</p>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 uppercase tracking-wide flex-shrink-0">Low</span>
        </div>
        <div className="flex items-center gap-2 mt-1.5">
          <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-red-500 rounded-full" style={{ width: `${Math.min(pct,100)}%` }} />
          </div>
          <span className="text-xs text-white/50 whitespace-nowrap">{item.quantity}/{item.minimum}</span>
        </div>
        <p className="text-[10px] text-white/30 mt-0.5">{item.category}</p>
      </div>
    </div>
  );
}

// ─── NEW APPOINTMENT MODAL ────────────────────────────────────────────────────

function NewApptModal({ onClose, customers, allAppts }: {
  onClose: () => void; customers: CustomerOpt[]; allAppts: DashAppt[];
}) {
  const [form, setForm]     = useState({ customerId:"", vehicle:"", service:"", date:localToday(), time:"9:00 AM" });
  const [saving, setSaving] = useState(false);
  const [done,   setDone]   = useState(false);

  const pick = (id: string) => {
    const cust  = customers.find(c => c.id === id);
    const appts = allAppts.filter(a => a.customer === cust?.name).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const last  = appts[0];
    setForm(f => ({ ...f, customerId:id, vehicle:cust?.vehicle ?? last?.vehicle ?? "", service:last?.service ?? "", date:last?.date ?? localToday(), time:last?.time ?? "9:00 AM" }));
  };

  const save = async () => {
    if (!form.customerId || !form.service || !form.date || !form.time) { alert("Fill in all required fields."); return; }
    setSaving(true);
    try {
      const [tp, mer] = form.time.split(" ");
      const [h, m]    = tp.split(":").map(Number);
      let hr = h;
      if (mer === "PM" && h !== 12) hr += 12;
      if (mer === "AM" && h === 12) hr  = 0;
      await fetch(`${API}/appointments/admin`, {
        method: "POST", headers: { "Content-Type":"application/json" },
        body: JSON.stringify({ customer_id:form.customerId, service_type:form.service, scheduled_date:new Date(`${form.date}T${String(hr).padStart(2,"0")}:${String(m).padStart(2,"0")}`).toISOString(), total_cost:0, status:"Confirmed" }),
      });
      setDone(true);
      setTimeout(onClose, 1200);
    } catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  };

  const L = ({ label, req }: { label: string; req?: boolean }) => (
    <label className="text-sm font-medium text-white/70 block mb-1.5">{label}{req && <span className="text-red-500 ml-0.5">*</span>}</label>
  );

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm" style={{ backgroundColor:"rgba(0,0,0,0.85)" }}>
      <div className="bg-[#0a0a0a] border border-white/10 rounded-xl w-full max-w-md shadow-2xl flex flex-col">
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div><h2 className="text-base font-bold text-white">New Appointment</h2><p className="text-xs text-white/40 mt-0.5">Customer auto-fills vehicle & service</p></div>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div><L label="Customer" req />
            <div className="relative">
              <select className={`${selCls} pr-8`} value={form.customerId} onChange={e => pick(e.target.value)}>
                <option value="" className="bg-[#0a0a0a]">Select a customer...</option>
                {customers.map(c => <option key={c.id} value={c.id} className="bg-[#0a0a0a]">{c.name}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
            </div>
          </div>
          <div><L label="Vehicle" />
            <input className={inputCls} placeholder="Auto-filled from customer record" value={form.vehicle} onChange={e => setForm(f => ({ ...f, vehicle:e.target.value }))} />
          </div>
          <div><L label="Service" req />
            <div className="relative">
              <select className={`${selCls} pr-8`} value={form.service} onChange={e => setForm(f => ({ ...f, service:e.target.value }))}>
                <option value="" className="bg-[#0a0a0a]">Select service...</option>
                {SVC_OPTS.map(s => <option key={s} value={s} className="bg-[#0a0a0a]">{s}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
            </div>
            {form.service && <p className="text-xs text-white/30 mt-1">↑ Auto-filled from last appointment</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><L label="Date" req /><input type="date" className={`${inputCls} [color-scheme:dark]`} value={form.date} onChange={e => setForm(f => ({ ...f, date:e.target.value }))} /></div>
            <div><L label="Time" req />
              <div className="relative">
                <select className={`${selCls} pr-8`} value={form.time} onChange={e => setForm(f => ({ ...f, time:e.target.value }))}>
                  {TIME_OPTS.map(t => <option key={t} value={t} className="bg-[#0a0a0a]">{t}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-white/10 bg-white/5 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium border border-white/10 text-white hover:bg-white/10 rounded-lg transition-colors">Cancel</button>
          <button onClick={save} disabled={saving || done}
            className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#E41E6A] to-pink-600 hover:from-[#c41559] rounded-lg shadow-md disabled:opacity-50 transition-all">
            {done ? "✓ Created!" : saving ? "Creating..." : "Create Appointment"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── CREATE JOB ORDER MODAL ───────────────────────────────────────────────────

function JobOrderModal({ onClose, customers, allAppts }: {
  onClose: () => void; customers: CustomerOpt[]; allAppts: DashAppt[];
}) {
  const [form, setForm]     = useState({ customerId:"", customerName:"", vehicle:"", service:"", date:localToday(), staff:"", notes:"", priority:"Normal" });
  const [saving, setSaving] = useState(false);
  const [done,   setDone]   = useState(false);

  const pick = (id: string) => {
    const cust  = customers.find(c => c.id === id);
    const appts = allAppts.filter(a => a.customer === cust?.name).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const last  = appts[0];
    setForm(f => ({ ...f, customerId:id, customerName:cust?.name ?? "", vehicle:cust?.vehicle ?? last?.vehicle ?? "", service:last?.service ?? "", date:last?.date ?? localToday() }));
  };

  const save = async () => {
    if (!form.customerId || !form.vehicle || !form.service) { alert("Fill in all required fields."); return; }
    setSaving(true);
    try {
      await fetch(`${API}/job-orders`, {
        method:"POST", headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ order_no:`JO-${Date.now().toString().slice(-6)}`, customer:form.customerName, vehicle:form.vehicle, service:form.service, assigned_staff:form.staff||"Unassigned", scheduled_date:form.date, notes:form.notes, priority:form.priority, status:"Pending" }),
      });
      setDone(true);
      setTimeout(onClose, 1200);
    } catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  };

  const L = ({ label, req }: { label: string; req?: boolean }) => (
    <label className="text-sm font-medium text-white/70 block mb-1.5">{label}{req && <span className="text-red-500 ml-0.5">*</span>}</label>
  );

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm" style={{ backgroundColor:"rgba(0,0,0,0.85)" }}>
      <div className="bg-[#0a0a0a] border border-white/10 rounded-xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div><h2 className="text-base font-bold text-white">Create Job Order</h2><p className="text-xs text-white/40 mt-0.5">Auto-fills from customer's last appointment</p></div>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div><L label="Customer" req />
            <div className="relative">
              <select className={`${selCls} pr-8`} value={form.customerId} onChange={e => pick(e.target.value)}>
                <option value="" className="bg-[#0a0a0a]">Select a customer...</option>
                {customers.map(c => <option key={c.id} value={c.id} className="bg-[#0a0a0a]">{c.name}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
            </div>
          </div>
          <div><L label="Vehicle" req />
            <input className={inputCls} placeholder="Auto-filled from customer" value={form.vehicle} onChange={e => setForm(f => ({ ...f, vehicle:e.target.value }))} />
          </div>
          <div><L label="Service Type" req />
            <div className="relative">
              <select className={`${selCls} pr-8`} value={form.service} onChange={e => setForm(f => ({ ...f, service:e.target.value }))}>
                <option value="" className="bg-[#0a0a0a]">Select service...</option>
                {SVC_OPTS.map(s => <option key={s} value={s} className="bg-[#0a0a0a]">{s}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
            </div>
            {form.service && <p className="text-xs text-white/30 mt-1">↑ Auto-filled from last appointment</p>}
          </div>
          <div><L label="Scheduled Date" req />
            <input type="date" className={`${inputCls} [color-scheme:dark]`} value={form.date} onChange={e => setForm(f => ({ ...f, date:e.target.value }))} />
            {form.date !== localToday() && <p className="text-xs text-white/30 mt-1">↑ Auto-filled from last appointment</p>}
          </div>
          <div><L label="Assigned Staff" />
            <input className={inputCls} placeholder="Staff name (optional)" value={form.staff} onChange={e => setForm(f => ({ ...f, staff:e.target.value }))} />
          </div>
          <div><L label="Priority" />
            <div className="flex gap-2">
              {["Low","Normal","High","Urgent"].map(p => (
                <button key={p} type="button" onClick={() => setForm(f => ({ ...f, priority:p }))}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                    form.priority === p
                      ? p === "Urgent" ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-[#E41E6A]/20 text-[#E41E6A] border-[#E41E6A]/30"
                      : "bg-white/5 text-white/50 border-white/10 hover:bg-white/10"
                  }`}>{p}</button>
              ))}
            </div>
          </div>
          <div><L label="Notes" />
            <textarea className={`${inputCls} resize-none h-20 py-2.5`} placeholder="Instructions for the technician..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes:e.target.value }))} />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-white/10 bg-white/5 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium border border-white/10 text-white hover:bg-white/10 rounded-lg transition-colors">Cancel</button>
          <button onClick={save} disabled={saving || done}
            className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-700 rounded-lg shadow-md disabled:opacity-50 transition-all">
            {done ? "✓ Created!" : saving ? "Creating..." : "Create Job Order"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

export function FrontDeskDashboardHome() {
  const [todayAppts,   setTodayAppts]   = useState<DashAppt[]>([]);
  const [allAppts,     setAllAppts]     = useState<DashAppt[]>([]);
  const [allCustomers, setAllCustomers] = useState<CustomerOpt[]>([]);
  const [recentCusts,  setRecentCusts]  = useState<CustomerOpt[]>([]);
  const [lowStock,     setLowStock]     = useState<StockItem[]>([]);
  const [stats, setStats] = useState({ appts:0, customers:0, pending:0, stock:0 });
  const [loading,    setLoading]    = useState(true);
  const [showAppt,   setShowAppt]   = useState(false);
  const [showJob,    setShowJob]    = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const today = localToday();
      const [apptData, custData, invData] = await Promise.all([
        getAppointments().catch(() => []),
        getCustomers().catch(() => []),
        getInventory().catch(() => []),
      ]);

      const appts: DashAppt[] = (Array.isArray(apptData) ? apptData : []).map((a: any) => ({
        id:       a.id,
        customer: a.customerName ?? a.fullName ?? a.full_name ?? "—",
        vehicle:  a.vehicle      ?? "—",
        service:  a.service      ?? a.service_type ?? "—",
        time:     a.time         ?? a.appointment_time ?? "—",
        date:     a.date         ?? "",
        status:   a.status       ?? "Pending",
      }));

      const custs: CustomerOpt[] = (Array.isArray(custData) ? custData : []).map((c: any) => ({
        id:           c.id,
        name:         c.name    ?? "—",
        email:        c.email   ?? "",
        vehicle:      c.vehicle ?? "",
        contact:      c.contact ?? c.phone ?? "",
        registeredAt: c.created_at ? String(c.created_at).split("T")[0] : "",
      }));

      const low = (Array.isArray(invData) ? invData : []).filter((i: any) => {
        const qty = Number(i?.quantity ?? i?.stock ?? 0);
        const min = Number(i?.low_stock_threshold ?? i?.reorderLevel ?? i?.minimum ?? 0);
        return qty <= min && min > 0;
      });

      const pending = appts.filter(a => ["Pending","In Progress","Pending Verification"].includes(a.status)).length;

      setAllAppts(appts);
      setAllCustomers(custs);
      setTodayAppts(appts.filter(a => a.date === today).slice(0, 5));
      setRecentCusts(custs.slice(0, 5));
      setLowStock(low.slice(0, 5).map((i: any) => ({
        id: i.id, name: i.name ?? "—", category: i.category ?? "",
        quantity: Number(i.quantity ?? i.stock ?? 0),
        minimum:  Number(i.low_stock_threshold ?? i.reorderLevel ?? 0),
      })));
      setStats({ appts: appts.filter(a => a.date === today).length, customers: custs.length, pending, stock: low.length });
    } catch (err) { console.error("Dashboard load error:", err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-white text-3xl font-bold mb-1">Dashboard</h1>
          <p className="text-white/60 text-sm">{todayFull()}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setShowAppt(true)}
            className="inline-flex items-center gap-1.5 bg-gradient-to-r from-[#E41E6A] to-pink-600 hover:from-[#c41559] text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-[#E41E6A]/25 transition-all">
            <Plus className="w-3.5 h-3.5" />New Appointment
          </button>
          <button className="inline-flex items-center gap-1.5 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold px-4 py-2.5 rounded-xl border border-white/10 transition-colors">
            <UserPlus className="w-3.5 h-3.5 text-sky-400" />Register Customer
          </button>
          <button onClick={() => setShowJob(true)}
            className="inline-flex items-center gap-1.5 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold px-4 py-2.5 rounded-xl border border-white/10 transition-colors">
            <FileText className="w-3.5 h-3.5 text-violet-400" />Create Job Order
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard icon={<Calendar      className="w-5 h-5" />} title="Today's Appointments" value={loading ? "-" : stats.appts}     bg="bg-pink-500/20"    color="text-pink-400"   />
        <StatCard icon={<Users         className="w-5 h-5" />} title="Total Customers"       value={loading ? "-" : stats.customers} bg="bg-sky-500/20"     color="text-sky-400"    />
        <StatCard icon={<ClipboardList className="w-5 h-5" />} title="Pending Jobs"          value={loading ? "-" : stats.pending}   bg="bg-yellow-500/20"  color="text-yellow-400" />
        <StatCard icon={<Package       className="w-5 h-5" />} title="Low Stock Items"       value={loading ? "-" : stats.stock}     bg="bg-red-500/20"     color="text-red-400"    accent="text-red-400" />
      </div>

      {/* Today's Schedule */}
      <Section title="Today's Schedule" sub={`Appointments for ${todayShort()}`}>
        {loading ? (
          <div className="flex items-center justify-center py-12 text-white/50 text-sm">Loading schedule...</div>
        ) : todayAppts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-3"><CalendarX className="w-6 h-6 text-white/20" /></div>
            <p className="text-sm font-medium text-white/40">No appointments scheduled for today</p>
          </div>
        ) : todayAppts.map(a => <ApptRow key={a.id} a={a} />)}
      </Section>

      {/* Bottom 2-col */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Section title="Recent Customers" sub="Latest customer registrations"
          action={<button className="text-xs font-medium text-[#E41E6A] hover:text-pink-400 transition-colors">View all</button>}>
          {loading ? <div className="flex items-center justify-center py-8 text-white/50 text-sm">Loading...</div>
            : recentCusts.length === 0 ? <div className="flex items-center justify-center py-8 text-white/40 text-sm">No customers yet</div>
            : recentCusts.map(c => <CustRow key={c.id} c={c} />)}
        </Section>

        <Section title="Low Stock Alert" sub="Items below minimum threshold"
          action={<button className="text-xs font-medium text-[#E41E6A] hover:text-pink-400 transition-colors">Manage</button>}>
          {loading ? <div className="flex items-center justify-center py-8 text-white/50 text-sm">Loading...</div>
            : lowStock.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-white/40 text-sm flex-col gap-2">
                <CheckCircle className="w-8 h-8 text-emerald-500/50" />
                <span>All stock levels are good</span>
              </div>
            ) : lowStock.map(i => <StockRow key={i.id} item={i} />)}
        </Section>
      </div>

      {showAppt && <NewApptModal   onClose={() => { setShowAppt(false); load(); }} customers={allCustomers} allAppts={allAppts} />}
      {showJob   && <JobOrderModal onClose={() => setShowJob(false)}               customers={allCustomers} allAppts={allAppts} />}
    </div>
  );
}

export default FrontDeskDashboardHome;