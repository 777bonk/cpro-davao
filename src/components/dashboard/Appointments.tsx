import { useState, useEffect } from "react";
import { format } from "date-fns";
import { CalendarIcon, Plus, X, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../dashboard-ui/card";
import { Badge } from "../dashboard-ui/badge";
import { Button } from "../dashboard-ui/button";
import { Calendar } from "../dashboard-ui/calendar";
import { Label } from "../dashboard-ui/label";
import { Input } from "../dashboard-ui/input";
import { Textarea } from "../dashboard-ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../dashboard-ui/table";
import { getAppointments, createAppointment, updateAppointmentStatus, Appointment } from "../../services/appointments";

export function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
  // Modal States
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [newAppointmentOpen, setNewAppointmentOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  
  // Prevention State for Double Clicks
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form State
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

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
  };

  // ROBUST DATE FILTER: Strips out any timezone data (the 'T' and everything after it) from Supabase
  const todaysAppointments = selectedDate 
    ? appointments.filter(apt => apt.date && apt.date.split('T')[0] === formatDate(selectedDate))
    : appointments.filter(apt => apt.date && apt.date.split('T')[0] === formatDate(new Date()));

  const handleViewDetails = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setViewDetailsOpen(true);
  };

  const handleMarkComplete = async (id: string) => {
    try {
      await updateAppointmentStatus(id, "Completed");
      
      setAppointments(appointments.map(apt => 
        apt.id === id ? { ...apt, status: "Completed" as const } : apt
      ));
      
      if (selectedAppointment && selectedAppointment.id === id) {
        setSelectedAppointment({ ...selectedAppointment, status: "Completed" });
      }
    } catch (error) {
      console.error("Failed to update status", error);
      alert("Failed to update status in database.");
    }
  };

  const handleAddAppointment = async () => {
    if (!newAppointment.date || !newAppointment.time || !newAppointment.customerName || !newAppointment.totalAmount) {
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
        date: "", time: "", customerName: "", vehicle: "", service: "", procedures: "", paymentInfo: "", totalAmount: "",
      });
    } catch (error: any) {
      console.error("Failed to add appointment", error);
      alert(`Database Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const completedCount = appointments.filter(a => a.status === "Completed").length;
  const pendingCount = appointments.filter(a => a.status !== "Completed").length;
  const todayCount = todaysAppointments.length;

  return (
    <div className="appointments-page space-y-6">
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
      <div className="grid grid-cols-4 gap-4">
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
            <div className="text-white text-2xl">{isLoading ? '...' : appointments.length}</div>
            <p className="text-xs text-white/50 mt-1">All scheduled</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur min-w-0 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white/70">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-white text-2xl">{isLoading ? '...' : completedCount}</div>
            <p className="text-xs text-green-400 mt-1">Finished services</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur min-w-0 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white/70">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-white text-2xl">{isLoading ? '...' : pendingCount}</div>
            <p className="text-xs text-white/50 mt-1">Scheduled & In Progress</p>
          </CardContent>
        </Card>
      </div>

      {/* Calendar and Appointments */}
      <div className="grid grid-cols-2 gap-6 w-full">
        {/* LEFT SIDE: CALENDAR */}
        <Card className="bg-[#111111] border-white/5 rounded-2xl p-4">
          <CardHeader className="p-0 mb-4">
            <CardTitle className="text-white text-lg font-medium">Calendar View</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              classNames={{
                months: "w-full",
                month: "space-y-4",
                caption: "flex justify-center pt-1 relative items-center mb-4",
                caption_label: "text-sm font-medium text-white",
                nav: "space-x-1 flex items-center",
                nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                table: "w-full border-collapse space-y-1",
                head_row: "flex w-full mt-2",
                head_cell: "text-gray-500 rounded-md w-9 font-normal text-[0.8rem] flex-1 text-center",
                row: "flex w-full mt-2",
                cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 flex-1",
                day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-white/10 rounded-lg transition-all",
                day_selected: "bg-white text-black font-bold hover:bg-white hover:text-black focus:bg-white focus:text-black",
                day_today: "border border-white/20",
                day_outside: "text-white/20 opacity-50",
              }}
            />
            
            {/* Figma Style Legend */}
            <div className="mt-8 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-[#10B981]"></div>
                <span className="text-white/70 text-sm">Completed</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-[#E41E6A]"></div>
                <span className="text-white/70 text-sm">In Progress</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-[#3B82F6]"></div>
                <span className="text-white/70 text-sm">Scheduled</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* RIGHT SIDE: SCHEDULE LIST */}
        <Card className="bg-[#121212] border-white/5">
          <CardHeader>
            <CardTitle className="text-white text-lg">
              Schedule for {selectedDate ? format(selectedDate, 'MM/dd/yyyy') : '—'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center text-white/50 py-8">Loading schedule...</div>
            ) : (
              <Table className="table-fixed w-full">
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
                    todaysAppointments
                      // Sort by time roughly
                      .sort((a, b) => a.time.localeCompare(b.time))
                      .map((apt) => (
                      <TableRow key={apt.id} className="border-white/10 hover:bg-white/5">
                        <TableCell className="text-white">{apt.time}</TableCell>
                        <TableCell className="text-white truncate">{apt.customerName}</TableCell>
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
            )}
          </CardContent>
        </Card>
      </div>

      {/* =========================================
          1. VIEW DETAILS MODAL
          ========================================= */}
      {viewDetailsOpen && selectedAppointment && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-gradient-to-br from-white/5 to-[#E41E6A]/10 border border-[#E41E6A]/50 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Appointment Details</h2>
              <button onClick={() => setViewDetailsOpen(false)} className="text-white/50 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
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
            <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end">
               <Button variant="outline" className="border-white/10 text-white hover:bg-white/10" onClick={() => setViewDetailsOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================
          2. NEW APPOINTMENT MODAL
          ========================================= */}
      {newAppointmentOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-gradient-to-br from-white/5 to-[#E41E6A]/10 border border-[#E41E6A]/50 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">New Appointment</h2>
              <button onClick={() => setNewAppointmentOpen(false)} className="text-white/50 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white/70">Date *</Label>
                  <input
                    type="date"
                    className="w-full px-4 h-10 border border-white/10 bg-white/5 rounded-md focus:outline-none focus:border-[#E41E6A] text-white [color-scheme:dark]"
                    value={newAppointment.date}
                    onChange={(e) => setNewAppointment({ ...newAppointment, date: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-white/70">Time *</Label>
                  <input
                    type="time"
                    className="w-full px-4 h-10 border border-white/10 bg-white/5 rounded-md focus:outline-none focus:border-[#E41E6A] text-white [color-scheme:dark]"
                    value={newAppointment.time}
                    onChange={(e) => setNewAppointment({ ...newAppointment, time: e.target.value })}
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
                  onChange={(e) => setNewAppointment({ ...newAppointment, customerName: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white/70">Vehicle</Label>
                <input
                  type="text"
                  placeholder="Vehicle model"
                  className="w-full px-4 h-10 border border-white/10 bg-white/5 rounded-md focus:outline-none focus:border-[#E41E6A] text-white"
                  value={newAppointment.vehicle}
                  onChange={(e) => setNewAppointment({ ...newAppointment, vehicle: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white/70">Service</Label>
                <input
                  type="text"
                  placeholder="Service type"
                  className="w-full px-4 h-10 border border-white/10 bg-white/5 rounded-md focus:outline-none focus:border-[#E41E6A] text-white"
                  value={newAppointment.service}
                  onChange={(e) => setNewAppointment({ ...newAppointment, service: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white/70">Procedures</Label>
                <Textarea
                  placeholder="List of procedures"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/50 focus:border-[#E41E6A] focus:ring-[#E41E6A]"
                  value={newAppointment.procedures}
                  onChange={(e) => setNewAppointment({ ...newAppointment, procedures: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white/70">Payment Info</Label>
                <input
                  type="text"
                  placeholder="Payment status"
                  className="w-full px-4 h-10 border border-white/10 bg-white/5 rounded-md focus:outline-none focus:border-[#E41E6A] text-white"
                  value={newAppointment.paymentInfo}
                  onChange={(e) => setNewAppointment({ ...newAppointment, paymentInfo: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white/70">Total Amount (₱) *</Label>
                <input
                  type="number"
                  placeholder="0"
                  className="w-full px-4 h-10 border border-white/10 bg-white/5 rounded-md focus:outline-none focus:border-[#E41E6A] text-white"
                  value={newAppointment.totalAmount}
                  onChange={(e) => setNewAppointment({ ...newAppointment, totalAmount: e.target.value })}
                />
              </div>
            </div>
            <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3">
              <Button variant="outline" className="border-white/10 text-white hover:bg-white/10" onClick={() => setNewAppointmentOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button className="bg-gradient-to-r from-[#E41E6A] to-pink-600 text-white border-none hover:opacity-90" onClick={handleAddAppointment} disabled={isSubmitting}>
                {isSubmitting ? "Adding..." : "Add Appointment"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}