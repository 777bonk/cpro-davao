import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import { AuthProvider, useAuth } from './hooks/useAuth';
import CustomerDashboard from './pages/CustomerDashboard';
import AdminDashboard from './pages/AdminDashboard';

const AuthRedirector = () => {
  const { session, profile, isLoading } = useAuth();

  if (isLoading) return (
    <div className="h-screen w-screen bg-[#000000] flex items-center justify-center text-white">
      Loading...
    </div>
  );

  if (!session || !profile) return <Navigate to="/" replace />;

  switch (profile.role) {
    case 'customer': return <Navigate to="/customer" replace />;
    case 'staff':    return <Navigate to="/staff" replace />;
    case 'admin':    return <Navigate to="/admin" replace />;
    default:         return <Navigate to="/" replace />;
  }
};

const ProtectedRoute = ({ children, allowedRoles }: { 
  children: React.ReactNode, 
  allowedRoles: string[] 
}) => {
  const { session, profile, isLoading } = useAuth();

  if (isLoading) return (
    <div className="h-screen w-screen bg-[#000000] flex items-center justify-center text-white">
      Loading...
    </div>
  );

  if (!session || !profile) return <Navigate to="/" replace />;
  if (!allowedRoles.includes(profile.role)) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Auth redirect hub — Google OAuth lands here */}
          <Route path="/dashboard" element={<AuthRedirector />} />

          {/* Customer route — only customers and admins can access */}
          <Route
            path="/customer/*"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <CustomerDashboard />
              </ProtectedRoute>
            }
          />

          {/* Admin route — only admins can access */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Public route — MUST be last */}
          <Route path="/*" element={<LandingPage />} />
        </Routes>
      </BrowserRouter>
      <div id="portal-root" />
    </AuthProvider>
  );
}