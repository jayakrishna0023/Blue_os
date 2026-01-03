import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, User, Lock, Droplets, Shell, Eye, EyeOff } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import LanguageToggle from '../Shared/LanguageToggle';
import Toast from '../Shared/Toast';
import { authAPI } from '../../services/api';

const ModuleLogin = () => {
  const navigate = useNavigate();
  const { module, role } = useParams();
  const { t } = useLanguage();
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });

  // Demo credentials for each module and role
  const demoCredentials = {
    aquaculture: {
      farmer: { username: 'aqua_farmer', password: 'farmer123' },
      inspector: { username: 'aqua_inspector', password: 'inspector123' },
      packer: { username: 'aqua_packer', password: 'packer123' }
    },
    mariculture: {
      farmer: { username: 'mari_farmer', password: 'farmer123' },
      inspector: { username: 'mari_inspector', password: 'inspector123' },
      packer: { username: 'mari_packer', password: 'packer123' }
    }
  };

  // Module configuration
  const moduleConfig = {
    aquaculture: {
      name: 'Aquaculture',
      nameTamil: 'நன்னீர் வளர்ப்பு',
      gradient: 'from-emerald-600 to-teal-500',
      icon: Droplets,
      bgClass: 'from-emerald-600/15 to-teal-600/15'
    },
    mariculture: {
      name: 'Mariculture',
      nameTamil: 'கடல் வளர்ப்பு',
      gradient: 'from-purple-600 to-pink-500',
      icon: Shell,
      bgClass: 'from-purple-600/15 to-pink-600/15'
    }
  };

  // Role configuration
  const roleConfig = {
    farmer: { title: 'Farmer Login', titleTamil: 'விவசாயி உள்நுழைவு' },
    inspector: { title: 'Inspector Login', titleTamil: 'ஆய்வாளர் உள்நுழைவு' },
    packer: { title: 'Packer Login', titleTamil: 'பேக்கர் உள்நுழைவு' }
  };

  const currentModule = moduleConfig[module] || moduleConfig.aquaculture;
  const currentRole = roleConfig[role] || roleConfig.farmer;
  const demoCreds = demoCredentials[module]?.[role] || {};
  const IconComponent = currentModule.icon;

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Call backend API for module login
      const response = await authAPI.moduleLogin(credentials.username, credentials.password, module, role);
      console.log('Module Login Response:', response);

      if (response.success && response.user) {
        setToast({ message: 'Login successful!', type: 'success' });
        
        // Navigate to respective dashboard
        setTimeout(() => {
          navigate(`/${module}/${role}/dashboard`);
        }, 500);
      } else {
        setToast({ message: response.message || 'Invalid credentials. Please try again.', type: 'error' });
      }
    } catch (error) {
      console.error('Module Login Error:', error);
      // Fallback to demo credentials for development
      if (credentials.username === demoCreds.username && credentials.password === demoCreds.password) {
        // Store user info for demo mode
        const demoUser = {
          id: `${module}_${role}_demo`,
          username: credentials.username,
          role: role,
          module: module
        };
        sessionStorage.setItem('user', JSON.stringify(demoUser));
        setToast({ message: 'Login successful! (Demo Mode)', type: 'success' });
        setTimeout(() => {
          navigate(`/${module}/${role}/dashboard`);
        }, 500);
      } else {
        setToast({ message: 'Invalid credentials. Please try again.', type: 'error' });
      }
    }
    
    setLoading(false);
  };

  const fillDemoCredentials = () => {
    setCredentials({
      username: demoCreds.username || '',
      password: demoCreds.password || ''
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden flex items-center justify-center">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
        <div className={`absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-gradient-to-br ${currentModule.bgClass} rounded-full blur-[120px]`}></div>
        <div className={`absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-gradient-to-br ${currentModule.bgClass} rounded-full blur-[120px]`}></div>
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-20 px-6 py-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <button
            onClick={() => navigate(`/${module}`)}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <LanguageToggle />
        </div>
      </header>

      {/* Login Form */}
      <div className="relative z-10 w-full max-w-md px-6">
        <div className="bg-slate-900/80 backdrop-blur-lg border border-slate-800 rounded-2xl p-8">
          {/* Module Icon */}
          <div className="text-center mb-6">
            <div className={`inline-flex p-4 bg-gradient-to-br ${currentModule.gradient} rounded-2xl mb-4`}>
              <IconComponent className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">{currentModule.name}</h1>
            <p className="text-slate-400">{currentModule.nameTamil}</p>
          </div>

          {/* Role Title */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-white">{currentRole.title}</h2>
            <p className="text-sm text-slate-500">{currentRole.titleTamil}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Username</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  name="username"
                  value={credentials.username}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-colors"
                  placeholder="Enter username"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={credentials.password}
                  onChange={handleChange}
                  className="w-full pl-12 pr-12 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-colors"
                  placeholder="Enter password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 bg-gradient-to-r ${currentModule.gradient} text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                'Login'
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm text-slate-400">Demo Credentials</p>
              <button
                onClick={fillDemoCredentials}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                Auto Fill
              </button>
            </div>
            <p className="text-sm font-mono text-slate-300">
              {demoCreds.username} / {demoCreds.password}
            </p>
          </div>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default ModuleLogin;
