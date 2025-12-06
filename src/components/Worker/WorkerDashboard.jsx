import React, { useState, useEffect } from 'react';
import { authAPI, mainAPI } from '../../services/api';
import { getCurrentUser } from '../../services/utils';
import QRScannerModal from '../Shared/QRScannerModal';
import { LogOut, QrCode, Scale, Thermometer, CheckCircle, AlertTriangle, Fish, Box } from 'lucide-react';

const WorkerDashboard = () => {
  const [trips, setTrips] = useState([]);
  const [crates, setCrates] = useState([]);
  const [selectedTripId, setSelectedTripId] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [formData, setFormData] = useState({
    qrCode: '',
    weight: '',
    qualityGrade: 'A',
    freshness: 'Excellent',
    damage: '',
    crateId: '',
    temperature: ''
  });

  const user = getCurrentUser();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [tripsRes, cratesRes] = await Promise.all([
        mainAPI.getAvailableTrips(),
        mainAPI.getCrates()
      ]);

      if (tripsRes.success && tripsRes.trips) {
        setTrips(tripsRes.trips);
      }
      if (cratesRes.success && cratesRes.crates) {
        setCrates(cratesRes.crates);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleLogout = () => {
    authAPI.logout();
  };

  const handleScan = (code) => {
    setFormData(prev => ({ ...prev, qrCode: code }));
    setIsScannerOpen(false);
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
        setFormData(prev => ({ 
            ...prev, 
            qrCode: '', 
            weight: '', 
            damage: '',
            // Keep crate, quality and freshness as they might be repetitive
        }));
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
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Quality Control</h1>
              <p className="text-xs text-slate-500">Inspector: {user?.full_name}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="text-slate-400 hover:text-red-600">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Trip Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">Select Active Trip</label>
          <select
            value={selectedTripId}
            onChange={(e) => setSelectedTripId(e.target.value)}
            className="input-field"
          >
            <option value="">-- Select Trip --</option>
            {trips.map(trip => (
              <option key={trip.id} value={trip.id}>
                {trip.trip_code} - {trip.vessel_name}
              </option>
            ))}
          </select>
        </div>

        {/* Inspection Form */}
        <div className="glass-card p-6 md:p-8">
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Fish className="w-5 h-5 text-blue-600" />
            Inspect Catch
          </h2>

          {message.text && (
            <div className={`mb-6 p-4 rounded-xl flex items-center gap-2 text-sm ${
              message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
            }`}>
              {message.type === 'error' ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* QR Code */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fish Tag QR</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <QrCode className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={formData.qrCode}
                    onChange={(e) => setFormData(prev => ({ ...prev, qrCode: e.target.value }))}
                    className="input-field pl-10"
                    placeholder="Scan or enter QR code"
                    required
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 rounded-xl transition-colors"
                >
                  Scan
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Weight */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Weight (kg)</label>
                <div className="relative">
                  <Scale className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                  <input
                    type="number"
                    step="0.01"
                    value={formData.weight}
                    onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                    className="input-field pl-10"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              {/* Crate Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Assign to Crate</label>
                <div className="relative">
                  <Box className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                  <select
                    value={formData.crateId}
                    onChange={(e) => setFormData(prev => ({ ...prev, crateId: e.target.value }))}
                    className="input-field pl-10"
                  >
                    <option value="">-- No Crate --</option>
                    {crates.map(crate => (
                      <option key={crate.id} value={crate.id}>
                        {crate.crate_code} ({crate.status})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Quality Grade */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Quality Grade</label>
              <div className="grid grid-cols-3 gap-4">
                {['A', 'B', 'C'].map((grade) => (
                  <button
                    key={grade}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, qualityGrade: grade }))}
                    className={`
                      py-3 rounded-xl font-bold text-lg transition-all
                      ${formData.qualityGrade === grade 
                        ? grade === 'A' ? 'bg-green-100 text-green-700 ring-2 ring-green-500' :
                          grade === 'B' ? 'bg-yellow-100 text-yellow-700 ring-2 ring-yellow-500' :
                          'bg-red-100 text-red-700 ring-2 ring-red-500'
                        : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}
                    `}
                  >
                    Grade {grade}
                  </button>
                ))}
              </div>
            </div>

            {/* Freshness */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Freshness Grade</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {['Excellent', 'Good', 'Fair', 'Poor'].map((grade) => (
                  <button
                    key={grade}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, freshness: grade }))}
                    className={`
                      py-2 px-3 rounded-lg font-medium text-sm transition-all border
                      ${formData.freshness === grade 
                        ? 'bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}
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
                className="input-field min-h-[80px]"
                placeholder="Describe any damage (optional)..."
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center gap-2"
            >
              {loading ? 'Saving...' : 'Submit Inspection'}
              {!loading && <CheckCircle className="w-5 h-5" />}
            </button>
          </form>
        </div>
      </main>

      <QRScannerModal 
        isOpen={isScannerOpen} 
        onClose={() => setIsScannerOpen(false)} 
        onScan={handleScan} 
      />
    </div>
  );
};

export default WorkerDashboard;
