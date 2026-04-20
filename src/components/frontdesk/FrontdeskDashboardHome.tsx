import { getAppointments }  from "../../services/appointments";
import { getCustomers }     from "../../services/customer";
import { getInventory }     from "../../services/inventory";
import { useState, useEffect } from "react";
import { 
  Calendar, Users, ClipboardList, Package, Plus, UserPlus, 
  FileText, Clock, Car, AlertTriangle, Eye, CheckCircle, Loader, CalendarX
} from "lucide-react";

// ─── API PLACEHOLDERS (Replace with your actual service imports) ──────────────
// import { getDashboardStats, getTodaysAppointments, getRecentCustomers, getLowStockAlerts } from "../../services/dashboard";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type AppointmentStatus = "Confirmed" | "In Progress" | "Pending";

interface Appointment {
  id: number | string;
  customer: string;
  vehicle: string;
  service: string;
  time: string;
  status: AppointmentStatus;
}

interface Customer {
  id: number | string;
  name: string;
  email: string;
  vehicle: string;
  registeredAt: string;
}

interface StockItem {
  id: number | string;
  name: string;
  category: string;
  quantity: number;
  minimum: number;
}

interface DashboardStats {
  todaysAppointments: number;
  totalCustomers: number;
  pendingJobs: number;
  lowStockItems: number;
}

// ─── STATUS CONFIG ─────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<AppointmentStatus, { bg: string; text: string; icon: React.ReactNode }> = {
  Confirmed:   { bg: "bg-green-500/20",  text: "text-green-400",  icon: <CheckCircle className="w-3.5 h-3.5" /> },
  "In Progress":{ bg: "bg-blue-500/20",   text: "text-blue-400",   icon: <Loader      className="w-3.5 h-3.5 animate-spin" /> },
  Pending:     { bg: "bg-yellow-500/20", text: "text-yellow-400", icon: <Clock       className="w-3.5 h-3.5" /> },
};

// ─── SHARED CLASSES ───────────────────────────────────────────────────────────

const cardCls = "bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur rounded-xl border";

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function todayFull() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}
function todayShort() {
  return new Date().toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });
}

// ─── STAT CARD ────────────────────────────────────────────────────────────────

