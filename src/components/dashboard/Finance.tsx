import { useState, useEffect, useMemo } from "react";
import {
  DollarSign, TrendingUp, TrendingDown, Wallet,
  CreditCard, Receipt, Plus, X, ChevronDown,
  Search, SlidersHorizontal, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../dashboard-ui/card";
import { Badge } from "../dashboard-ui/badge";
import { Button } from "../dashboard-ui/button";
import { Label } from "../dashboard-ui/label";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { getTransactions, createTransaction, Transaction } from "../../services/finance";

// ─── STATIC CHART DATA ────────────────────────────────────────────────────────

const monthlyData = [
  { month: "Jan", income: 567000, expenses: 245000, profit: 322000 },
  { month: "Feb", income: 623000, expenses: 268000, profit: 355000 },
  { month: "Mar", income: 589000, expenses: 251000, profit: 338000 },
  { month: "Apr", income: 712000, expenses: 289000, profit: 423000 },
  { month: "May", income: 654000, expenses: 276000, profit: 378000 },
  { month: "Jun", income: 798000, expenses: 312000, profit: 486000 },
];

const expenseBreakdown = [
  { name: "Salaries",  value: 685000, color: "#E41E6A" },
  { name: "Supplies",  value: 156000, color: "#8884d8" },
  { name: "Utilities", value:  45000, color: "#82ca9d" },
  { name: "Marketing", value:  78000, color: "#ffc658" },
  { name: "Others",    value:  48000, color: "#a4de6c" },
];

const CATEGORIES = ["Service Revenue", "Parts & Supplies", "Salaries", "Utilities", "Marketing", "Equipment", "Others"];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function formatK(n: number) {
  if (n >= 1_000_000) return `₱${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `₱${Math.round(n / 1_000)}K`;
  return `₱${n.toLocaleString()}`;
}

function formatFull(n: number) {
  return `₱${n.toLocaleString()}`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

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

  const Field = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <Label className="text-white/70 text-sm">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</Label>
    {children}
  </div>
);
// ─── ADD TRANSACTION MODAL ────────────────────────────────────────────────────

function AddTransactionModal({ onClose, onSave }: {
  onClose: () => void;
  onSave: (t: Omit<Transaction, "id">) => Promise<void>;
}) {
  const [form, setForm] = useState({
    type:        "income" as "income" | "expense",
    description: "",
    category:    "",
    amount:      "",
    date:        new Date().toISOString().split("T")[0],
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!form.description || !form.amount || !form.category) {
      alert("Please fill in Description, Category, and Amount."); return;
    }
    setIsSaving(true);
    try {
      await onSave({ ...form, amount: parseFloat(form.amount) });
      onClose();
    } catch (error: any) {
      alert(`Database Error: ${error?.message || "Failed to save transaction."}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ModalWrapper>
      <div className="bg-[#0a0a0a] border border-white/10 rounded-xl w-full max-w-md shadow-2xl flex flex-col">
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white">Add Transaction</h2>
            <p className="text-white/50 text-xs mt-0.5">Record a new income or expense</p>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-4">
          {/* Type toggle */}
          <div className="flex rounded-lg border border-white/10 overflow-hidden">
            {(["income", "expense"] as const).map(t => (
              <button
                key={t}
                onClick={() => setForm({ ...form, type: t })}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold transition-colors capitalize ${
                  form.type === t
                    ? t === "income"
                      ? "bg-green-500/20 text-green-400"
                      : "bg-red-500/20 text-red-400"
                    : "text-white/50 hover:text-white hover:bg-white/5"
                }`}
              >
                {t === "income" ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {t}
              </button>
            ))}
          </div>

          <Field label="Description" required>
            <input className={inputClass} placeholder="e.g. Ceramic Coating - Toyota Fortuner" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Category" required>
              <div className="relative">
                <select className={inputClass + " appearance-none pr-8"} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  <option value="" className="bg-[#0a0a0a]">Select...</option>
                  {CATEGORIES.map(c => <option key={c} value={c} className="bg-[#0a0a0a]">{c}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
              </div>
            </Field>
            <Field label="Amount (₱)" required>
              <input type="number" className={inputClass} placeholder="0.00" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
            </Field>
          </div>

          <Field label="Date">
            <input type="date" className={inputClass + " [color-scheme:dark]"} value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
          </Field>
        </div>

        <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3">
          <Button variant="outline" className="border-white/10 text-white hover:bg-white/10" onClick={onClose}>Cancel</Button>
          <Button
            className={`text-white border-none ${form.type === "income" ? "bg-green-600 hover:bg-green-700" : "bg-gradient-to-r from-[#E41E6A] to-pink-600 hover:opacity-90"}`}
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : `Add ${form.type === "income" ? "Income" : "Expense"}`}
          </Button>
        </div>
      </div>
    </ModalWrapper>
  );
}

// ─── CUSTOM TOOLTIP ───────────────────────────────────────────────────────────

const ChartTooltip = {
  contentStyle: {
    backgroundColor: "rgba(10,10,10,0.95)",
    border: "1px solid rgba(228,30,106,0.3)",
    borderRadius: "10px",
    color: "white",
    fontSize: "12px",
  },
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export function Finance() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading,    setIsLoading]    = useState(true);
  const [addOpen,      setAddOpen]      = useState(false);
  const [search,       setSearch]       = useState("");
  const [filterType,   setFilterType]   = useState<"all" | "income" | "expense">("all");

  const [stats, setStats] = useState({ totalIncome: 0, totalExpense: 0, netProfit: 0 });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = await getTransactions();
      setTransactions(data);
      let income = 0, expense = 0;
      data.forEach(t => {
        if (t.type === "income")  income  += Number(t.amount);
        if (t.type === "expense") expense += Number(t.amount);
      });
      setStats({ totalIncome: income, totalExpense: expense, netProfit: income - expense });
    } catch (error) {
      console.error("Failed to fetch transactions", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = async (t: Omit<Transaction, "id">) => {
    try {
      // 1. Send it to NestJS!
      await createTransaction(t);
      
      // 2. Simply re-fetch the data from the database to update the tables and stats instantly!
      await fetchData();
      
      setAddOpen(false);
    } catch (error: any) {
      alert(`Error saving transaction: ${error.message}`);
    }
  };

  const profitMargin = stats.totalIncome > 0
    ? ((stats.netProfit / stats.totalIncome) * 100).toFixed(1)
    : "0.0";

  // Filtered transactions
  const filtered = useMemo(() =>
    transactions
      .filter(t => filterType === "all" || t.type === filterType)
      .filter(t =>
        t.description.toLowerCase().includes(search.toLowerCase()) ||
        t.category.toLowerCase().includes(search.toLowerCase())
      ),
    [transactions, search, filterType]
  );

  const dynamicMonthlyData = useMemo(() => {
    const grouped = transactions.reduce((acc, t) => {
      const date = new Date(t.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleString('default', { month: 'short' }); 

      if (!acc[key]) acc[key] = { month: monthLabel, income: 0, expenses: 0, profit: 0, timestamp: date.getTime() };
      
      if (t.type === "income") acc[key].income += Number(t.amount);
      if (t.type === "expense") acc[key].expenses += Number(t.amount);
      acc[key].profit = acc[key].income - acc[key].expenses;
      
      return acc;
    }, {} as Record<string, any>);

    return Object.values(grouped).sort((a, b) => a.timestamp - b.timestamp);
  }, [transactions]);

  const dynamicExpenseBreakdown = useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'expense');
    const grouped = expenses.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
      return acc;
    }, {} as Record<string, number>);

    const colors = ['#E41E6A', '#8884d8', '#82ca9d', '#ffc658', '#a4de6c'];
    return Object.entries(grouped)
      .map(([name, value], i) => ({ name, value, color: colors[i % colors.length] }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  return (
    <div className="space-y-6 w-full">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-white text-3xl font-bold mb-1">Finance & Accounting</h1>
          <p className="text-white/60 text-sm">Track income, expenses, and financial performance</p>
        </div>
        <Button
          className="self-start sm:self-auto bg-gradient-to-r from-[#E41E6A] to-pink-600 hover:from-[#c41559] text-white flex items-center gap-2"
          onClick={() => setAddOpen(true)}
        >
          <Plus className="w-4 h-4" />Add Transaction
        </Button>
      </div>

      {/* ── Static KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: "Total Income",   value: formatK(stats.totalIncome),  change: "Actual Total",  up: true,  icon: <TrendingUp   className="w-5 h-5" />, iconBg: "bg-green-500/10",   iconColor: "text-green-400"   },
          { label: "Total Expenses", value: formatK(stats.totalExpense), change: "Actual Total",  up: false, icon: <TrendingDown className="w-5 h-5" />, iconBg: "bg-red-500/10",     iconColor: "text-red-400"     },
          { label: "Net Profit",     value: formatK(stats.netProfit),    change: "Actual Total",  up: stats.netProfit >= 0,  icon: <Wallet       className="w-5 h-5" />, iconBg: "bg-[#E41E6A]/10",   iconColor: "text-[#E41E6A]"   },
          { label: "Profit Margin",  value: `${profitMargin}%`,          change: "Overall", up: Number(profitMargin) > 0,  icon: <DollarSign   className="w-5 h-5" />, iconBg: "bg-violet-500/10",  iconColor: "text-violet-400"  },
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
              <div className="text-white text-2xl font-bold">{s.value}</div>
              <p className={`text-xs flex items-center gap-1 mt-1 ${s.up ? "text-green-400" : "text-red-400"}`}>
                {s.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {s.change} from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Line chart */}
        <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-base">Income vs Expenses Trend</CardTitle>
            <p className="text-white/50 text-xs">6-month overview</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={dynamicMonthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 11 }} />
                <YAxis stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 11 }} tickFormatter={v => `₱${v/1000}K`} />
                <Tooltip {...ChartTooltip} formatter={(v) => [`₱${(v as number)?.toLocaleString() ?? 0}`, ""]} />
                <Legend wrapperStyle={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }} />
                <Line type="monotone" dataKey="income"   stroke="#E41E6A" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="expenses" stroke="#8884d8" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="profit"   stroke="#82ca9d" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pie chart */}
        <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-base">Expense Breakdown</CardTitle>
            <p className="text-white/50 text-xs">By category</p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="55%" height={220}>
                <PieChart>
                  <Pie data={dynamicExpenseBreakdown} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" paddingAngle={3}>
                    {dynamicExpenseBreakdown.map((entry, i) => (
                      <Cell key={i} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip {...ChartTooltip} formatter={(v) => [`₱${(v as number)?.toLocaleString() ?? 0}`, ""]} />
                </PieChart>
              </ResponsiveContainer>
              {/* Custom legend */}
              <div className="flex-1 space-y-2">
                {dynamicExpenseBreakdown.map(e => (
                  <div key={e.name} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: e.color }} />
                      <span className="text-white/70 text-xs">{e.name}</span>
                    </div>
                    <span className="text-white/50 text-xs">₱{(e.value/1000).toFixed(0)}K</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Bar chart ── */}
      <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-base">Monthly Revenue vs Profit</CardTitle>
          <p className="text-white/50 text-xs">Bar comparison over 6 months</p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dynamicMonthlyData} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
              <XAxis dataKey="month" stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 11 }} />
              <YAxis stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 11 }} tickFormatter={v => `₱${v/1000}K`} />
              <Tooltip {...ChartTooltip} formatter={(v) => [`₱${(v as number)?.toLocaleString() ?? 0}`, ""]} />
              <Legend wrapperStyle={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }} />
              <Bar dataKey="income" fill="#E41E6A" radius={[4, 4, 0, 0]} />
              <Bar dataKey="profit" fill="#82ca9d" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* ── Dynamic Actual Stats ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/30 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm flex items-center gap-2">
              <Wallet className="w-4 h-4 text-green-400" />Total Revenue (Actual)
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="text-white text-2xl font-bold">{isLoading ? "..." : formatFull(stats.totalIncome)}</div>
            <p className="text-green-400/70 text-xs mt-1">From all recorded transactions</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/30 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-red-400" />Total Expenses (Actual)
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="text-white text-2xl font-bold">{isLoading ? "..." : formatFull(stats.totalExpense)}</div>
            <p className="text-red-400/70 text-xs mt-1">From all recorded transactions</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#E41E6A]/10 to-pink-500/5 border-[#E41E6A]/30 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-[#E41E6A]" />Net Profit (Actual)
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className={`text-2xl font-bold ${stats.netProfit >= 0 ? "text-white" : "text-red-400"}`}>
              {isLoading ? "..." : formatFull(stats.netProfit)}
            </div>
            <p className="text-white/40 text-xs mt-1">Margin: {isLoading ? "..." : `${profitMargin}%`}</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Transactions List ── */}
      <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur overflow-hidden">
        <CardHeader className="border-b border-white/10 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-[#E41E6A]" />Recent Transactions
              </CardTitle>
              <p className="text-white/40 text-xs mt-0.5">{filtered.length} record{filtered.length !== 1 ? "s" : ""}</p>
            </div>
            {/* Search + filter inline */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-8 pr-3 py-2 text-xs bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-[#E41E6A] w-36 transition-colors"
                />
              </div>
              {(["all", "income", "expense"] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilterType(f)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border capitalize transition-colors ${
                    filterType === f
                      ? "bg-[#E41E6A] text-white border-[#E41E6A]"
                      : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white"
                  }`}
                >{f}</button>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-white/50 text-center py-12">Loading transactions...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="w-10 h-10 mx-auto mb-3 text-white/20" />
              <p className="text-white/40 text-sm">No transactions found</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {filtered.map(t => (
                <div key={t.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/5 transition-colors">
                  {/* Icon */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    t.type === "income" ? "bg-green-500/15 border border-green-500/20" : "bg-red-500/15 border border-red-500/20"
                  }`}>
                    {t.type === "income"
                      ? <TrendingUp   className="w-4 h-4 text-green-400" />
                      : <TrendingDown className="w-4 h-4 text-red-400"   />
                    }
                  </div>

                  {/* Description */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{t.description}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className="border-white/15 text-white/50 text-xs px-1.5 py-0">
                        {t.category}
                      </Badge>
                      <span className="text-white/40 text-xs">{formatDate(t.date)}</span>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className={`text-sm font-bold flex-shrink-0 ${t.type === "income" ? "text-green-400" : "text-red-400"}`}>
                    {t.type === "income" ? "+" : "−"}₱{Math.abs(t.amount).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Modal ── */}
      {addOpen && <AddTransactionModal onClose={() => setAddOpen(false)} onSave={handleAdd} />}
    </div>
  );
}