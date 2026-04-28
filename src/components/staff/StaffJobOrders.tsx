import { useState, useEffect, useMemo } from "react";
import {
  Search, ClipboardList, ChevronDown, SlidersHorizontal,
  Car, User, Calendar, Clock, Shield, Layers, Sparkles,
  Wrench, X, CheckCircle, PlayCircle, XCircle, Eye,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../dashboard-ui/card";
import { useAuth } from "../../hooks/useAuth";
import { getAppointments, updateAppointmentStatus } from "../../services/appointments";

const API_URL = import.meta.env.VITE_API_BASE_URL;

// ─── TYPES ────────────────────────────────────────────────────────────────────

type JobStatus = "Pending" | "Scheduled" | "Confirmed" | "In Progress" | "Completed" | "Cancelled";

interface Job {
  id: string | number;
  service: string;
  customer: string;
  vehicle: string;
  date: string;
  time: string;
  notes: string;
  status: JobStatus;
  source: "appointment" | "job_order";
}

// ─── STATUS CONFIG ─────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<string, { bg: string; text: string; dot: string; border: string }> = {
  Pending:      { bg: "bg-yellow-500/20", text: "text-yellow-400", dot: "bg-yellow-400", border: "border-yellow-500/30" },
  Scheduled:    { bg: "bg-green-500/20",  text: "text-green-400",  dot: "bg-green-500",  border: "border-green-500/30"  },
  Confirmed:    { bg: "bg-green-500/20",  text: "text-green-400",  dot: "bg-green-500",  border: "border-green-500/30"  },
  "In Progress":{ bg: "bg-blue-500/20",   text: "text-blue-400",   dot: "bg-blue-500",   border: "border-blue-500/30"   },
  Completed:    { bg: "bg-white/10",      text: "text-white/50",   dot: "bg-white/30",   border: "border-white/10"      },
  Cancelled:    { bg: "bg-red-500/20",    text: "text-red-400",    dot: "bg-red-500",    border: "border-red-500/30"    },
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function serviceIcon(s: string) {
  const v = (s ?? "").toLowerCase();
  if (v.includes("coating") || v.includes("ceramic")) return <Shield   className="w-4 h-4 text-[#E41E6A]"  />;
  if (v.includes("ppf") || v.includes("paint"))       return <Layers   className="w-4 h-4 text-violet-400" />;
  if (v.includes("tint"))                             return <Sparkles className="w-4 h-4 text-sky-400"    />;
  return                                                     <Wrench   className="w-4 h-4 text-emerald-400"/>;
}

function formatDate(raw: string) {
  return new Date(raw).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE["Pending"];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${s.bg} ${s.text} ${s.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />{status}
    </span>
  );
}

const inputClass = "w-full px-4 h-10 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/25 focus:outline-none focus:border-[#E41E6A] focus:ring-1 focus:ring-[#E41E6A]/30 transition-colors text-sm";

// ─── DETAIL MODAL ─────────────────────────────────────────────────────────────

function JobDetailModal({ job, onClose, onUpdateStatus }: {
  job: Job;
  onClose: () => void;
  onUpdateStatus: (id: string | number, status: JobStatus) => Promise<void>;
}) {
  const [status,   setStatus]   = useState<JobStatus>(job.status);
  const [isSaving, setIsSaving] = useState(false);
  const [success,  setSuccess]  = useState(false);

  const handleUpdate = async () => {
    if (status === job.status) { onClose(); return; }
    setIsSaving(true);
    try {
      await onUpdateStatus(job.id, status);
      setSuccess(true);
      setTimeout(() => { setSuccess(false); onClose(); }, 1200);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const Row = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
    <div className="p-3 bg-white/5 rounded-lg border border-white/10 flex items-start gap-3">
      <div className="mt-0.5 text-[#E41E6A] flex-shrink-0">{icon}</div>
      <div>
        <p className="text-white/50 text-xs">{label}</p>
        <p className="text-white text-sm font-medium mt-0.5">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm" style={{ backgroundColor: "rgba(0,0,0,0.8)" }}>
      <div className="bg-[#0a0a0a] border border-white/10 rounded-xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-white/10 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-white text-xl font-bold">Job Details</h2>
            <p className="text-white/50 text-xs mt-0.5">{formatDate(job.date)}</p>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-3">
          <Row icon={<Shield   className="w-4 h-4" />} label="Service"  value={job.service}  />
          <Row icon={<User     className="w-4 h-4" />} label="Customer" value={job.customer} />
          <Row icon={<Car      className="w-4 h-4" />} label="Vehicle"  value={job.vehicle}  />
          <Row icon={<Calendar className="w-4 h-4" />} label="Date"     value={formatDate(job.date)} />
          <Row icon={<Clock    className="w-4 h-4" />} label="Time"     value={job.time} />
          {job.notes && <Row icon={<FileText className="w-4 h-4" />} label="Notes" value={job.notes} />}

          <div className="pt-2">
            <p className="text-white/50 text-xs font-medium mb-2">Update Status</p>
            <div className="flex gap-2 mb-3">
              {job.status !== "In Progress" && job.status !== "Completed" && (
                <button
                  onClick={() => setStatus("In Progress")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                    status === "In Progress" ? "bg-blue-500/20 text-blue-400 border-blue-500/30" : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10"
                  }`}
                >
                  <PlayCircle className="w-3.5 h-3.5" />Start
                </button>
              )}
              <button
                onClick={() => setStatus("Completed")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                  status === "Completed" ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10"
                }`}
              >
                <CheckCircle className="w-3.5 h-3.5" />Complete
              </button>
              <button
                onClick={() => setStatus("Cancelled")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                  status === "Cancelled" ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10"
                }`}
              >
                <XCircle className="w-3.5 h-3.5" />Cancel
              </button>
            </div>

            <div className="relative">
              <select
                className={inputClass + " appearance-none pr-8"}
                value={status}
                onChange={e => setStatus(e.target.value as JobStatus)}
              >
                {(["Pending","Scheduled","Confirmed","In Progress","Completed","Cancelled"] as JobStatus[]).map(s => (
                  <option key={s} value={s} className="bg-[#0a0a0a]">{s}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
            </div>
          </div>

          {success && (
            <div className="flex items-center gap-2 text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
              <CheckCircle className="w-4 h-4" />Status updated successfully!
            </div>
          )}
        </div>

        <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium border border-white/10 text-white hover:bg-white/10 rounded-lg transition-colors">
            Close
          </button>
          <button
            onClick={handleUpdate}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#E41E6A] to-pink-600 hover:from-[#c41559] rounded-lg transition-all disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Update Status"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export function StaffJobOrders() {
  const { profile } = useAuth();
  const [jobs,         setJobs]         = useState<Job[]>([]);
  const [isLoading,    setIsLoading]    = useState(true);
  const [search,       setSearch]       = useState("");
  const [filterStatus, setFilterStatus] = useState<"All" | string>("All");
  const [viewJob,      setViewJob]      = useState<Job | null>(null);

  useEffect(() => {
  if (profile?.full_name) fetchData();
}, [profile?.full_name]);

 const fetchData = async () => {
  setIsLoading(true);
  try {
    const staffName = (profile?.full_name ?? "").trim().toLowerCase();

    const [appts, jobOrdersRes] = await Promise.all([
      getAppointments().catch(() => []),
      fetch(`${import.meta.env.VITE_API_BASE_URL}/job-orders?limit=200&t=${Date.now()}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      })
        .then(r => r.json())
        .catch(() => ({ data: [] })),
    ]);

    // Appointments assigned to this staff
    const myApptJobs: Job[] = (Array.isArray(appts) ? appts : [])
      .filter((a: any) => {
        const assignedTo = (
          a.employees?.name ??
          a.technician ??
          a.assigned_staff ??
          ""
        ).toLowerCase();
        return (
          assignedTo.includes(staffName) ||
          a.employee_id === profile?.id
        );
      })
      .map((a: any) => {
        const d = new Date(a.date || a.scheduled_date);
        return {
          id:       a.id,
          service:  a.service_type ?? a.service ?? "Service",
          customer: a.customers?.name ?? a.full_name ?? a.customer ?? "Customer",
          vehicle:  [a.vehicle_make, a.vehicle_model, a.vehicle_class].filter(Boolean).join(" ") || a.customers?.vehicle || a.vehicle || "Vehicle",
          date:     (a.date || a.scheduled_date || "").split("T")[0],
          time:     d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          notes:    a.notes ?? "",
          status:   (a.status ?? "Pending") as JobStatus,
          source:   "appointment" as const,
        };
      });

    // Job orders assigned to this staff — match by name in assigned_staff string
    const myJobOrders: Job[] = (jobOrdersRes.data ?? [])
      .filter((j: any) => {
        if (!staffName) return false;
        const assigned = (j.assigned_staff ?? "").toLowerCase();
        // assigned_staff is comma-separated e.g. "Borgalec, John Cena"
        return assigned
          .split(",")
          .map((s: string) => s.trim())
          .some((s: string) => s.includes(staffName) || staffName.includes(s));
      })
      .map((j: any) => ({
        id:       j.id,
        service:  j.service  ?? "Service",
        customer: j.customer ?? "Customer",
        vehicle:  j.vehicle  ?? "Vehicle",
        date:     (j.scheduled_date ?? "").split("T")[0],
        time:     "—",
        notes:    j.notes ?? "",
        status:   j.status as JobStatus,
        source:   "job_order" as const,
      }));

    const allJobs = [...myApptJobs, ...myJobOrders]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setJobs(allJobs);
  } catch (err) {
    console.error("StaffJobOrders fetch error:", err);
  } finally {
    setIsLoading(false);
  }
};

  const handleUpdateStatus = async (id: string | number, status: JobStatus) => {
    // Optimistic UI update
    setJobs(prev => prev.map(j => j.id === id ? { ...j, status } : j));

    try {
      const job = jobs.find(j => j.id === id);

      if (job?.source === "job_order") {
        await fetch(`${import.meta.env.VITE_API_BASE_URL}/job-orders/${id}`, {
          method:  "PATCH",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ status }),
        });
      } else {
        await updateAppointmentStatus(String(id), status as any);
      }
    } catch (err) {
      console.error("Update status error:", err);
    }
  };

  const filtered = useMemo(() =>
    jobs
      .filter(j => filterStatus === "All" || j.status === filterStatus)
      .filter(j =>
        j.service.toLowerCase().includes(search.toLowerCase())  ||
        j.customer.toLowerCase().includes(search.toLowerCase()) ||
        j.vehicle.toLowerCase().includes(search.toLowerCase())
      ),
    [jobs, search, filterStatus]
  );

  const active    = jobs.filter(j => j.status === "In Progress").length;
  const pending   = jobs.filter(j => j.status === "Pending" || j.status === "Confirmed" || j.status === "Scheduled").length;
  const completed = jobs.filter(j => j.status === "Completed").length;

  return (
    <div className="space-y-6 w-full">

      {/* ── Header ── */}
      <div>
        <h1 className="text-white text-3xl font-bold mb-1">My Job Orders</h1>
        <p className="text-white/60 text-sm">All jobs assigned to you — tap any job to update its status</p>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Active",    value: active,    icon: <Wrench      className="w-4 h-4" />, iconBg: "bg-blue-500/10",   iconColor: "text-blue-400"   },
          { label: "Pending",   value: pending,   icon: <Clock       className="w-4 h-4" />, iconBg: "bg-yellow-500/10", iconColor: "text-yellow-400" },
          { label: "Completed", value: completed, icon: <CheckCircle className="w-4 h-4" />, iconBg: "bg-green-500/10",  iconColor: "text-green-400"  },
        ].map((s, i) => (
          <Card key={i} className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur" style={{ borderRadius: "12px" }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-white/70">{s.label}</CardTitle>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${s.iconBg}`}>
                <span className={s.iconColor}>{s.icon}</span>
              </div>
            </CardHeader>
            <CardContent style={{ paddingBottom: "20px" }}>
              <div className="text-white text-2xl font-bold">{isLoading ? "..." : s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Search + Filters ── */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by service, customer, or vehicle..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#E41E6A] focus:ring-1 focus:ring-[#E41E6A]/30 transition-colors"
          />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <SlidersHorizontal className="w-4 h-4 text-white/40 flex-shrink-0" />
          {["All","Pending","In Progress","Completed","Cancelled"].map(f => (
            <button key={f} onClick={() => setFilterStatus(f)}
              className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                filterStatus === f
                  ? "bg-[#E41E6A] text-white border-[#E41E6A]"
                  : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white"
              }`}>{f}
            </button>
          ))}
        </div>
      </div>

      {/* ── Jobs List ── */}
      <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur overflow-hidden" style={{ borderRadius: "12px" }}>
        <CardHeader className="border-b border-white/10 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-[#E41E6A]" />Assigned Jobs
            </CardTitle>
            <span className="text-white/40 text-xs">{filtered.length} job{filtered.length !== 1 ? "s" : ""}</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-[#E41E6A]/30 border-t-[#E41E6A] rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 flex flex-col items-center text-center">
              <ClipboardList className="w-10 h-10 text-white/20 mb-3" />
              <p className="text-white/50 text-sm">No jobs found</p>
              <p className="text-white/30 text-xs mt-1">Jobs assigned to you will appear here</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {filtered.map(job => (
                <div
                  key={String(job.id)}
                  onClick={() => setViewJob(job)}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                    {serviceIcon(job.service)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold truncate">{job.service}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5">
                      <span className="text-xs text-white/50 flex items-center gap-1"><User     className="w-3 h-3" />{job.customer}</span>
                      <span className="text-xs text-white/50 flex items-center gap-1"><Car      className="w-3 h-3" />{job.vehicle}</span>
                      <span className="text-xs text-white/50 flex items-center gap-1"><Calendar className="w-3 h-3 text-[#E41E6A]" />{formatDate(job.date)}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <StatusBadge status={job.status} />
                    <span className="text-[#E41E6A] text-xs flex items-center gap-0.5">
                      <Eye className="w-3 h-3" />Update
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {viewJob && (
        <JobDetailModal
          job={viewJob}
          onClose={() => setViewJob(null)}
          onUpdateStatus={handleUpdateStatus}
        />
      )}
    </div>
  );
}

export default StaffJobOrders;