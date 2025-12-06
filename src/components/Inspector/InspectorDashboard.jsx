import React, { useState, useEffect } from 'react';
import { inspectorAPI } from '../../services/api';
import { getCurrentUser } from '../../services/utils';
import QRScannerModal from '../Shared/QRScannerModal';
import { QrCode, Thermometer, Scale, Award, Search, ArrowLeft, Save, CheckCircle } from 'lucide-react';

const InspectorDashboard = () => {
  const [view, setView] = useState('dashboard'); // dashboard, trip-list, catch-list
  const [trips, setTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [catchLogs, setCatchLogs] = useState([]);
  const [selectedCatch, setSelectedCatch] = useState(null); // The fish being inspected
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Inspection Form Data
  const [inspectionData, setInspectionData] = useState({
    temperature: '',
    weight: '',
    grade: 'A'
  });

  useEffect(() => {
    loadTrips();
  }, []);

  const loadTrips = async () => {
    try {
      const response = await inspectorAPI.getTrips();
      if (response.success) {
        setTrips(response.trips);
      }
    } catch (error) {
      console.error("Failed to load trips", error);
    }
  };

  const handleTripSelect = async (trip) => {
    setLoading(true);
    setSelectedTrip(trip);
    try {
      const response = await inspectorAPI.getTripCatch(trip.id);
      if (response.success) {
        setCatchLogs(response.logs);
        setView('catch-list');
      }
    } catch (error) {
      console.error("Failed to load catch logs", error);
    } finally {
      setLoading(false);
    }
  };

  const handleScan = async (code) => {
    setIsScannerOpen(false);
    setLoading(true);
    try {
      // Fetch catch details including Vessel and Trip info
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
        alert('Catch record not found for this QR code. Please ensure it was logged by the Captain.');
      }
    } catch (error) {
      console.error("Error fetching catch details:", error);
      alert('Failed to retrieve catch details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInspectFish = (fish) => {
    setSelectedCatch(fish);
    setInspectionData({
      temperature: fish.temperature || '',
      weight: fish.weight_kg || '',
      grade: fish.quality_grade || 'A'
    });
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
      
      // Update local list if exists
      setCatchLogs(prev => prev.map(c => 
        c.qr_code === selectedCatch.qr_code 
          ? { ...c, ...inspectionData, quality_grade: inspectionData.grade, weight_kg: inspectionData.weight } 
          : c
      ));
      
      setSelectedCatch(null); // Close modal/form
      alert('Inspection Saved!');
    } catch (error) {
      alert('Failed to save inspection');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quality Inspection</h1>
          <p className="text-slate-500">Verify catch quality and compliance</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsScannerOpen(true)}
            className="btn-primary flex items-center gap-2"
          >
            <QrCode className="w-5 h-5" />
            Scan Tag
          </button>
        </div>
      </div>

      {/* Main Content */}
      {view === 'dashboard' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map(trip => (
            <div key={trip.id} onClick={() => handleTripSelect(trip)} className="glass-card p-6 cursor-pointer hover:border-ocean-400 transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg text-slate-800">{trip.vessel_name || 'Unknown Vessel'}</h3>
                  <p className="text-sm text-slate-500">{trip.trip_code}</p>
                </div>
                <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">Active</span>
              </div>
              <div className="text-sm text-slate-600 space-y-1">
                <p>Departed: {new Date(trip.departure_date).toLocaleDateString()}</p>
                <p>Port: {trip.departure_port}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {view === 'catch-list' && (
        <div className="animate-fade-in">
          <button onClick={() => setView('dashboard')} className="flex items-center text-slate-500 hover:text-slate-800 mb-4">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Trips
          </button>
          
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold mb-4">Catch Log: {selectedTrip?.trip_code}</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="p-3">Species</th>
                    <th className="p-3">QR Code</th>
                    <th className="p-3">Weight (kg)</th>
                    <th className="p-3">Grade</th>
                    <th className="p-3">Temp (°C)</th>
                    <th className="p-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {catchLogs.map((log, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-3 font-medium">{log.species_name}</td>
                      <td className="p-3 font-mono text-xs">{log.qr_code}</td>
                      <td className="p-3">{log.weight_kg || '-'}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          log.quality_grade === 'A' ? 'bg-green-100 text-green-700' :
                          log.quality_grade === 'B' ? 'bg-yellow-100 text-yellow-700' :
                          log.quality_grade ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {log.quality_grade || 'Pending'}
                        </span>
                      </td>
                      <td className="p-3">{log.temperature || '-'}</td>
                      <td className="p-3">
                        <button 
                          onClick={() => handleInspectFish(log)}
                          className="text-ocean-600 hover:text-ocean-800 font-medium"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Inspection Modal */}
      {selectedCatch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 animate-scale-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Inspect Catch</h3>
              <button onClick={() => setSelectedCatch(null)} className="text-slate-400 hover:text-slate-600">
                <ArrowLeft className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6 bg-slate-50 p-4 rounded-xl">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-slate-500">Species</p>
                  <p className="font-bold text-lg text-slate-800">{selectedCatch.species_name}</p>
                  <p className="text-xs font-mono text-slate-400 mt-1">{selectedCatch.qr_code}</p>
                </div>
                {selectedCatch.images && selectedCatch.images[0] && (
                  <img src={selectedCatch.images[0]} alt="Catch" className="w-16 h-16 rounded-lg object-cover border border-slate-200" />
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold">Vessel</p>
                  <p className="font-medium text-slate-800">{selectedCatch.vessel_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold">Trip Date</p>
                  <p className="font-medium text-slate-800">
                    {selectedCatch.departure_date ? new Date(selectedCatch.departure_date).toLocaleDateString() : 'N/A'}
                  </p>
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
                className="w-full btn-primary flex items-center justify-center gap-2 mt-4"
              >
                {loading ? 'Saving...' : 'Save Inspection'}
                <Save className="w-5 h-5" />
              </button>
            </form>
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

export default InspectorDashboard;
