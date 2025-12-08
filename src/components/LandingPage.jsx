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

const Header = ({ onNavigate }) => {
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
        <nav className="hidden md:flex items-center gap-8">
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

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 relative overflow-x-hidden font-sans selection:bg-blue-500/30 selection:text-blue-200">
      <Header onNavigate={handleNavigation} />
      
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
