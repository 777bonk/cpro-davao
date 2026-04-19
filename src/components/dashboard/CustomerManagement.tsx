import { useState, useEffect, useMemo } from "react";
import {
  Search, Plus, X, User, Phone, Car, Clock,
  Eye, ChevronDown, SlidersHorizontal,
  UserCheck, Calendar, Archive,
  TrendingUp, Edit2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../dashboard-ui/card";
import { Button } from "../dashboard-ui/button";
import { Badge } from "../dashboard-ui/badge";
import { Label } from "../dashboard-ui/label";
import { getCustomers, createCustomer, Customer } from "../../services/customer";

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "N/A";
  const d = new Date(dateStr);
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
const avatarColor = (id: number | string) =>
  AVATAR_COLORS[Number(id) % AVATAR_COLORS.length];

// ─── MODAL WRAPPER ────────────────────────────────────────────────────────────

function ModalWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm"
      style={{ backgroundColor: "rgba(0,0,0,0.8)" }}
    >
      {children}
    </div>
  );
}

const inputClass =
  "w-full px-4 h-10 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/25 focus:outline-none focus:border-[#E41E6A] focus:ring-1 focus:ring-[#E41E6A]/30 transition-colors text-sm";

// ─── VIEW DETAIL MODAL ────────────────────────────────────────────────────────

