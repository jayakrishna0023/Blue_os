import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { Fish, Lock, User, AlertCircle, Anchor } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login(username, password);
      if (response.success && response.user) {
        const role = response.user.role;
        if (role === 'admin') navigate('/admin');
        else if (role === 'captain' || role === 'vessel_owner') navigate('/captain');
        else if (role === 'worker') navigate('/worker');
        else if (role === 'inspector') navigate('/inspector');
        else setError('Unknown user role');
      } else {
        setError(response.message || 'Invalid credentials');
      }
    } catch (err) {
      console.error('Login Error:', err);
      if (err.response) {
        // Server responded with a status code outside 2xx
        setError(`Server Error: ${err.response.status} - ${err.response.statusText}`);
      } else if (err.request) {
        // Request was made but no response received
        setError('Network Error: No response from server. Check if PHP server is running.');
      } else {
        // Something happened in setting up the request
        setError('Error: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-ocean-900 via-deep-900 to-slate-900 p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-10 left-10 w-64 h-64 bg-ocean-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-ocean-400 to-blue-600 shadow-lg shadow-ocean-500/30 mb-6">
            <Anchor className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">BlueOS</h1>
          <p className="text-ocean-200 text-lg">Modern Fisheries Management</p>
        </div>

        <div className="glass-dark rounded-2xl p-8 animate-slide-up">
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-4 rounded-xl flex items-center gap-3 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-ocean-100 ml-1">Username</label>
              <div className="relative group">
                <User className="absolute left-4 top-3.5 w-5 h-5 text-ocean-300 group-focus-within:text-ocean-400 transition-colors" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-700 text-white px-12 py-3.5 rounded-xl focus:ring-2 focus:ring-ocean-500 focus:border-transparent outline-none transition-all placeholder-slate-500"
                  placeholder="Enter your username"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-ocean-100 ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-3.5 w-5 h-5 text-ocean-300 group-focus-within:text-ocean-400 transition-colors" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-700 text-white px-12 py-3.5 rounded-xl focus:ring-2 focus:ring-ocean-500 focus:border-transparent outline-none transition-all placeholder-slate-500"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-ocean-600 to-blue-600 hover:from-ocean-500 hover:to-blue-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-ocean-900/20 transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <Fish className="w-5 h-5" />
                </>
              )}
            </button>

            {/* Debug / Bypass Mode */}
            <div className="mt-4 pt-4 border-t border-slate-700 text-center">
              <p className="text-xs text-slate-500 mb-2">Development Mode (Bypass Login)</p>
              <div className="flex gap-2 justify-center">
                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem('user', JSON.stringify({ role: 'admin', full_name: 'Dev Admin' }));
                    navigate('/admin');
                  }}
                  className="text-xs px-3 py-1 bg-slate-800 text-slate-400 rounded hover:bg-slate-700 hover:text-white transition-colors"
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem('user', JSON.stringify({ role: 'captain', full_name: 'Dev Captain', vessel_name: 'Black Pearl' }));
                    navigate('/captain');
                  }}
                  className="text-xs px-3 py-1 bg-slate-800 text-slate-400 rounded hover:bg-slate-700 hover:text-white transition-colors"
                >
                  Captain
                </button>
              </div>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <p className="text-slate-400 text-sm mb-4">Don't have an account?</p>
            <div className="flex gap-3 justify-center">
              <button 
                onClick={() => navigate('/registry')}
                className="text-ocean-300 hover:text-white text-sm font-medium transition-colors hover:underline"
              >
                Register Vessel
              </button>
              <span className="text-slate-600">|</span>
              <button 
                onClick={() => navigate('/traceability')}
                className="text-ocean-300 hover:text-white text-sm font-medium transition-colors hover:underline"
              >
                Public Traceability
              </button>
            </div>
          </div>
        </div>
        
        <div className="mt-8 text-center text-slate-500 text-xs">
          <p>© 2025 BlueOS. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
