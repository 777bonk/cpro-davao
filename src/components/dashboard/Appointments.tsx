import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  CalendarIcon,
  Plus,
  X,
  CheckCircle2,
  ChevronDown,
  Clock,
  Car,
  User,
  FileText,
  CreditCard,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "../dashboard-ui/card";
import { Badge } from "../dashboard-ui/badge";
import { Button } from "../dashboard-ui/button";
import { Calendar } from "../dashboard-ui/calendar";
import { Label } from "../dashboard-ui/label";
import { Input } from "../dashboard-ui/input";
import { Textarea } from "../dashboard-ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../dashboard-ui/table";

import {
  getAppointments,
  createAppointment,
  updateAppointmentStatus,
  Appointment,
} from "../../services/appointments";

type AppointmentStatus = "Scheduled" | "In Progress" | "Completed" | "Archived";
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function toDateOnly(value?: string) {
  return value?.split("T")[0] ?? "";
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatShortDate(dateString?: string) {
  if (!dateString) return "—";
  const parsed = new Date(`${toDateOnly(dateString)}T00:00:00`);
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getStatusBadgeClass(status: string) {
  if (status === "Completed") {
    return "bg-green-500/15 text-green-400 border border-green-500/30";
  }
  if (status === "In Progress") {
    return "bg-[#E41E6A]/15 text-[#E41E6A] border border-[#E41E6A]/30";
  }
  return "bg-blue-500/15 text-blue-400 border border-blue-500/30";
}

function getCalendarDotClass(statuses: string[]) {
  if (statuses.includes("In Progress")) return "bg-[#E41E6A]";
  if (statuses.includes("Scheduled")) return "bg-blue-500";
  if (statuses.includes("Completed")) return "bg-green-500";
  return "bg-white/40";
}

function parseTimeForSort(time?: string) {
  if (!time) return 0;

  if (time.includes("AM") || time.includes("PM")) {
    const [clock, meridiem] = time.split(" ");
    const [rawHours, rawMinutes] = clock.split(":").map(Number);
    let hours = rawHours;

    if (meridiem === "PM" && hours !== 12) hours += 12;
    if (meridiem === "AM" && hours === 12) hours = 0;

    return hours * 60 + rawMinutes;
  }

  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function MiniCalendar({
  selectedDate,
  onSelect,
  dateStatusMap,
}: {
  selectedDate: Date;
  onSelect: (date: Date) => void;
  dateStatusMap: Record<string, string[]>;
}) {
  const [viewMonth, setViewMonth] = useState(selectedDate.getMonth());
  const [viewYear, setViewYear] = useState(selectedDate.getFullYear());

  useEffect(() => {
    setViewMonth(selectedDate.getMonth());
    setViewYear(selectedDate.getFullYear());
  }, [selectedDate]);

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const todayKey = formatDateKey(new Date());
  const selectedKey = formatDateKey(selectedDate);

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  while (cells.length % 7 !== 0) cells.push(null);

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  return (
    <div className="bg-[#111111] border border-white/5 rounded-2xl p-5">
      <div className="mb-4">
        <h2 className="text-sm font-bold text-white">Calendar</h2>
        <p className="text-xs text-white/40 mt-0.5">
          Select a date to filter appointments
        </p>
      </div>

      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors text-white/70"
        >
          ‹
        </button>
        <span className="text-sm font-semibold text-white">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>
        <button
          onClick={nextMonth}
          className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors text-white/70"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {DAY_NAMES.map((day) => (
          <div
            key={day}
            className="text-center text-[10px] font-semibold text-white/35 py-1"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, index) => {
          if (!day) return <div key={`empty-${index}`} />;

          const key = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(
            day
          ).padStart(2, "0")}`;
          const isToday = key === todayKey;
          const isSelected = key === selectedKey;
          const statuses = dateStatusMap[key] ?? [];

          return (
            <button
              key={key}
              onClick={() => onSelect(new Date(`${key}T00:00:00`))}
              className={[
                "relative flex flex-col items-center justify-center w-9 h-9 mx-auto rounded-full text-xs font-medium transition-all",
                isSelected
                  ? "bg-[#E41E6A] text-white shadow-md shadow-[#E41E6A]/30"
                  : "",
                isToday && !isSelected ? "border border-[#E41E6A] text-[#E41E6A]" : "",
                !isSelected && !isToday ? "text-white/80 hover:bg-white/5" : "",
              ].join(" ")}
            >
              {day}
              {statuses.length > 0 && (
                <span
                  className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${
                    isSelected ? "bg-white" : getCalendarDotClass(statuses)
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-5 pt-4 border-t border-white/5 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          <span className="text-xs text-white/60">Scheduled</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#E41E6A]" />
          <span className="text-xs text-white/60">In Progress</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-xs text-white/60">Completed</span>
        </div>
      </div>
    </div>
  );
}

function AppointmentsPanel({
  selectedDate,
  appointments,
  onViewDetails,
}: {
  selectedDate: Date;
  appointments: Appointment[];
  onViewDetails: (appointment: Appointment) => void;
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
        <div className="flex-1 flex items-center justify-center text-center">
          <p className="text-sm text-white/40">No appointments for this date</p>
        </div>
      ) : (
        <div className="space-y-3 overflow-y-auto">
          {appointments.map((appointment) => (
            <div
              key={appointment.id}
              className="bg-white/[0.03] rounded-xl p-4 border border-white/5 hover:border-[#E41E6A]/30 transition-all"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <p className="text-sm font-semibold text-white leading-snug">
                    {appointment.service || "N/A"}
                  </p>
                  <p className="text-xs text-white/40 mt-0.5">
                    {appointment.customerName} · {appointment.vehicle || "N/A"}
                  </p>
                </div>
                <Badge className={getStatusBadgeClass(appointment.status)}>
                  {appointment.status}
                </Badge>
              </div>

              <div className="flex flex-wrap gap-3 pt-2 border-t border-white/5">
                <span className="flex items-center gap-1 text-xs text-white/55">
                  <Clock className="w-3.5 h-3.5 text-[#E41E6A]" />
                  {appointment.time}
                </span>
                <span className="flex items-center gap-1 text-xs text-white/55">
                  <CreditCard className="w-3.5 h-3.5 text-green-400" />
                  ₱{appointment.totalAmount?.toLocaleString?.() ?? appointment.totalAmount}
                </span>
                <button
                  onClick={() => onViewDetails(appointment)}
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

export function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [newAppointmentOpen, setNewAppointmentOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const [editAppointmentOpen, setEditAppointmentOpen] = useState(false);

  const [editAppointment, setEditAppointment] = useState({
    id: "",
    date: "",
    time: "",
    customerName: "",
    vehicle: "",
    service: "",
    procedures: "",
    paymentInfo: "",
    totalAmount: "",
    status: "Scheduled",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newAppointment, setNewAppointment] = useState({
    date: "",
    time: "",
    customerName: "",
    vehicle: "",
    service: "",
    procedures: "",
    paymentInfo: "",
    totalAmount: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = await getAppointments();
      setAppointments(data);
    } catch (error) {
      console.error("Failed to fetch appointments", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setViewDetailsOpen(true);
  };

  const handleEditAppointment = (appointment: Appointment) => {
  setEditAppointment({
    id: appointment.id,
    date: appointment.date ? appointment.date.split("T")[0] : "",
    time: appointment.time || "",
    customerName: appointment.customerName || "",
    vehicle: appointment.vehicle || "",
    service: appointment.service || "",
    procedures: appointment.procedures || "",
    paymentInfo: appointment.paymentInfo || "",
    totalAmount: String(appointment.totalAmount ?? ""),
    status: appointment.status || "Scheduled",
  });

  setEditAppointmentOpen(true);
};

  const handleMarkComplete = async (id: string) => {
    try {
      await updateAppointmentStatus(id,"Completed");

      setAppointments((prev) =>
        prev.map((appointment) =>
          appointment.id === id
            ? { ...appointment, status: "Completed" as const }
            : appointment
        )
      );

      if (selectedAppointment?.id === id) {
        setSelectedAppointment({
          ...selectedAppointment,
          status: "Completed",
        });
      }
    } catch (error) {
      console.error("Failed to update status", error);
      alert("Failed to update status in database.");
    }
  };

const handleArchiveAppointment = async (id: string) => {
  try {
    await updateAppointmentStatus(id, "Archived");

    setAppointments((prev) =>
      prev.map((apt) =>
        apt.id === id ? { ...apt, status: "Archived" } : apt
      )
    );

    setEditAppointmentOpen(false);
  } catch (error) {
    console.error("Failed to archive appointment", error);
    alert("Failed to archive appointment.");
  }
};

  const handleAddAppointment = async () => {
    if (
      !newAppointment.date ||
      !newAppointment.time ||
      !newAppointment.customerName ||
      !newAppointment.totalAmount
    ) {
      alert("Please fill in all required fields (Date, Time, Name, Total Amount)");
      return;
    }

    setIsSubmitting(true);

    try {
      await createAppointment({
        date: newAppointment.date,
        time: newAppointment.time,
        customerName: newAppointment.customerName,
        vehicle: newAppointment.vehicle || "N/A",
        service: newAppointment.service || "N/A",
        procedures: newAppointment.procedures || "N/A",
        paymentInfo: newAppointment.paymentInfo || "Not Yet Paid",
        status: "Scheduled",
        totalAmount: parseFloat(newAppointment.totalAmount),
      });

      await fetchData();

      setNewAppointmentOpen(false);
      setNewAppointment({
        date: "",
        time: "",
        customerName: "",
        vehicle: "",
        service: "",
        procedures: "",
        paymentInfo: "",
        totalAmount: "",
      });
    } catch (error: any) {
      console.error("Failed to add appointment", error);
      alert(`Database Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedDateKey = formatDateKey(selectedDate);

  const todaysAppointments = useMemo(() => {
    return appointments
      .filter((appointment) => toDateOnly(appointment.date) === selectedDateKey)
      .sort((a, b) => parseTimeForSort(a.time) - parseTimeForSort(b.time));
  }, [appointments, selectedDateKey]);

  const allAppointments = useMemo(() => {
    return [...appointments].sort((a, b) => {
      const dateCompare =
        new Date(`${toDateOnly(a.date)}T00:00:00`).getTime() -
        new Date(`${toDateOnly(b.date)}T00:00:00`).getTime();

      if (dateCompare !== 0) return dateCompare;
      return parseTimeForSort(a.time) - parseTimeForSort(b.time);
    });
  }, [appointments]);

  const dateStatusMap = useMemo(() => {
    const map: Record<string, string[]> = {};

    for (const appointment of appointments) {
      const key = toDateOnly(appointment.date);
      if (!key) continue;
      if (!map[key]) map[key] = [];
      map[key].push(appointment.status);
    }

    return map;
  }, [appointments]);

  const completedCount = appointments.filter((a) => a.status === "Completed").length;
  const pendingCount = appointments.filter((a) => a.status !== "Completed").length;
  const todayCount = todaysAppointments.length;

  const todayDisplay = format(new Date(), "EEEE, MMMM dd, yyyy");

  return (
    <div className="min-h-full bg-[#0B0B0B] p-4 md:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Appointments</h1>
          <p className="text-white/50 text-sm mt-1">{todayDisplay}</p>
        </div>

        <Button
          onClick={() => setNewAppointmentOpen(true)}
          className="self-start sm:self-auto inline-flex items-center gap-2 bg-[#E41E6A] hover:bg-[#c41559] text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-[#E41E6A]/25"
        >
          <Plus className="w-4 h-4" />
          New Appointment
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur min-w-0 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white/70">Selected Day</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-white text-2xl">{todayCount}</div>
            <p className="text-xs text-white/50 mt-1">Appointments listed</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur min-w-0 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white/70">Total Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-white text-2xl">{isLoading ? "..." : appointments.length}</div>
            <p className="text-xs text-white/50 mt-1">All scheduled</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur min-w-0 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white/70">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-white text-2xl">{isLoading ? "..." : completedCount}</div>
            <p className="text-xs text-green-400 mt-1">Finished services</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur min-w-0 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white/70">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-white text-2xl">{isLoading ? "..." : pendingCount}</div>
            <p className="text-xs text-white/50 mt-1">Scheduled & In Progress</p>
          </CardContent>
        </Card>
      </div>

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

      <div className="bg-[#121212] rounded-2xl border border-white/5 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5">
          <h2 className="text-sm font-bold text-white">All Appointments</h2>
          <p className="text-xs text-white/40 mt-0.5">{appointments.length} total records</p>
        </div>

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
              ) : (
                allAppointments.map((appointment) => (
                  <TableRow
                    key={appointment.id}
                    className="border-white/5 hover:bg-white/[0.03]"
                  >
                    <TableCell className="text-white">
                      <div className="flex flex-col">
                        <span className="text-sm">{formatShortDate(appointment.date)}</span>
                        <span className="text-xs text-white/40">{appointment.time}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-white">{appointment.customerName}</TableCell>
                    <TableCell className="text-white">{appointment.service || "N/A"}</TableCell>
                    <TableCell className="text-white/70">{appointment.vehicle || "N/A"}</TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeClass(appointment.status)}>
                        {appointment.status}
                      </Badge>
                    </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-white/10 text-white hover:bg-white/10"
                        onClick={() => handleEditAppointment(appointment)}
                      >
                        Edit
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        className="border-[#E41E6A]/30 text-[#E41E6A] hover:bg-[#E41E6A]/10"
                        onClick={() => handleViewDetails(appointment)}
                      >
                        View
                      </Button>
                    </div>
                  </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="sm:hidden divide-y divide-white/5">
          {isLoading ? (
            <div className="p-6 text-center text-white/40">Loading appointments...</div>
          ) : allAppointments.length === 0 ? (
            <div className="p-6 text-center text-white/40">No appointments found.</div>
          ) : (
            allAppointments.map((appointment) => (
              <div key={appointment.id} className="p-4 flex flex-col gap-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {appointment.service || "N/A"}
                    </p>
                    <p className="text-xs text-white/40">{appointment.customerName}</p>
                  </div>
                  <Badge className={getStatusBadgeClass(appointment.status)}>
                    {appointment.status}
                  </Badge>
                </div>

                <p className="text-xs text-white/50">
                  {formatShortDate(appointment.date)} · {appointment.time}
                </p>
                <p className="text-xs text-white/50">{appointment.vehicle || "N/A"}</p>

              <div className="pt-1 flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-white/10 text-white hover:bg-white/10"
                  onClick={() => handleEditAppointment(appointment)}
                >
                  Edit
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  className="border-[#E41E6A]/30 text-[#E41E6A] hover:bg-[#E41E6A]/10"
                  onClick={() => handleViewDetails(appointment)}
                >
                  View
                </Button>
              </div>
              </div>
            ))
          )}
        </div>
      </div>

      {viewDetailsOpen && selectedAppointment && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center backdrop-blur-sm p-4"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.8)" }}
        >
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white">Appointment Details</h2>
                <p className="text-xs text-white/40 mt-1">
                  {formatShortDate(selectedAppointment.date)}
                </p>
              </div>
              <button
                onClick={() => setViewDetailsOpen(false)}
                className="text-white/50 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <h3 className="text-white/60 text-sm mb-3">Appointment Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-white/40 text-xs">Date</p>
                    <p className="text-white">{formatShortDate(selectedAppointment.date)}</p>
                  </div>
                  <div>
                    <p className="text-white/40 text-xs">Time</p>
                    <p className="text-white">{selectedAppointment.time}</p>
                  </div>
                  <div>
                    <p className="text-white/40 text-xs">Customer</p>
                    <p className="text-white">{selectedAppointment.customerName}</p>
                  </div>
                  <div>
                    <p className="text-white/40 text-xs">Vehicle</p>
                    <p className="text-white">{selectedAppointment.vehicle || "N/A"}</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <h3 className="text-white/60 text-sm mb-2">Services Availed</h3>
                <p className="text-white">{selectedAppointment.service || "N/A"}</p>
              </div>

              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <h3 className="text-white/60 text-sm mb-2">Procedures Done</h3>
                <p className="text-white">{selectedAppointment.procedures || "N/A"}</p>
              </div>

              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <h3 className="text-white/60 text-sm mb-2">Payment Info</h3>
                <p className="text-white">{selectedAppointment.paymentInfo || "Not Yet Paid"}</p>
                <p className="text-[#E41E6A] text-xl mt-2">
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
                    <Button
                      size="sm"
                      className="bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30"
                      onClick={() => handleMarkComplete(selectedAppointment.id)}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Mark as Complete
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end">
              <Button
                variant="outline"
                className="border-white/10 text-white hover:bg-white/10"
                onClick={() => setViewDetailsOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {newAppointmentOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center backdrop-blur-sm p-4"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.8)" }}
        >
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white">New Appointment</h2>
                <p className="text-xs text-white/40 mt-1">Fill in the appointment details</p>
              </div>
              <button
                onClick={() => setNewAppointmentOpen(false)}
                className="text-white/50 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white/70">Date *</Label>
                  <input
                    type="date"
                    className="w-full px-4 h-10 border border-white/10 bg-white/5 rounded-md focus:outline-none focus:border-[#E41E6A] text-white [color-scheme:dark]"
                    value={newAppointment.date}
                    onChange={(e) =>
                      setNewAppointment({ ...newAppointment, date: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white/70">Time *</Label>
                  <input
                    type="time"
                    className="w-full px-4 h-10 border border-white/10 bg-white/5 rounded-md focus:outline-none focus:border-[#E41E6A] text-white [color-scheme:dark]"
                    value={newAppointment.time}
                    onChange={(e) =>
                      setNewAppointment({ ...newAppointment, time: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-white/70">Customer Name *</Label>
                <input
                  type="text"
                  placeholder="Customer name"
                  className="w-full px-4 h-10 border border-white/10 bg-white/5 rounded-md focus:outline-none focus:border-[#E41E6A] text-white"
                  value={newAppointment.customerName}
                  onChange={(e) =>
                    setNewAppointment({
                      ...newAppointment,
                      customerName: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white/70">Vehicle</Label>
                <input
                  type="text"
                  placeholder="Vehicle model"
                  className="w-full px-4 h-10 border border-white/10 bg-white/5 rounded-md focus:outline-none focus:border-[#E41E6A] text-white"
                  value={newAppointment.vehicle}
                  onChange={(e) =>
                    setNewAppointment({ ...newAppointment, vehicle: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white/70">Service</Label>
                <input
                  type="text"
                  placeholder="Service type"
                  className="w-full px-4 h-10 border border-white/10 bg-white/5 rounded-md focus:outline-none focus:border-[#E41E6A] text-white"
                  value={newAppointment.service}
                  onChange={(e) =>
                    setNewAppointment({ ...newAppointment, service: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white/70">Procedures</Label>
                <Textarea
                  placeholder="List of procedures"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/50 focus:border-[#E41E6A] focus:ring-[#E41E6A]"
                  value={newAppointment.procedures}
                  onChange={(e) =>
                    setNewAppointment({ ...newAppointment, procedures: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white/70">Payment Info</Label>
                <input
                  type="text"
                  placeholder="Payment status"
                  className="w-full px-4 h-10 border border-white/10 bg-white/5 rounded-md focus:outline-none focus:border-[#E41E6A] text-white"
                  value={newAppointment.paymentInfo}
                  onChange={(e) =>
                    setNewAppointment({ ...newAppointment, paymentInfo: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white/70">Total Amount (₱) *</Label>
                <input
                  type="number"
                  placeholder="0"
                  className="w-full px-4 h-10 border border-white/10 bg-white/5 rounded-md focus:outline-none focus:border-[#E41E6A] text-white"
                  value={newAppointment.totalAmount}
                  onChange={(e) =>
                    setNewAppointment({ ...newAppointment, totalAmount: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3">
              <Button
                variant="outline"
                className="border-white/10 text-white hover:bg-white/10"
                onClick={() => setNewAppointmentOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                className="bg-gradient-to-r from-[#E41E6A] to-pink-600 text-white border-none hover:opacity-90"
                onClick={handleAddAppointment}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Adding..." : "Add Appointment"}
              </Button>
            </div>
          </div>
        </div>
      )}
            {editAppointmentOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center backdrop-blur-sm p-4"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.8)" }}
        >
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white">Edit Appointment</h2>
                <p className="text-xs text-white/40 mt-1">Update appointment details</p>
              </div>
              <button
                onClick={() => setEditAppointmentOpen(false)}
                className="text-white/50 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white/70">Date</Label>
                  <input
                    type="date"
                    className="w-full px-4 h-10 border border-white/10 bg-white/5 rounded-md focus:outline-none focus:border-[#E41E6A] text-white [color-scheme:dark]"
                    value={editAppointment.date}
                    onChange={(e) =>
                      setEditAppointment({ ...editAppointment, date: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white/70">Time</Label>
                  <input
                    type="time"
                    className="w-full px-4 h-10 border border-white/10 bg-white/5 rounded-md focus:outline-none focus:border-[#E41E6A] text-white [color-scheme:dark]"
                    value={editAppointment.time}
                    onChange={(e) =>
                      setEditAppointment({ ...editAppointment, time: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-white/70">Customer Name</Label>
                <input
                  type="text"
                  className="w-full px-4 h-10 border border-white/10 bg-white/5 rounded-md focus:outline-none focus:border-[#E41E6A] text-white"
                  value={editAppointment.customerName}
                  onChange={(e) =>
                    setEditAppointment({
                      ...editAppointment,
                      customerName: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white/70">Vehicle</Label>
                <input
                  type="text"
                  className="w-full px-4 h-10 border border-white/10 bg-white/5 rounded-md focus:outline-none focus:border-[#E41E6A] text-white"
                  value={editAppointment.vehicle}
                  onChange={(e) =>
                    setEditAppointment({ ...editAppointment, vehicle: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white/70">Service</Label>
                <input
                  type="text"
                  className="w-full px-4 h-10 border border-white/10 bg-white/5 rounded-md focus:outline-none focus:border-[#E41E6A] text-white"
                  value={editAppointment.service}
                  onChange={(e) =>
                    setEditAppointment({ ...editAppointment, service: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white/70">Procedures</Label>
                <Textarea
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/50 focus:border-[#E41E6A] focus:ring-[#E41E6A]"
                  value={editAppointment.procedures}
                  onChange={(e) =>
                    setEditAppointment({ ...editAppointment, procedures: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white/70">Payment Info</Label>
                <input
                  type="text"
                  className="w-full px-4 h-10 border border-white/10 bg-white/5 rounded-md focus:outline-none focus:border-[#E41E6A] text-white"
                  value={editAppointment.paymentInfo}
                  onChange={(e) =>
                    setEditAppointment({ ...editAppointment, paymentInfo: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white/70">Total Amount</Label>
                <input
                  type="number"
                  className="w-full px-4 h-10 border border-white/10 bg-white/5 rounded-md focus:outline-none focus:border-[#E41E6A] text-white"
                  value={editAppointment.totalAmount}
                  onChange={(e) =>
                    setEditAppointment({ ...editAppointment, totalAmount: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="p-6 border-t border-white/10 bg-white/5 flex justify-between items-center gap-3">
              {/* LEFT SIDE: Archive */}
              <Button
                variant="outline"
                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                onClick={() => handleArchiveAppointment(editAppointment.id)}
              >
                Archive
              </Button>

              {/* RIGHT SIDE: Cancel + Save */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="border-white/10 text-white hover:bg-white/10"
                  onClick={() => setEditAppointmentOpen(false)}
                >
                  Cancel
                </Button>

                <Button className="bg-gradient-to-r from-[#E41E6A] to-pink-600 text-white border-none hover:opacity-90">
                  Save Changes
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