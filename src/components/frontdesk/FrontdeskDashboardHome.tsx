import { Calendar, Users, ClipboardList, Package, Plus, UserPlus, FileText, Clock, Car, AlertTriangle, Eye, CheckCircle, Loader } from "lucide-react";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type AppointmentStatus = "Confirmed" | "In Progress" | "Pending";

interface Appointment {
  id: number;
  customer: string;
  vehicle: string;
  service: string;
  time: string;
  status: AppointmentStatus;
}

interface Customer {
  id: number;
  name: string;
  email: string;
  vehicle: string;
  registeredAt: string;
}

interface StockItem {
  id: number;
  name: string;
  category: string;
  quantity: number;
  minimum: number;
}

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

const MOCK_APPOINTMENTS: Appointment[] = [
  { id: 1, customer: "Juan dela Cruz",    vehicle: "2023 Toyota Fortuner",  service: "Ceramic Coating - Full Body",  time: "9:00 AM",  status: "Confirmed"   },
  { id: 2, customer: "Maria Santos",      vehicle: "2021 Honda Civic",      service: "Window Tinting - Full Car",    time: "10:30 AM", status: "In Progress" },
  { id: 3, customer: "Carlo Reyes",       vehicle: "2022 Mitsubishi Xpander",service: "PPF - Hood & Fenders",        time: "1:00 PM",  status: "Confirmed"   },
  { id: 4, customer: "Ana Villanueva",    vehicle: "2020 Ford Ranger",      service: "Full Interior Detailing",      time: "2:30 PM",  status: "Pending"     },
  { id: 5, customer: "Ramon Gutierrez",   vehicle: "2023 Nissan Terra",     service: "Nano Ceramic Spray",           time: "4:00 PM",  status: "Pending"     },
];

const MOCK_CUSTOMERS: Customer[] = [
  { id: 1, name: "Juan dela Cruz",   email: "juan@email.com",   vehicle: "2023 Toyota Fortuner",   registeredAt: "Today, 8:45 AM"   },
  { id: 2, name: "Maria Santos",     email: "maria@email.com",  vehicle: "2021 Honda Civic",       registeredAt: "Today, 9:10 AM"   },
  { id: 3, name: "Carlo Reyes",      email: "carlo@email.com",  vehicle: "2022 Mitsubishi Xpander",registeredAt: "Yesterday"        },
  { id: 4, name: "Ana Villanueva",   email: "ana@email.com",    vehicle: "2020 Ford Ranger",       registeredAt: "Yesterday"        },
];

const MOCK_LOW_STOCK: StockItem[] = [
  { id: 1, name: "9H Ceramic Coating",    category: "Coating",   quantity: 2,  minimum: 5  },
  { id: 2, name: "Polishing Compound",    category: "Detailing", quantity: 3,  minimum: 10 },
  { id: 3, name: "PPF Film Roll (60\")",  category: "PPF",       quantity: 1,  minimum: 4  },
  { id: 4, name: "Microfiber Towels",     category: "Supplies",  quantity: 8,  minimum: 20 },
];

const STATS = {
  todaysAppointments: MOCK_APPOINTMENTS.length,
  totalCustomers: 142,
  pendingJobs: MOCK_APPOINTMENTS.filter(a => a.status === "Pending" || a.status === "In Progress").length,
  lowStockItems: MOCK_LOW_STOCK.length,
};

// ─── STATUS CONFIG ─────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<AppointmentStatus, { bg: string; text: string; dot: string; icon: React.ReactNode }> = {
  Confirmed:   { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", icon: <CheckCircle className="w-3.5 h-3.5" /> },
  "In Progress":{ bg: "bg-blue-50",  text: "text-blue-700",    dot: "bg-blue-500",    icon: <Loader      className="w-3.5 h-3.5" /> },
  Pending:     { bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-400",   icon: <Clock       className="w-3.5 h-3.5" /> },
};

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
  value: number;
  iconBg: string;
  iconColor: string;
  accent?: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        <span className={iconColor}>{icon}</span>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{title}</p>
        <p className={`text-2xl font-bold mt-0.5 ${accent ?? "text-gray-800"}`}>{value}</p>
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
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-50 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-gray-800">{title}</h2>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div>{children}</div>
    </div>
  );
}

// ─── APPOINTMENT ROW ──────────────────────────────────────────────────────────

