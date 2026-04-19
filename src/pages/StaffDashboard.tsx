import "../styles/dashboard.css";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { StaffSidebar }       from "../components/staff/StaffSidebar";
import { StaffDashboardHome } from "../components/staff/StaffDashboardHome";
import { StaffJobOrders }     from "../components/staff/StaffJobOrders";
import { StaffPartsRequest }  from "../components/staff/StaffPartsRequest";
import { StaffSettings }      from "../components/staff/StaffSettings";

export default function StaffDashboard() {
  const [activeSection, setActiveSection] = useState("home");
  const [sidebarOpen,   setSidebarOpen]   = useState(false);

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
    setSidebarOpen(false);
  };

  const renderContent = () => {
    switch (activeSection) {
      case "home":      return <StaffDashboardHome onNavigate={handleSectionChange} />;
      case "joborders": return <StaffJobOrders  />;
      case "parts":     return <StaffPartsRequest />;
      case "settings":  return <StaffSettings    />;
      default:          return <StaffDashboardHome onNavigate={handleSectionChange} />;
    }
  };

  return (
    <div className="dashboard-root flex h-screen overflow-hidden">

      {/* DESKTOP sidebar */}
      <div className="hidden md:flex flex-shrink-0">
        <StaffSidebar activeSection={activeSection} onSectionChange={handleSectionChange} />
      </div>

      {/* MOBILE overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-20" onClick={() => setSidebarOpen(false)} />
      )}

      {/* MOBILE sidebar drawer */}
      <div
        style={{
          position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 30,
          transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.3s ease",
        }}
        className="md:hidden"
      >
        <StaffSidebar activeSection={activeSection} onSectionChange={handleSectionChange} />
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto min-w-0 w-full">

        {/* Mobile top bar */}
        <div className="md:hidden" style={{
          display: "flex", alignItems: "center", gap: "12px",
          padding: "12px 16px", backgroundColor: "rgba(0,0,0,0.9)",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
        }}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ color: "white", background: "none", border: "none", cursor: "pointer" }}
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <span style={{ color: "white", fontSize: "14px" }}>Ceramic Pro</span>
          <span style={{ color: "#E41E6A", fontSize: "12px" }}>Davao</span>
        </div>

        <div className="p-4 md:p-6 w-full">
          {/* Background effects */}
          <div className="fixed inset-0 pointer-events-none">
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#E41E6A]/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-600/10 rounded-full blur-[120px]" />
          </div>
          <div className="relative z-10">
            {renderContent()}
          </div>
        </div>
      </div>

    </div>
  );
}