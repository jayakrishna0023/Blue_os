import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/Shared/Toast';
import LandingPage from './components/LandingPage';
import Login from './components/Auth/Login';
import CaptainDashboard from './components/Captain/CaptainDashboard';
import WorkerDashboard from './components/Worker/WorkerDashboard';
import AdminDashboard from './components/Admin/AdminDashboard';
import InspectorDashboard from './components/Inspector/InspectorDashboard';
import FisherDashboard from './components/Fisher/FisherDashboard';
import Traceability from './components/Public/Traceability';
import PublicTraceability from './components/Public/PublicTraceability';
import VesselRegistry from './components/Public/VesselRegistry';
import About from './components/Public/About';
import QRGenerator from './components/Admin/QRGenerator';
import { getCurrentUser, isAuthenticated } from './services/utils';
import { authAPI } from './services/api';

// Protected Route Component with session validation
const ProtectedRoute = ({ children, allowedRoles }) => {
  const [validating, setValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const user = getCurrentUser();
  
  useEffect(() => {
    const validateUserSession = async () => {
      if (!user) {
        setIsValid(false);
        setValidating(false);
        return;
      }
      
      // Check if we have a token
      if (isAuthenticated()) {
        // Optionally validate with server (can be done periodically)
        try {
          const valid = await authAPI.validateSession();
          setIsValid(valid);
        } catch (e) {
          // If validation fails, still allow if we have local user data
          // This handles offline scenarios
          setIsValid(true);
        }
      } else {
        // Legacy mode - user exists but no token
        setIsValid(true);
      }
      setValidating(false);
    };
    
    validateUserSession();
  }, [user]);

  if (validating) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500">Validating session...</p>
        </div>
      </div>
    );
  }
  
  if (!user || !isValid) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on role
    if (user.role === 'captain') return <Navigate to="/captain" replace />;
    if (user.role === 'worker') return <Navigate to="/worker" replace />;
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'inspector') return <Navigate to="/inspector" replace />;
    if (user.role === 'fisher') return <Navigate to="/fisher" replace />;
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  return (
    <ToastProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="min-h-screen bg-slate-950 text-white font-sans">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/about" element={<About />} />
            <Route path="/traceability" element={<Traceability />} />
            <Route path="/public-trace" element={<PublicTraceability />} />
            <Route path="/registry" element={<VesselRegistry />} />

          {/* Protected Routes */}
          <Route 
            path="/captain/*" 
            element={
              <ProtectedRoute allowedRoles={['captain', 'vessel_owner']}>
                <CaptainDashboard />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/worker/*" 
            element={
              <ProtectedRoute allowedRoles={['worker']}>
                <WorkerDashboard />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/admin/*" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/inspector/*" 
            element={
              <ProtectedRoute allowedRoles={['inspector']}>
                <InspectorDashboard />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/fisher/*" 
            element={
              <ProtectedRoute allowedRoles={['fisher']}>
                <FisherDashboard />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/qr-generator" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <QRGenerator />
              </ProtectedRoute>
            } 
          />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </div>
      </Router>
    </ToastProvider>
  );
}

export default App;
