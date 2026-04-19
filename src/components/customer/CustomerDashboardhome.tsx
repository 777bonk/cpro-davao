import { useState, useEffect } from "react";
import {
  Calendar, Car, CheckCircle, Clock, Plus,
  Banknote, Shield, Layers, Sparkles, Wrench,
  TrendingUp, Star, ChevronRight, MapPin,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../dashboard-ui/card";
import { Badge } from "../dashboard-ui/badge";
import { getAppointments } from "../../services/appointments";
import { getTransactions } from "../../services/finance";
import { useAuth } from "../../hooks/useAuth";

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function serviceIcon(service: string) {
  const s = (service ?? "").toLowerCase();
  if (s.includes("coating"))                                return <Shield   className="w-4 h-4 text-[#E41E6A]"  />;
  if (s.includes("ppf") || s.includes("paint protection")) return <Layers   className="w-4 h-4 text-violet-400" />;
  if (s.includes("tint"))                                   return <Sparkles className="w-4 h-4 text-sky-400"    />;
  return                                                           <Wrench   className="w-4 h-4 text-white/50"   />;
}

const STATUS_STYLE: Record<string, { bg: string; text: string; dot: string; border: string }> = {
  Confirmed:    { bg: "bg-green-500/20",  text: "text-green-400",  dot: "bg-green-500",  border: "border-green-500/30"  },
  Pending:      { bg: "bg-yellow-500/20", text: "text-yellow-400", dot: "bg-yellow-400", border: "border-yellow-500/30" },
  "In Progress":{ bg: "bg-blue-500/20",   text: "text-blue-400",   dot: "bg-blue-500",   border: "border-blue-500/30"   },
  Scheduled:    { bg: "bg-green-500/20",  text: "text-green-400",  dot: "bg-green-500",  border: "border-green-500/30"  },
  Completed:    { bg: "bg-white/10",      text: "text-white/50",   dot: "bg-white/30",   border: "border-white/10"      },
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export function CustomerDashboardHome({ onNavigate }: { onNavigate?: (section: string) => void }) {
  // ── Real auth profile from Supabase ──────────────────────────────────────
  const { profile, isLoading: profileLoading } = useAuth();

  const [isLoading,      setIsLoading]      = useState(true);
  const [totalSpent,     setTotalSpent]     = useState(0);
  const [loyaltyPts,     setLoyaltyPts]     = useState(0);
  const [servicesDone,   setServicesDone]   = useState(0);
  const [upcomingAppts,  setUpcomingAppts]  = useState<any[]>([]);
  const [recentServices, setRecentServices] = useState<any[]>([]);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [appts, transactions] = await Promise.all([
        getAppointments().catch(() => []),
        getTransactions().catch(() => []),
      ]);

      const now = new Date();

      // Upcoming appointments
      const upcoming = appts
        .filter((a: any) => {
          const d = new Date(a.date || a.scheduled_date);
          return d >= now && a.status !== "Completed" && a.status !== "Cancelled";
        })
        .sort((a: any, b: any) =>
          new Date(a.date || a.scheduled_date).getTime() -
          new Date(b.date || b.scheduled_date).getTime()
        )
        .slice(0, 3);
      setUpcomingAppts(upcoming);

      // Completed services
      const completed = appts.filter((a: any) => a.status === "Completed");
      setServicesDone(completed.length);
      const recent = [...completed]
        .sort((a: any, b: any) =>
          new Date(b.date || b.scheduled_date).getTime() -
          new Date(a.date || a.scheduled_date).getTime()
        )
        .slice(0, 3);
      setRecentServices(recent);

      // Total spent + loyalty
      let spent = 0;
      transactions.forEach((t: any) => { if (t.type === "income") spent += Number(t.amount); });
      setTotalSpent(spent);
      setLoyaltyPts(Math.floor(spent / 100));

    } catch (err) {
      console.error("CustomerDashboardHome fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Use profile full_name from useAuth — falls back gracefully while loading
  const fullName    = profile?.full_name ?? "Customer";
  const firstName   = fullName.split(" ")[0];
  const nextAppt    = upcomingAppts[0];

  // Build unique vehicle list from appointment data
  const vehicleList = Array.from(new Set([
    ...upcomingAppts.map((a: any)  => a.customers?.vehicle ?? a.vehicle),
    ...recentServices.map((a: any) => a.customers?.vehicle ?? a.vehicle),
  ].filter(Boolean))) as string[];
  const nextApptDate = nextAppt
    ? new Date(nextAppt.date || nextAppt.scheduled_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : "—";

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-white text-3xl font-bold mb-1">
            Welcome back, <span className="text-[#E41E6A]">{(isLoading || profileLoading) ? "..." : firstName}!</span>
          </h1>
          <p className="text-white/60 text-sm">{`Welcome, ${fullName}! Here's what's happening with your vehicles.`}</p>
        </div>
        <button
          onClick={() => onNavigate?.("appointments")}
          className="self-start sm:self-auto inline-flex items-center gap-2 bg-gradient-to-r from-[#E41E6A] to-pink-600 hover:from-[#c41559] text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-[#E41E6A]/25 transition-all"
        >
          <Plus className="w-4 h-4" />Book Appointment
        </button>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Upcoming",      value: isLoading ? "..." : upcomingAppts.length, sub: "scheduled services",  icon: <Calendar    className="w-4 h-4" />, iconBg: "bg-[#E41E6A]/10", iconColor: "text-[#E41E6A]"  },
          { title: "My Vehicle",    value: isLoading ? "..." : (recentServices[0]?.customers?.vehicle ?? upcomingAppts[0]?.customers?.vehicle ?? upcomingAppts[0]?.vehicle ?? "—"), sub: "registered vehicle", icon: <Car className="w-4 h-4" />, iconBg: "bg-sky-500/10", iconColor: "text-sky-400" },
          { title: "Services Done", value: isLoading ? "..." : servicesDone,           sub: "completed jobs",    icon: <CheckCircle className="w-4 h-4" />, iconBg: "bg-green-500/10",  iconColor: "text-green-400"  },
          { title: "Next Service",  value: isLoading ? "..." : nextApptDate,           sub: nextAppt ? (nextAppt.service_type ?? "Appointment") : "No upcoming", icon: <Clock className="w-4 h-4" />, iconBg: "bg-violet-500/10", iconColor: "text-violet-400" },
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
              <p className="text-xs text-white/50 mt-1 truncate">{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Loyalty Banner ── */}
      <div className="bg-gradient-to-r from-[#E41E6A] to-pink-600 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-lg shadow-[#E41E6A]/20">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Star className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-white/80 text-xs font-semibold uppercase tracking-wide">Loyalty Points</p>
            <p className="text-white text-3xl font-bold">{isLoading ? "..." : loyaltyPts.toLocaleString()} pts</p>
            <p className="text-white/70 text-xs mt-0.5">Total spent: {isLoading ? "..." : `₱${totalSpent.toLocaleString()}`}</p>
          </div>
        </div>
        <div className="flex flex-col sm:items-end gap-2">
          <span className="text-white/90 text-sm font-semibold">
            {loyaltyPts >= 1000 ? "🥇 Gold Member" : loyaltyPts >= 500 ? "🥈 Silver Member" : "🥉 Bronze Member"}
          </span>
          <div className="w-full sm:w-48 h-2 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${Math.min((loyaltyPts % 1000) / 10, 100)}%` }} />
          </div>
          <p className="text-white/60 text-xs">
            {loyaltyPts >= 1000 ? "Max tier reached!" : `${1000 - (loyaltyPts % 1000)} pts to next tier`}
          </p>
        </div>
      </div>

      {/* ── Upcoming + Recent ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Upcoming Appointments */}
        <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur" style={{ borderRadius: "12px" }}>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#E41E6A]" />Upcoming Appointments
            </CardTitle>
            <button onClick={() => onNavigate?.("appointments")} className="flex items-center gap-1 text-xs text-[#E41E6A] hover:text-pink-400 transition-colors">
              View all <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </CardHeader>
          <CardContent style={{ paddingBottom: "20px" }}>
            <div className="space-y-3">
              {isLoading ? (
                <p className="text-white/50 text-sm text-center py-4">Loading...</p>
              ) : upcomingAppts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <Calendar className="w-8 h-8 text-white/20 mb-2" />
                  <p className="text-white/50 text-sm">No upcoming appointments</p>
                  <button onClick={() => onNavigate?.("appointments")} className="mt-2 text-xs text-[#E41E6A] hover:text-pink-400 transition-colors">Book one now →</button>
                </div>
              ) : (
                upcomingAppts.map((apt: any) => {
                  const apptDate = new Date(apt.date || apt.scheduled_date);
                  const statusKey = apt.status ?? "Pending";
                  const s = STATUS_STYLE[statusKey] ?? STATUS_STYLE["Pending"];
                  return (
                    <div key={apt.id} className="p-3 bg-white/5 rounded-xl border border-white/10 hover:border-[#E41E6A]/40 transition-colors">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                            {serviceIcon(apt.service_type ?? "")}
                          </div>
                          <p className="text-white text-sm font-medium truncate max-w-[150px]">{apt.service_type ?? "Appointment"}</p>
                        </div>
                        <Badge className={`${s.bg} ${s.text} ${s.border} flex-shrink-0 text-xs`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${s.dot} mr-1.5`} />{statusKey}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-white/50">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-[#E41E6A]" />{apptDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-[#E41E6A]" />{apptDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Services */}
        <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur" style={{ borderRadius: "12px" }}>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-white flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />Recent Services
            </CardTitle>
            <button onClick={() => onNavigate?.("history")} className="flex items-center gap-1 text-xs text-[#E41E6A] hover:text-pink-400 transition-colors">
              View all <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </CardHeader>
          <CardContent style={{ paddingBottom: "20px" }}>
            <div className="space-y-3">
              {isLoading ? (
                <p className="text-white/50 text-sm text-center py-4">Loading...</p>
              ) : recentServices.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <CheckCircle className="w-8 h-8 text-white/20 mb-2" />
                  <p className="text-white/50 text-sm">No completed services yet</p>
                </div>
              ) : (
                recentServices.map((svc: any) => {
                  const svcDate = new Date(svc.date || svc.scheduled_date);
                  return (
                    <div key={svc.id} className="p-3 bg-white/5 rounded-xl border border-white/10 hover:border-green-500/30 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                            {serviceIcon(svc.service_type ?? "")}
                          </div>
                          <div className="min-w-0">
                            <p className="text-white text-sm font-medium truncate">{svc.service_type ?? "Service"}</p>
                            <p className="text-white/50 text-xs flex items-center gap-1 mt-0.5">
                              <Car className="w-3 h-3" />{svc.customers?.vehicle ?? svc.vehicle ?? "Vehicle"}
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-white text-sm font-bold">₱{Number(svc.total_cost || svc.amount || 0).toLocaleString()}</p>
                          <p className="text-white/40 text-xs mt-0.5">{svcDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── My Vehicle ── */}
      <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur" style={{ borderRadius: "12px" }}>
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center gap-2">
            <Car className="w-5 h-5 text-[#E41E6A]" />My Vehicle
          </CardTitle>
        </CardHeader>
        <CardContent style={{ paddingBottom: "20px" }}>
          {(isLoading || profileLoading) ? (
            <p className="text-white/50 text-sm text-center py-4">Loading...</p>
          ) : vehicleList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <Car className="w-8 h-8 text-white/20 mb-2" />
              <p className="text-white/50 text-sm">No vehicles found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {vehicleList.map((v, i) => (
                <div key={i} className="p-4 bg-white/5 rounded-xl border border-white/10 hover:border-[#E41E6A]/40 transition-colors flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#E41E6A]/10 flex items-center justify-center flex-shrink-0">
                    <Car className="w-5 h-5 text-[#E41E6A]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-white text-sm font-semibold truncate">{v}</p>
                    <p className="text-white/40 text-xs mt-0.5 flex items-center gap-1"><MapPin className="w-3 h-3" />Registered vehicle</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}

export default CustomerDashboardHome;