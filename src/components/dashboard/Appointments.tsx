import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Plus, X, CheckCircle2, Clock, CreditCard, ChevronDown } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "../dashboard-ui/card";
import { Badge }   from "../dashboard-ui/badge";
import { Button }  from "../dashboard-ui/button";
import { Label }   from "../dashboard-ui/label";
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from "../dashboard-ui/table";

import {
  getAppointments, createAppointment,
  updateAppointmentStatus, updateAppointment,
  deleteAppointment, Appointment,
} from "../../services/appointments";
import { getCustomers, Customer } from "../../services/customer";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const SERVICE_OPTIONS = [
  "Ceramic Coating",
  "Paint Protection Film (PPF)",
  "Interior Detailing",
  "Exterior Detailing",
  "Premium Wash",
  "Window Tinting",
  "Scheduled Maintenance",
];

const STATUS_OPTIONS: Appointment["status"][] = [
  "Pending", "In Progress", "Completed", "Cancelled",
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function toDateOnly(value?: string) {
  return value?.split("T")[0] ?? "";
}

function formatDateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatShortDate(dateString?: string) {
  if (!dateString) return "—";
  const parsed = new Date(`${dateString}T12:00:00.000Z`);
  if (isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric", timeZone: "UTC",
  });
}

function getStatusBadgeClass(status: string) {
  switch (status) {
    case "Completed":   return "bg-green-500/15 text-green-400 border border-green-500/30";
    case "In Progress": return "bg-[#E41E6A]/15 text-[#E41E6A] border border-[#E41E6A]/30";
    case "Cancelled":   return "bg-red-500/15 text-red-400 border border-red-500/30";
    default:            return "bg-blue-500/15 text-blue-400 border border-blue-500/30";
  }
}

function getCalendarDotClass(statuses: string[]) {
  if (statuses.includes("In Progress")) return "bg-[#E41E6A]";
  if (statuses.includes("Pending"))     return "bg-blue-500";
  if (statuses.includes("Completed"))   return "bg-green-500";
  return "bg-white/40";
}

