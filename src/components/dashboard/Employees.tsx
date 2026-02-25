import { useState } from "react";
import { Users, Plus, DollarSign, Award, Clock, X, Edit } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../dashboard-ui/card";
import { Button } from "../dashboard-ui/button";
import { Badge } from "../dashboard-ui/badge";
import { Avatar, AvatarFallback } from "../dashboard-ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../dashboard-ui/table";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../dashboard-ui/select";

interface Employee {
  id: number;
  name: string;
  position: string;
  department: string;
  salary: number;
  status: "Active" | "On Leave";
  performance: "Excellent" | "Good" | "Average";
  availability: "Available" | "Busy";
  currentAssignment: string;
}

const initialEmployees: Employee[] = [
  { id: 1, name: "Carlos Reyes", position: "Lead Technician", department: "Ceramic Coating", salary: 35000, status: "Active", performance: "Excellent", availability: "Available", currentAssignment: "None" },
  { id: 2, name: "Maria Santos", position: "PPF Specialist", department: "PPF Installation", salary: 32000, status: "Active", performance: "Excellent", availability: "Busy", currentAssignment: "Mercedes C-Class PPF Installation" },
  { id: 3, name: "Juan Cruz", position: "Detailing Specialist", department: "Detailing", salary: 28000, status: "Active", performance: "Good", availability: "Busy", currentAssignment: "Audi RS5 Full Detailing" },
  { id: 4, name: "Anna Garcia", position: "Customer Service", department: "Front Desk", salary: 22000, status: "Active", performance: "Good", availability: "Available", currentAssignment: "None" },
  { id: 5, name: "Pedro Martinez", position: "Technician", department: "Window Tinting", salary: 25000, status: "On Leave", performance: "Good", availability: "Available", currentAssignment: "None" },
];

