import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, adminAPI } from '../../services/api';
import { getCurrentUser } from '../../services/utils';
import { 
  LayoutDashboard, Ship, Anchor, Fish, Users, QrCode, 
  LogOut, ChevronRight, CheckCircle, XCircle, Clock, FileText 
} from 'lucide-react';

const AdminDashboard = () => {
  const [activeView, setActiveView] = useState('overview');
  const [stats, setStats] = useState({ vessels: 0, trips: 0, species: 0, fish: 0 });
  const [vessels, setVessels] = useState([]);
  const [trips, setTrips] = useState([]);
  const [pendingRegistrations, setPendingRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Drill-down state
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [tripDetails, setTripDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const navigate = useNavigate();
  const user = getCurrentUser();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [statsData, vesselsData, tripsData, pendingData] = await Promise.all([
        adminAPI.getStatistics(),
        adminAPI.getVessels(),
        adminAPI.getTrips(),
        adminAPI.getPendingRegistrations()
      ]);

      if (statsData.success) setStats(statsData.data);
      if (vesselsData.success) setVessels(vesselsData.data);
      if (tripsData.success) setTrips(tripsData.data);
      if (pendingData.success) setPendingRegistrations(pendingData.data);
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authAPI.logout();
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

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="glass-card p-6 flex items-center justify-between">
      <div>
        <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-slate-800">{value}</h3>
      </div>
      <div className={`p-4 rounded-2xl ${color}`}>
        <Icon className="w-8 h-8 text-white" />
      </div>
    </div>
  );

  const SidebarItem = ({ id, label, icon: Icon }) => (
    <button
      onClick={() => { setActiveView(id); closeTripDetails(); }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
        activeView === id 
          ? 'bg-ocean-600 text-white shadow-lg shadow-ocean-500/30' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span className="font-medium">{label}</span>
      {activeView === id && <ChevronRight className="w-4 h-4 ml-auto" />}
    </button>
  );

  if (selectedTrip) {
    return (
      <div className="min-h-screen bg-slate-100 flex">
        {/* Sidebar (Collapsed or same as main) */}
        <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col fixed h-full z-20">
          <div className="p-6 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="bg-ocean-500 p-2 rounded-lg">
                <Anchor className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">BlueOS</h1>
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
            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-6 transition-colors"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            Back to Trip List
          </button>

          <div className="space-y-6 animate-fade-in">
            {/* Trip Header Info */}
            <div className="glass-card p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-1">{selectedTrip.trip_code}</h2>
                  <p className="text-slate-500 flex items-center gap-2">
                    <Ship className="w-4 h-4" /> {selectedTrip.vessel_name}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold mb-2 ${
                    selectedTrip.trip_status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {selectedTrip.trip_status ? selectedTrip.trip_status.toUpperCase() : 'UNKNOWN'}
                  </span>
                  <p className="text-sm text-slate-500">
                    Dep: {new Date(selectedTrip.departure_date || selectedTrip.trip_start).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8 pt-8 border-t border-slate-100">
                <div>
                  <p className="text-xs text-slate-400 uppercase font-bold">Port</p>
                  <p className="font-medium text-slate-800">{selectedTrip.departure_port || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase font-bold">Crew</p>
                  <p className="font-medium text-slate-800">{selectedTrip.crew_count || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase font-bold">Total Expenses</p>
                  <p className="font-medium text-slate-800">₹{selectedTrip.total_expenses || '0'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase font-bold">Target Species</p>
                  <p className="font-medium text-slate-800">{selectedTrip.target_species || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Catch Logs Table */}
            <div className="glass-card p-6">
              <h3 className="font-bold text-lg text-slate-800 mb-6 flex items-center gap-2">
                <Fish className="w-5 h-5 text-ocean-600" />
                Catch Log Details
              </h3>
              
              {loadingDetails ? (
                <div className="text-center py-12 text-slate-400">Loading catch data...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500">
                      <tr>
                        <th className="p-3 rounded-tl-lg">Image</th>
                        <th className="p-3">Species</th>
                        <th className="p-3">Tag ID</th>
                        <th className="p-3">Weight</th>
                        <th className="p-3">Grade</th>
                        <th className="p-3">Location</th>
                        <th className="p-3 rounded-tr-lg">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {tripDetails && tripDetails.length > 0 ? (
                        tripDetails.map((log, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-3">
                              {log.images && log.images.length > 0 ? (
                                <img src={log.images[0]} alt="Catch" className="w-10 h-10 rounded object-cover border border-slate-200" />
                              ) : (
                                <div className="w-10 h-10 bg-slate-100 rounded flex items-center justify-center text-slate-300">
                                  <Fish className="w-4 h-4" />
                                </div>
                              )}
                            </td>
                            <td className="p-3 font-medium text-slate-800">{log.species_name}</td>
                            <td className="p-3 font-mono text-xs text-slate-500">{log.qr_code}</td>
                            <td className="p-3">{log.weight_kg} kg</td>
                            <td className="p-3">
                              {log.quality_grade ? (
                                <span className={`px-2 py-1 rounded text-xs font-bold ${
                                  log.quality_grade === 'A' ? 'bg-green-100 text-green-700' : 
                                  'bg-yellow-100 text-yellow-700'
                                }`}>{log.quality_grade}</span>
                              ) : <span className="text-slate-400">-</span>}
                            </td>
                            <td className="p-3 text-slate-600">{log.location_name}</td>
                            <td className="p-3 text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" className="p-8 text-center text-slate-400">No catch recorded for this trip.</td>
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

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col fixed h-full z-20">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="bg-ocean-500 p-2 rounded-lg">
              <Anchor className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">BlueOS</h1>
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
          <h1 className="text-2xl font-bold text-slate-900">BlueOS Admin</h1>
          <button onClick={handleLogout} className="p-2 text-slate-500">
            <LogOut className="w-6 h-6" />
          </button>
        </div>

        {activeView === 'overview' && (
          <div className="space-y-8 animate-fade-in">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-900">Dashboard Overview</h2>
              <button 
                onClick={loadDashboardData} 
                className="text-ocean-600 hover:text-ocean-700 text-sm font-medium"
              >
                Refresh Data
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard title="Total Vessels" value={stats.vessels} icon={Ship} color="bg-blue-500" />
              <StatCard title="Active Trips" value={stats.trips} icon={Anchor} color="bg-emerald-500" />
              <StatCard title="Species Logged" value={stats.species} icon={Fish} color="bg-violet-500" />
              <StatCard title="Fish Tagged" value={stats.fish} icon={QrCode} color="bg-amber-500" />
            </div>

            {/* Recent Activity or Charts could go here */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-bold mb-4">Recent Trips</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-slate-500 text-sm border-b border-slate-200">
                      <th className="pb-3 font-medium">Trip Code</th>
                      <th className="pb-3 font-medium">Vessel</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium">Date</th>
                      <th className="pb-3 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {trips.slice(0, 5).map(trip => (
                      <tr key={trip.id} className="border-b border-slate-100 last:border-0">
                        <td className="py-3 font-mono text-slate-600">{trip.trip_code}</td>
                        <td className="py-3 font-medium text-slate-800">{trip.vessel_name}</td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            trip.trip_status === 'active' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {trip.trip_status}
                          </span>
                        </td>
                        <td className="py-3 text-slate-500">
                          {new Date(trip.trip_start).toLocaleDateString()}
                        </td>
                        <td className="py-3">
                          <button 
                            onClick={() => handleViewTripDetails(trip)}
                            className="text-ocean-600 hover:text-ocean-800 font-medium text-xs"
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
            <h2 className="text-2xl font-bold text-slate-900">Vessel Registry</h2>
            <div className="glass-card overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-sm font-medium text-slate-500">Vessel Name</th>
                    <th className="px-6 py-4 text-sm font-medium text-slate-500">Reg Number</th>
                    <th className="px-6 py-4 text-sm font-medium text-slate-500">Owner</th>
                    <th className="px-6 py-4 text-sm font-medium text-slate-500">Port</th>
                    <th className="px-6 py-4 text-sm font-medium text-slate-500">Type</th>
                    <th className="px-6 py-4 text-sm font-medium text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {vessels.map((vessel, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900">{vessel.vessel_name}</td>
                      <td className="px-6 py-4 text-slate-600 font-mono text-xs">{vessel.registration_number}</td>
                      <td className="px-6 py-4 text-slate-600">{vessel.owner_name}</td>
                      <td className="px-6 py-4 text-slate-600">{vessel.home_port}</td>
                      <td className="px-6 py-4 text-slate-600">{vessel.vessel_type}</td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => setActiveView('trips')}
                          className="text-ocean-600 hover:text-ocean-800 text-sm font-medium"
                        >
                          View Trips
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeView === 'trips' && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-slate-900">Trip Management</h2>
            <div className="glass-card overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-sm font-medium text-slate-500">Trip Code</th>
                    <th className="px-6 py-4 text-sm font-medium text-slate-500">Vessel</th>
                    <th className="px-6 py-4 text-sm font-medium text-slate-500">Method</th>
                    <th className="px-6 py-4 text-sm font-medium text-slate-500">Status</th>
                    <th className="px-6 py-4 text-sm font-medium text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {trips.map((trip) => (
                    <tr key={trip.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-slate-600">{trip.trip_code}</td>
                      <td className="px-6 py-4 font-medium text-slate-900">{trip.vessel_name}</td>
                      <td className="px-6 py-4 text-slate-600">{trip.fishing_method}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          trip.trip_status === 'active' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {trip.trip_status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => handleViewTripDetails(trip)}
                          className="text-ocean-600 hover:text-ocean-800 text-sm font-medium flex items-center gap-1"
                        >
                          View Details <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeView === 'users' && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-slate-900">User Management</h2>
            
            {/* Pending Registrations Section */}
            <div className="glass-card p-6 mb-8 border-l-4 border-yellow-400">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-500" />
                Pending Approvals
              </h3>
              
              {pendingRegistrations.length === 0 ? (
                <div className="bg-yellow-50 rounded-xl p-4 text-center text-slate-600">
                  <p>No pending registrations at the moment.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-yellow-50/50">
                      <tr>
                        <th className="px-4 py-3 text-sm font-medium text-slate-500">Owner</th>
                        <th className="px-4 py-3 text-sm font-medium text-slate-500">Vessel</th>
                        <th className="px-4 py-3 text-sm font-medium text-slate-500">Contact</th>
                        <th className="px-4 py-3 text-sm font-medium text-slate-500">Date</th>
                        <th className="px-4 py-3 text-sm font-medium text-slate-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-yellow-100">
                      {pendingRegistrations.map((reg) => (
                        <tr key={reg.id} className="hover:bg-yellow-50/30">
                          <td className="px-4 py-3 font-medium text-slate-900">{reg.owner_name}</td>
                          <td className="px-4 py-3 text-slate-600">{reg.vessel_name}</td>
                          <td className="px-4 py-3 text-slate-600">{reg.contact_number}</td>
                          <td className="px-4 py-3 text-slate-500">{new Date(reg.created_at).toLocaleDateString()}</td>
                          <td className="px-4 py-3 flex gap-2">
                            <button 
                              onClick={() => handleApprove(reg.id)}
                              className="p-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                              title="Approve"
                            >
                              <CheckCircle className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={() => handleReject(reg.id)}
                              className="p-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                              title="Reject"
                            >
                              <XCircle className="w-5 h-5" />
                            </button>
                            {/* Document viewing could be added here */}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="glass-card overflow-hidden">
              <h3 className="text-lg font-bold text-slate-800 p-6 pb-0">Active Users</h3>
              <table className="w-full text-left mt-4">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-sm font-medium text-slate-500">User</th>
                    <th className="px-6 py-4 text-sm font-medium text-slate-500">Role</th>
                    <th className="px-6 py-4 text-sm font-medium text-slate-500">Status</th>
                    <th className="px-6 py-4 text-sm font-medium text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900">Admin User</td>
                    <td className="px-6 py-4 text-slate-600">Administrator</td>
                    <td className="px-6 py-4"><span className="text-green-600 text-xs font-bold bg-green-100 px-2 py-1 rounded-full">Active</span></td>
                    <td className="px-6 py-4 text-slate-400">--</td>
                  </tr>
                  {/* Mock Users - In a real app, fetch these too */}
                  <tr className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900">Captain John</td>
                    <td className="px-6 py-4 text-slate-600">Captain</td>
                    <td className="px-6 py-4"><span className="text-green-600 text-xs font-bold bg-green-100 px-2 py-1 rounded-full">Active</span></td>
                    <td className="px-6 py-4">
                      <button className="text-red-500 hover:text-red-700 text-sm font-medium">Disable</button>
                    </td>
                  </tr>
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
