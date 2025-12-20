import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowDown, Database, Shield, Globe, Phone, ExternalLink, Server, Hexagon, 
  Ship, Fish, Anchor, Waves, ArrowRight, Menu, X 
} from 'lucide-react';

// --- Constants & Data ---
const WORLDS = [
  {
    id: 'wild',
    title: 'Wild Fishery',
    description: 'Manage catch logs, vessel tracking, and supply chain traceability for open sea fishing.',
    icon: <Ship className="w-12 h-12 text-blue-400" />,
    path: '/login',
    active: true,
    color: 'blue'
  },
  {
    id: 'aquaculture',
    title: 'Aquaculture',
    description: 'Monitor water quality, feed management, and growth tracking for inland fish farming.',
    icon: <Fish className="w-12 h-12 text-emerald-400" />,
    path: '/aquaculture',
    active: false,
    color: 'emerald'
  },
  {
    id: 'mariculture',
    title: 'Mariculture',
    description: 'Offshore cultivation management, cage monitoring, and marine ecosystem tracking.',
    icon: <Anchor className="w-12 h-12 text-cyan-400" />,
    path: '/mariculture',
    active: false,
    color: 'cyan'
  }
];

// --- Sub-Components ---

const Header = ({ onNavigate, onTraceClick }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-slate-900/80 backdrop-blur-md py-4 border-b border-white/5' : 'bg-transparent py-6'}`}>
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="bg-blue-600 p-2 rounded-lg">
            <Waves className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-wider">BlueOS</span>
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
            className="px-4 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-full font-bold text-sm hover:from-teal-500 hover:to-cyan-500 transition-all flex items-center gap-2 shadow-lg shadow-teal-900/30"
          >
            <Fish className="w-4 h-4" />
            Trace Fish
          </button>
          <button 
            onClick={() => onNavigate('world-selection')}
            className="px-5 py-2 bg-white text-slate-900 rounded-full font-bold text-sm hover:bg-blue-50 transition-colors"
          >
            Launch App
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
            className="flex items-center gap-2 text-teal-400 hover:text-teal-300 py-2 font-medium"
          >
            <Fish className="w-4 h-4" />
            Trace Your Seafood
          </button>
        </div>
      )}
    </header>
  );
};

const Footer = () => (
  <footer className="bg-slate-950 py-12 border-t border-slate-900 text-center">
    <div className="flex items-center justify-center gap-2 mb-4 opacity-50">
        <Waves className="w-6 h-6 text-blue-500" />
        <span className="text-white font-bold tracking-wider">BlueOS</span>
    </div>
    <p className="text-slate-600 text-sm">
      © 2025 BlueOS Integrated Fisheries Management System. All rights reserved.
    </p>
  </footer>
);

const WorldCard = ({ world, onSelect }) => (
  <div 
    className={`
      relative group rounded-3xl p-8 transition-all duration-500 border border-slate-800 bg-slate-900/50 hover:bg-slate-800
      ${world.active ? 'hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-900/20' : 'opacity-75'}
    `}
  >
    <div className={`mb-6 p-4 rounded-2xl inline-block bg-slate-950 border border-slate-800 group-hover:scale-110 transition-transform duration-500`}>
      {world.icon}
    </div>
    
    <h3 className="text-2xl font-bold mb-3 text-white group-hover:text-blue-400 transition-colors">
      {world.title}
    </h3>
    
    <p className="mb-8 leading-relaxed text-slate-400">
      {world.description}
    </p>

    <button
      onClick={() => world.active && onSelect(world)}
      disabled={!world.active}
      className={`
        w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all
        ${world.active 
          ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20' 
          : 'bg-slate-800 text-slate-600 cursor-not-allowed'}
      `}
    >
      {world.active ? 'Enter Portal' : 'Coming Soon'}
      {world.active && <ArrowRight className="w-5 h-5" />}
    </button>
  </div>
);

