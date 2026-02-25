import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { motion } from "motion/react";
import { ChevronDown } from "lucide-react";

export function HeroSection() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section id="home" className="scroll-mt-20 relative h-screen overflow-hidden">
      {/* Background Image with Parallax */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('/civic.jpeg')`,
          transform: `translateY(${scrollY * 0.5}px)`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A]/70 via-[#0A0A0A]/50 to-[#0A0A0A]" />
      </div>

      {/* Content */}
      <div className="relative h-full flex items-center justify-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mb-6"
            >
              <span className="inline-block px-6 py-2 bg-[#E41E6A]/10 border border-[#E41E6A]/30 rounded-full text-[#E41E6A] text-sm tracking-wider">
                WORLD-CLASS PROTECTION
              </span>
            </motion.div>

            <h1 className="text-5xl md:text-7xl mb-6 text-white">
              Premium Ceramic Coating
              <br />
              <span className="text-[#E41E6A]">& Paint Protection</span>
            </h1>

            <p className="text-xl md:text-2xl text-[#C0C0C0] mb-12 max-w-3xl mx-auto">
              Experience world-class protection for your car in Davao City.
              <br />
              Professional ceramic coating, PPF, and detailing services.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => scrollToSection("quote")}
                className="bg-gradient-to-r from-[#E41E6A] to-[#C01854] hover:from-[#C01854] hover:to-[#E41E6A] text-white px-8 py-6 shadow-2xl shadow-[#E41E6A]/50 transition-all duration-300 hover:scale-105"
              >
                Get a Free Quote
              </Button>
              <Button
                onClick={() => scrollToSection("packages")}
                variant="outline"
                className="border-2 border-white/20 text-white hover:bg-white/10 px-8 py-6 backdrop-blur-sm transition-all duration-300 hover:scale-105"
              >
                Explore Packages
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.8 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="flex flex-col items-center cursor-pointer"
          onClick={() => scrollToSection("about")}
        >
          <span className="text-[#C0C0C0] text-sm mb-2">Scroll to explore</span>
          <ChevronDown className="text-[#E41E6A]" size={32} />
        </motion.div>
      </motion.div>
    </section>
  );
}
