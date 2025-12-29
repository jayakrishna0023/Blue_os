import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { publicAPI } from '../../../shared/services/api';
import QRScannerModal from '../../../shared/components/Shared/QRScannerModal';
import { 
  Search, QrCode, MapPin, Ship, Thermometer, CheckCircle, ArrowLeft, Fish, Waves,
  Calendar, Anchor, User, Scale, Award, Clock, Navigation, Package, ShieldCheck,
  Droplets, Wind, Star, ExternalLink, Home, ChevronRight, Sparkles, Eye
} from 'lucide-react';

const PublicTraceability = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [traceData, setTraceData] = useState(null);
  const [error, setError] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Auto-open scanner or search if QR is provided in URL
  useEffect(() => {
    const qrFromUrl = searchParams.get('qr');
    if (qrFromUrl) {
      setCode(qrFromUrl);
      handleSearchWithCode(qrFromUrl);
    }
  }, [searchParams]);

  const handleSearchWithCode = async (searchCode) => {
    if (!searchCode) return;

    setLoading(true);
    setError('');
    setTraceData(null);

    try {
      const response = await publicAPI.traceCatch(searchCode);
      if (response.success) {
        const log = response.log;
        // Merge trip data into the main object for easier access
        if (log && log.trips) {
          log.vessel_name = log.trips.vessel_name;
          log.trip_code = log.trips.trip_code;
          log.departure_date = log.trips.departure_date;
        }
        setTraceData(log);
      } else {
        setError(response.message || 'Catch not found. Please check the QR code and try again.');
      }
    } catch (err) {
      setError('Could not find trace data for this ID. Please verify the code is correct.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e?.preventDefault();
    handleSearchWithCode(code);
  };

  const handleScan = (scannedCode) => {
    setCode(scannedCode);
    setIsScannerOpen(false);
    handleSearchWithCode(scannedCode);
  };

  // Format date nicely with 24-hour time
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  // Get grade color
  const getGradeColor = (grade) => {
    switch (grade?.toUpperCase()) {
      case 'A': return 'from-emerald-500 to-green-500';
      case 'B': return 'from-blue-500 to-cyan-500';
      case 'C': return 'from-yellow-500 to-orange-500';
      case 'D': return 'from-red-500 to-pink-500';
      default: return 'from-slate-500 to-slate-600';
    }
  };

  // Get freshness badge
  const getFreshnessBadge = (freshness) => {
    switch (freshness?.toLowerCase()) {
      case 'excellent': return { color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30', icon: <Sparkles className="w-4 h-4" /> };
      case 'good': return { color: 'text-blue-400 bg-blue-500/20 border-blue-500/30', icon: <Star className="w-4 h-4" /> };
      case 'fair': return { color: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30', icon: <Eye className="w-4 h-4" /> };
      default: return { color: 'text-slate-400 bg-slate-500/20 border-slate-500/30', icon: <CheckCircle className="w-4 h-4" /> };
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 font-sans selection:bg-blue-500/30 selection:text-blue-200 relative overflow-x-hidden">
      
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/15 rounded-full blur-[150px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-teal-600/15 rounded-full blur-[150px]"></div>
        <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] bg-purple-600/10 rounded-full blur-[100px]"></div>
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:40px_40px]"></div>
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-18 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <button 
              onClick={() => navigate('/')}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors mr-1"
            >
              <ArrowLeft className="w-5 h-5 text-slate-400" />
            </button>
            <div className="bg-gradient-to-br from-blue-600 to-cyan-500 p-2 sm:p-2.5 rounded-xl shadow-lg shadow-blue-500/25">
              <Fish className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg sm:text-xl text-white tracking-tight">FishTrace</span>
              <p className="text-xs text-slate-500 hidden sm:block">Transparent Seafood Traceability</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors px-4 py-2 rounded-xl hover:bg-slate-800 border border-transparent hover:border-slate-700"
          >
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">Home</span>
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-12 relative z-10">
        
        {/* Hero Section */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center justify-center p-3 sm:p-4 bg-gradient-to-br from-blue-600/20 to-cyan-600/20 rounded-2xl sm:rounded-3xl mb-4 sm:mb-6 border border-blue-500/30 backdrop-blur-md shadow-2xl shadow-blue-900/20">
            <QrCode className="w-8 h-8 sm:w-12 sm:h-12 text-blue-400" />
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold text-white tracking-tight mb-3 sm:mb-4">
            Trace Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">Seafood</span>
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto text-base sm:text-lg px-4 leading-relaxed">
            Scan the QR code on your fish tag or enter the ID to discover the complete journey — from ocean to your plate.
          </p>
        </div>

        {/* Search Box */}
        <div className="bg-slate-900/60 backdrop-blur-2xl border border-slate-700/50 p-2 sm:p-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 mb-8 sm:mb-12 max-w-2xl mx-auto rounded-2xl sm:rounded-3xl shadow-2xl shadow-blue-900/10">
          <div className="flex items-center flex-1 bg-slate-800/50 rounded-xl sm:rounded-2xl px-4 py-3">
            <Search className="w-5 h-5 text-slate-500 flex-shrink-0" />
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Enter Fish ID or QR Code..."
              className="flex-1 bg-transparent border-none outline-none text-white placeholder-slate-500 h-8 text-base focus:ring-0 ml-3"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsScannerOpen(true)}
              className="flex-1 sm:flex-none p-3 sm:p-4 text-slate-400 hover:text-cyan-400 bg-slate-800/50 hover:bg-cyan-500/10 rounded-xl sm:rounded-2xl transition-all border border-transparent hover:border-cyan-500/30 group"
              title="Scan QR Code"
            >
              <QrCode className="w-6 h-6 mx-auto group-hover:scale-110 transition-transform" />
            </button>
            <button
              onClick={handleSearch}
              disabled={loading || !code}
              className="flex-1 sm:flex-none bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold transition-all shadow-lg shadow-blue-900/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  <span>Trace</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="text-center bg-red-500/10 border border-red-500/30 p-4 sm:p-6 rounded-2xl mb-8 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-2xl mx-auto backdrop-blur-lg">
            <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div className="text-center sm:text-left">
              <p className="text-red-400 font-medium">{error}</p>
              <p className="text-red-400/60 text-sm mt-1">Make sure the QR code or Fish ID is correct</p>
            </div>
          </div>
        )}

        {/* Results */}
        {traceData && (
          <div className="animate-fade-in space-y-6">
            
            {/* Main Species Card */}
            <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 backdrop-blur-2xl border border-slate-700/50 rounded-3xl overflow-hidden shadow-2xl">
              {/* Top Gradient Bar */}
              <div className={`h-2 bg-gradient-to-r ${getGradeColor(traceData.quality_grade)}`}></div>
              
              <div className="p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Fish className="w-5 h-5 text-blue-400" />
                      <p className="text-xs sm:text-sm text-slate-500 uppercase tracking-wider font-semibold">Species Identified</p>
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-bold text-white mb-2">{traceData.species_name || 'Unknown Species'}</h2>
                    <div className="flex items-center gap-2 text-slate-400">
                      <Package className="w-4 h-4" />
                      <p className="font-mono text-sm">{traceData.qr_code}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-2 rounded-full flex items-center gap-2 font-medium text-sm">
                      <ShieldCheck className="w-4 h-4" />
                      Verified Origin
                    </div>
                    {traceData.quality_grade && (
                      <div className={`bg-gradient-to-r ${getGradeColor(traceData.quality_grade)} text-white px-4 py-2 rounded-full flex items-center gap-2 font-bold text-sm shadow-lg`}>
                        <Award className="w-4 h-4" />
                        Grade {traceData.quality_grade}
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                      <Scale className="w-4 h-4" />
                      <span className="text-xs uppercase tracking-wider">Weight</span>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-white">
                      {traceData.weight_kg ? `${traceData.weight_kg} kg` : 'N/A'}
                    </p>
                  </div>
                  <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                      <Thermometer className="w-4 h-4" />
                      <span className="text-xs uppercase tracking-wider">Temp</span>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-white">
                      {traceData.temperature ? `${traceData.temperature}°C` : 'N/A'}
                    </p>
                  </div>
                  <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                      <Package className="w-4 h-4" />
                      <span className="text-xs uppercase tracking-wider">Count</span>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-white">
                      {traceData.count || 1} pc{traceData.count > 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                      <Droplets className="w-4 h-4" />
                      <span className="text-xs uppercase tracking-wider">Freshness</span>
                    </div>
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getFreshnessBadge(traceData.freshness).color}`}>
                      {getFreshnessBadge(traceData.freshness).icon}
                      {traceData.freshness || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Journey Timeline */}
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 sm:p-8 shadow-xl">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Navigation className="w-5 h-5 text-blue-400" />
                Journey Timeline
              </h3>
              
              <div className="relative pl-8 border-l-2 border-slate-700/50 space-y-8">
                
                {/* Catch Point */}
                <div className="relative">
                  <div className="absolute -left-[41px] bg-gradient-to-br from-blue-600 to-cyan-600 p-2.5 rounded-full shadow-lg shadow-blue-500/30">
                    <Anchor className="w-5 h-5 text-white" />
                  </div>
                  <div className="bg-slate-800/50 border border-slate-700/50 p-5 rounded-2xl hover:border-blue-500/30 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-bold text-white">Caught at Sea</h4>
                      <span className="text-xs text-slate-500 bg-slate-700/50 px-2 py-1 rounded-full">Step 1</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                          <MapPin className="w-4 h-4 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 uppercase">GPS Coordinates</p>
                          {(traceData.gps_lat || traceData.latitude) && (traceData.gps_lng || traceData.longitude) ? (
                            <div className="font-mono text-white">
                              <span className="block text-sm">
                                Lat: {Number(traceData.gps_lat || traceData.latitude).toFixed(6)}°
                              </span>
                              <span className="block text-sm">
                                Lng: {Number(traceData.gps_lng || traceData.longitude).toFixed(6)}°
                              </span>
                            </div>
                          ) : (
                            <p className="font-medium text-white">At Sea</p>
                          )}
                          {traceData.location_name && (
                            <p className="text-xs text-slate-400 mt-1">{traceData.location_name}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                          <Calendar className="w-4 h-4 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 uppercase">Date & Time</p>
                          <p className="font-medium text-white">{formatDate(traceData.timestamp)}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                          <Wind className="w-4 h-4 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 uppercase">Fishing Method</p>
                          <p className="font-medium text-white">{traceData.fishing_method || 'Traditional Net'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                          <Clock className="w-4 h-4 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 uppercase">Trip Started</p>
                          <p className="font-medium text-white">{formatDate(traceData.departure_date)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Vessel Info */}
                <div className="relative">
                  <div className="absolute -left-[41px] bg-gradient-to-br from-purple-600 to-pink-600 p-2.5 rounded-full shadow-lg shadow-purple-500/30">
                    <Ship className="w-5 h-5 text-white" />
                  </div>
                  <div className="bg-slate-800/50 border border-slate-700/50 p-5 rounded-2xl hover:border-purple-500/30 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-bold text-white">Vessel Details</h4>
                      <span className="text-xs text-slate-500 bg-slate-700/50 px-2 py-1 rounded-full">Step 2</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-purple-500/10 rounded-lg">
                          <Ship className="w-4 h-4 text-purple-400" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 uppercase">Vessel Name</p>
                          <p className="font-medium text-white text-lg">{traceData.vessel_name || 'Unknown Vessel'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-purple-500/10 rounded-lg">
                          <Package className="w-4 h-4 text-purple-400" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 uppercase">Trip Code</p>
                          <p className="font-medium text-white font-mono">{traceData.trip_code || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quality Inspection */}
                <div className="relative">
                  <div className="absolute -left-[41px] bg-gradient-to-br from-emerald-600 to-teal-600 p-2.5 rounded-full shadow-lg shadow-emerald-500/30">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <div className="bg-slate-800/50 border border-slate-700/50 p-5 rounded-2xl hover:border-emerald-500/30 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-bold text-white">Quality Inspection</h4>
                      <span className="text-xs text-slate-500 bg-slate-700/50 px-2 py-1 rounded-full">Step 3</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-slate-900/50 border border-slate-700/50 p-4 rounded-xl text-center">
                        <p className="text-xs text-slate-500 uppercase mb-2">Quality Grade</p>
                        <div className={`text-3xl font-black bg-gradient-to-r ${getGradeColor(traceData.quality_grade)} text-transparent bg-clip-text`}>
                          {traceData.quality_grade || '—'}
                        </div>
                      </div>
                      <div className="bg-slate-900/50 border border-slate-700/50 p-4 rounded-xl text-center">
                        <p className="text-xs text-slate-500 uppercase mb-2">Freshness</p>
                        <div className="text-lg font-bold text-white">{traceData.freshness || 'N/A'}</div>
                      </div>
                      <div className="bg-slate-900/50 border border-slate-700/50 p-4 rounded-xl text-center">
                        <p className="text-xs text-slate-500 uppercase mb-2">Damage</p>
                        <div className="text-lg font-bold text-white">{traceData.damage_assessment || 'None'}</div>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-700/50 flex items-center justify-between text-sm">
                      {traceData.inspected_by ? (
                        <div className="flex items-center gap-2 text-slate-400">
                          <User className="w-4 h-4" />
                          <span>Inspected by <span className="text-emerald-400 font-medium">Inspector #{traceData.inspected_by}</span></span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-yellow-400">
                          <Clock className="w-4 h-4" />
                          <span>Pending Inspection</span>
                        </div>
                      )}
                      {traceData.inspected_at && (
                        <span className="text-slate-500 text-xs">{formatDate(traceData.inspected_at)}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Ready for Consumer */}
                <div className="relative">
                  <div className="absolute -left-[41px] bg-gradient-to-br from-amber-500 to-orange-500 p-2.5 rounded-full shadow-lg shadow-amber-500/30">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/30 p-5 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div>
                        <h4 className="text-lg font-bold text-white">Ready for You!</h4>
                        <p className="text-slate-400 text-sm mt-1">
                          This fish has been verified, inspected, and is ready for consumption. Enjoy your fresh, traceable seafood!
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Images Section */}
            {traceData.images && traceData.images.length > 0 && (
              <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 sm:p-8 shadow-xl">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-blue-400" />
                  Catch Photos
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {traceData.images.map((img, idx) => (
                    <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-700/50 group">
                      <img 
                        src={img} 
                        alt={`Catch photo ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Trust Badge */}
            <div className="text-center py-6">
              <div className="inline-flex items-center gap-3 bg-slate-800/50 border border-slate-700/50 px-6 py-3 rounded-full">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span className="text-slate-400 text-sm">Verified by <span className="text-white font-medium">BlueOS Traceability System</span></span>
              </div>
            </div>

          </div>
        )}

        {/* Instructions when no data */}
        {!traceData && !error && !loading && (
          <div className="text-center py-12">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto mb-12">
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 hover:border-blue-500/30 transition-colors">
                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <QrCode className="w-6 h-6 text-blue-400" />
                </div>
                <h4 className="font-bold text-white mb-2">Scan QR Code</h4>
                <p className="text-slate-500 text-sm">Use your camera to scan the QR code on the fish tag</p>
              </div>
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 hover:border-purple-500/30 transition-colors">
                <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Search className="w-6 h-6 text-purple-400" />
                </div>
                <h4 className="font-bold text-white mb-2">Enter Fish ID</h4>
                <p className="text-slate-500 text-sm">Type the unique ID printed on your fish tag</p>
              </div>
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 hover:border-emerald-500/30 transition-colors">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Eye className="w-6 h-6 text-emerald-400" />
                </div>
                <h4 className="font-bold text-white mb-2">View Details</h4>
                <p className="text-slate-500 text-sm">See complete journey from ocean to plate</p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-600/10 to-cyan-600/10 border border-blue-500/20 rounded-2xl p-6 max-w-xl mx-auto">
              <p className="text-slate-400 text-sm leading-relaxed">
                <span className="text-white font-medium">Why trace your seafood?</span><br/>
                Know exactly where your fish comes from, who caught it, when it was caught, and verify its quality grade. Full transparency for conscious consumers.
              </p>
            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 py-8 mt-12 relative z-10">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Waves className="w-5 h-5 text-blue-500" />
            <span className="font-bold text-white">BlueOS</span>
          </div>
          <p className="text-slate-600 text-sm">© 2025 BlueOS Fisheries Traceability. Transparency from Ocean to Plate.</p>
        </div>
      </footer>

      {/* QR Scanner Modal */}
      <QRScannerModal 
        isOpen={isScannerOpen} 
        onClose={() => setIsScannerOpen(false)} 
        onScan={handleScan} 
      />

      {/* Animation Styles */}
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default PublicTraceability;
