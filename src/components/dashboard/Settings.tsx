import { useState, useEffect } from "react";
import {
  Settings as SettingsIcon, Package, Shield, Database,
  Users, Bell, X, Trash2, Edit2, Plus, Search,
  ChevronDown, Save, RefreshCcw, CheckCircle,
  Building2, Phone, Mail, Globe, MapPin, Archive,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../dashboard-ui/card";
import { Button } from "../dashboard-ui/button";
import { Label } from "../dashboard-ui/label";
import { Switch } from "../dashboard-ui/switch";
import { Separator } from "../dashboard-ui/separator";
import { Badge } from "../dashboard-ui/badge";
import {
  getServices, createService, updateService,
  getShopSettings, updateShopSettings, deleteService,
  ServicePackage, ShopSettings,
} from "../../services/settings";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type Tab = "services" | "roles" | "notifications" | "backup" | "business";

interface Role {
  id: number;
  name: string;
  permissions: string;
  users: number;
  dashboard: "admin" | "frontdesk" | "customer";
}

// ─── INITIAL DATA ─────────────────────────────────────────────────────────────

const INITIAL_ROLES: Role[] = [
  { id: 1, name: "Admin",        permissions: "Full Access",            users: 2, dashboard: "admin"     },
  { id: 2, name: "Manager",      permissions: "Edit, View Reports",     users: 3, dashboard: "admin"     },
  { id: 3, name: "Technician",   permissions: "View, Update Status",    users: 8, dashboard: "frontdesk" },
  { id: 4, name: "Receptionist", permissions: "View, Add Appointments", users: 2, dashboard: "frontdesk" },
];

const PERMISSION_LEVELS = [
  "Full Access",
  "Edit, View Reports",
  "View, Update Status",
  "View, Add Appointments",
  "View Only",
];

const SERVICE_CATEGORIES = ["Coating","PPF","Detailing","Tinting","Wash"];

const DASHBOARD_OPTIONS: { value: Role["dashboard"]; label: string; color: string }[] = [
  { value: "admin",     label: "Admin",      color: "bg-[#E41E6A]/20 text-[#E41E6A] border-[#E41E6A]/30"   },
  { value: "frontdesk", label: "Front Desk", color: "bg-sky-500/20 text-sky-400 border-sky-500/30"         },
  { value: "customer",  label: "Customer",   color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const inputClass =
  "w-full px-4 h-10 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/25 focus:outline-none focus:border-[#E41E6A] focus:ring-1 focus:ring-[#E41E6A]/30 transition-colors text-sm";

const selectClass = inputClass + " appearance-none pr-8";

function ModalWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm"
      style={{ backgroundColor: "rgba(0,0,0,0.8)" }}>
      {children}
    </div>
  );
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="text-sm font-medium text-white/70">
      {children}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

function SuccessBanner({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div className="flex items-center gap-2 text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-2.5">
      <CheckCircle className="w-4 h-4 flex-shrink-0" />
      <span className="flex-1">{message}</span>
      <button onClick={onDismiss} className="text-emerald-400/60 hover:text-emerald-400"><X className="w-3.5 h-3.5" /></button>
    </div>
  );
}

// ─── TAB NAV ──────────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "services",      label: "Services",       icon: Package      },
  { id: "roles",         label: "Roles",          icon: Shield       },
  { id: "notifications", label: "Notifications",  icon: Bell         },
  { id: "backup",        label: "Backup",         icon: Database     },
  { id: "business",      label: "Business Info",  icon: Building2    },
];

// ─── SERVICE MODAL ────────────────────────────────────────────────────────────

function ServiceModal({
  mode, initial, onClose, onSave,
}: {
  mode: "add" | "edit";
  initial?: ServicePackage;
  onClose: () => void;
  onSave: (s: { name: string; category: string; duration: string; price: number }) => Promise<void>;
}) {
  const [form, setForm] = useState({
    name:     initial?.name     ?? "",
    category: initial?.category ?? "",
    duration: initial?.duration ?? "",
    price:    String(initial?.price ?? ""),
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!form.name || !form.category || !form.price) {
      alert("Please fill in Name, Category, and Price."); return;
    }
    setIsSaving(true);
    try {
      await onSave({ ...form, price: parseFloat(form.price) });
      onClose();
    } catch (error: any) {
      alert(`Database Error: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ModalWrapper>
      <div className="bg-[#0a0a0a] border border-white/10 rounded-xl w-full max-w-md shadow-2xl flex flex-col">
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white">{mode === "add" ? "Add Service Package" : "Edit Service Package"}</h2>
            <p className="text-white/50 text-xs mt-0.5">{mode === "add" ? "Create a new service offering" : `Editing ${initial?.name}`}</p>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <FieldLabel required>Service Name</FieldLabel>
            <input className={inputClass} placeholder="e.g. 9H Ceramic Coating" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <FieldLabel required>Category</FieldLabel>
              <div className="relative">
                <select className={selectClass} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  <option value="" disabled className="bg-[#0a0a0a]">Select...</option>
                  {SERVICE_CATEGORIES.map(c => <option key={c} value={c} className="bg-[#0a0a0a]">{c}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
              </div>
            </div>
            <div className="space-y-1.5">
              <FieldLabel required>Base Price (₱)</FieldLabel>
              <input type="number" className={inputClass} placeholder="0" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Estimated Duration</FieldLabel>
            <input className={inputClass} placeholder="e.g. 3-4 hours" value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} />
          </div>
        </div>

        <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3">
          <Button variant="outline" className="border-white/10 text-white hover:bg-white/10" onClick={onClose}>Cancel</Button>
          <Button className="bg-gradient-to-r from-[#E41E6A] to-pink-600 text-white border-none hover:opacity-90" onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : mode === "add" ? "Add Service" : "Update Service"}
          </Button>
        </div>
      </div>
    </ModalWrapper>
  );
}

// ─── ROLE MODAL ───────────────────────────────────────────────────────────────

function RoleModal({
  mode, initial, onClose, onSave,
}: {
  mode: "add" | "edit";
  initial?: Role;
  onClose: () => void;
  onSave: (r: Omit<Role, "id" | "users">) => void;
}) {
  const [form, setForm] = useState({
    name:        initial?.name        ?? "",
    permissions: initial?.permissions ?? "",
    dashboard:   initial?.dashboard   ?? ("frontdesk" as Role["dashboard"]),
  });

  const handleSave = () => {
    if (!form.name || !form.permissions) {
      alert("Please fill in Role Name and Permissions."); return;
    }
    onSave(form);
    onClose();
  };

  return (
    <ModalWrapper>
      <div className="bg-[#0a0a0a] border border-white/10 rounded-xl w-full max-w-md shadow-2xl flex flex-col">
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white">{mode === "add" ? "Add User Role" : `Edit Role: ${initial?.name}`}</h2>
            <p className="text-white/50 text-xs mt-0.5">Define what this role can access</p>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <FieldLabel required>Role Name</FieldLabel>
            <input className={inputClass} placeholder="e.g. Lead Detailer" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <FieldLabel required>Permissions</FieldLabel>
            <div className="relative">
              <select className={selectClass} value={form.permissions} onChange={e => setForm({ ...form, permissions: e.target.value })}>
                <option value="" disabled className="bg-[#0a0a0a]">Select level...</option>
                {PERMISSION_LEVELS.map(p => <option key={p} value={p} className="bg-[#0a0a0a]">{p}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
            </div>
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Dashboard Access</FieldLabel>
            <div className="flex gap-2">
              {DASHBOARD_OPTIONS.map(d => (
                <button
                  key={d.value}
                  onClick={() => setForm({ ...form, dashboard: d.value })}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                    form.dashboard === d.value ? d.color : "bg-white/5 text-white/50 border-white/10 hover:bg-white/10"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
          {mode === "edit" && initial && (
            <div className="p-3 bg-white/5 rounded-lg border border-white/10">
              <p className="text-white/50 text-xs">Currently assigned to <span className="text-white font-bold">{initial.users}</span> users.</p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3">
          <Button variant="outline" className="border-white/10 text-white hover:bg-white/10" onClick={onClose}>Cancel</Button>
          <Button className="bg-gradient-to-r from-[#E41E6A] to-pink-600 text-white border-none hover:opacity-90" onClick={handleSave}>
            {mode === "add" ? "Save Role" : "Update Role"}
          </Button>
        </div>
      </div>
    </ModalWrapper>
  );
}

// ─── DELETE CONFIRM MODAL ─────────────────────────────────────────────────────

function ConfirmDeleteModal({ label, onClose, onConfirm }: { label: string; onClose: () => void; onConfirm: () => void }) {
  return (
    <ModalWrapper>
      <div className="bg-[#0a0a0a] border border-white/10 rounded-xl w-full max-w-sm shadow-2xl">
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <h2 className="text-lg font-bold text-white">Confirm Delete</h2>
          <button onClick={onClose} className="text-white/50 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6">
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-6 h-6 text-red-400" />
          </div>
          <p className="text-white text-center text-sm">
            Delete <span className="font-bold text-[#E41E6A]">{label}</span>? This cannot be undone.
          </p>
        </div>
        <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3">
          <Button variant="outline" className="border-white/10 text-white hover:bg-white/10" onClick={onClose}>Cancel</Button>
          <Button className="bg-red-600 hover:bg-red-700 text-white border-none" onClick={onConfirm}>Delete</Button>
        </div>
      </div>
    </ModalWrapper>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export function Settings() {
  const [activeTab,   setActiveTab]   = useState<Tab>("services");
  const [isLoading,   setIsLoading]   = useState(true);
  const [successMsg,  setSuccessMsg]  = useState("");
  const [serviceSearch, setServiceSearch] = useState("");

  // Services
  const [services,       setServices]       = useState<ServicePackage[]>([]);
  const [serviceModal,   setServiceModal]   = useState<{ mode: "add" | "edit"; item?: ServicePackage } | null>(null);
  const [serviceToDelete, setServiceToDelete] = useState<ServicePackage | null>(null);
  // Roles
  const [roles,       setRoles]       = useState<Role[]>(INITIAL_ROLES);
  const [roleModal,   setRoleModal]   = useState<{ mode: "add" | "edit"; item?: Role } | null>(null);
  const [deleteRole,  setDeleteRole]  = useState<Role | null>(null);

  // Notifications
  const [notifs, setNotifs] = useState({
    email:        false,
    lowStock:     true,
    appointments: true,
    payments:     true,
    sms:          false,
  });

  // Business info
  const [businessInfo,  setBusinessInfo]  = useState<ShopSettings>({ business_name: "", contact_number: "", email: "", website: "", address: "" });
  const [isSavingInfo,  setIsSavingInfo]  = useState(false);

  useEffect(() => { fetchData(); }, []);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3500);
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [servicesData, settingsData] = await Promise.all([getServices(), getShopSettings()]);
      setServices(servicesData);
      if (settingsData) setBusinessInfo(settingsData);
    } catch (error) {
      console.error("Failed to load settings data", error);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Service handlers ─────────────────────────────────────────────────────
  const handleSaveService = async (form: { name: string; category: string; duration: string; price: number }) => {
    if (serviceModal?.mode === "add") {
      const added = await createService({ ...form, duration: form.duration || "N/A" });
      setServices(prev => [...prev, added].sort((a, b) => a.name.localeCompare(b.name)));
      showSuccess(`"${added.name}" added successfully.`);
    } else if (serviceModal?.item) {
      const updated = await updateService(serviceModal.item.id, { ...form, duration: form.duration || "N/A" });
      setServices(prev => prev.map(s => s.id === updated.id ? updated : s).sort((a, b) => a.name.localeCompare(b.name)));
      showSuccess(`"${updated.name}" updated successfully.`);
    }
  };

  const handleDeleteService = async (s: ServicePackage) => {
  try {
    // Now 'deleteService' refers to your API import!
    await deleteService(s.id); 
    setServices(prev => prev.filter(x => x.id !== s.id));
    showSuccess(`"${s.name}" removed.`);
  } catch (error: any) {
    alert(`Failed to delete service: ${error.message}`);
  } finally {
    setServiceToDelete(null); // Change this
  }
};

  // ── Role handlers ─────────────────────────────────────────────────────────
  const handleSaveRole = (form: Omit<Role, "id" | "users">) => {
    if (roleModal?.mode === "add") {
      const newId = roles.length > 0 ? Math.max(...roles.map(r => r.id)) + 1 : 1;
      setRoles(prev => [...prev, { ...form, id: newId, users: 0 }]);
      showSuccess(`Role "${form.name}" added.`);
    } else if (roleModal?.item) {
      setRoles(prev => prev.map(r => r.id === roleModal.item!.id ? { ...r, ...form } : r));
      showSuccess(`Role "${form.name}" updated.`);
    }
  };

  const handleDeleteRole = (r: Role) => {
    setRoles(prev => prev.filter(x => x.id !== r.id));
    setDeleteRole(null);
    showSuccess(`Role "${r.name}" deleted.`);
  };

  // ── Business info handler ─────────────────────────────────────────────────
  const handleSaveBusinessInfo = async () => {
    setIsSavingInfo(true);
    try {
      // 1. Strip out the read-only database fields
      const { id, updated_at, ...cleanInfo } = businessInfo as any;

      // 2. Send only the editable business data to the backend
      await updateShopSettings(cleanInfo);
      
      showSuccess("Business information saved.");
    } catch (error: any) {
      alert(`Failed to save: ${error.message}`);
    } finally {
      setIsSavingInfo(false);
    }
  };

  // ── Filtered services ─────────────────────────────────────────────────────
  const filteredServices = services.filter(s =>
    s.name.toLowerCase().includes(serviceSearch.toLowerCase()) ||
    s.category.toLowerCase().includes(serviceSearch.toLowerCase())
  );

  const CATEGORY_COLORS: Record<string, string> = {
    Coating:   "bg-[#E41E6A]/20 text-[#E41E6A] border-[#E41E6A]/30",
    PPF:       "bg-violet-500/20 text-violet-400 border-violet-500/30",
    Detailing: "bg-sky-500/20 text-sky-400 border-sky-500/30",
    Tinting:   "bg-amber-500/20 text-amber-400 border-amber-500/30",
    Wash:      "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  };

  return (
    <div className="space-y-6 w-full">

      {/* ── Header ── */}
      <div>
        <h1 className="text-white text-3xl font-bold mb-1">System Settings</h1>
        <p className="text-white/60 text-sm">Configure your system preferences and settings</p>
      </div>

      {/* ── Success banner ── */}
      {successMsg && <SuccessBanner message={successMsg} onDismiss={() => setSuccessMsg("")} />}

      {/* ── Tab Navigation ── */}
      <div className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/10 flex-wrap">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-1 justify-center ${
              activeTab === t.id
                ? "bg-[#E41E6A] text-white shadow-md"
                : "text-white/60 hover:text-white hover:bg-white/10"
            }`}
          >
            <t.icon className="w-4 h-4 flex-shrink-0" />
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════
           TAB: SERVICES
      ══════════════════════════════════════ */}
      {activeTab === "services" && (
        <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur overflow-hidden">
          <CardHeader className="border-b border-white/10 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-[#E41E6A]" />
                <CardTitle className="text-white">Service Packages</CardTitle>
                <span className="text-white/40 text-xs ml-1">{services.length} total</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40 pointer-events-none" />
                  <input
                    className="pl-8 pr-3 py-2 text-xs bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-[#E41E6A] w-40 transition-colors"
                    placeholder="Search services..."
                    value={serviceSearch}
                    onChange={e => setServiceSearch(e.target.value)}
                  />
                </div>
                <Button size="sm" className="bg-gradient-to-r from-[#E41E6A] to-pink-600 text-white border-none flex items-center gap-1.5" onClick={() => setServiceModal({ mode: "add" })}>
                  <Plus className="w-3.5 h-3.5" />Add Package
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="text-white/50 py-12 text-center">Loading services...</div>
            ) : filteredServices.length === 0 ? (
              <div className="text-white/50 py-12 text-center">
                <Package className="w-10 h-10 mx-auto mb-3 text-white/20" />
                {serviceSearch ? "No services match your search." : "No service packages found."}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left text-xs font-semibold text-white/50 uppercase tracking-wide px-5 py-3.5">Service Name</th>
                      <th className="text-left text-xs font-semibold text-white/50 uppercase tracking-wide px-4 py-3.5">Category</th>
                      <th className="text-left text-xs font-semibold text-white/50 uppercase tracking-wide px-4 py-3.5">Duration</th>
                      <th className="text-left text-xs font-semibold text-white/50 uppercase tracking-wide px-4 py-3.5">Price</th>
                      <th className="text-right text-xs font-semibold text-white/50 uppercase tracking-wide px-5 py-3.5">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredServices.map(s => (
                      <tr key={s.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-5 py-3.5 text-white font-medium">{s.name}</td>
                        <td className="px-4 py-3.5">
                          <Badge variant="outline" className={CATEGORY_COLORS[s.category] ?? "border-white/20 text-white/60"}>
                            {s.category}
                          </Badge>
                        </td>
                        <td className="px-4 py-3.5 text-white/60 text-sm">{s.duration || "N/A"}</td>
                        <td className="px-4 py-3.5 text-white font-semibold">₱{Number(s.price).toLocaleString()}</td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setServiceModal({ mode: "edit", item: s })}
                              className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#E41E6A]/30 text-[#E41E6A] hover:bg-[#E41E6A]/10 transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
  onClick={() => setServiceToDelete(s)} // Change this
  className="..."
>
  <Trash2 className="w-3.5 h-3.5" />
</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ══════════════════════════════════════
           TAB: ROLES
      ══════════════════════════════════════ */}
      {activeTab === "roles" && (
        <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur overflow-hidden">
          <CardHeader className="border-b border-white/10 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#E41E6A]" />
                <CardTitle className="text-white">User Roles & Permissions</CardTitle>
              </div>
              <Button size="sm" className="bg-gradient-to-r from-[#E41E6A] to-pink-600 text-white border-none flex items-center gap-1.5" onClick={() => setRoleModal({ mode: "add" })}>
                <Plus className="w-3.5 h-3.5" />Add Role
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {roles.length === 0 ? (
              <div className="text-white/50 py-12 text-center">No roles found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left text-xs font-semibold text-white/50 uppercase tracking-wide px-5 py-3.5">Role</th>
                      <th className="text-left text-xs font-semibold text-white/50 uppercase tracking-wide px-4 py-3.5">Permissions</th>
                      <th className="text-left text-xs font-semibold text-white/50 uppercase tracking-wide px-4 py-3.5">Dashboard</th>
                      <th className="text-left text-xs font-semibold text-white/50 uppercase tracking-wide px-4 py-3.5">Users</th>
                      <th className="text-right text-xs font-semibold text-white/50 uppercase tracking-wide px-5 py-3.5">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {roles.map(r => {
                      const dash = DASHBOARD_OPTIONS.find(d => d.value === r.dashboard);
                      return (
                        <tr key={r.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-[#E41E6A]/10 flex items-center justify-center flex-shrink-0">
                                <Users className="w-3.5 h-3.5 text-[#E41E6A]" />
                              </div>
                              <span className="text-white font-semibold text-sm">{r.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-white/60 text-sm">{r.permissions}</td>
                          <td className="px-4 py-3.5">
                            <Badge variant="outline" className={dash?.color ?? "border-white/20 text-white/60"}>
                              {dash?.label ?? r.dashboard}
                            </Badge>
                          </td>
                          <td className="px-4 py-3.5 text-white text-sm">{r.users} users</td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setRoleModal({ mode: "edit", item: r })}
                                className="w-7 h-7 flex items-center justify-center rounded-lg border border-sky-500/30 text-sky-400 hover:bg-sky-500/10 transition-colors"
                                title="Edit"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteRole(r)}
                                className="w-7 h-7 flex items-center justify-center rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ══════════════════════════════════════
           TAB: NOTIFICATIONS
      ══════════════════════════════════════ */}
      {activeTab === "notifications" && (
        <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur">
          <CardHeader className="border-b border-white/10 pb-4">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-[#E41E6A]" />
              <CardTitle className="text-white">Notification Settings</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="divide-y divide-white/10">
            {[
              { key: "email",        label: "Email Notifications",   desc: "Receive email alerts for important events"  },
              { key: "lowStock",     label: "Low Stock Alerts",       desc: "Get notified when inventory is low"         },
              { key: "appointments", label: "Appointment Reminders",  desc: "Send reminders to customers"               },
              { key: "payments",     label: "Payment Notifications",  desc: "Alerts for pending or late payments"       },
              { key: "sms",          label: "SMS Notifications",      desc: "Receive SMS for critical alerts"           },
            ].map(n => (
              <div key={n.key} className="flex items-center justify-between py-4 first:pt-5 last:pb-5">
                <div>
                  <p className="text-white text-sm font-medium">{n.label}</p>
                  <p className="text-white/50 text-xs mt-0.5">{n.desc}</p>
                </div>
                <Switch
                  checked={notifs[n.key as keyof typeof notifs]}
                  onCheckedChange={val => setNotifs(prev => ({ ...prev, [n.key]: val }))}
                />
              </div>
            ))}
            <div className="pt-5 pb-1 flex justify-end">
              <Button
                className="bg-gradient-to-r from-[#E41E6A] to-pink-600 text-white border-none flex items-center gap-2"
                onClick={() => showSuccess("Notification preferences saved.")}
              >
                <Save className="w-4 h-4" />Save Preferences
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ══════════════════════════════════════
           TAB: BACKUP
      ══════════════════════════════════════ */}
      {activeTab === "backup" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur">
            <CardHeader className="border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-[#E41E6A]" />
                <CardTitle className="text-white">System Backup</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-5">
              {[
                { label: "Backup Frequency",  value: "Daily at 2:00 AM"            },
                { label: "Last Backup",        value: "April 19, 2026 — 2:00 AM"  },
                { label: "Backup Size",        value: "2.4 GB"                     },
                { label: "Storage Location",   value: "Supabase Cloud Storage"     },
              ].map(r => (
                <div key={r.label} className="p-3 bg-white/5 rounded-lg border border-white/10 flex items-center justify-between">
                  <p className="text-white/60 text-xs font-medium">{r.label}</p>
                  <p className="text-white text-sm font-semibold">{r.value}</p>
                </div>
              ))}
              <Button
                className="w-full bg-gradient-to-r from-[#E41E6A] to-pink-600 text-white border-none flex items-center gap-2"
                onClick={() => { showSuccess("Manual backup initiated. This may take a few minutes."); }}
              >
                <Database className="w-4 h-4" />Backup Now
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur">
            <CardHeader className="border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <RefreshCcw className="w-5 h-5 text-[#E41E6A]" />
                <CardTitle className="text-white">Backup History</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-5 space-y-2">
              {[
                { date: "Apr 19, 2026 — 2:00 AM", size: "2.4 GB", status: "Success" },
                { date: "Apr 18, 2026 — 2:00 AM", size: "2.3 GB", status: "Success" },
                { date: "Apr 17, 2026 — 2:00 AM", size: "2.3 GB", status: "Success" },
                { date: "Apr 16, 2026 — 2:00 AM", size: "2.2 GB", status: "Success" },
              ].map((b, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                  <div>
                    <p className="text-white text-xs font-medium">{b.date}</p>
                    <p className="text-white/40 text-xs">{b.size}</p>
                  </div>
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">{b.status}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ══════════════════════════════════════
           TAB: BUSINESS INFO
      ══════════════════════════════════════ */}
      {activeTab === "business" && (
        <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur">
          <CardHeader className="border-b border-white/10 pb-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#E41E6A]" />
              <CardTitle className="text-white">Business Information</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-white/70 text-sm flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" />Business Name</Label>
                <input className={inputClass} placeholder="e.g. Ceramic Pro Davao" value={businessInfo.business_name} onChange={e => setBusinessInfo({ ...businessInfo, business_name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-white/70 text-sm flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />Contact Number</Label>
                <input className={inputClass} placeholder="+63 XXX XXX XXXX" value={businessInfo.contact_number} onChange={e => setBusinessInfo({ ...businessInfo, contact_number: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-white/70 text-sm flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />Email Address</Label>
                <input className={inputClass} placeholder="email@example.com" value={businessInfo.email} onChange={e => setBusinessInfo({ ...businessInfo, email: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-white/70 text-sm flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" />Website</Label>
                <input className={inputClass} placeholder="https://example.com" value={businessInfo.website} onChange={e => setBusinessInfo({ ...businessInfo, website: e.target.value })} />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-white/70 text-sm flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />Business Address</Label>
                <input className={inputClass} placeholder="Full business address" value={businessInfo.address} onChange={e => setBusinessInfo({ ...businessInfo, address: e.target.value })} />
              </div>
            </div>
            <div className="mt-6 pt-5 border-t border-white/10 flex justify-end">
              <Button
                className="bg-gradient-to-r from-[#E41E6A] to-pink-600 text-white border-none flex items-center gap-2"
                onClick={handleSaveBusinessInfo}
                disabled={isSavingInfo}
              >
                <Save className="w-4 h-4" />
                {isSavingInfo ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Modals ── */}
      {serviceModal && (
        <ServiceModal
          mode={serviceModal.mode}
          initial={serviceModal.item}
          onClose={() => setServiceModal(null)}
          onSave={handleSaveService}
        />
      )}
      {roleModal && (
        <RoleModal
          mode={roleModal.mode}
          initial={roleModal.item}
          onClose={() => setRoleModal(null)}
          onSave={handleSaveRole}
        />
      )}
      {serviceToDelete && (
  <ConfirmDeleteModal
    label={serviceToDelete.name}
    onClose={() => setServiceToDelete(null)}
    onConfirm={() => handleDeleteService(serviceToDelete)}
      />
      )}
      {deleteRole && (
        <ConfirmDeleteModal
          label={deleteRole.name}
          onClose={() => setDeleteRole(null)}
          onConfirm={() => handleDeleteRole(deleteRole)}
        />
      )}
    </div>
  );
}