import "../styles/dashboard.css";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Sidebar } from "../components/dashboard/Sidebar";
import { Dashboard } from "../components/dashboard/Dashboard";
import { CustomerManagement } from "../components/dashboard/CustomerManagement";
import { Appointments } from "../components/dashboard/Appointments";
import { Inventory } from "../components/dashboard/Inventory";
import { Employees } from "../components/dashboard/Employees";
import { Finance } from "../components/dashboard/Finance";
import { Reports } from "../components/dashboard/Reports";
import { Settings } from "../components/dashboard/Settings";

export default function AdminDashboard() {
  const [activeSection, setActiveSection] = useState("home");
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleToggleMenu = (menuId: string) => {
    setExpandedMenus((prev) =>
      prev.includes(menuId)
        ? prev.filter((id) => id !== menuId)
        : [...prev, menuId]
    );
  };

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
    setSidebarOpen(false);
  };

  const renderContent = () => {
    if (["customer-list"].includes(activeSection)) return <CustomerManagement />;
    if (["appointment-calendar"].includes(activeSection)) return <Appointments />;
    if (["inventory-list"].includes(activeSection)) return <Inventory />;
    if (["employee-list"].includes(activeSection)) return <Employees />;
    if (["income", "expenses", "net-income", "financial-reports"].includes(activeSection)) return <Finance />;
    if (["income-report", "expense-report", "profit-loss"].includes(activeSection)) return <Reports />;

    switch (activeSection) {
      case "home": return <Dashboard />;
      case "customers": return <CustomerManagement />;
      case "appointments": return <Appointments />;
      case "inventory": return <Inventory />;
      case "employees": return <Employees />;
      case "finance": return <Finance />;
      case "reports": return <Reports />;
      case "settings": return <Settings />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="dashboard-root flex h-screen overflow-hidden">

      {/* DESKTOP sidebar - always visible on md+ */}
      <div className="hidden md:flex flex-shrink-0">
        <Sidebar
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
          expandedMenus={expandedMenus}
          onToggleMenu={handleToggleMenu}
        />
      </div>

      {/* MOBILE overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* MOBILE sidebar drawer */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 30,
          transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.3s ease",
        }}
        className="md:hidden"
      >
        <Sidebar
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
          expandedMenus={expandedMenus}
          onToggleMenu={handleToggleMenu}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto min-w-0 w-full">

        {/* Mobile top bar */}
        <div
          className="md:hidden"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "12px 16px",
            backgroundColor: "rgba(0,0,0,0.9)",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
          }}
        >
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
          {/* Background Effects */}
          <div className="fixed inset-0 pointer-events-none">
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#E41E6A]/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-600/10 rounded-full blur-[120px]" />
          </div>
          {/* Content */}
          <div className="relative z-10">
            {renderContent()}
          </div>
        </div>
      </div>

    </div>
  );
}