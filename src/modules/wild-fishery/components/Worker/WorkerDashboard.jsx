import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ClipboardCheck, LogOut, User, Package, CheckSquare } from 'lucide-react';
import { authAPI } from '../../../shared/services/api';
import { getCurrentUser } from '../../../shared/services/utils';
import WorkerHome from './WorkerHome';
import WorkerEntry from './WorkerEntry';
import CrateManagement from './CrateManagement';
import TripApprovals from './TripApprovals';
import WorkerProfile from './WorkerProfile';

const WorkerDashboard = () => {
  const location = useLocation();
  const user = getCurrentUser();

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
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
            BlueOS
          </h1>
          <p className="text-xs text-slate-400 font-medium tracking-wider uppercase mt-1">Worker Portal</p>
        </div>

        {/* User Mini Profile */}
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold text-sm">
              {(user?.full_name || user?.username || 'W').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-slate-800 truncate text-sm">{user?.full_name || user?.username}</p>
              <p className="text-xs text-slate-500">Quality Inspector</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <Link 
            to="/worker" 
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
              location.pathname === '/worker'
                ? 'bg-blue-50 text-blue-700 shadow-sm' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </Link>

          <Link 
            to="/worker/profile" 
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
              isActive('/worker/profile') 
                ? 'bg-blue-50 text-blue-700 shadow-sm' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <User className="w-5 h-5" />
            My Profile
          </Link>

          <Link 
            to="/worker/entry" 
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
              isActive('/worker/entry') 
                ? 'bg-blue-50 text-blue-700 shadow-sm' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <ClipboardCheck className="w-5 h-5" />
            Data Entry
          </Link>

          <Link 
            to="/worker/approvals" 
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
              isActive('/worker/approvals') 
                ? 'bg-blue-50 text-blue-700 shadow-sm' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <CheckSquare className="w-5 h-5" />
            Trip Approvals
          </Link>

          <Link 
            to="/worker/crates" 
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
              isActive('/worker/crates') 
                ? 'bg-blue-50 text-blue-700 shadow-sm' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Package className="w-5 h-5" />
            Crates Packing
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
        <span className="font-bold text-blue-600">BlueOS Worker</span>
        <button onClick={handleLogout} className="p-2 text-slate-500">
            <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-20 flex justify-around p-2 pb-safe">
        <Link 
            to="/worker" 
            className={`p-3 rounded-xl flex flex-col items-center gap-1 ${
                location.pathname === '/worker' ? 'text-blue-600 bg-blue-50' : 'text-slate-400'
            }`}
        >
            <LayoutDashboard className="w-6 h-6" />
            <span className="text-[10px] font-bold">Home</span>
        </Link>
        <Link 
            to="/worker/profile" 
            className={`p-3 rounded-xl flex flex-col items-center gap-1 ${
                isActive('/worker/profile') ? 'text-blue-600 bg-blue-50' : 'text-slate-400'
            }`}
        >
            <User className="w-6 h-6" />
            <span className="text-[10px] font-bold">Profile</span>
        </Link>
        <Link 
            to="/worker/entry" 
            className={`p-3 rounded-xl flex flex-col items-center gap-1 ${
                isActive('/worker/entry') ? 'text-blue-600 bg-blue-50' : 'text-slate-400'
            }`}
        >
            <ClipboardCheck className="w-6 h-6" />
            <span className="text-[10px] font-bold">Entry</span>
        </Link>
      </div>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 pt-20 md:pt-8 pb-24 md:pb-8">
        <Routes>
          <Route path="/" element={<WorkerHome />} />
          <Route path="/profile" element={<WorkerProfile />} />
          <Route path="/entry" element={<WorkerEntry />} />
          <Route path="/approvals" element={<TripApprovals />} />
          <Route path="/crates" element={<CrateManagement />} />
        </Routes>
      </main>
    </div>
  );
};

export default WorkerDashboard;
