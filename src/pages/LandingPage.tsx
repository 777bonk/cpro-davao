import { useState } from "react";
import { Navigation } from "../components/landing/Navigation";
import { HeroSection } from "../components/landing/HeroSection";
import { AboutSection } from "../components/landing/AboutSection";
import { ServicesSection } from "../components/landing/ServicesSection";
import { CarConfigurator } from "../components/landing/CarConfigurator";
import { PackagesSection } from "../components/landing/PackagesSection";
import { GallerySection } from "../components/landing/GallerySection";
import { QuoteForm } from "../components/landing/QuoteForm";
import { ContactSection } from "../components/landing/ContactSection";
import { Footer } from "../components/landing/Footer";
import { Toaster } from "../components/ui/sonner";
import { LoginModal } from "../components/landing/LoginModal";
import { RegisterModal } from "../components/landing/RegisterModal";

export default function LandingPage() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <Navigation onNavigateToLogin={() => setIsLoginOpen(true)} />
      
      <HeroSection />
      <AboutSection />
      <ServicesSection />
      {/* <CarConfigurator /> */}
      <PackagesSection />
      <GallerySection />
      <QuoteForm />
      <ContactSection />
      <Footer />
      <Toaster />

      {/* Render the Modals at the root level! */}
      <LoginModal 
        isOpen={isLoginOpen} 
        onClose={() => setIsLoginOpen(false)} 
        onSwitchToRegister={() => { 
          setIsLoginOpen(false); 
          setIsRegisterOpen(true); 
        }} 
      />
      
      <RegisterModal 
        isOpen={isRegisterOpen} 
        onClose={() => setIsRegisterOpen(false)} 
        onSwitchToLogin={() => {
          setIsRegisterOpen(false);
          setIsLoginOpen(true);
        }}
      />
    </div>
  );
}