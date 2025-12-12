import React, { useState, useEffect } from 'react';
import { mainAPI } from '../../services/api';
import { getCurrentUser } from '../../services/utils';
import { Ship, Calendar, MapPin, Clock, CheckCircle, XCircle, AlertCircle, DollarSign } from 'lucide-react';
import TripExpenseForm from './TripExpenseForm';

const TripHistory = () => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const user = getCurrentUser();

  useEffect(() => {
    if (user?.vessel_name) {
      fetchTrips();
    } else {
        // Fallback: Try to fetch trips even if vessel name is missing from local storage
        // The API might be able to infer it from the user ID in the token/session
        fetchTrips();
    }
  }, []);

  const fetchTrips = async () => {
    try {
      // Pass vessel name if available, otherwise let backend handle it
      const vesselName = user?.vessel_name || '';
      const response = await mainAPI.getCaptainTrips(vesselName);
      if (response.success) {
        setTrips(response.trips);
      } else {
        // Don't show error immediately, just empty list
        setTrips([]);
      }
    } catch (err) {
      console.error("History fetch error", err);
      if (err.response && err.response.status === 404) {
        setError('Server update required. Please restart the application.');
      } else {
        setError('Network error loading history');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return (
          <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 w-fit">
            <CheckCircle className="w-3 h-3" />
            APPROVED
          </span>
        );
      case 'pending':
        return (
          <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 w-fit">
            <Clock className="w-3 h-3" />
            PENDING
          </span>
        );
      case 'rejected':
        return (
          <span className="bg-red-100 text-red-800 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 w-fit">
            <XCircle className="w-3 h-3" />
            REJECTED
          </span>
        );
      default:
        return (
          <span className="bg-slate-100 text-slate-800 text-xs font-bold px-2 py-1 rounded-full w-fit">
            {status.toUpperCase()}
          </span>
        );
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading history...</div>;

  return (
    <div className="max-w-4xl mx-auto animate-slide-up">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Trip History</h2>
        <p className="text-slate-500">Track the status of your trip registrations and view past voyages.</p>
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
            <Ship className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-700">No Trips Found</h3>
          <p className="text-slate-500">You haven't registered any trips yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {trips.map(trip => (
            <div key={trip.id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getStatusBadge(trip.status)}
                    <span className="text-slate-400 text-xs font-mono">
                        {new Date(trip.created_at || trip.departure_date).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-slate-800">
                        {trip.status === 'active' ? trip.trip_code : 'Trip Request'}
                    </h3>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-3">
                    <div className="flex items-center gap-2 text-slate-600">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span className="text-sm">{trip.departure_port}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Ship className="w-4 h-4 text-slate-400" />
                      <span className="text-sm">{trip.fishing_method}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className="text-sm">
                            {trip.expected_return_date ? new Date(trip.expected_return_date).toLocaleDateString() : 'N/A'}
                        </span>
                    </div>
                  </div>
                </div>

                {trip.status === 'active' && (
                    <div className="flex flex-col justify-center items-end border-l border-slate-100 pl-6 gap-2">
                        <div>
                            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1 text-right">Trip Code</p>
                            <p className="font-mono text-xl font-bold text-blue-600 text-right">{trip.trip_code}</p>
                        </div>
                        <button
                            onClick={() => {
                                setSelectedTrip(trip);
                                setShowExpenseModal(true);
                            }}
                            className="flex items-center gap-1 text-sm bg-green-50 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors"
                        >
                            <DollarSign className="w-4 h-4" />
                            Add Expenses
                        </button>
                    </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Expense Modal */}
      {showExpenseModal && selectedTrip && (
        <TripExpenseForm
          trip={selectedTrip}
          onClose={() => {
            setShowExpenseModal(false);
            setSelectedTrip(null);
          }}
          onUpdate={() => {
            setShowExpenseModal(false);
            setSelectedTrip(null);
            fetchTrips(); // Refresh list
          }}
        />
      )}
    </div>
  );
};

export default TripHistory;
