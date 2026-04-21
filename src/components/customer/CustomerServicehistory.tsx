import { useState, useEffect, useMemo } from "react";
import {
  Search, Car, Calendar, User, Banknote,
  Shield, Layers, Sparkles, Wrench, ChevronDown,
  SlidersHorizontal, FileText, X, CheckCircle, Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../dashboard-ui/card";
import { getCustomerAppointments } from "../../services/appointments";  // ✅ scoped fetch
import { useAuth } from "../../hooks/useAuth";                           // ✅ added

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface ServiceRecord {
  id:         string | number;
  service:    string;
  category:   string;
  vehicle:    string;
  plate:      string;
  date:       string;
  amount:     number;
  technician: string;
  status:     "Completed" | "Cancelled";
  notes:      string;
  duration:   string;
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const CATEGORIES = ["All", "Coating", "PPF", "Detailing", "Tinting"];

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });
}

function guessCategory(service: string): string {
  const s = (service ?? "").toLowerCase();
  if (s.includes("coat") || s.includes("ceramic") || s.includes("nano")) return "Coating";
  if (s.includes("ppf") || s.includes("paint protection"))               return "PPF";
  if (s.includes("tint"))                                                 return "Tinting";
  return "Detailing";
}

function serviceIcon(category: string) {
  if (category === "Coating")  return <Shield   className="w-4 h-4 text-[#E41E6A]"   />;
  if (category === "PPF")      return <Layers   className="w-4 h-4 text-violet-400"  />;
  if (category === "Tinting")  return <Sparkles className="w-4 h-4 text-sky-400"     />;
  return                              <Wrench   className="w-4 h-4 text-emerald-400" />;
}

const CATEGORY_BADGE: Record<string, string> = {
  Coating:   "bg-[#E41E6A]/20 text-[#E41E6A] border-[#E41E6A]/30",
  PPF:       "bg-violet-500/20 text-violet-400 border-violet-500/30",
  Tinting:   "bg-sky-500/20 text-sky-400 border-sky-500/30",
  Detailing: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
};

// ─── DETAIL MODAL ─────────────────────────────────────────────────────────────

