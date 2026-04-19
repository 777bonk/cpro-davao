import { useState, useEffect, useMemo } from "react";
import {
  Package, Plus, AlertTriangle, BarChart3, X, Edit,
  Search, SlidersHorizontal, TrendingUp, TrendingDown,
  RefreshCcw, ChevronDown, Printer,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../dashboard-ui/card";
import { Button } from "../dashboard-ui/button";
import { Badge } from "../dashboard-ui/badge";
import { Progress } from "../dashboard-ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../dashboard-ui/table";
import { Label } from "../dashboard-ui/label";
import { getInventory, createInventoryItem, updateInventoryStock, InventoryItem } from "../../services/inventory";

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const calculateStatus = (stock: number, reorderLevel: number): "Good" | "Low" | "Critical" => {
  if (stock <= reorderLevel * 0.3) return "Critical";
  if (stock <= reorderLevel)       return "Low";
  return "Good";
};

const STATUS_STYLE = {
  Good:     { badge: "bg-green-500/20 text-green-400 border-green-500/30",   dot: "bg-green-500"  },
  Low:      { badge: "bg-orange-500/20 text-orange-400 border-orange-500/30", dot: "bg-orange-400" },
  Critical: { badge: "bg-red-500/20 text-red-400 border-red-500/30",          dot: "bg-red-500"    },
};

const CATEGORY_COLORS: Record<string, string> = {
  Coating:   "bg-[#E41E6A]/20 text-[#E41E6A] border-[#E41E6A]/30",
  PPF:       "bg-violet-500/20 text-violet-400 border-violet-500/30",
  Detailing: "bg-sky-500/20 text-sky-400 border-sky-500/30",
  Tinting:   "bg-amber-500/20 text-amber-400 border-amber-500/30",
  Supplies:  "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
};

const categoryColor = (cat: string) =>
  CATEGORY_COLORS[cat] ?? "bg-white/10 text-white/60 border-white/10";

// ─── MODAL WRAPPER ────────────────────────────────────────────────────────────

function ModalWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm"
      style={{ backgroundColor: "rgba(0,0,0,0.8)" }}>
      {children}
    </div>
  );
}

const inputClass =
  "w-full px-4 h-10 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/25 focus:outline-none focus:border-[#E41E6A] focus:ring-1 focus:ring-[#E41E6A]/30 transition-colors text-sm";

// ─── ADD ITEM MODAL ───────────────────────────────────────────────────────────

