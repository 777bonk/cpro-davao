import { getCustomers, createCustomer } from "../../services/customer";
import { useState, useEffect, useMemo } from "react";
import {
  Search, Plus, X, User, Phone, Car, Clock,
  Eye, ChevronDown, SlidersHorizontal, UserCheck,
  Calendar, Banknote, Users
} from "lucide-react";

// ─── API PLACEHOLDERS (Replace with your actual service imports) ──────────────
// import { getCustomers, createCustomer } from "../../services/customers";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type CustomerStatus = "Active" | "Inactive";

interface Customer {
  id: number | string;
  name: string;
  contact: string;
  email: string;
  vehicle: string;
  lastService: string;
  totalSpent: number;
  totalVisits: number;
  status: CustomerStatus;
  registeredAt: string;
}

// ─── SHARED CLASSES ───────────────────────────────────────────────────────────

const inputCls = "w-full px-4 h-10 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/25 focus:outline-none focus:border-[#E41E6A] focus:ring-1 focus:ring-[#E41E6A]/30 transition-colors text-sm";
const cardCls  = "bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur rounded-xl border";

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function initials(name: string) {
  return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
}

const AVATAR_COLORS = [
  "from-[#E41E6A] to-pink-600",
  "from-sky-500 to-blue-600",
  "from-violet-500 to-purple-600",
  "from-emerald-500 to-green-600",
  "from-amber-500 to-orange-600",
];

// Simple hash to consistently map string/number IDs to an avatar color
function avatarColor(id: string | number) {
  const numId = typeof id === 'string' ? id.charCodeAt(0) + id.length : id;
  return AVATAR_COLORS[numId % AVATAR_COLORS.length];
}

// ─── STAT CARD ────────────────────────────────────────────────────────────────

function StatCard({ icon, title, value, iconBg, iconColor }: {
  icon: React.ReactNode; title: string; value: number | string;
  iconBg: string; iconColor: string;
}) {
  return (
    <div className={`${cardCls} p-5 flex items-center gap-4`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        <span className={iconColor}>{icon}</span>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-white/40">{title}</p>
        <p className="text-2xl font-bold text-white mt-0.5">{value}</p>
      </div>
    </div>
  );
}

// ─── STATUS BADGE ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: CustomerStatus }) {
  return status === "Active" ? (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase tracking-wide">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-white/50 border border-white/20 uppercase tracking-wide">
      <span className="w-1.5 h-1.5 rounded-full bg-white/40" />Inactive
    </span>
  );
}

// ─── VIEW DETAIL MODAL ────────────────────────────────────────────────────────

