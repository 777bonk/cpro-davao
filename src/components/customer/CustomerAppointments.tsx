import { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  SlidersHorizontal,
  Plus,
  Calendar,
  Car,
  Clock,
  Banknote,
  Shield,
  Layers,
  Sparkles,
  Eye,
  XCircle,
  CalendarX,
} from "lucide-react";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type AppointmentStatus = "Confirmed" | "Pending" | "In Progress" | "Completed" | "Cancelled";

interface Appointment {
  id: number;
  service: string;
  vehicle: string;
  date: string; // "YYYY-MM-DD"
  time: string;
  deposit: number;
  status: AppointmentStatus;
}

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

const MOCK: Appointment[] = [
  { id: 1, service: "Ceramic Coating - Full Body",     vehicle: "2023 Toyota Fortuner",  date: "2026-04-24", time: "9:00 AM",  deposit: 3000, status: "Confirmed"   },
  { id: 2, service: "Paint Protection Film - Hood",    vehicle: "2021 Honda Civic",       date: "2026-05-03", time: "1:00 PM",  deposit: 1500, status: "Pending"     },
  { id: 3, service: "Window Tinting - Full Car",       vehicle: "2023 Toyota Fortuner",  date: "2026-05-10", time: "10:30 AM", deposit: 1000, status: "Pending"     },
  { id: 4, service: "Ceramic Coating - Partial",       vehicle: "2021 Honda Civic",       date: "2026-04-19", time: "2:00 PM",  deposit: 2000, status: "In Progress" },
  { id: 5, service: "Detailing - Full Interior",       vehicle: "2023 Toyota Fortuner",  date: "2026-03-15", time: "8:00 AM",  deposit: 800,  status: "Completed"   },
  { id: 6, service: "Nano Ceramic Spray",              vehicle: "2021 Honda Civic",       date: "2026-03-28", time: "3:00 PM",  deposit: 500,  status: "Completed"   },
];

// ─── STATUS CONFIG ─────────────────────────────────────────────────────────────

const STATUS: Record<AppointmentStatus, { bg: string; text: string; dot: string; border: string }> = {
  Confirmed:   { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", border: "border-emerald-200" },
  Pending:     { bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-400",   border: "border-amber-200"   },
  "In Progress":{ bg: "bg-blue-50",  text: "text-blue-700",    dot: "bg-blue-500",    border: "border-blue-200"    },
  Completed:   { bg: "bg-gray-100",   text: "text-gray-600",    dot: "bg-gray-400",    border: "border-gray-200"    },
  Cancelled:   { bg: "bg-red-50",     text: "text-red-600",     dot: "bg-red-400",     border: "border-red-200"     },
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function formatFull(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday:"long", year:"numeric", month:"long", day:"numeric" });
}

function formatShort(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" });
}

function serviceIcon(service: string) {
  const s = service.toLowerCase();
  if (s.includes("coating"))  return <Shield  className="w-4 h-4 text-[#E41E6A]"    />;
  if (s.includes("ppf") || s.includes("paint protection"))
                               return <Layers  className="w-4 h-4 text-violet-500"   />;
  if (s.includes("tint"))      return <Sparkles className="w-4 h-4 text-sky-500"    />;
  return                              <Car     className="w-4 h-4 text-gray-400"     />;
}

// ─── STATUS BADGE ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: AppointmentStatus }) {
  const s = STATUS[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${s.bg} ${s.text} ${s.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status}
    </span>
  );
}

// ─── APPOINTMENT CARD (panel) ─────────────────────────────────────────────────

