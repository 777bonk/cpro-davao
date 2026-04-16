import { useState, useEffect } from "react";
import { Users, Plus, DollarSign, Award, Clock, X, Edit } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../dashboard-ui/card";
import { Button } from "../dashboard-ui/button";
import { Badge } from "../dashboard-ui/badge";
import { Avatar, AvatarFallback } from "../dashboard-ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../dashboard-ui/table";
import { getEmployees, createEmployee, updateEmployeeAssignment, Employee } from "../../services/employees";

export function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal States
  const [addEmployeeOpen, setAddEmployeeOpen] = useState(false);
  const [viewProfileOpen, setViewProfileOpen] = useState(false);
  const [assignWorkOpen, setAssignWorkOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  
  // Form States
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    position: "",
    department: "",
    salary: "",
    status: "Active" as "Active" | "On Leave",
    performance: "Good" as "Excellent" | "Good" | "Average",
  });

  const [assignmentData, setAssignmentData] = useState({ assignment: "" });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = await getEmployees();
      setEmployees(data);
    } catch (error: any) {
      console.error("Failed to fetch employees", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddEmployee = async () => {
    if (!newEmployee.name || !newEmployee.position || !newEmployee.department) {
      alert("Please fill in all required fields (Name, Position, Department)");
      return;
    }

    try {
      const addedEmp = await createEmployee({
        name: newEmployee.name,
        position: newEmployee.position,
        department: newEmployee.department,
        salary: parseFloat(newEmployee.salary) || 0,
        status: newEmployee.status,
        performance: newEmployee.performance,
      });

      setEmployees([...employees, addedEmp]);
      setAddEmployeeOpen(false); 
      
      setNewEmployee({
        name: "", position: "", department: "", salary: "", status: "Active", performance: "Good",
      });
    } catch (error: any) {
      console.error("Failed to add employee", error);
      alert(`Database Error: ${error?.message || 'Failed to add employee to database.'}`);
    }
  };

  const handleViewProfile = (employee: Employee) => {
    setSelectedEmployee(employee);
    setViewProfileOpen(true);
  };

  const handleOpenAssignWork = (employee: Employee) => {
    setSelectedEmployee(employee);
    setAssignWorkOpen(true);
  };

  const handleAssignWork = async () => {
    if (!selectedEmployee || !assignmentData.assignment) {
      alert("Please enter assignment details");
      return;
    }

    const newAvailability = assignmentData.assignment.toLowerCase() === "none" ? "Available" : "Busy";
    
    try {
      await updateEmployeeAssignment(selectedEmployee.id, newAvailability, assignmentData.assignment);
      
      setEmployees(employees.map(emp =>
        emp.id === selectedEmployee.id
          ? { ...emp, availability: newAvailability, current_assignment: assignmentData.assignment }
          : emp
      ));

      setAssignWorkOpen(false);
      setAssignmentData({ assignment: "" });
      setSelectedEmployee(null);
    } catch (error) {
      console.error("Failed to assign work", error);
    }
  };

  const handleMarkAvailable = async (id: string) => {
    try {
      await updateEmployeeAssignment(id, "Available", "None");
      setEmployees(employees.map(emp =>
        emp.id === id ? { ...emp, availability: "Available", current_assignment: "None" } : emp
      ));
    } catch (error) {
      console.error("Failed to mark available", error);
    }
  };

  const activeEmployees = employees.filter(e => e.status === "Active").length;
  const busyEmployees = employees.filter(e => e.availability === "Busy").length;
  const totalPayroll = employees.reduce((sum, emp) => sum + Number(emp.salary), 0);

  return (
    <div className="employees-page space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-white text-3xl mb-2">Employee Management</h1>
          <p className="text-white/60">Manage your team and payroll information</p>
        </div>
        <Button 
          className="bg-gradient-to-r from-[#E41E6A] to-pink-600 hover:from-[#E41E6A]/90 hover:to-pink-600/90 text-white"
          onClick={() => setAddEmployeeOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Employee
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur min-w-0 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white/70">Total Employees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-white text-2xl">{employees.length}</div>
            <p className="text-xs text-white/50 mt-1">{activeEmployees} active</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur min-w-0 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white/70">Currently Busy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-white text-2xl">{busyEmployees}</div>
            <p className="text-xs text-white/50 mt-1">Assigned to work</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur min-w-0 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white/70">Monthly Payroll</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-white text-2xl">₱{Math.round(totalPayroll / 1000)}K</div>
            <p className="text-xs text-white/50 mt-1">Total salaries</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur min-w-0 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white/70">Available Now</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-white text-2xl">{employees.filter(e => e.availability === "Available").length}</div>
            <p className="text-xs text-green-400 mt-1">Ready for assignment</p>
          </CardContent>
        </Card>
      </div>

      {/* Currently Busy Employees */}
      {busyEmployees > 0 && (
        <Card className="bg-gradient-to-br from-[#E41E6A]/10 to-pink-600/10 border-[#E41E6A]/30 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#E41E6A]" />
              Currently Busy Employees
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="employee-split-view">
              {employees
                .filter(emp => emp.availability === "Busy")
                .map((emp) => (
                  <div key={emp.id} className="p-4 bg-white/5 rounded-lg border border-[#E41E6A]/20">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="w-12 h-12 bg-gradient-to-br from-[#E41E6A] to-pink-600">
                        <AvatarFallback className="text-white">
                          {emp.name.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-white truncate">{emp.name}</p>
                        <p className="text-white/50 text-xs">{emp.position}</p>
                      </div>
                      <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                        Busy
                      </Badge>
                    </div>
                    <div className="p-3 bg-white/5 rounded border border-white/10 mb-2">
                      <p className="text-white/60 text-xs mb-1">Current Assignment:</p>
                      <p className="text-white text-sm truncate">{emp.current_assignment}</p>
                    </div>
                    <Button
                      size="sm"
                      className="w-full bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30"
                      onClick={() => handleMarkAvailable(emp.id)}
                    >
                      Mark as Available
                    </Button>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Employee Table */}
      <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white">Employee List</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-white/50">Loading employees...</div>
          ) : employees.length === 0 ? (
            <div className="text-center py-8 text-white/50">No employees found. Add your first staff member!</div>
          ) : (
            <div className="employee-table-container">
              <Table className="table-fixed w-full">
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-white/70">Employee</TableHead>
                  <TableHead className="text-white/70">Position</TableHead>
                  <TableHead className="text-white/70">Department</TableHead>
                  <TableHead className="text-white/70">Salary</TableHead>
                  <TableHead className="text-white/70">Availability</TableHead>
                  <TableHead className="text-white/70">Assignment</TableHead>
                  <TableHead className="text-white/70">Status</TableHead>
                  <TableHead className="text-white/70">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((emp) => (
                  <TableRow key={emp.id} className="border-white/10 hover:bg-white/5">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10 bg-gradient-to-br from-[#E41E6A] to-pink-600">
                          <AvatarFallback className="text-white">
                            {emp.name.split(" ").map((n) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <p className="employee-name-cell text-white truncate">{emp.name}</p>
                      </div>
                    </TableCell>
                    <TableCell><p className="text-white/70">{emp.position}</p></TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-white/20 text-white/70">
                        {emp.department}
                      </Badge>
                    </TableCell>
                    <TableCell><p className="text-white">₱{Number(emp.salary).toLocaleString()}</p></TableCell>
                    <TableCell>
                      <Badge className={emp.availability === "Available" ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-orange-500/20 text-orange-400 border-orange-500/30"}>
                        {emp.availability}
                      </Badge>
                    </TableCell>
                    <TableCell><p className="text-white/70 text-sm max-w-[150px] truncate">{emp.current_assignment}</p></TableCell>
                    <TableCell>
                      <Badge className={emp.status === "Active" ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-orange-500/20 text-orange-400 border-orange-500/30"}>
                        {emp.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="border-[#E41E6A]/30 text-[#E41E6A] hover:bg-[#E41E6A]/10" onClick={() => handleViewProfile(emp)}>View</Button>
                        <Button size="sm" variant="outline" className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10" onClick={() => handleOpenAssignWork(emp)} disabled={emp.status === "On Leave"}>Assign</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* =========================================
          NATIVE TAILWIND OVERLAYS (MODALS)
          ========================================= */}

      {/* 1. Add Employee Modal */}
      {addEmployeeOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-gradient-to-br from-white/15 to-[#E41E6A]/5 border border-[#E41E6A]/50 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Add New Employee</h2>
              <button onClick={() => setAddEmployeeOpen(false)} className="text-white/50 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="space-y-2">
                <label className="text-sm text-white/70">Name *</label>
                <input type="text" placeholder="Employee name" className="w-full px-4 h-10 border border-white/10 bg-white/5 rounded-md focus:outline-none focus:border-[#E41E6A] text-white" value={newEmployee.name} onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-white/70">Position *</label>
                <input type="text" placeholder="Job position" className="w-full px-4 h-10 border border-white/10 bg-white/5 rounded-md focus:outline-none focus:border-[#E41E6A] text-white" value={newEmployee.position} onChange={(e) => setNewEmployee({ ...newEmployee, position: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-white/70">Department *</label>
                <input type="text" placeholder="Department" className="w-full px-4 h-10 border border-white/10 bg-white/5 rounded-md focus:outline-none focus:border-[#E41E6A] text-white" value={newEmployee.department} onChange={(e) => setNewEmployee({ ...newEmployee, department: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-white/70">Monthly Salary (₱)</label>
                <input type="number" placeholder="0" className="w-full px-4 h-10 border border-white/10 bg-white/5 rounded-md focus:outline-none focus:border-[#E41E6A] text-white" value={newEmployee.salary} onChange={(e) => setNewEmployee({ ...newEmployee, salary: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-white/70">Status</label>
                  <select className="w-full px-4 h-10 border border-white/10 bg-white/5 rounded-md focus:outline-none focus:border-[#E41E6A] text-white appearance-none" value={newEmployee.status} onChange={(e) => setNewEmployee({ ...newEmployee, status: e.target.value as any })}>
                    <option value="Active" className="bg-[#0a0a0a]">Active</option>
                    <option value="On Leave" className="bg-[#0a0a0a]">On Leave</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-white/70">Performance</label>
                  <select className="w-full px-4 h-10 border border-white/10 bg-white/5 rounded-md focus:outline-none focus:border-[#E41E6A] text-white appearance-none" value={newEmployee.performance} onChange={(e) => setNewEmployee({ ...newEmployee, performance: e.target.value as any })}>
                    <option value="Excellent" className="bg-[#0a0a0a]">Excellent</option>
                    <option value="Good" className="bg-[#0a0a0a]">Good</option>
                    <option value="Average" className="bg-[#0a0a0a]">Average</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3">
              <Button variant="outline" className="border-white/10 text-white hover:bg-white/10" onClick={() => setAddEmployeeOpen(false)}>Cancel</Button>
              <Button className="bg-gradient-to-r from-[#E41E6A] to-pink-600 text-white border-none hover:opacity-90" onClick={handleAddEmployee}>Add Employee</Button>
            </div>
          </div>
        </div>
      )}

      {/* 2. View Profile Modal */}
      {viewProfileOpen && selectedEmployee && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-gradient-to-br from-white/15 to-[#E41E6A]/5 border border-[#E41E6A]/50 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Employee Profile</h2>
              <button onClick={() => setViewProfileOpen(false)} className="text-white/50 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4 p-4 bg-white/5 rounded-lg border border-white/10">
                <Avatar className="w-16 h-16 bg-gradient-to-br from-[#E41E6A] to-pink-600">
                  <AvatarFallback className="text-white text-xl">{selectedEmployee.name.split(" ").map((n) => n[0]).join("")}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-white text-xl">{selectedEmployee.name}</p>
                  <p className="text-white/60">{selectedEmployee.position}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <p className="text-white/60 text-sm">Department</p>
                  <p className="text-white">{selectedEmployee.department}</p>
                </div>
                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <p className="text-white/60 text-sm">Monthly Salary</p>
                  <p className="text-white">₱{Number(selectedEmployee.salary).toLocaleString()}</p>
                </div>
                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <p className="text-white/60 text-sm">Performance</p>
                  <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 mt-1">{selectedEmployee.performance}</Badge>
                </div>
                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <p className="text-white/60 text-sm">Status</p>
                  <Badge className={selectedEmployee.status === "Active" ? "bg-green-500/20 text-green-400 border-green-500/30 mt-1" : "bg-orange-500/20 text-orange-400 border-orange-500/30 mt-1"}>
                    {selectedEmployee.status}
                  </Badge>
                </div>
              </div>
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <p className="text-white/60 text-sm mb-2">Availability</p>
                <Badge className={selectedEmployee.availability === "Available" ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-orange-500/20 text-orange-400 border-orange-500/30"}>
                  {selectedEmployee.availability}
                </Badge>
              </div>
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <p className="text-white/60 text-sm mb-2">Current Assignment</p>
                <p className="text-white">{selectedEmployee.current_assignment}</p>
              </div>
            </div>
            <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end">
              <Button variant="outline" className="border-white/10 text-white hover:bg-white/10" onClick={() => setViewProfileOpen(false)}>Close Profile</Button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Assign Work Modal */}
      {assignWorkOpen && selectedEmployee && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-gradient-to-br from-white/15 to-[#E41E6A]/5 border border-[#E41E6A]/50 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Assign Work</h2>
              <button onClick={() => setAssignWorkOpen(false)} className="text-white/50 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <p className="text-white/60 text-sm">Employee</p>
                <p className="text-white text-lg">{selectedEmployee.name}</p>
                <p className="text-white/50 text-sm">{selectedEmployee.position}</p>
                <Badge className={selectedEmployee.availability === "Available" ? "bg-green-500/20 text-green-400 border-green-500/30 mt-2" : "bg-orange-500/20 text-orange-400 border-orange-500/30 mt-2"}>
                  {selectedEmployee.availability}
                </Badge>
              </div>
              {selectedEmployee.current_assignment !== "None" && (
                <div className="p-3 bg-orange-500/10 rounded-lg border border-orange-500/30">
                  <p className="text-orange-400 text-sm">Current: {selectedEmployee.current_assignment}</p>
                </div>
              )}
              <div className="space-y-2">
                <label className="text-sm text-white/70">Assignment Details *</label>
                <input 
                  type="text" 
                  placeholder="Enter work assignment (type 'None' to clear)" 
                  className="w-full px-4 h-10 border border-white/10 bg-white/5 rounded-md focus:outline-none focus:border-[#E41E6A] text-white" 
                  value={assignmentData.assignment} 
                  onChange={(e) => setAssignmentData({ assignment: e.target.value })} 
                />
              </div>
            </div>
            <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3">
              <Button variant="outline" className="border-white/10 text-white hover:bg-white/10" onClick={() => { setAssignWorkOpen(false); setAssignmentData({ assignment: "" }); }}>Cancel</Button>
              <Button className="bg-gradient-to-r from-[#E41E6A] to-pink-600 text-white border-none hover:opacity-90" onClick={handleAssignWork}>Assign Work</Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}