function AppointmentRow({ appt }: { appt: Appointment }) {
  const s = STATUS_STYLE[appt.status];
  return (
    <div className="flex items-center gap-4 px-5 py-3.5 border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors">
      {/* Time */}
      <div className="w-16 flex-shrink-0 text-center">
        <span className="text-xs font-bold text-[#E41E6A] bg-rose-50 px-2 py-1 rounded-lg whitespace-nowrap">
          {appt.time}
        </span>
      </div>

      {/* Service + vehicle */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate">{appt.service}</p>
        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5 truncate">
          <Car className="w-3 h-3 flex-shrink-0" />
          {appt.customer} · {appt.vehicle}
        </p>
      </div>

      {/* Status */}
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
    <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors">
      {/* Avatar */}
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#E41E6A] to-pink-400 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
        {customer.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate">{customer.name}</p>
        <p className="text-xs text-gray-400 truncate">{customer.email}</p>
      </div>

      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <button className="inline-flex items-center gap-1 text-xs font-medium text-sky-600 hover:text-sky-800 transition-colors">
          <Eye className="w-3.5 h-3.5" />View
        </button>
        <span className="text-[10px] text-gray-300">{customer.registeredAt}</span>
      </div>
    </div>
  );
}

// ─── STOCK ALERT CARD ─────────────────────────────────────────────────────────

function StockAlertCard({ item }: { item: StockItem }) {
  const pct = Math.round((item.quantity / item.minimum) * 100);
  return (
    <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-50 last:border-0 hover:bg-red-50/40 transition-colors">
      <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
        <AlertTriangle className="w-4 h-4 text-red-500" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-gray-800 truncate">{item.name}</p>
          <span className="flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600 border border-red-200">
            Low Stock
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1.5">
          {/* Progress bar */}
          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-400 rounded-full transition-all"
              style={{ width: `${Math.min(pct, 100)}%` }}
            />
          </div>
          <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
            {item.quantity} / {item.minimum} min
          </span>
        </div>
        <p className="text-[10px] text-gray-300 mt-0.5">{item.category}</p>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export function FrontDeskDashboardHome() {
  return (
    <div className="min-h-full bg-gray-50 p-4 md:p-6 space-y-5">

      {/* ── Header + Actions ── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">{todayFull()}</p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          <button className="inline-flex items-center gap-1.5 bg-[#E41E6A] hover:bg-[#c41559] text-white text-xs font-semibold px-3.5 py-2.5 rounded-xl shadow-md shadow-[#E41E6A]/25 transition-colors">
            <Plus className="w-3.5 h-3.5" />
            New Appointment
          </button>
          <button className="inline-flex items-center gap-1.5 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-gray-200 shadow-sm transition-colors">
            <UserPlus className="w-3.5 h-3.5 text-sky-500" />
            Register Customer
          </button>
          <button className="inline-flex items-center gap-1.5 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-gray-200 shadow-sm transition-colors">
            <FileText className="w-3.5 h-3.5 text-violet-500" />
            Create Job Order
          </button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          icon={<Calendar className="w-5 h-5" />}
          title="Today's Appointments"
          value={STATS.todaysAppointments}
          iconBg="bg-rose-50"
          iconColor="text-[#E41E6A]"
        />
        <StatCard
          icon={<Users className="w-5 h-5" />}
          title="Total Customers"
          value={STATS.totalCustomers}
          iconBg="bg-sky-50"
          iconColor="text-sky-500"
        />
        <StatCard
          icon={<ClipboardList className="w-5 h-5" />}
          title="Pending Jobs"
          value={STATS.pendingJobs}
          iconBg="bg-amber-50"
          iconColor="text-amber-500"
        />
        <StatCard
          icon={<Package className="w-5 h-5" />}
          title="Low Stock Items"
          value={STATS.lowStockItems}
          iconBg="bg-red-50"
          iconColor="text-red-500"
          accent="text-red-600"
        />
      </div>

      {/* ── Today's Schedule ── */}
      <SectionCard
        title="Today's Schedule"
        subtitle={`Appointments for ${todayShort()}`}
      >
        {MOCK_APPOINTMENTS.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mb-3">
              <Calendar className="w-6 h-6 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-400">No appointments scheduled for today</p>
          </div>
        ) : (
          <div>
            {MOCK_APPOINTMENTS.map(a => (
              <AppointmentRow key={a.id} appt={a} />
            ))}
          </div>
        )}
      </SectionCard>

      {/* ── Bottom 2-col grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Recent Customers */}
        <SectionCard
          title="Recent Customers"
          subtitle="Latest customer registrations"
          action={
            <button className="text-xs font-medium text-[#E41E6A] hover:text-[#c41559] transition-colors">
              View all
            </button>
          }
        >
          {MOCK_CUSTOMERS.map(c => (
            <CustomerItem key={c.id} customer={c} />
          ))}
        </SectionCard>

        {/* Low Stock Alert */}
        <SectionCard
          title="Low Stock Alert"
          subtitle="Items below minimum threshold"
          action={
            <button className="text-xs font-medium text-[#E41E6A] hover:text-[#c41559] transition-colors">
              Manage
            </button>
          }
        >
          {MOCK_LOW_STOCK.map(item => (
            <StockAlertCard key={item.id} item={item} />
          ))}
        </SectionCard>

      </div>
    </div>
  );
}

export default FrontDeskDashboardHome;