function AddItemModal({ onClose, onSave }: {
  onClose: () => void;
  onSave: (item: { name: string; category: string; stock: number; stockIn: number; stockOut: number; unit: string; reorderLevel: number; price: number }) => Promise<void>;
}) {
  const [form, setForm] = useState({
    name: "", category: "", stock: "", stockIn: "", stockOut: "",
    unit: "", reorderLevel: "", price: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!form.name || !form.category || !form.stock) {
      alert("Please fill in Name, Category, and Stock."); return;
    }
    setIsSaving(true);
    try {
      await onSave({
        name:         form.name,
        category:     form.category,
        stock:        parseInt(form.stock)        || 0,
        stockIn:      parseInt(form.stockIn)      || 0,
        stockOut:     parseInt(form.stockOut)     || 0,
        unit:         form.unit                   || "pcs",
        reorderLevel: parseInt(form.reorderLevel) || 10,
        price:        parseFloat(form.price)      || 0,
      });
      onClose();
    } catch (error: any) {
      alert(`Database Error: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const Field = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
    <div className="space-y-1.5">
      <Label className="text-white/70 text-sm">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</Label>
      {children}
    </div>
  );

  return (
    <ModalWrapper>
      <div className="bg-[#0a0a0a] border border-white/10 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white">Add New Item</h2>
            <p className="text-white/50 text-xs mt-0.5">Fill in the inventory item details</p>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Item Name" required>
              <input className={inputClass} placeholder="e.g. 9H Ceramic Coating" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="Category" required>
              <div className="relative">
                <select className={inputClass + " appearance-none pr-8"} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
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
            <Field label="Current Stock" required>
              <input type="number" className={inputClass} placeholder="0" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} />
            </Field>
            <Field label="Unit">
              <input className={inputClass} placeholder="pcs, bottles, rolls..." value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Stock In">
              <input type="number" className={inputClass} placeholder="0" value={form.stockIn} onChange={e => setForm({ ...form, stockIn: e.target.value })} />
            </Field>
            <Field label="Stock Out">
              <input type="number" className={inputClass} placeholder="0" value={form.stockOut} onChange={e => setForm({ ...form, stockOut: e.target.value })} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Reorder Level">
              <input type="number" className={inputClass} placeholder="10" value={form.reorderLevel} onChange={e => setForm({ ...form, reorderLevel: e.target.value })} />
            </Field>
            <Field label="Unit Price (₱)">
              <input type="number" className={inputClass} placeholder="0" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
            </Field>
          </div>
        </div>

        <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3">
          <Button variant="outline" className="border-white/10 text-white hover:bg-white/10" onClick={onClose}>Cancel</Button>
          <Button className="bg-gradient-to-r from-[#E41E6A] to-pink-600 text-white border-none hover:opacity-90" onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Add Item"}
          </Button>
        </div>
      </div>
    </ModalWrapper>
  );
}

// ─── EDIT STOCK MODAL ─────────────────────────────────────────────────────────

function EditStockModal({ item, onClose, onSave }: {
  item: InventoryItem;
  onClose: () => void;
  onSave: (adjustment: number, type: "add" | "deduct") => Promise<void>;
}) {
  const [adjustmentType, setAdjustmentType] = useState<"add" | "deduct">("add");
  const [quantity, setQuantity]             = useState("");
  const [isSaving, setIsSaving]             = useState(false);

  const preview = quantity
    ? adjustmentType === "add"
      ? item.stock + parseInt(quantity)
      : item.stock - parseInt(quantity)
    : null;

  const handleSave = async () => {
    if (!quantity) { alert("Please enter adjustment amount."); return; }
    const adj = parseInt(quantity);
    if (adjustmentType === "deduct" && adj > item.stock) {
      alert("Cannot deduct more than available stock."); return;
    }
    setIsSaving(true);
    try {
      await onSave(adj, adjustmentType);
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
            <h2 className="text-xl font-bold text-white">Edit Stock</h2>
            <p className="text-white/50 text-xs mt-0.5">Adjust stock for {item.name}</p>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-4">
          {/* Current stock info */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-white/5 rounded-lg border border-white/10 text-center">
              <p className="text-white/50 text-xs">Current</p>
              <p className="text-white text-lg font-bold mt-0.5">{item.stock}</p>
              <p className="text-white/30 text-xs">{item.unit}</p>
            </div>
            <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20 text-center">
              <p className="text-white/50 text-xs">Stock In</p>
              <p className="text-green-400 text-lg font-bold mt-0.5">{item.stockIn}</p>
            </div>
            <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20 text-center">
              <p className="text-white/50 text-xs">Stock Out</p>
              <p className="text-red-400 text-lg font-bold mt-0.5">{item.stockOut}</p>
            </div>
          </div>

          {/* Toggle */}
          <div className="flex rounded-lg border border-white/10 overflow-hidden">
            {(["add", "deduct"] as const).map(type => (
              <button
                key={type}
                onClick={() => setAdjustmentType(type)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold transition-colors ${
                  adjustmentType === type
                    ? type === "add"
                      ? "bg-green-500/20 text-green-400"
                      : "bg-red-500/20 text-red-400"
                    : "text-white/50 hover:text-white hover:bg-white/5"
                }`}
              >
                {type === "add" ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {type === "add" ? "Add Stock" : "Deduct Stock"}
              </button>
            ))}
          </div>

          <div className="space-y-1.5">
            <Label className="text-white/70 text-sm">Quantity <span className="text-red-500">*</span></Label>
            <input
              type="number"
              className={inputClass}
              placeholder="Enter quantity"
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
            />
          </div>

          {/* Preview */}
          {preview !== null && (
            <div className={`p-3 rounded-lg border flex items-center gap-2 text-sm font-medium ${
              preview < 0
                ? "bg-red-500/10 border-red-500/30 text-red-400"
                : "bg-blue-500/10 border-blue-500/30 text-blue-400"
            }`}>
              {preview < 0
                ? "⚠ Cannot go below 0"
                : `New stock will be: ${preview} ${item.unit}`}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3">
          <Button variant="outline" className="border-white/10 text-white hover:bg-white/10" onClick={onClose}>Cancel</Button>
          <Button className="bg-gradient-to-r from-[#E41E6A] to-pink-600 text-white border-none" onClick={handleSave} disabled={isSaving || (preview !== null && preview < 0)}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </ModalWrapper>
  );
}

// ─── REORDER MODAL ────────────────────────────────────────────────────────────

function ReorderModal({ item, onClose, onSave }: {
  item: InventoryItem;
  onClose: () => void;
  onSave: (quantity: number, deliveryDate: string) => Promise<void>;
}) {
  const [quantity,     setQuantity]     = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [isSaving,     setIsSaving]     = useState(false);

  const handleSave = async () => {
    if (!quantity) { alert("Please enter quantity to reorder."); return; }
    setIsSaving(true);
    try {
      await onSave(parseInt(quantity), deliveryDate);
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
            <h2 className="text-xl font-bold text-white">Reorder Item</h2>
            <p className="text-white/50 text-xs mt-0.5">Request new stock for {item.name}</p>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-4">
          {/* Item info */}
          <div className="p-4 bg-orange-500/10 rounded-lg border border-orange-500/20 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <p className="text-white font-semibold">{item.name}</p>
              <p className="text-orange-400 text-xs mt-0.5">
                Current stock: <span className="font-bold">{item.stock} {item.unit}</span> · Reorder level: {item.reorderLevel}
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-white/70 text-sm">Quantity to Reorder <span className="text-red-500">*</span></Label>
            <input
              type="number"
              className={inputClass}
              placeholder="Enter quantity"
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-white/70 text-sm">Expected Delivery Date</Label>
            <input
              type="date"
              className={inputClass + " [color-scheme:dark]"}
              value={deliveryDate}
              onChange={e => setDeliveryDate(e.target.value)}
            />
          </div>

          {quantity && (
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-sm text-green-400 font-medium">
              Stock after delivery: {item.stock + parseInt(quantity)} {item.unit}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3">
          <Button variant="outline" className="border-white/10 text-white hover:bg-white/10" onClick={onClose}>Cancel</Button>
          <Button className="bg-gradient-to-r from-[#E41E6A] to-pink-600 text-white border-none" onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Processing..." : "Confirm Reorder"}
          </Button>
        </div>
      </div>
    </ModalWrapper>
  );
}

// ─── REPORT MODAL ─────────────────────────────────────────────────────────────

function ReportModal({ inventory, onClose }: { inventory: InventoryItem[]; onClose: () => void }) {
  const totalValue  = inventory.reduce((s, i) => s + i.stock * i.price, 0);
  const totalIn     = inventory.reduce((s, i) => s + i.stockIn,  0);
  const totalOut    = inventory.reduce((s, i) => s + i.stockOut, 0);
  const lowItems    = inventory.filter(i => i.status !== "Good").length;

  return (
    <ModalWrapper>
      <div className="bg-[#0a0a0a] border border-white/10 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white">Inventory Report</h2>
            <p className="text-white/50 text-xs mt-0.5">
              Generated {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </p>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-4">
          {/* Summary stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total Items",   value: inventory.length, color: "text-white"       },
              { label: "Total Stock In", value: totalIn,          color: "text-green-400"   },
              { label: "Total Stock Out",value: totalOut,         color: "text-red-400"     },
              { label: "Low / Critical", value: lowItems,         color: "text-orange-400"  },
            ].map(s => (
              <div key={s.label} className="p-4 bg-white/5 rounded-lg border border-white/10 text-center">
                <p className="text-white/50 text-xs">{s.label}</p>
                <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Detail table */}
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
                      <Badge className={STATUS_STYLE[item.status as keyof typeof STATUS_STYLE]?.badge ?? ""}>
                        {item.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Total value */}
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

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export function Inventory() {
  const [inventory,    setInventory]    = useState<InventoryItem[]>([]);
  const [isLoading,    setIsLoading]    = useState(true);
  const [search,       setSearch]       = useState("");
  const [filterStatus, setFilterStatus] = useState<"All" | "Good" | "Low" | "Critical">("All");
  const [filterCat,    setFilterCat]    = useState("All");

  // Modal states
  const [addOpen,      setAddOpen]      = useState(false);
  const [editItem,     setEditItem]     = useState<InventoryItem | null>(null);
  const [reorderItem,  setReorderItem]  = useState<InventoryItem | null>(null);
  const [reportOpen,   setReportOpen]   = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = await getInventory();
      setInventory(data.map(item => ({ ...item, status: calculateStatus(item.stock, item.reorderLevel) })));
    } catch (error) {
      console.error("Failed to fetch inventory", error);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Derived stats ────────────────────────────────────────────────────────────
  const lowStockItems = inventory.filter(i => i.status !== "Good");
  const totalValue    = inventory.reduce((s, i) => s + i.stock * i.price, 0);
  const totalStockOut = inventory.reduce((s, i) => s + i.stockOut, 0);
  const categories    = ["All", ...Array.from(new Set(inventory.map(i => i.category)))];

  // ── Filtered list ─────────────────────────────────────────────────────────────
  const filtered = useMemo(() =>
    inventory
      .filter(i => filterStatus === "All" || i.status === filterStatus)
      .filter(i => filterCat    === "All" || i.category === filterCat)
      .filter(i =>
        i.name.toLowerCase().includes(search.toLowerCase()) ||
        i.category.toLowerCase().includes(search.toLowerCase())
      ),
    [inventory, filterStatus, filterCat, search]
  );

  // ── Handlers ──────────────────────────────────────────────────────────────────
  const handleAdd = async (item: Parameters<typeof createInventoryItem>[0]) => {
    await createInventoryItem(item);
    fetchData();
  };

  const handleEdit = async (adjustment: number, type: "add" | "deduct") => {
    if (!editItem) return;
    const newStock   = type === "add" ? editItem.stock + adjustment : editItem.stock - adjustment;
    const newStockIn = type === "add" ? editItem.stockIn + adjustment : editItem.stockIn;
    const newStockOut= type === "deduct" ? editItem.stockOut + adjustment : editItem.stockOut;
    await updateInventoryStock(editItem.id, newStock, newStockIn, newStockOut);
    setInventory(prev => prev.map(i =>
      i.id === editItem.id
        ? { ...i, stock: newStock, stockIn: newStockIn, stockOut: newStockOut, status: calculateStatus(newStock, i.reorderLevel) }
        : i
    ));
    setEditItem(null);
  };

  const handleReorder = async (quantity: number) => {
    if (!reorderItem) return;
    const newStock   = reorderItem.stock   + quantity;
    const newStockIn = reorderItem.stockIn + quantity;
    await updateInventoryStock(reorderItem.id, newStock, newStockIn, reorderItem.stockOut);
    setInventory(prev => prev.map(i =>
      i.id === reorderItem.id
        ? { ...i, stock: newStock, stockIn: newStockIn, status: calculateStatus(newStock, i.reorderLevel) }
        : i
    ));
    setReorderItem(null);
  };

  return (
    <div className="space-y-6 w-full">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-white text-3xl font-bold mb-1">Inventory Management</h1>
          <p className="text-white/60 text-sm">Track and manage your supplies and materials</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            className="border-white/10 text-white hover:bg-white/5 flex items-center gap-2"
            onClick={() => setReportOpen(true)}
          >
            <BarChart3 className="w-4 h-4" />Generate Report
          </Button>
          <Button
            className="bg-gradient-to-r from-[#E41E6A] to-pink-600 hover:from-[#c41559] text-white flex items-center gap-2"
            onClick={() => setAddOpen(true)}
          >
            <Plus className="w-4 h-4" />Add Item
          </Button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: "Total Items",         value: inventory.length,         sub: "In inventory",      color: "text-white",      icon: <Package    className="w-5 h-5" />, iconBg: "bg-[#E41E6A]/10", iconColor: "text-[#E41E6A]" },
          { label: "Low Stock Items",     value: lowStockItems.length,     sub: "Needs reorder",      color: "text-orange-400", icon: <AlertTriangle className="w-5 h-5"/>,iconBg:"bg-orange-500/10",iconColor:"text-orange-400"},
          { label: "Inventory Value",     value: `₱${Math.round(totalValue / 1000)}K`, sub: "Current value", color: "text-white", icon: <TrendingUp className="w-5 h-5"/>,iconBg:"bg-emerald-500/10",iconColor:"text-emerald-400"},
          { label: "Total Stock Out",     value: totalStockOut,            sub: "Items used",         color: "text-white",      icon: <TrendingDown className="w-5 h-5"/>,iconBg:"bg-sky-500/10",   iconColor:"text-sky-400"    },
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
              <div className={`text-2xl font-bold ${s.color}`}>{isLoading ? "..." : s.value}</div>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {lowStockItems.map(item => (
                <div key={item.id} className="p-4 bg-white/5 rounded-xl border border-orange-500/20 hover:border-orange-500/40 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-white font-semibold text-sm leading-snug">{item.name}</p>
                      <p className="text-white/40 text-xs mt-0.5">{item.category}</p>
                    </div>
                    <Badge className={STATUS_STYLE[item.status as keyof typeof STATUS_STYLE]?.badge ?? ""}>
                      {item.status}
                    </Badge>
                  </div>
                  <div className="space-y-2 mb-3">
                    <div className="flex justify-between text-xs text-white/60">
                      <span>{item.stock} {item.unit} remaining</span>
                      <span>Min: {item.reorderLevel}</span>
                    </div>
                    <Progress value={Math.min((item.stock / item.reorderLevel) * 100, 100)} className="h-1.5 bg-white/10" />
                  </div>
                  <button
                    onClick={() => setReorderItem(item)}
                    className="w-full py-1.5 text-xs font-semibold text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                  >
                    <RefreshCcw className="w-3.5 h-3.5" />Reorder Now
                  </button>
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
          <input
            type="text"
            placeholder="Search items or categories..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#E41E6A] focus:ring-1 focus:ring-[#E41E6A]/30 transition-colors"
          />
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <SlidersHorizontal className="w-4 h-4 text-white/40 flex-shrink-0" />
          {(["All", "Good", "Low", "Critical"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilterStatus(f)}
              className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                filterStatus === f
                  ? "bg-[#E41E6A] text-white border-[#E41E6A] shadow-sm"
                  : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Category filter */}
        <div className="relative">
          <select
            value={filterCat}
            onChange={e => setFilterCat(e.target.value)}
            className="pl-3 pr-8 py-2.5 text-xs font-semibold bg-white/5 border border-white/10 rounded-xl text-white/70 focus:outline-none focus:border-[#E41E6A] appearance-none"
          >
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
            <div className="text-center text-white/50 py-12">Loading inventory...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center text-white/50 py-12">
              <Package className="w-10 h-10 mx-auto mb-3 text-white/20" />
              No items found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="w-full">
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-white/60 text-xs uppercase tracking-wide px-5 py-3.5">Item</TableHead>
                    <TableHead className="text-white/60 text-xs uppercase tracking-wide">Category</TableHead>
                    <TableHead className="text-white/60 text-xs uppercase tracking-wide">Stock</TableHead>
                    <TableHead className="text-white/60 text-xs uppercase tracking-wide text-center">In</TableHead>
                    <TableHead className="text-white/60 text-xs uppercase tracking-wide text-center">Out</TableHead>
                    <TableHead className="text-white/60 text-xs uppercase tracking-wide">Unit Price</TableHead>
                    <TableHead className="text-white/60 text-xs uppercase tracking-wide">Status</TableHead>
                    <TableHead className="text-white/60 text-xs uppercase tracking-wide">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(item => (
                    <TableRow key={item.id} className="border-white/10 hover:bg-white/5 transition-colors">
                      {/* Item */}
                      <TableCell className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#E41E6A]/30 to-pink-600/30 border border-[#E41E6A]/20 flex items-center justify-center flex-shrink-0">
                            <Package className="w-4 h-4 text-[#E41E6A]" />
                          </div>
                          <div>
                            <p className="text-white text-sm font-semibold">{item.name}</p>
                            <p className="text-white/40 text-xs">Reorder at {item.reorderLevel}</p>
                          </div>
                        </div>
                      </TableCell>
                      {/* Category */}
                      <TableCell>
                        <Badge variant="outline" className={categoryColor(item.category)}>
                          {item.category}
                        </Badge>
                      </TableCell>
                      {/* Stock */}
                      <TableCell>
                        <div>
                          <p className="text-white text-sm font-semibold">{item.stock} <span className="text-white/40 text-xs font-normal">{item.unit}</span></p>
                          <Progress
                            value={Math.min((item.stock / Math.max(item.reorderLevel, 1)) * 100, 100)}
                            className="h-1 mt-1 bg-white/10 w-20"
                          />
                        </div>
                      </TableCell>
                      {/* Stock In */}
                      <TableCell className="text-center">
                        <span className="text-green-400 text-sm font-semibold">{item.stockIn}</span>
                      </TableCell>
                      {/* Stock Out */}
                      <TableCell className="text-center">
                        <span className="text-red-400 text-sm font-semibold">{item.stockOut}</span>
                      </TableCell>
                      {/* Price */}
                      <TableCell>
                        <span className="text-white text-sm">₱{item.price.toLocaleString()}</span>
                      </TableCell>
                      {/* Status */}
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${STATUS_STYLE[item.status as keyof typeof STATUS_STYLE]?.dot ?? "bg-gray-400"}`} />
                          <Badge className={STATUS_STYLE[item.status as keyof typeof STATUS_STYLE]?.badge ?? ""}>
                            {item.status}
                          </Badge>
                        </div>
                      </TableCell>
                      {/* Actions */}
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-[#E41E6A]/30 text-[#E41E6A] hover:bg-[#E41E6A]/10 flex items-center gap-1"
                            onClick={() => setEditItem(item)}
                          >
                            <Edit className="w-3 h-3" />Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10 flex items-center gap-1"
                            onClick={() => setReorderItem(item)}
                          >
                            <RefreshCcw className="w-3 h-3" />Reorder
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Modals ── */}
      {addOpen     && <AddItemModal  onClose={() => setAddOpen(false)} onSave={handleAdd} />}
      {editItem    && <EditStockModal item={editItem} onClose={() => setEditItem(null)} onSave={handleEdit} />}
      {reorderItem && <ReorderModal  item={reorderItem} onClose={() => setReorderItem(null)} onSave={handleReorder} />}
      {reportOpen  && <ReportModal   inventory={inventory} onClose={() => setReportOpen(false)} />}
    </div>
  );
}