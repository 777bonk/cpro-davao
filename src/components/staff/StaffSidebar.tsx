import { LayoutDashboard, ClipboardList, Package, Settings, LogOut, Car, HardHat } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";

interface StaffSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const NAV_ITEMS = [
  { id: "home",      label: "Dashboard",     icon: LayoutDashboard },
  { id: "joborders", label: "My Job Orders", icon: ClipboardList   },
  { id: "parts",     label: "Request Parts", icon: Package         },
  { id: "settings",  label: "Settings",      icon: Settings        },
];

export function StaffSidebar({ activeSection, onSectionChange }: StaffSidebarProps) {
  const navigate    = useNavigate();
  const { profile } = useAuth();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <div
      style={{ width: "256px", minWidth: "256px", maxWidth: "256px" }}
      className="h-screen bg-black/95 border-r border-white/10 flex flex-col overflow-hidden"
    >
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[#E41E6A] to-pink-600 rounded-lg flex items-center justify-center">
            <Car className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-white text-sm font-semibold">Ceramic Pro</h1>
            <p className="text-[#E41E6A] text-xs">Davao</p>
          </div>
        </div>
      </div>

      {/* Staff info */}
      <div className="px-4 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#E41E6A]/20 flex items-center justify-center flex-shrink-0">
            <HardHat className="w-5 h-5 text-[#E41E6A]" />
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-semibold truncate">{profile?.full_name ?? "Staff"}</p>
            <p className="text-white/40 text-xs capitalize">{profile?.role ?? "Technician"}</p>
          </div>
        </div>
      </div>

      {/* Role label */}
      <div className="px-6 pt-4 pb-2">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-white/30">
          Staff Portal
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-1 overflow-hidden">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = activeSection === id;
          return (
            <button
              key={id}
              onClick={() => onSectionChange(id)}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left
                ${isActive
                  ? "bg-[#E41E6A]/20 text-[#E41E6A]"
                  : "text-white/70 hover:text-white hover:bg-white/5"
                }
              `}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{label}</span>
              {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#E41E6A] flex-shrink-0" />}
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/70 hover:text-white hover:bg-red-500/20 transition-colors"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}