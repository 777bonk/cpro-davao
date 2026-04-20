import { useState, useEffect, useMemo } from "react";
import {
  Banknote, CreditCard, Clock, CheckCircle,
  AlertCircle, Download, Search, ChevronDown,
  SlidersHorizontal, X, FileText, TrendingUp,
  Calendar, Car, Receipt,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../dashboard-ui/card";
import { Badge } from "../dashboard-ui/badge";
import { getTransactions, Transaction } from "../../services/finance";
import { getAppointments } from "../../services/appointments";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type PaymentStatus = "Paid" | "Pending" | "Partial" | "Refunded";

interface PaymentRecord {
  id: string | number;
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

// ─── STATUS CONFIG ─────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<PaymentStatus, { bg: string; text: string; dot: string; border: string; icon: React.ReactNode }> = {
  Paid:      { bg: "bg-green-500/20",  text: "text-green-400",  dot: "bg-green-500",  border: "border-green-500/30",  icon: <CheckCircle className="w-3.5 h-3.5" /> },
  Pending:   { bg: "bg-yellow-500/20", text: "text-yellow-400", dot: "bg-yellow-400", border: "border-yellow-500/30", icon: <Clock       className="w-3.5 h-3.5" /> },
  Partial:   { bg: "bg-blue-500/20",   text: "text-blue-400",   dot: "bg-blue-500",   border: "border-blue-500/30",   icon: <AlertCircle className="w-3.5 h-3.5" /> },
  Refunded:  { bg: "bg-white/10",      text: "text-white/50",   dot: "bg-white/30",   border: "border-white/10",      icon: <TrendingUp  className="w-3.5 h-3.5" /> },
};

const METHOD_ICON: Record<string, React.ReactNode> = {
  "GCash":         <div className="w-5 h-5 rounded bg-blue-500 text-white text-[9px] font-bold flex items-center justify-center">G</div>,
  "Cash":          <Banknote   className="w-4 h-4 text-green-400"  />,
  "Bank Transfer": <CreditCard className="w-4 h-4 text-violet-400" />,
  "—":             <Clock      className="w-4 h-4 text-white/40"   />,
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function derivePaymentStatus(apptStatus: string, balance: number): PaymentStatus {
  if (apptStatus === "Completed" && balance === 0) return "Paid";
  if (apptStatus === "Completed" && balance > 0)   return "Partial";
  if (apptStatus === "Cancelled")                  return "Refunded";
  return "Pending";
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

function ReceiptModal({ payment, onClose }: { payment: PaymentRecord; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm" style={{ backgroundColor: "rgba(0,0,0,0.8)" }}>
      <div className="bg-[#0a0a0a] border border-white/10 rounded-xl w-full max-w-sm shadow-2xl flex flex-col">

        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-[#E41E6A]" />
            <h2 className="text-base font-bold text-white">Payment Receipt</h2>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Receipt body */}
        <div className="p-6 space-y-4">
          {/* Shop name */}
          <div className="text-center pb-4 border-b border-white/10 border-dashed">
            <p className="text-white text-lg font-bold">Ceramic Pro Davao</p>
            <p className="text-white/50 text-xs mt-0.5">Official Receipt</p>
            <p className="text-[#E41E6A] text-xs font-semibold mt-1">{payment.receiptNo}</p>
          </div>

          {[
            { label: "Service", value: payment.service   },
            { label: "Vehicle", value: payment.vehicle   },
            { label: "Date",    value: formatDate(payment.date) },
            { label: "Method",  value: payment.method    },
          ].map(r => (
            <div key={r.label} className="flex justify-between items-start gap-3">
              <p className="text-white/50 text-xs font-medium">{r.label}</p>
              <p className="text-white text-xs font-semibold text-right max-w-[60%]">{r.value}</p>
            </div>
          ))}

          <div className="pt-3 border-t border-white/10 border-dashed space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-white/50">Service Total</span>
              <span className="text-white font-semibold">₱{payment.total.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-white/50">Deposit Paid</span>
              <span className="text-green-400 font-semibold">₱{payment.deposit.toLocaleString()}</span>
            </div>
            {payment.balance > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-yellow-400 font-medium">Outstanding Balance</span>
                <span className="text-yellow-400 font-bold">₱{payment.balance.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-2 border-t border-white/10">
              <span className="text-white text-sm font-bold">Status</span>
              <StatusBadge status={payment.status} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 bg-white/5 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2 text-sm font-medium border border-white/10 text-white hover:bg-white/10 rounded-lg transition-colors">
            Close
          </button>
          <button
            onClick={() => window.print()}
            className="flex-1 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#E41E6A] to-pink-600 hover:from-[#c41559] rounded-lg flex items-center justify-center gap-2 transition-colors"
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
  const [payments,     setPayments]     = useState<PaymentRecord[]>([]);
  const [isLoading,    setIsLoading]    = useState(true);
  const [search,       setSearch]       = useState("");
  const [filterStatus, setFilterStatus] = useState<"All" | PaymentStatus>("All");
  const [viewReceipt,  setViewReceipt]  = useState<PaymentRecord | null>(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [appts, transactions] = await Promise.all([
        getAppointments().catch(() => []),
        getTransactions().catch(() => []),
      ]);

      // Build a lookup of income transactions by description/service
      const txByService: Record<string, Transaction[]> = {};
      transactions.forEach((t: Transaction) => {
        if (t.type !== "income") return;
        const key = (t.description ?? "").split(" - ")[0].toLowerCase().trim();
        if (!txByService[key]) txByService[key] = [];
        txByService[key].push(t);
      });

      // Build payment records from appointments
      const records: PaymentRecord[] = appts.map((a: any, i: number) => {
        const raw      = a.date || a.scheduled_date;
        const d        = new Date(raw);
        const dateStr  = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
        const service  = a.service_type ?? a.service ?? "Service";
        const vehicle  = a.customers?.vehicle ?? a.vehicle ?? "Vehicle";
        const total    = Number(a.total_cost   ?? a.amount   ?? 0);
        const deposit  = Number(a.deposit      ?? a.deposit_amount ?? 0);
        const balance  = Math.max(total - deposit, 0);
        const status   = derivePaymentStatus(a.status ?? "Pending", balance);
        const method   = a.payment_method ?? (status === "Paid" ? "Cash" : "—");
        const receiptNo = `RCP-${d.getFullYear()}-${String(i + 1).padStart(3, "0")}`;

        return {
          id:        a.id,
          service,
          vehicle,
          date:      dateStr,
          total,
          deposit,
          balance,
          status,
          method,
          receiptNo,
        };
      }).sort((a: PaymentRecord, b: PaymentRecord) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setPayments(records);
    } catch (err) {
      console.error("CustomerPayments fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Stats ─────────────────────────────────────────────────────────────────
  const totalPaid     = payments.filter(p => p.status === "Paid").reduce((s, p) => s + p.total,   0);
  const totalDeposits = payments.reduce((s, p) => s + p.deposit, 0);
  const outstanding   = payments.filter(p => p.balance > 0).reduce((s, p) => s + p.balance, 0);
  const pendingCount  = payments.filter(p => p.status === "Pending" || p.status === "Partial").length;

  // ── Filtered list ─────────────────────────────────────────────────────────
  const filtered = useMemo(() =>
    payments
      .filter(p => filterStatus === "All" || p.status === filterStatus)
      .filter(p =>
        p.service.toLowerCase().includes(search.toLowerCase())   ||
        p.vehicle.toLowerCase().includes(search.toLowerCase())   ||
        p.receiptNo.toLowerCase().includes(search.toLowerCase())
      ),
    [payments, search, filterStatus]
  );

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div>
        <h1 className="text-white text-3xl font-bold mb-1">Payments</h1>
        <p className="text-white/60 text-sm">Your payment history, deposits, and balances</p>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: <CheckCircle className="w-4 h-4" />, label: "Total Paid",      value: isLoading ? "..." : `₱${Math.round(totalPaid/1000)}K`,            iconBg: "bg-green-500/10",  iconColor: "text-green-400"  },
          { icon: <Banknote    className="w-4 h-4" />, label: "Total Deposits",  value: isLoading ? "..." : `₱${totalDeposits.toLocaleString()}`,          iconBg: "bg-sky-500/10",    iconColor: "text-sky-400"    },
          { icon: <AlertCircle className="w-4 h-4" />, label: "Outstanding",     value: isLoading ? "..." : `₱${outstanding.toLocaleString()}`,            iconBg: outstanding > 0 ? "bg-yellow-500/10" : "bg-white/5", iconColor: outstanding > 0 ? "text-yellow-400" : "text-white/40" },
          { icon: <Clock       className="w-4 h-4" />, label: "Pending",         value: isLoading ? "..." : `${pendingCount} item${pendingCount !== 1 ? "s" : ""}`, iconBg: "bg-[#E41E6A]/10", iconColor: "text-[#E41E6A]" },
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

      {/* ── Outstanding Banner ── */}
      {outstanding > 0 && !isLoading && (
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-yellow-400 text-sm font-semibold">Outstanding balance of ₱{outstanding.toLocaleString()}</p>
            <p className="text-yellow-400/70 text-xs mt-0.5">Please settle your balance before or on the day of your appointment.</p>
          </div>
        </div>
      )}

      {/* ── Search + Filters ── */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by service, vehicle, or receipt no..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#E41E6A] focus:ring-1 focus:ring-[#E41E6A]/30 transition-colors"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <SlidersHorizontal className="w-4 h-4 text-white/40 flex-shrink-0" />
          {(["All", "Paid", "Partial", "Pending", "Refunded"] as const).map(f => (
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

      {/* ── Payment Records ── */}
      <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur overflow-hidden" style={{ borderRadius: "12px" }}>
        <CardHeader className="border-b border-white/10 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Payment Records</CardTitle>
            <span className="text-white/40 text-xs">{isLoading ? "..." : `${filtered.length} record${filtered.length !== 1 ? "s" : ""}`}</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-8 h-8 border-2 border-[#E41E6A]/30 border-t-[#E41E6A] rounded-full animate-spin mb-3" />
              <p className="text-white/50 text-sm">Loading payments...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 flex flex-col items-center text-center">
              <FileText className="w-10 h-10 text-white/20 mb-3" />
              <p className="text-white/50 text-sm">No payment records found</p>
            </div>
          ) : (
            <>
              {/* Mobile cards */}
              <div className="sm:hidden divide-y divide-white/5">
                {filtered.map(p => (
                  <div key={p.id} className="p-4 hover:bg-white/5 transition-colors space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-white text-sm font-semibold leading-snug">{p.service}</p>
                        <p className="text-white/50 text-xs flex items-center gap-1 mt-0.5"><Car className="w-3 h-3" />{p.vehicle}</p>
                      </div>
                      <StatusBadge status={p.status} />
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/50">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-[#E41E6A]" />{formatDate(p.date)}</span>
                      <span className="flex items-center gap-1.5">{METHOD_ICON[p.method]}<span className="ml-0.5">{p.method}</span></span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-xs space-y-0.5">
                        <p className="text-white/50">Total: <span className="font-bold text-white">₱{p.total.toLocaleString()}</span></p>
                        <p className="text-white/50">Deposit: <span className="font-semibold text-green-400">₱{p.deposit.toLocaleString()}</span></p>
                        {p.balance > 0 && <p className="text-yellow-400 font-medium">Balance: ₱{p.balance.toLocaleString()}</p>}
                      </div>
                      <button
                        onClick={() => setViewReceipt(p)}
                        className="flex items-center gap-1.5 text-xs font-medium text-[#E41E6A] hover:text-pink-400 border border-[#E41E6A]/30 px-3 py-1.5 rounded-lg transition-colors"
                      >
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
                    <tr className="border-b border-white/10">
                      {["Date","Service","Vehicle","Total","Deposit","Balance","Method","Status",""].map(h => (
                        <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-white/50 uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filtered.map(p => (
                      <tr key={p.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <p className="text-white/70 text-xs font-medium">{formatDate(p.date)}</p>
                          <p className="text-white/40 text-xs">{p.receiptNo}</p>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="text-white text-sm font-medium max-w-[160px] truncate">{p.service}</p>
                        </td>
                        <td className="px-4 py-3.5 text-white/60 text-sm whitespace-nowrap">
                          {p.vehicle.split(" ").slice(1).join(" ")}
                        </td>
                        <td className="px-4 py-3.5 text-white font-bold whitespace-nowrap">
                          ₱{p.total.toLocaleString()}
                        </td>
                        <td className="px-4 py-3.5 text-green-400 font-semibold whitespace-nowrap">
                          ₱{p.deposit.toLocaleString()}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {p.balance > 0
                            ? <span className="text-yellow-400 font-bold">₱{p.balance.toLocaleString()}</span>
                            : <span className="text-white/20 text-xs">—</span>
                          }
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="flex items-center gap-1.5 text-xs text-white/60">
                            {METHOD_ICON[p.method] ?? METHOD_ICON["—"]}{p.method}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <StatusBadge status={p.status} />
                        </td>
                        <td className="px-4 py-3.5">
                          <button
                            onClick={() => setViewReceipt(p)}
                            className="flex items-center gap-1 text-xs font-medium text-[#E41E6A] hover:text-pink-400 border border-[#E41E6A]/20 px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                          >
                            <Download className="w-3 h-3" />Receipt
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {viewReceipt && <ReceiptModal payment={viewReceipt} onClose={() => setViewReceipt(null)} />}
    </div>
  );
}

export default CustomerPayments;