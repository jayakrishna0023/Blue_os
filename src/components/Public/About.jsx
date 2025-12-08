import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Ship, Fish, Anchor, ShieldCheck, BarChart3, Globe, Waves } from 'lucide-react';

const About = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <ShieldCheck className="w-8 h-8 text-emerald-500" />,
      title: "Traceability & Compliance",
      description: "End-to-end tracking from catch to consumer, ensuring compliance with international maritime regulations and food safety standards."
    },
    {
      icon: <BarChart3 className="w-8 h-8 text-blue-500" />,
      title: "Real-time Analytics",
      description: "Advanced data visualization for catch logs, vessel performance, and supply chain efficiency to drive better decision making."
    },
    {
      icon: <Globe className="w-8 h-8 text-cyan-500" />,
      title: "Sustainable Practices",
      description: "Tools designed to monitor and maintain sustainable fishing limits, protecting marine ecosystems for future generations."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden font-sans selection:bg-blue-500/30 selection:text-blue-200 relative">
      
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-emerald-600/10 rounded-full blur-[120px]"></div>
      </div>

      {/* Hero Section */}
      <div className="relative pt-20 pb-32 px-6 z-10">
        <div className="max-w-7xl mx-auto">
          <button 
            onClick={() => navigate('/')}
            className="mb-12 flex items-center text-slate-400 hover:text-white transition-colors group bg-slate-900/50 px-4 py-2 rounded-full w-fit backdrop-blur-sm border border-slate-800 hover:border-slate-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </button>

          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center justify-center p-3 bg-blue-600/20 rounded-2xl mb-6 border border-blue-500/30 backdrop-blur-md shadow-lg shadow-blue-500/20">
                <Waves className="w-10 h-10 text-blue-400" />
            </div>
            <h1 className="text-5xl md:text-7xl font-black mb-8 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-slate-400">
              Revolutionizing <br/> Fisheries Management
            </h1>
            <p className="text-xl text-slate-400 leading-relaxed max-w-2xl mx-auto">
              BlueOS is a comprehensive digital ecosystem designed to modernize the global seafood industry through technology, transparency, and sustainability.
            </p>
          </div>
        </div>
      </div>

      {/* Sectors Section */}
      <div className="max-w-7xl mx-auto px-6 -mt-20 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Wild Fishery */}
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl hover:border-blue-500/30 transition-all hover:-translate-y-1 shadow-2xl">
                <div className="bg-blue-500/10 border border-blue-500/20 w-14 h-14 rounded-2xl flex items-center justify-center mb-6">
                    <Ship className="w-7 h-7 text-blue-400" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-white">Wild Fishery</h3>
                <p className="text-slate-400 leading-relaxed">
                    Digital logbooks for captains, automated catch reporting, and satellite-based vessel monitoring systems (VMS) for open ocean operations.
                </p>
            </div>

            {/* Aquaculture */}
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl hover:border-emerald-500/30 transition-all hover:-translate-y-1 shadow-2xl">
                <div className="bg-emerald-500/10 border border-emerald-500/20 w-14 h-14 rounded-2xl flex items-center justify-center mb-6">
                    <Fish className="w-7 h-7 text-emerald-400" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-white">Aquaculture</h3>
                <p className="text-slate-400 leading-relaxed">
                    IoT sensor integration for water quality monitoring, automated feeding schedules, and biomass estimation for inland farms.
                </p>
            </div>

            {/* Mariculture */}
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl hover:border-cyan-500/30 transition-all hover:-translate-y-1 shadow-2xl">
                <div className="bg-cyan-500/10 border border-cyan-500/20 w-14 h-14 rounded-2xl flex items-center justify-center mb-6">
                    <Anchor className="w-7 h-7 text-cyan-400" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-white">Mariculture</h3>
                <p className="text-slate-400 leading-relaxed">
                    Offshore cage management, environmental impact assessment, and marine spatial planning tools for coastal operations.
                </p>
            </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-32 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Why Choose BlueOS?</h2>
                <p className="text-slate-400">Built for the future of the blue economy.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                {features.map((feature, idx) => (
                    <div key={idx} className="text-center group">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-900/50 mb-6 group-hover:scale-110 transition-transform duration-300 border border-slate-800 group-hover:border-slate-700 shadow-lg">
                            {feature.icon}
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-white">{feature.title}</h3>
                        <p className="text-slate-400 leading-relaxed max-w-xs mx-auto">
                            {feature.description}
                        </p>
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-800 py-12 px-6 bg-slate-950 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
                <Waves className="w-6 h-6 text-blue-500" />
                <span className="font-bold text-xl tracking-tight text-white">BlueOS</span>
            </div>
            <p className="text-slate-500 text-sm">
                © 2025 BlueOS Integrated Fisheries Management System. All rights reserved.
            </p>
        </div>
      </div>
    </div>
  );
};

export default About;