const HowItWorks = () => (
  <section id="how-it-works" className="py-32 px-6 bg-slate-950 relative z-10">
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-20">
        <h2 className="text-4xl font-bold text-white mb-6">How It Works</h2>
        <p className="text-slate-400 max-w-2xl mx-auto text-lg">
          A seamless flow of data from catch to consumer.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
        {/* Connecting Line (Desktop) */}
        <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-gradient-to-r from-blue-900 via-blue-500 to-blue-900 opacity-30"></div>

        {[
          { title: 'Capture / Harvest', desc: 'Captains and farmers log data via mobile app or IoT sensors.', icon: <Database /> },
          { title: 'Verification', desc: 'AI and Inspectors validate catch data against regulations.', icon: <Shield /> },
          { title: 'Market Access', desc: 'Traceable products reach global markets with QR passports.', icon: <Globe /> }
        ].map((step, i) => (
          <div key={i} className="relative z-10 flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-slate-900 border-4 border-slate-800 flex items-center justify-center mb-6 shadow-xl text-blue-400">
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

const LandingPage = () => {
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

  const handleSelectWorld = (world) => {
    if (world.path) {
      navigate(world.path);
    }
  };

  const handleTraceClick = () => {
    navigate('/public-trace');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 relative overflow-x-hidden font-sans selection:bg-blue-500/30 selection:text-blue-200">
      <Header onNavigate={handleNavigation} onTraceClick={handleTraceClick} />
      
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse-slow"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-teal-600/10 rounded-full blur-[120px]"></div>
          {/* Grid Pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      </div>

      {/* Hero Section */}
      <section className="relative z-10 pt-48 pb-32 px-6 text-center max-w-6xl mx-auto flex flex-col justify-center items-center min-h-screen lg:min-h-[900px]">
        
        <div className="mb-8 animate-fade-in-up">
            <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-slate-400 mb-6 tracking-tight leading-none drop-shadow-2xl">
              BlueOS
            </h1>
            <p className="text-2xl md:text-3xl text-slate-400 font-light max-w-3xl mx-auto leading-relaxed">
              The Operating System for the <span className="text-blue-400 font-medium">Blue Economy</span>.
            </p>
        </div>
        
        <p className="text-slate-500 text-lg max-w-2xl mx-auto mb-12 leading-relaxed animate-fade-in delay-100">
          A unified, enterprise-grade traceability platform connecting Wild Capture, Aquaculture, and Mariculture into a single immutable ledger.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center animate-fade-in delay-200 relative z-20">
            <button 
                onClick={() => handleNavigation('world-selection')}
                className="px-10 py-5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg shadow-[0_0_40px_-10px_rgba(37,99,235,0.5)] transition-all transform hover:-translate-y-1 hover:shadow-[0_0_60px_-15px_rgba(37,99,235,0.6)] flex items-center gap-3 group cursor-pointer"
            >
                Launch Platform
                <ArrowDown size={20} className="group-hover:translate-y-1 transition-transform" />
            </button>
            <button 
                onClick={() => handleNavigation('about')}
                className="px-10 py-5 rounded-2xl bg-white/5 hover:bg-white/10 text-white border border-white/10 font-bold text-lg backdrop-blur-md transition-all flex items-center gap-3 cursor-pointer"
            >
                Learn More
            </button>
        </div>

        {/* Trace Your Seafood CTA */}
        <div className="mt-12 animate-fade-in delay-300 relative z-20">
            <button 
                onClick={() => navigate('/public-trace')}
                className="group relative px-8 py-4 rounded-2xl bg-gradient-to-r from-teal-600 via-cyan-500 to-blue-600 hover:from-teal-500 hover:via-cyan-400 hover:to-blue-500 text-white font-bold text-base shadow-[0_0_50px_-12px_rgba(6,182,212,0.6)] transition-all transform hover:-translate-y-1 hover:shadow-[0_0_70px_-15px_rgba(6,182,212,0.7)] flex items-center gap-3 cursor-pointer border border-cyan-400/30 overflow-hidden"
            >
                {/* Animated Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                
                {/* Fish Icon with Animation */}
                <div className="relative bg-white/20 p-2 rounded-lg group-hover:scale-110 transition-transform">
                    <Fish size={20} className="text-white" />
                </div>
                
                <div className="relative text-left">
                    <span className="block text-xs uppercase tracking-widest text-cyan-200 font-medium">Consumer Portal</span>
                    <span className="block text-lg">Trace Your Seafood</span>
                </div>
                
                <ArrowRight size={20} className="relative ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
            <p className="mt-3 text-slate-500 text-sm">Scan QR code • View fish origin • Verify quality</p>
        </div>

        {/* Hero Stats */}
        <div className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-16 border-t border-white/5 pt-12 animate-fade-in delay-300 w-full">
            {[
                { label: 'Traceability', val: '100%' },
                { label: 'Active Users', val: '2.5k+' },
                { label: 'Data Points', val: '10M+' },
                { label: 'Uptime', val: '99.9%' },
            ].map((stat, i) => (
                <div key={i}>
                    <div className="text-3xl md:text-4xl font-bold text-white mb-1">{stat.val}</div>
                    <div className="text-xs font-bold text-blue-500 uppercase tracking-widest">{stat.label}</div>
                </div>
            ))}
        </div>
      </section>

      {/* World Cards Section */}
      <section id="world-selection" className="relative z-10 py-32 px-6 bg-slate-900/80 border-y border-slate-800 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Select Origin</h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">
              Access specific workflows tailored to your operational environment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {WORLDS.map((world) => (
              <WorldCard 
                key={world.id} 
                world={world} 
                onSelect={handleSelectWorld} 
              />
            ))}
          </div>
        </div>
      </section>

      {/* Consumer Traceability Section */}
      <section className="relative z-10 py-24 px-6 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 md:p-16 border border-slate-700/50 overflow-hidden shadow-2xl">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-30">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#14B8A6_1px,transparent_1px),linear-gradient(to_bottom,#14B8A6_1px,transparent_1px)] bg-[size:60px_60px] opacity-10"></div>
              <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
              <div className="absolute bottom-0 left-0 w-72 h-72 bg-cyan-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
            </div>
            
            <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left Content */}
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 text-teal-400 text-sm font-bold uppercase tracking-widest mb-6 border border-teal-500/30">
                  <Fish size={16} /> For Consumers
                </div>
                <h2 className="text-3xl md:text-5xl font-black text-white mb-6 leading-tight">
                  Know Where Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-400">Fish</span> Comes From
                </h2>
                <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                  Every fish tells a story. Scan the QR code on your seafood to trace its complete journey — from the ocean where it was caught, to the vessel that harvested it, and the quality inspection it passed.
                </p>
                
                <div className="flex flex-wrap gap-6 mb-10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center">
                      <Ship size={20} className="text-teal-400" />
                    </div>
                    <span className="text-slate-300 font-medium">Vessel Details</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                      <Anchor size={20} className="text-cyan-400" />
                    </div>
                    <span className="text-slate-300 font-medium">Catch Location</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                      <Shield size={20} className="text-blue-400" />
                    </div>
                    <span className="text-slate-300 font-medium">Quality Grade</span>
                  </div>
                </div>

                <button 
                  onClick={() => navigate('/public-trace')}
                  className="group px-8 py-5 rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-bold text-lg shadow-[0_0_50px_-15px_rgba(20,184,166,0.5)] transition-all transform hover:-translate-y-1 hover:shadow-[0_0_60px_-15px_rgba(20,184,166,0.7)] flex items-center gap-3"
                >
                  <Fish size={24} />
                  Trace Your Seafood Now
                  <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
                </button>
              </div>
              
              {/* Right Visual - QR Animation */}
              <div className="relative flex justify-center">
                <div className="relative">
                  {/* Phone Frame */}
                  <div className="w-64 h-[480px] bg-slate-900 rounded-[3rem] border-4 border-slate-700 shadow-2xl relative overflow-hidden">
                    {/* Screen Content */}
                    <div className="absolute inset-4 bg-gradient-to-b from-slate-800 to-slate-900 rounded-[2rem] overflow-hidden">
                      {/* Header */}
                      <div className="bg-slate-800 px-4 py-3 flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-lg flex items-center justify-center">
                          <Fish size={16} className="text-white" />
                        </div>
                        <span className="font-bold text-white text-sm">FishTrace</span>
                      </div>
                      
                      {/* QR Scanner Area */}
                      <div className="p-4">
                        <div className="relative bg-slate-700/50 rounded-2xl p-6 border border-slate-600/50 aspect-square flex items-center justify-center">
                          {/* Scanning Animation */}
                          <div className="absolute inset-4 border-2 border-teal-500/50 rounded-xl">
                            <div className="absolute inset-0 overflow-hidden rounded-xl">
                              <div className="h-1 bg-gradient-to-r from-transparent via-teal-400 to-transparent animate-scan"></div>
                            </div>
                          </div>
                          {/* QR Icon */}
                          <div className="relative z-10 w-24 h-24 bg-white rounded-xl p-3 shadow-lg">
                            <div className="w-full h-full grid grid-cols-3 gap-1">
                              {[...Array(9)].map((_, i) => (
                                <div key={i} className={`${[0,2,3,4,6,8].includes(i) ? 'bg-slate-900' : 'bg-white'} rounded-sm`}></div>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        {/* Result Preview */}
                        <div className="mt-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 flex items-center gap-3">
                          <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-emerald-400 font-bold text-sm">Verified Origin</p>
                            <p className="text-slate-400 text-xs">Grade A • Fresh • 2.5 kg</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Notch */}
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-6 bg-slate-950 rounded-full"></div>
                  </div>
                  
                  {/* Floating Badges */}
                  <div className="absolute -right-8 top-20 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 shadow-lg animate-float">
                    <div className="flex items-center gap-2">
                      <Ship size={16} className="text-blue-400" />
                      <span className="text-xs text-white font-medium">Vessel Verified</span>
                    </div>
                  </div>
                  <div className="absolute -left-12 bottom-32 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 shadow-lg animate-float-delayed">
                    <div className="flex items-center gap-2">
                      <Shield size={16} className="text-emerald-400" />
                      <span className="text-xs text-white font-medium">Quality Checked</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <style jsx>{`
          @keyframes scan {
            0% { transform: translateY(0); }
            100% { transform: translateY(calc(100% + 200px)); }
          }
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }
          @keyframes float-delayed {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-8px); }
          }
          .animate-scan {
            animation: scan 2s ease-in-out infinite;
          }
          .animate-float {
            animation: float 3s ease-in-out infinite;
          }
          .animate-float-delayed {
            animation: float-delayed 3s ease-in-out infinite 0.5s;
          }
        `}</style>
      </section>

      {/* About Section */}
      <section id="about" className="relative z-10 py-32 px-6">
          <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                  <div>
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold uppercase tracking-widest mb-6 border border-blue-500/20">
                          <Globe size={12}/> Mission
                      </div>
                      <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                          Solving Fragmentation in the <span className="text-blue-500">Blue Economy</span>.
                      </h2>
                      <p className="text-slate-400 text-lg leading-relaxed mb-8">
                          The seafood supply chain is disconnected. Wild Capture vessels, Aquaculture ponds, and Mariculture farms operate in silos using disparate data standards.
                      </p>
                      <p className="text-slate-400 text-lg leading-relaxed mb-8">
                          BlueOS unifies these origins under a single operating system. By standardizing identity (QR), data events (Catch/Harvest), and validation (QC), we enable seamless interoperability from ocean to fork.
                      </p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <div className="flex gap-4">
                              <div className="p-3 bg-slate-800 rounded-lg text-blue-400 h-fit"><Database size={24}/></div>
                              <div>
                                  <h4 className="text-white font-bold mb-1">Unified Data</h4>
                                  <p className="text-sm text-slate-500">One standard for all marine data.</p>
                              </div>
                          </div>
                          <div className="flex gap-4">
                              <div className="p-3 bg-slate-800 rounded-lg text-emerald-400 h-fit"><Shield size={24}/></div>
                              <div>
                                  <h4 className="text-white font-bold mb-1">Immutable Trust</h4>
                                  <p className="text-sm text-slate-500">Ledger-backed traceability.</p>
                              </div>
                          </div>
                      </div>
                  </div>
                  <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 to-teal-500 rounded-3xl blur-2xl opacity-20"></div>
                      <div className="relative bg-slate-900 border border-slate-700 p-8 rounded-3xl shadow-2xl">
                          <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
                              <h3 className="text-lg font-bold text-white flex items-center gap-2"><Server size={18} className="text-blue-500"/> System Architecture</h3>
                              <div className="flex gap-2">
                                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                              </div>
                          </div>
                          <div className="space-y-4 font-mono text-sm">
                              <div className="flex items-center justify-between text-slate-500">
                                  <span>Core.init()</span>
                                  <span className="text-green-500">OK</span>
                              </div>
                              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                                  <div className="text-blue-400 mb-2">// Origin Modules</div>
                                  <div className="pl-4 border-l border-slate-800 space-y-2">
                                      <div className="flex justify-between">
                                          <span className="text-slate-300">module.load(<span className="text-white">'WILD'</span>)</span>
                                          <span className="text-xs text-slate-600">v2.4.0</span>
                                      </div>
                                      <div className="flex justify-between">
                                          <span className="text-slate-300">module.load(<span className="text-white">'AQUA'</span>)</span>
                                          <span className="text-xs text-slate-600">v1.1.2</span>
                                      </div>
                                      <div className="flex justify-between">
                                          <span className="text-slate-300">module.load(<span className="text-white">'MARI'</span>)</span>
                                          <span className="text-xs text-slate-600">v1.0.5</span>
                                      </div>
                                  </div>
                              </div>
                              <div className="p-4 bg-blue-900/10 rounded-xl border border-blue-500/20 flex items-center justify-between">
                                  <span className="text-blue-200">GlobalTrace.connect()</span>
                                  <span className="flex items-center gap-2 text-blue-400 text-xs font-bold animate-pulse"><div className="w-2 h-2 bg-blue-400 rounded-full"></div> LIVE</span>
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
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-600 text-white mb-8 shadow-lg shadow-blue-500/40">
                  <Phone size={32} />
              </div>
              <h2 className="text-4xl font-bold text-white mb-4">Ready to Deploy?</h2>
              <p className="text-slate-400 text-lg mb-12">
                  Contact our lead engineer for enterprise deployment, API access, or hardware integration support.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                  <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 hover:border-blue-500 transition-colors group">
                      <div className="flex items-start justify-between mb-8">
                          <div className="p-3 bg-slate-900 rounded-lg text-slate-300 group-hover:text-blue-400 transition-colors">
                              <UserContactIcon />
                          </div>
                          <ExternalLink className="text-slate-600 group-hover:text-white transition-colors" size={20}/>
                      </div>
                      <div className="text-slate-500 font-bold uppercase text-xs tracking-widest mb-1">Lead Contact</div>
                      <div className="text-2xl font-bold text-white mb-1">Gowtham</div>
                      <div className="text-blue-400 text-sm">Product Architect</div>
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

export default LandingPage;
