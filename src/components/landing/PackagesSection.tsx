import { motion } from "motion/react";
import { Check } from "lucide-react";
import { Button } from "../ui/button";

export function PackagesSection() {
  const scrollToQuote = () => {
    const element = document.getElementById("quote");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const packages = [
    {
      name: "Bronze",
      tier: "STARTER",
      price: "₱15,000 - ₱25,000",
      features: [
        "1 Layer Ceramic Coating",
        "Exterior Paint Protection",
        "3 Year Warranty",
        "Hydrophobic Effect",
        "UV Protection",
        "Basic Paint Prep",
      ],
      color: "#CD7F32",
      popular: false,
    },
    {
      name: "Silver",
      tier: "ADVANCED",
      price: "₱30,000 - ₱45,000",
      features: [
        "2 Layer Ceramic Coating",
        "Exterior + Wheels Protection",
        "5 Year Warranty",
        "Enhanced Hydrophobic Effect",
        "UV & Chemical Protection",
        "Professional Paint Correction",
        "Trim & Glass Coating",
      ],
      color: "#C0C0C0",
      popular: false,
    },
    {
      name: "Gold",
      tier: "PREMIUM",
      price: "₱55,000 - ₱75,000",
      features: [
        "3 Layer Ceramic Coating",
        "Full Exterior Protection",
        "7 Year Warranty",
        "Maximum Hydrophobic Effect",
        "Complete UV & Chemical Shield",
        "Advanced Paint Correction",
        "Windows, Trim & Wheels Coating",
        "Interior Fabric Protection",
      ],
      color: "#FFD700",
      popular: true,
    },
    {
      name: "Platinum",
      tier: "ULTIMATE",
      price: "₱85,000 - ₱120,000",
      features: [
        "4 Layer Ceramic Coating",
        "Full Vehicle Protection",
        "Lifetime Warranty",
        "Ultimate Hydrophobic Effect",
        "Maximum UV & Chemical Protection",
        "Premium Paint Correction & Polish",
        "Complete Interior & Exterior Coating",
        "PPF on High-Impact Areas",
        "Annual Maintenance Included",
      ],
      color: "#E5E4E2",
      popular: false,
    },
  ];

  return (
    <section id="packages" className="scroll-mt-20 py-24 bg-[#0A0A0A] relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(30deg, transparent 48%, white 48%, white 52%, transparent 52%)',
          backgroundSize: '30px 30px'
        }} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-[#E41E6A] tracking-wider text-sm">PACKAGES</span>
          <h2 className="text-4xl md:text-5xl text-white mt-4 mb-6">
            Choose Your Protection Level
          </h2>
          <p className="text-[#C0C0C0] text-lg max-w-2xl mx-auto">
            From basic protection to ultimate coverage, we have a package that fits your needs and budget.
          </p>
        </motion.div>

        {/* Packages Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {packages.map((pkg, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="relative group"
            >
              {/* Popular Badge */}
              {pkg.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                  <div className="bg-[#E41E6A] text-white px-4 py-1 rounded-full text-xs tracking-wider">
                    MOST POPULAR
                  </div>
                </div>
              )}

              <div className={`relative h-full rounded-lg bg-[#1A1A1A] border-2 transition-all duration-500 overflow-hidden ${
                pkg.popular 
                  ? 'border-[#E41E6A] shadow-2xl shadow-[#E41E6A]/30 scale-105' 
                  : 'border-white/10 hover:border-[#E41E6A]/50 hover:shadow-xl hover:shadow-[#E41E6A]/20'
              }`}>
                {/* Accent Bar */}
                <div 
                  className="h-1.5 w-full"
                  style={{ backgroundColor: pkg.color }}
                />

                {/* Content */}
                <div className="p-6">
                  {/* Package Name */}
                  <div className="mb-4">
                    <p className="text-[#C0C0C0] text-xs tracking-widest mb-1">{pkg.tier}</p>
                    <h3 
                      className="text-3xl mb-2"
                      style={{ color: pkg.color }}
                    >
                      {pkg.name}
                    </h3>
                    <p className="text-white text-xl">{pkg.price}</p>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-8">
                    {pkg.features.map((feature, i) => (
                      <li key={i} className="flex items-start text-sm">
                        <Check 
                          className="flex-shrink-0 mr-3 mt-0.5" 
                          size={16}
                          style={{ color: pkg.color }}
                        />
                        <span className="text-[#C0C0C0]">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Button */}
                  <Button
                    onClick={scrollToQuote}
                    className={`w-full transition-all duration-300 ${
                      pkg.popular
                        ? 'bg-[#E41E6A] hover:bg-[#C01854] text-white'
                        : 'bg-transparent border-2 text-white hover:bg-white/10'
                    }`}
                    style={!pkg.popular ? { borderColor: pkg.color } : {}}
                  >
                    Get a Quote
                  </Button>
                </div>

                {/* Glow effect on hover */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none"
                  style={{ 
                    background: `radial-gradient(circle at 50% 50%, ${pkg.color}, transparent 70%)`
                  }}
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <p className="text-[#C0C0C0] text-sm">
            * Prices vary based on vehicle size and condition. Contact us for an accurate quote.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
