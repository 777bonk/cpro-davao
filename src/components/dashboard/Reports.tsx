import { FileText, Download, Calendar, TrendingUp, PieChart as PieChartIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../dashboard-ui/card";
import { Button } from "../dashboard-ui/button";
import { Badge } from "../dashboard-ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../dashboard-ui/select";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const incomeReport = [
  { month: "Jan", service: 345000, sales: 42000, total: 387000 },
  { month: "Feb", service: 412000, sales: 51000, total: 463000 },
  { month: "Mar", service: 389000, sales: 48000, total: 437000 },
  { month: "Apr", service: 487000, sales: 62000, total: 549000 },
  { month: "May", service: 434000, sales: 54000, total: 488000 },
  { month: "Jun", service: 521000, sales: 68000, total: 589000 },
];

const expenseReport = [
  { month: "Jan", salaries: 685000, supplies: 145000, utilities: 42000, other: 58000 },
  { month: "Feb", salaries: 685000, supplies: 168000, utilities: 45000, other: 62000 },
  { month: "Mar", salaries: 685000, supplies: 152000, utilities: 43000, other: 55000 },
  { month: "Apr", salaries: 685000, supplies: 189000, utilities: 48000, other: 67000 },
  { month: "May", salaries: 685000, supplies: 176000, utilities: 46000, other: 61000 },
  { month: "Jun", salaries: 685000, supplies: 201000, utilities: 51000, other: 73000 },
];

const reportTypes = [
  { id: 1, name: "Monthly Income Report", description: "Detailed breakdown of all income sources", icon: TrendingUp, color: "green" },
  { id: 2, name: "Monthly Expense Report", description: "Comprehensive expense tracking and analysis", icon: FileText, color: "red" },
  { id: 3, name: "Profit & Loss Statement", description: "Overall financial performance summary", icon: PieChartIcon, color: "blue" },
  { id: 4, name: "Service Revenue Report", description: "Revenue analysis by service type", icon: TrendingUp, color: "purple" },
];

export function Reports() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-white text-3xl mb-2">Reports & Analytics</h1>
          <p className="text-white/60">Generate and view detailed financial reports</p>
        </div>
        <div className="flex gap-2">
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {reportTypes.map((report) => (
          <Card
            key={report.id}
            className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur hover:border-[#E41E6A]/50 transition-all cursor-pointer"
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    report.color === "green"
                      ? "bg-green-500/20"
                      : report.color === "red"
                      ? "bg-red-500/20"
                      : report.color === "blue"
                      ? "bg-blue-500/20"
                      : "bg-purple-500/20"
                  }`}
                >
                  <report.icon
                    className={`w-6 h-6 ${
                      report.color === "green"
                        ? "text-green-400"
                        : report.color === "red"
                        ? "text-red-400"
                        : report.color === "blue"
                        ? "text-blue-400"
                        : "text-purple-400"
                    }`}
                  />
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-[#E41E6A]/30 text-[#E41E6A] hover:bg-[#E41E6A]/10"
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <h3 className="text-white mb-1">{report.name}</h3>
              <p className="text-white/60 text-xs">{report.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Income Report Chart */}
      <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white">Income Report - 6 Month Trend</CardTitle>
          <Button
            size="sm"
            variant="outline"
            className="border-white/10 text-white hover:bg-white/5"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={incomeReport}>
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
              <Bar dataKey="service" fill="#E41E6A" radius={[8, 8, 0, 0]} name="Service Income" />
              <Bar dataKey="sales" fill="#8884d8" radius={[8, 8, 0, 0]} name="Product Sales" />
            </BarChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/10">
            <div className="text-center">
              <p className="text-white/60 text-sm mb-1">Total Income</p>
              <p className="text-white text-2xl">₱2.91M</p>
            </div>
            <div className="text-center">
              <p className="text-white/60 text-sm mb-1">Avg Monthly</p>
              <p className="text-white text-2xl">₱485K</p>
            </div>
            <div className="text-center">
              <p className="text-white/60 text-sm mb-1">Growth Rate</p>
              <p className="text-green-400 text-2xl">+18.5%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expense Report Chart */}
      <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white">Expense Report - 6 Month Trend</CardTitle>
          <Button
            size="sm"
            variant="outline"
            className="border-white/10 text-white hover:bg-white/5"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={expenseReport}>
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
              <Line type="monotone" dataKey="salaries" stroke="#E41E6A" strokeWidth={2} name="Salaries" />
              <Line type="monotone" dataKey="supplies" stroke="#8884d8" strokeWidth={2} name="Supplies" />
              <Line type="monotone" dataKey="utilities" stroke="#82ca9d" strokeWidth={2} name="Utilities" />
              <Line type="monotone" dataKey="other" stroke="#ffc658" strokeWidth={2} name="Other" />
            </LineChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/10">
            <div className="text-center">
              <p className="text-white/60 text-sm mb-1">Total Expenses</p>
              <p className="text-white text-2xl">₱5.87M</p>
            </div>
            <div className="text-center">
              <p className="text-white/60 text-sm mb-1">Avg Monthly</p>
              <p className="text-white text-2xl">₱978K</p>
            </div>
            <div className="text-center">
              <p className="text-white/60 text-sm mb-1">vs Last Year</p>
              <p className="text-red-400 text-2xl">+12.3%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profit & Loss Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/30 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white text-sm">Total Revenue (6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-white text-3xl mb-2">₱2,913,000</div>
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
              <TrendingUp className="w-3 h-3 mr-1" />
              +18.5% YoY
            </Badge>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/30 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white text-sm">Total Expenses (6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-white text-3xl mb-2">₱5,868,000</div>
            <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
              <TrendingUp className="w-3 h-3 mr-1" />
              +12.3% YoY
            </Badge>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#E41E6A]/10 to-pink-500/5 border-[#E41E6A]/30 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white text-sm">Net Profit (6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-white text-3xl mb-2">₱-2,955,000</div>
            <Badge className="bg-[#E41E6A]/20 text-[#E41E6A] border-[#E41E6A]/30">
              <TrendingUp className="w-3 h-3 mr-1" />
              Profit Margin: -50.4%
            </Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
