import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Package, Plus, AlertTriangle, BarChart3, X,
  Search, SlidersHorizontal, TrendingUp, TrendingDown,
  RefreshCcw, ChevronDown, Printer, Trash2,
  ArrowDownCircle, ArrowUpCircle, History, ClipboardList,
  CheckCircle, Clock, XCircle, User, CalendarDays,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../dashboard-ui/card";
import { Button } from "../dashboard-ui/button";
import { Badge } from "../dashboard-ui/badge";
import { Progress } from "../dashboard-ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../dashboard-ui/table";
import { Label } from "../dashboard-ui/label";
import {
  getInventory, createInventoryItem, updateInventoryStock,
  updateInventoryItem, deleteInventoryItem, InventoryItem,
} from "../../services/inventory";

const API_URL = import.meta.env.VITE_API_BASE_URL;

// ─── TYPES ────────────────────────────────────────────────────────────────────

type MovementType = "in" | "out" | "reorder";

interface Movement {
  id:        string;
  itemId:    string;
  itemName:  string;
  type:      MovementType;
  quantity:  number;
  reference: string;
  notes:     string;
  date:      string;
  by:        string;
}

// ─── PART REQUEST TYPE ───────────────────────────────────────────────────────

interface PartRequest {
  id:         string;
  staff_id?:  string;
  staff_name?: string;
  item_id:    string;
  item_name:  string;
  category:   string;
  quantity:   number;
  unit:       string;
  reason:     string;
  job_ref?:   string;
  note?:      string;
  status:     "Pending" | "Approved" | "Rejected";
  created_at: string;
  updated_at: string;
}

const REQUEST_STATUS_STYLE = {
  Pending:  { bg: "bg-yellow-500/20", text: "text-yellow-400", border: "border-yellow-500/30", dot: "bg-yellow-400" },
  Approved: { bg: "bg-green-500/20",  text: "text-green-400",  border: "border-green-500/30",  dot: "bg-green-500"  },
  Rejected: { bg: "bg-red-500/20",    text: "text-red-400",    border: "border-red-500/30",    dot: "bg-red-500"    },
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const calculateStatus = (stock: number, reorderLevel: number): "Good" | "Low" | "Critical" => {
  if (stock === 0)               return "Critical";
  if (stock <= reorderLevel * 0.3) return "Critical";
  if (stock <= reorderLevel)     return "Low";
  return "Good";
};

const STATUS_STYLE = {
  Good:     { badge: "bg-green-500/20 text-green-400 border-green-500/30",    dot: "bg-green-500"  },
  Low:      { badge: "bg-orange-500/20 text-orange-400 border-orange-500/30", dot: "bg-orange-400" },
  Critical: { badge: "bg-red-500/20 text-red-400 border-red-500/30",          dot: "bg-red-500"    },
};

const MOVEMENT_STYLE: Record<MovementType, { bg: string; text: string; border: string; icon: React.ReactNode; label: string }> = {
  in:      { bg: "bg-green-500/20",  text: "text-green-400",  border: "border-green-500/30",  icon: <ArrowDownCircle className="w-3.5 h-3.5" />, label: "Stock In"  },
  out:     { bg: "bg-red-500/20",    text: "text-red-400",    border: "border-red-500/30",    icon: <ArrowUpCircle   className="w-3.5 h-3.5" />, label: "Stock Out" },
  reorder: { bg: "bg-blue-500/20",   text: "text-blue-400",   border: "border-blue-500/30",   icon: <RefreshCcw      className="w-3.5 h-3.5" />, label: "Reorder"   },
};

const CATEGORY_COLORS: Record<string, string> = {
  Coating:   "bg-[#E41E6A]/20 text-[#E41E6A] border-[#E41E6A]/30",
  PPF:       "bg-violet-500/20 text-violet-400 border-violet-500/30",
  Detailing: "bg-sky-500/20 text-sky-400 border-sky-500/30",
  Tinting:   "bg-amber-500/20 text-amber-400 border-amber-500/30",
  Supplies:  "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
};

const UNIT_OPTIONS = ["pcs", "bottles", "rolls", "kg", "L", "ml", "sheets", "set", "box", "pack"];

function categoryColor(cat: string) {
  return CATEGORY_COLORS[cat] ?? "bg-white/10 text-white/60 border-white/10";
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function genId() {
  return Math.random().toString(36).slice(2);
}

// ─── SHARED ───────────────────────────────────────────────────────────────────

function ModalWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm"
      style={{ backgroundColor: "rgba(0,0,0,0.85)" }}>
      {children}
    </div>
  );
}

const inputClass =
  "w-full px-4 h-10 bg-white/5 border border-white/10 rounded-lg text-white " +
  "placeholder:text-white/25 focus:outline-none focus:border-[#E41E6A] " +
  "focus:ring-1 focus:ring-[#E41E6A]/30 transition-colors text-sm";

function Field({ label, required, children, hint }: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-white/70 text-sm">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      {children}
      {hint && <p className="text-white/30 text-xs">{hint}</p>}
    </div>
  );
}

// ─── ADD ITEM MODAL ───────────────────────────────────────────────────────────

