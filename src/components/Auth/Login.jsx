import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { Fish, Lock, User, AlertCircle, Anchor, ArrowLeft, Waves, Phone, Ship, RefreshCw } from 'lucide-react';
import FisherRegistration from './FisherRegistration';
import { useToast } from '../Shared/Toast';

const Login = () => {
  const toast = useToast();
  const [loginType, setLoginType] = useState('fisher'); // 'fisher' or 'vessel'
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  
  // Vessel Login State (Legacy/Owner)
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRegistration, setShowRegistration] = useState(false);
  
  const navigate = useNavigate();

  // Clear any stale state on mount
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      console.log('Found existing user session:', user);
    }
  }, []);

  const handleClearSession = () => {
    localStorage.clear();
    window.location.reload();
  };

  const handleSendOtp = (e) => {
    e.preventDefault();
    if (mobile.length < 10) {
      setError('Please enter a valid mobile number (10 digits)');
      return;
    }
    // Mock OTP send
    setShowOtp(true);
    setError('');
    setLoading(true);
    setTimeout(() => {
        setLoading(false);
        toast.info('Your OTP is: 1234', 'OTP Sent');
    }, 1000);
  };

  const handleFisherLogin = async (e) => {
    e.preventDefault();
    if (otp !== '1234') {
      setError('Invalid OTP. Please enter 1234.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      console.log('Attempting Fisher Login with:', mobile);
      const response = await authAPI.fisherLogin(mobile);
      console.log('Fisher Login Response:', response);

      if (response.success) {
        if (response.isNewUser) {
          console.log('User is new, showing registration...');
          setShowRegistration(true);
        } else {
          console.log('User exists, navigating to dashboard...');
          navigate('/fisher');
        }
      } else {
        setError(response.message || 'Login failed. Please try again.');
      }
    } catch (err) {
      console.error('Fisher Login Error:', err);
      setError('Connection failed. Please check if the server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleVesselLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('Attempting Vessel/Admin Login:', username);
      const response = await authAPI.login(username, password);
      console.log('Login Response:', response);

      if (response.success && response.user) {
        const role = response.user.role;
        console.log('User Role:', role);
        
        if (role === 'admin') navigate('/admin');
        else if (role === 'captain' || role === 'vessel_owner') navigate('/captain');
        else if (role === 'worker') navigate('/worker');
        else if (role === 'inspector') navigate('/inspector');
        else setError(`Unknown user role: ${role}`);
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

  if (showRegistration) {
    return <FisherRegistration mobile={mobile} onComplete={() => navigate('/fisher')} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-3 sm:p-4 relative overflow-hidden font-sans selection:bg-blue-500/30 selection:text-blue-200">
      
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan-600/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="w-full max-w-md z-10 relative">
        <div className="flex justify-between items-center mb-8">
            <button 
            onClick={() => navigate('/')}
            className="flex items-center text-slate-400 hover:text-white transition-colors group"
            >
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Home
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
          <div className="inline-flex items-center justify-center p-3 sm:p-4 bg-blue-600/20 rounded-xl sm:rounded-2xl mb-4 sm:mb-6 border border-blue-500/30 backdrop-blur-md shadow-lg shadow-blue-500/20">
            <Anchor className="w-8 h-8 sm:w-10 sm:h-10 text-blue-400" />
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2 tracking-tight">Wild Fishery</h1>
          <p className="text-slate-400 text-sm sm:text-lg">Login to your account</p>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-2xl animate-slide-up">
          
          {/* Role Toggle */}
          <div className="flex bg-slate-800/50 p-1 rounded-xl mb-6 sm:mb-8">
            <button
              onClick={() => { setLoginType('fisher'); setError(''); }}
              className={`flex-1 py-2.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center justify-center gap-1.5 sm:gap-2 touch-target ${loginType === 'fisher' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
              <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Fisher
            </button>
            <button
              onClick={() => { setLoginType('vessel'); setError(''); }}
              className={`flex-1 py-2.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center justify-center gap-1.5 sm:gap-2 touch-target ${loginType === 'vessel' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
              <Ship className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">Vessel /</span> Admin
            </button>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 sm:p-4 rounded-xl flex items-center gap-2 sm:gap-3 text-xs sm:text-sm mb-4 sm:mb-6">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="line-clamp-2">{error}</span>
            </div>
          )}

          {loginType === 'fisher' ? (
            <form onSubmit={showOtp ? handleFisherLogin : handleSendOtp} className="space-y-4 sm:space-y-6">
              <div className="space-y-1.5 sm:space-y-2">
                <label className="text-xs sm:text-sm font-medium text-slate-400 ml-1">Mobile Number</label>
                <div className="relative group">
                  <Phone className="absolute left-3 sm:left-4 top-3 sm:top-3.5 w-4 h-4 sm:w-5 sm:h-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white text-base px-10 sm:px-12 py-3 sm:py-3.5 rounded-xl focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-slate-600"
                    placeholder="Enter mobile number"
                    required
                    disabled={showOtp}
                  />
                </div>
              </div>

              {showOtp && (
                <div className="space-y-1.5 sm:space-y-2 animate-fade-in">
                  <label className="text-xs sm:text-sm font-medium text-slate-400 ml-1">OTP</label>
                  <div className="relative group">
                    <Lock className="absolute left-3 sm:left-4 top-3 sm:top-3.5 w-4 h-4 sm:w-5 sm:h-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-white text-base px-10 sm:px-12 py-3 sm:py-3.5 rounded-xl focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-slate-600"
                      placeholder="Enter OTP (1234)"
                      required
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-3.5 sm:py-4 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base touch-target"
              >
                {loading ? 'Processing...' : (showOtp ? 'Login' : 'Send OTP')}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVesselLogin} className="space-y-4 sm:space-y-6">
              <div className="space-y-1.5 sm:space-y-2">
                <label className="text-xs sm:text-sm font-medium text-slate-400 ml-1">Username</label>
                <div className="relative group">
                  <User className="absolute left-3 sm:left-4 top-3 sm:top-3.5 w-4 h-4 sm:w-5 sm:h-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white text-base px-10 sm:px-12 py-3 sm:py-3.5 rounded-xl focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-slate-600"
                    placeholder="Enter username"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <label className="text-xs sm:text-sm font-medium text-slate-400 ml-1">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-3 sm:left-4 top-3 sm:top-3.5 w-4 h-4 sm:w-5 sm:h-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white text-base px-10 sm:px-12 py-3 sm:py-3.5 rounded-xl focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-slate-600"
                    placeholder="Enter password"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-3.5 sm:py-4 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base touch-target"
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
