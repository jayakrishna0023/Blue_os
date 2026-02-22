import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Shared Module - Context, Components, Services
import { ToastProvider } from './modules/shared/components/Shared/Toast';
import { LanguageProvider } from './modules/shared/context/LanguageContext';
import { getCurrentUser, isAuthenticated } from './modules/shared/services/utils';
import { authAPI } from './modules/shared/services/api';

// Shared Module - Auth Components
import Login from './modules/shared/components/Auth/Login';
import VesselOwnerLogin from './modules/shared/components/Auth/VesselOwnerLogin';
import VesselOwnerRegistration from './modules/shared/components/Auth/VesselOwnerRegistration';
import FisherRegistration from './modules/shared/components/Auth/FisherRegistration';
import ModuleLogin from './modules/shared/components/Auth/ModuleLogin';

// Shared Module - Public Components
import About from './modules/shared/components/Public/About';
import Traceability from './modules/shared/components/Public/Traceability';
import PublicTraceability from './modules/shared/components/Public/PublicTraceability';
import VesselRegistry from './modules/shared/components/Public/VesselRegistry';

// Main Landing Page (Module Selection)
import LandingPage from './modules/shared/components/LandingPage';

// Wild Fishery Module - Components
import WildFisheryHome from './modules/wild-fishery/components/WildFisheryHome';
import WildFisheryLandingPage from './modules/wild-fishery/components/LandingPage';
import CaptainDashboard from './modules/wild-fishery/components/Captain/CaptainDashboard';
import WorkerDashboard from './modules/wild-fishery/components/Worker/WorkerDashboard';
import AdminDashboard from './modules/wild-fishery/components/Admin/AdminDashboard';
import InspectorDashboard from './modules/wild-fishery/components/Inspector/InspectorDashboard';
import FisherDashboard from './modules/wild-fishery/components/Fisher/FisherDashboard';
import QRGenerator from './modules/wild-fishery/components/Admin/QRGenerator';

// Aquaculture Module - Components
import AquacultureHome from './modules/aquaculture/components/AquacultureHome';
import AquaLogin from './modules/aquaculture/components/Auth/AquaLogin';
import AquaFarmerDashboard from './modules/aquaculture/components/Farmer/AquaFarmerDashboard';
import AquaInspectorDashboard from './modules/aquaculture/components/Inspector/AquaInspectorDashboard';
import AquaPackerDashboard from './modules/aquaculture/components/Packer/AquaPackerDashboard';

