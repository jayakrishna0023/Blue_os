import React, { useState, useEffect, useCallback } from 'react';
import { mainAPI } from '../../services/api';
import { getGeolocation, getLocationName, compressImage, getCurrentUser } from '../../services/utils';
import CameraModal from '../Shared/CameraModal';
import QRScannerModal from '../Shared/QRScannerModal';
import { useToast } from '../Shared/Toast';
import { MapPin, Camera, QrCode, Plus, Trash2, Save, Fish, Image as ImageIcon, X } from 'lucide-react';

// Storage keys for data persistence
const SPECIES_LIST_STORAGE_KEY = 'blueos_species_list_draft';
const CURRENT_ENTRY_STORAGE_KEY = 'blueos_current_entry_draft';

const SpeciesEntry = ({ trip, onCatchSaved }) => {
  const toast = useToast();
  const [location, setLocation] = useState({ lat: null, lng: null, name: 'Fetching...' });
  
  // Load saved species list from storage
  const [speciesList, setSpeciesList] = useState(() => {
    try {
      const saved = sessionStorage.getItem(SPECIES_LIST_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  
  // Load saved current entry from storage
  const [currentEntry, setCurrentEntry] = useState(() => {
    try {
      const saved = sessionStorage.getItem(CURRENT_ENTRY_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Ignore
    }
    return {
      species: '',
      customSpecies: '',
      images: [],
      qrCodes: []
    };
  });
  
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Save species list to sessionStorage whenever it changes
  useEffect(() => {
    try {
      sessionStorage.setItem(SPECIES_LIST_STORAGE_KEY, JSON.stringify(speciesList));
    } catch (e) {
      console.warn('Failed to save species list:', e);
    }
  }, [speciesList]);

  // Save current entry to sessionStorage whenever it changes
  useEffect(() => {
    try {
      sessionStorage.setItem(CURRENT_ENTRY_STORAGE_KEY, JSON.stringify(currentEntry));
    } catch (e) {
      console.warn('Failed to save current entry:', e);
    }
  }, [currentEntry]);

  // Clear drafts function
  const clearDrafts = useCallback(() => {
    sessionStorage.removeItem(SPECIES_LIST_STORAGE_KEY);
    sessionStorage.removeItem(CURRENT_ENTRY_STORAGE_KEY);
  }, []);

  // Fetch location on mount with improved accuracy
  useEffect(() => {
    let watchId = null;
    
    const fetchLocation = async () => {
      try {
        // Get initial location quickly
        const loc = await getGeolocation({ enableHighAccuracy: true, timeout: 10000 });
        const name = await getLocationName(loc.latitude, loc.longitude);
        setLocation({ 
          lat: loc.latitude, 
          lng: loc.longitude, 
          name,
          accuracy: loc.accuracy 
        });
        
        // Continue watching for better accuracy
        if (navigator.geolocation) {
          watchId = navigator.geolocation.watchPosition(
            async (position) => {
              const newLoc = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                accuracy: position.coords.accuracy
              };
              // Only update if accuracy improves
              setLocation(prev => {
                if (!prev.accuracy || position.coords.accuracy < prev.accuracy) {
                  return { ...prev, ...newLoc };
                }
                return prev;
              });
            },
            (err) => console.warn('Location watch error:', err),
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
          );
        }
      } catch (error) {
        console.error('Location error:', error);
        setLocation(prev => ({ ...prev, name: 'Location Unavailable - Check GPS Settings' }));
      }
    };
    
    fetchLocation();
    
    return () => {
      if (watchId && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);

  const handleImageCapture = async (imageSrc) => {
    const compressed = await compressImage(imageSrc);
    setCurrentEntry(prev => ({
      ...prev,
      images: [...prev.images, compressed]
    }));
  };

  const handleQRScan = async (code) => {
    // Check if already in current list
    if (currentEntry.qrCodes.includes(code)) {
      toast.warning('This QR code is already in your current list', 'Duplicate');
      return;
    }
    
    // Check if already in species list being built
    const isInSpeciesList = speciesList.some(entry => entry.qrCodes.includes(code));
    if (isInSpeciesList) {
      toast.warning('This QR code is already added to this session', 'Duplicate');
      return;
    }
    
    // Validate with backend if QR is already used in database
    try {
      const validation = await mainAPI.validateQR(code);
      if (validation.success && validation.isUsed) {
        toast.error(validation.message || `QR already used for ${validation.species}`, 'Already Logged');
        return;
      }
    } catch (error) {
      console.error('QR validation error:', error);
      // Continue anyway if validation fails
    }
    
    // Add to current entry
    setCurrentEntry(prev => ({
      ...prev,
      qrCodes: [...prev.qrCodes, code]
    }));
    toast.success('QR Code scanned successfully', 'Added');
  };

  const handleAddSpecies = () => {
    const speciesName = currentEntry.species === 'Other' ? currentEntry.customSpecies : currentEntry.species;
    
    if (!speciesName) {
      toast.warning('Please select a species', 'Validation');
      return;
    }
    if (currentEntry.qrCodes.length === 0) {
      toast.warning('Please scan at least one QR code', 'Validation');
      return;
    }

    setSpeciesList(prev => [...prev, { ...currentEntry, speciesName, timestamp: new Date() }]);
    
    // Reset current entry
    setCurrentEntry({
      species: '',
      customSpecies: '',
      images: [],
      qrCodes: []
    });
  };

  const handleSaveSession = async () => {
    if (speciesList.length === 0) return;
    
    if (!trip?.id) {
      toast.error("No active trip found. Please restart the trip.", "Error");
      return;
    }

    setLoading(true);

    try {
      const user = getCurrentUser();
      const catchSessionId = `CS_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;

      // Save each species entry
      const promises = speciesList.flatMap(entry => 
        entry.qrCodes.map(qr => 
          mainAPI.saveSpecies({
            tripId: trip.id,
            qr: qr,
            species: entry.speciesName,
            images: entry.images,
            latitude: location.lat,
            longitude: location.lng,
            locationName: location.name,
            userId: user?.id,
            catchSessionId: catchSessionId,
            timestamp: entry.timestamp
          })
        )
      );

      const results = await Promise.all(promises);
      
      // Check for failures
      const failures = results.filter(r => !r.success);
      const successes = results.filter(r => r.success);
      
      if (failures.length > 0 && successes.length === 0) {
        // All failed
        console.error("All entries failed:", failures);
        const duplicateError = failures.find(f => f.isDuplicate);
        if (duplicateError) {
          toast.error(duplicateError.message, 'Duplicate QR');
        } else {
          toast.error(failures[0].message || 'Failed to save catch', 'Save Failed');
        }
      } else if (failures.length > 0) {
        // Some failed, some succeeded
        console.warn("Partial save:", { successes: successes.length, failures: failures.length });
        toast.warning(`${successes.length} saved, ${failures.length} failed (possibly duplicates)`, 'Partial Save');
        // Still clear and notify since some were saved
        clearDrafts();
        setSpeciesList([]);
        setCurrentEntry({
          species: '',
          customSpecies: '',
          images: [],
          qrCodes: []
        });
        if (onCatchSaved) {
          onCatchSaved();
        }
      } else {
        toast.success('Catch Session Saved Successfully!', 'Saved');
        // Clear drafts on successful save
        clearDrafts();
        setSpeciesList([]);
        setCurrentEntry({
          species: '',
          customSpecies: '',
          images: [],
          qrCodes: []
        });
        // Notify parent to refresh summary
        if (onCatchSaved) {
          onCatchSaved();
        }
      }
    } catch (error) {
      console.error("Save Session Error:", error);
      toast.error('Failed to save session. Please try again.', 'Error');
    } finally {
      setLoading(false);
    }
  };

  const commonSpecies = [
    "Tuna", "Mackerel", "Sardine", "Snapper", "Grouper", "Barracuda", "Squid", "Prawns"
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Location Header */}
      <div className="glass-card p-4 flex items-center justify-between bg-ocean-50/50">
        <div className="flex items-center gap-3">
          <div className="bg-ocean-100 p-2 rounded-full">
            <MapPin className="w-5 h-5 text-ocean-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Current Location</p>
            <p className="font-medium text-slate-800">{location.name}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">Coordinates</p>
          <p className="font-mono text-xs text-slate-600">
            {location.lat?.toFixed(4)}, {location.lng?.toFixed(4)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Entry Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Fish className="w-5 h-5 text-ocean-500" />
              New Catch Entry
            </h3>

            <div className="space-y-4">
              
              {/* Scan First */}
              <button
                  onClick={() => setIsScannerOpen(true)}
                  className="w-full flex items-center justify-center p-6 bg-ocean-50 border-2 border-dashed border-ocean-200 rounded-xl hover:bg-ocean-100 transition-all group"
                >
                  <div className="text-center">
                    <QrCode className="w-8 h-8 text-ocean-600 mx-auto mb-2" />
                    <span className="block font-bold text-ocean-700">Scan QR Code</span>
                    <span className="text-xs text-ocean-500">Use camera to scan fish tag</span>
                  </div>
              </button>

              {/* QR Codes Display */}
              {currentEntry.qrCodes.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-lg border border-slate-100">
                  {currentEntry.qrCodes.map((code, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-slate-200 text-slate-700 font-mono text-sm rounded-full shadow-sm">
                      <QrCode className="w-3 h-3 text-slate-400" />
                      {code}
                      <button 
                        onClick={() => setCurrentEntry(prev => ({ ...prev, qrCodes: prev.qrCodes.filter((_, i) => i !== idx) }))}
                        className="ml-1 text-slate-400 hover:text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Species Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Select Species</label>
                <select
                  value={currentEntry.species}
                  onChange={(e) => setCurrentEntry(prev => ({ ...prev, species: e.target.value }))}
                  className="input-field text-slate-900 bg-white"
                >
                  <option value="">-- Select Species --</option>
                  {commonSpecies.map(s => <option key={s} value={s}>{s}</option>)}
                  <option value="Other">Other</option>
                </select>
              </div>

              {currentEntry.species === 'Other' && (
                <div className="animate-fade-in">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Specify Species</label>
                  <input
                    type="text"
                    value={currentEntry.customSpecies}
                    onChange={(e) => setCurrentEntry(prev => ({ ...prev, customSpecies: e.target.value }))}
                    className="input-field text-slate-900 bg-white"
                    placeholder="Enter species name"
                  />
                </div>
              )}

              {/* Photo Button */}
              <div>
                <button
                  onClick={() => setIsCameraOpen(true)}
                  className="w-full flex items-center justify-center p-3 border border-slate-300 rounded-xl hover:bg-slate-50 transition-all"
                >
                  <Camera className="w-5 h-5 text-slate-500 mr-2" />
                  <span className="text-sm font-medium text-slate-600">Add Photos ({currentEntry.images.length})</span>
                </button>
              </div>

              {/* Previews */}
              {currentEntry.images.length > 0 && (
                <div className="flex gap-2 overflow-x-auto py-2">
                  {currentEntry.images.map((img, idx) => (
                    <div key={idx} className="relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-slate-200">
                      <img src={img} alt="Catch" className="w-full h-full object-cover" />
                      <button 
                        onClick={() => setCurrentEntry(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }))}
                        className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={handleAddSpecies}
                className="w-full btn-primary flex items-center justify-center gap-2 mt-4"
              >
                <Plus className="w-5 h-5" />
                Add to Session
              </button>
            </div>
          </div>
        </div>

        {/* Session List */}
        <div className="space-y-4">
          <div className="glass-card p-6 h-full flex flex-col">
            <h3 className="text-lg font-bold mb-4 flex items-center justify-between">
              <span>Current Session</span>
              <span className="text-sm font-normal text-slate-500">{speciesList.length} entries</span>
            </h3>

            <div className="flex-1 overflow-y-auto space-y-3 max-h-[500px]">
              {speciesList.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <Fish className="w-12 h-12 mx-auto mb-2 opacity-20" />
                  <p>No species added yet</p>
                </div>
              ) : (
                speciesList.map((item, idx) => (
                  <div key={idx} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex justify-between items-start">
                    <div>
                      <p className="font-bold text-slate-800">{item.speciesName}</p>
                      <p className="text-xs text-slate-500">{item.qrCodes.length} fish tagged</p>
                      <div className="flex gap-1 mt-1">
                        {item.images.length > 0 && <ImageIcon className="w-3 h-3 text-slate-400" />}
                      </div>
                    </div>
                    <button 
                      onClick={() => setSpeciesList(prev => prev.filter((_, i) => i !== idx))}
                      className="text-slate-400 hover:text-red-500 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {speciesList.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <button
                  onClick={handleSaveSession}
                  disabled={loading}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-green-500/30 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? 'Saving...' : 'Save Session'}
                  {!loading && <Save className="w-5 h-5" />}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <CameraModal 
        isOpen={isCameraOpen} 
        onClose={() => setIsCameraOpen(false)} 
        onCapture={handleImageCapture} 
      />
      
      <QRScannerModal 
        isOpen={isScannerOpen} 
        onClose={() => setIsScannerOpen(false)} 
        onScan={handleQRScan} 
      />
    </div>
  );
};

export default SpeciesEntry;
