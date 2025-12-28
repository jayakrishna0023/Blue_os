import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, fisherAPI } from '../../services/api';
import { getCurrentUser } from '../../services/utils';
import { User, LogOut, QrCode, Ship, Calendar, MapPin, Clock, Download, RefreshCw } from 'lucide-react';
import QRCode from 'qrcode';
import { useLanguage } from '../../context/LanguageContext';
import LanguageToggle from '../Shared/LanguageToggle';

const FisherDashboard = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('profile');
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [qrUrl, setQrUrl] = useState('');
  const user = getCurrentUser();
  const navigate = useNavigate();

  const fetchTrips = useCallback(async () => {
    if (!user?.id) {
        console.warn("FisherDashboard: No user ID found", user);
        return;
    }
    setLoading(true);
    try {
      console.log("Fetching trips for fisher ID:", user.id, "QR:", user.qr_code);
      const response = await fisherAPI.getTrips(user.id);
      console.log("Fisher trips response:", response);
      if (response.success) {
        setTrips(response.trips || []);
      }
    } catch (error) {
      console.error("Error fetching trips", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, user?.qr_code]);

  useEffect(() => {
    if (user?.qr_code) {
      QRCode.toDataURL(user.qr_code)
        .then(url => setQrUrl(url))
        .catch(err => console.error(err));
    }
    // Fetch trips on mount to populate stats
    fetchTrips();
  }, [fetchTrips]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTrips();
  };

  const handleLogout = () => {
    authAPI.logout();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-md lg:max-w-2xl mx-auto px-4 h-14 sm:h-16 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 sm:p-2 rounded-lg">
              <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <h1 className="font-bold text-slate-900 text-sm sm:text-base">{t('fisherDashboard')}</h1>
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle className="!bg-slate-100 !border-slate-200" />
            <button onClick={handleLogout} className="text-slate-400 hover:text-red-600 p-2 touch-target">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-md lg:max-w-2xl mx-auto flex">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-3 sm:py-4 text-xs sm:text-sm font-medium border-b-2 touch-target ${
              activeTab === 'profile' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'
            }`}
          >
            {t('profile')}
          </button>
          <button
            onClick={() => setActiveTab('trips')}
            className={`flex-1 py-3 sm:py-4 text-xs sm:text-sm font-medium border-b-2 touch-target ${
              activeTab === 'trips' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'
            }`}
          >
            {t('myTrips')}
          </button>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 max-w-md lg:max-w-2xl mx-auto w-full p-3 sm:p-4 lg:p-6">
        {activeTab === 'profile' && (
          <div className="space-y-6 animate-fade-in">
            {/* Enhanced ID Card */}
            <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-xl sm:rounded-2xl shadow-xl sm:shadow-2xl overflow-hidden">
              {/* Header Pattern */}
              <div className="relative p-4 sm:p-6 pb-16 sm:pb-20">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50"></div>
                <div className="relative flex justify-between items-start">
                  <div>
                    <p className="text-blue-200 text-[10px] sm:text-xs uppercase tracking-widest font-bold">{t('blueosNetwork')}</p>
                    <h2 className="text-base sm:text-xl font-bold text-white mt-1">{t('fisherIdCard')}</h2>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm px-2 sm:px-3 py-1 rounded-full">
                    <span className="text-[10px] sm:text-xs font-bold text-white">● {t('verified')}</span>
                  </div>
                </div>
              </div>
              
              {/* White Card Body */}
              <div className="bg-white rounded-t-2xl sm:rounded-t-3xl -mt-10 sm:-mt-12 relative z-10">
                <div className="p-4 sm:p-6 flex flex-col items-center">
                  {/* QR Code with shadow */}
                  <div className="-mt-12 sm:-mt-16 mb-3 sm:mb-4 bg-white p-2 sm:p-3 rounded-xl sm:rounded-2xl shadow-xl border-2 sm:border-4 border-white relative group">
                    {qrUrl ? (
                      <>
                        <img src={qrUrl} alt="Fisher QR" className="w-28 h-28 sm:w-40 sm:h-40 rounded-lg" />
                        <a 
                          href={qrUrl} 
                          download={`fisher-qr-${user?.qr_code}.png`}
                          className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg cursor-pointer"
                          title="Download QR Code"
                        >
                          <Download className="w-8 h-8 text-white" />
                        </a>
                      </>
                    ) : (
                      <div className="w-28 h-28 sm:w-40 sm:h-40 flex items-center justify-center text-slate-400 bg-slate-100 rounded-lg text-sm">{t('generating')}</div>
                    )}
                  </div>
                  
                  <p className="font-mono text-[10px] sm:text-xs text-slate-400 mb-3 sm:mb-4 bg-slate-100 px-2 sm:px-3 py-1 rounded-full truncate max-w-full">{user?.qr_code || 'NO QR CODE'}</p>
                  
                  {/* Name with badge */}
                  <div className="text-center mb-4 sm:mb-6">
                    <h3 className="text-lg sm:text-2xl font-bold text-slate-900">{user?.full_name || 'Unknown Fisher'}</h3>
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <MapPin className="w-4 h-4 text-blue-500" />
                      <p className="text-slate-600">{user?.home_port || 'Home Port N/A'}</p>
                    </div>
                  </div>
                  
                  {/* Stats Row */}
                  <div className="w-full grid grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-6">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg sm:rounded-xl p-2 sm:p-3 text-center">
                      <p className="text-lg sm:text-2xl font-bold text-blue-600">{trips.length}</p>
                      <p className="text-[10px] sm:text-xs text-blue-500">{t('trips')}</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg sm:rounded-xl p-2 sm:p-3 text-center">
                      <p className="text-lg sm:text-2xl font-bold text-green-600">₹{trips.length * 1500}</p>
                      <p className="text-[10px] sm:text-xs text-green-500">{t('earnings')}</p>
                    </div>
                    <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg sm:rounded-xl p-2 sm:p-3 text-center">
                      <p className="text-lg sm:text-2xl font-bold text-amber-600">5.0</p>
                      <p className="text-[10px] sm:text-xs text-amber-500">{t('rating')}</p>
                    </div>
                  </div>
                  
                  {/* Details */}
                  <div className="w-full space-y-3 sm:space-y-4">
                    <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-slate-50 rounded-lg sm:rounded-xl">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] sm:text-xs text-slate-400">{t('mobileNumberLabel')}</p>
                        <p className="font-medium text-slate-800 text-sm sm:text-base truncate">{user?.mobile_number || 'N/A'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-slate-50 rounded-lg sm:rounded-xl">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] sm:text-xs text-slate-400">{t('fathersName')}</p>
                        <p className="font-medium text-slate-800 text-sm sm:text-base truncate">{user?.fathers_name || 'N/A'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-red-50 rounded-lg sm:rounded-xl border border-red-100">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] sm:text-xs text-red-400">{t('emergencyContact')}</p>
                        <p className="font-bold text-red-600 text-sm sm:text-base">{user?.emergency_contact_number || 'Not Set'}</p>
                        <p className="text-[10px] sm:text-xs text-slate-500 truncate">{user?.emergency_contact_name}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'trips' && (
          <div className="space-y-4 animate-fade-in">
            {/* Refresh Header */}
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">My Trips</h2>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                {t('refresh')}
              </button>
            </div>

            {loading ? (
              <div className="text-center py-8 text-slate-500">{t('loadingTrips')}</div>
            ) : trips.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
                <Ship className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">{t('noTripsYet')}</p>
                <p className="text-xs text-slate-400 mt-2">{t('noTripsMessage')}</p>
              </div>
            ) : (
              trips.map((trip, idx) => (
                <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-slate-800">{trip.vessel_name}</h3>
                      <p className="text-xs text-slate-500 font-mono">{trip.trip_code}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      trip.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {trip.status.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm text-slate-600 mb-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="text-xs">{t('departure')}: {new Date(trip.departure_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span className="text-xs">{t('joined')}: {new Date(trip.joined_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">{t('port')}</p>
                      <p className="text-sm font-medium text-slate-700 truncate">{trip.departure_port || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">{t('method')}</p>
                      <p className="text-sm font-medium text-slate-700 truncate">{trip.fishing_method || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default FisherDashboard;