// Mariculture Module - Components
import MaricultureHome from './modules/mariculture/components/MaricultureHome';
import MariLogin from './modules/mariculture/components/Auth/MariLogin';
import MariFarmerDashboard from './modules/mariculture/components/Farmer/MariFarmerDashboard';
import MariInspectorDashboard from './modules/mariculture/components/Inspector/MariInspectorDashboard';
import MariPackerDashboard from './modules/mariculture/components/Packer/MariPackerDashboard';

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
    if (user.role === 'captain') return <Navigate to="/wild-fishery/captain" replace />;
    if (user.role === 'worker') return <Navigate to="/wild-fishery/worker" replace />;
    if (user.role === 'admin') return <Navigate to="/wild-fishery/admin" replace />;
    if (user.role === 'inspector') return <Navigate to="/wild-fishery/inspector" replace />;
    if (user.role === 'fisher') return <Navigate to="/wild-fishery/fisher" replace />;
    if (user.role === 'vessel_owner') return <Navigate to="/wild-fishery/vessel-owner" replace />;
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
              {/* ========================================= */}
              {/* PUBLIC ROUTES - No Authentication Needed */}
              {/* ========================================= */}
              
              {/* Main Landing - Wild Fishery (Original Production Landing) */}
              <Route path="/" element={<WildFisheryLandingPage />} />
              
              {/* Module Selection Page */}
              <Route path="/modules" element={<LandingPage />} />
              
              {/* Auth Routes - Shared */}
              <Route path="/login" element={<Login />} />
              <Route path="/vessel-owner/login" element={<VesselOwnerLogin />} />
              <Route path="/register/vessel-owner" element={<VesselOwnerRegistration />} />
              <Route path="/register/fisher" element={<FisherRegistration />} />
              
              {/* Module Login Routes */}
              <Route path="/:module/login/:role" element={<ModuleLogin />} />
              
              {/* Public Information Routes */}
              <Route path="/about" element={<About />} />
              <Route path="/traceability" element={<Traceability />} />
              <Route path="/public-trace" element={<PublicTraceability />} />
              <Route path="/registry" element={<VesselRegistry />} />

              {/* ========================================= */}
              {/* WILD FISHERY MODULE - Protected Routes   */}
              {/* ========================================= */}
              
              {/* Legacy routes - redirect to new paths */}
              <Route path="/captain/*" element={<Navigate to="/wild-fishery/captain" replace />} />
              <Route path="/worker/*" element={<Navigate to="/wild-fishery/worker" replace />} />
              <Route path="/admin/*" element={<Navigate to="/wild-fishery/admin" replace />} />
              <Route path="/inspector/*" element={<Navigate to="/wild-fishery/inspector" replace />} />
              <Route path="/fisher/*" element={<Navigate to="/wild-fishery/fisher" replace />} />
              <Route path="/vessel-owner/*" element={<Navigate to="/wild-fishery/vessel-owner" replace />} />
              
              {/* Wild Fishery - Captain Routes */}
              <Route 
                path="/wild-fishery/captain/*" 
                element={
                  <ProtectedRoute allowedRoles={['captain']}>
                    <CaptainDashboard />
                  </ProtectedRoute>
                } 
              />

              {/* Wild Fishery - Vessel Owner Routes */}
              <Route 
                path="/wild-fishery/vessel-owner/*" 
                element={
                  <ProtectedRoute allowedRoles={['vessel_owner']}>
                    <CaptainDashboard />
                  </ProtectedRoute>
                } 
              />
              
              {/* Wild Fishery - Worker Routes */}
              <Route 
                path="/wild-fishery/worker/*" 
                element={
                  <ProtectedRoute allowedRoles={['worker']}>
                    <WorkerDashboard />
                  </ProtectedRoute>
                } 
              />
              
              {/* Wild Fishery - Admin Routes */}
              <Route 
                path="/wild-fishery/admin/*" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />

              {/* Wild Fishery - Inspector Routes */}
              <Route 
                path="/wild-fishery/inspector/*" 
                element={
                  <ProtectedRoute allowedRoles={['inspector']}>
                    <InspectorDashboard />
                  </ProtectedRoute>
                } 
              />

              {/* Wild Fishery - Fisher Routes */}
              <Route 
                path="/wild-fishery/fisher/*" 
                element={
                  <ProtectedRoute allowedRoles={['fisher']}>
                    <FisherDashboard />
                  </ProtectedRoute>
                } 
              />

              {/* Wild Fishery - QR Generator (Admin Only) */}
              <Route 
                path="/wild-fishery/qr-generator" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <QRGenerator />
                  </ProtectedRoute>
                } 
              />
              
              {/* Legacy QR Generator Route - Redirect to new path */}
              <Route 
                path="/qr-generator" 
                element={<Navigate to="/wild-fishery/qr-generator" replace />} 
              />

              {/* ========================================= */}
              {/* AQUACULTURE MODULE                       */}
              {/* ========================================= */}
              
              {/* Aquaculture Home */}
              <Route path="/aquaculture" element={<AquacultureHome />} />
              
              {/* Aquaculture Login Routes */}
              <Route path="/aquaculture/login/:role" element={<AquaLogin />} />
              
              {/* Aquaculture Farmer Dashboard */}
              <Route path="/aquaculture/farmer/dashboard" element={<AquaFarmerDashboard />} />
              
              {/* Aquaculture Inspector Dashboard */}
              <Route path="/aquaculture/inspector/dashboard" element={<AquaInspectorDashboard />} />
              
              {/* Aquaculture Packer Dashboard */}
              <Route path="/aquaculture/packer/dashboard" element={<AquaPackerDashboard />} />

              {/* ========================================= */}
              {/* MARICULTURE MODULE                        */}
              {/* ========================================= */}
              
              {/* Mariculture Home */}
              <Route path="/mariculture" element={<MaricultureHome />} />
              
              {/* Mariculture Login Routes */}
              <Route path="/mariculture/login/:role" element={<MariLogin />} />
              
              {/* Mariculture Farmer Dashboard */}
              <Route path="/mariculture/farmer/dashboard" element={<MariFarmerDashboard />} />
              
              {/* Mariculture Inspector Dashboard */}
              <Route path="/mariculture/inspector/dashboard" element={<MariInspectorDashboard />} />
              
              {/* Mariculture Packer Dashboard */}
              <Route path="/mariculture/packer/dashboard" element={<MariPackerDashboard />} />

              {/* Catch all - Redirect to home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Router>
      </ToastProvider>
    </LanguageProvider>
  );
}

export default App;
