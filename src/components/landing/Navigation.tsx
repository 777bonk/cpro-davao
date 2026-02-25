import { useState } from "react";
import { Button } from "../ui/button";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import LoginModal from "./LoginModal";

export function Navigation({ onNavigateToLogin }: { onNavigateToLogin?: () => void }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const scrollToSection = (sectionId: string) => {
    console.log("scrollToSection called:", sectionId);
    const element = document.getElementById(sectionId);
    console.log("scrollToSection found element:", element);

    // Close mobile menu immediately so it doesn't block clicks/layout
    setIsMenuOpen(false);

    if (!element) return;

    // Wait for menu close animation/layout to settle, then scroll with offset
    setTimeout(() => {
      const navEl = document.querySelector("nav");
      const navHeight = navEl ? Math.round(navEl.getBoundingClientRect().height) : 80;
      const targetTop = element.getBoundingClientRect().top + window.pageYOffset - navHeight - 8;
      window.scrollTo({ top: targetTop, behavior: "smooth" });
    }, 220);
  };

  const menuItems = [
    { label: "Home", id: "home" },
    { label: "Services", id: "services" },
    { label: "Packages", id: "packages" },
    { label: "Gallery", id: "gallery" },
    { label: "Contact", id: "contact" },
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
            <Button
              onClick={() => onNavigateToLogin?.()}
              className="bg-black border border-white/10 text-white"
            >
              Sign Up / Login
            </Button>

            <Button
              onClick={() => scrollToSection("quote")}
              className="bg-gradient-to-r from-[#E41E6A] to-[#C01854] hover:from-[#C01854] hover:to-[#E41E6A] text-white shadow-lg shadow-[#E41E6A]/50 transition-all duration-300"
            >
              Get a Quote
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-white p-2"
            >
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
<Button
  onClick={() => onNavigateToLogin?.()}
  className="bg-black border border-white/10 text-white"
>
  Sign Up / Login
</Button>


              <Button
                onClick={() => scrollToSection("quote")}
                className="w-full bg-gradient-to-r from-[#E41E6A] to-[#C01854] hover:from-[#C01854] hover:to-[#E41E6A] text-white shadow-lg shadow-[#E41E6A]/50"
              >
                Get a Quote
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
          <LoginModal
      isOpen={isLoginOpen}
      onClose={() => setIsLoginOpen(false)}
    />

    </nav>
  );
}
