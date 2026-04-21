import { LayoutDashboard, Calendar, History, CreditCard, Globe, Settings, LogOut, Car } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";

interface CustomerSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const NAV_ITEMS = [
  { id: "home",         label: "Home",            icon: LayoutDashboard },
  { id: "appointments", label: "My Appointments",  icon: Calendar        },
  { id: "history",      label: "Service History",  icon: History         },
  { id: "payments",     label: "Payments",         icon: CreditCard      },
  { id: "settings",     label: "Settings",         icon: Settings        },
];

export function CustomerSidebar({ activeSection, onSectionChange }: CustomerSidebarProps) {
  const navigate = useNavigate();

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

      <div className="px-6 pt-5 pb-2">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-white/30">Customer Portal</span>
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-hidden">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = activeSection === id;
          return (
            <button key={id} onClick={() => onSectionChange(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left
                ${isActive ? "bg-[#E41E6A]/20 text-[#E41E6A]" : "text-white/70 hover:text-white hover:bg-white/5"}`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{label}</span>
              {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#E41E6A] flex-shrink-0" />}
            </button>
          );
        })}
      </nav>
        <div className="px-3 pb-1">
  <button
    onClick={() => navigate('/')}
    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
  >
    <Globe className="w-4 h-4 flex-shrink-0" />
    <span>View Website</span>
  </button>
</div>
      <div className="p-3 border-t border-white/10">
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/70 hover:text-white hover:bg-red-500/20 transition-colors">
          <LogOut className="w-4 h-4 flex-shrink-0" /><span>Logout</span>
        </button>
      </div>
    </div>
  );
}