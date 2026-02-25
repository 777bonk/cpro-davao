import { 
  Users, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  AlertCircle, 
  Package, 
  CreditCard,
  Clock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../dashboard-ui/card";
import { Badge } from "../dashboard-ui/badge";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const incomeData = [
  { month: "Jan", income: 45000, expenses: 28000 },
  { month: "Feb", income: 52000, expenses: 31000 },
  { month: "Mar", income: 48000, expenses: 29000 },
  { month: "Apr", income: 61000, expenses: 33000 },
  { month: "May", income: 55000, expenses: 30000 },
  { month: "Jun", income: 67000, expenses: 35000 },
];

const upcomingAppointments = [
  { id: 1, customer: "John Doe", vehicle: "BMW M3", service: "Ceramic Coating", time: "10:00 AM" },
  { id: 2, customer: "Jane Smith", vehicle: "Mercedes C-Class", service: "PPF Installation", time: "2:00 PM" },
  { id: 3, customer: "Mike Johnson", vehicle: "Audi RS5", service: "Full Detailing", time: "4:30 PM" },
];

const lowStockItems = [
  { id: 1, item: "Ceramic Coating 9H", stock: 3, unit: "bottles" },
  { id: 2, item: "PPF Roll - Clear", stock: 1, unit: "roll" },
  { id: 3, item: "Microfiber Towels", stock: 12, unit: "pcs" },
];

const pendingPayments = [
  { id: 1, customer: "Robert Brown", amount: 15000, service: "Ceramic Coating", days: 3 },
  { id: 2, customer: "Sarah Wilson", amount: 25000, service: "PPF Full Body", days: 7 },
];

export function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-white text-3xl mb-2">Dashboard Overview</h1>
        <p className="text-white/60">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-white/70">Total Customers</CardTitle>
            <Users className="w-4 h-4 text-[#E41E6A]" />
          </CardHeader>
          <CardContent>
            <div className="text-white text-2xl">1,284</div>
            <p className="text-xs text-white/50 flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3 text-green-400" />
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-white/70">Today's Appointments</CardTitle>
            <Calendar className="w-4 h-4 text-[#E41E6A]" />
          </CardHeader>
          <CardContent>
            <div className="text-white text-2xl">8</div>
            <p className="text-xs text-white/50 flex items-center gap-1 mt-1">
              <Clock className="w-3 h-3 text-blue-400" />
              3 completed, 5 pending
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-white/70">Today's Income</CardTitle>
            <DollarSign className="w-4 h-4 text-[#E41E6A]" />
          </CardHeader>
          <CardContent>
            <div className="text-white text-2xl">₱45,200</div>
            <p className="text-xs text-white/50 flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3 text-green-400" />
              +8% from yesterday
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-white/70">Monthly Revenue</CardTitle>
            <TrendingUp className="w-4 h-4 text-[#E41E6A]" />
          </CardHeader>
          <CardContent>
            <div className="text-white text-2xl">₱567,800</div>
            <p className="text-xs text-white/50 flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3 text-green-400" />
              +15% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white">Monthly Income vs Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={incomeData}>
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
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(0,0,0,0.9)",
                    border: "1px solid rgba(228,30,106,0.3)",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="#E41E6A"
                  fillOpacity={1}
                  fill="url(#colorIncome)"
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  stroke="#8884d8"
                  fillOpacity={1}
                  fill="url(#colorExpenses)"
                />
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
              <BarChart
                data={[
                  { service: "Coating", revenue: 245000 },
                  { service: "PPF", revenue: 189000 },
                  { service: "Detailing", revenue: 98000 },
                  { service: "Tinting", revenue: 67000 },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="service" stroke="rgba(255,255,255,0.5)" />
                <YAxis stroke="rgba(255,255,255,0.5)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(0,0,0,0.9)",
                    border: "1px solid rgba(228,30,106,0.3)",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="revenue" fill="#E41E6A" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Upcoming Appointments */}
        <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#E41E6A]" />
              Upcoming Appointments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="p-3 bg-white/5 rounded-lg border border-white/10 hover:border-[#E41E6A]/50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-white text-sm">{apt.customer}</p>
                    <Badge className="bg-[#E41E6A]/20 text-[#E41E6A] border-[#E41E6A]/30">
                      {apt.time}
                    </Badge>
                  </div>
                  <p className="text-white/60 text-xs">{apt.vehicle}</p>
                  <p className="text-white/50 text-xs mt-1">{apt.service}</p>
                </div>
              ))}
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
              {lowStockItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-white/5 rounded-lg border border-orange-500/20 hover:border-orange-500/50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-white text-sm">{item.item}</p>
                    <AlertCircle className="w-4 h-4 text-orange-400" />
                  </div>
                  <p className="text-orange-400 text-xs">
                    Only {item.stock} {item.unit} left
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pending Payments */}
        <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-yellow-400" />
              Pending Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {pendingPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="p-3 bg-white/5 rounded-lg border border-yellow-500/20 hover:border-yellow-500/50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-white text-sm">{payment.customer}</p>
                    <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                      {payment.days}d
                    </Badge>
                  </div>
                  <p className="text-white/60 text-xs mb-1">{payment.service}</p>
                  <p className="text-yellow-400 text-sm">₱{payment.amount.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
