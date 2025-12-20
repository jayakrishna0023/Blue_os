import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, mainAPI } from '../../services/api';
import { getCurrentUser } from '../../services/utils';
import { Ship, Fish, Package, FileText, LogOut, Menu, X, User } from 'lucide-react';
import TripRegistration from './TripRegistration';
import SpeciesEntry from './SpeciesEntry';
import TripHistory from './TripHistory';
import TripSummary from './TripSummary';
import UserProfileCard from '../Shared/UserProfileCard';

const CaptainDashboard = () => {
  const [activeTab, setActiveTab] = useState('trip');
  const [currentTrip, setCurrentTrip] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [summaryKey, setSummaryKey] = useState(0); // Key to force Summary refresh
  const user = getCurrentUser();
  const navigate = useNavigate();

  // Function to trigger summary refresh when catches are saved
  const handleCatchSaved = () => {
    setSummaryKey(prev => prev + 1);
  };

  useEffect(() => {
    const checkActiveTrip = async () => {
      // 1. Load from storage first for instant UI
      const savedTrip = sessionStorage.getItem('currentTrip');
      if (savedTrip) {
        const parsed = JSON.parse(savedTrip);
        setCurrentTrip(parsed);
        setActiveTab('species'); // Default to species if trip exists
        
        // 2. Re-validate with server to get latest status
        if (user?.id) {
            try {
                const response = await mainAPI.getCaptainTrips(null, user.id);
                if (response.success && response.trips) {
                    // Find our trip
                    const serverTrip = response.trips.find(t => t.id === parsed.id);
                    if (serverTrip) {
                        // Update local state if status or code changed
                        if (serverTrip.status !== parsed.status || serverTrip.trip_code !== parsed.trip_code) {
                            console.log('Updating trip from server:', serverTrip);
                            setCurrentTrip(serverTrip);
                            sessionStorage.setItem('currentTrip', JSON.stringify(serverTrip));
                        }
                    }
                }
            } catch (e) {
                console.warn('Failed to validate trip with server', e);
            }
        }
      }
    };
    
    checkActiveTrip();
  }, [user?.id]);

  const handleLogout = () => {
    authAPI.logout();
  };

  const handleTripCreated = (tripData) => {
    setCurrentTrip(tripData);
    sessionStorage.setItem('currentTrip', JSON.stringify(tripData));
    setActiveTab('species');
  };

  const handleTripCompleted = () => {
    setCurrentTrip(null);
    sessionStorage.removeItem('currentTrip');
    setActiveTab('trip');
  };

  const tabs = [
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'trip', label: 'Trip Details', icon: Ship },
    { id: 'species', label: 'Catch Log', icon: Fish, disabled: !currentTrip },
    { id: 'history', label: 'Trip History', icon: FileText },
    { id: 'summary', label: 'Summary', icon: FileText, disabled: !currentTrip },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="bg-ocean-600 p-1.5 sm:p-2 rounded-lg">
                <Ship className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-base sm:text-xl font-bold text-slate-900">Captain's Log</h1>
                <p className="text-[10px] sm:text-xs text-slate-500 hidden xs:block">Welcome, {user?.full_name || 'Captain'}</p>
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

        {/* Mobile Bottom Navigation */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-30 px-1 py-1.5 pb-safe">
          <div className="flex justify-around items-center">
            {tabs.slice(0, 5).map((tab) => (
              <button
                key={tab.id}
                onClick={() => !tab.disabled && setActiveTab(tab.id)}
                disabled={tab.disabled}
                className={`
                  flex flex-col items-center justify-center gap-0.5 p-1.5 rounded-lg min-w-[50px] transition-all
                  ${activeTab === tab.id 
                    ? 'text-ocean-600 bg-ocean-50' 
                    : tab.disabled 
                      ? 'text-slate-300' 
                      : 'text-slate-500'}
                `}
              >
                <tab.icon className="w-5 h-5" />
                <span className="text-[9px] font-medium truncate max-w-[50px]">{tab.label.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-3 sm:p-4 lg:p-8 pb-20 md:pb-8">
        {currentTrip && (
          <div className="mb-4 sm:mb-6 bg-ocean-900 text-white p-3 sm:p-4 rounded-xl shadow-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
            <div>
              <p className="text-ocean-200 text-[10px] sm:text-xs uppercase tracking-wider font-semibold">Current Trip</p>
              <p className="font-mono text-sm sm:text-lg font-bold truncate max-w-[200px] sm:max-w-none">{currentTrip.tripCode}</p>
            </div>
            <div className="flex gap-4 text-xs sm:text-sm">
              <div>
                <p className="text-ocean-200 text-[10px] sm:text-xs">Vessel</p>
                <p className="font-medium truncate max-w-[80px] sm:max-w-none">{user?.vessel_name || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-ocean-200 text-[10px] sm:text-xs">Status</p>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-green-500/20 text-green-300 border border-green-500/30">
                  Active
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="animate-fade-in">
          {activeTab === 'profile' && (
            <div className="max-w-lg mx-auto">
              <UserProfileCard user={user} />
            </div>
          )}
          {activeTab === 'trip' && (
            <TripRegistration 
              onTripCreated={handleTripCreated} 
              existingTrip={currentTrip} 
            />
          )}
          {activeTab === 'species' && (
            <SpeciesEntry 
              trip={currentTrip}
              onCatchSaved={handleCatchSaved}
            />
          )}
          {activeTab === 'history' && (
            <TripHistory />
          )}
          {activeTab === 'summary' && (
            <TripSummary 
              key={summaryKey}
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
