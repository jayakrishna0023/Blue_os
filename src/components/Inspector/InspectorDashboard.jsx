import React from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { LayoutDashboard, ClipboardCheck, LogOut } from 'lucide-react';
import { authAPI } from '../../services/api';
import InspectorHome from './InspectorHome';
import QualityEntry from './QualityEntry';
import TripDetails from './TripDetails';

const InspectorDashboard = () => {
  const location = useLocation();

  const handleLogout = () => {
    authAPI.logout();
  };

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 fixed h-full z-20 hidden md:flex flex-col">
        <div className="p-6 border-b border-slate-100">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-ocean-600 to-ocean-400 bg-clip-text text-transparent">
            BlueOS
          </h1>
          <p className="text-xs text-slate-400 font-medium tracking-wider uppercase mt-1">Quality Control</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <Link 
            to="/inspector" 
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
              location.pathname === '/inspector' || location.pathname.startsWith('/inspector/trip')
                ? 'bg-ocean-50 text-ocean-700 shadow-sm' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </Link>

          <Link 
            to="/inspector/entry" 
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
              isActive('/inspector/entry') 
                ? 'bg-ocean-50 text-ocean-700 shadow-sm' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <ClipboardCheck className="w-5 h-5" />
            Data Entry
          </Link>
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-left text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all font-medium"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-slate-200 z-20 px-4 py-3 flex justify-between items-center">
        <span className="font-bold text-ocean-600">BlueOS Inspector</span>
        <button onClick={handleLogout} className="p-2 text-slate-500">
            <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-20 flex justify-around p-2 pb-safe">
        <Link 
            to="/inspector" 
            className={`p-3 rounded-xl flex flex-col items-center gap-1 ${
                location.pathname === '/inspector' ? 'text-ocean-600 bg-ocean-50' : 'text-slate-400'
            }`}
        >
            <LayoutDashboard className="w-6 h-6" />
            <span className="text-[10px] font-bold">Home</span>
        </Link>
        <Link 
            to="/inspector/entry" 
            className={`p-3 rounded-xl flex flex-col items-center gap-1 ${
                location.pathname === '/inspector/entry' ? 'text-ocean-600 bg-ocean-50' : 'text-slate-400'
            }`}
        >
            <ClipboardCheck className="w-6 h-6" />
            <span className="text-[10px] font-bold">Entry</span>
        </Link>
      </div>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 pt-20 md:pt-8 pb-24 md:pb-8">
        <Routes>
          <Route path="/" element={<InspectorHome />} />
          <Route path="/entry" element={<QualityEntry />} />
          <Route path="/trip/:tripId" element={<TripDetails />} />
          <Route path="*" element={<Navigate to="/inspector" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export default InspectorDashboard;
