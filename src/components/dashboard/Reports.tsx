import { useState, useEffect } from "react";
import { FileText, Download, Calendar, TrendingUp, PieChart as PieChartIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../dashboard-ui/card";
import { Button } from "../dashboard-ui/button";
import { Badge } from "../dashboard-ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../dashboard-ui/select";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { getTransactions, Transaction } from "../../services/finance";

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
};

const reportTypes = [
  { id: 1, name: "Monthly Income Report", description: "Detailed breakdown of all income sources", icon: TrendingUp, color: "green" },
  { id: 2, name: "Monthly Expense Report", description: "Comprehensive expense tracking and analysis", icon: FileText, color: "red" },
  { id: 3, name: "Profit & Loss Statement", description: "Overall financial performance summary", icon: PieChartIcon, color: "blue" },
  { id: 4, name: "Service Revenue Report", description: "Revenue analysis by service type", icon: TrendingUp, color: "purple" },
];

export function Reports() {
  const [isLoading, setIsLoading] = useState(true);
  const [chartData, setChartData] = useState<MonthlyReportBucket[]>([]);
  
  // Summary totals for the bottom cards
  const [totals, setTotals] = useState({
    income: 0,
    expense: 0,
    profit: 0
  });

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    setIsLoading(true);
    try {
      const data = await getTransactions();

      // 1. Generate the last 6 months as empty buckets
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const last6Months: MonthlyReportBucket[] = [];
      
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        last6Months.push({
          month: monthNames[d.getMonth()],
          monthKey: `${d.getFullYear()}-${d.getMonth()}`,
          // Income buckets
          service: 0,
          sales: 0,
          incomeTotal: 0,
          // Expense buckets
          salaries: 0,
          supplies: 0,
          utilities: 0,
          other: 0,
          expenseTotal: 0,
        });
      }

      let totalInc = 0;
      let totalExp = 0;

      // 2. Sort transactions into their month buckets
      data.forEach(t => {
        const tDate = new Date(t.date);
        const monthKey = `${tDate.getFullYear()}-${tDate.getMonth()}`;
        const monthBucket = last6Months.find(m => m.monthKey === monthKey);

        if (monthBucket) {
          const amt = Number(t.amount);
          const cat = t.category.toLowerCase();

          if (t.type === 'income') {
            totalInc += amt;
            monthBucket.incomeTotal += amt;
            if (cat.includes('service')) monthBucket.service += amt;
            else monthBucket.sales += amt; // Default to sales if not explicitly a service
          } 
          else if (t.type === 'expense') {
            totalExp += amt;
            monthBucket.expenseTotal += amt;
            if (cat.includes('salar') || cat.includes('payroll')) monthBucket.salaries += amt;
            else if (cat.includes('suppl') || cat.includes('inventory')) monthBucket.supplies += amt;
            else if (cat.includes('util')) monthBucket.utilities += amt;
            else monthBucket.other += amt;
          }
        }
      });

      setChartData(last6Months);
      setTotals({
        income: totalInc,
        expense: totalExp,
        profit: totalInc - totalExp
      });

    } catch (error) {
      console.error("Failed to fetch report data", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="reports-container">
      {/* Header */}
      <div className="reports-header">
        <div>
          <h1 className="text-white text-3xl mb-2">Reports & Analytics</h1>
          <p className="text-white/60">Generate and view detailed financial reports</p>
        </div>
        <div className="reports-header-actions">
          <Select defaultValue="2024">
            <SelectTrigger className="w-32 bg-white/5 border-white/10 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2023">2023</SelectItem>
              <SelectItem value="2022">2022</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="all">
            <SelectTrigger className="w-40 bg-white/5 border-white/10 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Reports</SelectItem>
              <SelectItem value="income">Income</SelectItem>
              <SelectItem value="expense">Expense</SelectItem>
              <SelectItem value="profit">Profit & Loss</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Report Types */}
      <div className="reports-top-grid">
        {reportTypes.map((report) => (
          <Card
            key={report.id}
            className="bg-linear-to-br from-white/5 to-white/10 border-white/10 backdrop-blur hover:border-[#E41E6A]/50 transition-all cursor-pointer min-w-0 overflow-hidden"
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    report.color === "green" ? "bg-green-500/20" : 
                    report.color === "red" ? "bg-red-500/20" : 
                    report.color === "blue" ? "bg-blue-500/20" : "bg-purple-500/20"
                  }`}
                >
                  <report.icon
                    className={`w-6 h-6 ${
                      report.color === "green" ? "text-green-400" : 
                      report.color === "red" ? "text-red-400" : 
                      report.color === "blue" ? "text-blue-400" : "text-purple-400"
                    }`}
                  />
                </div>
                <Button size="sm" variant="outline" className="border-[#E41E6A]/30 text-[#E41E6A] hover:bg-[#E41E6A]/10">
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <h3 className="text-white mb-1 truncate">{report.name}</h3>
              <p className="text-white/60 text-xs truncate">{report.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Income Report Chart */}
      <div className="report-chart-card">
        <div className="flex flex-row items-center justify-between mb-4">
          <h3 className="text-white text-lg font-semibold">Income Report - 6 Month Trend</h3>
          <Button size="sm" variant="outline" className="border-white/10 text-white hover:bg-white/5">
            <Download className="w-4 h-4 mr-2" /> Export
          </Button>
        </div>
        {isLoading ? (
          <div className="h-[300px] flex items-center justify-center text-white/50">Loading chart data...</div>
        ) : (
          <div className="recharts-responsive-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.5)" />
                <YAxis stroke="rgba(255,255,255,0.5)" />
                <Tooltip contentStyle={{ backgroundColor: "rgba(0,0,0,0.9)", border: "1px solid rgba(228,30,106,0.3)", borderRadius: "8px" }} />
                <Legend />
                <Bar dataKey="service" fill="#E41E6A" radius={[8, 8, 0, 0]} name="Service Income" />
                <Bar dataKey="sales" fill="#8884d8" radius={[8, 8, 0, 0]} name="Product Sales" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/10">
          <div className="text-center">
            <p className="text-white/60 text-sm mb-1">Total Income (6M)</p>
            <p className="text-white text-2xl">₱{totals.income.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="text-white/60 text-sm mb-1">Avg Monthly</p>
            <p className="text-white text-2xl">₱{Math.round(totals.income / 6).toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="text-white/60 text-sm mb-1">Status</p>
            <p className="text-green-400 text-xl font-medium">Active</p>
          </div>
        </div>
      </div>

      {/* Expense Report Chart */}
      <div className="report-chart-card">
        <div className="flex flex-row items-center justify-between mb-4">
          <h3 className="text-white text-lg font-semibold">Expense Report - 6 Month Trend</h3>
          <Button size="sm" variant="outline" className="border-white/10 text-white hover:bg-white/5">
            <Download className="w-4 h-4 mr-2" /> Export
          </Button>
        </div>
        {isLoading ? (
          <div className="h-[300px] flex items-center justify-center text-white/50">Loading chart data...</div>
        ) : (
          <div className="recharts-responsive-container">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.5)" />
                <YAxis stroke="rgba(255,255,255,0.5)" />
                <Tooltip contentStyle={{ backgroundColor: "rgba(0,0,0,0.9)", border: "1px solid rgba(228,30,106,0.3)", borderRadius: "8px" }} />
                <Legend />
                <Line type="monotone" dataKey="salaries" stroke="#E41E6A" strokeWidth={2} name="Salaries" />
                <Line type="monotone" dataKey="supplies" stroke="#8884d8" strokeWidth={2} name="Supplies" />
                <Line type="monotone" dataKey="utilities" stroke="#82ca9d" strokeWidth={2} name="Utilities" />
                <Line type="monotone" dataKey="other" stroke="#ffc658" strokeWidth={2} name="Other" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/10">
          <div className="text-center">
            <p className="text-white/60 text-sm mb-1">Total Expenses (6M)</p>
            <p className="text-white text-2xl">₱{totals.expense.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="text-white/60 text-sm mb-1">Avg Monthly</p>
            <p className="text-white text-2xl">₱{Math.round(totals.expense / 6).toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="text-white/60 text-sm mb-1">Status</p>
            <p className="text-red-400 text-xl font-medium">Tracked</p>
          </div>
        </div>
      </div>

      {/* Profit & Loss Summary */}
      <div className="reports-bottom-grid">
        <Card className="bg-linear-to-br from-green-500/10 to-green-500/5 border-green-500/30 backdrop-blur min-w-0 overflow-hidden">
          <CardHeader>
            <CardTitle className="text-white text-sm">Total Revenue (6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-white text-3xl mb-2">₱{totals.income.toLocaleString()}</div>
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
              Generated Income
            </Badge>
          </CardContent>
        </Card>

        <Card className="bg-linear-to-br from-red-500/10 to-red-500/5 border-red-500/30 backdrop-blur min-w-0 overflow-hidden">
          <CardHeader>
            <CardTitle className="text-white text-sm">Total Expenses (6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-white text-3xl mb-2">₱{totals.expense.toLocaleString()}</div>
            <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
              Recorded Costs
            </Badge>
          </CardContent>
        </Card>

        <Card className="bg-linear-to-br from-[#E41E6A]/10 to-pink-500/5 border-[#E41E6A]/30 backdrop-blur min-w-0 overflow-hidden">
          <CardHeader>
            <CardTitle className="text-white text-sm">Net Profit (6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl mb-2 ${totals.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              ₱{totals.profit.toLocaleString()}
            </div>
            <Badge className={totals.profit >= 0 ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-red-500/20 text-red-400 border-red-500/30"}>
              {totals.income > 0 ? `Profit Margin: ${Math.round((totals.profit / totals.income) * 100)}%` : 'No margin data'}
            </Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}