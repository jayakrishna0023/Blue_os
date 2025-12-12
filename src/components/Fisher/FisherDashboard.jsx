import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, fisherAPI } from '../../services/api';
import { getCurrentUser } from '../../services/utils';
import { User, LogOut, QrCode, Ship, Calendar, MapPin, Clock } from 'lucide-react';
import QRCode from 'qrcode';

const FisherDashboard = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [qrUrl, setQrUrl] = useState('');
  const user = getCurrentUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.qr_code) {
      QRCode.toDataURL(user.qr_code)
        .then(url => setQrUrl(url))
        .catch(err => console.error(err));
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'trips') {
      fetchTrips();
    }
  }, [activeTab]);

  const fetchTrips = async () => {
    setLoading(true);
    try {
      const response = await fisherAPI.getTrips(user.id);
      if (response.success) {
        setTrips(response.trips);
      }
    } catch (error) {
      console.error("Error fetching trips", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authAPI.logout();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-md mx-auto px-4 h-16 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <User className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-bold text-slate-900">Fisher Dashboard</h1>
          </div>
          <button onClick={handleLogout} className="text-slate-400 hover:text-red-600">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-md mx-auto flex">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 ${
              activeTab === 'profile' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'
            }`}
          >
            My Profile
          </button>
          <button
            onClick={() => setActiveTab('trips')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 ${
              activeTab === 'trips' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'
            }`}
          >
            My Trips
          </button>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 max-w-md mx-auto w-full p-4">
        {activeTab === 'profile' && (
          <div className="space-y-6 animate-fade-in">
            {/* ID Card */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-200">
              <div className="bg-blue-600 p-4 text-white text-center">
                <h2 className="text-lg font-bold">Fisher Identity Card</h2>
                <p className="text-blue-100 text-sm">BlueOS Network</p>
              </div>
              <div className="p-6 flex flex-col items-center">
                <div className="bg-white p-2 rounded-xl shadow-inner border border-slate-100 mb-4">
                  {qrUrl ? (
                    <img src={qrUrl} alt="Fisher QR" className="w-48 h-48" />
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center text-slate-400">Generating...</div>
                  )}
                </div>
                <p className="font-mono text-sm text-slate-400 mb-4">{user?.qr_code}</p>
                
                <h3 className="text-xl font-bold text-slate-900">{user?.full_name}</h3>
                <p className="text-slate-500">{user?.home_port}</p>
                
                <div className="w-full mt-6 space-y-3 text-sm">
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500">Mobile</span>
                    <span className="font-medium">{user?.mobile_number}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500">Father's Name</span>
                    <span className="font-medium">{user?.fathers_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Emergency</span>
                    <span className="font-medium text-red-600">{user?.emergency_contact_number}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'trips' && (
          <div className="space-y-4 animate-fade-in">
            {loading ? (
              <div className="text-center py-8 text-slate-500">Loading trips...</div>
            ) : trips.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
                <Ship className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No trips recorded yet.</p>
              </div>
            ) : (
              trips.map((trip, idx) => (
                <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-slate-800">{trip.vessel_name}</h3>
                      <p className="text-xs text-slate-500 font-mono">{trip.trip_code}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      trip.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {trip.status.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      {new Date(trip.departure_date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400" />
                      {new Date(trip.joined_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default FisherDashboard;
