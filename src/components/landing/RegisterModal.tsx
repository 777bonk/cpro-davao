import React, { useState } from "react";
import { Button } from "../ui/button";
import { supabase } from "../../lib/supabase";

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RegisterModal: React.FC<RegisterModalProps> = ({ isOpen, onClose }) => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(""); // Added for email confirmation feedback

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      // Supabase Registration
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username, // Stores username in Supabase's user_metadata
            role: 'staff',      // Default role, maps nicely to our database schema
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
      } else if (data.user && data.session === null) {
        // Supabase requires email verification by default
        setSuccessMessage("Registration successful! Please check your email to verify your account.");
        // Optional: Auto-close after a few seconds
        setTimeout(() => onClose(), 5000); 
      } else {
        // If email verification is turned OFF in Supabase settings
        onClose();
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-500 max-w-sm rounded-lg shadow-2xl p-8 border border-gray-700"
        style={{ backgroundColor: "#000000" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-200 text-2xl font-bold"
          onClick={onClose}
        >
          X
        </button>

        <h2 className="text-2xl font-bold text-center mb-6 text-white">Register</h2>

        {error && (
          <p className="text-red-400 text-sm text-center mb-4">{error}</p>
        )}
        
        {successMessage && (
          <p className="text-green-400 text-sm text-center mb-4">{successMessage}</p>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Username"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-2 border border-gray-600 bg-gray-800 text-white rounded-lg focus:outline-none"
          />
          <input
            type="email"
            placeholder="Email"
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
          <input
            type="password"
            placeholder="Confirm Password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-2 border border-gray-600 bg-gray-800 text-white rounded-lg focus:outline-none"
          />

          <Button
            type="submit"
            disabled={loading}
            className="w-full text-white py-2 rounded-lg font-medium"
          >
            {loading ? "Registering..." : "Register"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default RegisterModal;