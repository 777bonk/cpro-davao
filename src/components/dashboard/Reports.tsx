import { useState, useEffect, useMemo } from "react";
import {
  FileText, Download, TrendingUp, TrendingDown,
  PieChart as PieChartIcon, DollarSign, ArrowUpRight,
  ArrowDownRight, ChevronDown, BarChart2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../dashboard-ui/card";
import { Button } from "../dashboard-ui/button";
import { Badge } from "../dashboard-ui/badge";
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import { getTransactions } from "../../services/finance";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type MonthlyReportBucket = {
  month: string;
  monthKey: string;
  service: number;
  sales: number;
  incomeTotal: number;
  salaries: number;
  supplies: number;
  utilities: number;
  other: number;
  expenseTotal: number;
  profit: number;
};

type ActiveReport = "income" | "expense" | "profit";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const REPORT_CARDS = [
  { id: "income",  label: "Monthly Income Report",   desc: "Detailed breakdown of all income sources",       icon: TrendingUp,    iconBg: "bg-green-500/15",  iconColor: "text-green-400",  border: "hover:border-green-500/40"  },
  { id: "expense", label: "Monthly Expense Report",  desc: "Comprehensive expense tracking and analysis",    icon: FileText,      iconBg: "bg-red-500/15",    iconColor: "text-red-400",    border: "hover:border-red-500/40"    },
  { id: "profit",  label: "Profit & Loss Statement", desc: "Overall financial performance summary",          icon: DollarSign,    iconBg: "bg-[#E41E6A]/15",  iconColor: "text-[#E41E6A]",  border: "hover:border-[#E41E6A]/40"  },
  { id: "service", label: "Service Revenue Report",  desc: "Revenue analysis by service type",               icon: PieChartIcon,  iconBg: "bg-violet-500/15", iconColor: "text-violet-400", border: "hover:border-violet-500/40" },
] as const;

const YEAR_OPTIONS = ["2026", "2025", "2024", "2023"];

const ChartTooltipStyle = {
  contentStyle: {
    backgroundColor: "rgba(10,10,10,0.95)",
    border: "1px solid rgba(228,30,106,0.3)",
    borderRadius: "10px",
    color: "white",
    fontSize: "12px",
  },
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function formatK(n: number) {
  if (Math.abs(n) >= 1_000_000) return `₱${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000)     return `₱${Math.round(n / 1_000)}K`;
  return `₱${n.toLocaleString()}`;
}

function pct(a: number, b: number) {
  if (b === 0) return 0;
  return Math.round((a / b) * 100);
}

// ─── SUMMARY STAT CARD ────────────────────────────────────────────────────────

function SummaryCard({
  label, value, sub, icon, iconBg, iconColor, trend, trendUp,
}: {
  label: string; value: string; sub: string;
  icon: React.ReactNode; iconBg: string; iconColor: string;
  trend?: string; trendUp?: boolean;
}) {
  return (
    <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm text-white/70">{label}</CardTitle>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBg}`}>
            <span className={iconColor}>{icon}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="text-white text-2xl font-bold">{value}</div>
        {trend ? (
          <p className={`text-xs flex items-center gap-1 mt-1 ${trendUp ? "text-green-400" : "text-red-400"}`}>
            {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {trend}
          </p>
        ) : (
          <p className="text-xs text-white/40 mt-1">{sub}</p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── CHART CARD WRAPPER ───────────────────────────────────────────────────────

function ChartCard({
  title, subtitle, onExport, children,
}: {
  title: string; subtitle?: string; onExport: () => void; children: React.ReactNode;
}) {
  return (
    <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur overflow-hidden">
      <CardHeader className="border-b border-white/10 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-white text-base">{title}</CardTitle>
            {subtitle && <p className="text-white/50 text-xs mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onExport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-white/10 text-white/60 hover:text-white hover:border-white/30 rounded-lg transition-colors flex-shrink-0"
          >
            <Download className="w-3.5 h-3.5" />Export
          </button>
        </div>
      </CardHeader>
      <CardContent className="pt-5">{children}</CardContent>
    </Card>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export function Reports() {
  const [isLoading,    setIsLoading]    = useState(true);
  const [chartData,    setChartData]    = useState<MonthlyReportBucket[]>([]);
  const [activeReport, setActiveReport] = useState<ActiveReport>("income");
  const [selectedYear, setSelectedYear] = useState("2026");
  const [totals, setTotals] = useState({ income: 0, expense: 0, profit: 0 });

  useEffect(() => { fetchReportData(); }, []);

  // ── Data fetch (unchanged logic) ──────────────────────────────────────────
  const fetchReportData = async () => {
    setIsLoading(true);
    try {
      const data = await getTransactions();
      const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      const last6Months: MonthlyReportBucket[] = [];

      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        last6Months.push({
          month:        monthNames[d.getMonth()],
          monthKey:     `${d.getFullYear()}-${d.getMonth()}`,
          service: 0, sales: 0,      incomeTotal:  0,
          salaries: 0, supplies: 0,  utilities: 0, other: 0,
          expenseTotal: 0, profit: 0,
        });
      }

      let totalInc = 0, totalExp = 0;

      data.forEach(t => {
        const tDate    = new Date(t.date);
        const monthKey = `${tDate.getFullYear()}-${tDate.getMonth()}`;
        const bucket   = last6Months.find(m => m.monthKey === monthKey);
        if (!bucket) return;
        const amt = Number(t.amount);
        const cat = t.category.toLowerCase();

        if (t.type === "income") {
          totalInc            += amt;
          bucket.incomeTotal  += amt;
          if (cat.includes("service")) bucket.service += amt;
          else                          bucket.sales   += amt;
        } else if (t.type === "expense") {
          totalExp             += amt;
          bucket.expenseTotal  += amt;
          if      (cat.includes("salar") || cat.includes("payroll"))    bucket.salaries  += amt;
          else if (cat.includes("suppl") || cat.includes("inventory"))  bucket.supplies  += amt;
          else if (cat.includes("util"))                                 bucket.utilities += amt;
          else                                                           bucket.other     += amt;
        }
      });

      // Calculate profit per bucket
      last6Months.forEach(b => { b.profit = b.incomeTotal - b.expenseTotal; });

      setChartData(last6Months);
      setTotals({ income: totalInc, expense: totalExp, profit: totalInc - totalExp });
    } catch (error) {
      console.error("Failed to fetch report data", error);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Derived ──────────────────────────────────────────────────────────────
  const avgMonthlyIncome  = Math.round(totals.income  / 6);
  const avgMonthlyExpense = Math.round(totals.expense / 6);
  const profitMargin      = pct(totals.profit, totals.income);

  const bestMonth = useMemo(() => {
    if (!chartData.length) return null;
    return chartData.reduce((best, b) => b.incomeTotal > best.incomeTotal ? b : best, chartData[0]);
  }, [chartData]);

  const handleExport = (reportName: string) => {
    alert(`Exporting "${reportName}"… (wire to your export service here)`);
  };

  return (
    <div className="space-y-6 w-full">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-white text-3xl font-bold mb-1">Reports & Analytics</h1>
          <p className="text-white/60 text-sm">Generate and view detailed financial reports</p>
        </div>

        {/* Year selector */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(e.target.value)}
              className="pl-9 pr-8 py-2.5 text-sm bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#E41E6A] appearance-none"
            >
              {YEAR_OPTIONS.map(y => <option key={y} value={y} className="bg-[#0a0a0a]">{y}</option>)}
            </select>
            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40 pointer-events-none" />
          </div>
          <button
            onClick={() => handleExport("Full Annual Report")}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border border-[#E41E6A]/30 text-[#E41E6A] hover:bg-[#E41E6A]/10 rounded-xl transition-colors"
          >
            <Download className="w-4 h-4" />Export All
          </button>
        </div>
      </div>

      {/* ── Report Type Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {REPORT_CARDS.map(r => (
          <div
            key={r.id}
            onClick={() => r.id !== "service" && setActiveReport(r.id as ActiveReport)}
            className={`p-4 rounded-2xl border bg-gradient-to-br from-white/5 to-white/10 backdrop-blur transition-all cursor-pointer ${r.border} ${
              activeReport === r.id ? "border-[#E41E6A]/50 bg-[#E41E6A]/5" : "border-white/10"
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${r.iconBg}`}>
                <r.icon className={`w-5 h-5 ${r.iconColor}`} />
              </div>
              <button
                onClick={e => { e.stopPropagation(); handleExport(r.label); }}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-white/10 text-white/40 hover:text-white hover:border-white/30 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-white text-sm font-semibold leading-snug">{r.label}</p>
            <p className="text-white/40 text-xs mt-1 leading-snug">{r.desc}</p>
            {activeReport === r.id && (
              <div className="mt-2">
                <span className="text-xs font-semibold text-[#E41E6A] bg-[#E41E6A]/10 px-2 py-0.5 rounded-full border border-[#E41E6A]/20">
                  Viewing
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── KPI Summary ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <SummaryCard
          label="Total Income (6M)"  value={formatK(totals.income)}
          sub="All income sources"   trend={`Avg ${formatK(avgMonthlyIncome)}/mo`} trendUp={true}
          icon={<TrendingUp  className="w-4 h-4" />} iconBg="bg-green-500/15"   iconColor="text-green-400"
        />
        <SummaryCard
          label="Total Expenses (6M)" value={formatK(totals.expense)}
          sub="All expense types"     trend={`Avg ${formatK(avgMonthlyExpense)}/mo`} trendUp={false}
          icon={<TrendingDown className="w-4 h-4" />} iconBg="bg-red-500/15"     iconColor="text-red-400"
        />
        <SummaryCard
          label="Net Profit (6M)"  value={formatK(totals.profit)}
          sub="Income minus expenses" trend={`${profitMargin}% margin`} trendUp={totals.profit >= 0}
          icon={<DollarSign  className="w-4 h-4" />} iconBg="bg-[#E41E6A]/15"  iconColor="text-[#E41E6A]"
        />
        <SummaryCard
          label="Best Month"
          value={bestMonth ? bestMonth.month : "—"}
          sub={bestMonth ? `₱${bestMonth.incomeTotal.toLocaleString()} income` : "No data"}
          icon={<BarChart2 className="w-4 h-4" />} iconBg="bg-violet-500/15" iconColor="text-violet-400"
        />
      </div>

      {/* ── Active Chart ── */}
      {isLoading ? (
        <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur">
          <CardContent className="flex items-center justify-center h-64 text-white/50">
            Loading chart data...
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Income Chart */}
          {activeReport === "income" && (
            <ChartCard
              title="Income Report — 6 Month Trend"
              subtitle="Service income vs product sales by month"
              onExport={() => handleExport("Monthly Income Report")}
            >
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
                  <XAxis dataKey="month" stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 11 }} />
                  <YAxis stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 11 }} tickFormatter={v => `₱${v/1000}K`} />
                  <Tooltip {...ChartTooltipStyle} formatter={(v) => [`₱${(v as number).toLocaleString()}`, ""]} />
                  <Legend wrapperStyle={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }} />
                  <Bar dataKey="service" fill="#E41E6A" radius={[4,4,0,0]} name="Service Income" />
                  <Bar dataKey="sales"   fill="#8884d8" radius={[4,4,0,0]} name="Product Sales" />
                </BarChart>
              </ResponsiveContainer>

              {/* Summary strip */}
              <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-white/10">
                <div className="text-center">
                  <p className="text-white/50 text-xs mb-1">Total Income</p>
                  <p className="text-white text-xl font-bold">₱{totals.income.toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <p className="text-white/50 text-xs mb-1">Monthly Average</p>
                  <p className="text-white text-xl font-bold">₱{avgMonthlyIncome.toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <p className="text-white/50 text-xs mb-1">Best Month</p>
                  <p className="text-green-400 text-xl font-bold">{bestMonth?.month ?? "—"}</p>
                </div>
              </div>
            </ChartCard>
          )}

          {/* Expense Chart */}
          {activeReport === "expense" && (
            <ChartCard
              title="Expense Report — 6 Month Trend"
              subtitle="Breakdown by expense category over time"
              onExport={() => handleExport("Monthly Expense Report")}
            >
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
                  <XAxis dataKey="month" stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 11 }} />
                  <YAxis stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 11 }} tickFormatter={v => `₱${v/1000}K`} />
                  <Tooltip {...ChartTooltipStyle} formatter={(v) => [`₱${(v as number).toLocaleString()}`, ""]} />
                  <Legend wrapperStyle={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }} />
                  <Line type="monotone" dataKey="salaries"  stroke="#E41E6A" strokeWidth={2} dot={{ r: 3 }} name="Salaries"  />
                  <Line type="monotone" dataKey="supplies"  stroke="#8884d8" strokeWidth={2} dot={{ r: 3 }} name="Supplies"  />
                  <Line type="monotone" dataKey="utilities" stroke="#82ca9d" strokeWidth={2} dot={{ r: 3 }} name="Utilities" />
                  <Line type="monotone" dataKey="other"     stroke="#ffc658" strokeWidth={2} dot={{ r: 3 }} name="Other"     />
                </LineChart>
              </ResponsiveContainer>

              {/* Category breakdown pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-white/10">
                {[
                  { label: "Salaries",  key: "salaries",  color: "text-[#E41E6A]" },
                  { label: "Supplies",  key: "supplies",  color: "text-violet-400" },
                  { label: "Utilities", key: "utilities", color: "text-emerald-400"},
                  { label: "Other",     key: "other",     color: "text-amber-400"  },
                ].map(c => {
                  const total = chartData.reduce((s, b) => s + (b[c.key as keyof MonthlyReportBucket] as number), 0);
                  return (
                    <div key={c.key} className="p-3 bg-white/5 rounded-xl border border-white/10 text-center">
                      <p className="text-white/50 text-xs">{c.label}</p>
                      <p className={`text-base font-bold mt-0.5 ${c.color}`}>₱{Math.round(total/1000)}K</p>
                    </div>
                  );
                })}
              </div>
            </ChartCard>
          )}

          {/* Profit & Loss Chart */}
          {activeReport === "profit" && (
            <ChartCard
              title="Profit & Loss Statement — 6 Month"
              subtitle="Income, expenses, and net profit over time"
              onExport={() => handleExport("Profit & Loss Statement")}
            >
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="gradIncome"  x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#E41E6A" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#E41E6A" stopOpacity={0}   />
                    </linearGradient>
                    <linearGradient id="gradProfit"  x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#82ca9d" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}   />
                    </linearGradient>
                    <linearGradient id="gradExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#8884d8" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0}   />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
                  <XAxis dataKey="month" stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 11 }} />
                  <YAxis stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 11 }} tickFormatter={v => `₱${v/1000}K`} />
                  <Tooltip {...ChartTooltipStyle} formatter={(v) => [`₱${(v as number).toLocaleString()}`, ""]} />
                  <Legend wrapperStyle={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }} />
                  <Area type="monotone" dataKey="incomeTotal"  stroke="#E41E6A" fill="url(#gradIncome)"  strokeWidth={2} name="Income"   />
                  <Area type="monotone" dataKey="expenseTotal" stroke="#8884d8" fill="url(#gradExpense)" strokeWidth={2} name="Expenses" />
                  <Area type="monotone" dataKey="profit"       stroke="#82ca9d" fill="url(#gradProfit)"  strokeWidth={2} name="Profit"   />
                </AreaChart>
              </ResponsiveContainer>

              {/* P&L summary */}
              <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-white/10">
                <div className="p-3 bg-green-500/10 rounded-xl border border-green-500/20 text-center">
                  <p className="text-white/50 text-xs">Total Revenue</p>
                  <p className="text-green-400 text-lg font-bold mt-0.5">₱{totals.income.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20 text-center">
                  <p className="text-white/50 text-xs">Total Expenses</p>
                  <p className="text-red-400 text-lg font-bold mt-0.5">₱{totals.expense.toLocaleString()}</p>
                </div>
                <div className={`p-3 rounded-xl border text-center ${totals.profit >= 0 ? "bg-[#E41E6A]/10 border-[#E41E6A]/20" : "bg-red-500/10 border-red-500/20"}`}>
                  <p className="text-white/50 text-xs">Net Profit</p>
                  <p className={`text-lg font-bold mt-0.5 ${totals.profit >= 0 ? "text-[#E41E6A]" : "text-red-400"}`}>
                    ₱{totals.profit.toLocaleString()}
                  </p>
                </div>
              </div>
            </ChartCard>
          )}
        </>
      )}

      {/* ── Bottom P&L Summary Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/30 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-400" />Total Revenue (6M)
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="text-white text-2xl font-bold mb-2">
              {isLoading ? "..." : `₱${totals.income.toLocaleString()}`}
            </div>
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
              Generated Income
            </Badge>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/30 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-red-400" />Total Expenses (6M)
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="text-white text-2xl font-bold mb-2">
              {isLoading ? "..." : `₱${totals.expense.toLocaleString()}`}
            </div>
            <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
              Recorded Costs
            </Badge>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#E41E6A]/10 to-pink-500/5 border-[#E41E6A]/30 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-[#E41E6A]" />Net Profit (6M)
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className={`text-2xl font-bold mb-2 ${totals.profit >= 0 ? "text-white" : "text-red-400"}`}>
              {isLoading ? "..." : `₱${totals.profit.toLocaleString()}`}
            </div>
            <Badge className={totals.profit >= 0
              ? "bg-green-500/20 text-green-400 border-green-500/30"
              : "bg-red-500/20 text-red-400 border-red-500/30"}>
              {totals.income > 0
                ? `Profit Margin: ${profitMargin}%`
                : "No margin data"}
            </Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}