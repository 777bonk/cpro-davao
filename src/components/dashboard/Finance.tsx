import { useState, useEffect } from "react";
import { DollarSign, TrendingUp, TrendingDown, Wallet, CreditCard, Receipt } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../dashboard-ui/card";
import { Badge } from "../dashboard-ui/badge";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { getTransactions, Transaction } from "../../services/finance";

// Static fallback data for charts (until you have months of real data)
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

export function Finance() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dynamic calculated stats
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpense: 0,
    netProfit: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = await getTransactions();
      setTransactions(data);

      // Calculate dynamic totals from real data
      let income = 0;
      let expense = 0;
      data.forEach(t => {
        if (t.type === 'income') income += Number(t.amount);
        if (t.type === 'expense') expense += Number(t.amount);
      });

      setStats({
        totalIncome: income,
        totalExpense: expense,
        netProfit: income - expense,
      });

    } catch (error) {
      console.error("Failed to fetch transactions", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="finance-page space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-white text-3xl mb-2">Finance & Accounting</h1>
          <p className="text-white/60">Track income, expenses, and financial performance</p>
        </div>
      </div>

      {/* Stats - Static top row for UI purposes */}
      <div className="finance-stats-grid">
        <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur min-w-0 overflow-hidden">
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

        <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur min-w-0 overflow-hidden">
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

        <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur min-w-0 overflow-hidden">
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

        <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur min-w-0 overflow-hidden">
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
      <div className="finance-charts-grid">
        {/* Income vs Expenses Trend */}
        <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur">
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
                  label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
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

      {/* DYNAMIC Recent Transactions */}
      <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Receipt className="w-5 h-5 text-[#E41E6A]" />
            Recent Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="finance-table space-y-3">
            {isLoading ? (
              <div className="text-white/50 text-center py-4">Loading transactions...</div>
            ) : transactions.length === 0 ? (
              <div className="text-white/50 text-center py-4">No transactions recorded yet.</div>
            ) : (
              transactions.map((transaction) => (
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
                        <p className="text-white truncate">{transaction.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="border-white/20 text-white/60 text-xs">
                            {transaction.category}
                          </Badge>
                          <span className="text-white/50 text-xs">{new Date(transaction.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div
                      className={`amount-column text-xl ${
                        transaction.type === "income" ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {transaction.type === "income" ? "+" : "-"}₱
                      {Math.abs(transaction.amount).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* DYNAMIC Quick Stats */}
      <div className="finance-actuals-grid">
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/30 backdrop-blur min-w-0 overflow-hidden">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Wallet className="w-5 h-5 text-green-400" />
              Total Revenue (Actual)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-white text-3xl">₱{stats.totalIncome.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/30 backdrop-blur min-w-0 overflow-hidden">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-red-400" />
              Total Expenses (Actual)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-white text-3xl">₱{stats.totalExpense.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#E41E6A]/10 to-pink-500/5 border-[#E41E6A]/30 backdrop-blur min-w-0 overflow-hidden">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-[#E41E6A]" />
              Net Profit (Actual)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-white text-3xl">₱{stats.netProfit.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}