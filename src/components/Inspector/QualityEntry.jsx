import React, { useState } from 'react';
import { inspectorAPI } from '../../services/api';
import { getCurrentUser } from '../../services/utils';
import QRScannerModal from '../Shared/QRScannerModal';
import { QrCode, Thermometer, Scale, Award, Search, Save, CheckCircle, Ship, Clock, Fish, AlertCircle } from 'lucide-react';

const QualityEntry = () => {
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [manualQr, setManualQr] = useState('');
  const [selectedCatch, setSelectedCatch] = useState(null);
  
  // Inspection Form Data
  const [inspectionData, setInspectionData] = useState({
    temperature: '',
    weight: '',
    grade: 'A'
  });

  const handleScan = async (code) => {
    setIsScannerOpen(false);
    fetchCatchDetails(code);
  };

  const handleManualSearch = (e) => {
    e.preventDefault();
    if(manualQr.trim()) {
        fetchCatchDetails(manualQr.trim());
    }
  };

  const fetchCatchDetails = async (code) => {
    setLoading(true);
    setSelectedCatch(null);
    try {
      const response = await inspectorAPI.getCatchDetails(code);
      
      if (response.success && response.data) {
        const fish = response.data;
        setSelectedCatch(fish);
        setInspectionData({
          temperature: fish.temperature || '',
          weight: fish.weight_kg || '',
          grade: fish.quality_grade || 'A'
        });
      } else {
        alert('Catch record not found for this QR code.');
      }
    } catch (error) {
      console.error("Error fetching catch details:", error);
      alert('Failed to retrieve catch details.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitInspection = async (e) => {
    e.preventDefault();
    if (!selectedCatch) return;

    setLoading(true);
    try {
      const user = getCurrentUser();
      await inspectorAPI.updateQuality({
        qrCode: selectedCatch.qr_code,
        ...inspectionData,
        inspectorId: user?.id
      });
      
      alert('Inspection Saved Successfully!');
      setSelectedCatch(null);
      setManualQr('');
      setInspectionData({ temperature: '', weight: '', grade: 'A' });
    } catch (error) {
      alert('Failed to save inspection');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Quality Data Entry</h2>
        <p className="text-slate-500">Scan QR codes or enter manually to record inspection data</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Search / Scan Section */}
        <div className="space-y-6">
            <div className="glass-card p-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <Search className="w-5 h-5 text-ocean-600" />
                    Find Catch Record
                </h3>
                
                <div className="space-y-4">
                    <button 
                        onClick={() => setIsScannerOpen(true)}
                        className="btn-primary w-full flex items-center justify-center gap-2 py-4"
                    >
                        <QrCode className="w-6 h-6" />
                        Scan QR Code
                    </button>

                    <div className="relative flex items-center py-2">
                        <div className="flex-grow border-t border-slate-200"></div>
                        <span className="flex-shrink-0 mx-4 text-slate-400 text-sm">OR</span>
                        <div className="flex-grow border-t border-slate-200"></div>
                    </div>

                    <form onSubmit={handleManualSearch} className="flex gap-2">
                        <input 
                            type="text" 
                            placeholder="Enter QR Code manually..." 
                            className="input-field"
                            value={manualQr}
                            onChange={(e) => setManualQr(e.target.value)}
                        />
                        <button type="submit" className="btn-secondary px-4">
                            <Search className="w-5 h-5" />
                        </button>
                    </form>
                </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                <h4 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Instructions
                </h4>
                <ul className="text-sm text-blue-700 space-y-2 list-disc list-inside">
                    <li>Scan the QR code attached to the fish or crate.</li>
                    <li>Verify the species and vessel information matches.</li>
                    <li>Measure the core temperature using a probe.</li>
                    <li>Weigh the catch if necessary.</li>
                    <li>Assign a quality grade (A, B, C, or Rejected).</li>
                </ul>
            </div>
        </div>

        {/* Inspection Form Section */}
        <div>
            {selectedCatch ? (
                <div className="glass-card p-6 animate-fade-in border-l-4 border-l-ocean-500">
                    <div className="flex justify-between items-start mb-6 pb-6 border-b border-slate-100">
                        <div>
                            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Selected Catch</p>
                            <h3 className="text-xl font-bold text-slate-800">{selectedCatch.species_name}</h3>
                            <p className="font-mono text-sm text-slate-500 mt-1">{selectedCatch.qr_code}</p>
                        </div>
                        {selectedCatch.images && selectedCatch.images[0] && (
                            <img src={selectedCatch.images[0]} alt="Fish" className="w-16 h-16 rounded-lg object-cover border border-slate-200" />
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-slate-50 p-3 rounded-lg">
                            <p className="text-xs text-slate-500 uppercase font-bold mb-1">Vessel</p>
                            <div className="flex items-center gap-2">
                                <Ship className="w-4 h-4 text-ocean-500" />
                                <span className="font-medium text-sm truncate">{selectedCatch.vessel_name || 'N/A'}</span>
                            </div>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-lg">
                            <p className="text-xs text-slate-500 uppercase font-bold mb-1">Date</p>
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-ocean-500" />
                                <span className="font-medium text-sm">
                                    {selectedCatch.departure_date ? new Date(selectedCatch.departure_date).toLocaleDateString() : 'N/A'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmitInspection} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Temperature (°C)</label>
                            <div className="relative">
                                <Thermometer className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                                <input
                                    type="number"
                                    step="0.1"
                                    value={inspectionData.temperature}
                                    onChange={e => setInspectionData({...inspectionData, temperature: e.target.value})}
                                    className="input-field pl-10"
                                    placeholder="e.g. 4.5"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Weight (kg)</label>
                            <div className="relative">
                                <Scale className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                                <input
                                    type="number"
                                    step="0.01"
                                    value={inspectionData.weight}
                                    onChange={e => setInspectionData({...inspectionData, weight: e.target.value})}
                                    className="input-field pl-10"
                                    placeholder="e.g. 12.5"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Quality Grade</label>
                            <div className="relative">
                                <Award className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                                <select
                                    value={inspectionData.grade}
                                    onChange={e => setInspectionData({...inspectionData, grade: e.target.value})}
                                    className="input-field pl-10"
                                >
                                    <option value="A">Grade A (Premium)</option>
                                    <option value="B">Grade B (Standard)</option>
                                    <option value="C">Grade C (Low)</option>
                                    <option value="Rejected">Rejected</option>
                                </select>
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading}
                            className="btn-primary w-full flex items-center justify-center gap-2 mt-6"
                        >
                            {loading ? 'Saving...' : (
                                <>
                                    <Save className="w-5 h-5" />
                                    Save Inspection Result
                                </>
                            )}
                        </button>
                    </form>
                </div>
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 p-12 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                    <Fish className="w-16 h-16 mb-4 opacity-20" />
                    <p className="font-medium">No catch selected</p>
                    <p className="text-sm">Scan a QR code to begin inspection</p>
                </div>
            )}
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

export default QualityEntry;
