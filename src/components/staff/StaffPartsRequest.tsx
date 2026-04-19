import { useState, useEffect, useMemo } from "react";
import {
  Package, Plus, Search, X, ChevronDown, SlidersHorizontal,
  CheckCircle, Clock, XCircle, AlertTriangle, Hash,
  ClipboardList, Wrench, Shield, Layers, Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../dashboard-ui/card";
import { useAuth } from "../../hooks/useAuth";
import { getInventory, InventoryItem } from "../../services/inventory";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type RequestStatus = "Pending" | "Approved" | "Rejected";

interface PartRequest {
  id: number;
  itemId:    string | number;
  itemName:  string;
  category:  string;
  quantity:  number;
  unit:      string;
  reason:    string;
  jobRef:    string;
  status:    RequestStatus;
  requestedAt: string;
  note:      string;
}

// ─── STATUS CONFIG ─────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<RequestStatus, { bg: string; text: string; dot: string; border: string; icon: React.ReactNode }> = {
  Pending:  { bg: "bg-yellow-500/20", text: "text-yellow-400", dot: "bg-yellow-400", border: "border-yellow-500/30", icon: <Clock     className="w-3.5 h-3.5" /> },
  Approved: { bg: "bg-green-500/20",  text: "text-green-400",  dot: "bg-green-500",  border: "border-green-500/30",  icon: <CheckCircle className="w-3.5 h-3.5" /> },
  Rejected: { bg: "bg-red-500/20",    text: "text-red-400",    dot: "bg-red-500",    border: "border-red-500/30",    icon: <XCircle   className="w-3.5 h-3.5" /> },
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const inputClass = "w-full px-4 h-10 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/25 focus:outline-none focus:border-[#E41E6A] focus:ring-1 focus:ring-[#E41E6A]/30 transition-colors text-sm";

function categoryIcon(cat: string) {
  if (cat === "Coating")  return <Shield   className="w-4 h-4 text-[#E41E6A]"  />;
  if (cat === "PPF")      return <Layers   className="w-4 h-4 text-violet-400" />;
  if (cat === "Tinting")  return <Sparkles className="w-4 h-4 text-sky-400"    />;
  if (cat === "Detailing") return <Wrench  className="w-4 h-4 text-emerald-400"/>;
  return                          <Package className="w-4 h-4 text-white/50"   />;
}

function formatDateTime(raw: string) {
  return new Date(raw).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function StatusBadge({ status }: { status: RequestStatus }) {
  const s = STATUS_STYLE[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${s.bg} ${s.text} ${s.border}`}>
      {s.icon}{status}
    </span>
  );
}

// ─── REQUEST MODAL ────────────────────────────────────────────────────────────

function RequestModal({ inventory, onClose, onSubmit }: {
  inventory: InventoryItem[];
  onClose: () => void;
  onSubmit: (data: Omit<PartRequest, "id" | "status" | "requestedAt" | "itemId" | "itemName" | "category" | "unit"> & { itemId: string | number }) => void;
}) {
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [form, setForm] = useState({ quantity: "1", reason: "", jobRef: "", note: "" });
  const [error, setError] = useState("");

  const handleItemChange = (id: string) => {
    const found = inventory.find(i => String(i.id) === id);
    setSelectedItem(found ?? null);
  };

  const handleSubmit = () => {
    if (!selectedItem)      { setError("Please select an item.");           return; }
    if (!form.quantity || parseInt(form.quantity) < 1) { setError("Enter a valid quantity."); return; }
    if (!form.reason.trim()) { setError("Please provide a reason.");        return; }
    if (parseInt(form.quantity) > selectedItem.stock) {
      setError(`Only ${selectedItem.stock} ${selectedItem.unit} in stock.`); return;
    }
    onSubmit({ itemId: selectedItem.id, quantity: parseInt(form.quantity), reason: form.reason, jobRef: form.jobRef, note: form.note });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm" style={{ backgroundColor: "rgba(0,0,0,0.8)" }}>
      <div className="bg-[#0a0a0a] border border-white/10 rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white">Request Parts</h2>
            <p className="text-white/50 text-xs mt-0.5">Request supplies from inventory</p>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-4">
          {/* Item selector */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-white/70">Item <span className="text-red-500">*</span></label>
            <div className="relative">
              <select
                className={inputClass + " appearance-none pr-8"}
                value={selectedItem ? String(selectedItem.id) : ""}
                onChange={e => handleItemChange(e.target.value)}
              >
                <option value="" className="bg-[#0a0a0a]">Select an item...</option>
                {inventory.map(i => (
                  <option key={i.id} value={String(i.id)} className="bg-[#0a0a0a]">
                    {i.name} — {i.stock} {i.unit} available
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
            </div>

            {/* Selected item preview */}
            {selectedItem && (
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10 mt-2">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                  {categoryIcon(selectedItem.category)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{selectedItem.name}</p>
                  <p className="text-white/50 text-xs">{selectedItem.category} · {selectedItem.stock} {selectedItem.unit} in stock</p>
                </div>
                {selectedItem.stock <= selectedItem.reorderLevel && (
                  <AlertTriangle className="w-4 h-4 text-orange-400 flex-shrink-0" />
                )}
              </div>
            )}
          </div>

          {/* Quantity */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-white/70">Quantity <span className="text-red-500">*</span></label>
            <input
              type="number"
              min="1"
              max={selectedItem?.stock ?? 999}
              className={inputClass}
              placeholder="1"
              value={form.quantity}
              onChange={e => setForm({ ...form, quantity: e.target.value })}
            />
          </div>

          {/* Job reference */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-white/70">Job Reference</label>
            <input
              className={inputClass}
              placeholder="e.g. JO-2026-0001 or appointment ID"
              value={form.jobRef}
              onChange={e => setForm({ ...form, jobRef: e.target.value })}
            />
          </div>

          {/* Reason */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-white/70">Reason <span className="text-red-500">*</span></label>
            <div className="relative">
              <select
                className={inputClass + " appearance-none pr-8"}
                value={form.reason}
                onChange={e => setForm({ ...form, reason: e.target.value })}
              >
                <option value="" className="bg-[#0a0a0a]">Select reason...</option>
                {[
                  "For current job",
                  "Running low on supply",
                  "Replacement for damaged item",
                  "Preparation for upcoming job",
                  "Other",
                ].map(r => <option key={r} value={r} className="bg-[#0a0a0a]">{r}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
            </div>
          </div>

          {/* Additional notes */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-white/70">Additional Notes</label>
            <textarea
              className={inputClass + " resize-none h-16 py-2.5"}
              placeholder="Any additional details..."
              value={form.note}
              onChange={e => setForm({ ...form, note: e.target.value })}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              <X className="w-4 h-4 flex-shrink-0" />{error}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium border border-white/10 text-white hover:bg-white/10 rounded-lg transition-colors">Cancel</button>
          <button onClick={handleSubmit} className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#E41E6A] to-pink-600 hover:from-[#c41559] rounded-lg transition-all">
            Submit Request
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export function StaffPartsRequest() {
  const { profile }  = useAuth();
  const [inventory,  setInventory]  = useState<InventoryItem[]>([]);
  const [requests,   setRequests]   = useState<PartRequest[]>([]);
  const [isLoading,  setIsLoading]  = useState(true);
  const [showModal,  setShowModal]  = useState(false);
  const [search,     setSearch]     = useState("");
  const [filterStatus, setFilterStatus] = useState<"All" | RequestStatus>("All");
  const [nextId,     setNextId]     = useState(1);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const inv = await getInventory().catch(() => []);
      setInventory(inv);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (data: any) => {
    const item = inventory.find(i => String(i.id) === String(data.itemId));
    if (!item) return;
    const newRequest: PartRequest = {
      id:          nextId,
      itemId:      data.itemId,
      itemName:    item.name,
      category:    item.category,
      quantity:    data.quantity,
      unit:        item.unit,
      reason:      data.reason,
      jobRef:      data.jobRef,
      status:      "Pending",
      requestedAt: new Date().toISOString(),
      note:        data.note,
    };
    setRequests(prev => [newRequest, ...prev]);
    setNextId(n => n + 1);
  };

  // Stats
  const pendingCount  = requests.filter(r => r.status === "Pending").length;
  const approvedCount = requests.filter(r => r.status === "Approved").length;
  const totalCount    = requests.length;

  const filtered = useMemo(() =>
    requests
      .filter(r => filterStatus === "All" || r.status === filterStatus)
      .filter(r =>
        r.itemName.toLowerCase().includes(search.toLowerCase()) ||
        r.reason.toLowerCase().includes(search.toLowerCase())  ||
        r.jobRef.toLowerCase().includes(search.toLowerCase())
      ),
    [requests, search, filterStatus]
  );

  return (
    <div className="space-y-6 w-full">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-white text-3xl font-bold mb-1">Request Parts</h1>
          <p className="text-white/60 text-sm">Request supplies and materials from inventory</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="self-start sm:self-auto inline-flex items-center gap-2 bg-gradient-to-r from-[#E41E6A] to-pink-600 hover:from-[#c41559] text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-[#E41E6A]/25 transition-all"
        >
          <Plus className="w-4 h-4" />New Request
        </button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Requests", value: totalCount,    icon: <ClipboardList className="w-4 h-4" />, iconBg: "bg-[#E41E6A]/10",  iconColor: "text-[#E41E6A]"   },
          { label: "Pending",        value: pendingCount,  icon: <Clock         className="w-4 h-4" />, iconBg: "bg-yellow-500/10", iconColor: "text-yellow-400" },
          { label: "Approved",       value: approvedCount, icon: <CheckCircle   className="w-4 h-4" />, iconBg: "bg-green-500/10",  iconColor: "text-green-400"  },
        ].map((s, i) => (
          <Card key={i} className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur" style={{ borderRadius: "12px" }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-white/70">{s.label}</CardTitle>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${s.iconBg}`}>
                <span className={s.iconColor}>{s.icon}</span>
              </div>
            </CardHeader>
            <CardContent style={{ paddingBottom: "20px" }}>
              <div className="text-white text-2xl font-bold">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Available Inventory Preview ── */}
      <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur" style={{ borderRadius: "12px" }}>
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-violet-400" />Available Inventory
          </CardTitle>
          <p className="text-white/50 text-xs mt-0.5">Current stock levels — click New Request to request items</p>
        </CardHeader>
        <CardContent style={{ paddingBottom: "20px" }}>
          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <div className="w-6 h-6 border-2 border-[#E41E6A]/30 border-t-[#E41E6A] rounded-full animate-spin" />
            </div>
          ) : inventory.length === 0 ? (
            <p className="text-white/50 text-sm text-center py-4">No inventory data available.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {inventory.slice(0, 6).map(item => (
                <div key={item.id} className={`p-3 rounded-xl border flex items-center gap-3 ${
                  item.stock <= item.reorderLevel
                    ? "bg-orange-500/5 border-orange-500/20"
                    : "bg-white/5 border-white/10"
                }`}>
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                    {categoryIcon(item.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-semibold truncate">{item.name}</p>
                    <p className={`text-xs mt-0.5 ${item.stock <= item.reorderLevel ? "text-orange-400" : "text-white/50"}`}>
                      {item.stock} {item.unit} {item.stock <= item.reorderLevel ? "· Low" : "available"}
                    </p>
                  </div>
                  {item.stock <= item.reorderLevel && (
                    <AlertTriangle className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          )}
          {inventory.length > 6 && (
            <p className="text-white/30 text-xs text-center mt-3">+{inventory.length - 6} more items available in inventory</p>
          )}
        </CardContent>
      </Card>

      {/* ── Search + Filters ── */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by item name, reason, or job ref..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#E41E6A] focus:ring-1 focus:ring-[#E41E6A]/30 transition-colors"
          />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <SlidersHorizontal className="w-4 h-4 text-white/40 flex-shrink-0" />
          {(["All", "Pending", "Approved", "Rejected"] as const).map(f => (
            <button key={f} onClick={() => setFilterStatus(f)}
              className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                filterStatus === f
                  ? "bg-[#E41E6A] text-white border-[#E41E6A]"
                  : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white"
              }`}>{f}
            </button>
          ))}
        </div>
      </div>

      {/* ── Request History ── */}
      <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur overflow-hidden" style={{ borderRadius: "12px" }}>
        <CardHeader className="border-b border-white/10 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-[#E41E6A]" />My Requests
            </CardTitle>
            <span className="text-white/40 text-xs">{filtered.length} request{filtered.length !== 1 ? "s" : ""}</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="py-12 flex flex-col items-center text-center">
              <Package className="w-10 h-10 text-white/20 mb-3" />
              <p className="text-white/50 text-sm">No requests yet</p>
              <button onClick={() => setShowModal(true)} className="mt-2 text-xs text-[#E41E6A] hover:text-pink-400 transition-colors">
                Submit your first request →
              </button>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {filtered.map(r => (
                <div key={r.id} className="flex items-start gap-4 px-5 py-4 hover:bg-white/5 transition-colors">
                  {/* Icon */}
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    {categoryIcon(r.category)}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      <p className="text-white text-sm font-semibold">{r.itemName}</p>
                      <span className="text-xs text-white/40">× {r.quantity} {r.unit}</span>
                    </div>
                    <p className="text-white/50 text-xs">{r.reason}</p>
                    {r.jobRef && (
                      <p className="text-white/40 text-xs flex items-center gap-1 mt-0.5">
                        <Hash className="w-3 h-3" />{r.jobRef}
                      </p>
                    )}
                    <p className="text-white/30 text-xs mt-1">{formatDateTime(r.requestedAt)}</p>
                  </div>

                  {/* Status */}
                  <div className="flex-shrink-0 mt-0.5">
                    <StatusBadge status={r.status} />
                    {r.note && (
                      <p className="text-white/40 text-xs mt-1.5 max-w-[120px] truncate text-right">{r.note}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {showModal && (
        <RequestModal
          inventory={inventory}
          onClose={() => setShowModal(false)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}

export default StaffPartsRequest;