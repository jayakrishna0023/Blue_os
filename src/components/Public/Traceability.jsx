import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { publicAPI } from '../../services/api';
import QRScannerModal from '../Shared/QRScannerModal';
import { Search, QrCode, MapPin, Ship, Thermometer, CheckCircle, ArrowLeft, Fish } from 'lucide-react';

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
        setTraceData(response.data);
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
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-ocean-600 p-2 rounded-lg">
              <Fish className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl text-slate-900">BlueTrace</span>
          </div>
          <button 
            onClick={() => navigate('/')}
            className="text-sm font-medium text-slate-500 hover:text-ocean-600"
          >
            Login
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4 sm:p-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Trace Your Catch</h1>
          <p className="text-slate-500 max-w-md mx-auto">
            Enter the unique ID found on your fish tag or scan the QR code to see its journey from ocean to plate.
          </p>
        </div>

        {/* Search Box */}
        <div className="glass-card p-2 flex items-center gap-2 mb-12 max-w-xl mx-auto shadow-xl shadow-ocean-100">
          <div className="pl-4 text-slate-400">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter Fish ID (e.g., FISH_...)"
            className="flex-1 bg-transparent border-none outline-none text-slate-800 placeholder-slate-400 h-12"
          />
          <button
            onClick={() => setIsScannerOpen(true)}
            className="p-3 text-slate-400 hover:text-ocean-600 hover:bg-ocean-50 rounded-xl transition-colors"
          >
            <QrCode className="w-6 h-6" />
          </button>
          <button
            onClick={handleSearch}
            disabled={loading || !code}
            className="bg-ocean-600 hover:bg-ocean-700 text-white px-6 py-3 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Tracing...' : 'Trace'}
          </button>
        </div>

        {/* Results */}
        {error && (
          <div className="text-center text-red-500 bg-red-50 p-4 rounded-xl mb-8">
            {error}
          </div>
        )}

        {traceData && (
          <div className="animate-slide-up space-y-8">
            {/* Header Card */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <p className="text-sm text-slate-500 uppercase tracking-wider font-semibold">Species</p>
                <h2 className="text-3xl font-bold text-ocean-900">{traceData.species}</h2>
                <p className="font-mono text-slate-400 text-sm mt-1">{traceData.id}</p>
              </div>
              <div className="bg-green-100 text-green-700 px-4 py-2 rounded-full flex items-center gap-2 font-medium">
                <CheckCircle className="w-5 h-5" />
                {traceData.status}
              </div>
            </div>

            {/* Timeline */}
            <div className="relative pl-8 border-l-2 border-slate-200 space-y-12">
              {/* Catch Node */}
              <div className="relative">
                <div className="absolute -left-[41px] bg-ocean-100 p-2 rounded-full border-4 border-white shadow-sm">
                  <Ship className="w-6 h-6 text-ocean-600" />
                </div>
                <div className="glass-card p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Catch Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-slate-500">Location</p>
                        <p className="font-medium text-slate-800">{traceData.catch.location}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Ship className="w-5 h-5 text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-slate-500">Vessel</p>
                        <p className="font-medium text-slate-800">{traceData.catch.vessel}</p>
                      </div>
                    </div>
                    <div className="col-span-full text-sm text-slate-400 mt-2 pt-2 border-t border-slate-100">
                      Caught on {new Date(traceData.catch.date).toLocaleString()} by {traceData.catch.captain} using {traceData.catch.method}
                    </div>
                  </div>
                </div>
              </div>

              {/* Quality Node */}
              <div className="relative">
                <div className="absolute -left-[41px] bg-purple-100 p-2 rounded-full border-4 border-white shadow-sm">
                  <CheckCircle className="w-6 h-6 text-purple-600" />
                </div>
                <div className="glass-card p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Quality Inspection</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-50 p-3 rounded-xl text-center">
                      <p className="text-xs text-slate-500 mb-1">Grade</p>
                      <p className="text-2xl font-bold text-purple-600">{traceData.quality.grade}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl text-center">
                      <p className="text-xs text-slate-500 mb-1">Weight</p>
                      <p className="text-xl font-bold text-slate-700">{traceData.quality.weight}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl text-center">
                      <p className="text-xs text-slate-500 mb-1">Temp</p>
                      <p className="text-xl font-bold text-slate-700">{traceData.quality.temperature}</p>
                    </div>
                    <div className="col-span-full text-sm text-slate-400 mt-2 pt-2 border-t border-slate-100">
                      Inspected on {new Date(traceData.quality.date).toLocaleString()} by {traceData.quality.inspector}
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