function DetailModal({ customer, onClose }: { customer: Customer; onClose: () => void }) {
  const Row = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
    <div className="flex items-start gap-3 py-3 border-b border-white/10 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center flex-shrink-0 mt-0.5">
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
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${avatarColor(customer.id)} flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-md`}>
              {initials(customer.name)}
            </div>
            <div>
              <h2 className="text-base font-bold text-white">{customer.name}</h2>
              <div className="mt-1"><StatusBadge status={customer.status} /></div>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors flex-shrink-0">
            <X className="w-4 h-4 text-white/50" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto">
          <Row icon={<Phone    className="w-4 h-4 text-white/50"    />} label="Contact Number"  value={customer.contact || "N/A"} />
          <Row icon={<User     className="w-4 h-4 text-white/50"    />} label="Email"            value={customer.email   || "N/A"} />
          <Row icon={<Car      className="w-4 h-4 text-white/50"    />} label="Vehicle"          value={customer.vehicle} />
          <Row icon={<Clock    className="w-4 h-4 text-[#E41E6A]"   />} label="Last Service"     value={customer.lastService} />
          <Row icon={<Calendar className="w-4 h-4 text-sky-400"     />} label="Registered"       value={formatDate(customer.registeredAt)} />

          {/* Stats row */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="bg-[#E41E6A]/10 rounded-xl p-4 border border-[#E41E6A]/20 text-center">
              <p className="text-xs text-white/50 font-medium">Total Spent</p>
              <p className="text-lg font-bold text-pink-400 mt-1">₱{customer.totalSpent.toLocaleString()}</p>
            </div>
            <div className="bg-sky-500/10 rounded-xl p-4 border border-sky-500/20 text-center">
              <p className="text-xs text-white/50 font-medium">Total Visits</p>
              <p className="text-lg font-bold text-sky-400 mt-1">{customer.totalVisits} visit{customer.totalVisits !== 1 ? "s" : ""}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-white/5 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium border border-white/10 text-white hover:bg-white/10 rounded-lg transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── ADD CUSTOMER MODAL ───────────────────────────────────────────────────────

function AddCustomerModal({ onClose, onSave }: {
  onClose: () => void;
  onSave: (c: Omit<Customer, "id">) => void;
}) {
  const [form, setForm] = useState({
    name: "", contact: "", email: "", vehicle: "",
    status: "Active" as CustomerStatus,
  });
  const [error, setError] = useState("");

  const handleSave = () => {
    if (!form.name.trim() || !form.contact.trim() || !form.vehicle.trim()) {
      setError("Name, contact, and vehicle are required."); return;
    }
    onSave({
      ...form,
      lastService: "N/A",
      totalSpent: 0,
      totalVisits: 0,
      registeredAt: new Date().toISOString().split("T")[0],
    });
    onClose();
  };

  const Field = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-white/70 block">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm" style={{ backgroundColor: "rgba(0,0,0,0.8)" }}>
      <div className="bg-[#0a0a0a] border border-white/10 rounded-xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white">Register Customer</h2>
            <p className="text-xs text-white/50 mt-0.5">Add a new customer to the system</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors">
            <X className="w-4 h-4 text-white/50" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          <Field label="Full Name" required>
            <input className={inputCls} placeholder="e.g. Juan dela Cruz" value={form.name}    onChange={e => setForm({ ...form, name:    e.target.value })} />
          </Field>
          <Field label="Contact Number" required>
            <input className={inputCls} placeholder="09XX-XXX-XXXX"       value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} />
          </Field>
          <Field label="Email Address">
            <input className={inputCls} placeholder="email@example.com"   value={form.email}   onChange={e => setForm({ ...form, email:   e.target.value })} />
          </Field>
          <Field label="Vehicle" required>
            <input className={inputCls} placeholder="Year Make Model"      value={form.vehicle} onChange={e => setForm({ ...form, vehicle: e.target.value })} />
          </Field>
          <Field label="Status">
            <div className="relative">
              <select className={`${inputCls} appearance-none pr-8`} value={form.status} onChange={e => setForm({ ...form, status: e.target.value as CustomerStatus })}>
                <option value="Active" className="bg-[#0a0a0a]">Active</option>
                <option value="Inactive" className="bg-[#0a0a0a]">Inactive</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
            </div>
          </Field>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              <X className="w-4 h-4 flex-shrink-0" />{error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-white/5 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium border border-white/10 text-white hover:bg-white/10 rounded-lg transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#E41E6A] to-pink-600 hover:from-[#c41559] rounded-lg shadow-md shadow-[#E41E6A]/25 transition-all">
            Register Customer
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export function FrontDeskCustomers() {
  const [customers,    setCustomers]    = useState<Customer[]>([]);
  const [isLoading,    setIsLoading]    = useState(true);

  const [search,       setSearch]       = useState("");
  const [filterStatus, setFilterStatus] = useState<"All" | CustomerStatus>("All");
  const [showAdd,      setShowAdd]      = useState(false);
  const [detailCust,   setDetailCust]   = useState<Customer | null>(null);

  // ─── DATA FETCHING (Simulated) ───
  useEffect(() => {
    fetchCustomers();
  }, []);

 const fetchCustomers = async () => {
  setIsLoading(true);
  try {
    const [data, allAppts] = await Promise.all([
      getCustomers(),
      fetch(`${import.meta.env.VITE_API_BASE_URL}/appointments?t=${Date.now()}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      }).then(r => r.ok ? r.json() : []).catch(() => []),
    ]);

    // Normalize appointments array
    const appts = Array.isArray(allAppts) ? allAppts : (allAppts?.data ?? []);

    const mapped: Customer[] = data.map((c) => {
      // Find all appointments for this customer
      const custAppts = appts.filter((a: any) =>
        a.customer_id === c.id || a.customerId === c.id
      );

      // Calculate total spent from completed appointments
      const totalSpent = custAppts
        .filter((a: any) => a.status === "Completed")
        .reduce((sum: number, a: any) => sum + Number(a.total_cost ?? a.totalAmount ?? 0), 0);

      // Get last completed service
      const lastCompleted = custAppts
        .filter((a: any) => a.status === "Completed")
        .sort((a: any, b: any) =>
          new Date(b.scheduled_date ?? b.date).getTime() -
          new Date(a.scheduled_date ?? a.date).getTime()
        )[0];

      const lastService = lastCompleted
        ? `${lastCompleted.service_type ?? lastCompleted.service ?? "Service"} — ${
            new Date(lastCompleted.scheduled_date ?? lastCompleted.date)
              .toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
          }`
        : "N/A";

      // Total visits = all non-cancelled appointments
      const totalVisits = custAppts.filter((a: any) =>
        a.status !== "Cancelled" && a.status !== "Rejected"
      ).length;

      return {
        id:           c.id,
        name:         c.name,
        contact:      c.contact ?? "",
        email:        c.email   ?? "",
        vehicle:      c.vehicle ?? "",
        lastService,
        totalSpent,
        totalVisits,
        status:       (c.status ?? "Active") as CustomerStatus,
        registeredAt: c.created_at
          ? c.created_at.split("T")[0]
          : new Date().toISOString().split("T")[0],
      };
    });

    setCustomers(mapped);
  } catch (err) {
    console.error("Failed to load customers:", err);
  } finally {
    setIsLoading(false);
  }
};

  // ─── COMPUTED DATA ───
  const totalCustomers  = customers.length;
  const activeCustomers = customers.filter(c => c.status === "Active").length;
  const newThisMonth    = customers.filter(c => {
    const d = new Date(c.registeredAt);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const vipCustomers = customers.filter(c => c.totalSpent > 20000).length;

  const filtered = useMemo(() =>
    customers
      .filter(c => filterStatus === "All" || c.status === filterStatus)
      .filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase())    ||
        c.contact.toLowerCase().includes(search.toLowerCase()) ||
        c.vehicle.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime()),
    [customers, search, filterStatus]
  );

  const handleAdd = async (c: Omit<Customer, "id">) => {
    try {
      const created = await createCustomer({
        name:    c.name,
        contact: c.contact,
        email:   c.email,
        vehicle: c.vehicle,
        status:  c.status,
      });
      setCustomers(prev => [{
        id:           created.id,
        name:         created.name,
        contact:      created.contact      ?? "",
        email:        created.email        ?? "",
        vehicle:      created.vehicle      ?? "",
        lastService:  created.last_service ?? "N/A",
        totalSpent:   Number(created.total_spent) || 0,
        totalVisits:  0,
        status:       (created.status ?? "Active") as CustomerStatus,
        registeredAt: created.created_at
          ? created.created_at.split("T")[0]
          : new Date().toISOString().split("T")[0],
      }, ...prev]);
    } catch (err) {
      console.error("Failed to create customer:", err);
    }
  };

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-white text-3xl font-bold mb-1">Customers</h1>
          <p className="text-white/60 text-sm">Manage and view registered customers</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="self-start sm:self-auto inline-flex items-center gap-2 bg-gradient-to-r from-[#E41E6A] to-pink-600 hover:from-[#c41559] text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-[#E41E6A]/25 transition-all"
        >
          <Plus className="w-4 h-4" />
          Register Customer
        </button>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard icon={<User      className="w-5 h-5" />} title="Total Customers"  value={isLoading ? "-" : totalCustomers}  iconBg="bg-pink-500/20"    iconColor="text-pink-400" />
        <StatCard icon={<UserCheck className="w-5 h-5" />} title="Active Customers" value={isLoading ? "-" : activeCustomers} iconBg="bg-emerald-500/20" iconColor="text-emerald-400" />
        <StatCard icon={<Calendar  className="w-5 h-5" />} title="New This Month"   value={isLoading ? "-" : newThisMonth}    iconBg="bg-sky-500/20"     iconColor="text-sky-400" />
        <StatCard icon={<Banknote  className="w-5 h-5" />} title="VIP Customers"    value={isLoading ? "-" : vipCustomers}    iconBg="bg-violet-500/20"  iconColor="text-violet-400" />
      </div>

      {/* ── Search + Filter ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name, contact, vehicle..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#E41E6A] focus:ring-1 focus:ring-[#E41E6A]/30 transition-colors shadow-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-white/40 flex-shrink-0" />
          {(["All", "Active", "Inactive"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilterStatus(f)}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg border transition-all ${
                filterStatus === f
                  ? "bg-[#E41E6A] text-white border-transparent shadow-md shadow-[#E41E6A]/25"
                  : "bg-white/5 text-white/60 border-white/10 hover:border-white/20 hover:bg-white/10"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* ── Customer Table ── */}
      <div className={`${cardCls} overflow-hidden`}>
        <div className="px-5 py-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
          <h2 className="text-sm font-bold text-white">Customer List</h2>
          <span className="text-xs text-white/40">{isLoading ? "..." : filtered.length} records</span>
        </div>

        {/* Mobile cards */}
        <div className="sm:hidden divide-y divide-white/5">
          {isLoading ? (
             <div className="py-12 text-center text-white/50 text-sm">Loading customers...</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 flex flex-col items-center text-center">
              <Users className="w-8 h-8 text-white/20 mb-2" />
              <p className="text-sm text-white/40">No customers found</p>
            </div>
          ) : filtered.map(c => (
            <div key={c.id} className="p-4 flex items-center gap-3 hover:bg-white/5 transition-colors">
              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarColor(c.id)} flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-md`}>
                {initials(c.name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-white truncate">{c.name}</p>
                  <StatusBadge status={c.status} />
                </div>
                <p className="text-xs text-white/50 truncate mt-0.5">{c.vehicle}</p>
                <p className="text-xs text-white/40 flex items-center gap-1 mt-0.5">
                  <Phone className="w-3 h-3" />{c.contact}
                </p>
              </div>
              <button onClick={() => setDetailCust(c)} className="flex items-center gap-1 text-xs font-medium text-[#E41E6A] hover:text-pink-400 flex-shrink-0 transition-colors">
                <Eye className="w-3.5 h-3.5" />View
              </button>
            </div>
          ))}
        </div>

        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left">
                {["Customer","Contact","Vehicle","Last Service","Total Spent","Status","Actions"].map(h => (
                  <th key={h} className="px-5 py-3.5 text-xs font-semibold text-white/50 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-white/50 text-sm">
                    Loading customers...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <Users className="w-8 h-8 text-white/20 mx-auto mb-2" />
                    <p className="text-sm text-white/40">No customers found</p>
                  </td>
                </tr>
              ) : filtered.map(c => (
                <tr key={c.id} className="hover:bg-white/5 transition-colors">
                  {/* Customer */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${avatarColor(c.id)} flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm`}>
                        {initials(c.name)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{c.name}</p>
                        <p className="text-xs text-white/40">{c.email}</p>
                      </div>
                    </div>
                  </td>
                  {/* Contact */}
                  <td className="px-5 py-3.5 text-sm text-white/60 whitespace-nowrap">
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-white/40" />{c.contact}
                    </span>
                  </td>
                  {/* Vehicle */}
                  <td className="px-5 py-3.5 text-sm text-white/60 whitespace-nowrap">
                    <span className="flex items-center gap-1.5">
                      <Car className="w-3.5 h-3.5 text-white/40" />{c.vehicle}
                    </span>
                  </td>
                  {/* Last Service */}
                  <td className="px-5 py-3.5">
                    <span className="text-xs text-white/60 max-w-[160px] block truncate">{c.lastService}</span>
                  </td>
                  {/* Total Spent */}
                  <td className="px-5 py-3.5">
                    <span className="text-sm font-semibold text-white">₱{c.totalSpent.toLocaleString()}</span>
                    <span className="text-xs text-white/40 block">{c.totalVisits} visit{c.totalVisits !== 1 ? "s" : ""}</span>
                  </td>
                  {/* Status */}
                  <td className="px-5 py-3.5"><StatusBadge status={c.status} /></td>
                  {/* Actions */}
                  <td className="px-5 py-3.5">
                    <button onClick={() => setDetailCust(c)} className="flex items-center gap-1 text-xs font-medium text-[#E41E6A] hover:text-pink-400 transition-colors">
                      <Eye className="w-3.5 h-3.5" />View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modals ── */}
      {showAdd    && <AddCustomerModal onClose={() => setShowAdd(false)} onSave={handleAdd} />}
      {detailCust && <DetailModal customer={detailCust} onClose={() => setDetailCust(null)} />}

    </div>
  );
}

export default FrontDeskCustomers;