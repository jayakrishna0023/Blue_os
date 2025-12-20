import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { mainAPI } from '../../services/api';
import { getCurrentUser } from '../../services/utils';
import { Ship, Calendar, MapPin, ArrowRight, Clock, Activity, CheckCircle, AlertCircle, FileCheck, RefreshCw } from 'lucide-react';

const WorkerHome = () => {
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const user = getCurrentUser();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [tripsRes, pendingRes] = await Promise.all([
        mainAPI.getAvailableTrips(),
        mainAPI.getPendingTrips()
      ]);
      
      if (tripsRes.success && tripsRes.trips) {
        setTrips(tripsRes.trips);
      }
      if (pendingRes.success && pendingRes.trips) {
        setPendingCount(pendingRes.trips.length);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <div className="mt-4 text-slate-500 font-medium">Loading trips...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400 opacity-10 rounded-full -ml-10 -mb-10 blur-2xl"></div>
        
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.full_name?.split(' ')[0] || 'Worker'}!</h1>
          <p className="text-blue-100 text-lg max-w-2xl">
            Ready to ensure quality? You have <span className="font-bold text-white">{trips.length} active trips</span> waiting for inspection today.
          </p>
          
          <div className="mt-8 flex flex-wrap gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 flex items-center gap-3 border border-white/10">
              <div className="bg-green-400/20 p-2 rounded-lg">
                <Activity className="w-5 h-5 text-green-300" />
              </div>
              <div>
                <p className="text-xs text-blue-200 uppercase tracking-wider">System Status</p>
                <p className="font-semibold">Operational</p>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 flex items-center gap-3 border border-white/10">
              <div className="bg-yellow-400/20 p-2 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-300" />
              </div>
              <div>
                <p className="text-xs text-blue-200 uppercase tracking-wider">Pending Tasks</p>
                <p className="font-semibold">{trips.length} Active Trips</p>
              </div>
            </div>

            <div 
                className="bg-white/10 backdrop-blur-sm rounded-lg p-4 flex items-center gap-3 border border-white/10 cursor-pointer hover:bg-white/20 transition-colors"
                onClick={() => navigate('approvals')}
            >
              <div className="bg-orange-400/20 p-2 rounded-lg">
                <FileCheck className="w-5 h-5 text-orange-300" />
              </div>
              <div>
                <p className="text-xs text-blue-200 uppercase tracking-wider">Approvals</p>
                <p className="font-semibold">{pendingCount} Requests</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Active Trips Grid */}
      <div>
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Ship className="w-5 h-5 text-blue-600" />
              Active Trips
            </h2>
            <p className="text-slate-500 text-sm mt-1">Select a vessel to begin quality control inspection</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map((trip) => (
            <div 
              key={trip.id} 
              className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden"
              onClick={() => navigate('entry', { state: { tripId: trip.id } })}
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-blue-50 p-3 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                    <Ship className="w-6 h-6 text-blue-600 group-hover:text-white" />
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide ${
                    trip.status === 'active' 
                      ? 'bg-green-100 text-green-700 border border-green-200' 
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}>
                    {trip.status?.toUpperCase() || 'ACTIVE'}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">
                  {trip.vessel_name}
                </h3>
                <p className="text-sm text-slate-500 mb-6 font-mono bg-slate-50 inline-block px-2 py-1 rounded">
                  ID: {trip.trip_code}
                </p>

                <div className="space-y-3 border-t border-slate-100 pt-4">
                  <div className="flex items-center text-sm text-slate-600">
                    <Calendar className="w-4 h-4 mr-3 text-slate-400" />
                    <span className="font-medium">{new Date(trip.departure_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center text-sm text-slate-600">
                    <MapPin className="w-4 h-4 mr-3 text-slate-400" />
                    <span className="font-medium">Port: {trip.port_name || 'Unknown'}</span>
                  </div>
                </div>
              </div>
              
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center group-hover:bg-blue-50 transition-colors">
                <span className="text-sm font-bold text-blue-600">Start Inspection</span>
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}

          {trips.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-16 bg-white rounded-2xl border-2 border-dashed border-slate-200">
              <div className="bg-slate-50 p-4 rounded-full mb-4">
                <Ship className="w-12 h-12 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">No Active Trips Found</h3>
              <p className="text-slate-500 max-w-md text-center mt-2">
                There are currently no trips marked as active. Please check back later or contact the administrator.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkerHome;
