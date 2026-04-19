import { useState, useMemo } from "react";
import {
  Banknote, CreditCard, Clock, CheckCircle,
  AlertCircle, Download, Search, ChevronDown,
  SlidersHorizontal, X, FileText, TrendingUp,
  Calendar, Car, Receipt,
} from "lucide-react";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type PaymentStatus = "Paid" | "Pending" | "Partial" | "Refunded";

interface Payment {
  id: number;
  service: string;
  vehicle: string;
  date: string;
  total: number;
  deposit: number;
  balance: number;
  status: PaymentStatus;
  method: string;
  receiptNo: string;
}

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

const MOCK_PAYMENTS: Payment[] = [
  { id: 1, service: "Ceramic Coating - Full Body",   vehicle: "2023 Toyota Fortuner",  date: "2026-03-15", total: 28000, deposit: 5000,  balance: 0,      status: "Paid",    method: "GCash",         receiptNo: "RCP-2026-001" },
  { id: 2, service: "Full Interior Detailing",       vehicle: "2023 Toyota Fortuner",  date: "2026-02-10", total: 4500,  deposit: 1000,  balance: 0,      status: "Paid",    method: "Cash",          receiptNo: "RCP-2026-002" },
  { id: 3, service: "Window Tinting - Full Car",     vehicle: "2021 Honda Civic",       date: "2026-01-28", total: 8000,  deposit: 2000,  balance: 0,      status: "Paid",    method: "Bank Transfer", receiptNo: "RCP-2026-003" },
  { id: 4, service: "Ceramic Coating - Full Body",   vehicle: "2023 Toyota Fortuner",  date: "2026-04-24", total: 28000, deposit: 3000,  balance: 25000,  status: "Partial", method: "GCash",         receiptNo: "RCP-2026-004" },
  { id: 5, service: "Paint Protection Film - Hood",  vehicle: "2021 Honda Civic",       date: "2026-05-03", total: 15000, deposit: 1500,  balance: 13500,  status: "Pending", method: "—",             receiptNo: "RCP-2026-005" },
  { id: 6, service: "PPF - Hood & Fenders",          vehicle: "2023 Toyota Fortuner",  date: "2025-12-05", total: 15000, deposit: 3000,  balance: 0,      status: "Paid",    method: "Cash",          receiptNo: "RCP-2025-012" },
  { id: 7, service: "Nano Ceramic Spray",            vehicle: "2021 Honda Civic",       date: "2025-11-18", total: 3200,  deposit: 500,   balance: 0,      status: "Paid",    method: "GCash",         receiptNo: "RCP-2025-011" },
];

