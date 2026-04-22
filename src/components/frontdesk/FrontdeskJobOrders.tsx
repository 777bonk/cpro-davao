import { jobOrdersService } from "../../services/joborders";
import { useState, useEffect, useMemo } from "react";
import {
  Plus, Search, X, ChevronDown, SlidersHorizontal,
  Car, User, Wrench, Clock, CheckCircle, AlertCircle,
  Eye, Edit2, ClipboardList, Calendar, FileText,
  Shield, Layers, Sparkles, Hash, Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../dashboard-ui/card";
import { getAppointments } from "../../services/appointments";
import { getEmployees, Employee } from "../../services/employees";
import { getCustomers, Customer } from "../../services/customer";
import { getServices } from "../../services/settings";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type JobStatus = "Pending" | "In Progress" | "Completed" | "Cancelled";

interface JobOrder {
  id: string;
  orderNo: string;
  customer: string;
  vehicle: string;
  service: string;
  assignedStaff: string;
  staffId: string;
  date: string;
  estimatedTime: string;
  status: JobStatus;
  notes: string;
  priority: "Normal" | "Urgent";
}

interface ApptOption {
  id: string;
  label: string;       // shown in dropdown
  customer: string;
  vehicle: string;
  service: string;
  date: string;
}

// ─── STATUS CONFIG ─────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<JobStatus, { bg: string; text: string; dot: string; border: string }> = {
  Pending:      { bg: "bg-yellow-500/20", text: "text-yellow-400", dot: "bg-yellow-400", border: "border-yellow-500/30" },
  "In Progress":{ bg: "bg-blue-500/20",   text: "text-blue-400",   dot: "bg-blue-500",   border: "border-blue-500/30"   },
  Completed:    { bg: "bg-green-500/20",  text: "text-green-400",  dot: "bg-green-500",  border: "border-green-500/30"  },
  Cancelled:    { bg: "bg-red-500/20",    text: "text-red-400",    dot: "bg-red-500",    border: "border-red-500/30"    },
};

const ALL_STATUSES: JobStatus[] = ["Pending", "In Progress", "Completed", "Cancelled"];
const TIME_OPTIONS = ["1 hour","2 hours","3 hours","4 hours","5 hours","6 hours","Full day"];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" });
}

function serviceIcon(service: string) {
  const s = (service ?? "").toLowerCase();
  if (s.includes("coating") || s.includes("ceramic")) return <Shield   className="w-4 h-4 text-[#E41E6A]"  />;
  if (s.includes("ppf") || s.includes("paint"))       return <Layers   className="w-4 h-4 text-violet-400" />;
  if (s.includes("tint"))                             return <Sparkles className="w-4 h-4 text-sky-400"    />;
  return                                                     <Wrench   className="w-4 h-4 text-emerald-400"/>;
}

const inputClass  = "w-full px-4 h-10 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/25 focus:outline-none focus:border-[#E41E6A] focus:ring-1 focus:ring-[#E41E6A]/30 transition-colors text-sm";
const selectClass = inputClass + " appearance-none pr-8";

function ModalWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm"
      style={{ backgroundColor: "rgba(0,0,0,0.8)" }}>
      {children}
    </div>
  );
}

