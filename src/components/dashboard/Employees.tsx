import { useState, useEffect, useMemo } from "react";
import {
  Users, Plus, DollarSign, Clock, X, Search,
  SlidersHorizontal, ChevronDown, UserCheck,
  Briefcase, Star, CheckCircle, Edit2, Archive,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../dashboard-ui/card";
import { Button } from "../dashboard-ui/button";
import { Badge } from "../dashboard-ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../dashboard-ui/table";
import { getEmployees, createEmployee, updateEmployee, updateEmployeeAssignment, Employee } from "../../services/employees";

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
}

const AVATAR_COLORS = [
  "from-[#E41E6A] to-pink-400",
  "from-sky-500 to-blue-400",
  "from-violet-500 to-purple-400",
  "from-emerald-500 to-green-400",
  "from-amber-500 to-orange-400",
];
const avatarColor = (id: string) =>
  AVATAR_COLORS[id.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length];

const PERFORMANCE_STYLE = {
  Excellent: { badge: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", stars: 3 },
  Good:      { badge: "bg-sky-500/20 text-sky-400 border-sky-500/30",             stars: 2 },
  Average:   { badge: "bg-amber-500/20 text-amber-400 border-amber-500/30",       stars: 1 },
};

const DEPT_COLORS: Record<string, string> = {
  Technical:   "bg-violet-500/20 text-violet-400 border-violet-500/30",
  Operations:  "bg-sky-500/20 text-sky-400 border-sky-500/30",
  Admin:       "bg-amber-500/20 text-amber-400 border-amber-500/30",
  Sales:       "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
};
const deptColor = (dept: string) =>
  DEPT_COLORS[dept] ?? "bg-white/10 text-white/60 border-white/10";

// ─── MODAL WRAPPER ────────────────────────────────────────────────────────────

function ModalWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm"
      style={{ backgroundColor: "rgba(0,0,0,0.8)" }}>
      {children}
    </div>
  );
}

const inputClass =
  "w-full px-4 h-10 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/25 focus:outline-none focus:border-[#E41E6A] focus:ring-1 focus:ring-[#E41E6A]/30 transition-colors text-sm";

// ─── ADD EMPLOYEE MODAL ───────────────────────────────────────────────────────

