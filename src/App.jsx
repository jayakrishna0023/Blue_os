import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Shared Components
import { ToastProvider } from './modules/shared/components/Shared/Toast';
import { LanguageProvider } from './modules/shared/context/LanguageContext';

// Auth Components
import Login from './modules/shared/components/Auth/Login';
import VesselOwnerLogin from './modules/shared/components/Auth/VesselOwnerLogin';
import VesselOwnerRegistration from './modules/shared/components/Auth/VesselOwnerRegistration';

// Wild Fishery Components
import LandingPage from './modules/wild-fishery/components/LandingPage';
import CaptainDashboard from './modules/wild-fishery/components/Captain/CaptainDashboard';
import WorkerDashboard from './modules/wild-fishery/components/Worker/WorkerDashboard';
import AdminDashboard from './modules/wild-fishery/components/Admin/AdminDashboard';
import InspectorDashboard from './modules/wild-fishery/components/Inspector/InspectorDashboard';
import FisherDashboard from './modules/wild-fishery/components/Fisher/FisherDashboard';
import QRGenerator from './modules/wild-fishery/components/Admin/QRGenerator';

// Public Components
import Traceability from './modules/shared/components/Public/Traceability';
import PublicTraceability from './modules/shared/components/Public/PublicTraceability';
import VesselRegistry from './modules/shared/components/Public/VesselRegistry';
import About from './modules/shared/components/Public/About';

// Services
import { getCurrentUser, isAuthenticated } from './modules/shared/services/utils';
import { authAPI } from './modules/shared/services/api';

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
    if (user.role === 'vessel_owner') return <Navigate to="/vessel-owner" replace />;
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  return (
    <LanguageProvider>
      <ToastProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <div className="min-h-screen bg-slate-950 text-white font-sans">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register/vessel-owner" element={<VesselOwnerRegistration />} />
            <Route path="/about" element={<About />} />
            <Route path="/traceability" element={<Traceability />} />
            <Route path="/public-trace" element={<PublicTraceability />} />
            <Route path="/registry" element={<VesselRegistry />} />
            <Route path="/vessel-owner/login" element={<VesselOwnerLogin />} />

          {/* Protected Routes */}
          <Route 
            path="/captain/*" 
            element={
              <ProtectedRoute allowedRoles={['captain']}>
                <CaptainDashboard />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/vessel-owner/*" 
            element={
              <ProtectedRoute allowedRoles={['vessel_owner']}>
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
    </LanguageProvider>
  );
}

export default App;
