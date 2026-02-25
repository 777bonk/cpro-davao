import { Facebook, Instagram, Youtube } from "lucide-react";

export function Footer() {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const links = [
    { label: "Home", id: "home" },
    { label: "Services", id: "services" },
    { label: "Packages", id: "packages" },
    { label: "Gallery", id: "gallery" },
    { label: "Get a Quote", id: "quote" },
    { label: "Contact", id: "contact" },
  ];

  const socialLinks = [
    { icon: Facebook, link: "https://facebook.com/ceramicprodavao" },
    { icon: Instagram, link: "https://instagram.com/ceramicprodavao" },
    { icon: Youtube, link: "https://youtube.com/@ceramicprodavao" },
  ];

  return (
    <footer className="bg-[#050505] border-t border-white/10 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* Logo & Description */}
          <div>
            <button onClick={() => scrollToSection("home")} className="mb-4 text-left group">
              <div className="flex flex-col">
                <span className="text-xl tracking-wider text-white">CERAMIC PRO</span>
                <span className="text-xs tracking-widest text-[#E41E6A]">DAVAO</span>
              </div>
            </button>
            <p className="text-[#C0C0C0] text-sm leading-relaxed">
              Your trusted partner for premium ceramic coating, paint protection film, 
              and professional detailing services in Davao City.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white mb-4 tracking-wide">Quick Links</h4>
            <ul className="space-y-2">
              {links.map((link) => (
                <li key={link.id}>
                  <button
                    onClick={() => scrollToSection(link.id)}
                    className="text-[#C0C0C0] hover:text-[#E41E6A] text-sm transition-colors duration-200"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-white mb-4 tracking-wide">Contact Us</h4>
            <div className="space-y-2 text-[#C0C0C0] text-sm">
              <p>Mississippi St., Riverfront Corporate City</p>
              <p>Block 27 Lot 11, Maa, Davao City</p>
              <p className="pt-2">Phone: +63 912 345 6789</p>
              <p>Email: info@ceramicprodavao.com</p>
            </div>

            {/* Social Icons */}
            <div className="flex gap-3 mt-4">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-[#1A1A1A] border border-white/10 hover:border-[#E41E6A] hover:bg-[#E41E6A]/10 flex items-center justify-center transition-all duration-300 group"
                >
                  <social.icon className="text-[#C0C0C0] group-hover:text-[#E41E6A] transition-colors" size={16} />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[#C0C0C0] text-sm">
            © 2025 Ceramic Pro Davao. All Rights Reserved.
          </p>
          <div className="flex gap-6 text-[#C0C0C0] text-sm">
            <button className="hover:text-[#E41E6A] transition-colors duration-200">
              Privacy Policy
            </button>
            <button className="hover:text-[#E41E6A] transition-colors duration-200">
              Terms of Service
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
