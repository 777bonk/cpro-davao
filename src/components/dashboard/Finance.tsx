import { DollarSign, TrendingUp, TrendingDown, Wallet, CreditCard, Receipt } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../dashboard-ui/card";
import { Badge } from "../dashboard-ui/badge";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const monthlyData = [
  { month: "Jan", income: 567000, expenses: 245000, profit: 322000 },
  { month: "Feb", income: 623000, expenses: 268000, profit: 355000 },
  { month: "Mar", income: 589000, expenses: 251000, profit: 338000 },
  { month: "Apr", income: 712000, expenses: 289000, profit: 423000 },
  { month: "May", income: 654000, expenses: 276000, profit: 378000 },
  { month: "Jun", income: 798000, expenses: 312000, profit: 486000 },
];

const expenseBreakdown = [
  { name: "Salaries", value: 685000, color: "#E41E6A" },
  { name: "Supplies", value: 156000, color: "#8884d8" },
  { name: "Utilities", value: 45000, color: "#82ca9d" },
  { name: "Marketing", value: 78000, color: "#ffc658" },
  { name: "Others", value: 48000, color: "#a4de6c" },
];

const recentTransactions = [
  { id: 1, type: "income", description: "Ceramic Coating - John Doe", amount: 35000, date: "2024-10-23", category: "Service" },
  { id: 2, type: "expense", description: "Employee Salaries", amount: -685000, date: "2024-10-22", category: "Payroll" },
  { id: 3, type: "income", description: "PPF Installation - Sarah Wilson", amount: 45000, date: "2024-10-22", category: "Service" },
  { id: 4, type: "expense", description: "Inventory Purchase", amount: -125000, date: "2024-10-21", category: "Supplies" },
  { id: 5, type: "income", description: "Full Detailing - Mike Johnson", amount: 15000, date: "2024-10-21", category: "Service" },
];

export function Finance() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-white text-3xl mb-2">Finance & Accounting</h1>
          <p className="text-white/60">Track income, expenses, and financial performance</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white/70">Monthly Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-white text-2xl">₱798K</div>
            <p className="text-xs text-green-400 flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" />
              +22% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white/70">Monthly Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-white text-2xl">₱312K</div>
            <p className="text-xs text-red-400 flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" />
              +13% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white/70">Net Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-white text-2xl">₱486K</div>
            <p className="text-xs text-green-400 flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" />
              +29% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white/70">Profit Margin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-white text-2xl">60.9%</div>
            <p className="text-xs text-green-400 flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" />
              +4.2% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Income vs Expenses Trend */}
        <Card className="lg:col-span-2 bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white">Income vs Expenses Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
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
                <Line type="monotone" dataKey="income" stroke="#E41E6A" strokeWidth={2} />
                <Line type="monotone" dataKey="expenses" stroke="#8884d8" strokeWidth={2} />
                <Line type="monotone" dataKey="profit" stroke="#82ca9d" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Expense Breakdown */}
        <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white">Expense Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={expenseBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {expenseBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(0,0,0,0.9)",
                    border: "1px solid rgba(228,30,106,0.3)",
                    borderRadius: "8px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Receipt className="w-5 h-5 text-[#E41E6A]" />
            Recent Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="p-4 bg-white/5 rounded-lg border border-white/10 hover:border-[#E41E6A]/50 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        transaction.type === "income"
                          ? "bg-green-500/20 border border-green-500/30"
                          : "bg-red-500/20 border border-red-500/30"
                      }`}
                    >
                      {transaction.type === "income" ? (
                        <TrendingUp className="w-6 h-6 text-green-400" />
                      ) : (
                        <TrendingDown className="w-6 h-6 text-red-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-white">{transaction.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="border-white/20 text-white/60 text-xs">
                          {transaction.category}
                        </Badge>
                        <span className="text-white/50 text-xs">{transaction.date}</span>
                      </div>
                    </div>
                  </div>
                  <div
                    className={`text-xl ${
                      transaction.type === "income" ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {transaction.type === "income" ? "+" : ""}₱
                    {Math.abs(transaction.amount).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/30 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Wallet className="w-5 h-5 text-green-400" />
              Total Revenue (YTD)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-white text-3xl">₱3.94M</div>
            <p className="text-green-400 text-sm mt-2">+18.5% from last year</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/30 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-red-400" />
              Total Expenses (YTD)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-white text-3xl">₱1.64M</div>
            <p className="text-red-400 text-sm mt-2">+12.3% from last year</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#E41E6A]/10 to-pink-500/5 border-[#E41E6A]/30 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-[#E41E6A]" />
              Net Profit (YTD)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-white text-3xl">₱2.30M</div>
            <p className="text-green-400 text-sm mt-2">+24.7% from last year</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
