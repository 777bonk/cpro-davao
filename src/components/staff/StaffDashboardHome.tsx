import { useState, useEffect } from "react";
import {
  ClipboardList, CheckCircle, Clock, Wrench,
  ChevronRight, Shield, Layers, Sparkles,
  User, Car, Calendar, AlertCircle, Package,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../dashboard-ui/card";
import { Badge } from "../dashboard-ui/badge";
import { useAuth } from "../../hooks/useAuth";
import { getAppointments } from "../../services/appointments";
import { getInventory }    from "../../services/inventory";

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function serviceIcon(service: string) {
  const s = (service ?? "").toLowerCase();
  if (s.includes("coating") || s.includes("ceramic")) return <Shield   className="w-4 h-4 text-[#E41E6A]"  />;
  if (s.includes("ppf") || s.includes("paint"))       return <Layers   className="w-4 h-4 text-violet-400" />;
  if (s.includes("tint"))                             return <Sparkles className="w-4 h-4 text-sky-400"    />;
  return                                                     <Wrench   className="w-4 h-4 text-emerald-400"/>;
}

const STATUS_STYLE: Record<string, { bg: string; text: string; dot: string; border: string }> = {
  Pending:      { bg: "bg-yellow-500/20", text: "text-yellow-400", dot: "bg-yellow-400", border: "border-yellow-500/30" },
  Scheduled:    { bg: "bg-green-500/20",  text: "text-green-400",  dot: "bg-green-500",  border: "border-green-500/30"  },
  Confirmed:    { bg: "bg-green-500/20",  text: "text-green-400",  dot: "bg-green-500",  border: "border-green-500/30"  },
  "In Progress":{ bg: "bg-blue-500/20",   text: "text-blue-400",   dot: "bg-blue-500",   border: "border-blue-500/30"   },
  Completed:    { bg: "bg-white/10",      text: "text-white/50",   dot: "bg-white/30",   border: "border-white/10"      },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE["Pending"];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${s.bg} ${s.text} ${s.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />{status}
    </span>
  );
}

function formatDate(raw: string) {
  return new Date(raw).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export function StaffDashboardHome({ onNavigate }: { onNavigate?: (s: string) => void }) {
  const { profile, isLoading: profileLoading } = useAuth();

  const [isLoading,      setIsLoading]      = useState(true);
  const [activeJobs,     setActiveJobs]     = useState<any[]>([]);
  const [completedToday, setCompletedToday] = useState(0);
  const [totalAssigned,  setTotalAssigned]  = useState(0);
  const [lowStockCount,  setLowStockCount]  = useState(0);

  const firstName = profile?.full_name?.split(" ")[0] ?? "Staff";
  const fullName  = profile?.full_name ?? "Staff";

  useEffect(() => { fetchData(); }, [profile]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [appts, inventory] = await Promise.all([
        getAppointments().catch(() => []),
        getInventory().catch(()    => []),
      ]);

      const now       = new Date();
      const todayStr  = now.toDateString();

      // Filter jobs assigned to this staff member (match by name or employee id)
      const myJobs = appts.filter((a: any) => {
        const assignedTo = a.employees?.name ?? a.technician ?? a.assigned_staff ?? "";
        return assignedTo.toLowerCase().includes((profile?.full_name ?? "").toLowerCase()) ||
               a.employee_id === profile?.id;
      });

      const active = myJobs.filter((a: any) =>
        a.status === "In Progress" || a.status === "Pending" || a.status === "Confirmed" || a.status === "Scheduled"
      );

      const doneToday = myJobs.filter((a: any) => {
        const d = new Date(a.date || a.scheduled_date);
        return a.status === "Completed" && d.toDateString() === todayStr;
      });

      setActiveJobs(active.slice(0, 3));
      setTotalAssigned(myJobs.length);
      setCompletedToday(doneToday.length);
      setLowStockCount(inventory.filter((i: any) => i.stock <= i.reorderLevel).length);

    } catch (err) {
      console.error("StaffDashboardHome fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const loading = isLoading || profileLoading;

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-white text-3xl font-bold mb-1">
            Good day, <span className="text-[#E41E6A]">{loading ? "..." : firstName}!</span>
          </h1>
          <p className="text-white/60 text-sm">
            {loading ? "Loading your dashboard..." : `Here's your work summary, ${fullName}.`}
          </p>
        </div>
        <button
          onClick={() => onNavigate?.("joborders")}
          className="self-start sm:self-auto inline-flex items-center gap-2 bg-gradient-to-r from-[#E41E6A] to-pink-600 hover:from-[#c41559] text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-[#E41E6A]/25 transition-all"
        >
          <ClipboardList className="w-4 h-4" />View My Jobs
        </button>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Active Jobs",      value: loading ? "..." : activeJobs.length,  sub: "currently assigned",      icon: <Wrench      className="w-4 h-4" />, iconBg: "bg-blue-500/10",    iconColor: "text-blue-400"    },
          { title: "Completed Today",  value: loading ? "..." : completedToday,     sub: "finished today",          icon: <CheckCircle className="w-4 h-4" />, iconBg: "bg-green-500/10",   iconColor: "text-green-400"   },
          { title: "Total Assigned",   value: loading ? "..." : totalAssigned,      sub: "all time",                icon: <ClipboardList className="w-4 h-4"/>,iconBg: "bg-[#E41E6A]/10",  iconColor: "text-[#E41E6A]"   },
          { title: "Low Stock Items",  value: loading ? "..." : lowStockCount,      sub: "need restocking",         icon: <Package     className="w-4 h-4" />, iconBg: lowStockCount > 0 ? "bg-orange-500/10" : "bg-white/5", iconColor: lowStockCount > 0 ? "text-orange-400" : "text-white/40" },
        ].map((s, i) => (
          <Card key={i} className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur" style={{ borderRadius: "12px" }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-white/70">{s.title}</CardTitle>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${s.iconBg}`}>
                <span className={s.iconColor}>{s.icon}</span>
              </div>
            </CardHeader>
            <CardContent style={{ paddingBottom: "20px" }}>
              <div className="text-white text-2xl font-bold">{s.value}</div>
              <p className="text-white/50 text-xs mt-1">{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Today's Active Jobs ── */}
      <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur" style={{ borderRadius: "12px" }}>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-white flex items-center gap-2">
            <Wrench className="w-5 h-5 text-[#E41E6A]" />My Active Jobs
          </CardTitle>
          <button onClick={() => onNavigate?.("joborders")} className="flex items-center gap-1 text-xs text-[#E41E6A] hover:text-pink-400 transition-colors">
            View all <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </CardHeader>
        <CardContent style={{ paddingBottom: "20px" }}>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-[#E41E6A]/30 border-t-[#E41E6A] rounded-full animate-spin" />
            </div>
          ) : activeJobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle className="w-10 h-10 text-green-400/40 mb-2" />
              <p className="text-white/50 text-sm">No active jobs right now.</p>
              <p className="text-white/30 text-xs mt-1">Check back later or contact your supervisor.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeJobs.map((job: any) => {
                const svc     = job.service_type ?? job.service ?? "Service";
                const vehicle = job.customers?.vehicle ?? job.vehicle ?? "Vehicle";
                const customer = job.customers?.name  ?? job.customer ?? "Customer";
                const date    = new Date(job.date || job.scheduled_date);
                const statusKey = job.status ?? "Pending";
                const s = STATUS_STYLE[statusKey] ?? STATUS_STYLE["Pending"];
                return (
                  <div key={job.id} className="p-4 bg-white/5 rounded-xl border border-white/10 hover:border-[#E41E6A]/40 transition-colors">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                          {serviceIcon(svc)}
                        </div>
                        <div>
                          <p className="text-white text-sm font-semibold leading-snug">{svc}</p>
                          <p className="text-white/50 text-xs flex items-center gap-1 mt-0.5">
                            <User className="w-3 h-3" />{customer}
                          </p>
                        </div>
                      </div>
                      <StatusBadge status={statusKey} />
                    </div>
                    <div className="flex flex-wrap gap-3 pt-2 border-t border-white/10">
                      <span className="flex items-center gap-1 text-xs text-white/50"><Car      className="w-3.5 h-3.5 text-white/40" />{vehicle}</span>
                      <span className="flex items-center gap-1 text-xs text-white/50"><Calendar className="w-3.5 h-3.5 text-[#E41E6A]" />{formatDate(job.date || job.scheduled_date)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Quick Actions ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={() => onNavigate?.("joborders")}
          className="p-5 bg-gradient-to-br from-white/5 to-white/10 border border-white/10 hover:border-[#E41E6A]/40 rounded-xl transition-all text-left group"
        >
          <div className="w-10 h-10 bg-[#E41E6A]/10 rounded-xl flex items-center justify-center mb-3">
            <ClipboardList className="w-5 h-5 text-[#E41E6A]" />
          </div>
          <p className="text-white font-semibold text-sm">My Job Orders</p>
          <p className="text-white/50 text-xs mt-0.5">View all assigned jobs and update status</p>
          <p className="text-[#E41E6A] text-xs mt-2 flex items-center gap-1 group-hover:gap-2 transition-all">
            Open <ChevronRight className="w-3.5 h-3.5" />
          </p>
        </button>

        <button
          onClick={() => onNavigate?.("parts")}
          className="p-5 bg-gradient-to-br from-white/5 to-white/10 border border-white/10 hover:border-violet-500/40 rounded-xl transition-all text-left group"
        >
          <div className="w-10 h-10 bg-violet-500/10 rounded-xl flex items-center justify-center mb-3">
            <Package className="w-5 h-5 text-violet-400" />
          </div>
          <p className="text-white font-semibold text-sm">Request Parts</p>
          <p className="text-white/50 text-xs mt-0.5">Request supplies and materials from inventory</p>
          <p className="text-violet-400 text-xs mt-2 flex items-center gap-1 group-hover:gap-2 transition-all">
            Open <ChevronRight className="w-3.5 h-3.5" />
          </p>
        </button>
      </div>

    </div>
  );
}

export default StaffDashboardHome;