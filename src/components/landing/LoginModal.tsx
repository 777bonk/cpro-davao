import { useState } from "react";
import { X, Mail, Lock, Loader2 } from "lucide-react";
import { Button } from "../dashboard-ui/button"; // Adjust path if needed
import { authService } from "../../services/auth";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToRegister: () => void;
}

export function LoginModal({ isOpen, onClose, onSwitchToRegister }: LoginModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      await authService.login(email, password);
      window.location.href = "/admin";
    } catch (err: any) {
      setError(err.message || "Invalid email or password.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'facebook') => {
    try {
      await authService.loginWithProvider(provider);
    } catch (err: any) {
      setError(`Failed to connect to ${provider}`);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(4px)' }}
    >
      <div 
        className="border border-white/10 rounded-2xl w-full overflow-hidden shadow-2xl relative"
        style={{ maxWidth: '400px', backgroundColor: '#0a0a0a' }}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white transition">
          <X className="w-5 h-5" />
        </button>

        <div className="p-8">
          <h2 className="text-2xl font-bold text-white text-center mb-2">Welcome Back</h2>
          <p className="text-white/60 text-center text-sm mb-8">Sign in to Ceramic Pro Davao.</p>

          {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg text-center">{error}</div>}

          <form onSubmit={handleManualLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-white/70">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input 
                  type="email" required
                  className="w-full pl-10 pr-4 h-11 border border-white/10 bg-white/5 rounded-lg focus:outline-none focus:border-[#E41E6A] text-white" 
                  value={email} onChange={(e) => setEmail(e.target.value)} 
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input 
                  type="password" required minLength={6} placeholder="Password"
                  className="w-full pl-10 pr-4 h-11 border border-white/10 bg-white/5 rounded-lg focus:outline-none focus:border-[#E41E6A] text-white" 
                  value={password} onChange={(e) => setPassword(e.target.value)} 
                />
              </div>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full h-11 bg-gradient-to-r from-[#E41E6A] to-pink-600 text-white border-none hover:opacity-90 mt-4">
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In"}
            </Button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 text-white/50" style={{ backgroundColor: '#0a0a0a' }}>Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" type="button" onClick={() => handleOAuthLogin('google')} className="h-11 border-white/10 bg-white/5 text-white hover:bg-white/10">
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Google
            </Button>
            <Button variant="outline" type="button" onClick={() => handleOAuthLogin('facebook')} className="h-11 border-white/10 bg-white/5 text-white hover:bg-white/10">
              <svg className="w-5 h-5 mr-2 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              Facebook
            </Button>
          </div>

          <p className="text-center text-sm text-white/50 mt-8">
            Don't have an account? <button type="button" onClick={onSwitchToRegister} className="text-[#E41E6A] hover:underline font-medium">Sign up</button>
          </p>
        </div>
      </div>
    </div>
  );
}