import React, { useState, useEffect } from 'react';
import { Package, Plus, Trash2, QrCode, Save, Search, X, AlertTriangle } from 'lucide-react';
import QRScannerModal from '../Shared/QRScannerModal';
import { mainAPI } from '../../services/api';

const CrateManagement = ({ trip }) => {
  const [viewMode, setViewMode] = useState('list'); // list, create, inspect
  const [currentCrateFish, setCurrentCrateFish] = useState([]);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scanMode, setScanMode] = useState('add-fish'); // add-fish, inspect-crate
  const [inspectedCrate, setInspectedCrate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (!trip) {
      setError("No active trip found. Please start a trip first.");
    }
  }, [trip]);

  const handleScan = async (code) => {
    setIsScannerOpen(false);
    setError('');
    setSuccessMsg('');
    
    console.log(`Scanned code in mode ${scanMode}:`, code);

    if (scanMode === 'add-fish') {
      // Check if already in current list
      if (currentCrateFish.find(f => f.qr_code === code)) {
        setError('Fish already added to this crate');
        return;
      }

      setLoading(true);
      try {
        const response = await mainAPI.verifyFishForCrate(code);
        console.log("Verify response:", response);
        
        if (response.success) {
          setCurrentCrateFish(prev => [...prev, response.fish]);
          setSuccessMsg(`Added ${response.fish.species_name} (${response.fish.weight_kg}kg)`);
        } else {
          setError(response.message || 'Failed to verify fish tag');
        }
      } catch (err) {
        console.error("Scan error:", err);
        setError('Error verifying fish tag. Please try again.');
      } finally {
        setLoading(false);
      }
    } else if (scanMode === 'inspect-crate') {
      setLoading(true);
      try {
        const response = await mainAPI.inspectCrate(code);
        if (response.success) {
          setInspectedCrate(response);
          setViewMode('inspect');
        } else {
          setError(response.message || 'Crate not found');
        }
      } catch (err) {
        console.error("Inspect error:", err);
        setError('Failed to inspect crate');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSealCrate = async () => {
    if (currentCrateFish.length === 0) return;
    if (!trip?.id) {
      setError("Trip ID is missing. Cannot seal crate.");
      return;
    }

    setLoading(true);
    try {
      const fishQrs = currentCrateFish.map(f => f.qr_code);
      const response = await mainAPI.sealCrate(trip.id, fishQrs);
      
      if (response.success) {
        // Show success and the new Crate QR
        setInspectedCrate({
            crate: response.crate,
            contents: currentCrateFish,
            qrImageUrl: response.qrImageUrl
        });
        setViewMode('inspect');
        setCurrentCrateFish([]);
        setSuccessMsg("Crate sealed successfully!");
      } else {
        setError(response.message);
      }
    } catch (err) {
      console.error("Seal error:", err);
      setError('Failed to seal crate');
    } finally {
      setLoading(false);
    }
  };

  if (!trip) return (
    <div className="p-8 text-center bg-red-50 rounded-xl border border-red-200 text-red-600">
      <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
      <h3 className="font-bold text-lg">No Active Trip</h3>
      <p>Please start a trip to manage crates.</p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="glass-card p-6 mb-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Package className="w-6 h-6 text-ocean-600" />
            Crate Management
          </h2>
          <div className="flex gap-2">
            <button 
              onClick={() => { setScanMode('inspect-crate'); setIsScannerOpen(true); setError(''); }}
              className="btn-secondary py-2 px-4 text-sm flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              Scan Crate
            </button>
            <button 
              onClick={() => { setViewMode('create'); setCurrentCrateFish([]); setError(''); }}
              className="btn-primary py-2 px-4 text-sm flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Crate
            </button>
          </div>
        </div>
        {error && <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100 flex items-center gap-2"><AlertTriangle className="w-4 h-4"/> {error}</div>}
        {successMsg && <div className="mt-4 p-3 bg-green-50 text-green-600 rounded-lg text-sm border border-green-100">{successMsg}</div>}
      </div>

      {/* Create Mode */}
      {viewMode === 'create' && (
        <div className="glass-card p-6 animate-fade-in">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg">New Crate Packing</h3>
            <button onClick={() => setViewMode('list')} className="text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="bg-slate-50 rounded-xl p-8 text-center border-2 border-dashed border-slate-200 mb-6 hover:border-ocean-300 transition-colors cursor-pointer"
               onClick={() => { setScanMode('add-fish'); setIsScannerOpen(true); }}>
            <div className="flex flex-col items-center justify-center w-full h-full">
              <div className="bg-white p-4 rounded-full shadow-sm mb-3">
                <QrCode className="w-8 h-8 text-ocean-600" />
              </div>
              <span className="font-bold text-slate-700">Scan Fish Tag</span>
              <span className="text-sm text-slate-500">Tap here to scan and add fish</span>
            </div>
          </div>

          {/* List of added fish */}
          <div className="space-y-3 mb-6">
            {currentCrateFish.map((fish, idx) => (
              <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                <div>
                  <p className="font-bold text-slate-800">{fish.species_name}</p>
                  <p className="text-xs text-slate-500 font-mono">{fish.qr_code}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-600">{fish.weight_kg} kg</p>
                    {fish.quality_grade && <span className="text-xs bg-slate-100 px-1 rounded">Grade: {fish.quality_grade}</span>}
                  </div>
                  <button 
                    onClick={() => setCurrentCrateFish(prev => prev.filter((_, i) => i !== idx))}
                    className="text-slate-400 hover:text-red-500 p-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {currentCrateFish.length === 0 && (
              <p className="text-center text-slate-400 text-sm italic">No fish added yet</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <div className="text-right mr-auto">
              <p className="text-xs text-slate-500">Total Weight</p>
              <p className="font-bold text-lg text-ocean-700">
                {currentCrateFish.reduce((sum, f) => sum + (parseFloat(f.weight_kg) || 0), 0).toFixed(2)} kg
              </p>
            </div>
            <button 
              onClick={handleSealCrate}
              disabled={currentCrateFish.length === 0 || loading}
              className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sealing...' : 'Seal & Generate QR'}
              <Save className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Inspect Mode */}
      {viewMode === 'inspect' && inspectedCrate && (
        <div className="glass-card p-6 animate-fade-in">
           <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Package className="w-5 h-5 text-ocean-600" />
              Crate Details
            </h3>
            <button onClick={() => setViewMode('list')} className="text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl">
                <p className="text-xs text-slate-500 mb-1">Crate ID</p>
                <p className="font-mono font-bold text-lg text-slate-800">{inspectedCrate.crate.crate_qr}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl">
                  <p className="text-xs text-slate-500 mb-1">Total Weight</p>
                  <p className="font-bold text-lg text-slate-800">{parseFloat(inspectedCrate.crate.total_weight).toFixed(2)} kg</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl">
                  <p className="text-xs text-slate-500 mb-1">Fish Count</p>
                  <p className="font-bold text-lg text-slate-800">{inspectedCrate.crate.fish_count}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
               {inspectedCrate.qrImageUrl ? (
                 <img src={inspectedCrate.qrImageUrl} alt="Crate QR" className="w-48 h-48 object-contain" />
               ) : (
                 <div className="w-48 h-48 bg-slate-100 flex items-center justify-center text-slate-400">
                   No QR Image
                 </div>
               )}
               <p className="mt-2 text-sm text-slate-500">Scan to view contents</p>
            </div>
          </div>

          <div className="mt-8">
            <h4 className="font-bold text-slate-700 mb-3">Contents</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="p-3 rounded-tl-lg">Species</th>
                    <th className="p-3">Tag ID</th>
                    <th className="p-3">Weight</th>
                    <th className="p-3 rounded-tr-lg">Quality</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {inspectedCrate.contents.map((fish, idx) => (
                    <tr key={idx}>
                      <td className="p-3 font-medium text-slate-800">{fish.species_name}</td>
                      <td className="p-3 font-mono text-slate-500">{fish.qr_code}</td>
                      <td className="p-3">{fish.weight_kg} kg</td>
                      <td className="p-3">{fish.quality_grade || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* List Mode (Default Placeholder) */}
      {viewMode === 'list' && (
        <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Select "New Crate" to start packing or "Scan Crate" to inspect.</p>
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
