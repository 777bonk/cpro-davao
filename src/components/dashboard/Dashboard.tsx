// src/components/dashboard/Dashboard.tsx

import { useState, useEffect } from "react";
import {
  Users, Calendar, DollarSign, TrendingUp, TrendingDown,
  AlertCircle, Package, CreditCard, Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../dashboard-ui/card";
import { Badge } from "../dashboard-ui/badge";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";

import { getCustomers }    from "../../services/customer";
import { getAppointments } from "../../services/appointments";
import { getInventory }    from "../../services/inventory";
import { getTransactions } from "../../services/finance";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type MonthlyChartBucket = {
  month:    string;
  monthKey: string;
  income:   number;
  expenses: number;
};

type Stats = {
  totalCustomers:  number;
  customerGrowth:  number;
  todaysAppts:     number;
  completedAppts:  number;
  todaysIncome:    number;
  incomeGrowth:    number;
  monthlyRevenue:  number;
  revenueGrowth:   number;
};

const EMPTY_STATS: Stats = {
  totalCustomers: 0, customerGrowth: 0,
  todaysAppts:    0, completedAppts: 0,
  todaysIncome:   0, incomeGrowth:   0,
  monthlyRevenue: 0, revenueGrowth:  0,
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

// Normalise "Income" | "income" | "INCOME" → "income"
const isIncome  = (type: string) => type?.toLowerCase() === "income";
const isExpense = (type: string) => type?.toLowerCase() === "expense";

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export function Dashboard() {
  const [stats,           setStats]           = useState<Stats>(EMPTY_STATS);
  const [chartData,       setChartData]       = useState<MonthlyChartBucket[]>([]);
  const [revenueData,     setRevenueData]     = useState<{ service: string; revenue: number }[]>([]);
  const [lowStockItems,   setLowStockItems]   = useState<any[]>([]);
  const [upcomingAppts,   setUpcomingAppts]   = useState<any[]>([]);
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);
  const [isLoading,       setIsLoading]       = useState(true);
  const [error,           setError]           = useState<string | null>(null);

  // ── Single, correct fetchDashboardData ──────────────────────────────────
  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch everything in parallel; individual failures return [] gracefully
        const [customers, appts, inventory, transactions] = await Promise.all([
          getCustomers()   .catch(() => []),
          getAppointments().catch(() => []),
          getInventory()   .catch(() => []),
          getTransactions().catch(() => []),
        ]);

        // ── Time anchors ──────────────────────────────────────────────────
        const now          = new Date();
        const todayStr     = now.toDateString();
        const currentMonth = now.getMonth();
        const currentYear  = now.getFullYear();

        const yesterday    = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toDateString();

        const lastMonthDate = new Date(now);
        lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
        const lastMonth     = lastMonthDate.getMonth();
        const lastMonthYear = lastMonthDate.getFullYear();

        // ── 1. Customers ──────────────────────────────────────────────────
        const totalCustomers = customers.length;
        const customersLastMonth = customers.filter(
          (c: any) => new Date(c.created_at ?? now) < new Date(currentYear, currentMonth, 1)
        ).length;
        const customerGrowth =
          customersLastMonth === 0
            ? (totalCustomers > 0 ? 100 : 0)
            : Math.round(((totalCustomers - customersLastMonth) / customersLastMonth) * 100);

        // ── 2. Appointments ───────────────────────────────────────────────
        // Support both `date` and `scheduled_date` field names
        const getApptDate = (a: any): Date =>
          new Date(a.scheduled_date ?? a.date ?? now);

        let todaysApptsCount    = 0;
        let completedApptsCount = 0;

        appts.forEach((a: any) => {
          const aDate = getApptDate(a);
          if (aDate.toDateString() === todayStr) {
            todaysApptsCount++;
            if (a.status?.toLowerCase() === "completed") completedApptsCount++;
          }
        });

        // ── 3. Income / revenue ───────────────────────────────────────────
        let todaysIncome    = 0;
        let yesterdaysIncome = 0;
        let monthlyIncome   = 0;
        let lastMonthIncome = 0;

        transactions.forEach((t: any) => {
          if (!isIncome(t.type)) return;
          const tDate = new Date(t.date ?? t.created_at ?? now);
          const amt   = Number(t.amount) || 0;

          if (tDate.toDateString() === todayStr)     todaysIncome    += amt;
          if (tDate.toDateString() === yesterdayStr) yesterdaysIncome += amt;
          if (tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear)
            monthlyIncome += amt;
          if (tDate.getMonth() === lastMonth && tDate.getFullYear() === lastMonthYear)
            lastMonthIncome += amt;
        });

        const incomeGrowth =
          yesterdaysIncome === 0
            ? (todaysIncome > 0 ? 100 : 0)
            : Math.round(((todaysIncome - yesterdaysIncome) / yesterdaysIncome) * 100);

        const revenueGrowth =
          lastMonthIncome === 0
            ? (monthlyIncome > 0 ? 100 : 0)
            : Math.round(((monthlyIncome - lastMonthIncome) / lastMonthIncome) * 100);

        setStats({
          totalCustomers,
          customerGrowth,
          todaysAppts:    todaysApptsCount,
          completedAppts: completedApptsCount,
          todaysIncome,
          incomeGrowth,
          monthlyRevenue: monthlyIncome,
          revenueGrowth,
        });

        // ── 4. Low-stock inventory ────────────────────────────────────────
        // Support both `stock`/`quantity` and `reorderLevel`/`reorder_level`
        setLowStockItems(
          inventory
            .filter((i: any) => {
              const qty   = i.quantity ?? i.stock ?? 0;
              const level = i.reorder_level ?? i.reorderLevel ?? 5;
              return qty <= level;
            })
            .slice(0, 4)
        );

        // ── 5. Upcoming appointments ──────────────────────────────────────
        setUpcomingAppts(
          appts
            .filter((a: any) => {
              const d = getApptDate(a);
              return d >= now && a.status?.toLowerCase() !== "completed";
            })
            .sort((a: any, b: any) =>
              getApptDate(a).getTime() - getApptDate(b).getTime()
            )
            .slice(0, 4)
        );

        // ── 6. Active / pending jobs ──────────────────────────────────────
        setPendingPayments(
          appts
            .filter((a: any) => {
              const s = a.status?.toLowerCase() ?? "";
              return s === "scheduled" || s === "in progress" || s === "in_progress" || s === "pending";
            })
            .slice(0, 4)
        );

        // ── 7. Chart data — last 6 months ─────────────────────────────────
        const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
        const last6: MonthlyChartBucket[] = Array.from({ length: 6 }, (_, i) => {
          const d = new Date();
          d.setMonth(d.getMonth() - (5 - i));
          return {
            month:    MONTH_NAMES[d.getMonth()],
            monthKey: `${d.getFullYear()}-${d.getMonth()}`,
            income:   0,
            expenses: 0,
          };
        });

        const categoryRevenue: Record<string, number> = {};

        transactions.forEach((t: any) => {
          if (!t.date && !t.created_at) return;
          const tDate    = new Date(t.date ?? t.created_at);
          const monthKey = `${tDate.getFullYear()}-${tDate.getMonth()}`;
          const bucket   = last6.find(m => m.monthKey === monthKey);
          const amt      = Number(t.amount) || 0;

          if (bucket) {
            if (isIncome(t.type))  bucket.income   += amt;
            if (isExpense(t.type)) bucket.expenses += amt;
          }

          if (isIncome(t.type)) {
            const raw = (t.description || "Other").split(" - ")[0] || "Other";
            let cat = "Other";
            const lower = raw.toLowerCase();
            if (lower.includes("coat"))   cat = "Coating";
            else if (lower.includes("ppf"))    cat = "PPF";
            else if (lower.includes("detail")) cat = "Detailing";
            else if (lower.includes("tint"))   cat = "Tinting";
            else cat = raw;
            categoryRevenue[cat] = (categoryRevenue[cat] || 0) + amt;
          }
        });

        setChartData(last6);

        const revData = Object.entries(categoryRevenue)
          .map(([service, revenue]) => ({ service, revenue }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5);

        setRevenueData(
          revData.length > 0
            ? revData
            : [
                { service: "Coating",   revenue: 0 },
                { service: "PPF",       revenue: 0 },
                { service: "Detailing", revenue: 0 },
                { service: "Tinting",   revenue: 0 },
              ]
        );

      } catch (err: any) {
        console.error("Dashboard fetch error:", err);
        setError("Failed to load dashboard data. Please refresh.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []); // ← runs once on mount, which is correct for a dashboard

  // ── RENDER ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-white text-3xl mb-2">Dashboard Overview</h1>
        <p className="text-white/60">Welcome back! Here's what's happening in your shop today.</p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Total Customers */}
        <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-white/70">Total Customers</CardTitle>
            <Users className="w-4 h-4 text-[#E41E6A]" />
          </CardHeader>
          <CardContent className="pb-5">
            <div className="text-white text-2xl font-bold">
              {isLoading ? "..." : stats.totalCustomers}
            </div>
            <p className={`text-xs flex items-center gap-1 mt-1 ${stats.customerGrowth >= 0 ? "text-green-400" : "text-red-400"}`}>
              {stats.customerGrowth >= 0
                ? <TrendingUp className="w-3 h-3" />
                : <TrendingDown className="w-3 h-3" />}
              {stats.customerGrowth >= 0 ? "+" : ""}{stats.customerGrowth}% from last month
            </p>
          </CardContent>
        </Card>

        {/* Today's Appointments */}
        <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-white/70">Today's Appointments</CardTitle>
            <Calendar className="w-4 h-4 text-[#E41E6A]" />
          </CardHeader>
          <CardContent className="pb-5">
            <div className="text-white text-2xl font-bold">
              {isLoading ? "..." : stats.todaysAppts}
            </div>
            <p className="text-xs text-white/50 flex items-center gap-1 mt-1">
              <Clock className="w-3 h-3 text-blue-400" />
              {stats.completedAppts} completed today
            </p>
          </CardContent>
        </Card>

        {/* Today's Income */}
        <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-white/70">Today's Income</CardTitle>
            <DollarSign className="w-4 h-4 text-[#E41E6A]" />
          </CardHeader>
          <CardContent className="pb-5">
            <div className="text-white text-2xl font-bold">
              {isLoading ? "..." : `₱${stats.todaysIncome.toLocaleString()}`}
            </div>
            <p className={`text-xs flex items-center gap-1 mt-1 ${stats.incomeGrowth >= 0 ? "text-green-400" : "text-red-400"}`}>
              {stats.incomeGrowth >= 0
                ? <TrendingUp className="w-3 h-3" />
                : <TrendingDown className="w-3 h-3" />}
              {stats.incomeGrowth >= 0 ? "+" : ""}{stats.incomeGrowth}% from yesterday
            </p>
          </CardContent>
        </Card>

        {/* Monthly Revenue */}
        <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-white/70">Monthly Revenue</CardTitle>
            <TrendingUp className="w-4 h-4 text-[#E41E6A]" />
          </CardHeader>
          <CardContent className="pb-5">
            <div className="text-white text-2xl font-bold">
              {isLoading ? "..." : `₱${stats.monthlyRevenue.toLocaleString()}`}
            </div>
            <p className={`text-xs flex items-center gap-1 mt-1 ${stats.revenueGrowth >= 0 ? "text-green-400" : "text-red-400"}`}>
              {stats.revenueGrowth >= 0
                ? <TrendingUp className="w-3 h-3" />
                : <TrendingDown className="w-3 h-3" />}
              {stats.revenueGrowth >= 0 ? "+" : ""}{stats.revenueGrowth}% from last month
            </p>
          </CardContent>
        </Card>

      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur rounded-xl">
          <CardHeader>
            <CardTitle className="text-white">Monthly Income vs Expenses</CardTitle>
          </CardHeader>
          <CardContent className="pb-5">
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#E41E6A" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#E41E6A" stopOpacity={0}   />
                  </linearGradient>
                  <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#8884d8" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="month"   stroke="rgba(255,255,255,0.5)" />
                <YAxis                   stroke="rgba(255,255,255,0.5)" />
                <Tooltip contentStyle={{ backgroundColor: "rgba(0,0,0,0.9)", border: "1px solid rgba(228,30,106,0.3)", borderRadius: "8px" }} />
                <Legend />
                <Area type="monotone" dataKey="income"   stroke="#E41E6A" fillOpacity={1} fill="url(#colorIncome)"   />
                <Area type="monotone" dataKey="expenses" stroke="#8884d8" fillOpacity={1} fill="url(#colorExpenses)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur rounded-xl">
          <CardHeader>
            <CardTitle className="text-white">Service Revenue Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="pb-5">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="service" stroke="rgba(255,255,255,0.5)" />
                <YAxis                   stroke="rgba(255,255,255,0.5)" />
                <Tooltip contentStyle={{ backgroundColor: "rgba(0,0,0,0.9)", border: "1px solid rgba(228,30,106,0.3)", borderRadius: "8px" }} />
                <Bar dataKey="revenue" fill="#E41E6A" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

      </div>

      {/* Live feed — 3 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Upcoming Jobs */}
        <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur rounded-xl">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#E41E6A]" />
              Upcoming Jobs
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-5">
            <div className="space-y-3">
              {isLoading ? (
                // Skeleton
                [1, 2, 3].map(i => (
                  <div key={i} className="h-16 bg-white/5 rounded-lg animate-pulse" />
                ))
              ) : upcomingAppts.length === 0 ? (
                <p className="text-white/50 text-sm">No upcoming appointments scheduled.</p>
              ) : (
                upcomingAppts.map((apt: any) => {
                  // Normalise the date field — support both shapes
                  const d = new Date(apt.scheduled_date ?? apt.date);
                  return (
                    <div key={apt.id} className="p-3 bg-white/5 rounded-lg border border-white/10 hover:border-[#E41E6A]/50 transition-colors">
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-white text-sm font-medium">{apt.customers?.name ?? apt.customer_name ?? "Unknown"}</p>
                        <Badge className="bg-[#E41E6A]/20 text-[#E41E6A] border-[#E41E6A]/30">
                          {d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </Badge>
                      </div>
                      <p className="text-white/60 text-xs">{d.toLocaleDateString()}</p>
                      <p className="text-white/50 text-xs mt-1">{apt.service_type ?? apt.service}</p>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur rounded-xl">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-orange-400" />
              Low Stock Alert
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-5">
            <div className="space-y-3">
              {isLoading ? (
                [1, 2, 3].map(i => (
                  <div key={i} className="h-14 bg-white/5 rounded-lg animate-pulse" />
                ))
              ) : lowStockItems.length === 0 ? (
                <p className="text-green-400/70 text-sm">Inventory levels are healthy.</p>
              ) : (
                lowStockItems.map((item: any) => (
                  <div key={item.id} className="p-3 bg-white/5 rounded-lg border border-orange-500/20 hover:border-orange-500/50 transition-colors">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-white text-sm font-medium truncate pr-2">{item.name}</p>
                      <AlertCircle className="w-4 h-4 text-orange-400 flex-shrink-0" />
                    </div>
                    <p className="text-orange-400 text-xs">
                      Only {item.quantity ?? item.stock ?? 0} left in stock
                    </p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Active & Pending Jobs */}
        <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur rounded-xl">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-yellow-400" />
              Active &amp; Pending Jobs
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-5">
            <div className="space-y-3">
              {isLoading ? (
                [1, 2, 3].map(i => (
                  <div key={i} className="h-16 bg-white/5 rounded-lg animate-pulse" />
                ))
              ) : pendingPayments.length === 0 ? (
                <p className="text-white/50 text-sm">No active or pending jobs.</p>
              ) : (
                pendingPayments.map((job: any) => {
                  const isActive = ["in progress", "in_progress"].includes(
                    job.status?.toLowerCase() ?? ""
                  );
                  return (
                    <div key={job.id} className="p-3 bg-white/5 rounded-lg border border-yellow-500/20 hover:border-yellow-500/50 transition-colors">
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-white text-sm font-medium">
                          {job.customers?.name ?? job.customer_name ?? "Unknown"}
                        </p>
                        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                          {isActive ? "Active" : "Pending"}
                        </Badge>
                      </div>
                      <p className="text-white/60 text-xs mb-1">{job.service_type ?? job.service}</p>
                      <p className="text-yellow-400 text-sm font-semibold">
                        ₱{Number(job.total_cost ?? job.amount ?? 0).toLocaleString()}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
