// src/components/QuoteForm.tsx  (or wherever your file lives)

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button }   from "../ui/button";
import { Input }    from "../ui/input";
import { Label }    from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "../ui/select";
import { CheckCircle2, AlertCircle } from "lucide-react";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type FormData = {
  name:    string;
  contact: string;
  vehicle: string;
  service: string;
  size:    string;
  notes:   string;
};

const EMPTY_FORM: FormData = {
  name: "", contact: "", vehicle: "",
  service: "", size: "", notes: "",
};

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export function QuoteForm() {
  const [formData,    setFormData]    = useState<FormData>(EMPTY_FORM);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading,   setIsLoading]   = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  const set = (field: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormData(prev => ({ ...prev, [field]: e.target.value }));
      if (error) setError(null); // clear error when user starts typing again
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic client-side guard — the DTO validates server-side too
    if (!formData.service) { setError("Please select a service type."); return; }
    if (!formData.size)    { setError("Please select a vehicle size."); return; }

    setIsLoading(true);
    try {
      const API = import.meta.env.VITE_API_BASE_URL;
      const res = await fetch(`${API}/quote-requests`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(formData),
      });

      if (!res.ok) {
        // NestJS ValidationPipe returns { message: string[] } on 400
        const body = await res.json().catch(() => ({}));
        const msg  = Array.isArray(body?.message)
          ? body.message.join(". ")
          : body?.message ?? "Something went wrong. Please try again.";
        throw new Error(msg);
      }

      // Success — show thank-you screen then reset
      setIsSubmitted(true);
      setTimeout(() => {
        setIsSubmitted(false);
        setFormData(EMPTY_FORM);
      }, 4000);

    } catch (err: any) {
      setError(err.message ?? "Network error. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  // ── RENDER ─────────────────────────────────────────────────────────────────

  return (
    <section id="quote" className="scroll-mt-20 py-24 bg-[#0A0A0A] relative overflow-hidden">

      {/* Background dot pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: "radial-gradient(circle at 2px 2px, #E41E6A 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }} />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative">

        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-[#E41E6A] tracking-wider text-sm">GET A QUOTE</span>
          <h2 className="text-4xl md:text-5xl text-white mt-4 mb-6">
            Request Your Free Quote
          </h2>
          <p className="text-[#C0C0C0] text-lg">
            Fill out the form below and our team will contact you with a customized quote.
          </p>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="relative"
        >
          <div className="bg-[#1A1A1A] border-2 border-white/10 rounded-lg p-8 md:p-10">
            <AnimatePresence mode="wait">

              {/* ── FORM STATE ── */}
              {!isSubmitted ? (
                <motion.form
                  key="form"
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleSubmit}
                  className="space-y-6"
                >
                  {/* Error banner */}
                  {error && (
                    <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Name */}
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-white">Full Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={set("name")}
                        required
                        disabled={isLoading}
                        className="bg-[#0A0A0A] border-white/20 text-white focus:border-[#E41E6A] transition-colors"
                        placeholder="Juan Dela Cruz"
                      />
                    </div>

                    {/* Contact */}
                    <div className="space-y-2">
                      <Label htmlFor="contact" className="text-white">Contact Number</Label>
                      <Input
                        id="contact"
                        type="tel"
                        value={formData.contact}
                        onChange={set("contact")}
                        required
                        disabled={isLoading}
                        className="bg-[#0A0A0A] border-white/20 text-white focus:border-[#E41E6A] transition-colors"
                        placeholder="+63 912 345 6789"
                      />
                    </div>
                  </div>

                  {/* Vehicle */}
                  <div className="space-y-2">
                    <Label htmlFor="vehicle" className="text-white">Vehicle Model</Label>
                    <Input
                      id="vehicle"
                      value={formData.vehicle}
                      onChange={set("vehicle")}
                      required
                      disabled={isLoading}
                      className="bg-[#0A0A0A] border-white/20 text-white focus:border-[#E41E6A] transition-colors"
                      placeholder="e.g., Toyota Fortuner 2023"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Service */}
                    <div className="space-y-2">
                      <Label className="text-white">Type of Service</Label>
                      <Select
                        value={formData.service}
                        onValueChange={v => setFormData(prev => ({ ...prev, service: v }))}
                        disabled={isLoading}
                        required
                      >
                        <SelectTrigger className="bg-[#0A0A0A] border-white/20 text-white">
                          <SelectValue placeholder="Select service" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1A1A1A] border-white/20">
                          <SelectItem value="ceramic">Ceramic Coating</SelectItem>
                          <SelectItem value="ppf">Paint Protection Film (PPF)</SelectItem>
                          <SelectItem value="detailing">Interior &amp; Exterior Detailing</SelectItem>
                          <SelectItem value="maintenance">Maintenance Package</SelectItem>
                          <SelectItem value="combo">Combo Package</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Size */}
                    <div className="space-y-2">
                      <Label className="text-white">Vehicle Size</Label>
                      <Select
                        value={formData.size}
                        onValueChange={v => setFormData(prev => ({ ...prev, size: v }))}
                        disabled={isLoading}
                        required
                      >
                        <SelectTrigger className="bg-[#0A0A0A] border-white/20 text-white">
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1A1A1A] border-white/20">
                          <SelectItem value="small">Small (Sedan/Hatchback)</SelectItem>
                          <SelectItem value="suv">Medium (SUV/Crossover)</SelectItem>
                          <SelectItem value="large">Large (Full-Size SUV/Van)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label htmlFor="notes" className="text-white">
                      Special Requests / Notes
                      <span className="text-white/40 text-xs ml-2">(optional)</span>
                    </Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={set("notes")}
                      disabled={isLoading}
                      className="bg-[#0A0A0A] border-white/20 text-white focus:border-[#E41E6A] transition-colors min-h-[100px]"
                      placeholder="Any specific concerns or requests..."
                    />
                  </div>

                  {/* Submit */}
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-[#E41E6A] to-[#C01854] hover:from-[#C01854] hover:to-[#E41E6A] text-white py-6 shadow-xl shadow-[#E41E6A]/50 transition-all duration-300 hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {isLoading ? "Submitting..." : "Request Free Quote"}
                  </Button>
                </motion.form>

              ) : (
                /* ── SUCCESS STATE ── */
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="py-12 text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  >
                    <CheckCircle2 className="mx-auto text-[#E41E6A] mb-6" size={80} />
                  </motion.div>
                  <h3 className="text-3xl text-white mb-4">Thank You!</h3>
                  <p className="text-[#C0C0C0] text-lg">
                    A Ceramic Pro Davao representative will contact you soon with your customized quote.
                  </p>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* Accent border decoration */}
          <div className="absolute -bottom-4 -right-4 w-full h-full border-2 border-[#E41E6A]/30 rounded-lg -z-10" />
        </motion.div>
      </div>
    </section>
  );
}
