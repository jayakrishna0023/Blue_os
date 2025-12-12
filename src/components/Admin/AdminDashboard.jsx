import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, adminAPI } from '../../services/api';
import { getCurrentUser } from '../../services/utils';
import { 
  LayoutDashboard, Ship, Anchor, Fish, Users, QrCode, 
  LogOut, ChevronRight, CheckCircle, XCircle, Clock, FileText, 
  MapPin, Calendar, Search, Filter, ArrowLeft, Waves
} from 'lucide-react';

const AdminDashboard = () => {
  const [activeView, setActiveView] = useState('overview');
  const [stats, setStats] = useState({ vessels: 0, trips: 0, species: 0, fish: 0 });
  const [vessels, setVessels] = useState([]);
  const [trips, setTrips] = useState([]);
  const [users, setUsers] = useState([]);
  const [pendingRegistrations, setPendingRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Drill-down state
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [tripDetails, setTripDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [selectedVessel, setSelectedVessel] = useState(null);

  // Search and Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const navigate = useNavigate();
  const user = getCurrentUser();

  // Reset filters when view changes
  useEffect(() => {
    setSearchTerm('');
    setFilterStatus('all');
  }, [activeView]);

  // Filter Logic
  const filteredVessels = vessels.filter(v => {
    const matchesSearch = (v.vessel_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                          (v.registration_number?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                          (v.owner_name?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || v.vessel_type === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const filteredTrips = trips.filter(t => {
    const matchesSearch = (t.trip_code?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                          (t.vessel_name?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || t.status === filterStatus; // Changed trip_status to status
    return matchesSearch && matchesFilter;
  });

  const filteredUsers = users.filter(u => {
     const matchesSearch = (u.username?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                           (u.role?.toLowerCase() || '').includes(searchTerm.toLowerCase());
     const matchesFilter = filterStatus === 'all' || u.role === filterStatus;
     return matchesSearch && matchesFilter;
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [statsData, vesselsData, tripsData, pendingData, usersData] = await Promise.all([
        adminAPI.getStatistics(),
        adminAPI.getVessels(),
        adminAPI.getTrips(),
        adminAPI.getPendingRegistrations(),
        adminAPI.getUsers()
      ]);

      if (statsData.success) setStats(statsData.data);
      if (vesselsData.success) setVessels(vesselsData.data);
      if (tripsData.success) setTrips(tripsData.data);
      if (pendingData.success) setPendingRegistrations(pendingData.data);
      if (usersData.success) setUsers(usersData.data);
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authAPI.logout();
  };

  const handleApproveTrip = async (tripId) => {
    if (window.confirm('Are you sure you want to approve this trip?')) {
        try {
            const response = await adminAPI.approveTrip(tripId);
            if (response.success) {
                alert('Trip approved successfully!');
                loadDashboardData(); // Refresh data
            } else {
                alert('Failed to approve trip: ' + response.message);
            }
        } catch (error) {
            console.error('Error approving trip:', error);
            alert('An error occurred while approving the trip.');
        }
    }
  };

  const handleApprove = async (pendingId) => {
    const pin = window.prompt("Please enter a 4-digit PIN for the new user:", "");
    if (!pin || !/^\d{4}$/.test(pin)) {
      alert("Invalid PIN. Please enter exactly 4 digits.");
      return;
    }

    try {
      const response = await adminAPI.approveRegistration({
        pendingId,
        password: pin,
        adminId: user?.id || 1
      });

      if (response.success) {
        alert(`Registration approved!\nNew User Login: ${response.newUser.username}\nPlease share the PIN with the user.`);
        loadDashboardData(); // Refresh data
      } else {
        alert('Approval failed: ' + (response.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error approving registration:', error);
      alert('An error occurred while approving registration.');
    }
  };

  const handleReject = (pendingId) => {
    if (window.confirm('Are you sure you want to reject this registration?')) {
      alert(`Registration ${pendingId} rejected. (Backend logic pending implementation)`);
    }
  };

  const handleViewTripDetails = async (trip) => {
    setSelectedTrip(trip);
    setLoadingDetails(true);
    try {
      const response = await adminAPI.getTripDetails(trip.id);
      if (response.success) {
        setTripDetails(response.logs);
      } else {
        setTripDetails([]);
      }
    } catch (error) {
      console.error("Failed to load trip details", error);
      setTripDetails([]);
    } finally {
      setLoadingDetails(false);
    }
  };

  const closeTripDetails = () => {
    setSelectedTrip(null);
    setTripDetails(null);
  };

  const handleViewVesselDetails = (vessel) => {
    setSelectedVessel(vessel);
  };

  const closeVesselDetails = () => {
    setSelectedVessel(null);
  };

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-6 rounded-2xl flex items-center justify-between hover:border-blue-500/30 transition-all group">
      <div>
        <p className="text-slate-400 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-white group-hover:text-blue-400 transition-colors">{value}</h3>
      </div>
      <div className={`p-4 rounded-2xl ${color} bg-opacity-20`}>
        <Icon className={`w-8 h-8 ${color.replace('bg-', 'text-')}`} />
      </div>
    </div>
  );

  const SidebarItem = ({ id, label, icon: Icon }) => (
    <button
      onClick={() => { setActiveView(id); closeTripDetails(); closeVesselDetails(); }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
        activeView === id 
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span className="font-medium">{label}</span>
      {activeView === id && <ChevronRight className="w-4 h-4 ml-auto" />}
    </button>
  );

  // Render Trip Details View
  if (selectedTrip) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex font-sans selection:bg-blue-500/30 selection:text-blue-200">
        {/* Sidebar (Collapsed or same as main) */}
        <aside className="w-64 bg-slate-900/50 backdrop-blur-xl border-r border-slate-800 hidden md:flex flex-col fixed h-full z-20">
          <div className="p-6 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-600 to-cyan-500 p-2 rounded-lg shadow-lg shadow-blue-500/20">
                <Anchor className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">BlueOS</h1>
                <p className="text-xs text-slate-400">Admin Console</p>
              </div>
            </div>
          </div>
          <nav className="flex-1 p-4 space-y-2">
            <SidebarItem id="overview" label="Overview" icon={LayoutDashboard} />
            <SidebarItem id="vessels" label="Vessel Registry" icon={Ship} />
            <SidebarItem id="trips" label="Trip Management" icon={Anchor} />
            <SidebarItem id="users" label="User Management" icon={Users} />
          </nav>
        </aside>

        <main className="flex-1 md:ml-64 p-8">
          <button 
            onClick={closeTripDetails}
            className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Trip List
          </button>

          <div className="space-y-6 animate-fade-in">
            {/* Trip Header Info */}
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">{selectedTrip.trip_code}</h2>
                  <p className="text-slate-400 flex items-center gap-2">
                    <Ship className="w-4 h-4" /> {selectedTrip.vessel_name}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold mb-2 ${
                    selectedTrip.trip_status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    {selectedTrip.trip_status ? selectedTrip.trip_status.toUpperCase() : 'UNKNOWN'}
                  </span>
                  <p className="text-sm text-slate-500 flex items-center justify-end gap-2">
                    <Calendar className="w-3 h-3" />
                    {new Date(selectedTrip.departure_date || selectedTrip.trip_start).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8 pt-8 border-t border-slate-800">
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold mb-1">Port</p>
                  <p className="font-medium text-slate-300">{selectedTrip.departure_port || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold mb-1">Crew</p>
                  <p className="font-medium text-slate-300">{selectedTrip.crew_count || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold mb-1">Total Expenses</p>
                  <p className="font-medium text-slate-300">₹{selectedTrip.total_expenses || '0'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold mb-1">Target Species</p>
                  <p className="font-medium text-slate-300">{selectedTrip.target_species || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Catch Logs Table */}
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h3 className="font-bold text-lg text-white mb-6 flex items-center gap-2">
                <Fish className="w-5 h-5 text-blue-400" />
                Catch Log Details
              </h3>
              
              {loadingDetails ? (
                <div className="text-center py-12 text-slate-500 flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                    Loading catch data...
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-950/50 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="p-4 font-medium">Image</th>
                        <th className="p-4 font-medium">Species</th>
                        <th className="p-4 font-medium">Tag ID</th>
                        <th className="p-4 font-medium">Weight</th>
                        <th className="p-4 font-medium">Grade</th>
                        <th className="p-4 font-medium">Location</th>
                        <th className="p-4 font-medium">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {tripDetails && tripDetails.length > 0 ? (
                        tripDetails.map((log, idx) => (
                          <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                            <td className="p-4">
                              {log.images && log.images.length > 0 ? (
                                <img src={log.images[0]} alt="Catch" className="w-12 h-12 rounded-lg object-cover border border-slate-700" />
                              ) : (
                                <div className="w-12 h-12 bg-slate-800 rounded-lg flex items-center justify-center text-slate-600">
                                  <Fish className="w-5 h-5" />
                                </div>
                              )}
                            </td>
                            <td className="p-4 font-medium text-white">{log.species_name}</td>
                            <td className="p-4 font-mono text-xs text-blue-400">{log.qr_code}</td>
                            <td className="p-4 text-slate-300">{log.weight_kg} kg</td>
                            <td className="p-4">
                              {log.quality_grade ? (
                                <span className={`px-2 py-1 rounded text-xs font-bold ${
                                  log.quality_grade === 'A' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 
                                  'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                }`}>{log.quality_grade}</span>
                              ) : <span className="text-slate-600">-</span>}
                            </td>
                            <td className="p-4 text-slate-400 flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {log.location_name}
                            </td>
                            <td className="p-4 text-slate-400 font-mono text-xs">
                                {new Date(log.timestamp).toLocaleString()}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" className="p-12 text-center text-slate-500">No catch recorded for this trip.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Render Vessel Details View
  if (selectedVessel) {
    // Filter trips for this vessel
    const vesselTrips = trips.filter(t => 
        t.vessel_name === selectedVessel.vessel_name || 
        t.vesselId === selectedVessel.id
    );

    return (
      <div className="min-h-screen bg-slate-950 text-white flex font-sans selection:bg-blue-500/30 selection:text-blue-200">
        <aside className="w-64 bg-slate-900/50 backdrop-blur-xl border-r border-slate-800 hidden md:flex flex-col fixed h-full z-20">
          <div className="p-6 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-600 to-cyan-500 p-2 rounded-lg shadow-lg shadow-blue-500/20">
                <Anchor className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">BlueOS</h1>
                <p className="text-xs text-slate-400">Admin Console</p>
              </div>
            </div>
          </div>
          <nav className="flex-1 p-4 space-y-2">
            <SidebarItem id="overview" label="Overview" icon={LayoutDashboard} />
            <SidebarItem id="vessels" label="Vessel Registry" icon={Ship} />
            <SidebarItem id="trips" label="Trip Management" icon={Anchor} />
            <SidebarItem id="users" label="User Management" icon={Users} />
          </nav>
        </aside>

        <main className="flex-1 md:ml-64 p-8">
          <button 
            onClick={closeVesselDetails}
            className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Registry
          </button>

          <div className="space-y-6 animate-fade-in">
            {/* Vessel Header */}
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-700 shadow-lg">
                            <Ship className="w-10 h-10 text-blue-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-2">{selectedVessel.vessel_name}</h1>
                            <div className="flex items-center gap-4 text-sm text-slate-400">
                                <span className="bg-slate-800 px-3 py-1 rounded-full border border-slate-700 font-mono text-blue-300">
                                    {selectedVessel.registration_number}
                                </span>
                                <span className="flex items-center gap-1">
                                    <MapPin className="w-4 h-4" /> {selectedVessel.home_port}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors shadow-lg shadow-blue-900/20">
                            Edit Details
                        </button>
                        <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl font-medium transition-colors border border-slate-700">
                            Download Docs
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Owner Details */}
                <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Users className="w-5 h-5 text-purple-400" />
                        Owner Information
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <p className="text-xs text-slate-500 uppercase font-bold mb-1">Full Name</p>
                            <p className="text-slate-200 font-medium">{selectedVessel.owner_name}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase font-bold mb-1">Contact</p>
                            <p className="text-slate-200 font-medium">{selectedVessel.contact_number || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase font-bold mb-1">Email</p>
                            <p className="text-slate-200 font-medium">{selectedVessel.email || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase font-bold mb-1">Address</p>
                            <p className="text-slate-400 text-sm">{selectedVessel.address || 'N/A'}</p>
                        </div>
                    </div>
                </div>

                {/* Technical Specs */}
                <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Anchor className="w-5 h-5 text-emerald-400" />
                        Technical Specifications
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-slate-500 uppercase font-bold mb-1">Type</p>
                            <p className="text-slate-200 font-medium">{selectedVessel.vessel_type}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase font-bold mb-1">Engine</p>
                            <p className="text-slate-200 font-medium">{selectedVessel.engine_power || 'N/A'} HP</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase font-bold mb-1">Length</p>
                            <p className="text-slate-200 font-medium">{selectedVessel.length || 'N/A'} m</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase font-bold mb-1">Capacity</p>
                            <p className="text-slate-200 font-medium">{selectedVessel.storage_capacity || 'N/A'} kg</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase font-bold mb-1">Fuel</p>
                            <p className="text-slate-200 font-medium">{selectedVessel.fuel_type || 'Diesel'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase font-bold mb-1">Crew</p>
                            <p className="text-slate-200 font-medium">{selectedVessel.crew_capacity || 'N/A'}</p>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <LayoutDashboard className="w-5 h-5 text-amber-400" />
                        Performance Stats
                    </h3>
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400">Total Trips</span>
                            <span className="text-2xl font-bold text-white">{vesselTrips.length}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400">Total Catch</span>
                            <span className="text-2xl font-bold text-white">
                                {vesselTrips.reduce((acc, t) => acc + (t.total_catch || 0), 0)} kg
                            </span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-2 mt-4">
                            <div className="bg-blue-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                        </div>
                        <p className="text-xs text-slate-500 text-center">Activity Level: High</p>
                    </div>
                </div>
            </div>

            {/* Trip History Table */}
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl">
                <h3 className="text-lg font-bold text-white mb-6">Trip History</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-950/50 text-slate-400 border-b border-slate-800">
                            <tr>
                                <th className="px-6 py-4 text-sm font-medium">Trip Code</th>
                                <th className="px-6 py-4 text-sm font-medium">Date</th>
                                <th className="px-6 py-4 text-sm font-medium">Status</th>
                                <th className="px-6 py-4 text-sm font-medium">Catch</th>
                                <th className="px-6 py-4 text-sm font-medium">Expenses</th>
                                <th className="px-6 py-4 text-sm font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {vesselTrips.length > 0 ? (
                                vesselTrips.map((trip) => (
                                    <tr key={trip.id} className="hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-4 font-mono text-xs text-blue-400">{trip.trip_code}</td>
                                        <td className="px-6 py-4 text-slate-300">
                                            {new Date(trip.trip_start).toLocaleDateString()}
                                            <span className="block text-xs text-slate-500">
                                                {new Date(trip.trip_start).toLocaleTimeString()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                trip.trip_status === 'active' 
                                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                                            }`}>
                                                {trip.trip_status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-300">{trip.total_catch || 0} kg</td>
                                        <td className="px-6 py-4 text-slate-300">₹{trip.total_expenses || 0}</td>
                                        <td className="px-6 py-4">
                                            <button 
                                                onClick={() => handleViewTripDetails(trip)}
                                                className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center gap-1"
                                            >
                                                Details <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                                        No trips recorded for this vessel yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex font-sans selection:bg-blue-500/30 selection:text-blue-200">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900/50 backdrop-blur-xl border-r border-slate-800 hidden md:flex flex-col fixed h-full z-20">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-600 to-cyan-500 p-2 rounded-lg shadow-lg shadow-blue-500/20">
              <Anchor className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">BlueOS</h1>
              <p className="text-xs text-slate-400">Admin Console</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <SidebarItem id="overview" label="Overview" icon={LayoutDashboard} />
          <SidebarItem id="vessels" label="Vessel Registry" icon={Ship} />
          <SidebarItem id="trips" label="Trip Management" icon={Anchor} />
          <SidebarItem id="users" label="User Management" icon={Users} />
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={() => navigate('/qr-generator')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-all mb-2"
          >
            <QrCode className="w-5 h-5" />
            <span>QR Generator</span>
          </button>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-8">
        {/* Mobile Header */}
        <div className="md:hidden flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-white">BlueOS Admin</h1>
          <button onClick={handleLogout} className="p-2 text-slate-400">
            <LogOut className="w-6 h-6" />
          </button>
        </div>

        {activeView === 'overview' && (
          <div className="space-y-8 animate-fade-in">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Dashboard Overview</h2>
              <button 
                onClick={loadDashboardData} 
                className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center gap-2"
              >
                <Waves className="w-4 h-4" />
                Refresh Data
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard title="Total Vessels" value={stats.vessels} icon={Ship} color="bg-blue-500" />
              <StatCard title="Active Trips" value={stats.trips} icon={Anchor} color="bg-emerald-500" />
              <StatCard title="Species Logged" value={stats.species} icon={Fish} color="bg-violet-500" />
              <StatCard title="Fish Tagged" value={stats.fish} icon={QrCode} color="bg-amber-500" />
            </div>

            {/* Recent Activity */}
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h3 className="text-lg font-bold mb-4 text-white">Recent Trips</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-slate-400 text-sm border-b border-slate-800">
                      <th className="pb-4 font-medium">Trip Code</th>
                      <th className="pb-4 font-medium">Vessel</th>
                      <th className="pb-4 font-medium">Status</th>
                      <th className="pb-4 font-medium">Date</th>
                      <th className="pb-4 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {trips.slice(0, 5).map(trip => (
                      <tr key={trip.id} className="border-b border-slate-800 last:border-0 hover:bg-slate-800/30 transition-colors">
                        <td className="py-4 font-mono text-blue-400">{trip.trip_code}</td>
                        <td className="py-4 font-medium text-slate-200">{trip.vessel_name}</td>
                        <td className="py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            trip.trip_status === 'active' 
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}>
                            {trip.trip_status}
                          </span>
                        </td>
                        <td className="py-4 text-slate-400">
                          {new Date(trip.trip_start).toLocaleDateString()}
                        </td>
                        <td className="py-4">
                          <button 
                            onClick={() => handleViewTripDetails(trip)}
                            className="text-blue-400 hover:text-blue-300 font-medium text-xs"
                          >
                            View
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

        {activeView === 'vessels' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">Vessel Registry</h2>
                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                        <input 
                            type="text" 
                            placeholder="Search vessels..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 w-64"
                        />
                    </div>
                    <select 
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-400 focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                        <option value="all">All Types</option>
                        <option value="Trawler">Trawler</option>
                        <option value="Gillnetter">Gillnetter</option>
                        <option value="Longliner">Longliner</option>
                        <option value="Seiner">Seiner</option>
                    </select>
                </div>
            </div>

            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <table className="w-full text-left">
                <thead className="bg-slate-950/50 border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-4 text-sm font-medium text-slate-400">Vessel Name</th>
                    <th className="px-6 py-4 text-sm font-medium text-slate-400">Reg Number</th>
                    <th className="px-6 py-4 text-sm font-medium text-slate-400">Owner</th>
                    <th className="px-6 py-4 text-sm font-medium text-slate-400">Port</th>
                    <th className="px-6 py-4 text-sm font-medium text-slate-400">Type</th>
                    <th className="px-6 py-4 text-sm font-medium text-slate-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredVessels.length > 0 ? (
                      filteredVessels.map((vessel, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                          <td className="px-6 py-4 font-medium text-white flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-400">
                                <Ship className="w-4 h-4" />
                            </div>
                            {vessel.vessel_name}
                          </td>
                          <td className="px-6 py-4 text-slate-400 font-mono text-xs">{vessel.registration_number}</td>
                          <td className="px-6 py-4 text-slate-300">{vessel.owner_name}</td>
                          <td className="px-6 py-4 text-slate-300">{vessel.home_port}</td>
                          <td className="px-6 py-4 text-slate-300">{vessel.vessel_type}</td>
                          <td className="px-6 py-4">
                            <button 
                              onClick={() => handleViewVesselDetails(vessel)}
                              className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center gap-1"
                            >
                              View Details <ChevronRight className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                  ) : (
                      <tr>
                          <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                              No vessels found matching your search.
                          </td>
                      </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeView === 'trips' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">Trip Management</h2>
                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                        <input 
                            type="text" 
                            placeholder="Search trips..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 w-64"
                        />
                    </div>
                    <select 
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-400 focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="pending">Pending Approval</option>
                        <option value="completed">Completed</option>
                        <option value="scheduled">Scheduled</option>
                    </select>
                </div>
            </div>

            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <table className="w-full text-left">
                <thead className="bg-slate-950/50 border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-4 text-sm font-medium text-slate-400">Trip Code</th>
                    <th className="px-6 py-4 text-sm font-medium text-slate-400">Vessel</th>
                    <th className="px-6 py-4 text-sm font-medium text-slate-400">Method</th>
                    <th className="px-6 py-4 text-sm font-medium text-slate-400">Status</th>
                    <th className="px-6 py-4 text-sm font-medium text-slate-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredTrips.length > 0 ? (
                    filteredTrips.map((trip) => (
                    <tr key={trip.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-blue-400">{trip.trip_code}</td>
                      <td className="px-6 py-4 font-medium text-slate-200">{trip.vessel_name}</td>
                      <td className="px-6 py-4 text-slate-400">{trip.fishing_method}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          trip.status === 'active' 
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                            : trip.status === 'pending'
                            ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}>
                          {trip.status === 'active' ? 'Active' : trip.status === 'pending' ? 'Pending' : trip.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 flex items-center gap-3">
                        {trip.status === 'pending' && (
                            <button 
                              onClick={() => handleApproveTrip(trip.id)}
                              className="text-emerald-400 hover:text-emerald-300 text-sm font-medium flex items-center gap-1"
                            >
                              Approve
                            </button>
                        )}
                        <button 
                          onClick={() => handleViewTripDetails(trip)}
                          className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center gap-1"
                        >
                          Details <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                  ) : (
                    <tr>
                        <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                            No trips found matching your search.
                        </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeView === 'users' && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-white">User Management</h2>
            
            {/* Pending Registrations Section */}
            <div className="bg-slate-900/50 backdrop-blur-xl border border-yellow-500/30 rounded-2xl p-6 mb-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500"></div>
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-500" />
                Pending Approvals
              </h3>
              
              {pendingRegistrations.length === 0 ? (
                <div className="bg-yellow-500/10 rounded-xl p-4 text-center text-yellow-200/70 border border-yellow-500/20">
                  <p>No pending registrations at the moment.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-yellow-500/10 text-yellow-200">
                      <tr>
                        <th className="px-4 py-3 text-sm font-medium">Owner</th>
                        <th className="px-4 py-3 text-sm font-medium">Vessel</th>
                        <th className="px-4 py-3 text-sm font-medium">Contact</th>
                        <th className="px-4 py-3 text-sm font-medium">Date</th>
                        <th className="px-4 py-3 text-sm font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-yellow-500/10">
                      {pendingRegistrations.map((reg) => (
                        <tr key={reg.id} className="hover:bg-yellow-500/5">
                          <td className="px-4 py-3 font-medium text-white">{reg.owner_name}</td>
                          <td className="px-4 py-3 text-slate-300">{reg.vessel_name}</td>
                          <td className="px-4 py-3 text-slate-300">{reg.contact_number}</td>
                          <td className="px-4 py-3 text-slate-400">{new Date(reg.created_at).toLocaleDateString()}</td>
                          <td className="px-4 py-3 flex gap-2">
                            <button 
                              onClick={() => handleApprove(reg.id)}
                              className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors border border-emerald-500/30"
                              title="Approve"
                            >
                              <CheckCircle className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={() => handleReject(reg.id)}
                              className="p-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors border border-red-500/30"
                              title="Reject"
                            >
                              <XCircle className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="p-6 pb-0 flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-white">Active Users</h3>
                  <div className="flex gap-2">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                        <input 
                            type="text" 
                            placeholder="Search users..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 w-48"
                        />
                    </div>
                    <select 
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-400 focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                        <option value="all">All Roles</option>
                        <option value="Administrator">Admin</option>
                        <option value="Captain">Captain</option>
                        <option value="Inspector">Inspector</option>
                    </select>
                  </div>
              </div>

              <table className="w-full text-left">
                <thead className="bg-slate-950/50 border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-4 text-sm font-medium text-slate-400">User</th>
                    <th className="px-6 py-4 text-sm font-medium text-slate-400">Role</th>
                    <th className="px-6 py-4 text-sm font-medium text-slate-400">Status</th>
                    <th className="px-6 py-4 text-sm font-medium text-slate-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4 font-medium text-white">
                            {u.username}
                            {u.vessel_name && <span className="block text-xs text-slate-500">Vessel: {u.vessel_name}</span>}
                        </td>
                        <td className="px-6 py-4 text-slate-300">{u.role}</td>
                        <td className="px-6 py-4">
                            <span className="text-emerald-400 text-xs font-bold bg-emerald-500/20 px-2 py-1 rounded-full border border-emerald-500/30">
                                Active
                            </span>
                        </td>
                        <td className="px-6 py-4">
                          <button className="text-red-400 hover:text-red-300 text-sm font-medium">Disable</button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                        <td colSpan="4" className="px-6 py-12 text-center text-slate-500">
                            No users found matching your search.
                        </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
