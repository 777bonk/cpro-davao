import { useState } from "react";
import {
  Calendar, Car, CheckCircle, Clock, Plus,
  MapPin, Banknote, Shield, Layers, Sparkles,
  TrendingUp, Star, ChevronRight, Wrench,
} from "lucide-react";

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface Appointment {
  id: number;
  service: string;
  vehicle: string;
  date: string;
  time: string;
  status: "Confirmed" | "Pending" | "In Progress";
  deposit: number;
}

interface ServiceRecord {
  id: number;
  service: string;
  vehicle: string;
  date: string;
  amount: number;
  technician: string;
}

interface Vehicle {
  id: number;
  plate: string;
  name: string;
  color: string;
  colorHex: string;
  year: number;
}

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

const CUSTOMER_NAME = "Juan dela Cruz";

const MOCK_UPCOMING: Appointment[] = [
  { id: 1, service: "Ceramic Coating - Full Body",  vehicle: "2023 Toyota Fortuner",  date: "April 24, 2026", time: "9:00 AM",  status: "Confirmed",   deposit: 3000 },
  { id: 2, service: "Paint Protection Film - Hood", vehicle: "2021 Honda Civic",       date: "May 3, 2026",    time: "1:00 PM",  status: "Pending",     deposit: 1500 },
];

const MOCK_RECENT_SERVICES: ServiceRecord[] = [
  { id: 1, service: "Full Interior Detailing",   vehicle: "2023 Toyota Fortuner",  date: "March 15, 2026", amount: 4500,  technician: "Carlo M." },
  { id: 2, service: "Window Tinting - Full Car", vehicle: "2021 Honda Civic",       date: "Feb 28, 2026",   amount: 8000,  technician: "Rico B."  },
  { id: 3, service: "Nano Ceramic Spray",        vehicle: "2023 Toyota Fortuner",  date: "Jan 10, 2026",   amount: 3200,  technician: "Jomar D." },
];

const MOCK_VEHICLES: Vehicle[] = [
  { id: 1, plate: "ABC 1234", name: "Toyota Fortuner",  color: "Pearl White",  colorHex: "#F5F5F0", year: 2023 },
  { id: 2, plate: "XYZ 5678", name: "Honda Civic",      color: "Lunar Silver", colorHex: "#B0B0B0", year: 2021 },
];

const STATS = {
  upcoming:     MOCK_UPCOMING.length,
  vehicles:     MOCK_VEHICLES.length,
  servicesDone: 7,
  totalSpent:   42800,
  loyaltyPts:   428,
  nextService:  "Apr 24",
};

// ─── STATUS CONFIG ─────────────────────────────────────────────────────────────

