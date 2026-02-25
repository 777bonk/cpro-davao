import { motion } from "motion/react";
import { Button } from "../ui/button";
import { MapPin, Award, Shield, Users } from "lucide-react";

export function AboutSection() {
  const openMap = () => {
    window.open(
      "https://www.google.com/maps/search/?api=1&query=Mississippi+St.,+Riverfront+Corporate+City,+Block+27+Lot+11,+Maa,+Davao+City",
      "_blank"
    );
  };

  const features = [
    {
      icon: Award,
      title: "Certified Professionals",
      description: "Official Ceramic Pro franchise with trained experts",
    },
    {
      icon: Shield,
      title: "Premium Protection",
      description: "World-class coating technology with lifetime warranty",
    },
    {
      icon: Users,
      title: "Trusted Locally",
      description: "Serving Davao's automotive community with excellence",
    },
  ];

  return (
    <section id="about" className="scroll-mt-20 py-24 bg-[#0A0A0A] relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left: Image */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="relative overflow-hidden rounded-lg">
              <img
                src="/charger.jpg"
                alt="Ceramic Pro Davao Shop"
                className="w-full h-[500px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] to-transparent" />
            </div>
            
            {/* Pink accent border */}
            <div className="absolute -bottom-4 -right-4 w-full h-full border-2 border-[#E41E6A] rounded-lg -z-10" />
          </motion.div>

          {/* Right: Content */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="mb-4">
              <span className="text-[#E41E6A] tracking-wider text-sm">ABOUT US</span>
            </div>
            
            <h2 className="text-4xl md:text-5xl text-white mb-6">
              Your Trusted Ceramic Pro Partner in Davao
            </h2>
            
            <p className="text-[#C0C0C0] mb-6 text-lg leading-relaxed">
              Ceramic Pro Davao is an official franchise offering professional ceramic coating, 
              paint protection film (PPF), and detailing services for Davao's automotive community.
            </p>
            
            <p className="text-[#C0C0C0] mb-8 text-lg leading-relaxed">
              We bring international-grade protection technology to your doorstep, ensuring your 
              vehicle receives the ultimate care it deserves.
            </p>

            <div className="space-y-4 mb-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="flex items-start gap-4"
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-[#E41E6A]/10 border border-[#E41E6A]/30 flex items-center justify-center">
                    <feature.icon className="text-[#E41E6A]" size={24} />
                  </div>
                  <div>
                    <h4 className="text-white mb-1">{feature.title}</h4>
                    <p className="text-[#C0C0C0] text-sm">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <Button
              onClick={openMap}
              className="bg-transparent border-2 border-[#E41E6A] text-[#E41E6A] hover:bg-[#E41E6A] hover:text-white transition-all duration-300"
            >
              <MapPin className="mr-2" size={20} />
              Visit Our Shop
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