function StatCard({
  icon, title, value, iconBg, iconColor, accent,
}: {
  icon: React.ReactNode;
  title: string;
  value: number | string;
  iconBg: string;
  iconColor: string;
  accent?: string;
}) {
  return (
    <div className={`${cardCls} p-5 flex items-center gap-4`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        <span className={iconColor}>{icon}</span>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-white/40">{title}</p>
        <p className={`text-2xl font-bold mt-0.5 ${accent ?? "text-white"}`}>{value}</p>
      </div>
    </div>
  );
}

// ─── SECTION CARD ─────────────────────────────────────────────────────────────

function SectionCard({
  title, subtitle, children, action,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className={`${cardCls} overflow-hidden flex flex-col`}>
      <div className="px-5 py-4 border-b border-white/10 flex items-start justify-between gap-3 bg-white/5">
        <div>
          <h2 className="text-sm font-bold text-white">{title}</h2>
          {subtitle && <p className="text-xs text-white/40 mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="flex-1 divide-y divide-white/5">{children}</div>
    </div>
  );
}

// ─── APPOINTMENT ROW ──────────────────────────────────────────────────────────

function AppointmentRow({ appt }: { appt: Appointment }) {
  const s = STATUS_STYLE[appt.status];
  return (
    <div className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/5 transition-colors">
      <div className="w-16 flex-shrink-0 text-center">
        <span className="text-xs font-bold text-pink-400 bg-[#E41E6A]/20 px-2 py-1 rounded-lg whitespace-nowrap">
          {appt.time}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{appt.service}</p>
        <p className="text-xs text-white/50 flex items-center gap-1 mt-0.5 truncate">
          <Car className="w-3 h-3 flex-shrink-0" />
          {appt.customer} · {appt.vehicle}
        </p>
      </div>

      <span className={`hidden sm:inline-flex flex-shrink-0 items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${s.bg} ${s.text}`}>
        {s.icon}
        {appt.status}
      </span>
    </div>
  );
}

// ─── CUSTOMER ITEM ────────────────────────────────────────────────────────────

function CustomerItem({ customer }: { customer: Customer }) {
  return (
    <div className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/5 transition-colors">
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#E41E6A] to-pink-600 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold shadow-md shadow-[#E41E6A]/20">
        {customer.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{customer.name}</p>
        <p className="text-xs text-white/40 truncate">{customer.email}</p>
      </div>

      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <button className="inline-flex items-center gap-1 text-xs font-medium text-[#E41E6A] hover:text-pink-400 transition-colors">
          <Eye className="w-3.5 h-3.5" />View
        </button>
        <span className="text-[10px] text-white/30">{customer.registeredAt}</span>
      </div>
    </div>
  );
}

// ─── STOCK ALERT CARD ─────────────────────────────────────────────────────────

function StockAlertCard({ item }: { item: StockItem }) {
  const pct = Math.round((item.quantity / item.minimum) * 100);
  return (
    <div className="flex items-center gap-3 px-5 py-3.5 hover:bg-red-500/10 transition-colors group">
      <div className="w-9 h-9 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0 border border-red-500/20 group-hover:border-red-500/40 transition-colors">
        <AlertTriangle className="w-4 h-4 text-red-400" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-white truncate">{item.name}</p>
          <span className="flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 uppercase tracking-wide">
            Low Stock
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1.5">
          <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-500 rounded-full transition-all shadow-[0_0_8px_rgba(239,68,68,0.6)]"
              style={{ width: `${Math.min(pct, 100)}%` }}
            />
          </div>
          <span className="text-xs text-white/50 whitespace-nowrap flex-shrink-0">
            {item.quantity} / {item.minimum} min
          </span>
        </div>
        <p className="text-[10px] text-white/30 mt-0.5">{item.category}</p>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export function FrontDeskDashboardHome() {
  const [stats, setStats] = useState<DashboardStats>({
    todaysAppointments: 0, totalCustomers: 0, pendingJobs: 0, lowStockItems: 0
  });
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [lowStock, setLowStock] = useState<StockItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ─── DATA FETCHING (Simulated) ───
  useEffect(() => {
    fetchDashboardData();
  }, []);

const fetchDashboardData = async () => {
  setIsLoading(true);
  try {
    const today = new Date().toISOString().split("T")[0];

    const [apptData, customerData, inventoryData] = await Promise.all([
      getAppointments().catch(() => []),
      getCustomers().catch(()     => []),
      getInventory().catch(()     => []),
    ]);

    // Today's appointments
    const todaysAppts = apptData.filter((a) => a.date === today);

    // Pending jobs
    const pendingJobs = apptData.filter(
      (a) => a.status === "Pending" || a.status === "In Progress"
    ).length;

    // Low stock
    const lowStock = inventoryData.filter(
      (i: any) => i.stock <= i.reorderLevel
    );

    setStats({
      todaysAppointments: todaysAppts.length,
      totalCustomers:     customerData.length,
      pendingJobs,
      lowStockItems:      lowStock.length,
    });

    // Today's schedule — map to component shape
    setAppointments(
      todaysAppts.slice(0, 5).map((a) => ({
        id:       a.id,
        customer: a.customerName,
        vehicle:  a.vehicle,
        service:  a.service,
        time:     a.time,
        status:   a.status as AppointmentStatus,
      }))
    );

    // Recent customers — last 5
    setCustomers(
      customerData.slice(0, 5).map((c: any) => ({
        id:           c.id,
        name:         c.name,
        email:        c.email        ?? "",
        vehicle:      c.vehicle      ?? "",
        registeredAt: c.created_at
          ? c.created_at.split("T")[0]
          : "",
      }))
    );

    // Low stock alerts
    setLowStock(
      lowStock.slice(0, 5).map((i: any) => ({
        id:       i.id,
        name:     i.name,
        category: i.category,
        quantity: i.stock,
        minimum:  i.reorderLevel,
      }))
    );
  } catch (err) {
    console.error("Failed to load dashboard data:", err);
  } finally {
    setIsLoading(false);
  }
};

  return (
    <div className="space-y-6">

      {/* ── Header + Actions ── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-white text-3xl font-bold mb-1">Dashboard</h1>
          <p className="text-white/60 text-sm">{todayFull()}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button className="inline-flex items-center gap-1.5 bg-gradient-to-r from-[#E41E6A] to-pink-600 hover:from-[#c41559] text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-[#E41E6A]/25 transition-all">
            <Plus className="w-3.5 h-3.5" />
            New Appointment
          </button>
          <button className="inline-flex items-center gap-1.5 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold px-4 py-2.5 rounded-xl border border-white/10 shadow-sm transition-colors">
            <UserPlus className="w-3.5 h-3.5 text-sky-400" />
            Register Customer
          </button>
          <button className="inline-flex items-center gap-1.5 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold px-4 py-2.5 rounded-xl border border-white/10 shadow-sm transition-colors">
            <FileText className="w-3.5 h-3.5 text-violet-400" />
            Create Job Order
          </button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          icon={<Calendar className="w-5 h-5" />}
          title="Today's Appointments"
          value={isLoading ? "-" : stats.todaysAppointments}
          iconBg="bg-pink-500/20"
          iconColor="text-pink-400"
        />
        <StatCard
          icon={<Users className="w-5 h-5" />}
          title="Total Customers"
          value={isLoading ? "-" : stats.totalCustomers}
          iconBg="bg-sky-500/20"
          iconColor="text-sky-400"
        />
        <StatCard
          icon={<ClipboardList className="w-5 h-5" />}
          title="Pending Jobs"
          value={isLoading ? "-" : stats.pendingJobs}
          iconBg="bg-yellow-500/20"
          iconColor="text-yellow-400"
        />
        <StatCard
          icon={<Package className="w-5 h-5" />}
          title="Low Stock Items"
          value={isLoading ? "-" : stats.lowStockItems}
          iconBg="bg-red-500/20"
          iconColor="text-red-400"
          accent="text-red-400"
        />
      </div>

      {/* ── Today's Schedule ── */}
      <SectionCard
        title="Today's Schedule"
        subtitle={`Appointments for ${todayShort()}`}
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-white/50 text-sm">Loading schedule...</div>
        ) : appointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-3">
              <CalendarX className="w-6 h-6 text-white/20" />
            </div>
            <p className="text-sm font-medium text-white/40">No appointments scheduled for today</p>
          </div>
        ) : (
          appointments.map(a => <AppointmentRow key={a.id} appt={a} />)
        )}
      </SectionCard>

      {/* ── Bottom 2-col grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Recent Customers */}
        <SectionCard
          title="Recent Customers"
          subtitle="Latest customer registrations"
          action={
            <button className="text-xs font-medium text-[#E41E6A] hover:text-pink-400 transition-colors">
              View all
            </button>
          }
        >
          {isLoading ? (
             <div className="flex items-center justify-center py-8 text-white/50 text-sm">Loading customers...</div>
          ) : customers.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-white/40 text-sm">No recent customers</div>
          ) : (
            customers.map(c => <CustomerItem key={c.id} customer={c} />)
          )}
        </SectionCard>

        {/* Low Stock Alert */}
        <SectionCard
          title="Low Stock Alert"
          subtitle="Items below minimum threshold"
          action={
            <button className="text-xs font-medium text-[#E41E6A] hover:text-pink-400 transition-colors">
              Manage
            </button>
          }
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-white/50 text-sm">Loading stock alerts...</div>
          ) : lowStock.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-white/40 text-sm flex-col gap-2">
              <CheckCircle className="w-8 h-8 text-green-500/50" />
              <span>All stock levels are looking good</span>
            </div>
          ) : (
            lowStock.map(item => <StockAlertCard key={item.id} item={item} />)
          )}
        </SectionCard>

      </div>
    </div>
  );
}

export default FrontDeskDashboardHome;