const STATUS_STYLE = {
  Confirmed:    { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", border: "border-emerald-200" },
  Pending:      { bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-400",   border: "border-amber-200"   },
  "In Progress":{ bg: "bg-blue-50",    text: "text-blue-700",    dot: "bg-blue-500",    border: "border-blue-200"    },
};

function serviceIcon(service: string) {
  const s = service.toLowerCase();
  if (s.includes("coating"))  return <Shield   className="w-4 h-4 text-[#E41E6A]"  />;
  if (s.includes("ppf") || s.includes("paint protection")) return <Layers className="w-4 h-4 text-violet-500" />;
  if (s.includes("tint"))     return <Sparkles className="w-4 h-4 text-sky-500"    />;
  return                              <Wrench  className="w-4 h-4 text-gray-400"   />;
}

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

function StatCard({ icon, title, value, iconBg, iconColor, sub }: {
  icon: React.ReactNode; title: string; value: string | number;
  iconBg: string; iconColor: string; sub?: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        <span className={iconColor}>{icon}</span>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{title}</p>
        <p className="text-2xl font-bold text-gray-800 leading-tight mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export function CustomerDashboardHome({ onNavigate }: { onNavigate?: (section: string) => void }) {
  const firstName = CUSTOMER_NAME.split(" ")[0];

  return (
    <div className="min-h-full bg-gray-50 p-4 md:p-6 space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Welcome back, <span className="text-[#E41E6A]">{firstName}!</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">Here's what's happening with your vehicles.</p>
        </div>
        <button
          onClick={() => onNavigate?.("appointments")}
          className="self-start sm:self-auto inline-flex items-center gap-2 bg-[#E41E6A] hover:bg-[#c41559] text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-[#E41E6A]/25 transition-colors"
        >
          <Plus className="w-4 h-4" />Book Appointment
        </button>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard icon={<Calendar  className="w-5 h-5" />} title="Upcoming"     value={STATS.upcoming}                    iconBg="bg-rose-50"    iconColor="text-[#E41E6A]"  />
        <StatCard icon={<Car       className="w-5 h-5" />} title="My Vehicles"  value={STATS.vehicles}                    iconBg="bg-sky-50"     iconColor="text-sky-500"    />
        <StatCard icon={<CheckCircle className="w-5 h-5"/>} title="Services Done" value={STATS.servicesDone}              iconBg="bg-emerald-50" iconColor="text-emerald-500" />
        <StatCard icon={<Clock     className="w-5 h-5" />} title="Next Service"  value={STATS.nextService}                iconBg="bg-violet-50"  iconColor="text-violet-500"  />
      </div>

      {/* ── Loyalty / Spend Banner ── */}
      <div className="bg-gradient-to-r from-[#E41E6A] to-pink-500 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-lg shadow-[#E41E6A]/20">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Star className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-white/80 text-xs font-medium uppercase tracking-wide">Loyalty Points</p>
            <p className="text-white text-3xl font-bold">{STATS.loyaltyPts.toLocaleString()} pts</p>
            <p className="text-white/70 text-xs mt-0.5">Total spent: ₱{STATS.totalSpent.toLocaleString()}</p>
          </div>
        </div>
        <div className="flex flex-col sm:items-end gap-1">
          <div className="flex items-center gap-1.5 text-white/80 text-sm">
            <TrendingUp className="w-4 h-4" />
            <span>Silver Member</span>
          </div>
          <p className="text-white/60 text-xs">572 pts away from Gold</p>
          <div className="w-full sm:w-40 h-1.5 bg-white/20 rounded-full mt-1 overflow-hidden">
            <div className="h-full bg-white rounded-full" style={{ width: `${(STATS.loyaltyPts / 1000) * 100}%` }} />
          </div>
        </div>
      </div>

      {/* ── Upcoming Appointments ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-bold text-gray-800">Upcoming Appointments</h2>
            <p className="text-xs text-gray-400 mt-0.5">Your next scheduled services</p>
          </div>
          <button
            onClick={() => onNavigate?.("appointments")}
            className="flex items-center gap-1 text-xs font-medium text-[#E41E6A] hover:text-[#c41559] transition-colors"
          >
            View all <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {MOCK_UPCOMING.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-sm">
            <Calendar className="w-10 h-10 text-gray-200 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">No upcoming appointments</p>
          </div>
        ) : (
          <div className="space-y-3">
            {MOCK_UPCOMING.map(appt => {
              const s = STATUS_STYLE[appt.status];
              return (
                <div key={appt.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:border-[#E41E6A]/30 hover:shadow-md transition-all duration-200">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center flex-shrink-0">
                        {serviceIcon(appt.service)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800 leading-snug">{appt.service}</p>
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          <Car className="w-3 h-3" />{appt.vehicle}
                        </p>
                      </div>
                    </div>
                    <span className={`flex-shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${s.bg} ${s.text} ${s.border}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />{appt.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 pt-2.5 border-t border-gray-50">
                    <span className="flex items-center gap-1 text-xs text-gray-500"><Calendar className="w-3.5 h-3.5 text-[#E41E6A]" />{appt.date}</span>
                    <span className="flex items-center gap-1 text-xs text-gray-500"><Clock className="w-3.5 h-3.5 text-[#E41E6A]" />{appt.time}</span>
                    <span className="flex items-center gap-1 text-xs text-gray-500 ml-auto"><Banknote className="w-3.5 h-3.5 text-emerald-500" />Deposit: <span className="font-semibold text-gray-700 ml-0.5">₱{appt.deposit.toLocaleString()}</span></span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Recent Services ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-bold text-gray-800">Recent Services</h2>
            <p className="text-xs text-gray-400 mt-0.5">Your latest completed work</p>
          </div>
          <button
            onClick={() => onNavigate?.("history")}
            className="flex items-center gap-1 text-xs font-medium text-[#E41E6A] hover:text-[#c41559] transition-colors"
          >
            View all <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {MOCK_RECENT_SERVICES.map((rec, i) => (
            <div key={rec.id} className={`flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50/60 transition-colors ${i < MOCK_RECENT_SERVICES.length - 1 ? "border-b border-gray-50" : ""}`}>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                {serviceIcon(rec.service)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{rec.service}</p>
                <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><Car className="w-3 h-3" />{rec.vehicle} · {rec.date}</p>
              </div>
              <div className="flex-shrink-0 text-right">
                <p className="text-sm font-bold text-gray-800">₱{rec.amount.toLocaleString()}</p>
                <span className="text-xs text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">Completed</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── My Vehicles ── */}
      <section>
        <div className="mb-3">
          <h2 className="text-base font-bold text-gray-800">My Vehicles</h2>
          <p className="text-xs text-gray-400 mt-0.5">Registered vehicles under your account</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {MOCK_VEHICLES.map(v => (
            <div key={v.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:border-[#E41E6A]/30 hover:shadow-md transition-all flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border border-gray-200" style={{ backgroundColor: v.colorHex + "33" }}>
                <Car className="w-6 h-6 text-gray-600" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-bold tracking-widest text-[#E41E6A] bg-rose-50 px-2 py-0.5 rounded-md">{v.plate}</span>
                <p className="text-sm font-semibold text-gray-800 truncate mt-1">{v.year} {v.name}</p>
                <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                  <span className="w-2.5 h-2.5 rounded-full border border-gray-300 inline-block flex-shrink-0" style={{ backgroundColor: v.colorHex }} />{v.color}
                </p>
              </div>
              <MapPin className="w-4 h-4 text-gray-300 flex-shrink-0" />
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}

export default CustomerDashboardHome;