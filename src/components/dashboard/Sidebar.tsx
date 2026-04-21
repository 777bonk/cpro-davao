import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Package, 
  Briefcase, 
  DollarSign, 
  FileText, 
  Settings, 
  LogOut,
  ChevronDown,
  Car,
  Globe
} from "lucide-react";
import { Button } from "../dashboard-ui/button";
import { ScrollArea } from "../dashboard-ui/scroll-area";
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  expandedMenus: string[];
  onToggleMenu: (menu: string) => void;
}

export function Sidebar({ activeSection, onSectionChange, expandedMenus, onToggleMenu }: SidebarProps) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/'); 
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const menuItems = [
    { id: "home", label: "Home", icon: LayoutDashboard },
    {
      id: "customers",
      label: "Customer Management",
      icon: Users,
      submenu: [
        { id: "customer-list", label: "Customer Management" },
      ],
    },
    {
      id: "appointments",
      label: "Appointments",
      icon: Calendar,
      submenu: [
        { id: "appointment-calendar", label: "Appointments" },
      ],
    },
    {
      id: "inventory",
      label: "Inventory",
      icon: Package,
      submenu: [
        { id: "inventory-list", label: "Inventory" },
      ],
    },
    {
      id: "employees",
      label: "Employees",
      icon: Briefcase,
      submenu: [
        { id: "employee-list", label: "Employee List" },
      ],
    },
    {
      id: "finance",
      label: "Finance",
      icon: DollarSign,
      submenu: [
        { id: "financial-reports", label: "Financial Reports" },
      ],
    },
    {
      id: "reports",
      label: "Reports",
      icon: FileText,
      submenu: [
        { id: "profit-loss", label: "Profit & Loss Summary" },
      ],
    },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div style={{ width: "256px", minWidth: "256px", maxWidth: "256px" }} className="h-screen bg-black/95 border-r border-white/10 flex flex-col overflow-hidden">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[#E41E6A] to-pink-600 rounded-lg flex items-center justify-center">
            <Car className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-white text-sm">Ceramic Pro</h1>
            <p className="text-[#E41E6A] text-xs">Davao</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4" style={{ width: "256px", overflow: "hidden" }} type="always">
        <div className="space-y-1 px-3" style={{ width: "256px", boxSizing: "border-box" }}>
          {menuItems.map((item) => (
            <div key={item.id} style={{ width: "100%", overflow: "hidden" }}>
<Button
  variant="ghost"
  className={`w-full justify-start text-white/70 hover:text-white hover:bg-white/5 ${
    activeSection === item.id || activeSection === item.submenu?.[0]?.id
      ? "bg-[#E41E6A]/20 text-[#E41E6A]"
      : ""
  }`}
  onClick={() => {
    if (item.submenu && item.submenu.length === 1) {
      onSectionChange(item.submenu[0].id);
    } else if (item.submenu) {
      onToggleMenu(item.id);
    } else {
      onSectionChange(item.id);
    }
  }}
>
  <item.icon className="w-4 h-4 mr-3 flex-shrink-0" />
  <span className="flex-1 text-left text-sm truncate">{item.label}</span>
  {item.submenu && item.submenu.length > 1 && (
    <ChevronDown
      className={`w-4 h-4 flex-shrink-0 transition-transform ${
        expandedMenus.includes(item.id) ? "rotate-180" : ""
      }`}
    />
  )}
</Button>

{/* Submenu — only for items with 2+ children */}
{item.submenu && item.submenu.length > 1 && expandedMenus.includes(item.id) && (
  <div className="mt-1 space-y-1 border-l border-white/10 ml-7 pl-3 overflow-hidden">
    {item.submenu.map((subItem) => (
      <Button
        key={subItem.id}
        variant="ghost"
        className={`w-full justify-start text-white/60 hover:text-white hover:bg-white/5 text-xs ${
          activeSection === subItem.id ? "bg-[#E41E6A]/20 text-[#E41E6A]" : ""
        }`}
        onClick={() => onSectionChange(subItem.id)}
      >
        <span className="truncate">{subItem.label}</span>
      </Button>
    ))}
  </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="px-3 pb-1">
  <button
    onClick={() => navigate('/')}
    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
  >
            <Globe className="w-4 h-4 flex-shrink-0" />
          <span>View Website</span>
           </button>
          </div>

      {/* Logout */}
      <div className="p-3 border-t border-white/10">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start text-white/70 hover:text-white hover:bg-red-500/20"
        >
          <LogOut className="w-4 h-4 mr-3 flex-shrink-0" />
          <span className="text-sm">Logout</span>
        </Button>
      </div>
    </div>
  );
}