function Field({ label, required, children }: { label:string; required?:boolean; children:React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-white/70">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

// ─── CREATE JOB ORDER MODAL ───────────────────────────────────────────────────

function CreateJobOrderModal({ employees, appointments, onClose, onSave }: {
  employees: Employee[];
  appointments: ApptOption[];
  onClose: () => void;
  onSave: (data: Omit<JobOrder,"id"|"orderNo">) => void;
}) {
  const [selectedApptId,  setSelectedApptId]  = useState("");
  const [selectedStaff,   setSelectedStaff]   = useState<string[]>([]);  // multi-select
  const [estimatedTime,   setEstimatedTime]   = useState("2 hours");
  const [priority,        setPriority]        = useState<"Normal"|"Urgent">("Normal");
  const [notes,           setNotes]           = useState("");
  const [date,            setDate]            = useState(new Date().toISOString().split("T")[0]);
  const [staffSearch,     setStaffSearch]     = useState("");
  const [error,           setError]           = useState("");

  const selectedAppt = appointments.find(a => a.id === selectedApptId);

  const availableStaff = employees.filter(e =>
    e.status === "Active" &&
    (e.name ?? "").toLowerCase().includes(staffSearch.toLowerCase())
  );

  const toggleStaff = (name: string) =>
    setSelectedStaff(prev =>
      prev.includes(name) ? prev.filter(s => s !== name) : [...prev, name]
    );

  const handleSave = () => {
    if (!selectedApptId) { setError("Please select an appointment."); return; }
    if (selectedStaff.length === 0) { setError("Please select at least one staff member."); return; }
    if (!selectedAppt) return;

    const matchedEmps = employees.filter(e => selectedStaff.includes(e.name));
    onSave({
      customer:      selectedAppt.customer,
      vehicle:       selectedAppt.vehicle,
      service:       selectedAppt.service,
      assignedStaff: selectedStaff.join(", "),
      staffId:       matchedEmps[0]?.id ?? "",
      date,
      estimatedTime,
      status:        "Pending",
      notes,
      priority,
    });
    onClose();
  };

  return (
    <ModalWrapper>
      <div className="bg-[#0a0a0a] border border-white/10 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">

        {/* Header */}
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white">Create Job Order</h2>
            <p className="text-white/50 text-xs mt-0.5">Select an appointment and assign technicians</p>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto">

          {/* ── Select Appointment ── */}
          <div>
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-3">Appointment</p>
            <Field label="Select Appointment" required>
              <div className="relative">
                <select className={`${selectClass} pr-8`} value={selectedApptId}
                  onChange={e => { setSelectedApptId(e.target.value); setError(""); }}>
                  <option value="" className="bg-[#0a0a0a]">Select an appointment...</option>
                  {appointments.map(a => (
                    <option key={a.id} value={a.id} className="bg-[#0a0a0a]">{a.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
              </div>
            </Field>

            {/* Auto-filled preview */}
            {selectedAppt && (
              <div className="mt-3 p-4 rounded-xl bg-white/5 border border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <p className="text-[10px] text-white/40 uppercase tracking-wider">Customer</p>
                  <p className="text-sm font-semibold text-white mt-0.5 truncate">{selectedAppt.customer}</p>
                </div>
                <div>
                  <p className="text-[10px] text-white/40 uppercase tracking-wider">Vehicle</p>
                  <p className="text-sm font-semibold text-white mt-0.5 truncate">{selectedAppt.vehicle}</p>
                </div>
                <div>
                  <p className="text-[10px] text-white/40 uppercase tracking-wider">Service</p>
                  <p className="text-sm font-semibold text-white mt-0.5 truncate">{selectedAppt.service}</p>
                </div>
              </div>
            )}
          </div>

          {/* ── Schedule ── */}
          <div>
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-3">Schedule</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Work Date" required>
                <input type="date" className={`${inputClass} [color-scheme:dark]`}
                  value={date} onChange={e => setDate(e.target.value)} />
              </Field>
              <Field label="Estimated Time">
                <div className="relative">
                  <select className={`${selectClass} pr-8`} value={estimatedTime}
                    onChange={e => setEstimatedTime(e.target.value)}>
                    {TIME_OPTIONS.map(t => <option key={t} value={t} className="bg-[#0a0a0a]">{t}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                </div>
              </Field>
            </div>
          </div>

          {/* ── Assign Staff (checkbox multi-select) ── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">
                Assign Technicians <span className="text-red-500">*</span>
              </p>
              {selectedStaff.length > 0 && (
                <span className="text-xs font-semibold text-[#E41E6A]">
                  {selectedStaff.length} selected
                </span>
              )}
            </div>

            {/* Search staff */}
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
              <input className={`${inputClass} pl-9 h-9 text-xs`} placeholder="Search staff..."
                value={staffSearch} onChange={e => setStaffSearch(e.target.value)} />
            </div>

            {/* Staff list */}
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {availableStaff.length === 0 ? (
                <p className="text-white/40 text-xs text-center py-4">No staff found</p>
              ) : availableStaff.map(emp => {
                const checked = selectedStaff.includes(emp.name);
                return (
                  <button key={emp.id} type="button" onClick={() => toggleStaff(emp.name)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors text-left ${
                      checked
                        ? "border-[#E41E6A]/50 bg-[#E41E6A]/10"
                        : "border-white/10 bg-white/5 hover:bg-white/10"
                    }`}>
                    {/* Avatar */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      checked ? "bg-[#E41E6A] text-white" : "bg-white/10 text-white/60"
                    }`}>
                      {emp.name.split(" ").map((n: string) => n[0]).slice(0,2).join("")}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${checked ? "text-white" : "text-white/80"}`}>
                        {emp.name}
                      </p>
                      <p className="text-xs text-white/40 truncate">{emp.position}</p>
                    </div>
                    {/* Availability pill */}
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 ${
                      emp.availability === "Available"
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                        : "bg-white/10 text-white/40 border-white/10"
                    }`}>
                      {emp.availability ?? "Unknown"}
                    </span>
                    {/* Checkbox */}
                    <span className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
                      checked ? "bg-[#E41E6A] border-[#E41E6A]" : "border-white/20"
                    }`}>
                      {checked && <CheckCircle className="w-3 h-3 text-white" />}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Selected summary */}
            {selectedStaff.length > 0 && (
              <div className="mt-2 p-3 rounded-xl bg-[#E41E6A]/10 border border-[#E41E6A]/20">
                <p className="text-xs text-white/50 mb-1.5 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-[#E41E6A]" />Assigned Team
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedStaff.map(name => (
                    <span key={name} className="inline-flex items-center gap-1 text-xs font-medium text-white bg-white/10 rounded-full px-2.5 py-1 border border-white/10">
                      {name}
                      <button onClick={() => toggleStaff(name)} className="text-white/40 hover:text-white transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Priority ── */}
          <div>
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-3">Priority</p>
            <div className="grid grid-cols-2 gap-2">
              {(["Normal","Urgent"] as const).map(p => (
                <button key={p} type="button" onClick={() => setPriority(p)}
                  className={`py-2.5 text-sm font-semibold rounded-xl border transition-colors ${
                    priority === p
                      ? p === "Urgent"
                        ? "bg-red-500/20 text-red-400 border-red-500/40"
                        : "bg-[#E41E6A]/20 text-[#E41E6A] border-[#E41E6A]/40"
                      : "bg-white/5 text-white/50 border-white/10 hover:bg-white/10"
                  }`}>{p}</button>
              ))}
            </div>
          </div>

          {/* ── Notes ── */}
          <Field label="Notes / Instructions">
            <textarea className={`${inputClass} resize-none h-20 py-2.5`}
              placeholder="Specific instructions for the technicians..."
              value={notes} onChange={e => setNotes(e.target.value)} />
          </Field>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              <X className="w-4 h-4 flex-shrink-0" />{error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium border border-white/10 text-white hover:bg-white/10 rounded-lg transition-colors">Cancel</button>
          <button onClick={handleSave}
            className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#E41E6A] to-pink-600 hover:from-[#c41559] rounded-lg shadow-md shadow-[#E41E6A]/25 transition-all">
            Create Job Order
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
}

// ─── EDIT JOB ORDER MODAL ─────────────────────────────────────────────────────

function EditJobOrderModal({ initial, employees, services, onClose, onSave }: {
  initial: JobOrder;
  employees: Employee[];
  services: string[];
  onClose: () => void;
  onSave: (data: Omit<JobOrder,"id"|"orderNo">) => void;
}) {
  const initStaff = initial.assignedStaff ? initial.assignedStaff.split(", ").filter(Boolean) : [];
  const [form, setForm]             = useState({ ...initial });
  const [selectedStaff, setStaff]   = useState<string[]>(initStaff);
  const [staffSearch, setStaffSearch] = useState("");
  const [error, setError]           = useState("");

  const toggleStaff = (name: string) =>
    setStaff(prev => prev.includes(name) ? prev.filter(s => s !== name) : [...prev, name]);

  const filteredStaff = employees.filter(e =>
    (e.name ?? "").toLowerCase().includes(staffSearch.toLowerCase())
  );

  const handleSave = () => {
    if (!form.vehicle || !form.service) { setError("Vehicle and Service are required."); return; }
    if (selectedStaff.length === 0) { setError("Please select at least one staff member."); return; }
    onSave({
      ...form,
      assignedStaff: selectedStaff.join(", "),
      staffId: employees.filter(e => selectedStaff.includes(e.name))[0]?.id ?? "",
    });
    onClose();
  };

  return (
    <ModalWrapper>
      <div className="bg-[#0a0a0a] border border-white/10 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <div><h2 className="text-xl font-bold text-white">Edit Job Order</h2><p className="text-white/50 text-xs mt-0.5">Editing {initial.orderNo}</p></div>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Vehicle" required>
              <input className={inputClass} value={form.vehicle} onChange={e => setForm({...form,vehicle:e.target.value})} />
            </Field>
            <Field label="Service" required>
              <div className="relative">
                <select className={`${selectClass} pr-8`} value={form.service} onChange={e => setForm({...form,service:e.target.value})}>
                  {services.map(s => <option key={s} value={s} className="bg-[#0a0a0a]">{s}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
              </div>
            </Field>
          </div>

          {/* Staff checkboxes */}
          <Field label="Assigned Technicians" required>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
              <input className={`${inputClass} pl-9 h-9 text-xs`} placeholder="Search staff..."
                value={staffSearch} onChange={e => setStaffSearch(e.target.value)} />
            </div>
            <div className="space-y-2 max-h-44 overflow-y-auto">
              {filteredStaff.map(emp => {
                const checked = selectedStaff.includes(emp.name);
                return (
                  <button key={emp.id} type="button" onClick={() => toggleStaff(emp.name)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors text-left ${checked ? "border-[#E41E6A]/50 bg-[#E41E6A]/10" : "border-white/10 bg-white/5 hover:bg-white/10"}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${checked ? "bg-[#E41E6A] text-white" : "bg-white/10 text-white/60"}`}>
                      {emp.name.split(" ").map((n: string) => n[0]).slice(0,2).join("")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${checked ? "text-white" : "text-white/80"}`}>{emp.name}</p>
                      <p className="text-xs text-white/40">{emp.position}</p>
                    </div>
                    <span className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${checked ? "bg-[#E41E6A] border-[#E41E6A]" : "border-white/20"}`}>
                      {checked && <CheckCircle className="w-3 h-3 text-white" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Scheduled Date" required>
              <input type="date" className={`${inputClass} [color-scheme:dark]`} value={form.date} onChange={e => setForm({...form,date:e.target.value})} />
            </Field>
            <Field label="Estimated Time">
              <div className="relative">
                <select className={`${selectClass} pr-8`} value={form.estimatedTime} onChange={e => setForm({...form,estimatedTime:e.target.value})}>
                  {TIME_OPTIONS.map(t => <option key={t} value={t} className="bg-[#0a0a0a]">{t}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
              </div>
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Priority">
              <div className="flex gap-2">
                {(["Normal","Urgent"] as const).map(p => (
                  <button key={p} onClick={() => setForm({...form,priority:p})}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                      form.priority === p
                        ? p === "Urgent" ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-white/10 text-white border-white/20"
                        : "bg-white/5 text-white/50 border-white/10 hover:bg-white/10"
                    }`}>{p}</button>
                ))}
              </div>
            </Field>
            <Field label="Status">
              <div className="relative">
                <select className={`${selectClass} pr-8`} value={form.status} onChange={e => setForm({...form,status:e.target.value as JobStatus})}>
                  {ALL_STATUSES.map(s => <option key={s} value={s} className="bg-[#0a0a0a]">{s}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
              </div>
            </Field>
          </div>

          <Field label="Notes / Instructions">
            <textarea className={`${inputClass} resize-none h-20 py-2.5`} placeholder="Instructions for the technician..."
              value={form.notes} onChange={e => setForm({...form,notes:e.target.value})} />
          </Field>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              <X className="w-4 h-4 flex-shrink-0" />{error}
            </div>
          )}
        </div>
        <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium border border-white/10 text-white hover:bg-white/10 rounded-lg transition-colors">Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#E41E6A] to-pink-600 hover:from-[#c41559] rounded-lg shadow-md shadow-[#E41E6A]/25 transition-all">Save Changes</button>
        </div>
      </div>
    </ModalWrapper>
  );
}

// ─── VIEW DETAIL MODAL ────────────────────────────────────────────────────────

function ViewModal({ job, onClose, onEdit, onStatusChange }: {
  job: JobOrder;
  onClose: () => void;
  onEdit: () => void;
  onStatusChange: (id: string, status: JobStatus) => void;
}) {
  const [status, setStatus] = useState<JobStatus>(job.status);
  const s = STATUS_STYLE[job.status];
  const staffList = job.assignedStaff ? job.assignedStaff.split(", ").filter(Boolean) : [];

  const Row = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
    <div className="p-3 bg-white/5 rounded-lg border border-white/10 flex items-start gap-3">
      <div className="mt-0.5 text-[#E41E6A] flex-shrink-0">{icon}</div>
      <div><p className="text-white/50 text-xs">{label}</p><p className="text-white text-sm font-medium mt-0.5">{value}</p></div>
    </div>
  );

  return (
    <ModalWrapper>
      <div className="bg-[#0a0a0a] border border-white/10 rounded-xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-white/10 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Hash className="w-4 h-4 text-[#E41E6A]" />
              <span className="text-[#E41E6A] text-sm font-bold">{job.orderNo}</span>
              {job.priority === "Urgent" && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">Urgent</span>}
            </div>
            <h2 className="text-white text-lg font-bold">{job.service}</h2>
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border mt-1.5 ${s.bg} ${s.text} ${s.border}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />{job.status}
            </span>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors flex-shrink-0"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-3">
          <Row icon={<User     className="w-4 h-4" />} label="Customer"       value={job.customer} />
          <Row icon={<Car      className="w-4 h-4" />} label="Vehicle"        value={job.vehicle} />
          <Row icon={<Calendar className="w-4 h-4" />} label="Scheduled Date" value={formatDate(job.date)} />
          <Row icon={<Clock    className="w-4 h-4" />} label="Est. Duration"  value={job.estimatedTime} />
          {job.notes && <Row icon={<FileText className="w-4 h-4" />} label="Notes" value={job.notes} />}

          {/* Staff list */}
          <div className="p-3 bg-white/5 rounded-lg border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-[#E41E6A]" />
              <p className="text-white/50 text-xs">Assigned Technicians ({staffList.length})</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {staffList.map(name => (
                <span key={name} className="text-xs font-medium text-white bg-white/10 rounded-full px-2.5 py-1 border border-white/10">{name}</span>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <p className="text-white/50 text-xs font-medium mb-2">Update Status</p>
            <div className="relative">
              <select className={selectClass} value={status} onChange={e => setStatus(e.target.value as JobStatus)}>
                {ALL_STATUSES.map(s => <option key={s} value={s} className="bg-[#0a0a0a]">{s}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium border border-white/10 text-white hover:bg-white/10 rounded-lg transition-colors">Close</button>
          <button onClick={onEdit} className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-sky-500/30 text-sky-400 hover:bg-sky-500/10 rounded-lg transition-colors"><Edit2 className="w-4 h-4" />Edit</button>
          <button onClick={() => { onStatusChange(job.id, status); onClose(); }}
            className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#E41E6A] to-pink-600 hover:from-[#c41559] rounded-lg transition-all">Update</button>
        </div>
      </div>
    </ModalWrapper>
  );
}

// ─── STATUS BADGE ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: JobStatus }) {
  const s = STATUS_STYLE[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${s.bg} ${s.text} ${s.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />{status}
    </span>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export function FrontDeskJobOrders() {
  const [jobOrders,    setJobOrders]    = useState<JobOrder[]>([]);
  const [employees,    setEmployees]    = useState<Employee[]>([]);
  const [appointments, setAppointments] = useState<ApptOption[]>([]);
  const [services,     setServices]     = useState<string[]>([]);
  const [isLoading,    setIsLoading]    = useState(true);
  const [search,       setSearch]       = useState("");
  const [filterStatus, setFilterStatus] = useState<"All"|JobStatus>("All");
  const [showCreate,   setShowCreate]   = useState(false);
  const [editJob,      setEditJob]      = useState<JobOrder|null>(null);
  const [viewJob,      setViewJob]      = useState<JobOrder|null>(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [result, empsResult, rawAppts, svcs] = await Promise.all([
        jobOrdersService.getAll().catch(() => ({ data: [] })),
        getEmployees().catch(() => ({ data: [] })),
        getAppointments().catch(() => []),
        getServices().catch(() => []),
      ]);

      const emps = Array.isArray(empsResult) ? empsResult : (empsResult as any).data ?? [];

      // Build appointment options for the dropdown
      const apptOptions: ApptOption[] = (Array.isArray(rawAppts) ? rawAppts : [])
        .filter((a: any) => ["Confirmed","Pending","Scheduled"].includes(a.status ?? ""))
        .map((a: any) => {
          const customer = a.customerName ?? a.fullName ?? a.full_name ?? a.customer?.name ?? "Unknown";
          const vehicle  = a.vehicle ?? [a.vehicle_make, a.vehicle_model, a.vehicle_class].filter(Boolean).join(" ") ?? "—";
          const service  = a.service_type ?? a.service ?? "—";
          const date     = (a.scheduled_date ?? a.date ?? "").split("T")[0];
          return {
            id:       String(a.id),
            label:    `${customer} — ${service} (${date})`,
            customer,
            vehicle,
            service,
            date,
          };
        });

      setAppointments(apptOptions);
      setEmployees(emps);
      setServices(svcs.map((s: any) => s.name).filter(Boolean));
      setJobOrders(
        result.data.map((j: any) => ({
          id:            j.id,
          orderNo:       j.order_no,
          customer:      j.customer,
          vehicle:       j.vehicle,
          service:       j.service,
          assignedStaff: j.assigned_staff,
          staffId:       j.staff_id ?? "",
          date:          j.scheduled_date.split("T")[0],
          estimatedTime: j.estimated_time,
          status:        j.status   as JobStatus,
          priority:      j.priority as "Normal"|"Urgent",
          notes:         j.notes    ?? "",
        }))
      );
    } catch (err) {
      console.error("FrontDeskJobOrders fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const pending    = jobOrders.filter(j => j.status === "Pending").length;
  const inProgress = jobOrders.filter(j => j.status === "In Progress").length;
  const completed  = jobOrders.filter(j => j.status === "Completed").length;
  const urgent     = jobOrders.filter(j => j.priority === "Urgent" && j.status !== "Completed").length;

  const filtered = useMemo(() =>
    jobOrders
      .filter(j => filterStatus === "All" || j.status === filterStatus)
      .filter(j =>
        j.customer.toLowerCase().includes(search.toLowerCase())      ||
        j.vehicle.toLowerCase().includes(search.toLowerCase())       ||
        j.service.toLowerCase().includes(search.toLowerCase())       ||
        j.assignedStaff.toLowerCase().includes(search.toLowerCase()) ||
        j.orderNo.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => {
        if (a.priority === "Urgent" && b.priority !== "Urgent") return -1;
        if (b.priority === "Urgent" && a.priority !== "Urgent") return 1;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }),
    [jobOrders, search, filterStatus]
  );

  const handleCreate = async (data: Omit<JobOrder,"id"|"orderNo">) => {
    try {
      const saved = await jobOrdersService.create({
        customer:       data.customer,
        vehicle:        data.vehicle,
        service:        data.service,
        assigned_staff: data.assignedStaff,
        staff_id:       data.staffId || undefined,
        scheduled_date: data.date,
        estimated_time: data.estimatedTime,
        priority:       data.priority,
        notes:          data.notes,
      });
      setJobOrders(prev => [{
        id:            saved.id,
        orderNo:       saved.order_no,
        customer:      saved.customer,
        vehicle:       saved.vehicle,
        service:       saved.service,
        assignedStaff: saved.assigned_staff,
        staffId:       saved.staff_id ?? "",
        date:          saved.scheduled_date.split("T")[0],
        estimatedTime: saved.estimated_time,
        status:        saved.status   as JobStatus,
        priority:      saved.priority as "Normal"|"Urgent",
        notes:         saved.notes    ?? "",
      }, ...prev]);
    } catch (err) { console.error("Failed to create job order:", err); }
  };

  const handleEdit = async (data: Omit<JobOrder,"id"|"orderNo">) => {
    if (!editJob) return;
    try {
      const saved = await jobOrdersService.update(editJob.id as string, {
        customer:       data.customer,
        vehicle:        data.vehicle,
        service:        data.service,
        assigned_staff: data.assignedStaff,
        staff_id:       data.staffId || undefined,
        scheduled_date: data.date,
        estimated_time: data.estimatedTime,
        priority:       data.priority,
        status:         data.status,
        notes:          data.notes,
      });
      setJobOrders(prev => prev.map(j => j.id === editJob.id ? {
        ...j,
        customer:      saved.customer,
        vehicle:       saved.vehicle,
        service:       saved.service,
        assignedStaff: saved.assigned_staff,
        date:          saved.scheduled_date.split("T")[0],
        estimatedTime: saved.estimated_time,
        status:        saved.status   as JobStatus,
        priority:      saved.priority as "Normal"|"Urgent",
        notes:         saved.notes    ?? "",
      } : j));
      setEditJob(null);
    } catch (err) { console.error("Failed to update job order:", err); }
  };

  const handleStatusChange = async (id: number|string, status: JobStatus) => {
    try {
      await jobOrdersService.update(String(id), { status });
      setJobOrders(prev => prev.map(j => j.id === id ? { ...j, status } : j));
    } catch (err) { console.error("Failed to update status:", err); }
  };

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-white text-3xl font-bold mb-1">Job Orders</h1><p className="text-white/60 text-sm">Create and assign service jobs to technicians</p></div>
        <button onClick={() => setShowCreate(true)}
          className="self-start sm:self-auto inline-flex items-center gap-2 bg-gradient-to-r from-[#E41E6A] to-pink-600 hover:from-[#c41559] text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-[#E41E6A]/25 transition-all">
          <Plus className="w-4 h-4" />Create Job Order
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:"Pending",     value:pending,    icon:<Clock       className="w-4 h-4"/>, iconBg:"bg-yellow-500/10", iconColor:"text-yellow-400" },
          { label:"In Progress", value:inProgress, icon:<Wrench      className="w-4 h-4"/>, iconBg:"bg-blue-500/10",   iconColor:"text-blue-400"   },
          { label:"Completed",   value:completed,  icon:<CheckCircle className="w-4 h-4"/>, iconBg:"bg-green-500/10",  iconColor:"text-green-400"  },
          { label:"Urgent",      value:urgent,     icon:<AlertCircle className="w-4 h-4"/>, iconBg:"bg-red-500/10",    iconColor:"text-red-400"    },
        ].map((s,i) => (
          <Card key={i} className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur" style={{ borderRadius:"12px" }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-white/70">{s.label}</CardTitle>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${s.iconBg}`}><span className={s.iconColor}>{s.icon}</span></div>
            </CardHeader>
            <CardContent style={{ paddingBottom:"20px" }}><div className="text-white text-2xl font-bold">{s.value}</div></CardContent>
          </Card>
        ))}
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
          <input type="text" placeholder="Search by customer, vehicle, service, staff..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#E41E6A] focus:ring-1 focus:ring-[#E41E6A]/30 transition-colors" />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <SlidersHorizontal className="w-4 h-4 text-white/40 flex-shrink-0" />
          {(["All","Pending","In Progress","Completed","Cancelled"] as const).map(f => (
            <button key={f} onClick={() => setFilterStatus(f)}
              className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-colors ${filterStatus===f ? "bg-[#E41E6A] text-white border-[#E41E6A]" : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white"}`}>{f}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur overflow-hidden" style={{ borderRadius:"12px" }}>
        <CardHeader className="border-b border-white/10 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2"><ClipboardList className="w-5 h-5 text-[#E41E6A]" />Job Order List</CardTitle>
            <span className="text-white/40 text-xs">{filtered.length} order{filtered.length!==1?"s":""}</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-[#E41E6A]/30 border-t-[#E41E6A] rounded-full animate-spin mb-3" />
              <p className="text-white/50 text-sm">Loading...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 flex flex-col items-center text-center">
              <ClipboardList className="w-10 h-10 text-white/20 mb-3" />
              <p className="text-white/50 text-sm">No job orders yet.</p>
              <button onClick={() => setShowCreate(true)} className="mt-2 text-xs text-[#E41E6A] hover:text-pink-400 transition-colors">Create your first job order →</button>
            </div>
          ) : (
            <>
              {/* Mobile */}
              <div className="sm:hidden divide-y divide-white/5">
                {filtered.map(j => (
                  <div key={j.id} className="p-4 hover:bg-white/5 transition-colors space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2"><span className="text-[#E41E6A] text-xs font-bold">{j.orderNo}</span>{j.priority==="Urgent"&&<span className="text-xs px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">Urgent</span>}</div>
                        <p className="text-white text-sm font-semibold mt-0.5">{j.service}</p>
                      </div>
                      <StatusBadge status={j.status} />
                    </div>
                    <p className="text-white/50 text-xs flex items-center gap-1"><User className="w-3 h-3"/>{j.customer} · {j.vehicle}</p>
                    <p className="text-white/50 text-xs flex items-center gap-1"><Users className="w-3 h-3 text-[#E41E6A]"/>{j.assignedStaff}</p>
                    <div className="flex gap-2 pt-1">
                      <button onClick={() => setViewJob(j)} className="flex items-center gap-1 text-xs font-medium text-[#E41E6A] hover:text-pink-400 transition-colors"><Eye className="w-3.5 h-3.5"/>View</button>
                      <button onClick={() => setEditJob(j)} className="flex items-center gap-1 text-xs font-medium text-sky-400 hover:text-sky-300 transition-colors"><Edit2 className="w-3.5 h-3.5"/>Edit</button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-white/10">
                    {["Order No","Customer","Vehicle","Service","Assigned Staff","Date","Est. Time","Status","Actions"].map(h => (
                      <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-white/50 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody className="divide-y divide-white/5">
                    {filtered.map(j => (
                      <tr key={j.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3.5"><span className="text-[#E41E6A] text-xs font-bold">{j.orderNo}</span>{j.priority==="Urgent"&&<span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">!</span>}</td>
                        <td className="px-4 py-3.5 text-white text-sm font-medium whitespace-nowrap">{j.customer}</td>
                        <td className="px-4 py-3.5 text-white/60 text-sm whitespace-nowrap">{j.vehicle}</td>
                        <td className="px-4 py-3.5"><div className="flex items-center gap-2"><div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">{serviceIcon(j.service)}</div><span className="text-white text-sm max-w-[140px] truncate">{j.service}</span></div></td>
                        <td className="px-4 py-3.5 text-white/70 text-sm max-w-[160px]">
                          <span className="flex items-center gap-1.5 truncate"><Users className="w-3.5 h-3.5 text-white/40 flex-shrink-0"/>{j.assignedStaff}</span>
                        </td>
                        <td className="px-4 py-3.5 text-white/60 text-xs whitespace-nowrap">{formatDate(j.date)}</td>
                        <td className="px-4 py-3.5 text-white/60 text-xs whitespace-nowrap">{j.estimatedTime}</td>
                        <td className="px-4 py-3.5"><StatusBadge status={j.status}/></td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <button onClick={() => setViewJob(j)} title="View" className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#E41E6A]/30 text-[#E41E6A] hover:bg-[#E41E6A]/10 transition-colors"><Eye className="w-3.5 h-3.5"/></button>
                            <button onClick={() => setEditJob(j)} title="Edit" className="w-7 h-7 flex items-center justify-center rounded-lg border border-sky-500/30 text-sky-400 hover:bg-sky-500/10 transition-colors"><Edit2 className="w-3.5 h-3.5"/></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      {showCreate && <CreateJobOrderModal employees={employees} appointments={appointments} onClose={() => setShowCreate(false)} onSave={handleCreate} />}
      {editJob    && <EditJobOrderModal   initial={editJob} employees={employees} services={services} onClose={() => setEditJob(null)} onSave={handleEdit} />}
      {viewJob    && <ViewModal           job={viewJob} onClose={() => setViewJob(null)} onEdit={() => { setEditJob(viewJob); setViewJob(null); }} onStatusChange={handleStatusChange} />}
    </div>
  );
}

export default FrontDeskJobOrders;
