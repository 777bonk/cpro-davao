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
import { Button } from "../components/dashboard-ui/button"; // Adjust path if needed

export const BackendTestButton = () => {
  const [responseMessage, setResponseMessage] = useState("No connection yet.");

  const testConnection = async () => {
    // Grab the Render URL from your environment variables
    const backendUrl = import.meta.env.VITE_API_BASE_URL;

    try {
      setResponseMessage("Pinging Render...");
      
      // Ping the backend
      const res = await fetch(`${backendUrl}/`);
      
      if (!res.ok) throw new Error("Backend rejected the request");
      
      const text = await res.text();
      setResponseMessage(`✅ Success! Backend says: "${text}"`);
    } catch (error: any) {
      setResponseMessage(`❌ Connection failed: ${error.message}`);
    }
  };

  return (
    <div className="p-6 bg-[#151923] border border-gray-800 rounded-xl text-white w-full max-w-md mx-auto">
      <h3 className="font-bold mb-4 text-center">Render Connection Test</h3>
      <Button onClick={testConnection} className="w-full bg-blue-600 hover:bg-blue-700 mb-4">
        Ping API
      </Button>
      <p className="font-mono text-sm text-gray-400 text-center">{responseMessage}</p>
    </div>
  );
};

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