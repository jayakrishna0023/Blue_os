import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { Fish, Lock, User, AlertCircle, Anchor, ArrowLeft, Waves } from 'lucide-react';

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
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden font-sans selection:bg-blue-500/30 selection:text-blue-200">
      
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan-600/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="w-full max-w-md z-10 relative">
        <button 
          onClick={() => navigate('/')}
          className="mb-8 flex items-center text-slate-400 hover:text-white transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </button>

        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center p-4 bg-blue-600/20 rounded-2xl mb-6 border border-blue-500/30 backdrop-blur-md shadow-lg shadow-blue-500/20">
            <Anchor className="w-10 h-10 text-blue-400" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Wild Fishery</h1>
          <p className="text-slate-400 text-lg">Login to your account</p>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl animate-slide-up">
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400 ml-1">Username</label>
              <div className="relative group">
                <User className="absolute left-4 top-3.5 w-5 h-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white px-12 py-3.5 rounded-xl focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-slate-600"
                  placeholder="Enter your username"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400 ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white px-12 py-3.5 rounded-xl focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-slate-600"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-900/20 transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
            <div className="mt-6 pt-6 border-t border-slate-800 text-center">
              <p className="text-xs text-slate-500 mb-3 uppercase tracking-wider font-semibold">Development Mode</p>
              <div className="flex gap-2 justify-center flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem('user', JSON.stringify({ role: 'admin', full_name: 'Dev Admin' }));
                    navigate('/admin');
                  }}
                  className="text-xs px-3 py-1.5 bg-slate-800 text-slate-400 rounded-lg hover:bg-blue-600/20 hover:text-blue-400 border border-transparent hover:border-blue-500/30 transition-all"
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem('user', JSON.stringify({ role: 'captain', full_name: 'Dev Captain', vessel_name: 'Black Pearl' }));
                    navigate('/captain');
                  }}
                  className="text-xs px-3 py-1.5 bg-slate-800 text-slate-400 rounded-lg hover:bg-blue-600/20 hover:text-blue-400 border border-transparent hover:border-blue-500/30 transition-all"
                >
                  Captain
                </button>
              </div>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-800 text-center">
            <p className="text-slate-400 text-sm mb-4">Don't have an account?</p>
            <div className="flex gap-3 justify-center">
              <button 
                onClick={() => navigate('/registry')}
                className="text-blue-400 hover:text-white text-sm font-medium transition-colors hover:underline"
              >
                Register Vessel
              </button>
              <span className="text-slate-600">|</span>
              <button 
                onClick={() => navigate('/traceability')}
                className="text-blue-400 hover:text-white text-sm font-medium transition-colors hover:underline"
              >
                Public Traceability
              </button>
            </div>
          </div>
        </div>
        
        <div className="mt-8 text-center text-slate-600 text-xs">
          <p>© 2025 BlueOS. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
