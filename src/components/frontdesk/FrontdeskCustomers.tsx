import { useState, useMemo } from "react";
import {
  Search, Plus, X, User, Phone, Car, Clock,
  Eye, ChevronDown, SlidersHorizontal, UserCheck,
  Calendar, Banknote, Hash,
} from "lucide-react";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type CustomerStatus = "Active" | "Inactive";

interface Customer {
  id: number;
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

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

const INITIAL_CUSTOMERS: Customer[] = [
  { id: 1,  name: "Juan dela Cruz",   contact: "09171234567", email: "juan@email.com",   vehicle: "2023 Toyota Fortuner",    lastService: "Ceramic Coating - Full Body",  totalSpent: 28000, totalVisits: 4, status: "Active",   registeredAt: "2025-01-15" },
  { id: 2,  name: "Maria Santos",     contact: "09181234567", email: "maria@email.com",  vehicle: "2021 Honda Civic",        lastService: "Window Tinting - Full Car",    totalSpent: 12000, totalVisits: 2, status: "Active",   registeredAt: "2025-02-20" },
  { id: 3,  name: "Carlo Reyes",      contact: "09191234567", email: "carlo@email.com",  vehicle: "2022 Mitsubishi Xpander", lastService: "PPF - Hood & Fenders",         totalSpent: 35000, totalVisits: 5, status: "Active",   registeredAt: "2024-11-10" },
  { id: 4,  name: "Ana Villanueva",   contact: "09201234567", email: "ana@email.com",    vehicle: "2020 Ford Ranger",        lastService: "Full Interior Detailing",      totalSpent: 8500,  totalVisits: 2, status: "Active",   registeredAt: "2025-03-05" },
  { id: 5,  name: "Ramon Gutierrez",  contact: "09211234567", email: "ramon@email.com",  vehicle: "2023 Nissan Terra",       lastService: "Nano Ceramic Spray",           totalSpent: 5000,  totalVisits: 1, status: "Active",   registeredAt: "2026-04-01" },
  { id: 6,  name: "Liza Mendoza",     contact: "09221234567", email: "liza@email.com",   vehicle: "2021 Kia Stinger",        lastService: "Ceramic Coating - Partial",    totalSpent: 18000, totalVisits: 3, status: "Active",   registeredAt: "2025-06-18" },
  { id: 7,  name: "Paolo Cruz",       contact: "09231234567", email: "paolo@email.com",  vehicle: "2019 Toyota Vios",        lastService: "Full Interior Detailing",      totalSpent: 4500,  totalVisits: 1, status: "Inactive", registeredAt: "2024-08-22" },
  { id: 8,  name: "Sofia Reyes",      contact: "09241234567", email: "sofia@email.com",  vehicle: "2022 Honda BRV",          lastService: "Window Tinting - Full Car",    totalSpent: 9000,  totalVisits: 2, status: "Active",   registeredAt: "2025-09-30" },
  { id: 9,  name: "Marco Bautista",   contact: "09251234567", email: "marco@email.com",  vehicle: "2021 Suzuki Ertiga",      lastService: "Paint Decontamination",        totalSpent: 3200,  totalVisits: 1, status: "Active",   registeredAt: "2026-03-14" },
  { id: 10, name: "Claire Ocampo",    contact: "09261234567", email: "claire@email.com", vehicle: "2023 Hyundai Tucson",     lastService: "Ceramic Coating - Full Body",  totalSpent: 32000, totalVisits: 4, status: "Active",   registeredAt: "2025-05-07" },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function initials(name: string) {
  return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
}

const AVATAR_COLORS = [
  "from-[#E41E6A] to-pink-400",
  "from-sky-500 to-blue-400",
  "from-violet-500 to-purple-400",
  "from-emerald-500 to-green-400",
  "from-amber-500 to-orange-400",
];

function avatarColor(id: number) {
  return AVATAR_COLORS[id % AVATAR_COLORS.length];
}

// ─── STAT CARD ────────────────────────────────────────────────────────────────

function StatCard({ icon, title, value, iconBg, iconColor }: {
  icon: React.ReactNode; title: string; value: number | string;
  iconBg: string; iconColor: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        <span className={iconColor}>{icon}</span>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{title}</p>
        <p className="text-2xl font-bold text-gray-800 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

// ─── STATUS BADGE ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: CustomerStatus }) {
  return status === "Active" ? (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 border border-gray-200">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />Inactive
    </span>
  );
}

// ─── VIEW DETAIL MODAL ────────────────────────────────────────────────────────

function DetailModal({ customer, onClose }: { customer: Customer; onClose: () => void }) {
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
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${avatarColor(customer.id)} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
              {initials(customer.name)}
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-800">{customer.name}</h2>
              <StatusBadge status={customer.status} />
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors flex-shrink-0">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto">
          <Row icon={<Phone    className="w-4 h-4 text-gray-400"    />} label="Contact Number"  value={customer.contact || "N/A"} />
          <Row icon={<User     className="w-4 h-4 text-gray-400"    />} label="Email"            value={customer.email   || "N/A"} />
          <Row icon={<Car      className="w-4 h-4 text-gray-400"    />} label="Vehicle"          value={customer.vehicle} />
          <Row icon={<Clock    className="w-4 h-4 text-[#E41E6A]"   />} label="Last Service"     value={customer.lastService} />
          <Row icon={<Calendar className="w-4 h-4 text-sky-500"     />} label="Registered"       value={formatDate(customer.registeredAt)} />

          {/* Stats row */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="bg-rose-50 rounded-xl p-4 border border-rose-100 text-center">
              <p className="text-xs text-gray-500 font-medium">Total Spent</p>
              <p className="text-lg font-bold text-[#E41E6A] mt-1">₱{customer.totalSpent.toLocaleString()}</p>
            </div>
            <div className="bg-sky-50 rounded-xl p-4 border border-sky-100 text-center">
              <p className="text-xs text-gray-500 font-medium">Total Visits</p>
              <p className="text-lg font-bold text-sky-600 mt-1">{customer.totalVisits} visit{customer.totalVisits !== 1 ? "s" : ""}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
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
      <label className="text-sm font-medium text-gray-700">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-800">Register Customer</h2>
            <p className="text-xs text-gray-400 mt-0.5">Add a new customer to the system</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          <Field label="Full Name" required>
            <input className="input-field" placeholder="e.g. Juan dela Cruz" value={form.name}    onChange={e => setForm({ ...form, name:    e.target.value })} />
          </Field>
          <Field label="Contact Number" required>
            <input className="input-field" placeholder="09XX-XXX-XXXX"       value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} />
          </Field>
          <Field label="Email Address">
            <input className="input-field" placeholder="email@example.com"   value={form.email}   onChange={e => setForm({ ...form, email:   e.target.value })} />
          </Field>
          <Field label="Vehicle" required>
            <input className="input-field" placeholder="Year Make Model"      value={form.vehicle} onChange={e => setForm({ ...form, vehicle: e.target.value })} />
          </Field>
          <Field label="Status">
            <div className="relative">
              <select className="input-field appearance-none pr-8" value={form.status} onChange={e => setForm({ ...form, status: e.target.value as CustomerStatus })}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </Field>

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
            Register Customer
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export function FrontDeskCustomers() {
  const [customers,    setCustomers]    = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [search,       setSearch]       = useState("");
  const [filterStatus, setFilterStatus] = useState<"All" | CustomerStatus>("All");
  const [showAdd,      setShowAdd]      = useState(false);
  const [detailCust,   setDetailCust]   = useState<Customer | null>(null);

  // Stats
  const totalCustomers  = customers.length;
  const activeCustomers = customers.filter(c => c.status === "Active").length;
  const newThisMonth    = customers.filter(c => {
    const d = new Date(c.registeredAt);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const vipCustomers = customers.filter(c => c.totalSpent > 20000).length;

  // Filtered list
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

  const handleAdd = (c: Omit<Customer, "id">) => {
    const newId = Math.max(...customers.map(x => x.id), 0) + 1;
    setCustomers(prev => [{ ...c, id: newId }, ...prev]);
  };

  return (
    <div className="min-h-full bg-gray-50 p-4 md:p-6 space-y-5">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-400 text-sm mt-1">Manage and view registered customers</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="self-start sm:self-auto inline-flex items-center gap-2 bg-[#E41E6A] hover:bg-[#c41559] text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-[#E41E6A]/25 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Register Customer
        </button>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard icon={<User      className="w-5 h-5" />} title="Total Customers"  value={totalCustomers}  iconBg="bg-rose-50"    iconColor="text-[#E41E6A]" />
        <StatCard icon={<UserCheck className="w-5 h-5" />} title="Active Customers" value={activeCustomers}  iconBg="bg-emerald-50" iconColor="text-emerald-500" />
        <StatCard icon={<Calendar  className="w-5 h-5" />} title="New This Month"   value={newThisMonth}     iconBg="bg-sky-50"     iconColor="text-sky-500" />
        <StatCard icon={<Banknote  className="w-5 h-5" />} title="VIP Customers"    value={vipCustomers}     iconBg="bg-violet-50"  iconColor="text-violet-500" />
      </div>

      {/* ── Search + Filter ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name, contact, vehicle..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:border-[#E41E6A] focus:ring-1 focus:ring-[#E41E6A]/30 transition-colors placeholder:text-gray-400"
          />
        </div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-gray-400 flex-shrink-0" />
          {(["All", "Active", "Inactive"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilterStatus(f)}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                filterStatus === f
                  ? "bg-[#E41E6A] text-white border-[#E41E6A] shadow-sm shadow-[#E41E6A]/25"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* ── Customer Table ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50">
          <h2 className="text-sm font-bold text-gray-800">Customer List</h2>
          <p className="text-xs text-gray-400 mt-0.5">{filtered.length} customer{filtered.length !== 1 ? "s" : ""} found</p>
        </div>

        {/* Mobile cards */}
        <div className="sm:hidden divide-y divide-gray-50">
          {filtered.length === 0 ? (
            <div className="py-12 flex flex-col items-center text-center">
              <User className="w-8 h-8 text-gray-200 mb-2" />
              <p className="text-sm text-gray-400">No customers found</p>
            </div>
          ) : filtered.map(c => (
            <div key={c.id} className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarColor(c.id)} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                {initials(c.name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-800 truncate">{c.name}</p>
                  <StatusBadge status={c.status} />
                </div>
                <p className="text-xs text-gray-400 truncate">{c.vehicle}</p>
                <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                  <Phone className="w-3 h-3" />{c.contact}
                </p>
              </div>
              <button onClick={() => setDetailCust(c)} className="flex items-center gap-1 text-xs font-medium text-sky-600 hover:text-sky-800 flex-shrink-0">
                <Eye className="w-3.5 h-3.5" />View
              </button>
            </div>
          ))}
        </div>

        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                {["Customer","Contact","Vehicle","Last Service","Total Spent","Status","Actions"].map(h => (
                  <th key={h} className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <User className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">No customers found</p>
                  </td>
                </tr>
              ) : filtered.map(c => (
                <tr key={c.id} className="hover:bg-gray-50/60 transition-colors">
                  {/* Customer */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${avatarColor(c.id)} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                        {initials(c.name)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{c.name}</p>
                        <p className="text-xs text-gray-400">{c.email}</p>
                      </div>
                    </div>
                  </td>
                  {/* Contact */}
                  <td className="px-5 py-3.5 text-sm text-gray-600 whitespace-nowrap">
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-gray-400" />{c.contact}
                    </span>
                  </td>
                  {/* Vehicle */}
                  <td className="px-5 py-3.5 text-sm text-gray-600 whitespace-nowrap">
                    <span className="flex items-center gap-1.5">
                      <Car className="w-3.5 h-3.5 text-gray-400" />{c.vehicle}
                    </span>
                  </td>
                  {/* Last Service */}
                  <td className="px-5 py-3.5">
                    <span className="text-xs text-gray-600 max-w-[160px] block truncate">{c.lastService}</span>
                  </td>
                  {/* Total Spent */}
                  <td className="px-5 py-3.5">
                    <span className="text-sm font-semibold text-gray-800">₱{c.totalSpent.toLocaleString()}</span>
                    <span className="text-xs text-gray-400 block">{c.totalVisits} visit{c.totalVisits !== 1 ? "s" : ""}</span>
                  </td>
                  {/* Status */}
                  <td className="px-5 py-3.5"><StatusBadge status={c.status} /></td>
                  {/* Actions */}
                  <td className="px-5 py-3.5">
                    <button onClick={() => setDetailCust(c)} className="flex items-center gap-1 text-xs font-medium text-sky-600 hover:text-sky-800 transition-colors">
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

      {/* Shared input style */}
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
      `}</style>
    </div>
  );
}

export default FrontDeskCustomers;