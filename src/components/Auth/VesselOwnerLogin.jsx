import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { Lock, User, AlertCircle, Anchor, ArrowLeft, Ship, RefreshCw, Users } from 'lucide-react';
import { useToast } from '../Shared/Toast';

const VesselOwnerLogin = () => {
  const toast = useToast();
  const navigate = useNavigate();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleClearSession = () => {
    sessionStorage.clear();
    window.location.reload();
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('Attempting Vessel Owner Login:', username);
      const response = await authAPI.vesselOwnerLogin(username, password);
      console.log('Vessel Owner Login Response:', response);

      if (response.success && response.user) {
        toast.success('Welcome back!', 'Login Successful');
        navigate('/vessel-owner');
      } else {
        setError(response.message || 'Invalid credentials');
      }
    } catch (err) {
      console.error('Login Error:', err);
      setError('Login failed. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-3 sm:p-4 relative overflow-hidden font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-cyan-600/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="w-full max-w-md z-10 relative">
        <div className="flex justify-between items-center mb-8">
          <button 
            onClick={() => navigate('/login')}
            className="flex items-center text-slate-400 hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Login
          </button>

          <button 
            onClick={handleClearSession}
            className="flex items-center text-xs text-slate-500 hover:text-red-400 transition-colors"
            title="Clear Session Data"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Reset
          </button>
        </div>

        <div className="text-center mb-6 sm:mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center p-3 sm:p-4 bg-cyan-600/20 rounded-xl sm:rounded-2xl mb-4 sm:mb-6 border border-cyan-500/30 backdrop-blur-md shadow-lg shadow-cyan-500/20">
            <Ship className="w-8 h-8 sm:w-10 sm:h-10 text-cyan-400" />
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2 tracking-tight">Vessel Owner</h1>
          <p className="text-slate-400 text-sm sm:text-lg">Login to manage your vessels</p>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-2xl animate-slide-up">
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 sm:p-4 rounded-xl flex items-center gap-2 sm:gap-3 text-xs sm:text-sm mb-4 sm:mb-6">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="line-clamp-2">{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 sm:space-y-6">
            <div className="space-y-1.5 sm:space-y-2">
              <label className="text-xs sm:text-sm font-medium text-slate-400 ml-1">Username</label>
              <div className="relative group">
                <User className="absolute left-3 sm:left-4 top-3 sm:top-3.5 w-4 h-4 sm:w-5 sm:h-5 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white text-base px-10 sm:px-12 py-3 sm:py-3.5 rounded-xl focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all placeholder-slate-600"
                  placeholder="Enter username"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <label className="text-xs sm:text-sm font-medium text-slate-400 ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-3 sm:left-4 top-3 sm:top-3.5 w-4 h-4 sm:w-5 sm:h-5 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white text-base px-10 sm:px-12 py-3 sm:py-3.5 rounded-xl focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all placeholder-slate-600"
                  placeholder="Enter password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-bold py-3.5 sm:py-4 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-cyan-500/25 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base touch-target"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          {/* Registration Link */}
          <div className="mt-6 pt-6 border-t border-slate-700/50">
            <p className="text-center text-slate-400 text-sm">
              Don't have an account?
            </p>
            <button 
              type="button"
              onClick={() => navigate('/register/vessel-owner')}
              className="w-full mt-3 py-3 px-4 rounded-xl border border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 transition-all text-sm font-medium flex items-center justify-center gap-2"
            >
              <Users className="w-4 h-4" />
              Register as Vessel Owner
            </button>
          </div>

          {/* Pending Registration Info */}
          <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <p className="text-amber-400 text-xs text-center">
              ⏳ Already registered? Please wait for admin approval before logging in.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VesselOwnerLogin;