function DetailModal({ record, onClose }: { record: ServiceRecord; onClose: () => void }) {
  const Row = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
    <div className="p-3 bg-white/5 rounded-lg border border-white/10 flex items-start gap-3">
      <div className="mt-0.5 text-[#E41E6A] flex-shrink-0">{icon}</div>
      <div>
        <p className="text-white/50 text-xs">{label}</p>
        <p className="text-white text-sm font-medium mt-0.5">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm" style={{ backgroundColor: "rgba(0,0,0,0.8)" }}>
      <div className="bg-[#0a0a0a] border border-white/10 rounded-xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">

        <div className="p-6 border-b border-white/10 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
              {serviceIcon(record.category)}
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-snug">{record.service}</h2>
              <p className="text-white/50 text-xs mt-0.5">{formatDate(record.date)}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-3">
          <Row icon={<Car      className="w-4 h-4" />} label="Vehicle"     value={record.plate ? `${record.vehicle} (${record.plate})` : record.vehicle} />
          <Row icon={<User     className="w-4 h-4" />} label="Technician"  value={record.technician || "N/A"} />
          <Row icon={<Banknote className="w-4 h-4" />} label="Amount Paid" value={`₱${record.amount.toLocaleString()}`} />
          <Row icon={<Clock    className="w-4 h-4" />} label="Duration"    value={record.duration || "N/A"} />

          {record.notes && (
            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
              <p className="text-white/50 text-xs font-medium mb-1.5">Technician Notes</p>
              <p className="text-white/80 text-sm leading-relaxed">{record.notes}</p>
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${
              record.status === "Completed"
                ? "bg-green-500/20 text-green-400 border-green-500/30"
                : "bg-red-500/20 text-red-400 border-red-500/30"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${record.status === "Completed" ? "bg-green-500" : "bg-red-400"}`} />
              {record.status}
            </span>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${CATEGORY_BADGE[record.category] ?? "bg-white/10 text-white/60 border-white/10"}`}>
              {record.category}
            </span>
          </div>
        </div>

        <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium border border-white/10 text-white hover:bg-white/10 rounded-lg transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export function CustomerServiceHistory() {
  // ✅ useAuth added — required for customer scoping
  const { profile, isLoading: profileLoading } = useAuth();

  const [records,    setRecords]    = useState<ServiceRecord[]>([]);
  const [isLoading,  setIsLoading]  = useState(true);
  const [search,     setSearch]     = useState("");
  const [filterCat,  setFilterCat]  = useState("All");
  const [filterVeh,  setFilterVeh]  = useState("All");
  const [viewRecord, setViewRecord] = useState<ServiceRecord | null>(null);

  // ✅ Wait for customerId before fetching
  useEffect(() => {
    if (profile?.customerId) fetchData();
  }, [profile?.customerId]);

  const fetchData = async () => {
    if (!profile?.customerId) return;
    setIsLoading(true);
    try {
      // ✅ Only fetches THIS customer's appointments — not all appointments
      const appts = await getCustomerAppointments(profile.customerId).catch(() => []);

      const history: ServiceRecord[] = appts
        .filter((a: any) => a.status === "Completed" || a.status === "Cancelled")
        .map((a: any) => {
          const raw = a.scheduled_date || a.date;
          const d   = new Date(raw);
          // ✅ UTC getters — consistent with all other components
          const dateStr = `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,"0")}-${String(d.getUTCDate()).padStart(2,"0")}`;
          const svc = a.service_type ?? a.service ?? "Service";
          const cat = guessCategory(svc);
          return {
            id:         a.id,
            service:    svc,
            category:   cat,
            // NestJS returns relation as a.customer (singular) via include: { customer: true }
            vehicle:    a.customer?.vehicle ?? a.customers?.vehicle ?? a.vehicle ?? "Vehicle",
            plate:      a.customer?.plate   ?? a.customers?.plate   ?? a.plate   ?? "",
            date:       dateStr,
            amount:     Number(a.total_cost ?? a.amount ?? 0),
            technician: a.employees?.name   ?? a.technician ?? "Staff",
            status:     (a.status === "Completed" ? "Completed" : "Cancelled") as "Completed" | "Cancelled",
            notes:      a.notes    ?? "",
            duration:   a.duration ?? "—",
          };
        })
        .sort((a: ServiceRecord, b: ServiceRecord) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );

      setRecords(history);
    } catch (err) {
      console.error("CustomerServiceHistory fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Derived stats ─────────────────────────────────────────────────────────
  const totalSpent       = records.filter(r => r.status === "Completed").reduce((s, r) => s + r.amount, 0);
  const completedCount   = records.filter(r => r.status === "Completed").length;
  const vehiclesServiced = Array.from(new Set(records.filter(r => r.status === "Completed").map(r => r.vehicle))).length;
  const vehicles         = ["All", ...Array.from(new Set(records.map(r => r.vehicle)))];

  // ── Filtered list ─────────────────────────────────────────────────────────
  const filtered = useMemo(() =>
    records
      .filter(r => filterCat === "All" || r.category === filterCat)
      .filter(r => filterVeh === "All" || r.vehicle  === filterVeh)
      .filter(r =>
        r.service.toLowerCase().includes(search.toLowerCase())    ||
        r.vehicle.toLowerCase().includes(search.toLowerCase())    ||
        r.technician.toLowerCase().includes(search.toLowerCase())
      ),
    [records, search, filterCat, filterVeh]
  );

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center h-40 text-white/50">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div>
        <h1 className="text-white text-3xl font-bold mb-1">Service History</h1>
        <p className="text-white/60 text-sm">All your past services and completed work</p>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: <CheckCircle className="w-4 h-4" />, label: "Services Done",     value: isLoading ? "..." : completedCount,                    iconBg: "bg-green-500/10",  iconColor: "text-green-400"  },
          { icon: <Banknote    className="w-4 h-4" />, label: "Total Spent",       value: isLoading ? "..." : `₱${Math.round(totalSpent/1000)}K`, iconBg: "bg-[#E41E6A]/10",  iconColor: "text-[#E41E6A]"  },
          { icon: <Car         className="w-4 h-4" />, label: "Vehicles Serviced", value: isLoading ? "..." : vehiclesServiced,                   iconBg: "bg-sky-500/10",    iconColor: "text-sky-400"    },
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

      {/* ── Search + Filters ── */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by service, vehicle, or technician..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#E41E6A] focus:ring-1 focus:ring-[#E41E6A]/30 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <SlidersHorizontal className="w-4 h-4 text-white/40 flex-shrink-0" />
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setFilterCat(c)}
              className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                filterCat === c
                  ? "bg-[#E41E6A] text-white border-[#E41E6A]"
                  : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white"
              }`}>{c}
            </button>
          ))}
        </div>

        <div className="relative">
          <select value={filterVeh} onChange={e => setFilterVeh(e.target.value)}
            className="pl-3 pr-8 py-2.5 text-xs font-semibold bg-white/5 border border-white/10 rounded-xl text-white/70 focus:outline-none focus:border-[#E41E6A] appearance-none">
            {vehicles.map(v => (
              <option key={v} value={v} className="bg-[#0a0a0a]">
                {v === "All" ? "All Vehicles" : v}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40 pointer-events-none" />
        </div>
      </div>

      {/* ── Records List ── */}
      <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur overflow-hidden" style={{ borderRadius: "12px" }}>
        <CardHeader className="border-b border-white/10 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Service Records</CardTitle>
            <span className="text-white/40 text-xs">
              {isLoading ? "..." : `${filtered.length} record${filtered.length !== 1 ? "s" : ""}`}
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-8 h-8 border-2 border-[#E41E6A]/30 border-t-[#E41E6A] rounded-full animate-spin mb-3" />
              <p className="text-white/50 text-sm">Loading service history...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 flex flex-col items-center text-center">
              <FileText className="w-10 h-10 text-white/20 mb-3" />
              <p className="text-white/50 text-sm">No service records found</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {filtered.map(r => (
                <div
                  key={r.id}
                  onClick={() => setViewRecord(r)}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                    {serviceIcon(r.category)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold truncate">{r.service}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5">
                      <span className="text-xs text-white/50 flex items-center gap-1"><Car      className="w-3 h-3" />{r.vehicle}</span>
                      <span className="text-xs text-white/50 flex items-center gap-1"><Calendar className="w-3 h-3 text-[#E41E6A]" />{formatDate(r.date)}</span>
                      <span className="text-xs text-white/50 flex items-center gap-1"><User     className="w-3 h-3" />{r.technician}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <p className="text-white text-sm font-bold">₱{r.amount.toLocaleString()}</p>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${CATEGORY_BADGE[r.category] ?? "bg-white/10 text-white/60 border-white/10"}`}>
                        {r.category}
                      </span>
                      <span
                        className={`w-2 h-2 rounded-full ${r.status === "Completed" ? "bg-green-500" : "bg-red-400"}`}
                        title={r.status}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {viewRecord && <DetailModal record={viewRecord} onClose={() => setViewRecord(null)} />}
    </div>
  );
}

export default CustomerServiceHistory;
