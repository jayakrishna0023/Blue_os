import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { inspectorAPI } from '../../../shared/services/api';
import { Ship, Calendar, MapPin, ArrowRight, Activity } from 'lucide-react';

const InspectorHome = () => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Inspector Dashboard</h2>
          <p className="text-slate-500">Overview of active trips and inspections</p>
        </div>
        <div className="flex gap-3">
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                    <Activity className="w-5 h-5" />
                </div>
                <div>
                    <p className="text-xs text-slate-500 font-bold uppercase">Active Trips</p>
                    <p className="text-lg font-bold text-slate-800">{trips.length}</p>
                </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trips.map(trip => (
          <div 
            key={trip.id} 
            onClick={() => navigate(`/inspector/trip/${trip.id}`)} 
            className="glass-card p-6 cursor-pointer hover:border-ocean-400 transition-all group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Ship className="w-24 h-24 text-ocean-600" />
            </div>
            
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="font-bold text-lg text-slate-800">{trip.vessel_name || 'Unknown Vessel'}</h3>
                    <p className="text-sm text-slate-500 font-mono">{trip.trip_code}</p>
                </div>
                <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-bold">Active</span>
                </div>
                
                <div className="space-y-3 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-ocean-500" />
                        <span>Departed: {new Date(trip.departure_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-ocean-500" />
                        <span>Port: {trip.departure_port}</span>
                    </div>
                </div>

                <div className="mt-6 flex items-center text-ocean-600 font-medium text-sm group-hover:translate-x-1 transition-transform">
                    View Catch Logs <ArrowRight className="w-4 h-4 ml-1" />
                </div>
            </div>
          </div>
        ))}
        
        {trips.length === 0 && !loading && (
            <div className="col-span-full text-center py-12 bg-white/50 rounded-2xl border border-dashed border-slate-300">
                <Ship className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">No active trips found</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default InspectorHome;
