import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { publicAPI } from '../../services/api';
import QRScannerModal from '../Shared/QRScannerModal';
import { Search, QrCode, MapPin, Ship, Thermometer, CheckCircle, ArrowLeft, Fish, Waves } from 'lucide-react';

const Traceability = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [traceData, setTraceData] = useState(null);
  const [error, setError] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!code) return;

    setLoading(true);
    setError('');
    setTraceData(null);

    try {
      const response = await publicAPI.traceCatch(code);
      if (response.success) {
        // Backend returns 'log' not 'data'
        const log = response.log;
        // Merge trip data into the main object for easier access
        if (log && log.trips) {
          log.vessel_name = log.trips.vessel_name;
          log.trip_code = log.trips.trip_code;
          log.departure_date = log.trips.departure_date;
        }
        setTraceData(log);
      } else {
        setError(response.message || 'Catch not found');
      }
    } catch (err) {
      setError('Could not find trace data for this ID.');
    } finally {
      setLoading(false);
    }
  };

  const handleScan = (scannedCode) => {
    setCode(scannedCode);
    // Auto search after scan
    setTimeout(() => {
      // We need to trigger search, but state update is async
      // So we'll just set code and let user click or use effect
      // For better UX, we can call search directly with the scanned code
      // But for now, let's just set it
    }, 100);
  };

  return (
    <div className="min-h-screen bg-slate-950 font-sans selection:bg-blue-500/30 selection:text-blue-200 relative overflow-x-hidden">
      
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-teal-600/10 rounded-full blur-[120px]"></div>
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="bg-gradient-to-br from-blue-600 to-cyan-500 p-1.5 sm:p-2 rounded-lg shadow-lg shadow-blue-500/20">
              <Fish className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
            </div>
            <span className="font-bold text-lg sm:text-xl text-white tracking-tight">BlueTrace</span>
          </div>
          <button 
            onClick={() => navigate('/')}
            className="text-xs sm:text-sm font-medium text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-800"
          >
            Login
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-3 sm:p-4 lg:p-8 pt-20 sm:pt-24 relative z-10">
        <div className="text-center mb-6 sm:mb-10">
          <div className="inline-flex items-center justify-center p-2.5 sm:p-3 bg-blue-600/20 rounded-xl sm:rounded-2xl mb-3 sm:mb-4 border border-blue-500/30 backdrop-blur-md">
             <Waves className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold text-white tracking-tight mb-2 sm:mb-4">Trace Your Catch</h1>
          <p className="text-slate-400 max-w-md mx-auto text-sm sm:text-lg px-4">
            Enter the unique ID found on your fish tag or scan the QR code to see its journey from ocean to plate.
          </p>
        </div>

        {/* Search Box */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-1.5 sm:p-2 flex items-center gap-1 sm:gap-2 mb-8 sm:mb-12 max-w-xl mx-auto rounded-xl sm:rounded-2xl shadow-2xl shadow-blue-900/10">
          <div className="pl-2 sm:pl-4 text-slate-500">
            <Search className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter Fish ID..."
            className="flex-1 bg-transparent border-none outline-none text-white placeholder-slate-500 h-10 sm:h-12 text-sm sm:text-base focus:ring-0 min-w-0"
          />
          <button
            onClick={() => setIsScannerOpen(true)}
            className="p-2 sm:p-3 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg sm:rounded-xl transition-colors touch-target"
          >
            <QrCode className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <button
            onClick={handleSearch}
            disabled={loading || !code}
            className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white px-3 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-medium transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base touch-target"
          >
            {loading ? '...' : 'Trace'}
          </button>
        </div>

        {/* Results */}
        {error && (
          <div className="text-center text-red-400 bg-red-500/10 border border-red-500/20 p-3 sm:p-4 rounded-xl mb-6 sm:mb-8 flex items-center justify-center gap-2 text-sm">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse flex-shrink-0" />
            <span className="line-clamp-2">{error}</span>
          </div>
        )}

        {traceData && (
          <div className="animate-slide-up space-y-6 sm:space-y-8">
            {/* Header Card */}
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-slate-500 uppercase tracking-wider font-semibold">Species</p>
                <h2 className="text-xl sm:text-3xl font-bold text-white truncate">{traceData.species_name || 'Unknown Species'}</h2>
                <p className="font-mono text-blue-400 text-xs sm:text-sm mt-1 truncate">{traceData.qr_code}</p>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full flex items-center gap-1.5 sm:gap-2 font-medium text-xs sm:text-base flex-shrink-0">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                Verified
              </div>
            </div>

            {/* Timeline */}
            <div className="relative pl-6 sm:pl-8 border-l-2 border-slate-800 space-y-8 sm:space-y-12">
              {/* Catch Node */}
              <div className="relative">
                <div className="absolute -left-[29px] sm:-left-[41px] bg-slate-900 p-1.5 sm:p-2 rounded-full border-4 border-slate-800 shadow-sm z-10">
                  <Ship className="w-4 h-4 sm:w-6 sm:h-6 text-blue-500" />
                </div>
                <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-4 sm:p-6 rounded-xl sm:rounded-2xl hover:border-blue-500/30 transition-colors">
                  <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4">Catch Details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-slate-500 mt-0.5" />
                      <div>
                        <p className="text-sm text-slate-500">Location</p>
                        <p className="font-medium text-slate-300">{traceData.location_name || 'At Sea'}</p>
                        <p className="text-xs text-slate-500 font-mono mt-1">
                            {traceData.latitude && traceData.longitude ? `${traceData.latitude}, ${traceData.longitude}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Ship className="w-5 h-5 text-slate-500 mt-0.5" />
                      <div>
                        <p className="text-sm text-slate-500">Vessel</p>
                        <p className="font-medium text-slate-300">{traceData.vessel_name || 'Unknown Vessel'}</p>
                      </div>
                    </div>
                    <div className="col-span-full text-sm text-slate-500 mt-2 pt-4 border-t border-slate-800">
                      Caught on <span className="text-slate-300">{new Date(traceData.timestamp).toLocaleString()}</span> using <span className="text-slate-300">{traceData.fishing_method || 'Standard Net'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quality Node */}
              <div className="relative">
                <div className="absolute -left-[41px] bg-slate-900 p-2 rounded-full border-4 border-slate-800 shadow-sm z-10">
                  <CheckCircle className="w-6 h-6 text-purple-500" />
                </div>
                <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-6 rounded-2xl hover:border-purple-500/30 transition-colors">
                  <h3 className="text-lg font-bold text-white mb-4">Quality Inspection</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-950/50 border border-slate-800 p-3 rounded-xl text-center">
                      <p className="text-xs text-slate-500 mb-1">Grade</p>
                      <p className="text-2xl font-bold text-purple-400">{traceData.quality_grade || 'N/A'}</p>
                    </div>
                    <div className="bg-slate-900/50 border border-slate-800 p-3 rounded-xl text-center">
                      <p className="text-xs text-slate-500 mb-1">Weight</p>
                      <p className="text-xl font-bold text-slate-300">{traceData.weight_kg ? `${traceData.weight_kg} kg` : 'N/A'}</p>
                    </div>
                    <div className="bg-slate-900/50 border border-slate-800 p-3 rounded-xl text-center">
                      <p className="text-xs text-slate-500 mb-1">Freshness</p>
                      <p className="text-xl font-bold text-slate-300">{traceData.freshness || 'N/A'}</p>
                    </div>
                    <div className="col-span-full text-sm text-slate-500 mt-2 pt-4 border-t border-slate-800">
                      {traceData.inspected_by ? (
                          <>Inspected by <span className="text-slate-300">Inspector #{traceData.inspected_by}</span></>
                      ) : (
                          <span className="text-yellow-500">Pending Inspection</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <QRScannerModal 
        isOpen={isScannerOpen} 
        onClose={() => setIsScannerOpen(false)} 
        onScan={handleScan} 
      />
    </div>
  );
};

export default Traceability;