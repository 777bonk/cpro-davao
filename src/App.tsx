import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import AdminDashboard from './pages/AdminDashboard'
import { AuthProvider, useAuth } from './hooks/useAuth'

// This wrapper prevents unauthenticated users from seeing the dashboard
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, isLoading } = useAuth();

  // Show a blank dark screen or spinner while checking auth status
  if (isLoading) {
    return <div className="h-screen w-screen bg-[#000000] flex items-center justify-center text-white">Loading...</div>;
  }

  // If no session exists, boot them back to the landing page
  if (!session) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Route */}
          <Route path="/*" element={<LandingPage />} />
          
          {/* Protected Admin Route */}
          <Route 
            path="/admin/*" 
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </BrowserRouter>
       <div id="portal-root" />
    </AuthProvider>
  )
  
}