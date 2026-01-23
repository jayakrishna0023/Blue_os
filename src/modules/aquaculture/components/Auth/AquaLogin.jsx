import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Leaf, ClipboardCheck, Package, Eye, EyeOff, ArrowLeft, 
  Loader2, Fish, Shield, AlertCircle 
} from 'lucide-react';
import { aquaAuthAPI } from '../../services/aquaApi';

const ROLE_CONFIG = {
  farmer: {
    title: 'Farmer Login',
    subtitle: 'Access your farm and pond management dashboard',
    icon: Leaf,
    color: 'emerald',
    dashboardPath: '/aquaculture/farmer/dashboard',
    demoUser: 'aquafarmer',
    demoPass: 'password123'
  },
  inspector: {
    title: 'Inspector Login',
    subtitle: 'Access quality inspection and certification portal',
    icon: ClipboardCheck,
    color: 'blue',
    dashboardPath: '/aquaculture/inspector/dashboard',
    demoUser: 'aquainspector',
    demoPass: 'password123'
  },
  packer: {
    title: 'Packer Login',
    subtitle: 'Access crate management and dispatch system',
    icon: Package,
    color: 'orange',
    dashboardPath: '/aquaculture/packer/dashboard',
    demoUser: 'aquapacker',
    demoPass: 'password123'
  }
};

const AquaLogin = () => {
  const navigate = useNavigate();
  const { role } = useParams();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const config = ROLE_CONFIG[role] || ROLE_CONFIG.farmer;
  const IconComponent = config.icon;

  // Check if already logged in
  useEffect(() => {
    const checkAuth = async () => {
      const isAuth = await aquaAuthAPI.isAuthenticated();
      if (isAuth) {
        const user = aquaAuthAPI.getCurrentUser();
        if (user && user.role === role) {
          navigate(config.dashboardPath);
        }
      }
    };
    checkAuth();
  }, [role, navigate, config.dashboardPath]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await aquaAuthAPI.login(username, password, role);
      
      if (result.success) {
        navigate(config.dashboardPath);
      } else {
        setError(result.error || 'Invalid credentials');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = () => {
    setUsername(config.demoUser);
    setPassword(config.demoPass);
  };

  const getColorClasses = () => {
    switch (config.color) {
      case 'emerald':
        return {
          bg: 'bg-emerald-500/10',
          border: 'border-emerald-500/30',
          text: 'text-emerald-400',
          button: 'bg-emerald-600 hover:bg-emerald-500',
          glow: 'shadow-emerald-500/20'
        };
      case 'blue':
        return {
          bg: 'bg-blue-500/10',
          border: 'border-blue-500/30',
          text: 'text-blue-400',
          button: 'bg-blue-600 hover:bg-blue-500',
          glow: 'shadow-blue-500/20'
        };
      case 'orange':
        return {
          bg: 'bg-orange-500/10',
          border: 'border-orange-500/30',
          text: 'text-orange-400',
          button: 'bg-orange-600 hover:bg-orange-500',
          glow: 'shadow-orange-500/20'
        };
      default:
        return {
          bg: 'bg-slate-500/10',
          border: 'border-slate-500/30',
          text: 'text-slate-400',
          button: 'bg-slate-600 hover:bg-slate-500',
          glow: 'shadow-slate-500/20'
        };
    }
  };

  const colors = getColorClasses();

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-600/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-teal-600/10 rounded-full blur-[120px]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <button 
            onClick={() => navigate('/aquaculture')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Aquaculture</span>
          </button>
          <div className="flex items-center gap-2">
            <div className="bg-emerald-600 p-2 rounded-lg">
              <Fish className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white">BlueOS</span>
            <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">
              Aquaculture
            </span>
          </div>
        </div>
      </header>

      {/* Login Form */}
      <main className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-md">
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl">
            {/* Role Icon */}
            <div className="flex flex-col items-center mb-8">
              <div className={`p-4 ${colors.bg} ${colors.border} border rounded-2xl mb-4`}>
                <IconComponent className={`w-10 h-10 ${colors.text}`} />
              </div>
              <h1 className="text-2xl font-bold text-white">{config.title}</h1>
              <p className="text-slate-400 text-sm text-center mt-2">{config.subtitle}</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                  placeholder="Enter your username"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors pr-12"
                    placeholder="Enter your password"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-4 ${colors.button} text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${colors.glow} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            {/* Demo Credentials */}
            <div className="mt-8 pt-6 border-t border-slate-800">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-4 h-4 text-slate-500" />
                <span className="text-sm text-slate-500">Demo Credentials</span>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Username:</span>
                  <code className={colors.text}>{config.demoUser}</code>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Password:</span>
                  <code className={colors.text}>{config.demoPass}</code>
                </div>
              </div>
              <button
                type="button"
                onClick={fillDemoCredentials}
                className="w-full mt-3 py-2 text-sm text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-colors"
              >
                Use Demo Credentials
              </button>
            </div>
          </div>

          {/* Footer Links */}
          <div className="text-center mt-6">
            <p className="text-slate-500 text-sm">
              Need help? Contact support at{' '}
              <a href="tel:+916374484558" className="text-emerald-400 hover:underline">
                +91 6374 484 558
              </a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AquaLogin;
