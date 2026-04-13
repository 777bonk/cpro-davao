import React, { useState } from "react";
import { Button } from "../ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegister: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onRegister }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      // The old localhost:3001 fetch is gone! We use Supabase now:
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message); 
      } else {
        onClose();
        navigate("/admin");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Supabase OAuth Handler
  const handleOAuthLogin = async (provider: 'google' | 'facebook') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin + '/admin', 
      }
    });
    if (error) setError(error.message);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black-900 p-4 backdrop-blur-sm "
      onClick={onClose}
    >
      <div
        className="relative w-500 max-w-sm rounded-lg shadow-2xl p-8 border border-gray-700"
        style={{ backgroundColor: '#000000', minHeight: '450px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-200 text-2xl font-bold"
          onClick={onClose}
        >
          X
        </button>
        <h2 className="text-3xl font-bold text-center mb-6 text-white">Login</h2>
        
        {error && (
          <p className="text-red-400 text-sm text-center mb-4">{error}</p>
        )}
        
        <form className="space-y-4" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email Address"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border border-gray-600 bg-gray-800 text-white rounded-lg focus:outline-none"
          />
          <input
            type="password"
            placeholder="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border border-gray-600 bg-gray-800 text-white rounded-lg focus:outline-none"
          />
          <Button
            type="submit"
            disabled={loading}
            className="w-full text-white py-2 rounded-lg font-medium"
          >
            {loading ? "Signing in..." : "Sign In"}
          </Button>

          <h2 className="text-sm font-bold text-center mb-6 text-white">or</h2>
          
          <div className="flex justify-center gap-3">
            <button
              type="button"
              className="p-2 border border-gray-600 rounded-lg hover:bg-gray-800 transition"
              onClick={() => handleOAuthLogin('google')}
            >
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" style={{ width: '25px', height: '25px' }} alt="Google" />
            </button>

            <button
              type="button"
              className="p-2 border border-gray-600 rounded-lg hover:bg-gray-800 transition"
              onClick={() => handleOAuthLogin('facebook')}
            >
              <img src="https://www.svgrepo.com/show/475647/facebook-color.svg" style={{ width: '25px', height: '25px' }} alt="Facebook" />
            </button>
          </div>
        </form>
        
        <p className="text-center text-gray-400 text-sm mt-4">
          Don't have an account?{" "}
          <button
            type="button"
            className="text-white underline hover:text-gray-300"
            onClick={onRegister}
          >
            Register
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginModal;