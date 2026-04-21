import { useState, useRef, useEffect } from "react";
import { Button } from "../ui/button";
import { Menu, X, ChevronDown, LayoutDashboard, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";

export function Navigation({ onNavigateToLogin }: { onNavigateToLogin: () => void }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { profile, session } = useAuth();
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    setIsMenuOpen(false);
    if (!element) return;
    setTimeout(() => {
      const navEl = document.querySelector("nav");
      const navHeight = navEl ? Math.round(navEl.getBoundingClientRect().height) : 80;
      const targetTop = element.getBoundingClientRect().top + window.pageYOffset - navHeight - 8;
      window.scrollTo({ top: targetTop, behavior: "smooth" });
    }, 220);
  };

  const handleGoToDashboard = () => {
    setIsDropdownOpen(false);
    setIsMenuOpen(false);
    navigate("/dashboard"); // AuthRedirector will send them to the right dashboard
  };

  const handleLogout = async () => {
    setIsDropdownOpen(false);
    setIsMenuOpen(false);
    await supabase.auth.signOut();
    navigate("/");
  };

  const firstName = profile?.name?.split(" ")[0] ?? profile?.full_name?.split(" ")[0] ?? "User";
  const isLoggedIn = !!session && !!profile;

  const menuItems = [
    { label: "Home",     id: "home"     },
    { label: "Services", id: "services" },
    { label: "Packages", id: "packages" },
    { label: "Gallery",  id: "gallery"  },
    { label: "Contact",  id: "contact"  },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0A]/90 backdrop-blur-lg border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">

          {/* Logo */}
          <div className="flex-shrink-0">
            <button onClick={() => scrollToSection("home")} className="group">
              <div className="flex flex-col">
                <span className="text-xl tracking-wider text-white">CERAMIC PRO</span>
                <span className="text-xs tracking-widest text-[#E41E6A]">DAVAO</span>
              </div>
            </button>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className="text-[#C0C0C0] hover:text-white transition-colors duration-200 text-sm tracking-wide"
              >
                {item.label}
              </button>
            ))}

            {/* Auth area */}
            {isLoggedIn ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(v => !v)}
                  className="flex items-center gap-2 px-4 py-2 rounded-md border border-white/10 bg-white/5 text-white hover:bg-white/10 transition-colors text-sm font-medium"
                >
                  <span>Hi, {firstName}!</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`} />
                </button>

                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-48 bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl overflow-hidden"
                    >
                      <button
                        onClick={handleGoToDashboard}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4 text-[#E41E6A]" />
                        Go to Dashboard
                      </button>
                      <div className="border-t border-white/10" />
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white/70 hover:text-white hover:bg-red-500/10 transition-colors"
                      >
                        <LogOut className="w-4 h-4 text-red-400" />
                        Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Button
                onClick={onNavigateToLogin}
                className="bg-black border border-white/10 text-white hover:bg-white/10"
              >
                Sign Up / Login
              </Button>
            )}

            <Button
              onClick={() => scrollToSection("quote")}
              className="bg-gradient-to-r from-[#E41E6A] to-[#C01854] hover:from-[#C01854] hover:to-[#E41E6A] text-white shadow-lg shadow-[#E41E6A]/50 transition-all duration-300"
            >
              Get a Quote
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-white p-2">
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-[#0A0A0A] border-t border-white/10"
          >
            <div className="px-4 py-4 space-y-3">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className="block w-full text-left text-[#C0C0C0] hover:text-white py-2 transition-colors duration-200"
                >
                  {item.label}
                </button>
              ))}

              {isLoggedIn ? (
                <>
                  <div className="px-3 py-2 text-sm text-white/60 border border-white/10 rounded-lg">
                    Hi, <span className="text-white font-medium">{firstName}</span>!
                  </div>
                  <Button
                    onClick={handleGoToDashboard}
                    className="w-full bg-white/5 border border-white/10 text-white hover:bg-white/10"
                  >
                    <LayoutDashboard className="w-4 h-4 mr-2 text-[#E41E6A]" />
                    Go to Dashboard
                  </Button>
                  <Button
                    onClick={handleLogout}
                    className="w-full bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => { setIsMenuOpen(false); onNavigateToLogin(); }}
                  className="w-full bg-black border border-white/10 text-white"
                >
                  Sign Up / Login
                </Button>
              )}

              <Button
                onClick={() => scrollToSection("quote")}
                className="w-full bg-gradient-to-r from-[#E41E6A] to-[#C01854] text-white shadow-lg shadow-[#E41E6A]/50"
              >
                Get a Quote
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}