import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "../ui/button";
import { RotateCw, Sun, Moon, Sparkles } from "lucide-react";
import { CarSideSelector, CarSide } from "./CarSideSelector";


type ColorOption = {
  name: string;
  value: string;
  filter: string;
  overlay?: string;
};

type FinishType = {
  name: string;
  value: string;
  effect: string;
};

export function CarConfigurator() {
  const [selectedColor, setSelectedColor] = useState("black");
  const [selectedFinish, setSelectedFinish] = useState("gloss");
  const [lightingMode, setLightingMode] = useState<"day" | "night">("day");
  const [carSide, setCarSide] = useState<CarSide>("left");


  const scrollToQuote = () => {
    const element = document.getElementById("quote");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const colors: ColorOption[] = [
    {
      name: "Black",
      value: "black",
      filter: "brightness(0.3) contrast(1.2)",
      overlay: "#000000",
    },
    {
      name: "White",
      value: "white",
      filter: "brightness(1.4) saturate(0.8)",
      overlay: "#FFFFFF",
    },
    {
      name: "Red",
      value: "red",
      filter: "hue-rotate(340deg) saturate(1.5) brightness(0.9)",
      overlay: "#DC143C",
    },
    {
      name: "Blue",
      value: "blue",
      filter: "hue-rotate(200deg) saturate(1.3) brightness(0.8)",
      overlay: "#1E3A8A",
    },
    {
      name: "Silver",
      value: "silver",
      filter: "brightness(1.2) saturate(0.5) contrast(1.1)",
      overlay: "#C0C0C0",
    },
    {
      name: "Gold",
      value: "gold",
      filter: "hue-rotate(30deg) saturate(1.4) brightness(1.1)",
      overlay: "#FFD700",
    },
    {
      name: "Matte Gray",
      value: "matte-gray",
      filter: "brightness(0.7) saturate(0.3) contrast(0.9)",
      overlay: "#6B7280",
    },
    {
      name: "Pearl White",
      value: "pearl",
      filter: "brightness(1.5) saturate(0.9) contrast(1.05)",
      overlay: "#F8F8FF",
    },
    {
      name: "Carbon",
      value: "carbon",
      filter: "brightness(0.4) contrast(1.3) saturate(0.2)",
      overlay: "#1A1A1A",
    },
    {
      name: "Iridescent",
      value: "iridescent",
      filter: "hue-rotate(180deg) saturate(1.8) brightness(1.1) contrast(1.1)",
      overlay: "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)",
    },
  ];

  const finishes: FinishType[] = [
    { name: "Gloss", value: "gloss", effect: "brightness(1.1) contrast(1.05)" },
    { name: "Matte", value: "matte", effect: "brightness(0.95) contrast(0.9)" },
    { name: "Metallic", value: "metallic", effect: "brightness(1.05) contrast(1.1) saturate(1.1)" },
    { name: "Satin", value: "satin", effect: "brightness(1.0) contrast(1.0)" },
    { name: "Chrome", value: "chrome", effect: "brightness(1.3) contrast(1.2) saturate(0.7)" },
  ];

  const carImages: Record<CarSide, string> = {
  "front and rear": "/car/fnr.png",
  left: "/car/left.png",
  right: "/car/right.png",
  top: "/car/top.png",
};


  const currentColor = colors.find((c) => c.value === selectedColor) || colors[0];
  const currentFinish = finishes.find((f) => f.value === selectedFinish) || finishes[0];

  const resetConfiguration = () => {
    setSelectedColor("black");
    setSelectedFinish("gloss");
    setLightingMode("day");
  };

  const combinedFilter = `${currentColor.filter} ${currentFinish.effect}`;
  const lightingFilter = lightingMode === "night" ? "brightness(0.7) contrast(1.2)" : "brightness(1.0)";

  return (
    <section className="py-24 bg-gradient-to-b from-[#0A0A0A] to-[#0f0f0f] relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-[#E41E6A] tracking-wider text-sm">VISUALIZE YOUR DREAM</span>
          <h2 className="text-4xl md:text-5xl text-white mt-4 mb-6">
            Interactive Car Configurator
          </h2>
          <p className="text-[#C0C0C0] text-lg max-w-2xl mx-auto">
            Customize your vehicle's color, tint, and finish in real-time. See exactly how your car will look after treatment.
          </p>
        </motion.div>

        {/* Car Display */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="relative max-w-5xl mx-auto mb-12"
        >
          {/* Lighting Mode Toggle */}
          <div className="absolute top-4 right-4 z-20 flex gap-2">
              <Button
                size="sm"
                onClick={() => setLightingMode("day")}
                className={`${
                  lightingMode === "day"
                    ? "bg-[#E41E6A] text-white"
                    : "bg-[#1A1A1A] text-[#C0C0C0] border border-white/10"
                } transition-all duration-300`}
              >
                <Sun size={16} className="mr-1" />
                Day
              </Button>
              <Button
                size="sm"
                onClick={() => setLightingMode("night")}
                className={`${
                  lightingMode === "night"
                    ? "bg-[#E41E6A] text-white"
                    : "bg-[#1A1A1A] text-[#C0C0C0] border border-white/10"
                } transition-all duration-300`}
              >
                <Moon size={16} className="mr-1" />
                Night
              </Button>
          </div>

          {/* Car Container */}
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-b from-[#1A1A1A] to-[#0A0A0A] p-8 border-2 border-white/10">
            {/* Lighting Overlay */}
            <AnimatePresence mode="wait">
              <motion.div
                key={lightingMode}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0 pointer-events-none z-10"
                style={{
                  background:
                    lightingMode === "night"
                      ? "radial-gradient(circle at 50% 50%, rgba(10, 10, 10, 0.3), rgba(10, 10, 10, 0.8))"
                      : "radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.05), transparent)",
                }}
              />
            </AnimatePresence>

            {/* Car Image with Filters */}
            <div className="relative">
              <motion.div
                key={`${selectedColor}-${selectedFinish}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6 }}
                className="relative"
              >
                {/* Base Car Image */}
<AnimatePresence mode="wait">
  <motion.img
    key={carSide}
    src={carImages[carSide]}
    alt={`Car ${carSide} view`}
    initial={{ opacity: 0, x: 40 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -40 }}
    transition={{ duration: 0.4 }}
    className="w-full h-auto"
    style={{
      filter: `${combinedFilter} ${lightingFilter}`,
    }}
  />
</AnimatePresence>


                {/* Color Overlay for enhanced realism */}
                {currentColor.overlay && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: selectedFinish === "matte" ? 0.15 : 0.1 }}
                    transition={{ duration: 0.6 }}
                    className="absolute inset-0 mix-blend-overlay pointer-events-none"
                    style={{
                      background: currentColor.overlay,
                    }}
                  />
                )}


                {/* Gloss/Shine Effect */}
                {selectedFinish === "gloss" || selectedFinish === "chrome" ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent mix-blend-overlay pointer-events-none"
                  />
                ) : null}
              </motion.div>
          {/* Car Side Selector */}
          <div>
            <CarSideSelector
              value={carSide}
              onChange={setCarSide}
            />
          </div>
              {/* Current Config Label */}
              <div className="absolute bottom-4 left-4 bg-[#1A1A1A]/90 backdrop-blur-sm border border-white/10 rounded-lg px-4 py-2">
                <p className="text-[#C0C0C0] text-sm">
                  <span className="text-[#E41E6A]">{currentColor.name}</span> •{" "}
                  <span className="text-white">{currentFinish.name}</span>
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Controls Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto space-y-8"
        >

          {/* Color Selection */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white flex items-center gap-2">
                <Sparkles className="text-[#E41E6A]" size={20} />
                Paint Color
              </h3>
            </div>
            <div className="flex flex-wrap gap-3 justify-center">
              {colors.map((color) => (
                <motion.button
                  key={color.value}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedColor(color.value)}
                  className={`relative w-14 h-14 rounded-full transition-all duration-300 ${
                    selectedColor === color.value
                      ? "ring-4 ring-[#E41E6A] ring-offset-2 ring-offset-[#0A0A0A]"
                      : "ring-2 ring-white/20 hover:ring-white/40"
                  }`}
                  style={{
                    background: color.overlay?.includes("gradient")
                      ? color.overlay
                      : color.overlay || "#000000",
                  }}
                >
                  {selectedColor === color.value && (
                    <motion.div
                      layoutId="color-selected"
                      className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-[#E41E6A] rounded-full"
                    />
                  )}
                  <span className="sr-only">{color.name}</span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Finish Type */}
          <div>
            <h3 className="text-white mb-4">PPF Finish Type</h3>
            <div className="flex flex-wrap gap-2 justify-center">
              {finishes.map((finish) => (
                <motion.button
                  key={finish.value}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedFinish(finish.value)}
                  className={`px-6 py-3 rounded-lg transition-all duration-300 ${
                    selectedFinish === finish.value
                      ? "bg-[#E41E6A] text-white shadow-lg shadow-[#E41E6A]/50"
                      : "bg-[#1A1A1A] text-[#C0C0C0] border border-white/10 hover:border-[#E41E6A]/50"
                  }`}
                >
                  {finish.name}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Button
              onClick={resetConfiguration}
              variant="outline"
              className="border-2 border-white/20 text-white hover:bg-white/10 px-8 py-3 rounded-lg transition-all duration-300 flex items-center justify-center"
            >
              <RotateCw className="mr-2" size={18} />
              Reset
            </Button>
            <Button
              onClick={scrollToQuote}
              className="bg-gradient-to-r from-[#E41E6A] to-[#C01854] hover:from-[#C01854] hover:to-[#E41E6A] text-white px-8 py-3 rounded-lg shadow-lg shadow-[#E41E6A]/50 transition-all duration-300 hover:scale-105 flex items-center justify-center"
            >
              Book This Setup
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
