import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Auth/Login';
import CaptainDashboard from './components/Captain/CaptainDashboard';
import WorkerDashboard from './components/Worker/WorkerDashboard';
import AdminDashboard from './components/Admin/AdminDashboard';
import InspectorDashboard from './components/Inspector/InspectorDashboard';
import Traceability from './components/Public/Traceability';
import VesselRegistry from './components/Public/VesselRegistry';
import QRGenerator from './components/Admin/QRGenerator';
import { getCurrentUser } from './services/utils';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const user = getCurrentUser();
  
  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on role
    if (user.role === 'captain') return <Navigate to="/captain" replace />;
    if (user.role === 'worker') return <Navigate to="/worker" replace />;
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'inspector') return <Navigate to="/inspector" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Login />} />
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