function AppointmentCard({ appt }: { appt: Appointment }) {
  return (
    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:border-[#E41E6A]/30 hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center flex-shrink-0">
            {serviceIcon(appt.service)}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800 leading-snug">{appt.service}</p>
            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
              <Car className="w-3 h-3" />{appt.vehicle}
            </p>
          </div>
        </div>
        <StatusBadge status={appt.status} />
      </div>
      <div className="flex flex-wrap gap-3 pt-2.5 border-t border-gray-50">
        <span className="flex items-center gap-1 text-xs text-gray-500">
          <Clock className="w-3.5 h-3.5 text-[#E41E6A]" />{appt.time}
        </span>
        <span className="flex items-center gap-1 text-xs text-gray-500 ml-auto">
          <Banknote className="w-3.5 h-3.5 text-emerald-500" />
          Deposit: <span className="font-semibold text-gray-700 ml-0.5">₱{appt.deposit.toLocaleString()}</span>
        </span>
      </div>
    </div>
  );
}

// ─── CALENDAR CARD ────────────────────────────────────────────────────────────

function CalendarCard({
  selected,
  onSelect,
  dotDates,
}: {
  selected: string;
  onSelect: (d: string) => void;
  dotDates: Record<string, AppointmentStatus[]>;
}) {
  const todayStr = today();
  const selDate  = new Date(selected + "T00:00:00");
  const [viewYear,  setViewYear]  = useState(selDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(selDate.getMonth());

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  const prev = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const next = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const cellKey = (day: number) =>
    `${viewYear}-${String(viewMonth+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;

  // dot color priority
  const dotColor = (statuses: AppointmentStatus[]) => {
    if (statuses.includes("In Progress")) return "bg-blue-500";
    if (statuses.includes("Confirmed"))   return "bg-emerald-500";
    if (statuses.includes("Pending"))     return "bg-amber-400";
    return "bg-gray-400";
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <div className="mb-4">
        <h2 className="text-sm font-bold text-gray-800">Calendar</h2>
        <p className="text-xs text-gray-400 mt-0.5">Select a date to view appointments</p>
      </div>

      {/* Month nav */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prev} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors">
          <ChevronLeft className="w-4 h-4 text-gray-500" />
        </button>
        <span className="text-sm font-semibold text-gray-700">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>
        <button onClick={next} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors">
          <ChevronRight className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_NAMES.map(d => (
          <div key={d} className="text-center text-[10px] font-semibold text-gray-400 py-1">{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />;
          const key      = cellKey(day);
          const isToday  = key === todayStr;
          const isSel    = key === selected;
          const hasDots  = dotDates[key];

          return (
            <button
              key={key}
              onClick={() => onSelect(key)}
              className={`
                relative flex flex-col items-center justify-center w-8 h-8 mx-auto rounded-full text-xs font-medium transition-all duration-150
                ${isSel  ? "bg-[#E41E6A] text-white shadow-md shadow-[#E41E6A]/30" : ""}
                ${isToday && !isSel ? "border border-[#E41E6A] text-[#E41E6A]" : ""}
                ${!isSel && !isToday ? "text-gray-600 hover:bg-gray-100" : ""}
              `}
            >
              {day}
              {hasDots && (
                <span className={`absolute bottom-0.5 w-1.5 h-1.5 rounded-full ${isSel ? "bg-white" : dotColor(hasDots)}`} />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-gray-50 flex flex-col gap-1.5">
        {[
          { dot: "bg-emerald-500", label: "Confirmed"   },
          { dot: "bg-blue-500",    label: "In Progress" },
          { dot: "bg-amber-400",   label: "Pending"     },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${l.dot}`} />
            <span className="text-xs text-gray-500">{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── APPOINTMENTS PANEL ───────────────────────────────────────────────────────

function AppointmentsPanel({ selected, appts }: { selected: string; appts: Appointment[] }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col min-h-[420px]">
      <div className="mb-4">
        <h2 className="text-sm font-bold text-gray-800">
          Appointments for <span className="text-[#E41E6A]">{formatShort(selected)}</span>
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">
          {appts.length} appointment{appts.length !== 1 ? "s" : ""} scheduled
        </p>
      </div>

      {appts.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-10">
          <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mb-3">
            <CalendarX className="w-6 h-6 text-gray-300" />
          </div>
          <p className="text-sm font-medium text-gray-400">No appointments scheduled</p>
          <p className="text-xs text-gray-300 mt-1">for this date</p>
        </div>
      ) : (
        <div className="space-y-3 overflow-y-auto">
          {appts.map(a => <AppointmentCard key={a.id} appt={a} />)}
        </div>
      )}
    </div>
  );
}

// ─── APPOINTMENT LIST (ALL) ───────────────────────────────────────────────────

function AppointmentList({ appts }: { appts: Appointment[] }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-50">
        <h2 className="text-sm font-bold text-gray-800">All Appointments</h2>
        <p className="text-xs text-gray-400 mt-0.5">{appts.length} total records</p>
      </div>

      {/* Mobile: cards */}
      <div className="sm:hidden divide-y divide-gray-50">
        {appts.map(a => (
          <div key={a.id} className="p-4 flex flex-col gap-2">
            <div className="flex items-start justify-between">
              <p className="text-sm font-semibold text-gray-800 leading-snug max-w-[70%]">{a.service}</p>
              <StatusBadge status={a.status} />
            </div>
            <p className="text-xs text-gray-400 flex items-center gap-1"><Car className="w-3 h-3" />{a.vehicle}</p>
            <p className="text-xs text-gray-400 flex items-center gap-1"><Calendar className="w-3 h-3 text-[#E41E6A]" />{formatShort(a.date)} · {a.time}</p>
            <div className="flex gap-2 mt-1">
              <button className="flex items-center gap-1 text-xs font-medium text-sky-600 hover:text-sky-800 transition-colors">
                <Eye className="w-3.5 h-3.5" />View
              </button>
              {a.status !== "Completed" && a.status !== "Cancelled" && (
                <button className="flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-700 transition-colors ml-2">
                  <XCircle className="w-3.5 h-3.5" />Cancel
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
              <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Service</th>
              <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Vehicle</th>
              <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
              <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {appts.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-10 text-gray-400 text-sm">No appointments found.</td>
              </tr>
            ) : (
              appts.map(a => (
                <tr key={a.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-5 py-3.5 text-xs text-gray-500 whitespace-nowrap">
                    <span className="block font-medium text-gray-700">{formatShort(a.date)}</span>
                    <span className="text-gray-400">{a.time}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center flex-shrink-0">
                        {serviceIcon(a.service)}
                      </div>
                      <span className="text-sm text-gray-800 font-medium leading-snug max-w-[220px] truncate">{a.service}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-500 whitespace-nowrap">{a.vehicle}</td>
                  <td className="px-5 py-3.5"><StatusBadge status={a.status} /></td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button className="flex items-center gap-1 text-xs font-medium text-sky-600 hover:text-sky-800 transition-colors">
                        <Eye className="w-3.5 h-3.5" />View
                      </button>
                      {a.status !== "Completed" && a.status !== "Cancelled" && (
                        <button className="flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-700 transition-colors">
                          <XCircle className="w-3.5 h-3.5" />Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export function CustomerAppointments() {
  const todayStr = today();
  const [selected, setSelected] = useState(todayStr);
  const [search,   setSearch]   = useState("");

  const todayFull = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  // Build dot map for calendar
  const dotDates = useMemo(() => {
    const map: Record<string, AppointmentStatus[]> = {};
    MOCK.forEach(a => {
      if (!map[a.date]) map[a.date] = [];
      map[a.date].push(a.status);
    });
    return map;
  }, []);

  // Appointments for selected date
  const forSelected = useMemo(
    () => MOCK.filter(a => a.date === selected),
    [selected]
  );

  // All appointments filtered by search
  const filtered = useMemo(
    () =>
      MOCK.filter(
        a =>
          a.service.toLowerCase().includes(search.toLowerCase()) ||
          a.vehicle.toLowerCase().includes(search.toLowerCase()) ||
          a.status.toLowerCase().includes(search.toLowerCase())
      ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [search]
  );

  return (
    <div className="min-h-full bg-gray-50 p-4 md:p-6 space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">My Appointments</h1>
          <p className="text-gray-400 text-sm mt-1">{todayFull}</p>
        </div>
        <button className="self-start sm:self-auto inline-flex items-center gap-2 bg-[#E41E6A] hover:bg-[#c41559] text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-[#E41E6A]/25 transition-colors">
          <Plus className="w-4 h-4" />
          New Appointment
        </button>
      </div>

      {/* ── Search + Filter ── */}
      <div className="flex items-center gap-3 max-w-lg">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search appointments..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:border-[#E41E6A] focus:ring-1 focus:ring-[#E41E6A]/30 transition-colors placeholder:text-gray-400"
          />
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-gray-300 hover:bg-gray-50 transition-colors">
          <SlidersHorizontal className="w-4 h-4" />
          Filter
        </button>
      </div>

      {/* ── Calendar + Panel ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4">
        <CalendarCard
          selected={selected}
          onSelect={setSelected}
          dotDates={dotDates}
        />
        <AppointmentsPanel selected={selected} appts={forSelected} />
      </div>

      {/* ── All Appointments ── */}
      <AppointmentList appts={filtered} />

    </div>
  );
}

export default CustomerAppointments;