import { motion } from "motion/react";
import { MapPin, Phone, Mail, Facebook, Instagram, MessageCircle } from "lucide-react";
import { Button } from "../ui/button";

export function ContactSection() {
  const contactInfo = [
    {
      icon: MapPin,
      title: "Location",
      content: "Mississippi St., Riverfront Corporate City (Crocodile Park), Block 27 Lot 11, Maa, Davao City",
      link: "https://maps.app.goo.gl/ToXZC3VnJTTFEK1q9",
    },
    {
      icon: Phone,
      title: "Phone",
      content: "+63 912 345 6789",
      link: "tel:+639123456789",
    },
    {
      icon: Mail,
      title: "Email",
      content: "info@ceramicprodavao.com",
      link: "mailto:info@ceramicprodavao.com",
    },
  ];

  const socialLinks = [
    {
      icon: Facebook,
      name: "Facebook",
      link: "https://facebook.com/ceramicprodavao",
      color: "#1877F2",
    },
    {
      icon: Instagram,
      name: "Instagram",
      link: "https://instagram.com/ceramicprodavao",
      color: "#E4405F",
    },
    {
      icon: MessageCircle,
      name: "Messenger",
      link: "https://m.me/ceramicprodavao",
      color: "#0084FF",
    },
  ];

  return (
    <section id="contact" className="scroll-mt-20 py-24 bg-gradient-to-b from-[#0A0A0A] to-[#050505] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-[#E41E6A] tracking-wider text-sm">GET IN TOUCH</span>
          <h2 className="text-4xl md:text-5xl text-white mt-4 mb-6">
            Visit Us in Davao
          </h2>
          <p className="text-[#C0C0C0] text-lg max-w-2xl mx-auto">
            Come visit our shop or reach out to us through any of our contact channels.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Map */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="aspect-[4/3] rounded-lg overflow-hidden border-2 border-white/10">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d3959.240187937018!2d125.5964275!3d7.0981359!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x32f96d07bf29992d%3A0xcc5e7242d761dcad!2sCeramic%20Pro%20Davao!5e0!3m2!1sen!2sph!4v1768836850133!5m2!1sen!2sph"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Ceramic Pro Davao Location"
              />
            </div>

            {/* Map Overlay */}
            <div className="absolute bottom-6 left-6 right-6 bg-[#1A1A1A]/95 backdrop-blur-sm border border-white/10 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <MapPin className="text-[#E41E6A] flex-shrink-0 mt-1" size={20} />
                <div>
                  <p className="text-white text-sm mb-1">Ceramic Pro Davao</p>
                  <p className="text-[#C0C0C0] text-xs leading-relaxed">
                    Mississippi St., Riverfront Corporate City, Block 27 Lot 11, Maa, Davao City
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            {/* Contact Details */}
            <div className="space-y-4">
              {contactInfo.map((info, index) => (
                <motion.a
                  key={index}
                  href={info.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="flex items-start gap-4 p-4 bg-[#1A1A1A] border border-white/10 rounded-lg hover:border-[#E41E6A]/50 transition-all duration-300 group"
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-[#E41E6A]/10 border border-[#E41E6A]/30 flex items-center justify-center group-hover:bg-[#E41E6A]/20 transition-colors">
                    <info.icon className="text-[#E41E6A]" size={24} />
                  </div>
                  <div>
                    <p className="text-[#C0C0C0] text-sm mb-1">{info.title}</p>
                    <p className="text-white">{info.content}</p>
                  </div>
                </motion.a>
              ))}
            </div>

            {/* Social Links */}
            <div className="pt-8 border-t border-white/10">
              <h3 className="text-white mb-4">Connect With Us</h3>
              <div className="flex gap-4">
                {socialLinks.map((social, index) => (
                  <motion.a
                    key={index}
                    href={social.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    whileHover={{ scale: 1.1 }}
                    className="w-12 h-12 rounded-full bg-[#1A1A1A] border-2 border-white/10 hover:border-[#E41E6A] flex items-center justify-center transition-all duration-300 group"
                  >
                    <social.icon className="text-[#C0C0C0] group-hover:text-white transition-colors" size={20} />
                  </motion.a>
                ))}
              </div>
            </div>

            {/* Business Hours */}
            <div className="pt-8 border-t border-white/10">
              <h3 className="text-white mb-4">Business Hours</h3>
              <div className="space-y-2 text-[#C0C0C0]">
                <div className="flex justify-between">
                  <span>Monday - Saturday</span>
                  <span className="text-white">9:00 AM - 6:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Sunday</span>
                  <span className="text-white">By Appointment</span>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <Button
              onClick={() => window.open("https://m.me/ceramicprodavao", "_blank")}
              className="w-full bg-gradient-to-r from-[#E41E6A] to-[#C01854] hover:from-[#C01854] hover:to-[#E41E6A] text-white py-6 shadow-xl shadow-[#E41E6A]/50 transition-all duration-300"
            >
              <MessageCircle className="mr-2" size={20} />
              Send Message
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
