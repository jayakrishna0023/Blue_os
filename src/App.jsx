import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import Login from './components/Auth/Login';
import CaptainDashboard from './components/Captain/CaptainDashboard';
import WorkerDashboard from './components/Worker/WorkerDashboard';
import AdminDashboard from './components/Admin/AdminDashboard';
import InspectorDashboard from './components/Inspector/InspectorDashboard';
import FisherDashboard from './components/Fisher/FisherDashboard';
import Traceability from './components/Public/Traceability';
import VesselRegistry from './components/Public/VesselRegistry';
import About from './components/Public/About';
import QRGenerator from './components/Admin/QRGenerator';
import { getCurrentUser } from './services/utils';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const user = getCurrentUser();
  
  if (!user) {
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
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="min-h-screen bg-slate-950 text-white font-sans">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/about" element={<About />} />
          <Route path="/traceability" element={<Traceability />} />
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
  );
}

export default App;
