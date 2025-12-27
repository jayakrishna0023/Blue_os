import React, { useState } from 'react';
import { inspectorAPI } from '../../services/api';
import { getCurrentUser } from '../../services/utils';
import { FRESHNESS_GRADES, QUALITY_GRADES } from '../../services/faoConstants';
import { useToast } from '../Shared/Toast';
import QRScannerModal from '../Shared/QRScannerModal';
import { QrCode, Thermometer, Scale, Award, Search, Save, CheckCircle, Ship, Clock, Fish, AlertCircle, Droplets, Eye, AlertTriangle, FileText } from 'lucide-react';

const QualityEntry = () => {
  const toast = useToast();
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [manualQr, setManualQr] = useState('');
  const [selectedCatch, setSelectedCatch] = useState(null);
  
  // Enhanced Inspection Form Data
  const [inspectionData, setInspectionData] = useState({
    temperature: '',
    weight: '',
    grade: 'A',
    freshness: 'excellent',
    eyeClarity: 'clear',
    gillColor: 'bright_red',
    skinCondition: 'intact',
    smell: 'fresh_sea',
    damageType: 'none',
    damageNotes: '',
    inspectorNotes: ''
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
      
      // Backend returns 'log' not 'data'
      if (response.success && response.log) {
        const fish = response.log;
        setSelectedCatch(fish);
        setInspectionData({
          temperature: fish.temperature || '',
          weight: fish.weight_kg || '',
          grade: fish.quality_grade || 'A',
          freshness: fish.freshness || 'excellent',
          eyeClarity: fish.eye_clarity || 'clear',
          gillColor: fish.gill_color || 'bright_red',
          skinCondition: fish.skin_condition || 'intact',
          smell: fish.smell || 'fresh_sea',
          damageType: fish.damage_type || 'none',
          damageNotes: fish.damage_notes || '',
          inspectorNotes: fish.inspector_notes || ''
        });
      } else {
        toast.warning('Catch record not found for this QR code.', 'Not Found');
      }
    } catch (error) {
      console.error("Error fetching catch details:", error);
      toast.error('Failed to retrieve catch details.', 'Error');
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
      
      toast.success('Inspection saved successfully!', 'Saved');
      setSelectedCatch(null);
      setManualQr('');
      setInspectionData({ 
        temperature: '', 
        weight: '', 
        grade: 'A',
        freshness: 'excellent',
        eyeClarity: 'clear',
        gillColor: 'bright_red',
        skinCondition: 'intact',
        smell: 'fresh_sea',
        damageType: 'none',
        damageNotes: '',
        inspectorNotes: ''
      });
    } catch (error) {
      toast.error('Failed to save inspection', 'Error');
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
                        {/* Temperature & Weight Row */}
                        <div className="grid grid-cols-2 gap-4">
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
                        </div>

                        {/* Freshness Assessment Section */}
                        <div className="pt-4 border-t border-slate-100">
                          <h4 className="font-medium text-slate-700 mb-3 flex items-center gap-2">
                            <Eye className="w-4 h-4 text-ocean-500" />
                            Freshness Assessment
                          </h4>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-medium text-slate-600 mb-1">Eye Clarity</label>
                              <select
                                value={inspectionData.eyeClarity}
                                onChange={e => setInspectionData({...inspectionData, eyeClarity: e.target.value})}
                                className="input-field text-sm"
                              >
                                <option value="clear">Clear & Bright</option>
                                <option value="slightly_cloudy">Slightly Cloudy</option>
                                <option value="cloudy">Cloudy</option>
                                <option value="sunken">Sunken/Dull</option>
                              </select>
                            </div>
                            
                            <div>
                              <label className="block text-xs font-medium text-slate-600 mb-1">Gill Color</label>
                              <select
                                value={inspectionData.gillColor}
                                onChange={e => setInspectionData({...inspectionData, gillColor: e.target.value})}
                                className="input-field text-sm"
                              >
                                <option value="bright_red">Bright Red</option>
                                <option value="dark_red">Dark Red</option>
                                <option value="pink">Pink</option>
                                <option value="brown">Brown/Grey</option>
                              </select>
                            </div>
                            
                            <div>
                              <label className="block text-xs font-medium text-slate-600 mb-1">Skin Condition</label>
                              <select
                                value={inspectionData.skinCondition}
                                onChange={e => setInspectionData({...inspectionData, skinCondition: e.target.value})}
                                className="input-field text-sm"
                              >
                                <option value="intact">Intact & Shiny</option>
                                <option value="slight_damage">Slight Damage</option>
                                <option value="scales_missing">Scales Missing</option>
                                <option value="damaged">Damaged</option>
                              </select>
                            </div>
                            
                            <div>
                              <label className="block text-xs font-medium text-slate-600 mb-1">Smell</label>
                              <select
                                value={inspectionData.smell}
                                onChange={e => setInspectionData({...inspectionData, smell: e.target.value})}
                                className="input-field text-sm"
                              >
                                <option value="fresh_sea">Fresh Sea Smell</option>
                                <option value="neutral">Neutral</option>
                                <option value="slight_odor">Slight Odor</option>
                                <option value="strong_odor">Strong Odor</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Damage Assessment */}
                        <div className="pt-4 border-t border-slate-100">
                          <h4 className="font-medium text-slate-700 mb-3 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                            Damage Assessment
                          </h4>
                          
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Damage Type</label>
                            <select
                              value={inspectionData.damageType}
                              onChange={e => setInspectionData({...inspectionData, damageType: e.target.value})}
                              className="input-field text-sm"
                            >
                              <option value="none">No Damage</option>
                              <option value="bruising">Bruising</option>
                              <option value="cuts">Cuts/Tears</option>
                              <option value="compression">Compression Damage</option>
                              <option value="net_marks">Net Marks</option>
                              <option value="predator">Predator Damage</option>
                              <option value="other">Other</option>
                            </select>
                          </div>
                          
                          {inspectionData.damageType !== 'none' && (
                            <div className="mt-3 animate-fade-in">
                              <label className="block text-xs font-medium text-slate-600 mb-1">Damage Notes</label>
                              <textarea
                                value={inspectionData.damageNotes}
                                onChange={e => setInspectionData({...inspectionData, damageNotes: e.target.value})}
                                className="input-field text-sm"
                                rows="2"
                                placeholder="Describe the damage..."
                              />
                            </div>
                          )}
                        </div>

                        {/* Overall Grade */}
                        <div className="pt-4 border-t border-slate-100">
                          <label className="block text-sm font-medium text-slate-700 mb-1">Overall Quality Grade</label>
                          <div className="grid grid-cols-4 gap-2">
                            {['A', 'B', 'C', 'Rejected'].map(g => (
                              <button
                                key={g}
                                type="button"
                                onClick={() => setInspectionData({...inspectionData, grade: g})}
                                className={`py-3 rounded-xl font-bold transition-all ${
                                  inspectionData.grade === g
                                    ? g === 'Rejected' 
                                      ? 'bg-red-500 text-white shadow-lg'
                                      : 'bg-ocean-500 text-white shadow-lg'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                {g === 'Rejected' ? 'REJ' : `Grade ${g}`}
                              </button>
                            ))}
                          </div>
                          <p className="text-xs text-slate-500 mt-2">
                            {inspectionData.grade === 'A' && 'Premium quality - suitable for sashimi/export'}
                            {inspectionData.grade === 'B' && 'Standard quality - suitable for fresh market'}
                            {inspectionData.grade === 'C' && 'Lower quality - suitable for processing'}
                            {inspectionData.grade === 'Rejected' && 'Not suitable for human consumption'}
                          </p>
                        </div>

                        {/* Inspector Notes */}
                        <div className="pt-4 border-t border-slate-100">
                          <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-slate-500" />
                            Inspector Notes (Optional)
                          </label>
                          <textarea
                            value={inspectionData.inspectorNotes}
                            onChange={e => setInspectionData({...inspectionData, inspectorNotes: e.target.value})}
                            className="input-field text-sm"
                            rows="2"
                            placeholder="Any additional observations..."
                          />
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
