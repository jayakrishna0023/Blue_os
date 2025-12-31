import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Fish, Anchor, Users, Shield, Eye, Ship, ArrowLeft } from 'lucide-react';
import { useLanguage } from '../../shared/context/LanguageContext';
import LanguageToggle from '../../shared/components/Shared/LanguageToggle';

const WildFisheryHome = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const loginOptions = [
    {
      id: 'staff',
      title: 'Staff Login',
      titleTamil: 'பணியாளர் உள்நுழைவு',
      description: 'Admin, Captain, Worker, Inspector',
      icon: Users,
      color: 'from-blue-600 to-cyan-500',
      path: '/wild-fishery/login/staff'
    },
    {
      id: 'fisher',
      title: 'Fisher Login',
      titleTamil: 'மீனவர் உள்நுழைவு',
      description: 'Login with mobile OTP',
      icon: Anchor,
      color: 'from-emerald-600 to-teal-500',
      path: '/wild-fishery/login/fisher'
    },
    {
      id: 'vessel-owner',
      title: 'Vessel Owner',
      titleTamil: 'படகு உரிமையாளர்',
      description: 'Vessel owner login',
      icon: Ship,
      color: 'from-purple-600 to-pink-500',
      path: '/wild-fishery/login/vessel-owner'
    }
  ];

  const publicOptions = [
    {
      id: 'trace',
      title: 'Trace Product',
      description: 'Scan QR to trace seafood origin',
      icon: Eye,
      path: '/public-trace'
    },
    {
      id: 'registry',
      title: 'Vessel Registry',
      description: 'View registered vessels',
      icon: Ship,
      path: '/registry'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/15 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan-600/15 rounded-full blur-[120px]"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 px-6 py-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </button>
          <LanguageToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Module Header */}
          <div className="text-center mb-12">
            <div className="inline-flex p-4 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl mb-6">
              <Fish className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">Wild Fishery</h1>
            <p className="text-lg text-slate-400">காட்டு மீன்பிடி</p>
            <p className="text-slate-500 mt-2">Track and trace wild-caught seafood from ocean to plate</p>
          </div>

          {/* Login Options */}
          <div className="mb-12">
            <h2 className="text-xl font-semibold text-white mb-6 text-center">Select Login Type</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {loginOptions.map((option) => {
                const IconComponent = option.icon;
                return (
                  <button
                    key={option.id}
                    onClick={() => navigate(option.path)}
                    className="group bg-slate-900/50 border border-slate-800 rounded-2xl p-6 text-left hover:bg-slate-800/50 hover:border-slate-700 transition-all"
                  >
                    <div className={`inline-flex p-3 bg-gradient-to-br ${option.color} rounded-xl mb-4`}>
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-1">{option.title}</h3>
                    <p className="text-xs text-slate-500 mb-2">{option.titleTamil}</p>
                    <p className="text-sm text-slate-400">{option.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Public Options */}
          <div className="border-t border-slate-800 pt-8">
            <h2 className="text-lg font-semibold text-slate-400 mb-6 text-center">Public Access</h2>
            <div className="flex justify-center gap-6">
              {publicOptions.map((option) => {
                const IconComponent = option.icon;
                return (
                  <button
                    key={option.id}
                    onClick={() => navigate(option.path)}
                    className="flex items-center gap-3 px-6 py-3 bg-slate-800/50 border border-slate-700 rounded-xl hover:bg-slate-700/50 transition-colors"
                  >
                    <IconComponent className="w-5 h-5 text-slate-400" />
                    <div className="text-left">
                      <p className="text-white font-medium">{option.title}</p>
                      <p className="text-xs text-slate-500">{option.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Demo Credentials */}
          <div className="mt-12 p-6 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
            <h3 className="text-lg font-semibold text-blue-400 mb-4 text-center">Demo Credentials</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="bg-slate-900/50 rounded-lg p-3">
                <p className="text-slate-400">Admin</p>
                <p className="text-white font-mono">admin / admin123</p>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-3">
                <p className="text-slate-400">Captain</p>
                <p className="text-white font-mono">captain / captain123</p>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-3">
                <p className="text-slate-400">Worker</p>
                <p className="text-white font-mono">worker / worker123</p>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-3">
                <p className="text-slate-400">Inspector</p>
                <p className="text-white font-mono">inspector / inspector123</p>
              </div>
            </div>
            <p className="text-center text-slate-500 text-xs mt-4">Fisher & Vessel Owner: Use OTP 1234</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default WildFisheryHome;
