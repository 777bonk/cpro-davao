import React, { useState } from "react";
import { Button } from "../ui/button";
import { useNavigate } from "react-router-dom";
import RegisterModal from "./RegisterModal";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegister: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onRegister }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);



  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("http://localhost:3001/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (data.success) {
        onClose();
        navigate("/admin");
      } else {
        setError("Invalid username or password");
      }
    } catch (err) {
      setError("Cannot connect to server");
    } finally {
      setLoading(false);
    }
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
            type="text"
            placeholder="Username"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
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
            onClick={() => window.location.href = "http://localhost:3001/api/auth/google"}
          >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" style={{ width: '25px', height: '25px' }} />
          </button>

          <button
            type="button"
            className="p-2 border border-gray-600 rounded-lg hover:bg-gray-800 transition"
            onClick={() => window.location.href = "http://localhost:3001/api/auth/facebook"}
          >
            <img src="https://www.svgrepo.com/show/475647/facebook-color.svg" style={{ width: '25px', height: '25px' }} />
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