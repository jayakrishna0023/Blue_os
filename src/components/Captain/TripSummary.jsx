import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, MapPin, Anchor, Fish, AlertCircle } from 'lucide-react';
import { mainAPI } from '../../services/api';

const TripSummary = ({ trip, onComplete }) => {
  const [catchLogs, setCatchLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (trip?.id) {
      fetchCatchLogs();
    }
  }, [trip]);

  const fetchCatchLogs = async () => {
    try {
      const response = await mainAPI.getTripCatch(trip.id);
      if (response.success) {
        setCatchLogs(response.logs);
      }
    } catch (error) {
      console.error("Failed to fetch catch logs", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTrip = () => {
    if (window.confirm('Are you sure you want to complete this trip? This action cannot be undone.')) {
      onComplete();
    }
  };

  if (!trip) return null;

  // Calculate totals
  const totalWeight = catchLogs.reduce((sum, log) => sum + (parseFloat(log.weight_kg) || 0), 0);
  const totalCount = catchLogs.length;
  const speciesCount = [...new Set(catchLogs.map(log => log.species_name))].length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Trip Details Card */}
      <div className="glass-card p-8 text-center">
        <div className="w-20 h-20 bg-ocean-100 text-ocean-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <Anchor className="w-10 h-10" />
        </div>
        
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Trip Summary</h2>
        <p className="text-slate-500 mb-8">Review trip details before completion</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 text-left">
          <div className="bg-slate-50 rounded-2xl p-6 space-y-4">
            <h3 className="font-bold text-slate-700 mb-2">Trip Info</h3>
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <span className="text-slate-500 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> Trip Code
              </span>
              <span className="font-mono font-bold text-slate-800">{trip.tripCode}</span>
            </div>
            
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <span className="text-slate-500 flex items-center gap-2">
                <Clock className="w-4 h-4" /> Started
              </span>
              <span className="font-medium text-slate-800">
                {new Date(trip.tripStart).toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-500 flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Port
              </span>
              <span className="font-medium text-slate-800">{trip.departurePort}</span>
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-6 space-y-4">
            <h3 className="font-bold text-slate-700 mb-2">Resources</h3>
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <span className="text-slate-500">Crew</span>
              <span className="font-medium text-slate-800">{trip.crewMembers || trip.crew_count}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
               <span className="text-slate-500">Fuel</span>
               <span className="font-medium text-slate-800">{trip.fuelLiters || trip.fuel_liters} L</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
               <span className="text-slate-500">Ice</span>
               <span className="font-medium text-slate-800">{trip.iceKg || trip.ice_kg} kg</span>
            </div>
            <div className="flex justify-between items-center">
               <span className="text-slate-500">Total Expenses</span>
               <span className="font-medium text-slate-800">₹{trip.totalExpenses || trip.total_expenses || 0}</span>
            </div>
          </div>
        </div>

        {/* Catch Summary */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-8 text-left">
          <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
            <Fish className="w-5 h-5 text-ocean-600" />
            Catch Statistics
          </h3>
          
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-ocean-50 p-4 rounded-xl text-center">
              <p className="text-xs text-ocean-600 font-bold uppercase">Total Fish</p>
              <p className="text-2xl font-bold text-ocean-800">{totalCount}</p>
            </div>
            <div className="bg-ocean-50 p-4 rounded-xl text-center">
              <p className="text-xs text-ocean-600 font-bold uppercase">Total Weight</p>
              <p className="text-2xl font-bold text-ocean-800">{totalWeight.toFixed(2)} kg</p>
            </div>
            <div className="bg-ocean-50 p-4 rounded-xl text-center">
              <p className="text-xs text-ocean-600 font-bold uppercase">Species Count</p>
              <p className="text-2xl font-bold text-ocean-800">{speciesCount}</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="p-3 rounded-tl-lg">Image</th>
                  <th className="p-3">Species</th>
                  <th className="p-3">Tag ID</th>
                  <th className="p-3">Location</th>
                  <th className="p-3">Weight</th>
                  <th className="p-3">Grade</th>
                  <th className="p-3 rounded-tr-lg">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {catchLogs.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-4 text-center text-slate-400">No catch recorded yet</td>
                  </tr>
                ) : (
                  catchLogs.map((log, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-3">
                        {log.images && log.images.length > 0 ? (
                          <img 
                            src={log.images[0]} 
                            alt={log.species_name} 
                            className="w-10 h-10 object-cover rounded-lg border border-slate-200"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-300">
                            <Fish className="w-5 h-5" />
                          </div>
                        )}
                      </td>
                      <td className="p-3 font-medium text-slate-800">{log.species_name}</td>
                      <td className="p-3 font-mono text-xs text-slate-500">{log.qr_code}</td>
                      <td className="p-3 text-slate-600 max-w-[150px] truncate" title={log.location_name}>
                        {log.location_name || 'Unknown'}
                      </td>
                      <td className="p-3">{log.weight_kg || '-'} kg</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          log.quality_grade === 'A' ? 'bg-green-100 text-green-700' :
                          log.quality_grade === 'B' ? 'bg-yellow-100 text-yellow-700' :
                          log.quality_grade ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {log.quality_grade || 'Pending'}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <button
          onClick={handleCompleteTrip}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-red-500/30 transition-all active:scale-95"
        >
          Complete Trip & Logout
        </button>
      </div>
    </div>
  );
};

export default TripSummary;
