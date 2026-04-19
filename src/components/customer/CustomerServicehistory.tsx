import { useState, useMemo } from "react";
import {
  Search, Car, Calendar, User, Banknote,
  Shield, Layers, Sparkles, Wrench, ChevronDown,
  SlidersHorizontal, FileText, X, CheckCircle,
} from "lucide-react";

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface ServiceRecord {
  id: number;
  service: string;
  category: string;
  vehicle: string;
  plate: string;
  date: string;
  amount: number;
  technician: string;
  status: "Completed" | "Cancelled";
  notes: string;
  duration: string;
}

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

const MOCK_HISTORY: ServiceRecord[] = [
  { id: 1,  service: "Ceramic Coating - Full Body",   category: "Coating",   vehicle: "2023 Toyota Fortuner",  plate: "ABC 1234", date: "2026-03-15", amount: 28000, technician: "Carlo M.",  status: "Completed", duration: "6 hrs",   notes: "Applied 9H coating. Surface prep done. No scratches detected." },
  { id: 2,  service: "Full Interior Detailing",       category: "Detailing", vehicle: "2023 Toyota Fortuner",  plate: "ABC 1234", date: "2026-02-10", amount: 4500,  technician: "Jomar D.",  status: "Completed", duration: "4 hrs",   notes: "Full vacuum, steam clean, and leather conditioning." },
  { id: 3,  service: "Window Tinting - Full Car",     category: "Tinting",   vehicle: "2021 Honda Civic",       plate: "XYZ 5678", date: "2026-01-28", amount: 8000,  technician: "Rico B.",   status: "Completed", duration: "3 hrs",   notes: "35% tint applied front and rear. No bubbles." },
  { id: 4,  service: "PPF - Hood & Fenders",          category: "PPF",       vehicle: "2023 Toyota Fortuner",  plate: "ABC 1234", date: "2025-12-05", amount: 15000, technician: "Carlo M.",  status: "Completed", duration: "5 hrs",   notes: "PPF applied on hood, both fenders, and front bumper." },
  { id: 5,  service: "Nano Ceramic Spray",            category: "Coating",   vehicle: "2021 Honda Civic",       plate: "XYZ 5678", date: "2025-11-18", amount: 3200,  technician: "Jomar D.",  status: "Completed", duration: "2 hrs",   notes: "Spray coating topped with sealant." },
  { id: 6,  service: "Paint Decontamination",         category: "Detailing", vehicle: "2021 Honda Civic",       plate: "XYZ 5678", date: "2025-10-30", amount: 2500,  technician: "Rico B.",   status: "Completed", duration: "2.5 hrs", notes: "Iron remover and clay bar treatment." },
  { id: 7,  service: "Ceramic Coating - Partial",     category: "Coating",   vehicle: "2021 Honda Civic",       plate: "XYZ 5678", date: "2025-09-12", amount: 12000, technician: "Carlo M.",  status: "Cancelled", duration: "—",       notes: "Customer rescheduled. No work performed." },
];

const CATEGORIES = ["All", "Coating", "PPF", "Detailing", "Tinting"];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function serviceIcon(category: string) {
  if (category === "Coating")   return <Shield   className="w-4 h-4 text-[#E41E6A]"   />;
  if (category === "PPF")       return <Layers   className="w-4 h-4 text-violet-500"  />;
  if (category === "Tinting")   return <Sparkles className="w-4 h-4 text-sky-500"    />;
  return                               <Wrench   className="w-4 h-4 text-emerald-500" />;
}

const CATEGORY_COLOR: Record<string, string> = {
  Coating:   "bg-[#E41E6A]/10 text-[#E41E6A] border-[#E41E6A]/20",
  PPF:       "bg-violet-500/10 text-violet-600 border-violet-500/20",
  Tinting:   "bg-sky-500/10 text-sky-600 border-sky-500/20",
  Detailing: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
};

// ─── DETAIL MODAL ─────────────────────────────────────────────────────────────