function parseTimeForSort(time?: string) {
  if (!time) return 0;
  if (time.includes("AM") || time.includes("PM")) {
    const [clock, meridiem] = time.split(" ");
    const [rawH, rawM] = clock.split(":").map(Number);
    let h = rawH;
    if (meridiem === "PM" && h !== 12) h += 12;
    if (meridiem === "AM" && h === 12) h = 0;
    return h * 60 + rawM;
  }
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

// Shared input/select styles
const inputCls =
  "w-full px-4 h-10 border border-white/10 bg-white/5 rounded-md " +
  "focus:outline-none focus:border-[#E41E6A] text-white text-sm placeholder:text-white/30";
const selectCls = inputCls + " appearance-none";

// ─── MINI CALENDAR ────────────────────────────────────────────────────────────

function MiniCalendar({
  selectedDate, onSelect, dateStatusMap,
}: {
  selectedDate: Date;
  onSelect: (d: Date) => void;
  dateStatusMap: Record<string, string[]>;
}) {
  const [viewMonth, setViewMonth] = useState(selectedDate.getMonth());
  const [viewYear,  setViewYear]  = useState(selectedDate.getFullYear());

  useEffect(() => {
    setViewMonth(selectedDate.getMonth());
    setViewYear(selectedDate.getFullYear());
  }, [selectedDate]);

  const firstDay    = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const todayKey    = formatDateKey(new Date());
  const selectedKey = formatDateKey(selectedDate);

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const prev = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const next = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  return (
    <div className="bg-[#111111] border border-white/5 rounded-2xl p-5">
      <div className="mb-4">
        <h2 className="text-sm font-bold text-white">Calendar</h2>
        <p className="text-xs text-white/40 mt-0.5">Select a date to filter appointments</p>
      </div>

      <div className="flex items-center justify-between mb-4">
        <button onClick={prev} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/5 text-white/70">‹</button>
        <span className="text-sm font-semibold text-white">{MONTH_NAMES[viewMonth]} {viewYear}</span>
        <button onClick={next} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/5 text-white/70">›</button>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {DAY_NAMES.map(d => (
          <div key={d} className="text-center text-[10px] font-semibold text-white/35 py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />;
          const key = `${viewYear}-${String(viewMonth + 1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
          const isToday    = key === todayKey;
          const isSelected = key === selectedKey;
          const statuses   = dateStatusMap[key] ?? [];
          return (
            <button
              key={key}
              onClick={() => onSelect(new Date(`${key}T00:00:00`))}
              className={[
                "relative flex flex-col items-center justify-center w-9 h-9 mx-auto rounded-full text-xs font-medium transition-all",
                isSelected ? "bg-[#E41E6A] text-white shadow-md shadow-[#E41E6A]/30" : "",
                isToday && !isSelected ? "border border-[#E41E6A] text-[#E41E6A]" : "",
                !isSelected && !isToday ? "text-white/80 hover:bg-white/5" : "",
              ].join(" ")}
            >
              {day}
              {statuses.length > 0 && (
                <span className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white" : getCalendarDotClass(statuses)}`} />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-5 pt-4 border-t border-white/5 flex flex-col gap-2">
        {[
          { color: "bg-blue-500",   label: "Pending"     },
          { color: "bg-[#E41E6A]", label: "In Progress" },
          { color: "bg-green-500",  label: "Completed"   },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${l.color}`} />
            <span className="text-xs text-white/60">{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── APPOINTMENTS PANEL ───────────────────────────────────────────────────────

function AppointmentsPanel({
  selectedDate, appointments, onViewDetails,
}: {
  selectedDate: Date;
  appointments: Appointment[];
  onViewDetails: (a: Appointment) => void;
}) {
  return (
    <div className="bg-[#121212] rounded-2xl border border-white/5 p-5 flex flex-col min-h-[420px]">
      <div className="mb-4">
        <h2 className="text-sm font-bold text-white">
          Appointments for{" "}
          <span className="text-[#E41E6A]">{format(selectedDate, "MMM dd, yyyy")}</span>
        </h2>
        <p className="text-xs text-white/40 mt-0.5">
          {appointments.length} appointment{appointments.length !== 1 ? "s" : ""} scheduled
        </p>
      </div>

      {appointments.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-white/40">No appointments for this date</p>
        </div>
      ) : (
        <div className="space-y-3 overflow-y-auto">
          {appointments.map(a => (
            <div key={a.id} className="bg-white/[0.03] rounded-xl p-4 border border-white/5 hover:border-[#E41E6A]/30 transition-all">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <p className="text-sm font-semibold text-white">{a.service || "N/A"}</p>
                  <p className="text-xs text-white/40 mt-0.5">{a.customerName} · {a.vehicle || "N/A"}</p>
                </div>
                <Badge className={getStatusBadgeClass(a.status)}>{a.status}</Badge>
              </div>
              <div className="flex flex-wrap gap-3 pt-2 border-t border-white/5">
                <span className="flex items-center gap-1 text-xs text-white/55">
                  <Clock className="w-3.5 h-3.5 text-[#E41E6A]" />{a.time}
                </span>
                <span className="flex items-center gap-1 text-xs text-white/55">
                  <CreditCard className="w-3.5 h-3.5 text-green-400" />
                  ₱{a.totalAmount?.toLocaleString?.() ?? a.totalAmount}
                </span>
                <button
                  onClick={() => onViewDetails(a)}
                  className="ml-auto text-xs font-medium text-sky-400 hover:text-sky-300 transition-colors"
                >
                  View
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── SHARED FORM COMPONENTS ───────────────────────────────────────────────────

function CustomerSelect({
  value, onChange, customers,
}: {
  value: string;
  onChange: (id: string) => void;
  customers: Customer[];
}) {
  const selected = customers.find(c => c.id === value);
  return (
    <div className="space-y-2">
      <Label className="text-white/70">Customer *</Label>
      <div className="relative">
        <select
          className={selectCls}
          value={value}
          onChange={e => onChange(e.target.value)}
        >
          <option value="" disabled className="bg-[#0a0a0a]">
            {customers.length === 0 ? "Loading customers..." : "Select a customer"}
          </option>
          {customers.map(c => (
            <option key={c.id} value={c.id} className="bg-[#0a0a0a]">
              {c.name}{c.vehicle ? ` — ${c.vehicle}` : ""}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
      </div>
      {selected?.vehicle && (
        <p className="text-white/40 text-xs px-1">Vehicle: {selected.vehicle}</p>
      )}
    </div>
  );
}

function ServiceSelect({
  value, onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-white/70">Service</Label>
      <div className="relative">
        <select
          className={selectCls}
          value={value}
          onChange={e => onChange(e.target.value)}
        >
          <option value="" className="bg-[#0a0a0a]">Select a service</option>
          {SERVICE_OPTIONS.map(s => (
            <option key={s} value={s} className="bg-[#0a0a0a]">{s}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
      </div>
    </div>
  );
}

// ─── EMPTY FORM STATES ────────────────────────────────────────────────────────

const emptyNew = {
  customerId:  "",
  date:        "",
  time:        "",
  service:     "",
  totalAmount: "",
};

const emptyEdit = {
  id:          "",
  customerId:  "",
  date:        "",
  time:        "",
  service:     "",
  totalAmount: "",
  status:      "Pending" as Appointment["status"],
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [customers,    setCustomers]    = useState<Customer[]>([]);
  const [isLoading,    setIsLoading]    = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Modal open states
  const [viewDetailsOpen,     setViewDetailsOpen]     = useState(false);
  const [newAppointmentOpen,  setNewAppointmentOpen]  = useState(false);
  const [editAppointmentOpen, setEditAppointmentOpen] = useState(false);

  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [newForm,  setNewForm]  = useState(emptyNew);
  const [editForm, setEditForm] = useState(emptyEdit);

  // ── Fetch ────────────────────────────────────────────────────────────────

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [aptsData, custsData] = await Promise.all([
        getAppointments(),
        getCustomers(),
      ]);
      setAppointments(aptsData);
      setCustomers(custsData);
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleViewDetails = (a: Appointment) => {
    setSelectedAppointment(a);
    setViewDetailsOpen(true);
  };

  const handleOpenEdit = (a: Appointment) => {
    setEditForm({
      id:          a.id,
      customerId:  a.customerId,
      date:        toDateOnly(a.date),
      time:        a.time ?? "",
      service:     a.service ?? "",
      totalAmount: String(a.totalAmount ?? ""),
      status:      a.status,
    });
    setEditAppointmentOpen(true);
  };


  const handleArchive = async (id: string) => {
    try {
      await updateAppointmentStatus(id, "Cancelled");
      setAppointments(prev =>
        prev.map(a => a.id === id ? { ...a, status: "Cancelled" } : a)
      );
      setEditAppointmentOpen(false);
    } catch (err) {
      console.error(err);
      alert("Failed to archive appointment.");
    }
  };

  // CREATE
  const handleAddAppointment = async () => {
  if (!newForm.customerId || !newForm.date || !newForm.time || !newForm.totalAmount) {
    alert("Please fill in all required fields (Customer, Date, Time, Total Amount).");
    return;
  }
  setIsSubmitting(true);
  try {
    const created = await createAppointment({   // now returns Appointment
      customerId:  newForm.customerId,
      service:     newForm.service || "N/A",
      date:        newForm.date,
      time:        newForm.time,
      totalAmount: parseFloat(newForm.totalAmount),
    });
    // Optimistic insert — no full re-fetch needed
    setAppointments(prev => [...prev, created]);
    setNewAppointmentOpen(false);
    setNewForm(emptyNew);
  } catch (err: any) {
    alert(`Failed to create appointment: ${err.message}`);
  } finally {
    setIsSubmitting(false);
  }
};
  // SAVE EDIT
  const handleMarkComplete = async (id: string) => {
  try {
    const updated = await updateAppointmentStatus(id, "Completed"); // now returns Appointment
    setAppointments(prev => prev.map(a => a.id === id ? updated : a));
    if (selectedAppointment?.id === id) setSelectedAppointment(updated);
  } catch (err) {
    console.error(err);
    alert("Failed to update status.");
  }
};

const handleSaveEdit = async () => {
  if (!editForm.customerId || !editForm.date || !editForm.time || !editForm.totalAmount) {
    alert("Please fill in all required fields.");
    return;
  }
  setIsSubmitting(true);
  try {
    const updated = await updateAppointment(editForm.id, {   // now returns Appointment
      customerId:  editForm.customerId,
      service:     editForm.service,
      date:        editForm.date,
      time:        editForm.time,
      totalAmount: parseFloat(editForm.totalAmount),
      status:      editForm.status,
    });
    setAppointments(prev => prev.map(a => a.id === updated.id ? updated : a));
    setEditAppointmentOpen(false);
  } catch (err: any) {
    alert(`Failed to save changes: ${err.message}`);
  } finally {
    setIsSubmitting(false);
  }
};

  // ── Derived data ──────────────────────────────────────────────────────────

  const selectedDateKey = formatDateKey(selectedDate);

  const todaysAppointments = useMemo(() =>
    appointments
      .filter(a => toDateOnly(a.date) === selectedDateKey)
      .sort((a, b) => parseTimeForSort(a.time) - parseTimeForSort(b.time)),
  [appointments, selectedDateKey]);

  const allAppointments = useMemo(() =>
    [...appointments].sort((a, b) => {
      const dc =
        new Date(`${toDateOnly(a.date)}T00:00:00`).getTime() -
        new Date(`${toDateOnly(b.date)}T00:00:00`).getTime();
      return dc !== 0 ? dc : parseTimeForSort(a.time) - parseTimeForSort(b.time);
    }),
  [appointments]);

  const dateStatusMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const a of appointments) {
      const key = toDateOnly(a.date);
      if (!key) continue;
      if (!map[key]) map[key] = [];
      map[key].push(a.status);
    }
    return map;
  }, [appointments]);

  const completedCount = appointments.filter(a => a.status === "Completed").length;
  const pendingCount   = appointments.filter(a => a.status !== "Completed").length;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-full bg-[#0B0B0B] p-4 md:p-6 space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Appointments</h1>
          <p className="text-white/50 text-sm mt-1">{format(new Date(), "EEEE, MMMM dd, yyyy")}</p>
        </div>
        <Button
          onClick={() => setNewAppointmentOpen(true)}
          className="self-start sm:self-auto inline-flex items-center gap-2 bg-[#E41E6A] hover:bg-[#c41559] text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-[#E41E6A]/25"
        >
          <Plus className="w-4 h-4" />New Appointment
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: "Selected Day",       value: todaysAppointments.length,              sub: "Appointments listed",     subColor: ""               },
          { label: "Total Appointments", value: isLoading ? "..." : appointments.length, sub: "All scheduled",          subColor: ""               },
          { label: "Completed",          value: isLoading ? "..." : completedCount,      sub: "Finished services",      subColor: "text-green-400" },
          { label: "Pending",            value: isLoading ? "..." : pendingCount,        sub: "Scheduled & In Progress", subColor: ""              },
        ].map(s => (
          <Card key={s.label} className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-white/70">{s.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-white text-2xl">{s.value}</div>
              <p className={`text-xs mt-1 ${s.subColor || "text-white/50"}`}>{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Calendar + Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4">
        <MiniCalendar
          selectedDate={selectedDate}
          onSelect={setSelectedDate}
          dateStatusMap={dateStatusMap}
        />
        <AppointmentsPanel
          selectedDate={selectedDate}
          appointments={todaysAppointments}
          onViewDetails={handleViewDetails}
        />
      </div>

      {/* All Appointments Table */}
      <div className="bg-[#121212] rounded-2xl border border-white/5 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5">
          <h2 className="text-sm font-bold text-white">All Appointments</h2>
          <p className="text-xs text-white/40 mt-0.5">{appointments.length} total records</p>
        </div>

        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
          <Table className="w-full">
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-white/60">Date</TableHead>
                <TableHead className="text-white/60">Customer</TableHead>
                <TableHead className="text-white/60">Service</TableHead>
                <TableHead className="text-white/60">Vehicle</TableHead>
                <TableHead className="text-white/60">Status</TableHead>
                <TableHead className="text-white/60 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow className="border-white/5">
                  <TableCell colSpan={6} className="text-center text-white/40 py-10">
                    Loading appointments...
                  </TableCell>
                </TableRow>
              ) : allAppointments.length === 0 ? (
                <TableRow className="border-white/5">
                  <TableCell colSpan={6} className="text-center text-white/40 py-10">
                    No appointments found.
                  </TableCell>
                </TableRow>
              ) : allAppointments.map(a => (
                <TableRow key={a.id} className="border-white/5 hover:bg-white/[0.03]">
                  <TableCell className="text-white">
                    <div className="flex flex-col">
                      <span className="text-sm">{formatShortDate(a.date)}</span>
                      <span className="text-xs text-white/40">{a.time}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-white">{a.customerName}</TableCell>
                  <TableCell className="text-white">{a.service || "N/A"}</TableCell>
                  <TableCell className="text-white/70">{a.vehicle || "N/A"}</TableCell>
                  <TableCell>
                    <Badge className={getStatusBadgeClass(a.status)}>{a.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button size="sm" variant="outline"
                        className="border-white/10 text-white hover:bg-white/10"
                        onClick={() => handleOpenEdit(a)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="outline"
                        className="border-[#E41E6A]/30 text-[#E41E6A] hover:bg-[#E41E6A]/10"
                        onClick={() => handleViewDetails(a)}>
                        View
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile list */}
        <div className="sm:hidden divide-y divide-white/5">
          {isLoading ? (
            <div className="p-6 text-center text-white/40">Loading appointments...</div>
          ) : allAppointments.length === 0 ? (
            <div className="p-6 text-center text-white/40">No appointments found.</div>
          ) : allAppointments.map(a => (
            <div key={a.id} className="p-4 flex flex-col gap-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">{a.service || "N/A"}</p>
                  <p className="text-xs text-white/40">{a.customerName}</p>
                </div>
                <Badge className={getStatusBadgeClass(a.status)}>{a.status}</Badge>
              </div>
              <p className="text-xs text-white/50">{formatShortDate(a.date)} · {a.time}</p>
              <p className="text-xs text-white/50">{a.vehicle || "N/A"}</p>
              <div className="pt-1 flex gap-2">
                <Button size="sm" variant="outline"
                  className="border-white/10 text-white hover:bg-white/10"
                  onClick={() => handleOpenEdit(a)}>
                  Edit
                </Button>
                <Button size="sm" variant="outline"
                  className="border-[#E41E6A]/30 text-[#E41E6A] hover:bg-[#E41E6A]/10"
                  onClick={() => handleViewDetails(a)}>
                  View
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── VIEW DETAILS MODAL ──────────────────────────────────────────────── */}
      {viewDetailsOpen && selectedAppointment && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center backdrop-blur-sm p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.8)" }}>
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">

            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white">Appointment Details</h2>
                <p className="text-xs text-white/40 mt-1">{formatShortDate(selectedAppointment.date)}</p>
              </div>
              <button onClick={() => setViewDetailsOpen(false)} className="text-white/50 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <h3 className="text-white/60 text-sm mb-3">Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: "Date",     value: formatShortDate(selectedAppointment.date) },
                    { label: "Time",     value: selectedAppointment.time                  },
                    { label: "Customer", value: selectedAppointment.customerName          },
                    { label: "Vehicle",  value: selectedAppointment.vehicle || "N/A"      },
                  ].map(f => (
                    <div key={f.label}>
                      <p className="text-white/40 text-xs">{f.label}</p>
                      <p className="text-white">{f.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <h3 className="text-white/60 text-sm mb-2">Service</h3>
                <p className="text-white">{selectedAppointment.service || "N/A"}</p>
              </div>

              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <h3 className="text-white/60 text-sm mb-2">Total Amount</h3>
                <p className="text-[#E41E6A] text-xl">
                  ₱{selectedAppointment.totalAmount?.toLocaleString?.() ?? selectedAppointment.totalAmount}
                </p>
              </div>

              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <h3 className="text-white/60 text-sm mb-2">Status</h3>
                <div className="flex items-center justify-between gap-3">
                  <Badge className={getStatusBadgeClass(selectedAppointment.status)}>
                    {selectedAppointment.status}
                  </Badge>
                  {selectedAppointment.status !== "Completed" && (
                    <Button size="sm"
                      className="bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30"
                      onClick={() => handleMarkComplete(selectedAppointment.id)}>
                      <CheckCircle2 className="w-4 h-4 mr-1" />Mark as Complete
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end">
              <Button variant="outline" className="border-white/10 text-white hover:bg-white/10"
                onClick={() => setViewDetailsOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── NEW APPOINTMENT MODAL ───────────────────────────────────────────── */}
      {newAppointmentOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center backdrop-blur-sm p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.8)" }}>
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">

            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white">New Appointment</h2>
                <p className="text-xs text-white/40 mt-1">Fill in the appointment details</p>
              </div>
              <button onClick={() => setNewAppointmentOpen(false)} className="text-white/50 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <CustomerSelect
                value={newForm.customerId}
                onChange={id => setNewForm({ ...newForm, customerId: id })}
                customers={customers}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white/70">Date *</Label>
                  <input type="date" className={`${inputCls} [color-scheme:dark]`}
                    value={newForm.date}
                    onChange={e => setNewForm({ ...newForm, date: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/70">Time *</Label>
                  <input type="time" className={`${inputCls} [color-scheme:dark]`}
                    value={newForm.time}
                    onChange={e => setNewForm({ ...newForm, time: e.target.value })} />
                </div>
              </div>

              <ServiceSelect
                value={newForm.service}
                onChange={v => setNewForm({ ...newForm, service: v })}
              />

              <div className="space-y-2">
                <Label className="text-white/70">Total Amount (₱) *</Label>
                <input type="number" placeholder="0" className={inputCls}
                  value={newForm.totalAmount}
                  onChange={e => setNewForm({ ...newForm, totalAmount: e.target.value })} />
              </div>
            </div>

            <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3">
              <Button variant="outline" className="border-white/10 text-white hover:bg-white/10"
                onClick={() => setNewAppointmentOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                className="bg-gradient-to-r from-[#E41E6A] to-pink-600 text-white border-none hover:opacity-90"
                onClick={handleAddAppointment} disabled={isSubmitting}>
                {isSubmitting ? "Adding..." : "Add Appointment"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT APPOINTMENT MODAL ──────────────────────────────────────────── */}
      {editAppointmentOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center backdrop-blur-sm p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.8)" }}>
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">

            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white">Edit Appointment</h2>
                <p className="text-xs text-white/40 mt-1">Update appointment details</p>
              </div>
              <button onClick={() => setEditAppointmentOpen(false)} className="text-white/50 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <CustomerSelect
                value={editForm.customerId}
                onChange={id => setEditForm({ ...editForm, customerId: id })}
                customers={customers}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white/70">Date</Label>
                  <input type="date" className={`${inputCls} [color-scheme:dark]`}
                    value={editForm.date}
                    onChange={e => setEditForm({ ...editForm, date: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/70">Time</Label>
                  <input type="time" className={`${inputCls} [color-scheme:dark]`}
                    value={editForm.time}
                    onChange={e => setEditForm({ ...editForm, time: e.target.value })} />
                </div>
              </div>

              <ServiceSelect
                value={editForm.service}
                onChange={v => setEditForm({ ...editForm, service: v })}
              />

              <div className="space-y-2">
                <Label className="text-white/70">Total Amount (₱)</Label>
                <input type="number" className={inputCls}
                  value={editForm.totalAmount}
                  onChange={e => setEditForm({ ...editForm, totalAmount: e.target.value })} />
              </div>

              <div className="space-y-2">
                <Label className="text-white/70">Status</Label>
                <div className="relative">
                  <select className={selectCls}
                    value={editForm.status}
                    onChange={e => setEditForm({
                      ...editForm,
                      status: e.target.value as Appointment["status"],
                    })}>
                    {STATUS_OPTIONS.map(s => (
                      <option key={s} value={s} className="bg-[#0a0a0a]">{s}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-white/10 bg-white/5 flex justify-between items-center gap-3">
              <Button variant="outline"
                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                onClick={() => handleArchive(editForm.id)}
                disabled={isSubmitting}>
                Archive
              </Button>
              <div className="flex gap-3">
                <Button variant="outline" className="border-white/10 text-white hover:bg-white/10"
                  onClick={() => setEditAppointmentOpen(false)} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button
                  className="bg-gradient-to-r from-[#E41E6A] to-pink-600 text-white border-none hover:opacity-90"
                  onClick={handleSaveEdit} disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Appointments;