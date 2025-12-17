import React, { useState, useEffect } from 'react';
import { mainAPI } from '../../services/api';
import { useToast } from '../Shared/Toast';
import { CheckCircle, XCircle, Clock, Ship, Calendar, MapPin, Users, AlertCircle } from 'lucide-react';

const TripApprovals = () => {
  const toast = useToast();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchPendingTrips();
  }, []);

  const fetchPendingTrips = async () => {
    try {
      const response = await mainAPI.getPendingTrips();
      if (response.success) {
        setTrips(response.trips);
      } else {
        setError('Failed to load pending trips');
      }
    } catch (err) {
      setError('Network error loading trips');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (tripId) => {
    setProcessingId(tripId);
    try {
      const response = await mainAPI.approveTrip(tripId);
      if (response.success) {
        // Remove from list
        setTrips(prev => prev.filter(t => t.id !== tripId));
        toast.success('Trip approved successfully!', 'Approved');
      } else {
        toast.error(response.message || 'Failed to approve trip', 'Error');
      }
    } catch (err) {
      toast.error('Error approving trip', 'Error');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading pending trips...</div>;

  return (
    <div className="max-w-5xl mx-auto animate-slide-up">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Trip Approvals</h2>
        <p className="text-slate-500">Review and approve new trip requests from captains.</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {trips.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
          <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-700">All Caught Up!</h3>
          <p className="text-slate-500">There are no pending trip requests at the moment.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {trips.map(trip => (
            <div key={trip.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      PENDING APPROVAL
                    </span>
                    <span className="text-slate-400 text-sm font-mono">{trip.trip_code}</span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-slate-800 mb-2">{trip.vessel_name}</h3>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                    <div className="flex items-center gap-2 text-slate-600">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span className="text-sm">{trip.departure_port}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Users className="w-4 h-4 text-slate-400" />
                      <span className="text-sm">{trip.crew_count} Crew</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="text-sm">{new Date(trip.departure_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Ship className="w-4 h-4 text-slate-400" />
                      <span className="text-sm">{trip.fishing_method}</span>
                    </div>
                  </div>

                  {/* Images Preview if available */}
                  {(trip.vessel_image || trip.gear_image) && (
                    <div className="flex gap-4 mt-4 pt-4 border-t border-slate-100">
                        {trip.vessel_image && (
                            <a href={trip.vessel_image} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">View Vessel Image</a>
                        )}
                        {trip.gear_image && (
                            <a href={trip.gear_image} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">View Gear Image</a>
                        )}
                    </div>
                  )}
                </div>

                <div className="flex flex-col justify-center gap-3 min-w-[150px]">
                  <button 
                    onClick={() => handleApprove(trip.id)}
                    disabled={processingId === trip.id}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {processingId === trip.id ? 'Approving...' : (
                        <>
                            <CheckCircle className="w-5 h-5" />
                            Approve Trip
                        </>
                    )}
                  </button>
                  {/* Reject button could go here */}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TripApprovals;