// ─── STATUS CONFIG ─────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<PaymentStatus, { bg: string; text: string; dot: string; border: string; icon: React.ReactNode }> = {
  Paid:     { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", border: "border-emerald-200", icon: <CheckCircle className="w-3.5 h-3.5" /> },
  Pending:  { bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-400",   border: "border-amber-200",   icon: <Clock       className="w-3.5 h-3.5" /> },
  Partial:  { bg: "bg-blue-50",    text: "text-blue-700",    dot: "bg-blue-500",    border: "border-blue-200",    icon: <AlertCircle className="w-3.5 h-3.5" /> },
  Refunded: { bg: "bg-gray-100",   text: "text-gray-600",    dot: "bg-gray-400",    border: "border-gray-200",    icon: <TrendingUp  className="w-3.5 h-3.5" /> },
};

const METHOD_ICON: Record<string, React.ReactNode> = {
  "GCash":         <div className="w-5 h-5 rounded bg-blue-500 text-white text-[9px] font-bold flex items-center justify-center">G</div>,
  "Cash":          <Banknote className="w-4 h-4 text-emerald-500" />,
  "Bank Transfer": <CreditCard className="w-4 h-4 text-violet-500" />,
  "—":             <Clock className="w-4 h-4 text-gray-400" />,
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function StatusBadge({ status }: { status: PaymentStatus }) {
  const s = STATUS_STYLE[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${s.bg} ${s.text} ${s.border}`}>
      {s.icon}{status}
    </span>
  );
}

// ─── RECEIPT MODAL ────────────────────────────────────────────────────────────

function ReceiptModal({ payment, onClose }: { payment: Payment; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-[#E41E6A]" />
            <h2 className="text-base font-bold text-gray-800">Payment Receipt</h2>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Receipt body */}
        <div className="p-6 space-y-4">
          {/* Logo area */}
          <div className="text-center pb-4 border-b border-dashed border-gray-200">
            <p className="text-lg font-bold text-gray-900">Ceramic Pro Davao</p>
            <p className="text-xs text-gray-400 mt-0.5">Official Receipt</p>
            <p className="text-xs text-[#E41E6A] font-semibold mt-1">{payment.receiptNo}</p>
          </div>

          {[
            { label: "Service",    value: payment.service                  },
            { label: "Vehicle",    value: payment.vehicle                  },
            { label: "Date",       value: formatDate(payment.date)         },
            { label: "Method",     value: payment.method                   },
          ].map(r => (
            <div key={r.label} className="flex justify-between items-start gap-3">
              <p className="text-xs text-gray-400 font-medium">{r.label}</p>
              <p className="text-xs text-gray-800 font-semibold text-right max-w-[60%]">{r.value}</p>
            </div>
          ))}

          <div className="pt-3 border-t border-dashed border-gray-200 space-y-2">
            <div className="flex justify-between text-xs"><span className="text-gray-500">Service Total</span><span className="font-semibold text-gray-800">₱{payment.total.toLocaleString()}</span></div>
            <div className="flex justify-between text-xs"><span className="text-gray-500">Deposit Paid</span><span className="font-semibold text-emerald-600">₱{payment.deposit.toLocaleString()}</span></div>
            {payment.balance > 0 && (
              <div className="flex justify-between text-xs"><span className="text-amber-600 font-medium">Outstanding Balance</span><span className="font-bold text-amber-600">₱{payment.balance.toLocaleString()}</span></div>
            )}
            <div className="flex justify-between items-center pt-2 border-t border-gray-100">
              <span className="text-sm font-bold text-gray-800">Status</span>
              <StatusBadge status={payment.status} />
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Close</button>
          <button
            onClick={() => window.print()}
            className="flex-1 py-2 text-sm font-semibold text-white bg-[#E41E6A] hover:bg-[#c41559] rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4" />Download
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export function CustomerPayments() {
  const [search,      setSearch]      = useState("");
  const [filterStatus,setFilterStatus]= useState<"All" | PaymentStatus>("All");
  const [viewReceipt, setViewReceipt] = useState<Payment | null>(null);

  // Stats
  const totalPaid     = MOCK_PAYMENTS.filter(p => p.status === "Paid").reduce((s, p) => s + p.total, 0);
  const totalDeposits = MOCK_PAYMENTS.reduce((s, p) => s + p.deposit, 0);
  const outstanding   = MOCK_PAYMENTS.filter(p => p.balance > 0).reduce((s, p) => s + p.balance, 0);
  const pendingCount  = MOCK_PAYMENTS.filter(p => p.status === "Pending" || p.status === "Partial").length;

  const filtered = useMemo(() =>
    MOCK_PAYMENTS
      .filter(p => filterStatus === "All" || p.status === filterStatus)
      .filter(p =>
        p.service.toLowerCase().includes(search.toLowerCase()) ||
        p.vehicle.toLowerCase().includes(search.toLowerCase()) ||
        p.receiptNo.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [search, filterStatus]
  );

  return (
    <div className="min-h-full bg-gray-50 p-4 md:p-6 space-y-5">

      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Payments</h1>
        <p className="text-gray-400 text-sm mt-1">Your payment history, deposits, and balances</p>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0"><CheckCircle className="w-5 h-5 text-emerald-500" /></div>
          <div>
            <p className="text-xs text-gray-400 font-medium">Total Paid</p>
            <p className="text-lg font-bold text-gray-800">₱{Math.round(totalPaid/1000)}K</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center flex-shrink-0"><Banknote className="w-5 h-5 text-sky-500" /></div>
          <div>
            <p className="text-xs text-gray-400 font-medium">Total Deposits</p>
            <p className="text-lg font-bold text-gray-800">₱{totalDeposits.toLocaleString()}</p>
          </div>
        </div>
        <div className={`rounded-2xl p-4 shadow-sm border flex items-center gap-3 ${outstanding > 0 ? "bg-amber-50 border-amber-200" : "bg-white border-gray-100"}`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${outstanding > 0 ? "bg-amber-100" : "bg-gray-50"}`}>
            <AlertCircle className={`w-5 h-5 ${outstanding > 0 ? "text-amber-500" : "text-gray-400"}`} />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">Outstanding</p>
            <p className={`text-lg font-bold ${outstanding > 0 ? "text-amber-600" : "text-gray-800"}`}>₱{outstanding.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center flex-shrink-0"><Clock className="w-5 h-5 text-[#E41E6A]" /></div>
          <div>
            <p className="text-xs text-gray-400 font-medium">Pending</p>
            <p className="text-lg font-bold text-gray-800">{pendingCount} item{pendingCount !== 1 ? "s" : ""}</p>
          </div>
        </div>
      </div>

      {/* ── Outstanding Banner ── */}
      {outstanding > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">You have an outstanding balance of ₱{outstanding.toLocaleString()}</p>
            <p className="text-xs text-amber-600 mt-0.5">Please settle your balance before or on the day of your appointment.</p>
          </div>
        </div>
      )}

      {/* ── Search + Filters ── */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by service, vehicle, or receipt no..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#E41E6A] focus:ring-1 focus:ring-[#E41E6A]/30 placeholder:text-gray-400 transition-colors"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <SlidersHorizontal className="w-4 h-4 text-gray-400 flex-shrink-0" />
          {(["All", "Paid", "Partial", "Pending", "Refunded"] as const).map(f => (
            <button key={f} onClick={() => setFilterStatus(f)}
              className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                filterStatus === f ? "bg-[#E41E6A] text-white border-[#E41E6A]" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
              }`}>{f}</button>
          ))}
        </div>
      </div>

      {/* ── Payment Records ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50">
          <h2 className="text-sm font-bold text-gray-800">Payment Records</h2>
          <p className="text-xs text-gray-400 mt-0.5">{filtered.length} record{filtered.length !== 1 ? "s" : ""}</p>
        </div>

        {/* Mobile */}
        <div className="sm:hidden divide-y divide-gray-50">
          {filtered.map(p => (
            <div key={p.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-gray-800 leading-snug">{p.service}</p>
                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><Car className="w-3 h-3" />{p.vehicle}</p>
                </div>
                <StatusBadge status={p.status} />
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-[#E41E6A]" />{formatDate(p.date)}</span>
                <span className="flex items-center gap-1">{METHOD_ICON[p.method]}<span className="ml-0.5">{p.method}</span></span>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-xs space-y-0.5">
                  <p className="text-gray-500">Total: <span className="font-bold text-gray-800">₱{p.total.toLocaleString()}</span></p>
                  <p className="text-gray-500">Deposit: <span className="font-semibold text-emerald-600">₱{p.deposit.toLocaleString()}</span></p>
                  {p.balance > 0 && <p className="text-amber-600 font-medium">Balance: ₱{p.balance.toLocaleString()}</p>}
                </div>
                <button onClick={() => setViewReceipt(p)} className="flex items-center gap-1.5 text-xs font-medium text-[#E41E6A] hover:text-[#c41559] border border-[#E41E6A]/30 px-3 py-1.5 rounded-lg transition-colors">
                  <Download className="w-3.5 h-3.5" />Receipt
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                {["Date","Service","Vehicle","Total","Deposit","Balance","Method","Status",""].map(h => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-10 text-gray-400 text-sm">
                  <FileText className="w-8 h-8 mx-auto mb-2 text-gray-200" />No payment records found.
                </td></tr>
              ) : filtered.map(p => (
                <tr key={p.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-4 py-3.5 text-xs text-gray-500 whitespace-nowrap">{formatDate(p.date)}</td>
                  <td className="px-4 py-3.5">
                    <p className="text-sm font-medium text-gray-800 max-w-[160px] truncate">{p.service}</p>
                    <p className="text-xs text-gray-400">{p.receiptNo}</p>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-gray-500 whitespace-nowrap">{p.vehicle.split(" ").slice(1).join(" ")}</td>
                  <td className="px-4 py-3.5 font-bold text-gray-800 whitespace-nowrap">₱{p.total.toLocaleString()}</td>
                  <td className="px-4 py-3.5 text-emerald-600 font-semibold whitespace-nowrap">₱{p.deposit.toLocaleString()}</td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    {p.balance > 0
                      ? <span className="text-amber-600 font-bold">₱{p.balance.toLocaleString()}</span>
                      : <span className="text-gray-300 text-xs">—</span>
                    }
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="flex items-center gap-1.5 text-xs text-gray-600">
                      {METHOD_ICON[p.method]}{p.method}
                    </span>
                  </td>
                  <td className="px-4 py-3.5"><StatusBadge status={p.status} /></td>
                  <td className="px-4 py-3.5">
                    <button
                      onClick={() => setViewReceipt(p)}
                      className="flex items-center gap-1 text-xs font-medium text-[#E41E6A] hover:text-[#c41559] border border-[#E41E6A]/20 px-2.5 py-1.5 rounded-lg transition-colors"
                    >
                      <Download className="w-3 h-3" />Receipt
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {viewReceipt && <ReceiptModal payment={viewReceipt} onClose={() => setViewReceipt(null)} />}
    </div>
  );
}

export default CustomerPayments;