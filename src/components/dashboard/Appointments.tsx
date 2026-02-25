import { useState } from "react";
import { CalendarIcon, Plus, X, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../dashboard-ui/card";
import { Badge } from "../dashboard-ui/badge";
import { Button } from "../dashboard-ui/button";
import { Calendar } from "../dashboard-ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "../dashboard-ui/dialog";
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
import { Checkbox } from "../dashboard-ui/checkbox";

interface Appointment {
  id: number;
  date: string;
  time: string;
  customerName: string;
  vehicle: string;
  service: string;
  procedures: string;
  paymentInfo: string;
  status: "Completed" | "In Progress" | "Scheduled";
  totalAmount: number;
}

const initialAppointments: Appointment[] = [
  { 
    id: 1, 
    date: "2026-02-14",
    time: "08:00 AM", 
    customerName: "John Doe", 
    vehicle: "BMW M3", 
    service: "Ceramic Coating 9H", 
    procedures: "Paint Correction, Ceramic Application, Curing",
    paymentInfo: "Paid - Cash",
    status: "Completed", 
    totalAmount: 35000 
  },
  { 
    id: 2, 
    date: "2026-02-14",
    time: "10:00 AM", 
    customerName: "Sarah Wilson", 
    vehicle: "Mercedes C-Class", 
    service: "PPF Installation", 
    procedures: "Surface Prep, PPF Application, Trimming",
    paymentInfo: "Pending",
    status: "In Progress", 
    totalAmount: 45000 
  },
  { 
    id: 3, 
    date: "2026-02-14",
    time: "02:00 PM", 
    customerName: "Mike Johnson", 
    vehicle: "Audi RS5", 
    service: "Full Detailing", 
    procedures: "Wash, Clay Bar, Polish, Wax",
    paymentInfo: "Not Yet Paid",
    status: "Scheduled", 
    totalAmount: 15000 
  },
  { 
    id: 4, 
    date: "2026-02-14",
    time: "04:30 PM", 
    customerName: "Jane Smith", 
    vehicle: "Porsche 911", 
    service: "Window Tinting", 
    procedures: "Window Prep, Tint Application",
    paymentInfo: "Not Yet Paid",
    status: "Scheduled", 
    totalAmount: 12000 
  },
];

export function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date(2026, 1, 14));
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [newAppointmentOpen, setNewAppointmentOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  
  const [newAppt, setNewAppt] = useState({
    date: "",
    time: "",
    customerName: "",
    vehicle: "",
    service: "",
    procedures: "",
    paymentInfo: "",
    totalAmount: "",
  });

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
  };

  const todaysAppointments = selectedDate 
    ? appointments.filter(apt => apt.date === formatDate(selectedDate))
    : appointments.filter(apt => apt.date === formatDate(new Date()));

  const handleViewDetails = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setViewDetailsOpen(true);
  };

  const handleMarkComplete = (id: number) => {
    setAppointments(appointments.map(apt => 
      apt.id === id ? { ...apt, status: "Completed" as const } : apt
    ));
    if (selectedAppointment && selectedAppointment.id === id) {
      setSelectedAppointment({ ...selectedAppointment, status: "Completed" });
    }
  };

  const handleAddAppointment = () => {
    if (!newAppt.date || !newAppt.time || !newAppt.customerName || !newAppt.totalAmount) {
      alert("Please fill in all required fields");
      return;
    }

    const appointment: Appointment = {
      id: appointments.length + 1,
      date: newAppt.date,
      time: newAppt.time,
      customerName: newAppt.customerName,
      vehicle: newAppt.vehicle || "N/A",
      service: newAppt.service || "N/A",
      procedures: newAppt.procedures || "N/A",
      paymentInfo: newAppt.paymentInfo || "Not Yet Paid",
      status: "Scheduled",
      totalAmount: parseFloat(newAppt.totalAmount),
    };

    setAppointments([...appointments, appointment]);
    setNewAppointmentOpen(false);
    
    // Reset form
    setNewAppt({
      date: "",
      time: "",
      customerName: "",
      vehicle: "",
      service: "",
      procedures: "",
      paymentInfo: "",
      totalAmount: "",
    });
  };

  const completedCount = appointments.filter(a => a.status === "Completed").length;
  const pendingCount = appointments.filter(a => a.status !== "Completed").length;
  const todayCount = todaysAppointments.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-white text-3xl mb-2">Appointments</h1>
          <p className="text-white/60">Schedule and manage your service appointments</p>
        </div>
        <Button 
          className="bg-gradient-to-r from-[#E41E6A] to-pink-600 hover:from-[#E41E6A]/90 hover:to-pink-600/90 text-white"
          onClick={() => setNewAppointmentOpen(true)}
        >
          <CalendarIcon className="w-4 h-4 mr-2" />
          New Appointment
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white/70">Today's Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-white text-2xl">{todayCount}</div>
            <p className="text-xs text-white/50 mt-1">{completedCount} completed, {pendingCount} pending</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white/70">Total Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-white text-2xl">{appointments.length}</div>
            <p className="text-xs text-white/50 mt-1">All scheduled</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white/70">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-white text-2xl">{completedCount}</div>
            <p className="text-xs text-green-400 mt-1">Finished services</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white/70">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-white text-2xl">{pendingCount}</div>
            <p className="text-xs text-white/50 mt-1">Scheduled & In Progress</p>
          </CardContent>
        </Card>
      </div>

      {/* Calendar and Appointments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Calendar */}
        <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white">Calendar View</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              className="rounded-md border-0 text-white [&_.rdp-day_selected]:bg-[#E41E6A] [&_.rdp-day_selected]:text-white"
            />
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-white/60 text-xs">Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#E41E6A]"></div>
                <span className="text-white/60 text-xs">In Progress</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-white/60 text-xs">Scheduled</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Today's Schedule - ONLY Time, Customer Name, Total Amount, View Details */}
        <Card className="lg:col-span-2 bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white">
              {selectedDate ? `Schedule for ${selectedDate.toLocaleDateString()}` : "Today's Schedule"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-white/70">Time</TableHead>
                  <TableHead className="text-white/70">Customer Name</TableHead>
                  <TableHead className="text-white/70">Total Amount</TableHead>
                  <TableHead className="text-white/70 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {todaysAppointments.length === 0 ? (
                  <TableRow className="border-white/10">
                    <TableCell colSpan={4} className="text-center text-white/50 py-8">
                      No appointments for this date
                    </TableCell>
                  </TableRow>
                ) : (
                  todaysAppointments.map((apt) => (
                    <TableRow key={apt.id} className="border-white/10 hover:bg-white/5">
                      <TableCell className="text-white">{apt.time}</TableCell>
                      <TableCell className="text-white">{apt.customerName}</TableCell>
                      <TableCell className="text-white">₱{apt.totalAmount.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-[#E41E6A]/30 text-[#E41E6A] hover:bg-[#E41E6A]/10"
                          onClick={() => handleViewDetails(apt)}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* View Details Modal */}
      <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
        <DialogContent className="bg-gradient-to-br from-black/95 to-gray-900/95 border-white/10 text-white backdrop-blur-xl max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white text-xl flex items-center justify-between">
              Appointment Details
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewDetailsOpen(false)}
                className="text-white/70 hover:text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </Button>
            </DialogTitle>
            <DialogDescription className="sr-only">
              View complete appointment information including services, procedures, tools used, and payment details
            </DialogDescription>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4 py-4">
              {/* Appointment Details */}
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <h3 className="text-white/60 text-sm mb-3">Appointment Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-white/60 text-xs">Date</p>
                    <p className="text-white">{selectedAppointment.date}</p>
                  </div>
                  <div>
                    <p className="text-white/60 text-xs">Time</p>
                    <p className="text-white">{selectedAppointment.time}</p>
                  </div>
                  <div>
                    <p className="text-white/60 text-xs">Customer</p>
                    <p className="text-white">{selectedAppointment.customerName}</p>
                  </div>
                  <div>
                    <p className="text-white/60 text-xs">Vehicle</p>
                    <p className="text-white">{selectedAppointment.vehicle}</p>
                  </div>
                </div>
              </div>

              {/* Services Availed */}
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <h3 className="text-white/60 text-sm mb-2">Services Availed</h3>
                <p className="text-white">{selectedAppointment.service}</p>
              </div>

              {/* Procedures Done */}
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <h3 className="text-white/60 text-sm mb-2">Procedures Done</h3>
                <p className="text-white">{selectedAppointment.procedures}</p>
              </div>

              {/* Payment Info */}
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <h3 className="text-white/60 text-sm mb-2">Payment Info</h3>
                <p className="text-white">{selectedAppointment.paymentInfo}</p>
                <p className="text-[#E41E6A] text-xl mt-2">₱{selectedAppointment.totalAmount.toLocaleString()}</p>
              </div>

              {/* Status */}
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <h3 className="text-white/60 text-sm mb-2">Status</h3>
                <div className="flex items-center justify-between">
                  <Badge
                    className={
                      selectedAppointment.status === "Completed"
                        ? "bg-green-500/20 text-green-400 border-green-500/30"
                        : selectedAppointment.status === "In Progress"
                        ? "bg-[#E41E6A]/20 text-[#E41E6A] border-[#E41E6A]/30"
                        : "bg-blue-500/20 text-blue-400 border-blue-500/30"
                    }
                  >
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
          )}
        </DialogContent>
      </Dialog>

      {/* New Appointment Modal */}
      <Dialog open={newAppointmentOpen} onOpenChange={setNewAppointmentOpen}>
        <DialogContent className="bg-gradient-to-br from-black/95 to-gray-900/95 border-white/10 text-white backdrop-blur-xl max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">New Appointment</DialogTitle>
            <DialogDescription className="sr-only">
              Create a new appointment by filling out the form with date, time, customer information, and service details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date" className="text-white/70">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  className="bg-white/5 border-white/10 text-white"
                  value={newAppt.date}
                  onChange={(e) => setNewAppt({ ...newAppt, date: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="time" className="text-white/70">Time *</Label>
                <Input
                  id="time"
                  type="time"
                  className="bg-white/5 border-white/10 text-white"
                  value={newAppt.time}
                  onChange={(e) => setNewAppt({ ...newAppt, time: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerName" className="text-white/70">Customer Name *</Label>
              <Input
                id="customerName"
                placeholder="Customer name"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/50"
                value={newAppt.customerName}
                onChange={(e) => setNewAppt({ ...newAppt, customerName: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vehicle" className="text-white/70">Vehicle</Label>
              <Input
                id="vehicle"
                placeholder="Vehicle model"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/50"
                value={newAppt.vehicle}
                onChange={(e) => setNewAppt({ ...newAppt, vehicle: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="service" className="text-white/70">Service</Label>
              <Input
                id="service"
                placeholder="Service type"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/50"
                value={newAppt.service}
                onChange={(e) => setNewAppt({ ...newAppt, service: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="procedures" className="text-white/70">Procedures</Label>
              <Textarea
                id="procedures"
                placeholder="List of procedures"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/50"
                value={newAppt.procedures}
                onChange={(e) => setNewAppt({ ...newAppt, procedures: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentInfo" className="text-white/70">Payment Info</Label>
              <Input
                id="paymentInfo"
                placeholder="Payment status"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/50"
                value={newAppt.paymentInfo}
                onChange={(e) => setNewAppt({ ...newAppt, paymentInfo: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalAmount" className="text-white/70">Total Amount *</Label>
              <Input
                id="totalAmount"
                type="number"
                placeholder="0"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/50"
                value={newAppt.totalAmount}
                onChange={(e) => setNewAppt({ ...newAppt, totalAmount: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="border-white/10 text-white hover:bg-white/5"
              onClick={() => setNewAppointmentOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-gradient-to-r from-[#E41E6A] to-pink-600 hover:from-[#E41E6A]/90 hover:to-pink-600/90 text-white"
              onClick={handleAddAppointment}
            >
              Add Appointment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}