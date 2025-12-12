import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, mainAPI } from '../../services/api';
import { getCurrentUser } from '../../services/utils';
import { Ship, Fish, Package, FileText, LogOut, Menu, X } from 'lucide-react';
import TripRegistration from './TripRegistration';
import SpeciesEntry from './SpeciesEntry';
import TripHistory from './TripHistory';
import TripSummary from './TripSummary';

const CaptainDashboard = () => {
  const [activeTab, setActiveTab] = useState('trip');
  const [currentTrip, setCurrentTrip] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const user = getCurrentUser();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if there's an active trip in local storage or fetch from API
    const savedTrip = localStorage.getItem('currentTrip');
    if (savedTrip) {
      setCurrentTrip(JSON.parse(savedTrip));
      setActiveTab('species'); // Default to species if trip exists
    }
  }, []);

  const handleLogout = () => {
    authAPI.logout();
  };

  const handleTripCreated = (tripData) => {
    setCurrentTrip(tripData);
    localStorage.setItem('currentTrip', JSON.stringify(tripData));
    setActiveTab('species');
  };

  const handleTripCompleted = () => {
    setCurrentTrip(null);
    localStorage.removeItem('currentTrip');
    setActiveTab('trip');
  };

  const tabs = [
    { id: 'trip', label: 'Trip Details', icon: Ship },
    { id: 'species', label: 'Catch Log', icon: Fish, disabled: !currentTrip },
    { id: 'history', label: 'Trip History', icon: FileText },
    { id: 'summary', label: 'Summary', icon: FileText, disabled: !currentTrip },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="bg-ocean-600 p-2 rounded-lg">
                <Ship className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Captain's Log</h1>
                <p className="text-xs text-slate-500">Welcome, {user?.full_name || 'Captain'}</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => !tab.disabled && setActiveTab(tab.id)}
                  disabled={tab.disabled}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                    ${activeTab === tab.id 
                      ? 'bg-ocean-50 text-ocean-700 ring-1 ring-ocean-200' 
                      : tab.disabled 
                        ? 'text-slate-300 cursor-not-allowed' 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                  `}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <button 
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
              
              {/* Mobile Menu Button */}
              <button 
                className="md:hidden p-2 text-slate-600"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (!tab.disabled) {
                      setActiveTab(tab.id);
                      setIsMobileMenuOpen(false);
                    }
                  }}
                  disabled={tab.disabled}
                  className={`
                    w-full flex items-center gap-3 px-3 py-3 rounded-lg text-base font-medium
                    ${activeTab === tab.id 
                      ? 'bg-ocean-50 text-ocean-700' 
                      : tab.disabled 
                        ? 'text-slate-300' 
                        : 'text-slate-600 hover:bg-slate-50'}
                  `}
                >
                  <tab.icon className="w-5 h-5" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8">
        {currentTrip && (
          <div className="mb-6 bg-ocean-900 text-white p-4 rounded-xl shadow-lg flex justify-between items-center flex-wrap gap-4">
            <div>
              <p className="text-ocean-200 text-xs uppercase tracking-wider font-semibold">Current Trip</p>
              <p className="font-mono text-lg font-bold">{currentTrip.tripCode}</p>
            </div>
            <div className="flex gap-4 text-sm">
              <div>
                <p className="text-ocean-200 text-xs">Vessel</p>
                <p className="font-medium">{user?.vessel_name || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-ocean-200 text-xs">Status</p>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-300 border border-green-500/30">
                  Active
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="animate-fade-in">
          {activeTab === 'trip' && (
            <TripRegistration 
              onTripCreated={handleTripCreated} 
              existingTrip={currentTrip} 
            />
          )}
          {activeTab === 'species' && (
            <SpeciesEntry 
              trip={currentTrip} 
            />
          )}
          {activeTab === 'history' && (
            <TripHistory />
          )}
          {activeTab === 'summary' && (
            <TripSummary 
              trip={currentTrip} 
              onComplete={handleTripCompleted} 
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default CaptainDashboard;
