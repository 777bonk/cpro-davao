import { useState, useEffect } from "react";
import { Users, Calendar, DollarSign, TrendingUp, TrendingDown, AlertCircle, Package, CreditCard, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../dashboard-ui/card";
import { Badge } from "../dashboard-ui/badge";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

// Import all our live services!
import { getCustomers } from "../../services/customer";
import { getAppointments } from "../../services/appointments";
import { getInventory } from "../../services/inventory";
import { getTransactions } from "../../services/finance";

type MonthlyChartBucket = {
  month: string;
  monthKey: string;
  income: number;
  expenses: number;
};

export function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);

  // --- LIVE STATE ---
  const [stats, setStats] = useState({
    totalCustomers: 0,
    customerGrowth: 0,
    todaysAppts: 0,
    completedAppts: 0,
    todaysIncome: 0,
    incomeGrowth: 0,
    monthlyRevenue: 0,
    revenueGrowth: 0,
  });

  const [chartData, setChartData] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [upcomingAppts, setUpcomingAppts] = useState<any[]>([]);
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [customers, appts, inventory, transactions] = await Promise.all([
        getCustomers().catch(() => []),
        getAppointments().catch(() => []),
        getInventory().catch(() => []),
        getTransactions().catch(() => [])
      ]);

      // --- DYNAMIC TIME CALCULATION ---
      const now = new Date();
      const todayStr = now.toDateString();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      // Get Yesterday
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toDateString();

      // Get Last Month
      const lastMonthDate = new Date(now);
      lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
      const lastMonth = lastMonthDate.getMonth();
      const lastMonthYear = lastMonthDate.getFullYear();

      // 1. Calculate Customers & Growth
      const totalCustomers = customers.length;
      // Find customers created before the 1st of the current month
      const customersLastMonth = customers.filter((c: any) => new Date(c.created_at || now) < new Date(currentYear, currentMonth, 1)).length;
      const customerGrowth = customersLastMonth === 0 
        ? (totalCustomers > 0 ? 100 : 0) 
        : Math.round(((totalCustomers - customersLastMonth) / customersLastMonth) * 100);

      // 2. Calculate Appointments
      let todaysApptsCount = 0;
      let completedApptsCount = 0;

      appts.forEach(a => {
        if (!a.date || !a.status) return;
        const aDate = new Date(a.date);
        if (aDate.toDateString() === todayStr) {
          todaysApptsCount++;
          if (a.status === 'Completed') completedApptsCount++;
        }
      });

      // 3. Calculate Income & Growth
      let todaysIncome = 0;
      let yesterdaysIncome = 0;
      let monthlyIncome = 0;
      let lastMonthIncome = 0;

      transactions.forEach(t => {
        if (t.type !== 'income') return;
        
        const tDate = new Date(t.date);
        const amt = Number(t.amount);

        // Daily Checks
        if (tDate.toDateString() === todayStr) todaysIncome += amt;
        else if (tDate.toDateString() === yesterdayStr) yesterdaysIncome += amt;

        // Monthly Checks
        if (tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear) {
          monthlyIncome += amt;
        } else if (tDate.getMonth() === lastMonth && tDate.getFullYear() === lastMonthYear) {
          lastMonthIncome += amt;
        }
      });

      // Calculate Percentages
      const incomeGrowth = yesterdaysIncome === 0 
        ? (todaysIncome > 0 ? 100 : 0) 
        : Math.round(((todaysIncome - yesterdaysIncome) / yesterdaysIncome) * 100);

      const revenueGrowth = lastMonthIncome === 0 
        ? (monthlyIncome > 0 ? 100 : 0) 
        : Math.round(((monthlyIncome - lastMonthIncome) / lastMonthIncome) * 100);

      setStats({
        totalCustomers,
        customerGrowth,
        todaysAppts: todaysApptsCount,
        completedAppts: completedApptsCount,
        todaysIncome,
        incomeGrowth,
        monthlyRevenue: monthlyIncome,
        revenueGrowth
      });

      // 4. Identify Low Stock Inventory
      const lowStock = inventory
        .filter(i => i.stock <= i.reorderLevel)
        .slice(0, 4);
      setLowStockItems(lowStock);

      // 5. Upcoming Appointments
      const upcoming = appts
        .filter(a => a.date && a.status && new Date(a.date) >= now && a.status !== 'Completed')
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 4);
      setUpcomingAppts(upcoming);

      // 6. Pending / In-Progress Jobs
      const pending = appts
        .filter(a => a.status && (a.status === 'Scheduled' || a.status === 'In Progress'))
        .slice(0, 4);
      setPendingPayments(pending);

      // 7. Generate Chart Data
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const last6Months: MonthlyChartBucket[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        last6Months.push({
          month: monthNames[d.getMonth()],
          monthKey: `${d.getFullYear()}-${d.getMonth()}`,
          income: 0,
          expenses: 0
        });
      }

      const categoryRevenue: Record<string, number> = {};

      transactions.forEach(t => {
        if (!t.date || !t.amount) return;
        const tDate = new Date(t.date);
        const monthKey = `${tDate.getFullYear()}-${tDate.getMonth()}`;
        const bucket = last6Months.find(m => m.monthKey === monthKey);
        const amt = Number(t.amount);

        if (bucket) {
          if (t.type === 'income') bucket.income += amt;
          if (t.type === 'expense') bucket.expenses += amt;
        }

        if (t.type === 'income') {
          const serviceName = (t.description || 'Other').split(' - ')[0] || 'Other';
          let simplifiedCat = "Other";
          
          if (serviceName.toLowerCase().includes('coat')) simplifiedCat = "Coating";
          else if (serviceName.toLowerCase().includes('ppf')) simplifiedCat = "PPF";
          else if (serviceName.toLowerCase().includes('detail')) simplifiedCat = "Detailing";
          else if (serviceName.toLowerCase().includes('tint')) simplifiedCat = "Tinting";
          else simplifiedCat = serviceName;

          categoryRevenue[simplifiedCat] = (categoryRevenue[simplifiedCat] || 0) + amt;
        }
      });

      setChartData(last6Months);

      const revData = Object.keys(categoryRevenue)
        .map(k => ({ service: k, revenue: categoryRevenue[k] }))
        .sort((a,b) => b.revenue - a.revenue)
        .slice(0, 5);
      
      setRevenueData(revData.length > 0 ? revData : [
        { service: "Coating", revenue: 0 },
        { service: "PPF", revenue: 0 },
        { service: "Detailing", revenue: 0 },
        { service: "Tinting", revenue: 0 },
      ]);

    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-white text-3xl mb-2">Dashboard Overview</h1>
        <p className="text-white/60">Welcome back! Here's what's happening in your shop today.</p>
      </div>

      {/* Live Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Customers */}
        <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-white/70">Total Customers</CardTitle>
            <Users className="w-4 h-4 text-[#E41E6A]" />
          </CardHeader>
          <CardContent>
            <div className="text-white text-2xl">{isLoading ? '...' : stats.totalCustomers}</div>
            <p className={`text-xs flex items-center gap-1 mt-1 ${stats.customerGrowth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {stats.customerGrowth >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {stats.customerGrowth >= 0 ? '+' : ''}{stats.customerGrowth}% from last month
            </p>
          </CardContent>
        </Card>

        {/* Appointments */}
        <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-white/70">Today's Appointments</CardTitle>
            <Calendar className="w-4 h-4 text-[#E41E6A]" />
          </CardHeader>
          <CardContent>
            <div className="text-white text-2xl">{isLoading ? '...' : stats.todaysAppts}</div>
            <p className="text-xs text-white/50 flex items-center gap-1 mt-1">
              <Clock className="w-3 h-3 text-blue-400" />
              {stats.completedAppts} completed today
            </p>
          </CardContent>
        </Card>

        {/* Daily Income */}
        <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-white/70">Today's Income</CardTitle>
            <DollarSign className="w-4 h-4 text-[#E41E6A]" />
          </CardHeader>
          <CardContent>
            <div className="text-white text-2xl">₱{isLoading ? '...' : stats.todaysIncome.toLocaleString()}</div>
            <p className={`text-xs flex items-center gap-1 mt-1 ${stats.incomeGrowth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {stats.incomeGrowth >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {stats.incomeGrowth >= 0 ? '+' : ''}{stats.incomeGrowth}% from yesterday
            </p>
          </CardContent>
        </Card>

        {/* Monthly Revenue */}
        <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-white/70">Monthly Revenue</CardTitle>
            <TrendingUp className="w-4 h-4 text-[#E41E6A]" />
          </CardHeader>
          <CardContent>
            <div className="text-white text-2xl">₱{isLoading ? '...' : stats.monthlyRevenue.toLocaleString()}</div>
            <p className={`text-xs flex items-center gap-1 mt-1 ${stats.revenueGrowth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {stats.revenueGrowth >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {stats.revenueGrowth >= 0 ? '+' : ''}{stats.revenueGrowth}% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Live Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white">Monthly Income vs Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E41E6A" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#E41E6A" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.5)" />
                <YAxis stroke="rgba(255,255,255,0.5)" />
                <Tooltip contentStyle={{ backgroundColor: "rgba(0,0,0,0.9)", border: "1px solid rgba(228,30,106,0.3)", borderRadius: "8px" }} />
                <Legend />
                <Area type="monotone" dataKey="income" stroke="#E41E6A" fillOpacity={1} fill="url(#colorIncome)" />
                <Area type="monotone" dataKey="expenses" stroke="#8884d8" fillOpacity={1} fill="url(#colorExpenses)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white">Service Revenue Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="service" stroke="rgba(255,255,255,0.5)" />
                <YAxis stroke="rgba(255,255,255,0.5)" />
                <Tooltip contentStyle={{ backgroundColor: "rgba(0,0,0,0.9)", border: "1px solid rgba(228,30,106,0.3)", borderRadius: "8px" }} />
                <Bar dataKey="revenue" fill="#E41E6A" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Live Notifications Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Upcoming Appointments */}
        <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#E41E6A]" />
              Upcoming Jobs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingAppts.length === 0 ? (
                <p className="text-white/50 text-sm">No upcoming appointments scheduled.</p>
              ) : (
                upcomingAppts.map((apt) => (
                  <div key={apt.id} className="p-3 bg-white/5 rounded-lg border border-white/10 hover:border-[#E41E6A]/50 transition-colors">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-white text-sm font-medium">{apt.customers?.name || "Unknown"}</p>
                      <Badge className="bg-[#E41E6A]/20 text-[#E41E6A] border-[#E41E6A]/30">
                        {new Date(apt.scheduled_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </Badge>
                    </div>
                    <p className="text-white/60 text-xs">{new Date(apt.scheduled_date).toLocaleDateString()}</p>
                    <p className="text-white/50 text-xs mt-1">{apt.service_type}</p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Items */}
        <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-orange-400" />
              Low Stock Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lowStockItems.length === 0 ? (
                <p className="text-green-400/70 text-sm">Inventory levels are healthy.</p>
              ) : (
                lowStockItems.map((item) => (
                  <div key={item.id} className="p-3 bg-white/5 rounded-lg border border-orange-500/20 hover:border-orange-500/50 transition-colors">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-white text-sm font-medium truncate pr-2">{item.name}</p>
                      <AlertCircle className="w-4 h-4 text-orange-400 flex-shrink-0" />
                    </div>
                    <p className="text-orange-400 text-xs">
                      Only {item.quantity} left in stock
                    </p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Active/Pending Jobs */}
        <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-yellow-400" />
              Active & Pending Jobs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingPayments.length === 0 ? (
                <p className="text-white/50 text-sm">No active or pending jobs.</p>
              ) : (
                pendingPayments.map((job) => (
                  <div key={job.id} className="p-3 bg-white/5 rounded-lg border border-yellow-500/20 hover:border-yellow-500/50 transition-colors">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-white text-sm font-medium">{job.customers?.name || "Unknown"}</p>
                      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                        {job.status === 'in_progress' ? 'Active' : 'Pending'}
                      </Badge>
                    </div>
                    <p className="text-white/60 text-xs mb-1">{job.service_type}</p>
                    <p className="text-yellow-400 text-sm">₱{Number(job.total_cost || 0).toLocaleString()}</p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

