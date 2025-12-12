import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { Fish, Lock, User, AlertCircle, Anchor, ArrowLeft, Waves, Phone, Ship } from 'lucide-react';
import FisherRegistration from './FisherRegistration';

const Login = () => {
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

  const handleSendOtp = (e) => {
    e.preventDefault();
    if (mobile.length < 10) {
      setError('Please enter a valid mobile number');
      return;
    }
    // Mock OTP send
    setShowOtp(true);
    setError('');
    alert('Mock OTP for : 1234');
  };

  const handleFisherLogin = async (e) => {
    e.preventDefault();
    if (otp !== '1234') {
      setError('Invalid OTP');
      return;
    }
    
    setLoading(true);
    try {
      const response = await authAPI.fisherLogin(mobile);
      if (response.success) {
        if (response.isNewUser) {
          setShowRegistration(true);
        } else {
          navigate('/fisher');
        }
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError('Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVesselLogin = async (e) => {
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
      setError('Login failed. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  if (showRegistration) {
    return <FisherRegistration mobile={mobile} onComplete={() => navigate('/fisher')} />;
  }

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
          
          {/* Role Toggle */}
          <div className="flex bg-slate-800/50 p-1 rounded-xl mb-8">
            <button
              onClick={() => { setLoginType('fisher'); setError(''); }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${loginType === 'fisher' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
              <User className="w-4 h-4" />
              Fisher
            </button>
            <button
              onClick={() => { setLoginType('vessel'); setError(''); }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${loginType === 'vessel' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
              <Ship className="w-4 h-4" />
              Vessel / Admin
            </button>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3 text-sm mb-6">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}

          {loginType === 'fisher' ? (
            <form onSubmit={showOtp ? handleFisherLogin : handleSendOtp} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400 ml-1">Mobile Number</label>
                <div className="relative group">
                  <Phone className="absolute left-4 top-3.5 w-5 h-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white px-12 py-3.5 rounded-xl focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-slate-600"
                    placeholder="Enter mobile number"
                    required
                    disabled={showOtp}
                  />
                </div>
              </div>

              {showOtp && (
                <div className="space-y-2 animate-fade-in">
                  <label className="text-sm font-medium text-slate-400 ml-1">OTP</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-white px-12 py-3.5 rounded-xl focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-slate-600"
                      placeholder="Enter OTP"
                      required
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-4 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : (showOtp ? 'Login' : 'Send OTP')}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVesselLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400 ml-1">Username</label>
                <div className="relative group">
                  <User className="absolute left-4 top-3.5 w-5 h-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white px-12 py-3.5 rounded-xl focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-slate-600"
                    placeholder="Enter username"
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
                    placeholder="Enter password"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-4 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
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
