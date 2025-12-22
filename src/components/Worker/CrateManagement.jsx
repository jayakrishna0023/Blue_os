import React, { useState, useEffect, useCallback } from 'react';
import { Package, Plus, Trash2, QrCode, Save, Search, X, AlertTriangle, Ship, RefreshCw, ChevronDown } from 'lucide-react';
import QRScannerModal from '../Shared/QRScannerModal';
import { mainAPI } from '../../services/api';
import { useToast } from '../Shared/Toast';
import { getCurrentUser } from '../../services/utils';

// Storage keys for persistence
const CRATE_FISH_STORAGE_KEY = 'blueos_crate_fish_draft';
const CRATE_TRIP_STORAGE_KEY = 'blueos_crate_trip_selection';

const CrateManagement = () => {
  const toast = useToast();
  const user = getCurrentUser();
  
  // Trip selection
  const [activeTrips, setActiveTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(() => {
    try {
      const saved = sessionStorage.getItem(CRATE_TRIP_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loadingTrips, setLoadingTrips] = useState(true);
  
  // Crate management
  const [viewMode, setViewMode] = useState('list'); // list, scan-crate, inspect
  const [currentCrate, setCurrentCrate] = useState(null); // Store the scanned crate
  const [currentCrateFish, setCurrentCrateFish] = useState([]);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scanMode, setScanMode] = useState('scan-crate'); // scan-crate, add-fish
  const [inspectedCrate, setInspectedCrate] = useState(null);
  const [loading, setLoading] = useState(false);

  // Save current crate fish to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem(CRATE_FISH_STORAGE_KEY, JSON.stringify(currentCrateFish));
    } catch (e) {
      console.warn('Failed to save crate fish:', e);
    }
  }, [currentCrateFish]);

  // Save selected trip to sessionStorage
  useEffect(() => {
    try {
      if (selectedTrip) {
        sessionStorage.setItem(CRATE_TRIP_STORAGE_KEY, JSON.stringify(selectedTrip));
      }
    } catch (e) {
      console.warn('Failed to save trip selection:', e);
    }
  }, [selectedTrip]);

  // Clear drafts after sealing crate
  const clearCrateDraft = useCallback(() => {
    sessionStorage.removeItem(CRATE_FISH_STORAGE_KEY);
  }, []);

  useEffect(() => {
    loadActiveTrips();
  }, []);

  const loadActiveTrips = async () => {
    setLoadingTrips(true);
    try {
      const response = await mainAPI.getActiveTripsForCrates();
      if (response.success && response.trips) {
        setActiveTrips(response.trips);
        // Auto-select first trip if available and no saved selection
        if (response.trips.length > 0 && !selectedTrip) {
          setSelectedTrip(response.trips[0]);
        }
      }
    } catch (error) {
      console.error('Error loading trips:', error);
      toast.error('Failed to load active trips', 'Error');
    } finally {
      setLoadingTrips(false);
    }
  };

  const handleScan = async (code) => {
    setIsScannerOpen(false);
    
    console.log(`Scanned code in mode ${scanMode}:`, code);

    if (scanMode === 'scan-crate') {
      // Scan pre-generated crate QR
      setLoading(true);
      try {
        const response = await mainAPI.inspectCrate(code);
        console.log("Inspect response:", response);
        
        if (response.success) {
          setCurrentCrate(response.crate);
          setCurrentCrateFish(response.contents || []);
          setViewMode('add-fish');
          toast.success(`Crate loaded! Ready to add fish.`, 'Crate Found');
        } else {
          toast.error(response.message || 'Crate not found. Make sure this is a valid pre-generated crate QR.', 'Error');
        }
      } catch (err) {
        console.error("Scan error:", err);
        toast.error('Error scanning crate. Please try again.', 'Error');
      } finally {
        setLoading(false);
      }
    } else if (scanMode === 'add-fish') {
      // Check if already in current crate
      if (currentCrateFish.find(f => f.qr_code === code)) {
        toast.warning('This fish is already added to this crate', 'Already Added');
        return;
      }

      setLoading(true);
      try {
        const response = await mainAPI.verifyFishForCrate(code);
        console.log("Verify response:", response);
        
        if (response.success) {
          setCurrentCrateFish(prev => [...prev, response.fish]);
          const newTotal = currentCrateFish.reduce((sum, f) => sum + (parseFloat(f.weight_kg) || 0), 0) + (parseFloat(response.fish.weight_kg) || 0);
          toast.success(`Added ${response.fish.species_name} (${response.fish.weight_kg}kg) • Total: ${newTotal.toFixed(2)}kg`, 'Fish Added');
        } else {
          // More descriptive error messages
          if (response.message?.includes('already packed')) {
            toast.error('This fish is already packed in another crate', 'Already in Crate');
          } else if (response.message?.includes('not found')) {
            toast.error('Fish tag not found. Make sure this fish was logged first.', 'Not Found');
          } else {
            toast.error(response.message || 'Failed to verify fish tag', 'Error');
          }
        }
      } catch (err) {
        console.error("Scan error:", err);
        toast.error('Error verifying fish tag. Please try again.', 'Error');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSealCrate = async () => {
    if (currentCrateFish.length === 0) {
      toast.warning('Add at least one fish to the crate', 'Empty Crate');
      return;
    }
    
    if (!currentCrate?.id) {
      toast.error('No crate loaded', 'Error');
      return;
    }

    setLoading(true);
    try {
      // Update crate with fish count
      const response = await mainAPI.updateCrateWithFish(currentCrate.id, currentCrateFish);
      
      if (response.success) {
        setInspectedCrate({
            crate: response.crate,
            contents: currentCrateFish,
            qrImageUrl: currentCrate.qr_image_url
        });
        setViewMode('inspect');
        // Reset
        setCurrentCrate(null);
        setCurrentCrateFish([]);
        toast.success('Crate updated successfully with fish!', 'Success');
      } else {
        toast.error(response.message || 'Failed to update crate', 'Error');
      }
    } catch (err) {
      console.error("Update error:", err);
      toast.error('Failed to update crate', 'Error');
    } finally {
      setLoading(false);
    }
  };

  const removeFishFromCrate = (idx) => {
    const fish = currentCrateFish[idx];
    setCurrentCrateFish(prev => prev.filter((_, i) => i !== idx));
    toast.info(`Removed ${fish.species_name}`, 'Removed');
  };

  if (loadingTrips) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500">Loading active trips...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Package className="w-6 h-6 text-blue-600" />
              Crate Management
            </h2>
            <p className="text-slate-500 text-sm mt-1">Scan pre-generated QR codes and add fish to crates</p>
          </div>
          <button 
            onClick={() => { setScanMode('scan-crate'); setIsScannerOpen(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium text-sm shadow-lg shadow-blue-500/20"
          >
            <QrCode className="w-4 h-4" />
            Scan Crate QR
          </button>
        </div>
      </div>

      {/* Add Fish Mode */}
      {viewMode === 'add-fish' && currentCrate && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm animate-fade-in">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg text-slate-900">Add Fish to Crate</h3>
            <button onClick={() => { setViewMode('list'); setCurrentCrate(null); setCurrentCrateFish([]); }} className="text-slate-400 hover:text-slate-600 p-1">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Crate Info */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mb-6">
            <p className="text-xs text-blue-600 font-medium">Crate ID</p>
            <p className="font-mono font-bold text-lg text-slate-800">{currentCrate.crate_qr}</p>
          </div>

          {/* Scan Button */}
          <div 
            className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-8 text-center border-2 border-dashed border-blue-200 mb-6 hover:border-blue-400 transition-colors cursor-pointer group"
            onClick={() => { setScanMode('add-fish'); setIsScannerOpen(true); }}
          >
            <div className="w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <QrCode className="w-8 h-8 text-blue-600" />
            </div>
            <span className="font-bold text-slate-700 text-lg">Scan Fish Tag</span>
            <p className="text-sm text-slate-500 mt-1">Tap to scan and add fish to this crate</p>
          </div>

          {/* Live Crate Weight Summary */}
          {currentCrateFish.length > 0 && (
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <Package className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs text-emerald-600 font-medium">Crate Total Weight</p>
                    <p className="font-bold text-2xl text-emerald-700">
                      {currentCrateFish.reduce((sum, f) => sum + (parseFloat(f.weight_kg) || 0), 0).toFixed(2)} kg
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">Fish Count</p>
                  <p className="font-bold text-xl text-slate-700">{currentCrateFish.length}</p>
                </div>
              </div>
            </div>
          )}

          {/* List of added fish */}
          <div className="space-y-3 mb-6">
            <div className="flex justify-between items-center">
              <h4 className="font-medium text-slate-700">Fish in Crate ({currentCrateFish.length})</h4>
              {currentCrateFish.length > 0 && (
                <button 
                  onClick={() => setCurrentCrateFish([])}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Clear All
                </button>
              )}
            </div>
            
            {currentCrateFish.map((fish, idx) => (
              <div key={idx} className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100 hover:border-blue-200 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-sm">{idx + 1}</span>
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{fish.species_name}</p>
                    <p className="text-xs text-slate-500 font-mono">{fish.qr_code?.substring(0, 25)}...</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-bold text-slate-700">{fish.weight_kg} kg</p>
                    {fish.quality_grade && (
                      <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                        Grade: {fish.quality_grade}
                      </span>
                    )}
                  </div>
                  <button 
                    onClick={() => removeFishFromCrate(idx)}
                    className="text-slate-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            
            {currentCrateFish.length === 0 && (
              <div className="text-center py-8 text-slate-400">
                <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No fish added yet</p>
                <p className="text-xs">Scan fish tags to add them to this crate</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center pt-4 border-t border-slate-100">
            <div>
              <p className="text-xs text-slate-500">Total Weight</p>
              <p className="font-bold text-2xl text-blue-700">
                {currentCrateFish.reduce((sum, f) => sum + (parseFloat(f.weight_kg) || 0), 0).toFixed(2)} kg
              </p>
            </div>
            <button 
              onClick={handleSealCrate}
              disabled={currentCrateFish.length === 0 || loading}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Crate
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Inspect Mode */}
      {viewMode === 'inspect' && inspectedCrate && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm animate-fade-in">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              Crate Details
            </h3>
            <button onClick={() => setViewMode('list')} className="text-slate-400 hover:text-slate-600 p-1">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-100">
                <p className="text-xs text-blue-600 font-medium mb-1">Crate ID</p>
                <p className="font-mono font-bold text-xl text-slate-800 break-all">{inspectedCrate.crate.crate_qr}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-500 mb-1">Total Weight</p>
                  <p className="font-bold text-2xl text-slate-800">{parseFloat(inspectedCrate.crate.total_weight || 0).toFixed(2)} <span className="text-sm font-normal text-slate-500">kg</span></p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-500 mb-1">Fish Count</p>
                  <p className="font-bold text-2xl text-slate-800">{inspectedCrate.crate.fish_count || inspectedCrate.contents?.length || 0}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center bg-white p-6 rounded-xl border-2 border-dashed border-slate-200">
              {inspectedCrate.qrImageUrl ? (
                <img src={inspectedCrate.qrImageUrl} alt="Crate QR" className="w-48 h-48 object-contain" />
              ) : (
                <div className="w-48 h-48 bg-slate-100 rounded-xl flex items-center justify-center">
                  <QrCode className="w-16 h-16 text-slate-300" />
                </div>
              )}
              <p className="mt-3 text-sm text-slate-500 font-medium">Scan to view contents</p>
            </div>
          </div>

          <div className="mt-8">
            <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
              Contents
              <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                {inspectedCrate.contents?.length || 0} items
              </span>
            </h4>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="p-4 font-medium">#</th>
                    <th className="p-4 font-medium">Species</th>
                    <th className="p-4 font-medium">Tag ID</th>
                    <th className="p-4 font-medium">Weight</th>
                    <th className="p-4 font-medium">Quality</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(inspectedCrate.contents || []).map((fish, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-4 text-slate-400">{idx + 1}</td>
                      <td className="p-4 font-medium text-slate-800">{fish.species_name}</td>
                      <td className="p-4 font-mono text-xs text-slate-500">{fish.qr_code?.substring(0, 20)}...</td>
                      <td className="p-4 font-medium">{fish.weight_kg} kg</td>
                      <td className="p-4">
                        {fish.quality_grade ? (
                          <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                            {fish.quality_grade}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={() => { setViewMode('create'); setCurrentCrateFish([]); }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Pack Another Crate
            </button>
          </div>
        </div>
      )}

      {/* List Mode (Default) */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Package className="w-10 h-10 text-blue-300" />
            </div>
            <h3 className="font-bold text-slate-700 text-lg mb-2">Ready to Add Fish</h3>
            <p className="text-slate-500 max-w-md mx-auto">
              Scan a pre-generated crate QR code to get started. The admin must generate crate QR codes before you can add fish.
            </p>
            <div className="flex justify-center gap-3 mt-6">
              <button 
                onClick={() => { setScanMode('scan-crate'); setIsScannerOpen(true); }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
              >
                <QrCode className="w-4 h-4" />
                Scan Crate QR
              </button>
            </div>
          </div>
        </div>
      )}

      <QRScannerModal 
        isOpen={isScannerOpen} 
        onClose={() => setIsScannerOpen(false)} 
        onScan={handleScan} 
      />
    </div>
  );
};

export default CrateManagement;
