import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Shield, Droplets, Wrench } from "lucide-react";
import { Button } from "../ui/button";

export function ServicesSection() {
  const [expandedService, setExpandedService] = useState<number | null>(null);

  const scrollToQuote = () => {
    const element = document.getElementById("quote");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const services = [
    {
      icon: Sparkles,
      title: "Ceramic Coating",
      image: "/ceramiccoating.jpeg",
      description: "9H hardness nano-ceramic protection that bonds to your paint, creating a permanent or semi-permanent shield against UV rays, chemicals, and environmental contaminants.",
      features: ["9H Hardness Protection", "UV Ray Resistance", "Hydrophobic Effect", "5-10 Year Warranty"],
    },
    {
      icon: Shield,
      title: "Paint Protection Film (PPF)",
      image: "/ppf.jpeg",
      description: "Premium self-healing film that protects against rock chips, scratches, and road debris. Virtually invisible protection that maintains your car's original appearance.",
      features: ["Self-Healing Technology", "Impact Protection", "Stain Resistant", "10 Year Warranty"],
    },
    {
      icon: Droplets,
      title: "Interior & Exterior Detailing",
      image: "interior.jpeg",
      description: "Complete interior and exterior detailing services including deep cleaning, paint correction, leather treatment, and fabric protection to restore your vehicle's showroom condition.",
      features: ["Deep Cleaning", "Paint Correction", "Leather Conditioning", "Fabric Protection"],
    },
    {
      icon: Wrench,
      title: "Maintenance Packages",
      image: "/maintenance-car.jpeg",
      description: "Regular maintenance plans to keep your ceramic coating and PPF in optimal condition. Includes wash services, coating boosters, and inspection reports.",
      features: ["Regular Inspections", "Coating Maintenance", "Wash Services", "Performance Reports"],
    },
  ];

  return (
    <section id="services" className="scroll-mt-20 py-24 bg-gradient-to-b from-[#0A0A0A] to-[#0f0f0f] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-[#E41E6A] tracking-wider text-sm">OUR SERVICES</span>
          <h2 className="text-4xl md:text-5xl text-white mt-4 mb-6">
            Premium Protection Solutions
          </h2>
          <p className="text-[#C0C0C0] text-lg max-w-2xl mx-auto">
            From ceramic coating to complete detailing, we offer comprehensive solutions 
            to protect and enhance your vehicle.
          </p>
        </motion.div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {services.map((service, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="relative group cursor-pointer"
              onClick={() => setExpandedService(expandedService === index ? null : index)}
            >
              <div className={`relative overflow-hidden rounded-lg bg-[#1A1A1A] border-2 transition-all duration-500 ${
                expandedService === index ? 'border-[#E41E6A] shadow-2xl shadow-[#E41E6A]/30' : 'border-white/10 hover:border-[#E41E6A]/50'
              }`}>
                {/* Image */}
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={service.image}
                    alt={service.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A] via-[#1A1A1A]/50 to-transparent" />
                  
                  {/* Icon */}
                  <div className="absolute top-6 left-6 w-14 h-14 rounded-full bg-[#E41E6A]/90 backdrop-blur-sm flex items-center justify-center">
                    <service.icon className="text-white" size={28} />
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-2xl text-white mb-3">{service.title}</h3>
                  <p className="text-[#C0C0C0] mb-4">{service.description}</p>

                  <AnimatePresence>
                    {expandedService === index && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="pt-4 border-t border-white/10">
                          <h4 className="text-white mb-3 text-sm tracking-wide">KEY FEATURES:</h4>
                          <ul className="space-y-2 mb-6">
                            {service.features.map((feature, i) => (
                              <li key={i} className="flex items-center text-[#C0C0C0] text-sm">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#E41E6A] mr-3" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              scrollToQuote();
                            }}
                            className="w-full bg-[#E41E6A] hover:bg-[#C01854] text-white transition-colors duration-300"
                          >
                            Book Service
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {expandedService !== index && (
                    <div className="text-[#E41E6A] text-sm mt-2 flex items-center">
                      Click to learn more
                      <motion.span
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="ml-2"
                      >
                        →
                      </motion.span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
