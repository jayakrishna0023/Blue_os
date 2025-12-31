import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowDown, Database, Shield, Globe, Phone, ExternalLink, Server,
  Fish, Waves, ArrowRight, Menu, X, Leaf, ClipboardCheck, Package, Droplets, Thermometer, FlaskConical
} from 'lucide-react';

// --- Constants & Data ---
const ROLES = [
  {
    id: 'farmer',
    title: 'Farmer',
    description: 'Manage ponds, water quality, and harvest schedules for freshwater fish farming.',
    icon: <Leaf className="w-10 h-10 text-emerald-400" />,
    path: '/aquaculture/login/farmer',
    color: 'emerald'
  },
  {
    id: 'inspector',
    title: 'Inspector',
    description: 'Verify farm conditions, certify quality standards, and audit compliance.',
    icon: <ClipboardCheck className="w-10 h-10 text-blue-400" />,
    path: '/aquaculture/login/inspector',
    color: 'blue'
  },
  {
    id: 'packer',
    title: 'Packer',
    description: 'Manage crate labeling, cold chain, and distribution logistics.',
    icon: <Package className="w-10 h-10 text-orange-400" />,
    path: '/aquaculture/login/packer',
    color: 'orange'
  }
];

// --- Sub-Components ---

const Header = ({ onNavigate, onTraceClick }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-slate-900/80 backdrop-blur-md py-4 border-b border-white/5' : 'bg-transparent py-6'}`}>
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <div className="bg-emerald-600 p-2 rounded-lg">
            <Fish className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-wider">BlueOS</span>
          <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">Aquaculture</span>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          {['About', 'How it Works', 'Contact'].map((item) => (
            <button 
              key={item}
              onClick={() => onNavigate(item.toLowerCase().replace(/\s+/g, '-'))}
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors uppercase tracking-widest"
            >
              {item}
            </button>
          ))}
          <button 
            onClick={onTraceClick}
            className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-full font-bold text-sm hover:from-teal-500 hover:to-emerald-500 transition-all flex items-center gap-2 shadow-lg shadow-emerald-900/30"
          >
            <Fish className="w-4 h-4" />
            Trace Product
          </button>
          <button 
            onClick={() => onNavigate('role-selection')}
            className="px-5 py-2 bg-white text-slate-900 rounded-full font-bold text-sm hover:bg-emerald-50 transition-colors"
          >
            Login
          </button>
        </nav>

        {/* Mobile Menu Toggle */}
        <button className="md:hidden text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>
      
      {/* Mobile Nav */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-slate-900 border-b border-slate-800 p-6 flex flex-col gap-4">
           {['About', 'How it Works', 'Contact'].map((item) => (
            <button 
              key={item}
              onClick={() => {
                onNavigate(item.toLowerCase().replace(/\s+/g, '-'));
                setMobileMenuOpen(false);
              }}
              className="text-left text-slate-300 hover:text-white py-2"
            >
              {item}
            </button>
          ))}
          <button 
            onClick={() => {
              onTraceClick();
              setMobileMenuOpen(false);
            }}
            className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 py-2 font-medium"
          >
            <Fish className="w-4 h-4" />
            Trace Your Product
          </button>
        </div>
      )}
    </header>
  );
};

const Footer = () => (
  <footer className="bg-slate-950 py-12 border-t border-slate-900 text-center">
    <div className="flex items-center justify-center gap-2 mb-4 opacity-50">
        <Fish className="w-6 h-6 text-emerald-500" />
        <span className="text-white font-bold tracking-wider">BlueOS Aquaculture</span>
    </div>
    <p className="text-slate-600 text-sm">
      © 2025 BlueOS Integrated Fisheries Management System. All rights reserved.
    </p>
  </footer>
);