export function Employees() {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [addEmployeeOpen, setAddEmployeeOpen] = useState(false);
  const [viewProfileOpen, setViewProfileOpen] = useState(false);
  const [assignWorkOpen, setAssignWorkOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    position: "",
    department: "",
    salary: "",
    status: "Active" as "Active" | "On Leave",
    performance: "Good" as "Excellent" | "Good" | "Average",
  });

  const [assignmentData, setAssignmentData] = useState({
    assignment: "",
  });

  const handleAddEmployee = () => {
    if (!newEmployee.name || !newEmployee.position || !newEmployee.department) {
      alert("Please fill in all required fields");
      return;
    }

    const employee: Employee = {
      id: employees.length + 1,
      name: newEmployee.name,
      position: newEmployee.position,
      department: newEmployee.department,
      salary: parseFloat(newEmployee.salary) || 0,
      status: newEmployee.status,
      performance: newEmployee.performance,
      availability: "Available",
      currentAssignment: "None",
    };

    setEmployees([...employees, employee]);
    setAddEmployeeOpen(false);
    
    // Reset form
    setNewEmployee({
      name: "",
      position: "",
      department: "",
      salary: "",
      status: "Active",
      performance: "Good",
    });
  };

  const handleViewProfile = (employee: Employee) => {
    setSelectedEmployee(employee);
    setViewProfileOpen(true);
  };

  const handleOpenAssignWork = (employee: Employee) => {
    setSelectedEmployee(employee);
    setAssignWorkOpen(true);
  };

  const handleAssignWork = () => {
    if (!selectedEmployee || !assignmentData.assignment) {
      alert("Please enter assignment details");
      return;
    }

    setEmployees(employees.map(emp =>
      emp.id === selectedEmployee.id
        ? {
            ...emp,
            availability: assignmentData.assignment.toLowerCase() === "none" ? "Available" : "Busy",
            currentAssignment: assignmentData.assignment,
          }
        : emp
    ));

    setAssignWorkOpen(false);
    setAssignmentData({ assignment: "" });
    setSelectedEmployee(null);
  };

  const handleMarkAvailable = (id: number) => {
    setEmployees(employees.map(emp =>
      emp.id === id
        ? {
            ...emp,
            availability: "Available",
            currentAssignment: "None",
          }
        : emp
    ));
  };

  const activeEmployees = employees.filter(e => e.status === "Active").length;
  const busyEmployees = employees.filter(e => e.availability === "Busy").length;
  const totalPayroll = employees.reduce((sum, emp) => sum + emp.salary, 0);

  return (
    <div className="space-y-6">
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white/70">Total Employees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-white text-2xl">{employees.length}</div>
            <p className="text-xs text-white/50 mt-1">{activeEmployees} active</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white/70">Currently Busy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-white text-2xl">{busyEmployees}</div>
            <p className="text-xs text-white/50 mt-1">Assigned to work</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white/70">Monthly Payroll</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-white text-2xl">₱{Math.round(totalPayroll / 1000)}K</div>
            <p className="text-xs text-white/50 mt-1">Total salaries</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {employees
                .filter(emp => emp.availability === "Busy")
                .map((emp) => (
                  <div
                    key={emp.id}
                    className="p-4 bg-white/5 rounded-lg border border-[#E41E6A]/20"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="w-12 h-12 bg-gradient-to-br from-[#E41E6A] to-pink-600">
                        <AvatarFallback className="text-white">
                          {emp.name.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-white">{emp.name}</p>
                        <p className="text-white/50 text-xs">{emp.position}</p>
                      </div>
                      <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                        Busy
                      </Badge>
                    </div>
                    <div className="p-3 bg-white/5 rounded border border-white/10 mb-2">
                      <p className="text-white/60 text-xs mb-1">Current Assignment:</p>
                      <p className="text-white text-sm">{emp.currentAssignment}</p>
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
          <Table>
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
                      <p className="text-white">{emp.name}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-white/70">{emp.position}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-white/20 text-white/70">
                      {emp.department}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <p className="text-white">₱{emp.salary.toLocaleString()}</p>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        emp.availability === "Available"
                          ? "bg-green-500/20 text-green-400 border-green-500/30"
                          : "bg-orange-500/20 text-orange-400 border-orange-500/30"
                      }
                    >
                      {emp.availability}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <p className="text-white/70 text-sm max-w-[150px] truncate">
                      {emp.currentAssignment}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        emp.status === "Active"
                          ? "bg-green-500/20 text-green-400 border-green-500/30"
                          : "bg-orange-500/20 text-orange-400 border-orange-500/30"
                      }
                    >
                      {emp.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-[#E41E6A]/30 text-[#E41E6A] hover:bg-[#E41E6A]/10"
                        onClick={() => handleViewProfile(emp)}
                      >
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                        onClick={() => handleOpenAssignWork(emp)}
                        disabled={emp.status === "On Leave"}
                      >
                        Assign
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Employee Modal */}
      <Dialog open={addEmployeeOpen} onOpenChange={setAddEmployeeOpen}>
        <DialogContent className="bg-gradient-to-br from-black/95 to-gray-900/95 border-white/10 text-white backdrop-blur-xl max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">Add New Employee</DialogTitle>
            <DialogDescription className="sr-only">
              Add a new employee to the system by filling out their personal and employment information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white/70">Name *</Label>
              <Input
                id="name"
                placeholder="Employee name"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/50"
                value={newEmployee.name}
                onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="position" className="text-white/70">Position *</Label>
              <Input
                id="position"
                placeholder="Job position"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/50"
                value={newEmployee.position}
                onChange={(e) => setNewEmployee({ ...newEmployee, position: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="department" className="text-white/70">Department *</Label>
              <Input
                id="department"
                placeholder="Department"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/50"
                value={newEmployee.department}
                onChange={(e) => setNewEmployee({ ...newEmployee, department: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="salary" className="text-white/70">Monthly Salary</Label>
              <Input
                id="salary"
                type="number"
                placeholder="0"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/50"
                value={newEmployee.salary}
                onChange={(e) => setNewEmployee({ ...newEmployee, salary: e.target.value })}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status" className="text-white/70">Status</Label>
                <Select
                  value={newEmployee.status}
                  onValueChange={(value: "Active" | "On Leave") => setNewEmployee({ ...newEmployee, status: value })}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-white/10">
                    <SelectItem value="Active" className="text-white">Active</SelectItem>
                    <SelectItem value="On Leave" className="text-white">On Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="performance" className="text-white/70">Performance</Label>
                <Select
                  value={newEmployee.performance}
                  onValueChange={(value: "Excellent" | "Good" | "Average") => setNewEmployee({ ...newEmployee, performance: value })}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-white/10">
                    <SelectItem value="Excellent" className="text-white">Excellent</SelectItem>
                    <SelectItem value="Good" className="text-white">Good</SelectItem>
                    <SelectItem value="Average" className="text-white">Average</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="border-white/10 text-white hover:bg-white/5"
              onClick={() => setAddEmployeeOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-gradient-to-r from-[#E41E6A] to-pink-600 hover:from-[#E41E6A]/90 hover:to-pink-600/90 text-white"
              onClick={handleAddEmployee}
            >
              Add Employee
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Profile Modal */}
      <Dialog open={viewProfileOpen} onOpenChange={setViewProfileOpen}>
        <DialogContent className="bg-gradient-to-br from-black/95 to-gray-900/95 border-white/10 text-white backdrop-blur-xl max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white text-xl flex items-center justify-between">
              Employee Profile
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewProfileOpen(false)}
                className="text-white/70 hover:text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </Button>
            </DialogTitle>
            <DialogDescription className="sr-only">
              View complete employee profile including personal information, performance, availability, and current assignment
            </DialogDescription>
          </DialogHeader>
          {selectedEmployee && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4 p-4 bg-white/5 rounded-lg border border-white/10">
                <Avatar className="w-16 h-16 bg-gradient-to-br from-[#E41E6A] to-pink-600">
                  <AvatarFallback className="text-white text-xl">
                    {selectedEmployee.name.split(" ").map((n) => n[0]).join("")}
                  </AvatarFallback>
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
                  <p className="text-white">₱{selectedEmployee.salary.toLocaleString()}</p>
                </div>
                
                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <p className="text-white/60 text-sm">Performance</p>
                  <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 mt-1">
                    {selectedEmployee.performance}
                  </Badge>
                </div>
                
                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <p className="text-white/60 text-sm">Status</p>
                  <Badge
                    className={
                      selectedEmployee.status === "Active"
                        ? "bg-green-500/20 text-green-400 border-green-500/30 mt-1"
                        : "bg-orange-500/20 text-orange-400 border-orange-500/30 mt-1"
                    }
                  >
                    {selectedEmployee.status}
                  </Badge>
                </div>
              </div>
              
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <p className="text-white/60 text-sm mb-2">Availability</p>
                <Badge
                  className={
                    selectedEmployee.availability === "Available"
                      ? "bg-green-500/20 text-green-400 border-green-500/30"
                      : "bg-orange-500/20 text-orange-400 border-orange-500/30"
                  }
                >
                  {selectedEmployee.availability}
                </Badge>
              </div>
              
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <p className="text-white/60 text-sm mb-2">Current Assignment</p>
                <p className="text-white">{selectedEmployee.currentAssignment}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Assign Work Modal */}
      <Dialog open={assignWorkOpen} onOpenChange={setAssignWorkOpen}>
        <DialogContent className="bg-gradient-to-br from-black/95 to-gray-900/95 border-white/10 text-white backdrop-blur-xl max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">Assign Work</DialogTitle>
            <DialogDescription className="sr-only">
              Assign work to an employee and automatically update their availability status
            </DialogDescription>
          </DialogHeader>
          {selectedEmployee && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <p className="text-white/60 text-sm">Employee</p>
                <p className="text-white text-lg">{selectedEmployee.name}</p>
                <p className="text-white/50 text-sm">{selectedEmployee.position}</p>
                <Badge
                  className={
                    selectedEmployee.availability === "Available"
                      ? "bg-green-500/20 text-green-400 border-green-500/30 mt-2"
                      : "bg-orange-500/20 text-orange-400 border-orange-500/30 mt-2"
                  }
                >
                  {selectedEmployee.availability}
                </Badge>
              </div>
              
              {selectedEmployee.currentAssignment !== "None" && (
                <div className="p-3 bg-orange-500/10 rounded-lg border border-orange-500/30">
                  <p className="text-orange-400 text-sm">
                    Current: {selectedEmployee.currentAssignment}
                  </p>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="assignment" className="text-white/70">Assignment Details *</Label>
                <Input
                  id="assignment"
                  placeholder="Enter work assignment (type 'None' to clear)"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/50"
                  value={assignmentData.assignment}
                  onChange={(e) => setAssignmentData({ assignment: e.target.value })}
                />
                <p className="text-white/50 text-xs">
                  Employee will be marked as "Busy" when assigned work, or "Available" if assignment is "None"
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              className="border-white/10 text-white hover:bg-white/5"
              onClick={() => {
                setAssignWorkOpen(false);
                setAssignmentData({ assignment: "" });
              }}
            >
              Cancel
            </Button>
            <Button
              className="bg-gradient-to-r from-[#E41E6A] to-pink-600 hover:from-[#E41E6A]/90 hover:to-pink-600/90 text-white"
              onClick={handleAssignWork}
            >
              Assign Work
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}