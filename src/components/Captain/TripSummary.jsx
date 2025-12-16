import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle, Clock, MapPin, Anchor, Fish, AlertCircle, RefreshCw, Users } from 'lucide-react';
import { mainAPI } from '../../services/api';

const TripSummary = ({ trip, onComplete }) => {
  const [catchLogs, setCatchLogs] = useState([]);
  const [crewMembers, setCrewMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTripData = useCallback(async () => {
    if (!trip?.id) return;
    
    try {
      // Fetch both catch logs and crew in parallel
      const [catchResponse, crewResponse] = await Promise.all([
        mainAPI.getTripCatch(trip.id),
        mainAPI.getTripCrew(trip.id)
      ]);
      
      if (catchResponse.success) {
        setCatchLogs(catchResponse.logs || []);
      }
      if (crewResponse.success) {
        setCrewMembers(crewResponse.crew || []);
      }
    } catch (error) {
      console.error("Failed to fetch trip data", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [trip?.id]);

  // Fetch on mount and when trip changes
  useEffect(() => {
    if (trip?.id) {
      setLoading(true);
      fetchTripData();
    }
  }, [trip?.id, fetchTripData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTripData();
  };

  const handleCompleteTrip = () => {
    if (window.confirm('Are you sure you want to complete this trip? This action cannot be undone.')) {
      onComplete();
    }
  };

  if (!trip) return null;

  // Calculate totals from catch logs
  const totalWeight = catchLogs.reduce((sum, log) => sum + (parseFloat(log.weight_kg) || 0), 0);
  const totalCount = catchLogs.length;
  const speciesCount = [...new Set(catchLogs.map(log => log.species_name).filter(Boolean))].length;

  // Handle both camelCase (frontend) and snake_case (backend) property names
  const tripCode = trip.tripCode || trip.trip_code || 'N/A';
  const tripStart = trip.tripStart || trip.departure_date || trip.created_at;
  const departurePort = trip.departurePort || trip.departure_port || 'Unknown';
  const crewCount = crewMembers.length || trip.crewMembers || trip.crew_count || 0;
  const fuelLiters = trip.fuelLiters || trip.fuel_liters || 0;
  const iceKg = trip.iceKg || trip.ice_kg || 0;
  const totalExpenses = trip.totalExpenses || trip.total_expenses || 0;

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
      {/* Trip Details Card */}
      <div className="glass-card p-4 sm:p-6 md:p-8 text-center">
        <div className="flex justify-between items-start mb-4 sm:mb-6">
          <div></div>
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-ocean-100 text-ocean-600 rounded-full flex items-center justify-center">
            <Anchor className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 text-slate-400 hover:text-ocean-600 hover:bg-ocean-50 rounded-lg transition-colors"
            title="Refresh data"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
        
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1 sm:mb-2">Trip Summary</h2>
        <p className="text-sm sm:text-base text-slate-500 mb-6 sm:mb-8">Review trip details before completion</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8 text-left">
          <div className="bg-slate-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 space-y-3 sm:space-y-4">
            <h3 className="font-bold text-sm sm:text-base text-slate-700 mb-2">Trip Info</h3>
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <span className="text-xs sm:text-sm text-slate-500 flex items-center gap-1 sm:gap-2">
                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" /> Trip Code
              </span>
              <span className="font-mono font-bold text-xs sm:text-sm text-slate-800 truncate max-w-[120px]">{tripCode}</span>
            </div>
            
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <span className="text-xs sm:text-sm text-slate-500 flex items-center gap-1 sm:gap-2">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4" /> Started
              </span>
              <span className="font-medium text-xs sm:text-sm text-slate-800">
                {tripStart ? new Date(tripStart).toLocaleDateString() : 'N/A'}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-slate-500 flex items-center gap-1 sm:gap-2">
                <MapPin className="w-3 h-3 sm:w-4 sm:h-4" /> Port
              </span>
              <span className="font-medium text-xs sm:text-sm text-slate-800 truncate max-w-[100px]">{departurePort}</span>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 space-y-3 sm:space-y-4">
            <h3 className="font-bold text-sm sm:text-base text-slate-700 mb-2">Resources</h3>
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <span className="text-xs sm:text-sm text-slate-500">Crew</span>
              <span className="font-medium text-xs sm:text-sm text-slate-800">{crewCount}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
               <span className="text-xs sm:text-sm text-slate-500">Fuel</span>
               <span className="font-medium text-xs sm:text-sm text-slate-800">{fuelLiters} L</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
               <span className="text-xs sm:text-sm text-slate-500">Ice</span>
               <span className="font-medium text-xs sm:text-sm text-slate-800">{iceKg} kg</span>
            </div>
            <div className="flex justify-between items-center">
               <span className="text-xs sm:text-sm text-slate-500">Expenses</span>
               <span className="font-medium text-xs sm:text-sm text-slate-800">₹{totalExpenses}</span>
            </div>
          </div>
        </div>

        {/* Catch Summary */}
        <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 text-left">
          <h3 className="font-bold text-base sm:text-lg text-slate-800 mb-3 sm:mb-4 flex items-center gap-2">
            <Fish className="w-4 h-4 sm:w-5 sm:h-5 text-ocean-600" />
            Catch Statistics
            {loading && <span className="text-xs text-slate-400 animate-pulse ml-2">Loading...</span>}
          </h3>
          
          <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
            <div className="bg-ocean-50 p-3 sm:p-4 rounded-lg sm:rounded-xl text-center">
              <p className="text-[10px] sm:text-xs text-ocean-600 font-bold uppercase">Total Fish</p>
              <p className="text-xl sm:text-2xl font-bold text-ocean-800">{totalCount}</p>
            </div>
            <div className="bg-ocean-50 p-3 sm:p-4 rounded-lg sm:rounded-xl text-center">
              <p className="text-[10px] sm:text-xs text-ocean-600 font-bold uppercase">Weight</p>
              <p className="text-xl sm:text-2xl font-bold text-ocean-800">{totalWeight.toFixed(1)} <span className="text-sm">kg</span></p>
            </div>
            <div className="bg-ocean-50 p-3 sm:p-4 rounded-lg sm:rounded-xl text-center">
              <p className="text-[10px] sm:text-xs text-ocean-600 font-bold uppercase">Species</p>
              <p className="text-xl sm:text-2xl font-bold text-ocean-800">{speciesCount}</p>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="sm:hidden space-y-3">
            {catchLogs.length === 0 ? (
              <div className="p-4 text-center text-slate-400 bg-slate-50 rounded-xl">
                No catch recorded yet
              </div>
            ) : (
              catchLogs.map((log, idx) => (
                <div key={idx} className="bg-slate-50 rounded-xl p-3 flex items-center gap-3">
                  <div className="flex-shrink-0">
                    {log.images && log.images.length > 0 ? (
                      <img 
                        src={log.images[0]} 
                        alt={log.species_name} 
                        className="w-12 h-12 object-cover rounded-lg border border-slate-200"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-slate-200 rounded-lg flex items-center justify-center text-slate-400">
                        <Fish className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-800 text-sm truncate">{log.species_name}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        log.quality_grade === 'A' ? 'bg-green-100 text-green-700' :
                        log.quality_grade === 'B' ? 'bg-yellow-100 text-yellow-700' :
                        log.quality_grade ? 'bg-red-100 text-red-700' : 'bg-slate-200 text-slate-500'
                      }`}>
                        {log.quality_grade || '?'}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5 flex gap-2">
                      <span>{log.weight_kg || 0} kg</span>
                      <span>•</span>
                      <span className="truncate">{log.location_name || 'Unknown'}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 text-xs">
                <tr>
                  <th className="p-2 sm:p-3 rounded-tl-lg">Image</th>
                  <th className="p-2 sm:p-3">Species</th>
                  <th className="p-2 sm:p-3 hidden md:table-cell">Tag ID</th>
                  <th className="p-2 sm:p-3">Location</th>
                  <th className="p-2 sm:p-3">Weight</th>
                  <th className="p-2 sm:p-3">Grade</th>
                  <th className="p-2 sm:p-3 rounded-tr-lg hidden md:table-cell">Time</th>
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
                      <td className="p-2 sm:p-3">
                        {log.images && log.images.length > 0 ? (
                          <img 
                            src={log.images[0]} 
                            alt={log.species_name} 
                            className="w-8 h-8 sm:w-10 sm:h-10 object-cover rounded-lg border border-slate-200"
                          />
                        ) : (
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-300">
                            <Fish className="w-4 h-4 sm:w-5 sm:h-5" />
                          </div>
                        )}
                      </td>
                      <td className="p-2 sm:p-3 font-medium text-slate-800 text-xs sm:text-sm">{log.species_name}</td>
                      <td className="p-2 sm:p-3 font-mono text-[10px] sm:text-xs text-slate-500 hidden md:table-cell">{log.qr_code}</td>
                      <td className="p-2 sm:p-3 text-slate-600 text-xs sm:text-sm max-w-[100px] sm:max-w-[150px] truncate" title={log.location_name}>
                        {log.location_name || 'Unknown'}
                      </td>
                      <td className="p-2 sm:p-3 text-xs sm:text-sm">{log.weight_kg || '-'} kg</td>
                      <td className="p-2 sm:p-3">
                        <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-bold ${
                          log.quality_grade === 'A' ? 'bg-green-100 text-green-700' :
                          log.quality_grade === 'B' ? 'bg-yellow-100 text-yellow-700' :
                          log.quality_grade ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {log.quality_grade || 'Pending'}
                        </span>
                      </td>
                      <td className="p-2 sm:p-3 text-xs text-slate-500 hidden md:table-cell">
                        {log.timestamp || log.created_at 
                          ? new Date(log.timestamp || log.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
                          : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Crew Members Section */}
        {crewMembers.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 text-left">
            <h3 className="font-bold text-base sm:text-lg text-slate-800 mb-3 sm:mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
              Crew Members ({crewMembers.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {crewMembers.map((member, idx) => (
                <div key={idx} className="bg-slate-50 rounded-xl p-3 flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 text-sm truncate">{member.name || 'Unknown'}</p>
                    <p className="text-xs text-slate-500">{member.mobile || 'No contact'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={handleCompleteTrip}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 sm:py-4 rounded-xl shadow-lg shadow-red-500/30 transition-all active:scale-95 text-sm sm:text-base touch-target"
        >
          Complete Trip & Logout
        </button>
      </div>
    </div>
  );
};

export default TripSummary;