function AddEmployeeModal({ onClose, onSave }: {
  onClose: () => void;
  onSave: (emp: { name: string; position: string; department: string; salary: number; status: "Active" | "On Leave"; performance: "Excellent" | "Good" | "Average" }) => Promise<void>;
}) {
  const [form, setForm] = useState({
    name: "", position: "", department: "", salary: "",
    status: "Active" as "Active" | "On Leave",
    performance: "Good" as "Excellent" | "Good" | "Average",
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!form.name || !form.position || !form.department) {
      alert("Please fill in Name, Position, and Department."); return;
    }
    setIsSaving(true);
    try {
      await onSave({ ...form, salary: parseFloat(form.salary) || 0 });
      onClose();
    } catch (error: any) {
      alert(`Database Error: ${error?.message || "Failed to add employee."}`);
    } finally {
      setIsSaving(false);
    }
  };

  const Field = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-white/70">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );

  return (
    <ModalWrapper>
      <div className="bg-[#0a0a0a] border border-white/10 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white">Add New Employee</h2>
            <p className="text-white/50 text-xs mt-0.5">Fill in the employee details below</p>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full Name" required>
              <input className={inputClass} placeholder="Full name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="Position" required>
              <input className={inputClass} placeholder="e.g. Lead Technician" value={form.position} onChange={e => setForm({ ...form, position: e.target.value })} />
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Department" required>
              <div className="relative">
                <select className={inputClass + " appearance-none pr-8"} value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}>
                  <option value="" className="bg-[#0a0a0a]">Select department...</option>
                  {["Technical", "Operations", "Admin", "Sales"].map(d => (
                    <option key={d} value={d} className="bg-[#0a0a0a]">{d}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
              </div>
            </Field>
            <Field label="Monthly Salary (₱)">
              <input type="number" className={inputClass} placeholder="0" value={form.salary} onChange={e => setForm({ ...form, salary: e.target.value })} />
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Status">
              <div className="relative">
                <select className={inputClass + " appearance-none pr-8"} value={form.status} onChange={e => setForm({ ...form, status: e.target.value as any })}>
                  <option value="Active"   className="bg-[#0a0a0a]">Active</option>
                  <option value="On Leave" className="bg-[#0a0a0a]">On Leave</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
              </div>
            </Field>
            <Field label="Performance">
              <div className="relative">
                <select className={inputClass + " appearance-none pr-8"} value={form.performance} onChange={e => setForm({ ...form, performance: e.target.value as any })}>
                  <option value="Excellent" className="bg-[#0a0a0a]">Excellent</option>
                  <option value="Good"      className="bg-[#0a0a0a]">Good</option>
                  <option value="Average"   className="bg-[#0a0a0a]">Average</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
              </div>
            </Field>
          </div>
        </div>

        <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3">
          <Button variant="outline" className="border-white/10 text-white hover:bg-white/10" onClick={onClose}>Cancel</Button>
          <Button className="bg-gradient-to-r from-[#E41E6A] to-pink-600 text-white border-none hover:opacity-90" onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Add Employee"}
          </Button>
        </div>
      </div>
    </ModalWrapper>
  );
}

// ─── VIEW PROFILE MODAL ───────────────────────────────────────────────────────

function ProfileModal({ employee, onClose, onAssign, onEdit }: {
  employee: Employee;
  onClose: () => void;
  onAssign: () => void;
  onEdit: () => void;
}) {
  const perf = PERFORMANCE_STYLE[employee.performance as keyof typeof PERFORMANCE_STYLE] ?? PERFORMANCE_STYLE.Good;

  const Row = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) => (
    <div className="p-4 bg-white/5 rounded-lg border border-white/10 flex items-start gap-3">
      <div className="mt-0.5 text-[#E41E6A] flex-shrink-0">{icon}</div>
      <div>
        <p className="text-white/50 text-xs">{label}</p>
        <div className="mt-0.5">{value}</div>
      </div>
    </div>
  );

  return (
    <ModalWrapper>
      <div className="bg-[#0a0a0a] border border-white/10 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Employee Profile</h2>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-4">
          {/* Hero */}
          <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-[#E41E6A]/10 to-pink-600/5 rounded-xl border border-[#E41E6A]/20">
            <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${avatarColor(employee.id)} flex items-center justify-center text-white text-lg font-bold flex-shrink-0`}>
              {initials(employee.name)}
            </div>
            <div>
              <p className="text-white text-lg font-bold">{employee.name}</p>
              <p className="text-white/60 text-sm">{employee.position}</p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <Badge className={employee.status === "Active"
                  ? "bg-green-500/20 text-green-400 border-green-500/30"
                  : "bg-orange-500/20 text-orange-400 border-orange-500/30"}>
                  {employee.status}
                </Badge>
                <Badge className={employee.availability === "Available"
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                  : "bg-orange-500/20 text-orange-400 border-orange-500/30"}>
                  {employee.availability}
                </Badge>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Row icon={<Briefcase className="w-4 h-4" />} label="Department"
              value={<Badge className={deptColor(employee.department)}>{employee.department}</Badge>} />
            <Row icon={<DollarSign className="w-4 h-4" />} label="Monthly Salary"
              value={<p className="text-white font-semibold">₱{Number(employee.salary).toLocaleString()}</p>} />
          </div>

          <Row icon={<Star className="w-4 h-4" />} label="Performance"
            value={
              <div className="flex items-center gap-2">
                <Badge className={perf.badge}>{employee.performance}</Badge>
                <div className="flex gap-0.5">
                  {[1,2,3].map(i => (
                    <Star key={i} className={`w-3.5 h-3.5 ${i <= perf.stars ? "text-amber-400 fill-amber-400" : "text-white/20"}`} />
                  ))}
                </div>
              </div>
            }
          />

          <Row icon={<Clock className="w-4 h-4" />} label="Current Assignment"
            value={
              <p className={`text-sm font-medium ${employee.current_assignment === "None" ? "text-white/40 italic" : "text-white"}`}>
                {employee.current_assignment}
              </p>
            }
          />
        </div>

        <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3">
          <Button variant="outline" className="border-white/10 text-white hover:bg-white/10" onClick={onClose}>Close</Button>
          <button
            onClick={onEdit}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-sky-500/30 text-sky-400 hover:bg-sky-500/10 rounded-lg transition-colors"
          >
            <Edit2 className="w-4 h-4" />Edit
          </button>
          {employee.status !== "On Leave" && (
            <Button className="bg-gradient-to-r from-[#E41E6A] to-pink-600 text-white border-none flex items-center gap-2" onClick={onAssign}>
              <Briefcase className="w-4 h-4" />Assign Work
            </Button>
          )}
        </div>
      </div>
    </ModalWrapper>
  );
}

// ─── ASSIGN WORK MODAL ────────────────────────────────────────────────────────

function AssignWorkModal({ employee, onClose, onSave }: {
  employee: Employee;
  onClose: () => void;
  onSave: (assignment: string) => Promise<void>;
}) {
  const [assignment, setAssignment] = useState("");
  const [isSaving,   setIsSaving]   = useState(false);

  const handleSave = async () => {
    if (!assignment.trim()) { alert("Please enter assignment details."); return; }
    setIsSaving(true);
    try {
      await onSave(assignment);
      onClose();
    } catch (error) {
      console.error("Failed to assign work", error);
    } finally {
      setIsSaving(false);
    }
  };

  const isClear = assignment.toLowerCase() === "none";

  return (
    <ModalWrapper>
      <div className="bg-[#0a0a0a] border border-white/10 rounded-xl w-full max-w-md shadow-2xl flex flex-col">
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white">Assign Work</h2>
            <p className="text-white/50 text-xs mt-0.5">Assigning to {employee.name}</p>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-4">
          {/* Employee card */}
          <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${avatarColor(employee.id)} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
              {initials(employee.name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm">{employee.name}</p>
              <p className="text-white/50 text-xs">{employee.position} · {employee.department}</p>
            </div>
            <Badge className={employee.availability === "Available"
              ? "bg-green-500/20 text-green-400 border-green-500/30"
              : "bg-orange-500/20 text-orange-400 border-orange-500/30"}>
              {employee.availability}
            </Badge>
          </div>

          {/* Current assignment warning */}
          {employee.current_assignment && employee.current_assignment !== "None" && (
            <div className="p-3 bg-orange-500/10 rounded-lg border border-orange-500/20 flex items-start gap-2">
              <Clock className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-orange-400 text-xs font-medium">Currently assigned to:</p>
                <p className="text-white/80 text-xs mt-0.5">{employee.current_assignment}</p>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-white/70">
              Assignment Details <span className="text-red-500">*</span>
            </label>
            <input
              className={inputClass}
              placeholder="Enter work assignment (type 'None' to clear)"
              value={assignment}
              onChange={e => setAssignment(e.target.value)}
            />
            {isClear && (
              <p className="text-emerald-400 text-xs flex items-center gap-1 mt-1">
                <CheckCircle className="w-3.5 h-3.5" />This will mark the employee as Available
              </p>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3">
          <Button variant="outline" className="border-white/10 text-white hover:bg-white/10" onClick={onClose}>Cancel</Button>
          <Button
            className={`text-white border-none flex items-center gap-2 ${isClear ? "bg-emerald-600 hover:bg-emerald-700" : "bg-gradient-to-r from-[#E41E6A] to-pink-600 hover:opacity-90"}`}
            onClick={handleSave}
            disabled={isSaving}
          >
            <Briefcase className="w-4 h-4" />
            {isSaving ? "Saving..." : isClear ? "Mark Available" : "Assign Work"}
          </Button>
        </div>
      </div>
    </ModalWrapper>
  );
}


// ─── EDIT EMPLOYEE MODAL ──────────────────────────────────────────────────────

function EditEmployeeModal({ employee, onClose, onSave }: {
  employee: Employee;
  onClose: () => void;
  onSave: (updated: Employee) => Promise<void>;
}) {
  const [form, setForm] = useState({
    name:        employee.name,
    position:    employee.position,
    department:  employee.department,
    salary:      String(employee.salary ?? ""),
    status:      (employee.status ?? "Active") as "Active" | "On Leave",
    performance: (employee.performance ?? "Good") as "Excellent" | "Good" | "Average",
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!form.name || !form.position || !form.department) {
      alert("Please fill in Name, Position, and Department."); return;
    }
    setIsSaving(true);
    try {
      await onSave({ ...employee, ...form, salary: parseFloat(form.salary) || 0 });
      onClose();
    } catch (error: any) {
      alert(`Database Error: ${error?.message || "Failed to update employee."}`);
    } finally {
      setIsSaving(false);
    }
  };

  const Field = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-white/70">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );

  return (
    <ModalWrapper>
      <div className="bg-[#0a0a0a] border border-white/10 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white">Edit Employee</h2>
            <p className="text-white/50 text-xs mt-0.5">Editing {employee.name}</p>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full Name" required>
              <input className={inputClass} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="Position" required>
              <input className={inputClass} value={form.position} onChange={e => setForm({ ...form, position: e.target.value })} />
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Department" required>
              <div className="relative">
                <select className={inputClass + " appearance-none pr-8"} value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}>
                  {["Technical", "Operations", "Admin", "Sales"].map(d => (
                    <option key={d} value={d} className="bg-[#0a0a0a]">{d}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
              </div>
            </Field>
            <Field label="Monthly Salary (₱)">
              <input type="number" className={inputClass} value={form.salary} onChange={e => setForm({ ...form, salary: e.target.value })} />
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Status">
              <div className="relative">
                <select className={inputClass + " appearance-none pr-8"} value={form.status} onChange={e => setForm({ ...form, status: e.target.value as any })}>
                  <option value="Active"   className="bg-[#0a0a0a]">Active</option>
                  <option value="On Leave" className="bg-[#0a0a0a]">On Leave</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
              </div>
            </Field>
            <Field label="Performance">
              <div className="relative">
                <select className={inputClass + " appearance-none pr-8"} value={form.performance} onChange={e => setForm({ ...form, performance: e.target.value as any })}>
                  <option value="Excellent" className="bg-[#0a0a0a]">Excellent</option>
                  <option value="Good"      className="bg-[#0a0a0a]">Good</option>
                  <option value="Average"   className="bg-[#0a0a0a]">Average</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
              </div>
            </Field>
          </div>
        </div>

        <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3">
          <Button variant="outline" className="border-white/10 text-white hover:bg-white/10" onClick={onClose}>Cancel</Button>
          <Button className="bg-gradient-to-r from-[#E41E6A] to-pink-600 text-white border-none hover:opacity-90" onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </ModalWrapper>
  );
}

// ─── ARCHIVE EMPLOYEE MODAL ───────────────────────────────────────────────────

function ArchiveEmployeeModal({ employee, onClose, onConfirm }: {
  employee: Employee;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <ModalWrapper>
      <div className="bg-[#0a0a0a] border border-white/10 rounded-xl w-full max-w-sm shadow-2xl">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Archive Employee</h2>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
            <Archive className="w-6 h-6 text-amber-400" />
          </div>
          <p className="text-white text-center text-sm leading-relaxed">
            Archive{" "}<span className="font-bold text-[#E41E6A]">{employee.name}</span>?
            They will be marked as{" "}<span className="font-semibold text-amber-400">On Leave</span>{" "}
            and hidden from active assignment lists. You can restore them anytime by editing their status.
          </p>
        </div>
        <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3">
          <Button variant="outline" className="border-white/10 text-white hover:bg-white/10" onClick={onClose}>Cancel</Button>
          <Button
            className="bg-amber-500 hover:bg-amber-600 text-white border-none flex items-center gap-2"
            onClick={onConfirm}
          >
            <Archive className="w-4 h-4" />Archive
          </Button>
        </div>
      </div>
    </ModalWrapper>
  );
}


// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export function Employees() {
  const [employees,  setEmployees]  = useState<Employee[]>([]);
  const [isLoading,  setIsLoading]  = useState(true);
  const [search,     setSearch]     = useState("");
  const [filterDept, setFilterDept] = useState("All");
  const [filterAvail,setFilterAvail]= useState<"All" | "Available" | "Busy">("All");

  // Modal states
  const [addOpen,     setAddOpen]     = useState(false);
  const [viewEmp,     setViewEmp]     = useState<Employee | null>(null);
  const [assignEmp,   setAssignEmp]   = useState<Employee | null>(null);
  const [editEmp,     setEditEmp]     = useState<Employee | null>(null);
  const [archiveEmp,  setArchiveEmp]  = useState<Employee | null>(null);

  useEffect(() => { fetchData(); }, []);

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

  // ── Derived stats ─────────────────────────────────────────────────────────
  const activeEmployees = employees.filter(e => e.status === "Active").length;
  const busyEmployees   = employees.filter(e => e.availability === "Busy").length;
  const availableCount  = employees.filter(e => e.availability === "Available").length;
  const totalPayroll    = employees.reduce((s, e) => s + Number(e.salary), 0);
  const departments     = ["All", ...Array.from(new Set(employees.map(e => e.department)))];

  // ── Filtered list ─────────────────────────────────────────────────────────
  const filtered = useMemo(() =>
    employees
      .filter(e => filterDept  === "All" || e.department   === filterDept)
      .filter(e => filterAvail === "All" || e.availability === filterAvail)
      .filter(e =>
        e.name.toLowerCase().includes(search.toLowerCase())     ||
        e.position.toLowerCase().includes(search.toLowerCase()) ||
        e.department.toLowerCase().includes(search.toLowerCase())
      ),
    [employees, search, filterDept, filterAvail]
  );

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleAdd = async (emp: Parameters<typeof createEmployee>[0]) => {
    const added = await createEmployee(emp);
    setEmployees(prev => [...prev, added]);
  };

  const handleAssign = async (assignment: string) => {
    if (!assignEmp) return;
    const newAvail = assignment.toLowerCase() === "none" ? "Available" : "Busy";
    await updateEmployeeAssignment(assignEmp.id, newAvail, assignment);
    setEmployees(prev => prev.map(e =>
      e.id === assignEmp.id ? { ...e, availability: newAvail, current_assignment: assignment } : e
    ));
    setAssignEmp(null);
  };

  const handleMarkAvailable = async (id: string) => {
    await updateEmployeeAssignment(id, "Available", "None");
    setEmployees(prev => prev.map(e =>
      e.id === id ? { ...e, availability: "Available", current_assignment: "None" } : e
    ));
  };

  const handleEdit = async (updated: Employee) => {
    try {
      if (typeof updateEmployee === "function") {
        await updateEmployee(updated.id, updated);
      }
      setEmployees(prev => prev.map(e => e.id === updated.id ? updated : e));
    } catch (error: any) {
      alert(`Database Error: ${error?.message || "Failed to update employee."}`);
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await updateEmployeeAssignment(id, "Available", "None");
      setEmployees(prev => prev.map(e =>
        e.id === id ? { ...e, status: "On Leave" as const } : e
      ));
    } catch (error: any) {
      console.error("Failed to archive employee", error);
    } finally {
      setArchiveEmp(null);
    }
  };

  return (
    <div className="space-y-6 w-full">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-white text-3xl font-bold mb-1">Employee Management</h1>
          <p className="text-white/60 text-sm">Manage your team and payroll information</p>
        </div>
        <Button
          className="self-start sm:self-auto bg-gradient-to-r from-[#E41E6A] to-pink-600 hover:from-[#c41559] text-white flex items-center gap-2"
          onClick={() => setAddOpen(true)}
        >
          <Plus className="w-4 h-4" />Add Employee
        </Button>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: "Total Employees",  value: employees.length, sub: `${activeEmployees} active`,      icon: <Users      className="w-5 h-5" />, iconBg: "bg-[#E41E6A]/10", iconColor: "text-[#E41E6A]"  },
          { label: "Currently Busy",   value: busyEmployees,    sub: "Assigned to work",               icon: <Clock      className="w-5 h-5" />, iconBg: "bg-orange-500/10", iconColor: "text-orange-400" },
          { label: "Monthly Payroll",  value: `₱${Math.round(totalPayroll / 1000)}K`, sub: "Total salaries", icon: <DollarSign className="w-5 h-5" />, iconBg: "bg-emerald-500/10",iconColor: "text-emerald-400"},
          { label: "Available Now",    value: availableCount,   sub: "Ready for assignment",           icon: <UserCheck  className="w-5 h-5" />, iconBg: "bg-sky-500/10",    iconColor: "text-sky-400"    },
        ].map((s, i) => (
          <Card key={i} className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-white/70">{s.label}</CardTitle>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.iconBg}`}>
                  <span className={s.iconColor}>{s.icon}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="text-white text-2xl font-bold">{isLoading ? "..." : s.value}</div>
              <p className="text-xs text-white/50 mt-1">{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Currently Busy ── */}
      {busyEmployees > 0 && !isLoading && (
        <Card className="bg-gradient-to-br from-[#E41E6A]/10 to-pink-600/10 border-[#E41E6A]/30 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#E41E6A]" />
              Currently Busy
              <span className="text-xs font-normal text-[#E41E6A] bg-[#E41E6A]/20 px-2 py-0.5 rounded-full border border-[#E41E6A]/30 ml-1">
                {busyEmployees} employee{busyEmployees !== 1 ? "s" : ""}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {employees.filter(e => e.availability === "Busy").map(emp => (
                <div key={emp.id} className="p-4 bg-white/5 rounded-xl border border-[#E41E6A]/20 hover:border-[#E41E6A]/40 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${avatarColor(emp.id)} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                      {initials(emp.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-semibold truncate">{emp.name}</p>
                      <p className="text-white/50 text-xs truncate">{emp.position}</p>
                    </div>
                    <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 flex-shrink-0">Busy</Badge>
                  </div>

                  <div className="p-2.5 bg-white/5 rounded-lg border border-white/10 mb-3">
                    <p className="text-white/50 text-xs mb-0.5">Assignment</p>
                    <p className="text-white text-xs font-medium truncate">{emp.current_assignment}</p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleMarkAvailable(emp.id)}
                      className="flex-1 py-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />Mark Available
                    </button>
                    <button
                      onClick={() => setAssignEmp(emp)}
                      className="flex-1 py-1.5 text-xs font-semibold text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Edit2 className="w-3.5 h-3.5" />Reassign
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Search + Filters ── */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name, position, or department..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#E41E6A] focus:ring-1 focus:ring-[#E41E6A]/30 transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <SlidersHorizontal className="w-4 h-4 text-white/40 flex-shrink-0" />
          {(["All", "Available", "Busy"] as const).map(f => (
            <button key={f} onClick={() => setFilterAvail(f)}
              className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                filterAvail === f
                  ? "bg-[#E41E6A] text-white border-[#E41E6A]"
                  : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white"
              }`}>{f}</button>
          ))}
        </div>

        <div className="relative">
          <select
            value={filterDept}
            onChange={e => setFilterDept(e.target.value)}
            className="pl-3 pr-8 py-2.5 text-xs font-semibold bg-white/5 border border-white/10 rounded-xl text-white/70 focus:outline-none focus:border-[#E41E6A] appearance-none"
          >
            {departments.map(d => <option key={d} value={d} className="bg-[#0a0a0a]">{d}</option>)}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40 pointer-events-none" />
        </div>
      </div>

      {/* ── Employee Table ── */}
      <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur overflow-hidden">
        <CardHeader className="border-b border-white/10 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Employee List</CardTitle>
            <span className="text-white/40 text-xs">{filtered.length} employee{filtered.length !== 1 ? "s" : ""}</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-12 text-white/50">Loading employees...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-10 h-10 mx-auto mb-3 text-white/20" />
              <p className="text-white/40 text-sm">No employees found</p>
            </div>
          ) : (
            <>
              {/* Mobile cards */}
              <div className="sm:hidden divide-y divide-white/5">
                {filtered.map(emp => (
                  <div key={emp.id} className="p-4 flex items-center gap-3 hover:bg-white/5 transition-colors">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarColor(emp.id)} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                      {initials(emp.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-semibold truncate">{emp.name}</p>
                      <p className="text-white/50 text-xs truncate">{emp.position}</p>
                    </div>
                    <Badge className={emp.availability === "Available" ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-orange-500/20 text-orange-400 border-orange-500/30"}>
                      {emp.availability}
                    </Badge>
                    <button onClick={() => setViewEmp(emp)} className="text-white/50 hover:text-[#E41E6A] transition-colors ml-1">
                      <Briefcase className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left text-xs font-semibold text-white/50 uppercase tracking-wide px-4 py-3.5 whitespace-nowrap">Employee</th>
                      <th className="text-left text-xs font-semibold text-white/50 uppercase tracking-wide px-3 py-3.5 whitespace-nowrap">Department</th>
                      <th className="text-left text-xs font-semibold text-white/50 uppercase tracking-wide px-3 py-3.5 whitespace-nowrap">Salary</th>
                      <th className="text-left text-xs font-semibold text-white/50 uppercase tracking-wide px-3 py-3.5 whitespace-nowrap">Status</th>
                      <th className="text-left text-xs font-semibold text-white/50 uppercase tracking-wide px-3 py-3.5 whitespace-nowrap">Performance</th>
                      <th className="text-right text-xs font-semibold text-white/50 uppercase tracking-wide px-4 py-3.5 whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filtered.map(emp => {
                      const perf = PERFORMANCE_STYLE[emp.performance as keyof typeof PERFORMANCE_STYLE] ?? PERFORMANCE_STYLE.Good;
                      return (
                        <tr key={emp.id} className="hover:bg-white/5 transition-colors">
                          {/* Employee */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${avatarColor(emp.id)} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                                {initials(emp.name)}
                              </div>
                              <div className="min-w-0">
                                <p className="text-white text-sm font-semibold truncate max-w-[140px]">{emp.name}</p>
                                <p className="text-white/40 text-xs truncate max-w-[140px]">{emp.position}</p>
                              </div>
                            </div>
                          </td>
                          {/* Department */}
                          <td className="px-3 py-3 whitespace-nowrap">
                            <Badge variant="outline" className={deptColor(emp.department)}>{emp.department}</Badge>
                          </td>
                          {/* Salary */}
                          <td className="px-3 py-3 whitespace-nowrap">
                            <span className="text-white text-sm font-semibold">₱{Number(emp.salary).toLocaleString()}</span>
                          </td>
                          {/* Status — combines availability + status */}
                          <td className="px-3 py-3">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1.5">
                                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${emp.availability === "Available" ? "bg-green-500" : "bg-orange-400"}`} />
                                <span className={`text-xs font-medium ${emp.availability === "Available" ? "text-green-400" : "text-orange-400"}`}>
                                  {emp.availability}
                                </span>
                              </div>
                              <Badge className={`w-fit ${emp.status === "Active" ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-orange-500/20 text-orange-400 border-orange-500/30"}`}>
                                {emp.status}
                              </Badge>
                            </div>
                          </td>
                          {/* Performance */}
                          <td className="px-3 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <Badge className={perf.badge}>{emp.performance}</Badge>
                              <div className="flex gap-0.5">
                                {[1,2,3].map(i => (
                                  <Star key={i} className={`w-3 h-3 ${i <= perf.stars ? "text-amber-400 fill-amber-400" : "text-white/20"}`} />
                                ))}
                              </div>
                            </div>
                          </td>
                          {/* Actions — icon buttons to save space */}
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                title="View Profile"
                                onClick={() => setViewEmp(emp)}
                                className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#E41E6A]/30 text-[#E41E6A] hover:bg-[#E41E6A]/10 transition-colors"
                              >
                                <Briefcase className="w-3.5 h-3.5" />
                              </button>
                              <button
                                title="Assign Work"
                                onClick={() => setAssignEmp(emp)}
                                disabled={emp.status === "On Leave"}
                                className="w-7 h-7 flex items-center justify-center rounded-lg border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                              >
                                <Clock className="w-3.5 h-3.5" />
                              </button>
                              <button
                                title="Edit Employee"
                                onClick={() => setEditEmp(emp)}
                                className="w-7 h-7 flex items-center justify-center rounded-lg border border-sky-500/30 text-sky-400 hover:bg-sky-500/10 transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                title="Archive Employee"
                                onClick={() => setArchiveEmp(emp)}
                                className="w-7 h-7 flex items-center justify-center rounded-lg border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 transition-colors"
                              >
                                <Archive className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Modals ── */}
      {addOpen   && <AddEmployeeModal onClose={() => setAddOpen(false)} onSave={handleAdd} />}
      {viewEmp   && (
        <ProfileModal
          employee={viewEmp}
          onClose={() => setViewEmp(null)}
          onAssign={() => { setAssignEmp(viewEmp); setViewEmp(null); }}
          onEdit={() => { setEditEmp(viewEmp); setViewEmp(null); }}
        />
      )}
      {assignEmp   && <AssignWorkModal      employee={assignEmp}  onClose={() => setAssignEmp(null)}  onSave={handleAssign} />}
      {editEmp     && <EditEmployeeModal    employee={editEmp}    onClose={() => setEditEmp(null)}    onSave={handleEdit} />}
      {archiveEmp  && <ArchiveEmployeeModal employee={archiveEmp} onClose={() => setArchiveEmp(null)} onConfirm={() => handleArchive(archiveEmp.id)} />}
    </div>
  );
}