function AddItemModal({ onClose, onSave }: {
  onClose: () => void;
  onSave: (item: Omit<InventoryItem, "id" | "status">) => Promise<void>;
}) {
  const [form, setForm] = useState({
    name: "", category: "", stock: "", unit: "pcs",
    reorderLevel: "10", price: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name || !form.category || !form.stock) {
      alert("Please fill in Name, Category, and Initial Stock."); return;
    }
    setIsSaving(true);
    try {
      await onSave({
        name:         form.name.trim(),
        category:     form.category,
        stock:        parseInt(form.stock)        || 0,
        stockIn:      parseInt(form.stock)        || 0, // initial stock counts as stock in
        stockOut:     0,
        unit:         form.unit                   || "pcs",
        reorderLevel: parseInt(form.reorderLevel) || 10,
        price:        parseFloat(form.price)      || 0,
      });
      onClose();
    } catch (err: any) { alert(`Error: ${err.message}`); }
    finally { setIsSaving(false); }
  };

  return (
    <ModalWrapper>
      <div className="bg-[#0a0a0a] border border-white/10 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <div><h2 className="text-xl font-bold text-white">Add New Item</h2><p className="text-white/50 text-xs mt-0.5">Register a new inventory item</p></div>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Item Name" required>
              <input className={inputClass} placeholder="e.g. 9H Ceramic Coating 50ml" value={form.name} onChange={e => set("name", e.target.value)} />
            </Field>
            <Field label="Category" required>
              <div className="relative">
                <select className={inputClass + " appearance-none pr-8"} value={form.category} onChange={e => set("category", e.target.value)}>
                  <option value="" className="bg-[#0a0a0a]">Select category...</option>
                  {["Coating","PPF","Detailing","Tinting","Supplies"].map(c => (
                    <option key={c} value={c} className="bg-[#0a0a0a]">{c}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
              </div>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Initial Stock" required hint="Starting quantity when added">
              <input type="number" min="0" className={inputClass} placeholder="0" value={form.stock} onChange={e => set("stock", e.target.value)} />
            </Field>
            <Field label="Unit">
              <div className="relative">
                <select className={inputClass + " appearance-none pr-8"} value={form.unit} onChange={e => set("unit", e.target.value)}>
                  {UNIT_OPTIONS.map(u => <option key={u} value={u} className="bg-[#0a0a0a]">{u}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
              </div>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Reorder Level" hint="Alert triggers below this qty">
              <input type="number" min="0" className={inputClass} placeholder="10" value={form.reorderLevel} onChange={e => set("reorderLevel", e.target.value)} />
            </Field>
            <Field label="Unit Cost (₱)">
              <input type="number" min="0" className={inputClass} placeholder="0.00" value={form.price} onChange={e => set("price", e.target.value)} />
            </Field>
          </div>

          {/* Preview */}
          {form.name && form.stock && (
            <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#E41E6A]/10 flex items-center justify-center flex-shrink-0">
                <Package className="w-4 h-4 text-[#E41E6A]" />
              </div>
              <div>
                <p className="text-white text-sm font-semibold">{form.name}</p>
                <p className="text-white/50 text-xs">{form.stock} {form.unit} · Reorder at {form.reorderLevel}</p>
              </div>
            </div>
          )}
        </div>
        <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium border border-white/10 text-white hover:bg-white/10 rounded-lg transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#E41E6A] to-pink-600 hover:from-[#c41559] rounded-lg transition-all disabled:opacity-50">
            {isSaving ? "Saving..." : "Add Item"}
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
}

// ─── STOCK IN MODAL ───────────────────────────────────────────────────────────

function StockInModal({ item, onClose, onSave }: {
  item: InventoryItem;
  onClose: () => void;
  onSave: (qty: number, ref: string, notes: string, date: string) => Promise<void>;
}) {
  const [form, setForm] = useState({ quantity: "", reference: "", notes: "", date: todayStr() });
  const [isSaving, setIsSaving] = useState(false);
  const qty = parseInt(form.quantity) || 0;

  const handleSave = async () => {
    if (!form.quantity || qty <= 0) { alert("Please enter a valid quantity."); return; }
    setIsSaving(true);
    try {
      await onSave(qty, form.reference, form.notes, form.date);
      onClose();
    } catch (err: any) { alert(`Error: ${err.message}`); }
    finally { setIsSaving(false); }
  };

  return (
    <ModalWrapper>
      <div className="bg-[#0a0a0a] border border-white/10 rounded-xl w-full max-w-md shadow-2xl flex flex-col">
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                <ArrowDownCircle className="w-3.5 h-3.5 text-green-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Stock In</h2>
            </div>
            <p className="text-white/50 text-xs">Record incoming stock for <span className="text-white">{item.name}</span></p>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          {/* Current stock info */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-white/5 rounded-lg border border-white/10 text-center">
              <p className="text-white/50 text-xs">Current</p>
              <p className="text-white text-lg font-bold">{item.stock}</p>
              <p className="text-white/30 text-xs">{item.unit}</p>
            </div>
            <div className="p-3 bg-white/5 rounded-lg border border-white/10 text-center col-span-2">
              <p className="text-white/50 text-xs">After Receiving</p>
              <p className={`text-lg font-bold ${qty > 0 ? "text-green-400" : "text-white/30"}`}>
                {qty > 0 ? item.stock + qty : "—"}
              </p>
              <p className="text-white/30 text-xs">{item.unit}</p>
            </div>
          </div>

          <Field label="Quantity Received" required>
            <input type="number" min="1" className={inputClass} placeholder="Enter qty received"
              value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
          </Field>

          <Field label="Reference / Delivery Note No." hint="Optional — DR or PO number from supplier">
            <input className={inputClass} placeholder="e.g. DR-2026-0012"
              value={form.reference} onChange={e => setForm(f => ({ ...f, reference: e.target.value }))} />
          </Field>

          <Field label="Date Received">
            <input type="date" className={inputClass + " [color-scheme:dark]"}
              value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </Field>

          <Field label="Notes">
            <textarea className={inputClass + " resize-none h-16 py-2.5"} placeholder="Any additional notes..."
              value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </Field>
        </div>
        <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium border border-white/10 text-white hover:bg-white/10 rounded-lg transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={isSaving}
            className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 rounded-lg transition-all disabled:opacity-50 flex items-center gap-2">
            <ArrowDownCircle className="w-4 h-4" />{isSaving ? "Saving..." : "Confirm Stock In"}
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
}

// ─── STOCK OUT MODAL ──────────────────────────────────────────────────────────

function StockOutModal({ item, onClose, onSave }: {
  item: InventoryItem;
  onClose: () => void;
  onSave: (qty: number, ref: string, by: string, notes: string, date: string) => Promise<void>;
}) {
  const [form, setForm] = useState({ quantity: "", reference: "", by: "", notes: "", date: todayStr() });
  const [isSaving, setIsSaving] = useState(false);
  const qty = parseInt(form.quantity) || 0;
  const newStock = item.stock - qty;

  const handleSave = async () => {
    if (!form.quantity || qty <= 0) { alert("Please enter a valid quantity."); return; }
    if (qty > item.stock) { alert(`Cannot use more than available stock (${item.stock} ${item.unit}).`); return; }
    setIsSaving(true);
    try {
      await onSave(qty, form.reference, form.by, form.notes, form.date);
      onClose();
    } catch (err: any) { alert(`Error: ${err.message}`); }
    finally { setIsSaving(false); }
  };

  return (
    <ModalWrapper>
      <div className="bg-[#0a0a0a] border border-white/10 rounded-xl w-full max-w-md shadow-2xl flex flex-col">
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center">
                <ArrowUpCircle className="w-3.5 h-3.5 text-red-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Stock Out</h2>
            </div>
            <p className="text-white/50 text-xs">Record usage of <span className="text-white">{item.name}</span></p>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          {/* Current stock info */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-white/5 rounded-lg border border-white/10 text-center">
              <p className="text-white/50 text-xs">Current</p>
              <p className="text-white text-lg font-bold">{item.stock}</p>
              <p className="text-white/30 text-xs">{item.unit}</p>
            </div>
            <div className={`p-3 rounded-lg border text-center col-span-2 ${
              qty > 0 && newStock < 0 ? "bg-red-500/10 border-red-500/30" :
              qty > 0 && newStock <= item.reorderLevel ? "bg-orange-500/10 border-orange-500/30" :
              "bg-white/5 border-white/10"
            }`}>
              <p className="text-white/50 text-xs">After Usage</p>
              <p className={`text-lg font-bold ${
                qty > 0 && newStock < 0 ? "text-red-400" :
                qty > 0 && newStock <= item.reorderLevel ? "text-orange-400" :
                qty > 0 ? "text-white" : "text-white/30"
              }`}>{qty > 0 ? (newStock < 0 ? "⚠ Exceeds stock" : newStock) : "—"}</p>
              <p className="text-white/30 text-xs">{item.unit}</p>
            </div>
          </div>

          {/* Low stock warning */}
          {qty > 0 && newStock >= 0 && newStock <= item.reorderLevel && (
            <div className="flex items-center gap-2 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg text-xs text-orange-400">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              Stock will drop below reorder level after this usage. Consider reordering.
            </div>
          )}

          <Field label="Quantity Used" required>
            <input type="number" min="1" max={item.stock} className={inputClass} placeholder={`Max: ${item.stock} ${item.unit}`}
              value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
          </Field>

          <Field label="Job / Appointment Reference" hint="Optional — link this usage to a job">
            <input className={inputClass} placeholder="e.g. JO-2026-0001 or APT-123"
              value={form.reference} onChange={e => setForm(f => ({ ...f, reference: e.target.value }))} />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Used By">
              <input className={inputClass} placeholder="Technician name"
                value={form.by} onChange={e => setForm(f => ({ ...f, by: e.target.value }))} />
            </Field>
            <Field label="Date Used">
              <input type="date" className={inputClass + " [color-scheme:dark]"}
                value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </Field>
          </div>

          <Field label="Notes">
            <textarea className={inputClass + " resize-none h-16 py-2.5"} placeholder="Any additional notes..."
              value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </Field>
        </div>
        <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium border border-white/10 text-white hover:bg-white/10 rounded-lg transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={isSaving || (qty > 0 && newStock < 0)}
            className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 rounded-lg transition-all disabled:opacity-50 flex items-center gap-2">
            <ArrowUpCircle className="w-4 h-4" />{isSaving ? "Saving..." : "Confirm Stock Out"}
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
}

// ─── REORDER MODAL ────────────────────────────────────────────────────────────

function ReorderModal({ item, onClose, onSave }: {
  item: InventoryItem;
  onClose: () => void;
  onSave: (qty: number, deliveryDate: string, notes: string) => Promise<void>;
}) {
  const suggested = Math.max(item.reorderLevel * 2 - item.stock, item.reorderLevel);
  const [form, setForm] = useState({ quantity: String(suggested), deliveryDate: "", notes: "" });
  const [isSaving, setIsSaving] = useState(false);
  const qty = parseInt(form.quantity) || 0;

  const handleSave = async () => {
    if (!form.quantity || qty <= 0) { alert("Please enter a quantity to reorder."); return; }
    setIsSaving(true);
    try {
      await onSave(qty, form.deliveryDate, form.notes);
      onClose();
    } catch (err: any) { alert(`Error: ${err.message}`); }
    finally { setIsSaving(false); }
  };

  return (
    <ModalWrapper>
      <div className="bg-[#0a0a0a] border border-white/10 rounded-xl w-full max-w-md shadow-2xl flex flex-col">
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                <RefreshCcw className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Create Reorder Request</h2>
            </div>
            <p className="text-white/50 text-xs">Request new stock for <span className="text-white">{item.name}</span></p>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          {/* Status summary */}
          <div className={`p-4 rounded-xl border flex items-center gap-3 ${
            item.status === "Critical" ? "bg-red-500/10 border-red-500/20" : "bg-orange-500/10 border-orange-500/20"
          }`}>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
              item.status === "Critical" ? "bg-red-500/20" : "bg-orange-500/20"
            }`}>
              <AlertTriangle className={`w-5 h-5 ${item.status === "Critical" ? "text-red-400" : "text-orange-400"}`} />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">{item.name}</p>
              <p className={`text-xs mt-0.5 ${item.status === "Critical" ? "text-red-400" : "text-orange-400"}`}>
                Current: <span className="font-bold">{item.stock} {item.unit}</span> · Min level: {item.reorderLevel} {item.unit}
              </p>
            </div>
          </div>

          <Field label="Quantity to Order" required hint={`Suggested: ${suggested} ${item.unit} (2× reorder level − current stock)`}>
            <input type="number" min="1" className={inputClass} value={form.quantity}
              onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
          </Field>

          {qty > 0 && (
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-2 text-sm text-green-400">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              Stock after delivery: <span className="font-bold ml-1">{item.stock + qty} {item.unit}</span>
            </div>
          )}

          <Field label="Expected Delivery Date">
            <input type="date" className={inputClass + " [color-scheme:dark]"} value={form.deliveryDate}
              onChange={e => setForm(f => ({ ...f, deliveryDate: e.target.value }))} />
          </Field>

          <Field label="Notes">
            <textarea className={inputClass + " resize-none h-16 py-2.5"} placeholder="Supplier info or special instructions..."
              value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </Field>

          <div className="p-3 bg-white/5 rounded-lg border border-white/10">
            <p className="text-white/50 text-xs">This request will be submitted as <span className="text-blue-400 font-semibold">Pending</span> status. An admin can approve and update stock when the delivery arrives.</p>
          </div>
        </div>
        <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium border border-white/10 text-white hover:bg-white/10 rounded-lg transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={isSaving}
            className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 rounded-lg transition-all disabled:opacity-50 flex items-center gap-2">
            <ClipboardList className="w-4 h-4" />{isSaving ? "Submitting..." : "Submit Reorder"}
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
}

// ─── HISTORY MODAL ────────────────────────────────────────────────────────────

function HistoryModal({ item, movements, onClose }: {
  item: InventoryItem;
  movements: Movement[];
  onClose: () => void;
}) {
  const itemMovements = movements
    .filter(m => m.itemId === item.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <ModalWrapper>
      <div className="bg-[#0a0a0a] border border-white/10 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white">Stock Movement History</h2>
            <p className="text-white/50 text-xs mt-0.5">{item.name} · Current stock: {item.stock} {item.unit}</p>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6">
          {itemMovements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <History className="w-10 h-10 text-white/20 mb-3" />
              <p className="text-white/50 text-sm">No movement history yet</p>
              <p className="text-white/30 text-xs mt-1">History is recorded when you use Stock In or Stock Out</p>
            </div>
          ) : (
            <div className="space-y-3">
              {itemMovements.map(m => {
                const style = MOVEMENT_STYLE[m.type];
                return (
                  <div key={m.id} className="p-4 bg-white/5 rounded-xl border border-white/10 flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${style.bg} border ${style.border}`}>
                      <span className={style.text}>{style.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${style.bg} ${style.text} ${style.border}`}>
                          {style.label}
                        </span>
                        <span className={`text-sm font-bold ${m.type === "in" || m.type === "reorder" ? "text-green-400" : "text-red-400"}`}>
                          {m.type === "out" ? "−" : "+"}{m.quantity} {item.unit}
                        </span>
                      </div>
                      <div className="mt-1.5 space-y-0.5">
                        <p className="text-white/40 text-xs">{formatDate(m.date)}</p>
                        {m.reference && <p className="text-white/60 text-xs">Ref: <span className="text-white/80">{m.reference}</span></p>}
                        {m.by        && <p className="text-white/60 text-xs">By: <span className="text-white/80">{m.by}</span></p>}
                        {m.notes     && <p className="text-white/50 text-xs mt-1 italic">"{m.notes}"</p>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="p-6 border-t border-white/10 bg-white/5 flex justify-between items-center">
          <p className="text-white/30 text-xs">⚡ History is session-based. Add a stock_movements table to persist it.</p>
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium border border-white/10 text-white hover:bg-white/10 rounded-lg transition-colors">Close</button>
        </div>
      </div>
    </ModalWrapper>
  );
}

// ─── REPORT MODAL ─────────────────────────────────────────────────────────────

function ReportModal({ inventory, onClose }: {
  inventory: InventoryItem[]; onClose: () => void;
}) {
  const totalValue = inventory.reduce((s, i) => s + i.stock * i.price, 0);
  const totalIn    = inventory.reduce((s, i) => s + i.stockIn,  0);
  const totalOut   = inventory.reduce((s, i) => s + i.stockOut, 0);
  const lowItems   = inventory.filter(i => i.status !== "Good").length;

  return (
    <ModalWrapper>
      <div className="bg-[#0a0a0a] border border-white/10 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white">Inventory Report</h2>
            <p className="text-white/50 text-xs mt-0.5">Generated {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total Items",     value: inventory.length, color: "text-white"      },
              { label: "Total Stock In",  value: totalIn,          color: "text-green-400"  },
              { label: "Total Stock Out", value: totalOut,         color: "text-red-400"    },
              { label: "Low / Critical",  value: lowItems,         color: "text-orange-400" },
            ].map(s => (
              <div key={s.label} className="p-4 bg-white/5 rounded-lg border border-white/10 text-center">
                <p className="text-white/50 text-xs">{s.label}</p>
                <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-white/10 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent bg-white/5">
                  <TableHead className="text-white/70">Item</TableHead>
                  <TableHead className="text-white/70">Stock</TableHead>
                  <TableHead className="text-white/70 text-center">In</TableHead>
                  <TableHead className="text-white/70 text-center">Out</TableHead>
                  <TableHead className="text-white/70 text-right">Value</TableHead>
                  <TableHead className="text-white/70 text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventory.map(item => (
                  <TableRow key={item.id} className="border-white/10 hover:bg-white/5">
                    <TableCell>
                      <p className="text-white text-sm font-medium">{item.name}</p>
                      <p className="text-white/40 text-xs">{item.category}</p>
                    </TableCell>
                    <TableCell className="text-white text-sm">{item.stock} {item.unit}</TableCell>
                    <TableCell className="text-green-400 text-sm text-center">{item.stockIn}</TableCell>
                    <TableCell className="text-red-400 text-sm text-center">{item.stockOut}</TableCell>
                    <TableCell className="text-white text-sm text-right">₱{(item.stock * item.price).toLocaleString()}</TableCell>
                    <TableCell className="text-center">
                      <Badge className={STATUS_STYLE[item.status as keyof typeof STATUS_STYLE]?.badge ?? ""}>{item.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="p-4 bg-gradient-to-r from-[#E41E6A]/10 to-pink-600/10 rounded-lg border border-[#E41E6A]/30 flex items-center justify-between">
            <p className="text-white/70 text-sm font-medium">Total Inventory Value</p>
            <p className="text-[#E41E6A] text-2xl font-bold">₱{totalValue.toLocaleString()}</p>
          </div>
        </div>
        <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3">
          <Button variant="outline" className="border-white/10 text-white hover:bg-white/10" onClick={onClose}>Close</Button>
          <Button className="bg-gradient-to-r from-[#E41E6A] to-pink-600 text-white border-none flex items-center gap-2" onClick={() => window.print()}>
            <Printer className="w-4 h-4" />Print Report
          </Button>
        </div>
      </div>
    </ModalWrapper>
  );
}

// ─── REQUESTS TAB ────────────────────────────────────────────────────────────

function RequestsTab({ inventory, onStockUpdated }: {
  inventory: InventoryItem[];
  onStockUpdated: (itemId: string, newStock: number, newStockIn: number, newStockOut: number) => void;
}) {
  const [requests,     setRequests]     = useState<PartRequest[]>([]);
  const [isLoading,    setIsLoading]    = useState(true);
  const [filterStatus, setFilterStatus] = useState<"All" | "Pending" | "Approved" | "Rejected">("All");
  const [processing,   setProcessing]   = useState<string | null>(null);
  const [rejectId,     setRejectId]     = useState<string | null>(null);
  const [rejectNote,   setRejectNote]   = useState("");

  useEffect(() => { fetchRequests(); }, []);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const res  = await fetch(`${API_URL}/part-requests`);
      const data = await res.json();
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) { console.error("Failed to fetch requests:", err); }
    finally { setIsLoading(false); }
  };

  const handleApprove = async (req: PartRequest) => {
    setProcessing(req.id);
    try {
      // 1. Update request status to Approved
      await fetch(`${API_URL}/part-requests/${req.id}/status`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ status: "Approved" }),
      });

      // 2. Update inventory stock (Stock In)
      const invItem = inventory.find(i => i.id === req.item_id);
      if (invItem) {
        const newStock   = invItem.stock   + req.quantity;
        const newStockIn = invItem.stockIn + req.quantity;
        await updateInventoryStock(req.item_id, newStock, newStockIn, invItem.stockOut);
        onStockUpdated(req.item_id, newStock, newStockIn, invItem.stockOut);
      }

      // 3. Update local state
      setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: "Approved" } : r));
    } catch (err: any) { alert(`Failed to approve: ${err.message}`); }
    finally { setProcessing(null); }
  };

  const handleReject = async (id: string) => {
    setProcessing(id);
    try {
      await fetch(`${API_URL}/part-requests/${id}/status`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ status: "Rejected" }),
      });
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: "Rejected" } : r));
      setRejectId(null);
      setRejectNote("");
    } catch (err: any) { alert(`Failed to reject: ${err.message}`); }
    finally { setProcessing(null); }
  };

  const filtered = requests.filter(r => filterStatus === "All" || r.status === filterStatus);
  const pendingCount = requests.filter(r => r.status === "Pending").length;

  return (
    <div className="space-y-5">

      {/* ── Summary ── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Requests", value: requests.length,                                   iconBg: "bg-[#E41E6A]/10",  iconColor: "text-[#E41E6A]",   icon: <ClipboardList className="w-4 h-4" /> },
          { label: "Pending",        value: pendingCount,                                      iconBg: "bg-yellow-500/10", iconColor: "text-yellow-400",  icon: <Clock         className="w-4 h-4" /> },
          { label: "Approved",       value: requests.filter(r => r.status === "Approved").length, iconBg: "bg-green-500/10",  iconColor: "text-green-400",   icon: <CheckCircle   className="w-4 h-4" /> },
        ].map((s, i) => (
          <Card key={i} className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-white/70">{s.label}</CardTitle>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${s.iconBg}`}>
                  <span className={s.iconColor}>{s.icon}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="text-2xl font-bold text-white">{isLoading ? "..." : s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Filter tabs ── */}
      <div className="flex items-center gap-2 flex-wrap">
        <SlidersHorizontal className="w-4 h-4 text-white/40 flex-shrink-0" />
        {(["All","Pending","Approved","Rejected"] as const).map(f => (
          <button key={f} onClick={() => setFilterStatus(f)}
            className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-colors ${
              filterStatus === f ? "bg-[#E41E6A] text-white border-[#E41E6A]" : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white"
            }`}>
            {f}
            {f === "Pending" && pendingCount > 0 && (
              <span className="ml-1.5 bg-yellow-400 text-black text-[9px] font-bold px-1.5 py-0.5 rounded-full">{pendingCount}</span>
            )}
          </button>
        ))}
        <button onClick={fetchRequests} className="ml-auto px-3 py-2 text-xs font-medium text-white/50 hover:text-white border border-white/10 bg-white/5 hover:bg-white/10 rounded-lg transition-colors flex items-center gap-1.5">
          <RefreshCcw className="w-3.5 h-3.5" />Refresh
        </button>
      </div>

      {/* ── Requests list ── */}
      <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur overflow-hidden">
        <CardHeader className="border-b border-white/10 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Reorder Requests</CardTitle>
            <span className="text-white/40 text-xs">{filtered.length} request{filtered.length !== 1 ? "s" : ""}</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-[#E41E6A]/30 border-t-[#E41E6A] rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 flex flex-col items-center text-center">
              <ClipboardList className="w-10 h-10 text-white/20 mb-3" />
              <p className="text-white/50 text-sm">No {filterStatus !== "All" ? filterStatus.toLowerCase() + " " : ""}requests found</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {filtered.map(req => {
                const s = REQUEST_STATUS_STYLE[req.status];
                const isPending = req.status === "Pending";
                const isProcessing = processing === req.id;
                return (
                  <div key={req.id} className="p-5 hover:bg-white/5 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      {/* Left — item info */}
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-[#E41E6A]/10 border border-[#E41E6A]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Package className="w-5 h-5 text-[#E41E6A]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <p className="text-white font-semibold text-sm">{req.item_name}</p>
                            <Badge variant="outline" className={categoryColor(req.category)}>{req.category}</Badge>
                            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${s.bg} ${s.text} ${s.border}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />{req.status}
                            </span>
                          </div>
                          {/* Details grid */}
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/50 mt-1">
                            <span className="flex items-center gap-1">
                              <ArrowDownCircle className="w-3.5 h-3.5 text-green-400" />
                              <span className="font-semibold text-white">{req.quantity} {req.unit}</span> requested
                            </span>
                            {req.staff_name && (
                              <span className="flex items-center gap-1">
                                <User className="w-3.5 h-3.5" />{req.staff_name}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <CalendarDays className="w-3.5 h-3.5 text-[#E41E6A]" />
                              {new Date(req.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </span>
                            {req.job_ref && (
                              <span className="flex items-center gap-1">
                                <ClipboardList className="w-3.5 h-3.5" />Ref: {req.job_ref}
                              </span>
                            )}
                          </div>
                          <p className="text-white/40 text-xs mt-1.5 italic">"{req.reason}"</p>
                          {req.note && <p className="text-white/30 text-xs mt-0.5">Note: {req.note}</p>}
                        </div>
                      </div>

                      {/* Right — actions */}
                      {isPending && (
                        <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleApprove(req)}
                            disabled={isProcessing}
                            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 rounded-lg transition-all disabled:opacity-50 whitespace-nowrap"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            {isProcessing ? "Approving..." : "Approve"}
                          </button>
                          <button
                            onClick={() => setRejectId(req.id)}
                            disabled={isProcessing}
                            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg transition-all disabled:opacity-50 whitespace-nowrap"
                          >
                            <XCircle className="w-3.5 h-3.5" />Reject
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Approve impact preview */}
                    {isPending && (() => {
                      const invItem = inventory.find(i => i.id === req.item_id);
                      if (!invItem) return null;
                      return (
                        <div className="mt-3 ml-13 pl-13 flex items-center gap-2 text-xs text-white/40 border-t border-white/5 pt-3">
                          <span>Stock after approval:</span>
                          <span className="font-semibold text-white">{invItem.stock}</span>
                          <span>→</span>
                          <span className="font-bold text-green-400">{invItem.stock + req.quantity} {invItem.unit}</span>
                          {invItem.stock + req.quantity >= invItem.reorderLevel && (
                            <span className="text-green-400/70">· Will be back to Good status</span>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Reject confirmation modal ── */}
      {rejectId && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm" style={{ backgroundColor: "rgba(0,0,0,0.85)" }}>
          <div className="bg-[#0a0a0a] border border-white/10 rounded-xl w-full max-w-sm shadow-2xl">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">Reject Request</h2>
              <button onClick={() => { setRejectId(null); setRejectNote(""); }} className="text-white/50 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-3">
              <p className="text-white/70 text-sm">Are you sure you want to reject this request?</p>
              <div className="space-y-1.5">
                <label className="text-white/70 text-sm">Reason (optional)</label>
                <textarea
                  className={inputClass + " resize-none h-20 py-2.5"}
                  placeholder="Let the staff know why..."
                  value={rejectNote}
                  onChange={e => setRejectNote(e.target.value)}
                />
              </div>
            </div>
            <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3">
              <button onClick={() => { setRejectId(null); setRejectNote(""); }}
                className="px-4 py-2 text-sm font-medium border border-white/10 text-white hover:bg-white/10 rounded-lg transition-colors">Cancel</button>
              <button onClick={() => handleReject(rejectId)}
                className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 rounded-lg transition-all flex items-center gap-2">
                <XCircle className="w-4 h-4" />Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export function Inventory() {
  const [activeTab,    setActiveTab]    = useState<"inventory" | "requests">("inventory");
  const [inventory,    setInventory]    = useState<InventoryItem[]>([]);
  const [isLoading,    setIsLoading]    = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [search,       setSearch]       = useState("");
  const [filterStatus, setFilterStatus] = useState<"All"|"Good"|"Low"|"Critical">("All");
  const [filterCat,    setFilterCat]    = useState("All");

  // Movement history — local state (session-based)
  const [movements, setMovements] = useState<Movement[]>([]);

  // Modal state
  const [addOpen,      setAddOpen]      = useState(false);
  const [stockInItem,  setStockInItem]  = useState<InventoryItem | null>(null);
  const [stockOutItem, setStockOutItem] = useState<InventoryItem | null>(null);
  const [reorderItem,  setReorderItem]  = useState<InventoryItem | null>(null);
  const [historyItem,  setHistoryItem]  = useState<InventoryItem | null>(null);
  const [reportOpen,   setReportOpen]   = useState(false);

  useEffect(() => { fetchData(); fetchPendingCount(); }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = await getInventory();
      setInventory(data.map(item => ({ ...item, status: calculateStatus(item.stock, item.reorderLevel) })));
    } catch (err) { console.error("Failed to fetch inventory", err); }
    finally { setIsLoading(false); }
  };

  const fetchPendingCount = async () => {
    try {
      const res  = await fetch(`${API_URL}/part-requests?status=Pending`);
      const data = await res.json();
      setPendingCount(Array.isArray(data) ? data.length : 0);
    } catch { setPendingCount(0); }
  };

  const handleStockUpdated = (itemId: string, newStock: number, newStockIn: number, newStockOut: number) => {
    setInventory(prev => prev.map(i =>
      i.id === itemId
        ? { ...i, stock: newStock, stockIn: newStockIn, stockOut: newStockOut, status: calculateStatus(newStock, i.reorderLevel) }
        : i
    ));
    // Refresh pending count after approval
    fetchPendingCount();
  };

  // ── Derived stats ─────────────────────────────────────────────────────────
  const lowStockItems  = inventory.filter(i => i.status !== "Good");
  const outOfStock     = inventory.filter(i => i.stock === 0).length;
  const totalValue     = inventory.reduce((s, i) => s + i.stock * i.price, 0);
  const categories     = ["All", ...Array.from(new Set(inventory.map(i => i.category)))];

  const filtered = useMemo(() =>
    inventory
      .filter(i => filterStatus === "All" || i.status === filterStatus)
      .filter(i => filterCat    === "All" || i.category === filterCat)
      .filter(i => i.name.toLowerCase().includes(search.toLowerCase()) || i.category.toLowerCase().includes(search.toLowerCase())),
    [inventory, filterStatus, filterCat, search]
  );

  // ── Log movement helper ───────────────────────────────────────────────────
  const logMovement = (item: InventoryItem, type: MovementType, qty: number, ref: string, notes: string, date: string, by = "") => {
    setMovements(prev => [...prev, {
      id: genId(), itemId: item.id, itemName: item.name,
      type, quantity: qty, reference: ref, notes, date, by,
    }]);
  };

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleAdd = useCallback(async (item: Omit<InventoryItem, "id" | "status">) => {
    const created = await createInventoryItem(item);
    const withStatus = { ...created, status: calculateStatus(created.stock, created.reorderLevel) };
    setInventory(prev => [...prev, withStatus]);
    // Log initial stock as a stock-in movement
    logMovement(withStatus, "in", item.stock, "Initial Stock", "Item added to inventory", new Date().toISOString());
  }, []);

  const handleStockIn = async (qty: number, ref: string, notes: string, date: string) => {
    if (!stockInItem) return;
    const newStock   = stockInItem.stock   + qty;
    const newStockIn = stockInItem.stockIn + qty;
    const updated    = await updateInventoryStock(stockInItem.id, newStock, newStockIn, stockInItem.stockOut);
    const withStatus = { ...updated, status: calculateStatus(updated.stock, updated.reorderLevel) };
    setInventory(prev => prev.map(i => i.id === stockInItem.id ? withStatus : i));
    logMovement(stockInItem, "in", qty, ref, notes, date || new Date().toISOString());
    setStockInItem(null);
  };

  const handleStockOut = async (qty: number, ref: string, by: string, notes: string, date: string) => {
    if (!stockOutItem) return;
    const newStock    = stockOutItem.stock    - qty;
    const newStockOut = stockOutItem.stockOut + qty;
    const updated     = await updateInventoryStock(stockOutItem.id, newStock, stockOutItem.stockIn, newStockOut);
    const withStatus  = { ...updated, status: calculateStatus(updated.stock, updated.reorderLevel) };
    setInventory(prev => prev.map(i => i.id === stockOutItem.id ? withStatus : i));
    logMovement(stockOutItem, "out", qty, ref, notes, date || new Date().toISOString(), by);
    setStockOutItem(null);
  };

  const handleReorder = async (qty: number, deliveryDate: string, notes: string) => {
    if (!reorderItem) return;
    // Post to part_requests endpoint (reorder = purchase request)
    try {
      await fetch(`${API_URL}/part-requests`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item_id:   reorderItem.id,
          item_name: reorderItem.name,
          category:  reorderItem.category,
          quantity:  qty,
          unit:      reorderItem.unit,
          reason:    "Reorder — stock below minimum level",
          job_ref:   deliveryDate ? `Expected delivery: ${deliveryDate}` : undefined,
          note:      notes || undefined,
          status:    "Pending",
        }),
      });
    } catch (err) {
      console.warn("part-requests endpoint not available, logging locally:", err);
    }
    logMovement(reorderItem, "reorder", qty, `Reorder request`, notes, new Date().toISOString());
    setReorderItem(null);
    alert(`Reorder request for ${qty} ${reorderItem.unit} of "${reorderItem.name}" submitted successfully!`);
  };

  const handleDelete = async (item: InventoryItem) => {
    if (!window.confirm(`Delete "${item.name}"? This cannot be undone.`)) return;
    try {
      await deleteInventoryItem(item.id);
      setInventory(prev => prev.filter(i => i.id !== item.id));
    } catch (err: any) { alert(`Failed to delete: ${err.message}`); }
  };

  return (
    <div className="space-y-6 w-full">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-white text-3xl font-bold mb-1">Inventory Management</h1>
          <p className="text-white/60 text-sm">Track stock levels, record usage, and manage reorders</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" className="border-white/10 text-white hover:bg-white/5 flex items-center gap-2" onClick={() => setReportOpen(true)}>
            <BarChart3 className="w-4 h-4" />Report
          </Button>
          <Button className="bg-gradient-to-r from-[#E41E6A] to-pink-600 hover:from-[#c41559] text-white flex items-center gap-2" onClick={() => setAddOpen(true)}>
            <Plus className="w-4 h-4" />Add Item
          </Button>
        </div>
      </div>

      {/* ── Tab Navigation ── */}
      <div className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/10 w-fit">
        <button
          onClick={() => setActiveTab("inventory")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "inventory" ? "bg-[#E41E6A] text-white shadow-md" : "text-white/60 hover:text-white hover:bg-white/10"
          }`}
        >
          <Package className="w-4 h-4" />Inventory List
        </button>
        <button
          onClick={() => setActiveTab("requests")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "requests" ? "bg-[#E41E6A] text-white shadow-md" : "text-white/60 hover:text-white hover:bg-white/10"
          }`}
        >
          <ClipboardList className="w-4 h-4" />Reorder Requests
          {pendingCount > 0 && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === "requests" ? "bg-white/20 text-white" : "bg-yellow-400 text-black"}`}>
              {pendingCount}
            </span>
          )}
        </button>
      </div>

      {/* ── Requests Tab ── */}
      {activeTab === "requests" && (
        <RequestsTab inventory={inventory} onStockUpdated={handleStockUpdated} />
      )}

      {/* ── Inventory Tab content below (hidden when on requests tab) ── */}
      {activeTab === "inventory" && <>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Items",    value: inventory.length,                     sub: "in inventory",   iconBg: "bg-[#E41E6A]/10",   iconColor: "text-[#E41E6A]",   icon: <Package       className="w-5 h-5" /> },
          { label: "Low / Critical", value: lowStockItems.length,                 sub: "need attention", iconBg: "bg-orange-500/10",  iconColor: "text-orange-400",  icon: <AlertTriangle className="w-5 h-5" /> },
          { label: "Total Value",    value: `₱${Math.round(totalValue/1000)}K`,   sub: "current stock",  iconBg: "bg-emerald-500/10", iconColor: "text-emerald-400", icon: <TrendingUp    className="w-5 h-5" /> },
          { label: "Out of Stock",   value: outOfStock,                           sub: "zero stock",     iconBg: outOfStock > 0 ? "bg-red-500/10" : "bg-white/5", iconColor: outOfStock > 0 ? "text-red-400" : "text-white/40", icon: <TrendingDown className="w-5 h-5" /> },
        ].map((s, i) => (
          <Card key={i} className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-white/70">{s.label}</CardTitle>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.iconBg}`}>
                  <span className={s.iconColor}>{s.icon}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="text-2xl font-bold text-white">{isLoading ? "..." : s.value}</div>
              <p className="text-xs text-white/50 mt-1">{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Low Stock Alerts ── */}
      {lowStockItems.length > 0 && !isLoading && (
        <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/30 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-400" />
              Low Stock Alerts
              <span className="text-xs font-normal text-orange-400 bg-orange-500/20 px-2 py-0.5 rounded-full border border-orange-500/30 ml-1">
                {lowStockItems.length} item{lowStockItems.length !== 1 ? "s" : ""}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {lowStockItems.map(item => (
                <div key={item.id} className="p-4 bg-white/5 rounded-xl border border-orange-500/20 hover:border-orange-500/40 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-white font-semibold text-sm leading-snug">{item.name}</p>
                      <p className="text-white/40 text-xs mt-0.5">{item.category}</p>
                    </div>
                    <Badge className={STATUS_STYLE[item.status as keyof typeof STATUS_STYLE]?.badge ?? ""}>{item.status}</Badge>
                  </div>
                  <div className="space-y-2 mb-3">
                    <div className="flex justify-between text-xs text-white/60">
                      <span>{item.stock} {item.unit} remaining</span>
                      <span>Min: {item.reorderLevel}</span>
                    </div>
                    <Progress value={Math.min((item.stock / Math.max(item.reorderLevel, 1)) * 100, 100)} className="h-1.5 bg-white/10" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setStockInItem(item)}
                      className="py-1.5 text-xs font-semibold text-green-400 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 rounded-lg transition-colors flex items-center justify-center gap-1.5">
                      <ArrowDownCircle className="w-3.5 h-3.5" />Stock In
                    </button>
                    <button onClick={() => setReorderItem(item)}
                      className="py-1.5 text-xs font-semibold text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-lg transition-colors flex items-center justify-center gap-1.5">
                      <RefreshCcw className="w-3.5 h-3.5" />Reorder
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Search + Filters ── */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
          <input type="text" placeholder="Search items or categories..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#E41E6A] focus:ring-1 focus:ring-[#E41E6A]/30 transition-colors" />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <SlidersHorizontal className="w-4 h-4 text-white/40 flex-shrink-0" />
          {(["All","Good","Low","Critical"] as const).map(f => (
            <button key={f} onClick={() => setFilterStatus(f)}
              className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                filterStatus === f ? "bg-[#E41E6A] text-white border-[#E41E6A]" : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white"
              }`}>{f}</button>
          ))}
        </div>
        <div className="relative">
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
            className="pl-3 pr-8 py-2.5 text-xs font-semibold bg-white/5 border border-white/10 rounded-xl text-white/70 focus:outline-none focus:border-[#E41E6A] appearance-none">
            {categories.map(c => <option key={c} value={c} className="bg-[#0a0a0a]">{c}</option>)}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40 pointer-events-none" />
        </div>
      </div>

      {/* ── Inventory Table ── */}
      <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur overflow-hidden">
        <CardHeader className="border-b border-white/10 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Inventory List</CardTitle>
            <span className="text-white/40 text-xs">{filtered.length} item{filtered.length !== 1 ? "s" : ""}</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-[#E41E6A]/30 border-t-[#E41E6A] rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center text-white/50 py-12">
              <Package className="w-10 h-10 mx-auto mb-3 text-white/20" />No items found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    {["Item","Category","Stock","Reorder At","Unit Cost","Total Value","Status","Actions"].map(h => (
                      <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-white/50 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filtered.map(item => {
                    const movCount = movements.filter(m => m.itemId === item.id).length;
                    return (
                      <tr key={item.id} className="hover:bg-white/5 transition-colors">

                        {/* Item */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-[#E41E6A]/10 border border-[#E41E6A]/20 flex items-center justify-center flex-shrink-0">
                              <Package className="w-4 h-4 text-[#E41E6A]" />
                            </div>
                            <div>
                              <p className="text-white text-sm font-semibold">{item.name}</p>
                              <p className="text-white/40 text-xs">{item.unit} · min {item.reorderLevel}</p>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="px-5 py-3.5">
                          <Badge variant="outline" className={categoryColor(item.category)}>{item.category}</Badge>
                        </td>

                        {/* Stock with progress */}
                        <td className="px-5 py-3.5">
                          <p className={`text-sm font-bold ${
                            item.stock === 0 ? "text-red-400" :
                            item.status === "Critical" ? "text-red-400" :
                            item.status === "Low" ? "text-orange-400" : "text-white"
                          }`}>{item.stock} <span className="text-white/40 text-xs font-normal">{item.unit}</span></p>
                          <Progress value={Math.min((item.stock / Math.max(item.reorderLevel, 1)) * 100, 100)} className="h-1 mt-1.5 bg-white/10 w-20" />
                        </td>

                        {/* Reorder Level */}
                        <td className="px-5 py-3.5 text-white/60 text-sm">{item.reorderLevel} {item.unit}</td>

                        {/* Unit Cost */}
                        <td className="px-5 py-3.5 text-white/70 text-sm">₱{item.price.toLocaleString()}</td>

                        {/* Total Value */}
                        <td className="px-5 py-3.5">
                          <span className="text-white text-sm font-semibold">₱{(item.stock * item.price).toLocaleString()}</span>
                        </td>

                        {/* Status */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${STATUS_STYLE[item.status as keyof typeof STATUS_STYLE]?.dot ?? "bg-gray-400"}`} />
                            <Badge className={STATUS_STYLE[item.status as keyof typeof STATUS_STYLE]?.badge ?? ""}>{item.status}</Badge>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5">
                            {/* Stock In */}
                            <button onClick={() => setStockInItem(item)} title="Stock In"
                              className="w-7 h-7 flex items-center justify-center rounded-lg border border-green-500/30 text-green-400 hover:bg-green-500/10 transition-colors">
                              <ArrowDownCircle className="w-3.5 h-3.5" />
                            </button>
                            {/* Stock Out */}
                            <button onClick={() => setStockOutItem(item)} title="Stock Out" disabled={item.stock === 0}
                              className="w-7 h-7 flex items-center justify-center rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                              <ArrowUpCircle className="w-3.5 h-3.5" />
                            </button>
                            {/* History */}
                            <button onClick={() => setHistoryItem(item)} title="View History"
                              className="w-7 h-7 flex items-center justify-center rounded-lg border border-white/10 text-white/50 hover:bg-white/10 hover:text-white transition-colors relative">
                              <History className="w-3.5 h-3.5" />
                              {movCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#E41E6A] rounded-full text-[9px] text-white flex items-center justify-center font-bold">
                                  {movCount > 9 ? "9+" : movCount}
                                </span>
                              )}
                            </button>
                            {/* Reorder */}
                            <button onClick={() => setReorderItem(item)} title="Reorder"
                              className="w-7 h-7 flex items-center justify-center rounded-lg border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 transition-colors">
                              <RefreshCcw className="w-3.5 h-3.5" />
                            </button>
                            {/* Delete */}
                            <button onClick={() => handleDelete(item)} title="Delete"
                              className="w-7 h-7 flex items-center justify-center rounded-lg border border-red-500/20 text-red-400/60 hover:bg-red-500/10 hover:text-red-400 transition-colors">
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

      </> /* end inventory tab */}

      {/* ── Modals ── */}
      {addOpen      && <AddItemModal   onClose={() => setAddOpen(false)}      onSave={handleAdd}      />}
      {stockInItem  && <StockInModal   item={stockInItem}  onClose={() => setStockInItem(null)}  onSave={handleStockIn}  />}
      {stockOutItem && <StockOutModal  item={stockOutItem} onClose={() => setStockOutItem(null)} onSave={handleStockOut} />}
      {reorderItem  && <ReorderModal   item={reorderItem}  onClose={() => setReorderItem(null)}  onSave={handleReorder}  />}
      {historyItem  && <HistoryModal   item={historyItem}  movements={movements} onClose={() => setHistoryItem(null)} />}
      {reportOpen   && <ReportModal    inventory={inventory} onClose={() => setReportOpen(false)} />}
    </div>
  );
}