import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { mainAPI } from '../../../shared/services/api';
import { getCurrentUser } from '../../../shared/services/utils';
import QRScannerModal from '../../../shared/components/Shared/QRScannerModal';
import { QrCode, Scale, CheckCircle, AlertTriangle, Fish, Box, ArrowLeft, ArrowRight, Thermometer, History, X, RefreshCw, MapPin, Calendar } from 'lucide-react';

// Storage key for form data persistence
const WORKER_FORM_STORAGE_KEY = 'blueos_worker_entry_form';

const WorkerEntry = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [crates, setCrates] = useState([]);
  
  // Initialize state from location or sessionStorage to persist context
  const [selectedTripId, setSelectedTripId] = useState(() => {
    return location.state?.tripId || sessionStorage.getItem('worker_active_trip_id') || '';
  });

  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // New State for Trip Manifest and Scanned Details
  const [tripManifest, setTripManifest] = useState({ pending: [], inspected: [] });
  const [scannedFishDetails, setScannedFishDetails] = useState(null);
  
  // Load saved form data from storage
  const [formData, setFormData] = useState(() => {
    try {
      const saved = sessionStorage.getItem(WORKER_FORM_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          qrCode: parsed.qrCode || '',
          weight: parsed.weight || '',
          qualityGrade: parsed.qualityGrade || 'A',
          freshness: parsed.freshness || 'Excellent',
          damage: parsed.damage || '',
          crateId: parsed.crateId || sessionStorage.getItem('worker_active_crate_id') || '',
          temperature: parsed.temperature || ''
        };
      }
    } catch {
      // Ignore
    }
    return {
      qrCode: '',
      weight: '',
      qualityGrade: 'A',
      freshness: 'Excellent',
      damage: '',
      crateId: sessionStorage.getItem('worker_active_crate_id') || '',
      temperature: ''
    };
  });

  const user = getCurrentUser();

  // Save form data to sessionStorage whenever it changes
  useEffect(() => {
    try {
      sessionStorage.setItem(WORKER_FORM_STORAGE_KEY, JSON.stringify(formData));
    } catch (e) {
      console.warn('Failed to save form data:', e);
    }
  }, [formData]);

  // Clear form after successful save
  const clearFormDraft = useCallback(() => {
    sessionStorage.removeItem(WORKER_FORM_STORAGE_KEY);
  }, []);

  const loadData = async () => {
    try {
      // Use allSettled so one failure doesn't block the other
      const [tripsResult, cratesResult] = await Promise.allSettled([
        mainAPI.getAvailableTrips(),
        mainAPI.getCrates()
      ]);

      // Handle Trips
      if (tripsResult.status === 'fulfilled' && tripsResult.value.success) {
        setTrips(tripsResult.value.trips || []);
      } else {
        console.warn("Failed to load trips:", tripsResult.reason || tripsResult.value);
      }

      // Handle Crates
      if (cratesResult.status === 'fulfilled' && cratesResult.value.success) {
        setCrates(cratesResult.value.crates || []);
      } else {
        console.warn("Failed to load crates:", cratesResult.reason || cratesResult.value);
      }

    } catch (error) {
      console.error('Error loading data:', error);
      setMessage({ type: 'error', text: 'Connection Error: Ensure Backend is running.' });
    }
  };

  const loadTripManifest = async () => {
    if (!selectedTripId) return;
    
    try {
      const response = await mainAPI.getTripCatch(selectedTripId);
      if (response && response.success && response.logs) {
        const pending = [];
        const inspected = [];

        response.logs.forEach(log => {
            // If it has a quality grade, it's inspected. Otherwise, it's pending.
            if (log.quality_grade) {
                inspected.push(log);
            } else {
                pending.push(log);
            }
        });
        
        setTripManifest({ pending, inspected });
      }
    } catch (error) {
      console.error('Error loading trip manifest:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Load crates for a specific trip
  const loadCratesForTrip = async (tripId) => {
    try {
      const response = await mainAPI.getCrates(tripId);
      if (response.success) {
        setCrates(response.crates || []);
      }
    } catch (error) {
      console.error('Error loading crates for trip:', error);
    }
  };

  // Persist Trip ID and load manifest
  useEffect(() => {
    if (selectedTripId) {
      sessionStorage.setItem('worker_active_trip_id', selectedTripId);
      loadTripManifest();
      loadCratesForTrip(selectedTripId); // Load crates for this trip
      setScannedFishDetails(null); // Reset scanned details on trip change
    } else {
      setTripManifest({ pending: [], inspected: [] });
      setCrates([]); // Clear crates when no trip selected
    }
  }, [selectedTripId]);

  // Persist Crate ID whenever it changes
  useEffect(() => {
    if (formData.crateId) {
      sessionStorage.setItem('worker_active_crate_id', formData.crateId);
    }
  }, [formData.crateId]);

  // Clear message after 3 seconds
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleScan = async (code) => {
    setIsScannerOpen(false);
    setLoading(true);
    
    try {
        const response = await mainAPI.getLogByQR(code);
        
        if (response.success && response.log) {
            const log = response.log;
            
            // Check if trip matches
            if (selectedTripId && log.trip_id !== parseInt(selectedTripId)) {
                setMessage({ type: 'error', text: `Warning: This fish belongs to a different trip (${log.trips?.trip_code})!` });
                // Optional: Auto-switch trip? For now, just warn.
            }

            setScannedFishDetails({
                species: log.species_name,
                vessel: log.trips?.vessel_name,
                tripCode: log.trips?.trip_code,
                date: new Date(log.created_at).toLocaleDateString(),
                location: log.gps_lat && log.gps_lng 
                  ? `${Number(log.gps_lat).toFixed(6)}-¦, ${Number(log.gps_lng).toFixed(6)}-¦`
                  : log.location_name || 'Unknown Location',
                gps_lat: log.gps_lat,
                gps_lng: log.gps_lng
            });

            setFormData(prev => ({
                ...prev,
                qrCode: code,
                weight: log.weight_kg || '', // Pre-fill weight if exists
                qualityGrade: log.quality_grade || 'A', // Pre-fill or default
                freshness: log.freshness || 'Excellent',
                damage: log.damage_assessment || ''
            }));

            // Play success sound
            if (navigator.vibrate) navigator.vibrate(200);

        } else {
            // New QR Code (not in system yet)
            setScannedFishDetails(null);
            setFormData(prev => ({ ...prev, qrCode: code, weight: '' }));
            setMessage({ type: 'info', text: 'New QR Code detected. Please enter details.' });
        }
    } catch (error) {
        console.error("Scan Error:", error);
        setMessage({ type: 'error', text: 'Error fetching QR details' });
    } finally {
        setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTripId) {
      setMessage({ type: 'error', text: 'Please select a trip first' });
      return;
    }
    
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await mainAPI.saveFish({
        qrCode: formData.qrCode,
        weight: formData.weight,
        qualityGrade: formData.qualityGrade,
        freshness: formData.freshness,
        damage: formData.damage,
        crateId: formData.crateId,
        tripId: selectedTripId,
        inspectorId: user?.id
      });

      if (response.success) {
        setMessage({ type: 'success', text: 'Quality data saved successfully!' });
        
        // Refresh manifest
        loadTripManifest();

        // Clear form draft
        clearFormDraft();

        setFormData(prev => ({ 
            ...prev, 
            qrCode: '', 
            weight: '', 
            damage: '',
            // Keep crate, quality and freshness
        }));
        setScannedFishDetails(null);
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to save data' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
        <button 
          onClick={() => navigate('/worker')}
          className="flex items-center text-slate-500 hover:text-blue-600 transition-colors group"
        >
          <div className="bg-white p-1.5 sm:p-2 rounded-lg border border-slate-200 mr-2 sm:mr-3 group-hover:border-blue-200 shadow-sm">
            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:-translate-x-1 transition-transform" />
          </div>
          <span className="font-medium text-sm sm:text-base">Back</span>
        </button>

        <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-500 hidden sm:inline">Inspector:</span>
            <span className="font-bold text-slate-900 bg-white px-2 sm:px-3 py-1 rounded-full border border-slate-200 shadow-sm text-xs sm:text-sm truncate max-w-[150px]">
                {user?.full_name}
            </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        {/* Left Column: Main Form */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Trip Selector Card */}
            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200">
                <div className="flex flex-wrap justify-between items-center gap-2 mb-2">
                    <label className="block text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider">Active Trip</label>
                    <button onClick={loadData} className="text-blue-600 hover:text-blue-800 text-xs font-bold flex items-center gap-1">
                        <RefreshCw className="w-3 h-3" /> Refresh
                    </button>
                </div>
                <select
                    value={selectedTripId}
                    onChange={(e) => setSelectedTripId(e.target.value)}
                    className="w-full p-2.5 sm:p-3 bg-white border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-medium text-slate-900 text-sm sm:text-base"
                >
                    <option value="">-- Select Trip --</option>
                    {trips.length === 0 && <option disabled>No active trips</option>}
                    {trips.map(trip => (
                    <option key={trip.id} value={trip.id}>
                        {trip.vessel_name} ({trip.trip_code})
                    </option>
                    ))}
                </select>
            </div>

            {/* Inspection Form Card */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
                <div className="bg-slate-50 px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 flex justify-between items-center">
                    <h2 className="text-base sm:text-lg font-bold flex items-center gap-2 text-slate-800">
                        <Fish className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                        <span className="hidden xs:inline">New </span>Inspection
                    </h2>
                    {loading && <span className="text-xs font-bold text-blue-600 animate-pulse">SAVING...</span>}
                </div>

                <div className="p-4 sm:p-6 md:p-8">
                    {message.text && (
                        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${
                        message.type === 'error' 
                            ? 'bg-red-50 text-red-700 border border-red-100' 
                            : 'bg-green-50 text-green-700 border border-green-100'
                        }`}>
                        {message.type === 'error' ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                        {message.text}
                        </div>
                    )}

                    {/* Scanned Details Card */}
                    {scannedFishDetails && (
                        <div className="mb-6 sm:mb-8 bg-blue-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-blue-100 flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center justify-between">
                            <div className="flex-1 min-w-0">
                                <h4 className="text-blue-900 font-bold text-sm sm:text-lg flex items-center gap-2">
                                    <Fish className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                                    <span className="truncate">{scannedFishDetails.species || 'Unknown Species'}</span>
                                </h4>
                                <div className="flex flex-wrap gap-2 sm:gap-3 mt-1.5 sm:mt-2 text-xs sm:text-sm text-blue-700">
                                    <span className="flex items-center gap-1"><Box className="w-3 h-3" /> {scannedFishDetails.vessel || 'Unknown Vessel'}</span>
                                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {scannedFishDetails.date}</span>
                                    <span className="flex items-center gap-1 hidden sm:flex"><MapPin className="w-3 h-3" /> {scannedFishDetails.location}</span>
                                </div>
                            </div>
                            <div className="bg-white px-2 sm:px-3 py-1 rounded-lg border border-blue-200 text-blue-800 text-[10px] sm:text-xs font-mono">
                                {scannedFishDetails.tripCode || 'NO TRIP'}
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
                        {/* QR Code Section */}
                        <div className="bg-slate-50 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-slate-200">
                            <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-2">Fish Tag ID</label>
                            <div className="flex gap-2 sm:gap-3">
                                <div className="relative flex-1">
                                    <QrCode className="absolute left-2.5 sm:left-3 top-3 sm:top-3.5 w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
                                    <input
                                        type="text"
                                        value={formData.qrCode}
                                        onChange={(e) => setFormData(prev => ({ ...prev, qrCode: e.target.value }))}
                                        className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-white border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm sm:text-lg text-slate-900"
                                        placeholder="Scan QR..."
                                        required
                                        autoFocus
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsScannerOpen(true)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-6 rounded-lg sm:rounded-xl font-medium transition-colors shadow-md hover:shadow-lg flex items-center gap-1 sm:gap-2 touch-target"
                                >
                                    <QrCode className="w-4 h-4 sm:w-5 sm:h-5" />
                                    <span className="hidden sm:inline">Scan</span>
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                            {/* Weight */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Weight (kg)</label>
                                <div className="relative group">
                                    <Scale className="absolute left-3 top-3.5 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.weight}
                                        onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                                        className="input-field pl-10 text-lg font-semibold text-slate-900 bg-white"
                                        placeholder="0.00"
                                        required
                                    />
                                </div>
                            </div>


                        </div>

                        {/* Quality Grade */}
                        <div>
                            <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2 sm:mb-3">Quality Grade</label>
                            <div className="grid grid-cols-3 gap-2 sm:gap-4">
                                {['A', 'B', 'C'].map((grade) => (
                                <button
                                    key={grade}
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, qualityGrade: grade }))}
                                    className={`
                                    relative overflow-hidden py-3 sm:py-4 rounded-lg sm:rounded-xl font-bold text-xl sm:text-2xl transition-all duration-200 touch-target
                                    ${formData.qualityGrade === grade 
                                        ? grade === 'A' ? 'bg-green-500 text-white shadow-green-200 shadow-lg scale-105' :
                                        grade === 'B' ? 'bg-yellow-500 text-white shadow-yellow-200 shadow-lg scale-105' :
                                        'bg-red-500 text-white shadow-red-200 shadow-lg scale-105'
                                        : 'bg-white border-2 border-slate-100 text-slate-400 hover:border-slate-300 hover:bg-slate-50'}
                                    `}
                                >
                                    {grade}
                                    {formData.qualityGrade === grade && (
                                        <div className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2">
                                            <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-white/80" />
                                        </div>
                                    )}
                                </button>
                                ))}
                            </div>
                        </div>

                        {/* Freshness */}
                        <div>
                            <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2 sm:mb-3">Freshness</label>
                            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3">
                                {['Excellent', 'Good', 'Fair', 'Poor'].map((grade) => (
                                <button
                                    key={grade}
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, freshness: grade }))}
                                    className={`
                                    sm:flex-1 py-2 px-3 sm:px-4 rounded-lg font-medium text-xs sm:text-sm transition-all border touch-target
                                    ${formData.freshness === grade 
                                        ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'}
                                    `}
                                >
                                    {grade}
                                </button>
                                ))}
                            </div>
                        </div>

                        {/* Damage Assessment */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Damage Assessment</label>
                            <textarea
                                value={formData.damage}
                                onChange={(e) => setFormData(prev => ({ ...prev, damage: e.target.value }))}
                                className="input-field min-h-[80px] resize-none text-slate-900 bg-white"
                                placeholder="Describe any visible damage (optional)..."
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 sm:gap-3 disabled:opacity-70 disabled:cursor-not-allowed touch-target"
                        >
                            {loading ? 'Processing...' : 'Submit Inspection'}
                            {!loading && <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />}
                        </button>
                    </form>
                </div>
            </div>
        </div>

        {/* Right Column: Trip Manifest */}
        <div className="lg:col-span-1">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6 lg:sticky lg:top-6 max-h-[50vh] lg:max-h-[calc(100vh-2rem)] overflow-y-auto">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                        <History className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
                        Manifest
                    </h3>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={loadTripManifest}
                            className="text-blue-600 hover:text-blue-800 p-1"
                            title="Refresh manifest"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                        <span className="text-[10px] sm:text-xs font-bold bg-slate-100 text-slate-600 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                            {tripManifest.pending.length + tripManifest.inspected.length}
                        </span>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-3 sm:mb-4">
                    <div className="flex-1 text-center py-1.5 sm:py-2 bg-blue-50 text-blue-700 font-bold text-[10px] sm:text-xs rounded-lg border border-blue-100">
                        Pending ({tripManifest.pending.length})
                    </div>
                    <div className="flex-1 text-center py-1.5 sm:py-2 bg-green-50 text-green-700 font-bold text-[10px] sm:text-xs rounded-lg border border-green-100">
                        Done ({tripManifest.inspected.length})
                    </div>
                </div>
                
                <div className="space-y-3">
                    {tripManifest.pending.length === 0 && tripManifest.inspected.length === 0 ? (
                        <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            <p className="text-sm">No items found for this trip</p>
                        </div>
                    ) : (
                        <>
                            {/* Pending Items */}
                            {tripManifest.pending.map((item) => (
                                <div key={item.id} className="p-3 bg-white rounded-xl border border-slate-200 hover:border-blue-300 transition-colors cursor-pointer group"
                                     onClick={() => handleScan(item.qr_code)}>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-mono text-xs text-slate-500 mb-1 group-hover:text-blue-600">{item.qr_code}</p>
                                            <p className="font-bold text-slate-900 text-sm">{item.species_name || 'Unknown Species'}</p>
                                        </div>
                                        <span className="text-xs font-bold text-orange-500 bg-orange-50 px-2 py-1 rounded-full">Pending</span>
                                    </div>
                                </div>
                            ))}

                            {/* Inspected Items (Last 5) */}
                            {tripManifest.inspected.slice(0, 5).map((item) => (
                                <div key={item.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 opacity-75">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="font-mono text-xs text-slate-500 mb-1">{item.qr_code}</p>
                                            <p className="font-bold text-slate-700 text-sm">{item.weight_kg} kg</p>
                                        </div>
                                        <div className={`
                                            w-6 h-6 rounded flex items-center justify-center font-bold text-xs
                                            ${item.quality_grade === 'A' ? 'bg-green-100 text-green-700' : 
                                              item.quality_grade === 'B' ? 'bg-yellow-100 text-yellow-700' : 
                                              'bg-red-100 text-red-700'}
                                        `}>
                                            {item.quality_grade}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </>
                    )}
                </div>
            </div>
        </div>
      </div>

      <QRScannerModal 
        isOpen={isScannerOpen} 
        onClose={() => setIsScannerOpen(false)} 
        onScan={handleScan} 
      />
    </div>
  );
};

export default WorkerEntry;