function DetailModal({ customer, onClose, onEdit }: {
  customer: Customer;
  onClose: () => void;
  onEdit: () => void;
}) {
  const Row = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
    <div className="p-4 bg-white/5 rounded-lg border border-white/10 flex items-start gap-3">
      <div className="mt-0.5 text-[#E41E6A] flex-shrink-0">{icon}</div>
      <div>
        <p className="text-white/50 text-xs">{label}</p>
        <p className="text-white text-sm font-medium mt-0.5">{value}</p>
      </div>
    </div>
  );

  return (
    <ModalWrapper>
      <div className="bg-[#0a0a0a] border border-white/10 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${avatarColor(customer.id ?? 0)} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
              {initials(customer.name)}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{customer.name}</h2>
              <Badge className={customer.status === "Active"
                ? "bg-green-500/20 text-green-400 border-green-500/30"
                : "bg-gray-500/20 text-gray-400 border-gray-500/30"}>
                {customer.status || "Active"}
              </Badge>
            </div>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-3">
          <Row icon={<Phone    className="w-4 h-4" />} label="Contact Number" value={customer.contact     || "N/A"} />
          <Row icon={<Car      className="w-4 h-4" />} label="Vehicle"        value={customer.vehicle     || "N/A"} />
          <Row icon={<Clock    className="w-4 h-4" />} label="Last Service"   value={formatDate(customer.last_service)} />
          <Row icon={<Calendar className="w-4 h-4" />} label="Registered"     value={formatDate(customer.created_at)} />

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-4 bg-[#E41E6A]/10 rounded-lg border border-[#E41E6A]/20 text-center">
              <p className="text-white/50 text-xs">Total Spent</p>
              <p className="text-[#E41E6A] text-xl font-bold mt-1">
                ₱{Number(customer.total_spent || 0).toLocaleString()}
              </p>
            </div>
            <div className="p-4 bg-white/5 rounded-lg border border-white/10 text-center">
              <p className="text-white/50 text-xs">Status</p>
              <p className="text-white text-sm font-bold mt-2">{customer.status || "Active"}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3">
          <button
            onClick={onEdit}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-[#E41E6A]/30 text-[#E41E6A] hover:bg-[#E41E6A]/10 rounded-lg transition-colors"
          >
            <Edit2 className="w-4 h-4" />Edit
          </button>
          <Button variant="outline" className="border-white/10 text-white" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </ModalWrapper>
  );
}

// ─── ADD CUSTOMER MODAL ───────────────────────────────────────────────────────

function AddCustomerModal({ onClose, onSave }: {
  onClose: () => void;
  onSave: (c: { name: string; contact: string; vehicle: string; last_service: string; total_spent: number; status: "Active" | "Inactive" }) => Promise<void>;
}) {
  const [form, setForm] = useState({
    name: "", contact: "", vehicle: "",
    last_service: "", total_spent: "", status: "Active" as "Active" | "Inactive",
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!form.name || !form.contact || !form.vehicle) {
      alert("Please fill in Name, Contact, and Vehicle."); return;
    }
    setIsSaving(true);
    try {
      await onSave({
        name:         form.name,
        contact:      form.contact,
        vehicle:      form.vehicle,
        last_service: form.last_service || new Date().toISOString().split("T")[0],
        total_spent:  parseFloat(form.total_spent) || 0,
        status:       form.status,
      });
      onClose();
    } catch (error: any) {
      alert(`Database Error: ${error?.message || "Failed to add customer."}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ModalWrapper>
      <div className="bg-[#0a0a0a] border border-white/10 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white">Add New Customer</h2>
            <p className="text-white/50 text-xs mt-0.5">Fill in the customer details below</p>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white/70">Name <span className="text-red-500">*</span></Label>
              <input className={inputClass} placeholder="Full name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label className="text-white/70">Contact <span className="text-red-500">*</span></Label>
              <input className={inputClass} placeholder="09XX-XXX-XXXX" value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-white/70">Vehicle <span className="text-red-500">*</span></Label>
            <input className={inputClass} placeholder="Year Make Model" value={form.vehicle} onChange={e => setForm({ ...form, vehicle: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white/70">Last Service Date</Label>
              <input type="date" className={inputClass + " [color-scheme:dark]"} value={form.last_service} onChange={e => setForm({ ...form, last_service: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label className="text-white/70">Total Spent (₱)</Label>
              <input type="number" className={inputClass} placeholder="0" value={form.total_spent} onChange={e => setForm({ ...form, total_spent: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-white/70">Status</Label>
            <div className="relative">
              <select
                className={inputClass + " appearance-none pr-8"}
                value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value as "Active" | "Inactive" })}
              >
                <option value="Active"   className="bg-[#0a0a0a]">Active</option>
                <option value="Inactive" className="bg-[#0a0a0a]">Inactive</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3">
          <Button variant="outline" className="border-white/10 text-white" onClick={onClose}>Cancel</Button>
          <Button
            className="bg-gradient-to-r from-[#E41E6A] to-pink-600 hover:from-[#c41559] text-white"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Add Customer"}
          </Button>
        </div>
      </div>
    </ModalWrapper>
  );
}

// ─── EDIT CUSTOMER MODAL ──────────────────────────────────────────────────────

function EditCustomerModal({ customer, onClose, onSave }: {
  customer: Customer;
  onClose: () => void;
  onSave: (updated: Customer) => void;
}) {
  const [form, setForm] = useState({
    name:         customer.name         ?? "",
    contact:      customer.contact      ?? "",
    vehicle:      customer.vehicle      ?? "",
    last_service: customer.last_service ?? "",
    total_spent:  String(customer.total_spent ?? ""),
    status:       (customer.status ?? "Active") as "Active" | "Inactive",
  });

  const handleSave = () => {
    if (!form.name || !form.contact || !form.vehicle) {
      alert("Please fill in Name, Contact, and Vehicle."); return;
    }
    onSave({
      ...customer,
      name:         form.name,
      contact:      form.contact,
      vehicle:      form.vehicle,
      last_service: form.last_service,
      total_spent:  parseFloat(form.total_spent) || 0,
      status:       form.status,
    });
    onClose();
  };

  return (
    <ModalWrapper>
      <div className="bg-[#0a0a0a] border border-white/10 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white">Edit Customer</h2>
            <p className="text-white/50 text-xs mt-0.5">Editing {customer.name}</p>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white/70">Name <span className="text-red-500">*</span></Label>
              <input className={inputClass} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label className="text-white/70">Contact <span className="text-red-500">*</span></Label>
              <input className={inputClass} value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-white/70">Vehicle <span className="text-red-500">*</span></Label>
            <input className={inputClass} value={form.vehicle} onChange={e => setForm({ ...form, vehicle: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white/70">Last Service Date</Label>
              <input type="date" className={inputClass + " [color-scheme:dark]"} value={form.last_service} onChange={e => setForm({ ...form, last_service: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label className="text-white/70">Total Spent (₱)</Label>
              <input type="number" className={inputClass} value={form.total_spent} onChange={e => setForm({ ...form, total_spent: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-white/70">Status</Label>
            <div className="relative">
              <select
                className={inputClass + " appearance-none pr-8"}
                value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value as "Active" | "Inactive" })}
              >
                <option value="Active"   className="bg-[#0a0a0a]">Active</option>
                <option value="Inactive" className="bg-[#0a0a0a]">Inactive</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3">
          <Button variant="outline" className="border-white/10 text-white" onClick={onClose}>Cancel</Button>
          <Button className="bg-gradient-to-r from-[#E41E6A] to-pink-600 hover:from-[#c41559] text-white" onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </div>
    </ModalWrapper>
  );
}

// ─── ARCHIVE CONFIRM MODAL ─────────────────────────────────────────────────────

function ArchiveModal({ customer, onClose, onConfirm }: {
  customer: Customer;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <ModalWrapper>
      <div className="bg-[#0a0a0a] border border-white/10 rounded-xl w-full max-w-sm shadow-2xl">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Archive Customer</h2>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
            <Archive className="w-6 h-6 text-amber-400" />
          </div>
          <p className="text-white text-center text-sm leading-relaxed">
            Archive{" "}<span className="font-bold text-[#E41E6A]">{customer.name}</span>?{" "}
            They will be marked as{" "}<span className="font-semibold text-amber-400">Inactive</span>{" "}
            and hidden from active lists. You can restore them anytime by editing their status.
          </p>
        </div>
        <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3">
          <Button variant="outline" className="border-white/10 text-white" onClick={onClose}>Cancel</Button>
          <Button className="bg-amber-500 hover:bg-amber-600 text-white border-none flex items-center gap-2" onClick={onConfirm}><Archive className="w-4 h-4 mr-1" />Archive</Button>
        </div>
      </div>
    </ModalWrapper>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function CustomerManagement() {
  const [customers,      setCustomers]      = useState<Customer[]>([]);
  const [isLoading,      setIsLoading]      = useState(true);
  const [search,         setSearch]         = useState("");
  const [filterStatus,   setFilterStatus]   = useState<"All" | "Active" | "Inactive">("All");

  // Modal states
  const [viewCustomer,   setViewCustomer]   = useState<Customer | null>(null);
  const [editCustomer,   setEditCustomer]   = useState<Customer | null>(null);
  const [archiveCustomer, setArchiveCustomer] = useState<Customer | null>(null);
  const [addOpen,        setAddOpen]        = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = await getCustomers();
      setCustomers(data);
    } catch (error) {
      console.error("Failed to fetch customers", error);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Stats ───────────────────────────────────────────────────────────────────
  const totalCustomers  = customers.length;
  const activeCustomers = customers.filter(c => c.status === "Active").length;
  const vipCount        = customers.filter(c => Number(c.total_spent) > 150000).length;
  const newThisMonth    = customers.filter(c => {
    if (!c.created_at) return false;
    const d = new Date(c.created_at), now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  // ── Filtered list ────────────────────────────────────────────────────────────
  const filtered = useMemo(() =>
    customers
      .filter(c => filterStatus === "All" || c.status === filterStatus)
      .filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase())        ||
        (c.contact ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (c.vehicle ?? "").toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => a.name.localeCompare(b.name)),
    [customers, search, filterStatus]
  );

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleAdd = async (form: { name: string; contact: string; vehicle: string; last_service: string; total_spent: number; status: "Active" | "Inactive" }) => {
    const added = await createCustomer(form);
    setCustomers(prev => [...prev, added].sort((a, b) => a.name.localeCompare(b.name)));
  };

  const handleEdit = (updated: Customer) => {
    setCustomers(prev => prev.map(c => c.id === updated.id ? updated : c));
  };

  const handleArchive = (id: number | string) => {
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, status: "Inactive" as const } : c));
    setArchiveCustomer(null);
    setViewCustomer(null);
  };

  return (
    <div className="space-y-6 w-full">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-white text-3xl font-bold mb-1">Customer Management</h1>
          <p className="text-white/60 text-sm">Manage your customer database and vehicle information</p>
        </div>
        <Button
          className="self-start sm:self-auto bg-gradient-to-r from-[#E41E6A] to-pink-600 hover:from-[#c41559] text-white"
          onClick={() => setAddOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Customer
        </Button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        {[
          { label: "Total Customers",  value: totalCustomers,  icon: <User        className="w-4 h-4" />, color: "text-[#E41E6A]", bg: "bg-[#E41E6A]/10"  },
          { label: "VIP Customers",    value: vipCount,         icon: <TrendingUp  className="w-4 h-4" />, color: "text-violet-400", bg: "bg-violet-500/10" },
          { label: "Active Customers", value: activeCustomers,  icon: <UserCheck   className="w-4 h-4" />, color: "text-green-400",  bg: "bg-green-500/10"  },
          { label: "New This Month",   value: newThisMonth,     icon: <Calendar    className="w-4 h-4" />, color: "text-sky-400",    bg: "bg-sky-500/10"    },
        ].map((s, i) => (
          <Card key={i} className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-white/70">{s.label}</CardTitle>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.bg}`}>
                  <span className={s.color}>{s.icon}</span>
                </div>
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
          <input
            type="text"
            placeholder="Search by name, contact, or vehicle..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#E41E6A] focus:ring-1 focus:ring-[#E41E6A]/30 transition-colors"
          />
        </div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-white/40 flex-shrink-0" />
          {(["All", "Active", "Inactive"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilterStatus(f)}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                filterStatus === f
                  ? "bg-[#E41E6A] text-white border-[#E41E6A] shadow-sm"
                  : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ── */}
      <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur w-full overflow-hidden">
        <CardHeader className="border-b border-white/10 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Customer List</CardTitle>
            <span className="text-white/40 text-xs">{isLoading ? "Loading..." : `${filtered.length} result${filtered.length !== 1 ? "s" : ""}`}</span>
          </div>
        </CardHeader>

        {isLoading ? (
          <div className="text-center py-12 text-white/50">Loading customers...</div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-white/5">
              {filtered.length === 0 ? (
                <div className="py-12 flex flex-col items-center text-center">
                  <User className="w-8 h-8 text-white/20 mb-2" />
                  <p className="text-white/40 text-sm">No customers found</p>
                </div>
              ) : filtered.map(c => (
                <div key={c.id} className="p-4 flex items-center gap-3 hover:bg-white/5 transition-colors">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarColor(c.id ?? 0)} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                    {initials(c.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold truncate">{c.name}</p>
                    <p className="text-white/50 text-xs truncate">{c.vehicle || "N/A"}</p>
                  </div>
                  <Badge className={c.status === "Active"
                    ? "bg-green-500/20 text-green-400 border-green-500/30"
                    : "bg-gray-500/20 text-gray-400 border-gray-500/30"}>
                    {c.status || "Active"}
                  </Badge>
                  <button onClick={() => setViewCustomer(c)} className="text-white/50 hover:text-white transition-colors ml-1">
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    {["Customer", "Contact", "Vehicle", "Last Service", "Total Spent", "Status", "Actions"].map(h => (
                      <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-white/50 uppercase tracking-wide whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12">
                        <User className="w-8 h-8 text-white/20 mx-auto mb-2" />
                        <p className="text-white/40 text-sm">No customers found</p>
                      </td>
                    </tr>
                  ) : filtered.map(c => (
                    <tr key={c.id} className="hover:bg-white/5 transition-colors">
                      {/* Customer */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${avatarColor(c.id ?? 0)} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                            {initials(c.name)}
                          </div>
                          <p className="text-white text-sm font-semibold">{c.name}</p>
                        </div>
                      </td>
                      {/* Contact */}
                      <td className="px-5 py-3.5 text-white/70 text-sm whitespace-nowrap">
                        <span className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-white/40" />{c.contact || "N/A"}
                        </span>
                      </td>
                      {/* Vehicle */}
                      <td className="px-5 py-3.5 text-white/70 text-sm whitespace-nowrap">
                        <span className="flex items-center gap-1.5">
                          <Car className="w-3.5 h-3.5 text-white/40" />{c.vehicle || "N/A"}
                        </span>
                      </td>
                      {/* Last Service */}
                      <td className="px-5 py-3.5">
                        <span className="text-white/60 text-xs">{formatDate(c.last_service)}</span>
                      </td>
                      {/* Total Spent */}
                      <td className="px-5 py-3.5">
                        <span className="text-white text-sm font-semibold">
                          ₱{Number(c.total_spent || 0).toLocaleString()}
                        </span>
                      </td>
                      {/* Status */}
                      <td className="px-5 py-3.5">
                        <Badge className={c.status === "Active"
                          ? "bg-green-500/20 text-green-400 border-green-500/30"
                          : "bg-gray-500/20 text-gray-400 border-gray-500/30"}>
                          {c.status || "Active"}
                        </Badge>
                      </td>
                      {/* Actions */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setViewCustomer(c)}
                            className="flex items-center gap-1 text-xs font-medium text-[#E41E6A] hover:text-pink-400 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />View
                          </button>
                          <button
                            onClick={() => setEditCustomer(c)}
                            className="flex items-center gap-1 text-xs font-medium text-sky-400 hover:text-sky-300 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />Edit
                          </button>
                          <button
                            onClick={() => setArchiveCustomer(c)}
                            className="flex items-center gap-1 text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors"
                          >
                            <Archive className="w-3.5 h-3.5" />Archive
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>

      {/* ── Modals ── */}
      {addOpen && (
        <AddCustomerModal onClose={() => setAddOpen(false)} onSave={handleAdd} />
      )}
      {editCustomer && (
        <EditCustomerModal
          customer={editCustomer}
          onClose={() => setEditCustomer(null)}
          onSave={handleEdit}
        />
      )}
      {viewCustomer && (
        <DetailModal
          customer={viewCustomer}
          onClose={() => setViewCustomer(null)}
          onEdit={() => { setEditCustomer(viewCustomer); setViewCustomer(null); }}
        />
      )}
      {archiveCustomer && (
        <ArchiveModal
          customer={archiveCustomer}
          onClose={() => setArchiveCustomer(null)}
          onConfirm={() => handleArchive(archiveCustomer!.id!)}
        />
      )}
    </div>
  );
}