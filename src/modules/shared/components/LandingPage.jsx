import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Fish, Waves, Anchor, Shell, ArrowRight, Globe, Shield, BarChart3, Leaf } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import LanguageToggle from './Shared/LanguageToggle';

const LandingPage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const modules = [
    {
      id: 'wild-fishery',
      title: 'Wild Fishery',
      titleTamil: 'காட்டு மீன்பிடி',
      description: 'Track and trace wild-caught seafood from ocean to plate',
      descriptionTamil: 'கடலில் இருந்து தட்டு வரை காட்டு பிடிக்கப்பட்ட கடல் உணவை கண்காணிக்கவும்',
      icon: Fish,
      color: 'from-blue-600 to-cyan-500',
      bgColor: 'bg-blue-600/20',
      borderColor: 'border-blue-500/30',
      path: '/wild-fishery',
      features: ['Vessel Tracking', 'Trip Management', 'Catch Logging', 'Quality Inspection']
    },
    {
      id: 'aquaculture',
      title: 'Aquaculture',
      titleTamil: 'நீர்வாழ் வளர்ப்பு',
      description: 'Manage freshwater and pond-based fish farming operations',
      descriptionTamil: 'நன்னீர் மற்றும் குளம் அடிப்படையிலான மீன் வளர்ப்பை நிர்வகிக்கவும்',
      icon: Waves,
      color: 'from-emerald-600 to-teal-500',
      bgColor: 'bg-emerald-600/20',
      borderColor: 'border-emerald-500/30',
      path: '/aquaculture',
      features: ['Farm Registry', 'Pond Management', 'Harvest Tracking', 'Water Quality']
    },
    {
      id: 'mariculture',
      title: 'Mariculture',
      titleTamil: 'கடல் வளர்ப்பு',
      description: 'Ocean-based farming including seaweed and sea cage operations',
      descriptionTamil: 'கடல்பாசி மற்றும் கடல் கூண்டு வளர்ப்பு உட்பட கடல் சார்ந்த விவசாயம்',
      icon: Shell,
      color: 'from-purple-600 to-pink-500',
      bgColor: 'bg-purple-600/20',
      borderColor: 'border-purple-500/30',
      path: '/mariculture',
      features: ['Raft/Longline Units', 'Seaweed Farming', 'Sea Cage Management', 'Harvest Logging']
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan-600/10 rounded-full blur-[120px]"></div>
        <div className="absolute top-[40%] right-[20%] w-[30%] h-[30%] bg-emerald-600/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[30%] left-[10%] w-[25%] h-[25%] bg-purple-600/10 rounded-full blur-[80px]"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl">
              <Anchor className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">BlueOS</h1>
              <p className="text-xs text-slate-400">Seafood Traceability Platform</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <LanguageToggle />
            <button
              onClick={() => navigate('/about')}
              className="text-slate-400 hover:text-white transition-colors"
            >
              About
            </button>
            <button
              onClick={() => navigate('/public-trace')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
            >
              Trace Product
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 px-6 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full mb-6">
            <Globe className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-blue-300">India's First Unified Seafood Traceability System</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Complete Traceability for
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent"> Sustainable Seafood</span>
          </h2>
          <p className="text-xl text-slate-400 mb-8">
            From ocean to plate, from pond to fork. Track every step of your seafood journey.
          </p>
        </div>
      </section>

      {/* Module Cards */}
      <section className="relative z-10 px-6 pb-20">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-2xl font-bold text-white text-center mb-12">Select Your Module</h3>
          
          <div className="grid md:grid-cols-3 gap-8">
            {modules.map((module) => {
              const IconComponent = module.icon;
              return (
                <div
                  key={module.id}
                  onClick={() => navigate(module.path)}
                  className={`group relative ${module.bgColor} ${module.borderColor} border rounded-3xl p-8 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-${module.id === 'wild-fishery' ? 'blue' : module.id === 'aquaculture' ? 'emerald' : 'purple'}-500/20`}
                >
                  {/* Glow Effect */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${module.color} opacity-0 group-hover:opacity-10 rounded-3xl transition-opacity`}></div>
                  
                  {/* Icon */}
                  <div className={`inline-flex p-4 bg-gradient-to-br ${module.color} rounded-2xl mb-6`}>
                    <IconComponent className="w-10 h-10 text-white" />
                  </div>
                  
                  {/* Content */}
                  <h4 className="text-2xl font-bold text-white mb-2">{module.title}</h4>
                  <p className="text-sm text-slate-500 mb-3">{module.titleTamil}</p>
                  <p className="text-slate-400 mb-6">{module.description}</p>
                  
                  {/* Features */}
                  <div className="space-y-2 mb-6">
                    {module.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-slate-300">
                        <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${module.color}`}></div>
                        {feature}
                      </div>
                    ))}
                  </div>
                  
                  {/* CTA */}
                  <div className="flex items-center gap-2 text-white font-medium group-hover:gap-4 transition-all">
                    Enter Module
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 px-6 py-20 border-t border-slate-800">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="p-6">
              <div className="inline-flex p-3 bg-blue-500/10 rounded-xl mb-4">
                <Shield className="w-8 h-8 text-blue-400" />
              </div>
              <h4 className="text-xl font-bold text-white mb-2">100% Traceable</h4>
              <p className="text-slate-400">Every product tracked from source to consumer with blockchain-ready data</p>
            </div>
            <div className="p-6">
              <div className="inline-flex p-3 bg-emerald-500/10 rounded-xl mb-4">
                <BarChart3 className="w-8 h-8 text-emerald-400" />
              </div>
              <h4 className="text-xl font-bold text-white mb-2">Real-time Analytics</h4>
              <p className="text-slate-400">Live dashboards and insights for better decision making</p>
            </div>
            <div className="p-6">
              <div className="inline-flex p-3 bg-purple-500/10 rounded-xl mb-4">
                <Leaf className="w-8 h-8 text-purple-400" />
              </div>
              <h4 className="text-xl font-bold text-white mb-2">Sustainable Practices</h4>
              <p className="text-slate-400">Promote and verify sustainable fishing and farming methods</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto text-center text-slate-500 text-sm">
          <p>© 2025 BlueOS - Seafood Traceability Platform. Built for sustainable oceans.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
