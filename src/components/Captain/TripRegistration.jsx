import React, { useState, useEffect, useCallback } from 'react';
import { mainAPI, fisherAPI } from '../../services/api';
import { generateTripCode, getCurrentUser } from '../../services/utils';
import { FISHING_METHODS, PORTS, TARGET_SPECIES } from '../../services/constants';
import { Ship, Calendar, MapPin, Users, Fuel, Snowflake, DollarSign, AlertCircle, Camera, Fish, QrCode, Trash2, CheckCircle } from 'lucide-react';
import QRScannerModal from '../Shared/QRScannerModal';
import CameraModal from '../Shared/CameraModal';
import { useToast } from '../Shared/Toast';

// Storage key for form data persistence
const TRIP_FORM_STORAGE_KEY = 'blueos_trip_form_draft';
const TRIP_CREW_STORAGE_KEY = 'blueos_trip_crew_draft';

const TripRegistration = ({ onTripCreated, existingTrip }) => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [activeCameraField, setActiveCameraField] = useState(null); // 'vesselImage' or 'gearImage'
  
  // Load saved crew list from storage
  const [crewList, setCrewList] = useState(() => {
    try {
      const saved = sessionStorage.getItem(TRIP_CREW_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Load saved form data from storage
  const [formData, setFormData] = useState(() => {
    try {
      const saved = sessionStorage.getItem(TRIP_FORM_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          tripCode: parsed.tripCode || '',
          fishingMethod: parsed.fishingMethod || '',
          departurePort: parsed.departurePort || '',
          tripStart: parsed.tripStart || new Date().toISOString().slice(0, 16),
          expectedReturn: parsed.expectedReturn || '',
          targetSpecies: parsed.targetSpecies || '',
          vesselImage: parsed.vesselImage || null,
          gearImage: parsed.gearImage || null
        };
      }
    } catch {
      // Ignore parse errors
    }
    return {
      tripCode: '',
      fishingMethod: '',
      departurePort: '',
      tripStart: new Date().toISOString().slice(0, 16),
      expectedReturn: '',
      targetSpecies: '',
      vesselImage: null,
      gearImage: null
    };
  });

  // Save form data to sessionStorage whenever it changes
  useEffect(() => {
    try {
      sessionStorage.setItem(TRIP_FORM_STORAGE_KEY, JSON.stringify(formData));
    } catch (e) {
      console.warn('Failed to save form data:', e);
    }
  }, [formData]);

  // Save crew list to sessionStorage whenever it changes
  useEffect(() => {
    try {
      sessionStorage.setItem(TRIP_CREW_STORAGE_KEY, JSON.stringify(crewList));
    } catch (e) {
      console.warn('Failed to save crew list:', e);
    }
  }, [crewList]);

  // Clear saved drafts after successful submission
  const clearDrafts = useCallback(() => {
    sessionStorage.removeItem(TRIP_FORM_STORAGE_KEY);
    sessionStorage.removeItem(TRIP_CREW_STORAGE_KEY);
  }, []);

  useEffect(() => {
    if (existingTrip) {
      setFormData(prev => ({ ...prev, ...existingTrip }));
      // Clear drafts if we have an existing trip
      clearDrafts();
    }
  }, [existingTrip, clearDrafts]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Removed handleFileChange as we are now forcing camera capture

  const openCamera = (field) => {
    setActiveCameraField(field);
    setShowCamera(true);
  };

  const handleCapture = (imageSrc) => {
    if (activeCameraField) {
      setFormData(prev => ({ ...prev, [activeCameraField]: imageSrc }));
    }
    setShowCamera(false);
    setActiveCameraField(null);
  };

  const handleScan = async (data) => {
    if (data) {
      // Expected format: FISHER-{MOBILE}-{RANDOM}
      
      // Check if already added
      if (crewList.some(c => c.qrCode === data)) {
        toast.warning('Crew member already added!', 'Duplicate');
        return;
      }

      try {
        // Resolve QR code to actual fisher details
        const response = await fisherAPI.resolveQR(data);
        
        if (response.success && response.fisher) {
          const fisher = response.fisher;
          setCrewList(prev => [...prev, { 
            id: fisher.id, // Use actual numeric fisher ID
            qrCode: data, // Keep QR for reference
            name: fisher.full_name || `Fisher ${data.slice(-4)}`,
            mobile: fisher.mobile_number,
            scannedAt: new Date() 
          }]);
          toast.success(`Added ${fisher.full_name} to crew`, 'Crew Added');
        } else {
          // If fisher not found, alert the user
          toast.error('Fisher not found in registry. Please check the QR code.', 'Invalid QR');
        }
      } catch (error) {
        console.error('Error resolving fisher QR:', error);
        toast.error('Failed to verify fisher. Please try again.', 'Network Error');
      }
      
      setShowScanner(false);
    }
  };

  const removeCrew = (id) => {
    setCrewList(prev => prev.filter(c => c.id !== id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation: Ensure images are captured
    if (!formData.vesselImage) {
        setError('Vessel image is required. Please capture a photo.');
        return;
    }
    if (!formData.gearImage) {
        setError('Gear image is required. Please capture a photo.');
        return;
    }

    try {
      const user = getCurrentUser();
      
      const tripData = {
        ...formData,
        crewMembers: crewList.length, // Auto-calculate count
        crewIds: crewList.map(c => c.id), // Send IDs to backend
        vesselName: user?.vesselName || user?.vessel_name || 'Unknown Vessel',
        vesselId: user?.vessel_id,
        vesselOwnerId: user?.owner_id,
        captainId: user?.id // Include captain's user ID for trip lookup
      };

      const response = await mainAPI.saveTrip(tripData);
      if (response.success) {
        // Clear drafts on successful submission
        clearDrafts();
        setCrewList([]);
        onTripCreated({ ...tripData, id: response.tripId });
      } else {
        setError(response.message || 'Failed to save trip');
      }
    } catch (err) {
      console.error(err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const user = getCurrentUser();

  if (existingTrip) {
    return (
      <div className="glass-card p-4 sm:p-6 text-center">
        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
          <Ship className="w-6 h-6 sm:w-8 sm:h-8" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-2">Trip Status</h2>
        <p className="text-sm sm:text-base text-slate-500 mb-4 sm:mb-6 px-2">
            {existingTrip.status === 'active' 
                ? 'You have an active trip. Go to the Catch Log tab to record species.' 
                : 'Your trip is pending verification by a coordinator.'}
        </p>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 text-left max-w-md mx-auto bg-slate-50 p-3 sm:p-4 rounded-xl">
          <div>
            <p className="text-[10px] sm:text-xs text-slate-400">Trip Code</p>
            <p className="font-mono font-bold text-sm sm:text-base truncate text-black">{existingTrip.trip_code || existingTrip.tripCode || 'Pending'}</p>
          </div>
          <div>
            <p className="text-[10px] sm:text-xs text-slate-400">Status</p>
            <span className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs font-bold text-black ${existingTrip.status === 'active' ? 'bg-green-100' : 'bg-yellow-100'}`}>
              {existingTrip.status === 'active' ? 'Active' : 'Pending'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="glass-card p-4 sm:p-6 md:p-8">
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
          <div className="bg-ocean-100 p-2 sm:p-3 rounded-lg sm:rounded-xl">
            <Ship className="w-5 h-5 sm:w-6 sm:h-6 text-ocean-600" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">New Trip</h2>
            <p className="text-xs sm:text-sm text-slate-500 hidden sm:block">Enter details for verification</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 sm:mb-6 bg-red-50 text-red-600 p-3 sm:p-4 rounded-lg sm:rounded-xl flex items-center gap-2 text-xs sm:text-sm">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <span className="line-clamp-2">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Trip Code Display - Now Pending */}
          <div className="bg-slate-50 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-slate-200 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <label className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Trip Code</label>
              <div className="text-base sm:text-lg font-mono font-bold text-slate-400 mt-0.5 sm:mt-1 truncate">
                Pending
              </div>
            </div>
            <div className="bg-yellow-100 text-yellow-700 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold flex-shrink-0">
              DRAFT
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {/* Trip Code (Read Only) */}
            <div className="col-span-full">
              <label className="block text-sm font-medium text-slate-700 mb-1">Trip Code</label>
              <div className="relative">
                <input
                  type="text"
                  name="tripCode"
                  value={formData.tripCode}
                  readOnly
                  className="input-field bg-slate-100 font-mono text-slate-500"
                />
              </div>
            </div>

            {/* Fishing Method */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fishing Method</label>
              <select
                name="fishingMethod"
                value={formData.fishingMethod}
                onChange={handleChange}
                className="input-field text-slate-900 bg-white"
              >
                <option value="">Select Method</option>
                {FISHING_METHODS.map(method => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
            </div>

            {/* Target Species */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Target Species</label>
              <div className="relative">
                <Fish className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                <select
                  name="targetSpecies"
                  value={formData.targetSpecies}
                  onChange={handleChange}
                  className="input-field pl-10 text-slate-900 bg-white"
                >
                  <option value="">Select Species</option>
                  {TARGET_SPECIES.map(species => (
                    <option key={species} value={species}>{species}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Departure Port */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Departure Port</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                <select
                  name="departurePort"
                  value={formData.departurePort}
                  onChange={handleChange}
                  className="input-field pl-10 text-slate-900 bg-white"
                >
                  <option value="">Select Port</option>
                  {PORTS.map(port => (
                    <option key={port} value={port}>{port}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Dates */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Departure Time</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                <input
                  type="datetime-local"
                  name="tripStart"
                  value={formData.tripStart}
                  onChange={handleChange}
                  className="input-field pl-10 text-slate-900 bg-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Expected Return</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                <input
                  type="datetime-local"
                  name="expectedReturn"
                  value={formData.expectedReturn}
                  onChange={handleChange}
                  className="input-field pl-10 text-slate-900 bg-white"
                  required
                />
              </div>
            </div>

            {/* Crew Management (Replaces simple count) */}
            <div className="col-span-full bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-bold text-slate-700">Crew Members ({crewList.length})</label>
                <button
                  type="button"
                  disabled={showScanner}
                  onClick={() => {
                    if (!showScanner) {
                      setShowScanner(true);
                    }
                  }}
                  className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <QrCode className="w-4 h-4" />
                  Scan Crew QR
                </button>
              </div>

              {crewList.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-lg">
                  No crew members added yet. Scan their QR codes to add them to the trip.
                </div>
              ) : (
                <div className="space-y-2">
                  {crewList.map((crew) => (
                    <div key={crew.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                          <Users className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{crew.name}</p>
                          <p className="text-xs text-slate-500 font-mono">{crew.id}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeCrew(crew.id)}
                        className="text-red-400 hover:text-red-600 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Images - Replaced with Real-Time Capture */}
            <div className="col-span-full space-y-4">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Verification Photos</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Vessel Image */}
                <div 
                    onClick={() => openCamera('vesselImage')}
                    className={`relative h-48 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden group `}
                >
                    {formData.vesselImage ? (
                        <>
                            <img src={formData.vesselImage} alt="Vessel" className="absolute inset-0 w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="bg-white/20 backdrop-blur-md p-2 rounded-full text-white">
                                    <Camera className="w-6 h-6" />
                                </div>
                            </div>
                            <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center shadow-lg">
                                <CheckCircle className="w-3 h-3 mr-1" /> Captured
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="bg-blue-100 p-4 rounded-full mb-3 group-hover:scale-110 transition-transform">
                                <Camera className="w-8 h-8 text-blue-600" />
                            </div>
                            <p className="text-sm font-medium text-slate-600">Capture Vessel</p>
                            <p className="text-xs text-slate-400 mt-1">Tap to open camera</p>
                        </>
                    )}
                </div>

                {/* Gear Image */}
                <div 
                    onClick={() => openCamera('gearImage')}
                    className={`relative h-48 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden group`}
                >
                    {formData.gearImage ? (
                        <>
                            <img src={formData.gearImage} alt="Gear" className="absolute inset-0 w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="bg-white/20 backdrop-blur-md p-2 rounded-full text-white">
                                    <Camera className="w-6 h-6" />
                                </div>
                            </div>
                            <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center shadow-lg">
                                <CheckCircle className="w-3 h-3 mr-1" /> Captured
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="bg-blue-100 p-4 rounded-full mb-3 group-hover:scale-110 transition-transform">
                                <Camera className="w-8 h-8 text-blue-600" />
                            </div>
                            <p className="text-sm font-medium text-slate-600">Capture Gear</p>
                            <p className="text-xs text-slate-400 mt-1">Tap to open camera</p>
                        </>
                    )}
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-ocean-600 hover:bg-ocean-700 text-white font-bold py-4 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-ocean-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? 'Submitting...' : (
              <>
                <Ship className="w-5 h-5" />
                Submit Trip Request
              </>
            )}
          </button>
        </form>
      </div>

      {/* QR Scanner Modal */}
      {showScanner && (
        <QRScannerModal
          isOpen={showScanner}
          onScan={handleScan}
          onClose={() => setShowScanner(false)}
          title="Scan Crew Member QR"
        />
      )}

      {/* Camera Modal for Real-Time Capture */}
      {showCamera && (
        <CameraModal
            isOpen={showCamera}
            onClose={() => setShowCamera(false)}
            onCapture={handleCapture}
            title={activeCameraField === 'vesselImage' ? 'Capture Vessel' : 'Capture Gear'}
            metadata={{
                vesselCode: user?.vesselName || 'Unknown',
                purpose: 'Trip Registration'
            }}
        />
      )}
    </div>
  );
};

export default TripRegistration;