const RoleCard = ({ role, onSelect }) => (
  <div 
    className={`
      relative group rounded-3xl p-8 transition-all duration-500 border border-slate-800 bg-slate-900/50 hover:bg-slate-800
      hover:border-${role.color}-500/50 hover:shadow-2xl hover:shadow-${role.color}-900/20
    `}
  >
    <div className={`mb-6 p-4 rounded-2xl inline-block bg-slate-950 border border-slate-800 group-hover:scale-110 transition-transform duration-500`}>
      {role.icon}
    </div>
    
    <h3 className="text-2xl font-bold mb-3 text-white group-hover:text-emerald-400 transition-colors">
      {role.title}
    </h3>
    
    <p className="mb-8 leading-relaxed text-slate-400">
      {role.description}
    </p>

    <button
      onClick={() => onSelect(role)}
      className={`
        w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all
        bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20
      `}
    >
      Login as {role.title}
      <ArrowRight className="w-5 h-5" />
    </button>
  </div>
);

const HowItWorks = () => (
  <section id="how-it-works" className="py-32 px-6 bg-slate-950 relative z-10">
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-20">
        <h2 className="text-4xl font-bold text-white mb-6">How Aquaculture Works</h2>
        <p className="text-slate-400 max-w-2xl mx-auto text-lg">
          From pond to plate — full traceability for farmed fish.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
        {/* Connecting Line (Desktop) */}
        <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-gradient-to-r from-emerald-900 via-emerald-500 to-emerald-900 opacity-30"></div>

        {[
          { title: 'Pond Setup', desc: 'Register ponds, set species and stocking density.', icon: <Droplets /> },
          { title: 'Daily Monitoring', desc: 'Log water quality, feeding, and growth metrics.', icon: <Thermometer /> },
          { title: 'Quality Check', desc: 'Inspectors verify conditions and certify batches.', icon: <ClipboardCheck /> },
          { title: 'Harvest & Pack', desc: 'Traceable crates reach markets with QR passports.', icon: <Package /> }
        ].map((step, i) => (
          <div key={i} className="relative z-10 flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-slate-900 border-4 border-slate-800 flex items-center justify-center mb-6 shadow-xl text-emerald-400">
              {step.icon}
            </div>
            <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
            <p className="text-slate-400">{step.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// --- Main Component ---

const AquacultureHome = () => {
  const navigate = useNavigate();
  
  const handleNavigation = (target) => {
    const element = document.getElementById(target);
    if (element) {
        const headerOffset = 80;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        window.scrollTo({
            top: offsetPosition,
            behavior: "smooth"
        });
    }
  };

  const handleSelectRole = (role) => {
    if (role.path) {
      navigate(role.path);
    }
  };

  const handleTraceClick = () => {
    navigate('/public-trace');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 relative overflow-x-hidden font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      <Header onNavigate={handleNavigation} onTraceClick={handleTraceClick} />
      
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-600/20 rounded-full blur-[120px] animate-pulse-slow"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-teal-600/10 rounded-full blur-[120px]"></div>
          {/* Grid Pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      </div>

      {/* Hero Section */}
      <section className="relative z-10 pt-48 pb-32 px-6 text-center max-w-6xl mx-auto flex flex-col justify-center items-center min-h-screen lg:min-h-[900px]">
        
        <div className="mb-8 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-400 text-sm font-bold uppercase tracking-widest mb-6 border border-emerald-500/30">
              <Fish size={16} /> Aquaculture Module
            </div>
            <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-slate-400 mb-6 tracking-tight leading-none drop-shadow-2xl">
              Aquaculture
            </h1>
            <p className="text-xl text-slate-500 mb-2">நீர்வாழ் வளர்ப்பு</p>
            <p className="text-2xl md:text-3xl text-slate-400 font-light max-w-3xl mx-auto leading-relaxed">
              Complete Management for <span className="text-emerald-400 font-medium">Freshwater Fish Farming</span>
            </p>
        </div>
        
        <p className="text-slate-500 text-lg max-w-2xl mx-auto mb-12 leading-relaxed animate-fade-in delay-100">
          Monitor pond health, track growth cycles, manage feeding schedules, and ensure quality standards for sustainable inland aquaculture operations.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center animate-fade-in delay-200 relative z-20">
            <button 
                onClick={() => handleNavigation('role-selection')}
                className="px-10 py-5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-lg shadow-[0_0_40px_-10px_rgba(16,185,129,0.5)] transition-all transform hover:-translate-y-1 hover:shadow-[0_0_60px_-15px_rgba(16,185,129,0.6)] flex items-center gap-3 group cursor-pointer"
            >
                Get Started
                <ArrowDown size={20} className="group-hover:translate-y-1 transition-transform" />
            </button>
            <button 
                onClick={() => navigate('/')}
                className="px-10 py-5 rounded-2xl bg-white/5 hover:bg-white/10 text-white border border-white/10 font-bold text-lg backdrop-blur-md transition-all flex items-center gap-3 cursor-pointer"
            >
                Back to BlueOS
            </button>
        </div>

        {/* Hero Stats */}
        <div className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-16 border-t border-white/5 pt-12 animate-fade-in delay-300 w-full">
            {[
                { label: 'Active Farms', val: '500+' },
                { label: 'Ponds Managed', val: '2.5k+' },
                { label: 'Fish Harvested', val: '10M+' },
                { label: 'Quality Rate', val: '98.5%' },
            ].map((stat, i) => (
                <div key={i}>
                    <div className="text-3xl md:text-4xl font-bold text-white mb-1">{stat.val}</div>
                    <div className="text-xs font-bold text-emerald-500 uppercase tracking-widest">{stat.label}</div>
                </div>
            ))}
        </div>
      </section>

      {/* Role Cards Section */}
      <section id="role-selection" className="relative z-10 py-32 px-6 bg-slate-900/80 border-y border-slate-800 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Select Your Role</h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">
              Access your personalized dashboard based on your operational role.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {ROLES.map((role) => (
              <RoleCard 
                key={role.id} 
                role={role} 
                onSelect={handleSelectRole} 
              />
            ))}
          </div>

          {/* Demo Credentials Info */}
          <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-8 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-emerald-600/20 rounded-lg">
                <Shield className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-white">Demo Login Credentials</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
                <div className="flex items-center gap-2 mb-4">
                  <Leaf className="w-5 h-5 text-emerald-400" />
                  <h4 className="font-bold text-white">Farmer</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-slate-400">
                    <span className="font-medium">Username:</span>
                    <code className="text-emerald-400">aqua_farmer</code>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span className="font-medium">Password:</span>
                    <code className="text-emerald-400">farmer123</code>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
                <div className="flex items-center gap-2 mb-4">
                  <ClipboardCheck className="w-5 h-5 text-blue-400" />
                  <h4 className="font-bold text-white">Inspector</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-slate-400">
                    <span className="font-medium">Username:</span>
                    <code className="text-blue-400">aqua_inspector</code>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span className="font-medium">Password:</span>
                    <code className="text-blue-400">inspector123</code>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
                <div className="flex items-center gap-2 mb-4">
                  <Package className="w-5 h-5 text-orange-400" />
                  <h4 className="font-bold text-white">Packer</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-slate-400">
                    <span className="font-medium">Username:</span>
                    <code className="text-orange-400">aqua_packer</code>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span className="font-medium">Password:</span>
                    <code className="text-orange-400">packer123</code>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-center text-slate-500 text-sm mt-6">
              ⚠️ These are demo credentials for testing only. Use them to explore the module.
            </p>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="relative z-10 py-32 px-6">
          <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                  <div>
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-6 border border-emerald-500/20">
                          <Fish size={12}/> About Module
                      </div>
                      <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                          Smart Management for <span className="text-emerald-500">Pond Farming</span>
                      </h2>
                      <p className="text-slate-400 text-lg leading-relaxed mb-8">
                          Aquaculture is revolutionizing freshwater fish farming with data-driven insights. Monitor water quality parameters, optimize feeding schedules, and track growth patterns in real-time.
                      </p>
                      <p className="text-slate-400 text-lg leading-relaxed mb-8">
                          Our platform connects farmers, inspectors, and packers in a unified ecosystem, ensuring full traceability from pond stocking to market delivery.
                      </p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <div className="flex gap-4">
                              <div className="p-3 bg-slate-800 rounded-lg text-emerald-400 h-fit"><Thermometer size={24}/></div>
                              <div>
                                  <h4 className="text-white font-bold mb-1">IoT Monitoring</h4>
                                  <p className="text-sm text-slate-500">Real-time water quality sensors.</p>
                              </div>
                          </div>
                          <div className="flex gap-4">
                              <div className="p-3 bg-slate-800 rounded-lg text-blue-400 h-fit"><FlaskConical size={24}/></div>
                              <div>
                                  <h4 className="text-white font-bold mb-1">Lab Integration</h4>
                                  <p className="text-sm text-slate-500">Automated test result capture.</p>
                              </div>
                          </div>
                      </div>
                  </div>
                  <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-3xl blur-2xl opacity-20"></div>
                      <div className="relative bg-slate-900 border border-slate-700 p-8 rounded-3xl shadow-2xl">
                          <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
                              <h3 className="text-lg font-bold text-white flex items-center gap-2"><Server size={18} className="text-emerald-500"/> Farm Dashboard</h3>
                              <div className="flex gap-2">
                                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                              </div>
                          </div>
                          <div className="space-y-4 font-mono text-sm">
                              <div className="flex items-center justify-between text-slate-500">
                                  <span>AquaSystem.init()</span>
                                  <span className="text-green-500">CONNECTED</span>
                              </div>
                              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                                  <div className="text-emerald-400 mb-2">// Pond Status</div>
                                  <div className="pl-4 border-l border-slate-800 space-y-2">
                                      <div className="flex justify-between">
                                          <span className="text-slate-300">pH Level</span>
                                          <span className="text-green-400">7.2 ✓</span>
                                      </div>
                                      <div className="flex justify-between">
                                          <span className="text-slate-300">Dissolved Oxygen</span>
                                          <span className="text-green-400">6.8 mg/L</span>
                                      </div>
                                      <div className="flex justify-between">
                                          <span className="text-slate-300">Temperature</span>
                                          <span className="text-blue-400">28°C</span>
                                      </div>
                                  </div>
                              </div>
                              <div className="p-4 bg-emerald-900/10 rounded-xl border border-emerald-500/20 flex items-center justify-between">
                                  <span className="text-emerald-200">HarvestTrack.ready()</span>
                                  <span className="flex items-center gap-2 text-emerald-400 text-xs font-bold animate-pulse"><div className="w-2 h-2 bg-emerald-400 rounded-full"></div> LIVE</span>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </section>

      {/* How It Works */}
      <HowItWorks />

      {/* Contact Section */}
      <section id="contact" className="relative z-10 py-32 px-6 bg-slate-900 border-t border-slate-800">
          <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-600 text-white mb-8 shadow-lg shadow-emerald-500/40">
                  <Phone size={32} />
              </div>
              <h2 className="text-4xl font-bold text-white mb-4">Need Help?</h2>
              <p className="text-slate-400 text-lg mb-12">
                  Contact our support team for onboarding, training, or technical assistance.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                  <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 hover:border-emerald-500 transition-colors group">
                      <div className="flex items-start justify-between mb-8">
                          <div className="p-3 bg-slate-900 rounded-lg text-slate-300 group-hover:text-emerald-400 transition-colors">
                              <UserContactIcon />
                          </div>
                          <ExternalLink className="text-slate-600 group-hover:text-white transition-colors" size={20}/>
                      </div>
                      <div className="text-slate-500 font-bold uppercase text-xs tracking-widest mb-1">Lead Contact</div>
                      <div className="text-2xl font-bold text-white mb-1">Gowtham</div>
                      <div className="text-emerald-400 text-sm">Product Architect</div>
                  </div>

                  <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 hover:border-green-500 transition-colors group">
                      <div className="flex items-start justify-between mb-8">
                          <div className="p-3 bg-slate-900 rounded-lg text-slate-300 group-hover:text-green-400 transition-colors">
                              <Phone size={24} />
                          </div>
                          <div className="px-2 py-1 bg-green-900/30 text-green-400 text-xs font-bold rounded">WHATSAPP</div>
                      </div>
                      <div className="text-slate-500 font-bold uppercase text-xs tracking-widest mb-1">Direct Line</div>
                      <div className="text-2xl font-bold text-white mb-1">+91 6374 484 558</div>
                      <div className="text-green-500 text-sm">Available 24/7</div>
                  </div>
              </div>
          </div>
      </section>

      <Footer />
    </div>
  );
};

// Helper Icon
const UserContactIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
    </svg>
);

export default AquacultureHome;