function DetailModal({ record, onClose }: { record: ServiceRecord; onClose: () => void }) {
  const Row = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
    <div className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0 mt-0.5 text-[#E41E6A]">{icon}</div>
      <div>
        <p className="text-xs text-gray-400 font-medium">{label}</p>
        <p className="text-sm text-gray-800 font-semibold mt-0.5">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center flex-shrink-0">
              {serviceIcon(record.category)}
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-800 leading-snug">{record.service}</h2>
              <p className="text-xs text-gray-400 mt-0.5">{formatDate(record.date)}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <Row icon={<Car      className="w-4 h-4" />} label="Vehicle"     value={`${record.vehicle} (${record.plate})`} />
          <Row icon={<User     className="w-4 h-4" />} label="Technician"  value={record.technician} />
          <Row icon={<Banknote className="w-4 h-4" />} label="Amount Paid" value={`₱${record.amount.toLocaleString()}`} />
          <Row icon={<Shield   className="w-4 h-4" />} label="Duration"    value={record.duration} />

          {record.notes && (
            <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-xs text-gray-400 font-medium mb-1">Technician Notes</p>
              <p className="text-sm text-gray-700 leading-relaxed">{record.notes}</p>
            </div>
          )}

          <div className="mt-4 flex items-center justify-between">
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
              record.status === "Completed"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-red-50 text-red-600 border border-red-200"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${record.status === "Completed" ? "bg-emerald-500" : "bg-red-400"}`} />
              {record.status}
            </span>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${CATEGORY_COLOR[record.category] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
              {record.category}
            </span>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export function CustomerServiceHistory() {
  const [search,      setSearch]      = useState("");
  const [filterCat,   setFilterCat]   = useState("All");
  const [filterVeh,   setFilterVeh]   = useState("All");
  const [viewRecord,  setViewRecord]  = useState<ServiceRecord | null>(null);

  const vehicles = ["All", ...Array.from(new Set(MOCK_HISTORY.map(r => r.vehicle)))];

  const totalSpent     = MOCK_HISTORY.filter(r => r.status === "Completed").reduce((s, r) => s + r.amount, 0);
  const completedCount = MOCK_HISTORY.filter(r => r.status === "Completed").length;

  const filtered = useMemo(() =>
    MOCK_HISTORY
      .filter(r => filterCat === "All" || r.category === filterCat)
      .filter(r => filterVeh === "All" || r.vehicle   === filterVeh)
      .filter(r =>
        r.service.toLowerCase().includes(search.toLowerCase()) ||
        r.vehicle.toLowerCase().includes(search.toLowerCase()) ||
        r.technician.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [search, filterCat, filterVeh]
  );

  return (
    <div className="min-h-full bg-gray-50 p-4 md:p-6 space-y-5">

      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Service History</h1>
        <p className="text-gray-400 text-sm mt-1">All your past services and completed work</p>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0"><CheckCircle className="w-5 h-5 text-emerald-500" /></div>
          <div>
            <p className="text-xs text-gray-400 font-medium">Services Done</p>
            <p className="text-xl font-bold text-gray-800">{completedCount}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center flex-shrink-0"><Banknote className="w-5 h-5 text-[#E41E6A]" /></div>
          <div>
            <p className="text-xs text-gray-400 font-medium">Total Spent</p>
            <p className="text-xl font-bold text-gray-800">₱{Math.round(totalSpent/1000)}K</p>
          </div>
        </div>
        <div className="col-span-2 sm:col-span-1 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center flex-shrink-0"><Car className="w-5 h-5 text-sky-500" /></div>
          <div>
            <p className="text-xs text-gray-400 font-medium">Vehicles Serviced</p>
            <p className="text-xl font-bold text-gray-800">{Array.from(new Set(MOCK_HISTORY.filter(r => r.status === "Completed").map(r => r.vehicle))).length}</p>
          </div>
        </div>
      </div>

      {/* ── Search + Filters ── */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by service, vehicle, or technician..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#E41E6A] focus:ring-1 focus:ring-[#E41E6A]/30 placeholder:text-gray-400 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <SlidersHorizontal className="w-4 h-4 text-gray-400 flex-shrink-0" />
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setFilterCat(c)}
              className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                filterCat === c ? "bg-[#E41E6A] text-white border-[#E41E6A]" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
              }`}>{c}</button>
          ))}
        </div>

        <div className="relative">
          <select value={filterVeh} onChange={e => setFilterVeh(e.target.value)}
            className="pl-3 pr-8 py-2.5 text-xs font-semibold bg-white border border-gray-200 rounded-xl text-gray-600 focus:outline-none focus:border-[#E41E6A] appearance-none">
            {vehicles.map(v => <option key={v} value={v}>{v === "All" ? "All Vehicles" : v.split(" ").slice(1).join(" ")}</option>)}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* ── Records List ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50">
          <h2 className="text-sm font-bold text-gray-800">Service Records</h2>
          <p className="text-xs text-gray-400 mt-0.5">{filtered.length} record{filtered.length !== 1 ? "s" : ""} found</p>
        </div>

        {filtered.length === 0 ? (
          <div className="py-12 flex flex-col items-center text-center">
            <FileText className="w-10 h-10 text-gray-200 mb-3" />
            <p className="text-sm text-gray-400">No service records found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map(r => (
              <div
                key={r.id}
                onClick={() => setViewRecord(r)}
                className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/60 transition-colors cursor-pointer"
              >
                {/* Icon */}
                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
                  {serviceIcon(r.category)}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{r.service}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-400 flex items-center gap-1"><Car className="w-3 h-3" />{r.vehicle}</span>
                    <span className="text-xs text-gray-400 flex items-center gap-1"><Calendar className="w-3 h-3 text-[#E41E6A]" />{formatDate(r.date)}</span>
                    <span className="text-xs text-gray-400 flex items-center gap-1"><User className="w-3 h-3" />{r.technician}</span>
                  </div>
                </div>

                {/* Right side */}
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <p className="text-sm font-bold text-gray-800">₱{r.amount.toLocaleString()}</p>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${CATEGORY_COLOR[r.category] ?? "bg-gray-100 text-gray-600"}`}>
                      {r.category}
                    </span>
                    <span className={`w-2 h-2 rounded-full ${r.status === "Completed" ? "bg-emerald-500" : "bg-red-400"}`} title={r.status} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {viewRecord && <DetailModal record={viewRecord} onClose={() => setViewRecord(null)} />}
    </div>
  );
}

export default CustomerServiceHistory;