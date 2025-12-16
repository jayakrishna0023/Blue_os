import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, adminAPI } from '../../services/api';
import { getCurrentUser } from '../../services/utils';
import { 
  LayoutDashboard, Ship, Anchor, Fish, Users, QrCode, 
  LogOut, ChevronRight, CheckCircle, XCircle, Clock, FileText, 
  MapPin, Calendar, Search, Filter, ArrowLeft, Waves, Download, Edit, Save, X,
  Database, UserCheck, Building2, Truck, Eye, Plus
} from 'lucide-react';

// Participant Type Configuration
const PARTICIPANT_TYPES = {
  vessel_owner: { label: 'Vessel Owner', color: 'blue', icon: Ship },
  fisher: { label: 'Fisher', color: 'cyan', icon: Fish },
  quality_inspector: { label: 'Quality Inspector', color: 'emerald', icon: UserCheck },
  crate_packer: { label: 'Crate Packer', color: 'orange', icon: FileText },
  logistics_provider: { label: 'Logistics Provider', color: 'purple', icon: Truck },
  admin: { label: 'Administrator', color: 'pink', icon: Users },
  captain: { label: 'Captain', color: 'indigo', icon: Anchor },
  vessel: { label: 'Vessel (Asset)', color: 'slate', icon: Ship },
  facility: { label: 'Facility (Asset)', color: 'amber', icon: Building2 }
};

const AdminDashboard = () => {
  const [activeView, setActiveView] = useState('overview');
  const [stats, setStats] = useState({ vessels: 0, trips: 0, species: 0, fish: 0 });
  const [vessels, setVessels] = useState([]);
  const [trips, setTrips] = useState([]);
  const [users, setUsers] = useState([]);
  const [pendingRegistrations, setPendingRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Registry State
  const [registry, setRegistry] = useState([]);
  const [registryStats, setRegistryStats] = useState({ total: 0, active: 0, inactive: 0, byType: {} });
  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [newParticipant, setNewParticipant] = useState({ name: '', type: 'fisher', email: '', contact_number: '', address: '' });
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  
  // Drill-down state
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [tripDetails, setTripDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [selectedVessel, setSelectedVessel] = useState(null);
  const [editingVessel, setEditingVessel] = useState(false);
  const [editedVesselData, setEditedVesselData] = useState({});

  // Search and Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');

  const navigate = useNavigate();
  const user = getCurrentUser();

  // Reset filters when view changes
  useEffect(() => {
    setSearchTerm('');
    setFilterStatus('all');
    setFilterType('all');
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
    // REQ- prefix means pending approval, otherwise check status
    const isPending = t.trip_code?.startsWith('REQ-') || t.status === 'pending';
    const tripStatus = isPending ? 'pending' : t.status;
    const matchesFilter = filterStatus === 'all' || tripStatus === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const filteredUsers = users.filter(u => {
     const matchesSearch = (u.username?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                           (u.role?.toLowerCase() || '').includes(searchTerm.toLowerCase());
     const matchesFilter = filterStatus === 'all' || u.role === filterStatus;
     return matchesSearch && matchesFilter;
  });

  // Registry Filter Logic
  const filteredRegistry = registry.filter(r => {
    const matchesSearch = (r.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                          (r.root_id?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                          (r.email?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || r.type === filterType;
    const matchesStatus = filterStatus === 'all' || r.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [statsData, vesselsData, tripsData, pendingData, usersData, registryData] = await Promise.all([
        adminAPI.getStatistics(),
        adminAPI.getVessels(),
        adminAPI.getTrips(),
        adminAPI.getPendingRegistrations(),
        adminAPI.getUsers(),
        adminAPI.getRegistry()
      ]);

      if (statsData.success) setStats(statsData.data);
      if (vesselsData.success) setVessels(vesselsData.data);
      if (tripsData.success) setTrips(tripsData.data);
      if (pendingData.success) setPendingRegistrations(pendingData.data);
      if (usersData.success) setUsers(usersData.data);
      if (registryData.success) setRegistry(registryData.data);
      
      // Load registry stats
      try {
        const regStats = await adminAPI.getRegistryStats();
        if (regStats.success) setRegistryStats(regStats.data);
      } catch (e) {
        console.log('Registry stats not available');
      }
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

  const handleReject = async (pendingId) => {
    if (window.confirm('Are you sure you want to reject this registration?')) {
      try {
        const response = await adminAPI.rejectRegistration(pendingId);
        if (response.success) {
          alert('Registration rejected.');
          loadDashboardData();
        } else {
          alert('Failed to reject: ' + (response.message || 'Unknown error'));
        }
      } catch (error) {
        console.error('Error rejecting registration:', error);
        alert('An error occurred while rejecting registration.');
      }
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
    setEditedVesselData(vessel);
    setEditingVessel(false);
  };

  const closeVesselDetails = () => {
    setSelectedVessel(null);
    setEditingVessel(false);
    setEditedVesselData({});
  };

  const handleEditVessel = () => {
    setEditingVessel(true);
  };

  const handleCancelEdit = () => {
    setEditingVessel(false);
    setEditedVesselData(selectedVessel);
  };

  const handleSaveVessel = async () => {
    try {
      const response = await adminAPI.updateVessel(selectedVessel.id, editedVesselData);
      if (response.success) {
        alert('Vessel details updated successfully!');
        setSelectedVessel(editedVesselData);
        setEditingVessel(false);
        loadDashboardData(); // Refresh data
      } else {
        alert('Failed to update vessel: ' + (response.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error updating vessel:', error);
      alert('An error occurred while updating the vessel.');
    }
  };

  const handleDownloadDocs = () => {
    // Generate a simple vessel certificate/document as download
    const vesselData = selectedVessel;
    const docContent = `
=================================================
           BLUEOS VESSEL REGISTRATION
=================================================

VESSEL DETAILS
--------------
Vessel Name: ${vesselData.vessel_name || 'N/A'}
Registration No: ${vesselData.registration_number || 'N/A'}
Home Port: ${vesselData.home_port || 'N/A'}
Vessel Type: ${vesselData.vessel_type || 'N/A'}
Engine Power: ${vesselData.engine_power || 'N/A'} HP
Fuel Type: ${vesselData.fuel_type || 'Diesel'}
Storage Capacity: ${vesselData.storage_capacity || 'N/A'} kg
Crew Capacity: ${vesselData.crew_capacity || 'N/A'}

OWNER DETAILS
-------------
Owner Name: ${vesselData.owner_name || 'N/A'}
Contact: ${vesselData.contact_number || 'N/A'}
Email: ${vesselData.email || 'N/A'}
Address: ${vesselData.address || 'N/A'}

License Number: ${vesselData.license_number || 'N/A'}

-------------------------------------------------
Generated on: ${new Date().toLocaleString()}
This is a system-generated document from BlueOS.
=================================================
    `;

    const blob = new Blob([docContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vessel_${vesselData.registration_number || 'doc'}_certificate.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleVesselInputChange = (field, value) => {
    setEditedVesselData(prev => ({ ...prev, [field]: value }));
  };

  // Registry Handlers
  const handleAddParticipant = async () => {
    if (!newParticipant.name || !newParticipant.type) {
      alert('Please fill in required fields (Name and Type)');
      return;
    }
    
    try {
      const response = await adminAPI.createRegistryEntry(newParticipant);
      if (response.success) {
        alert(`Participant added successfully!\nRoot ID: ${response.data.root_id}`);
        setShowAddParticipant(false);
        setNewParticipant({ name: '', type: 'fisher', email: '', contact_number: '', address: '' });
        loadDashboardData();
      } else {
        alert('Failed to add participant: ' + (response.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error adding participant:', error);
      alert('An error occurred while adding participant.');
    }
  };

  const handleToggleParticipantStatus = async (rootId) => {
    if (window.confirm('Are you sure you want to change this participant\'s status?')) {
      try {
        const response = await adminAPI.toggleRegistryStatus(rootId);
        if (response.success) {
          alert(response.message);
          loadDashboardData();
        } else {
          alert('Failed to update status: ' + (response.message || 'Unknown error'));
        }
      } catch (error) {
        console.error('Error toggling status:', error);
        alert('An error occurred while updating status.');
      }
    }
  };

  const handleViewParticipant = (participant) => {
    setSelectedParticipant(participant);
  };

  const closeParticipantDetails = () => {
    setSelectedParticipant(null);
  };

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-4 sm:p-6 rounded-xl sm:rounded-2xl flex items-center justify-between hover:border-blue-500/30 transition-all group">
      <div className="min-w-0">
        <p className="text-slate-400 text-xs sm:text-sm font-medium mb-1 truncate">{title}</p>
        <h3 className="text-xl sm:text-3xl font-bold text-white group-hover:text-blue-400 transition-colors">{value}</h3>
      </div>
      <div className={`p-2 sm:p-4 rounded-xl sm:rounded-2xl ${color} bg-opacity-20 flex-shrink-0`}>
        <Icon className={`w-5 h-5 sm:w-8 sm:h-8 ${color.replace('bg-', 'text-')}`} />
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

  // Admin Profile Mini Card
  const AdminProfileMini = () => (
    <div className="p-4 border-b border-slate-800">
      <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-slate-800/50 to-slate-700/30 rounded-xl border border-slate-700">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm shadow-lg">
          {(user?.full_name || user?.username || 'A').charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-white truncate text-sm">{user?.full_name || user?.username}</p>
          <p className="text-xs text-slate-400">Administrator</p>
        </div>
        <span className="bg-purple-500/20 px-2 py-1 rounded-full text-[10px] font-bold text-purple-400 uppercase border border-purple-500/30">
          ADMIN
        </span>
      </div>
    </div>
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
            <SidebarItem id="registry" label="Registry" icon={Database} />
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
            <SidebarItem id="registry" label="Registry" icon={Database} />
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
                        {editingVessel ? (
                          <>
                            <button 
                              onClick={handleSaveVessel}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium transition-colors shadow-lg shadow-emerald-900/20 flex items-center gap-2"
                            >
                              <Save className="w-4 h-4" /> Save
                            </button>
                            <button 
                              onClick={handleCancelEdit}
                              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl font-medium transition-colors border border-slate-700 flex items-center gap-2"
                            >
                              <X className="w-4 h-4" /> Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button 
                              onClick={handleEditVessel}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors shadow-lg shadow-blue-900/20 flex items-center gap-2"
                            >
                              <Edit className="w-4 h-4" /> Edit Details
                            </button>
                            <button 
                              onClick={handleDownloadDocs}
                              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl font-medium transition-colors border border-slate-700 flex items-center gap-2"
                            >
                              <Download className="w-4 h-4" /> Download Docs
                            </button>
                          </>
                        )}
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
                            {editingVessel ? (
                              <input
                                type="text"
                                value={editedVesselData.owner_name || ''}
                                onChange={(e) => handleVesselInputChange('owner_name', e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                              />
                            ) : (
                              <p className="text-slate-200 font-medium">{selectedVessel.owner_name}</p>
                            )}
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase font-bold mb-1">Contact</p>
                            {editingVessel ? (
                              <input
                                type="tel"
                                value={editedVesselData.contact_number || ''}
                                onChange={(e) => handleVesselInputChange('contact_number', e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                              />
                            ) : (
                              <p className="text-slate-200 font-medium">{selectedVessel.contact_number || 'N/A'}</p>
                            )}
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase font-bold mb-1">Email</p>
                            {editingVessel ? (
                              <input
                                type="email"
                                value={editedVesselData.email || ''}
                                onChange={(e) => handleVesselInputChange('email', e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                              />
                            ) : (
                              <p className="text-slate-200 font-medium">{selectedVessel.email || 'N/A'}</p>
                            )}
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase font-bold mb-1">Address</p>
                            {editingVessel ? (
                              <textarea
                                value={editedVesselData.address || ''}
                                onChange={(e) => handleVesselInputChange('address', e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 min-h-[60px]"
                              />
                            ) : (
                              <p className="text-slate-400 text-sm">{selectedVessel.address || 'N/A'}</p>
                            )}
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
                            {editingVessel ? (
                              <select
                                value={editedVesselData.vessel_type || ''}
                                onChange={(e) => handleVesselInputChange('vessel_type', e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                              >
                                <option value="M - Mechanised">Mechanised</option>
                                <option value="O - Motorised">Motorised</option>
                                <option value="D - Deep Sea">Deep Sea</option>
                              </select>
                            ) : (
                              <p className="text-slate-200 font-medium">{selectedVessel.vessel_type}</p>
                            )}
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase font-bold mb-1">Engine</p>
                            {editingVessel ? (
                              <input
                                type="number"
                                value={editedVesselData.engine_power || ''}
                                onChange={(e) => handleVesselInputChange('engine_power', e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                                placeholder="HP"
                              />
                            ) : (
                              <p className="text-slate-200 font-medium">{selectedVessel.engine_power || 'N/A'} HP</p>
                            )}
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase font-bold mb-1">Length</p>
                            <p className="text-slate-200 font-medium">{selectedVessel.length || 'N/A'} m</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase font-bold mb-1">Capacity</p>
                            {editingVessel ? (
                              <input
                                type="number"
                                value={editedVesselData.storage_capacity || ''}
                                onChange={(e) => handleVesselInputChange('storage_capacity', e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                                placeholder="kg"
                              />
                            ) : (
                              <p className="text-slate-200 font-medium">{selectedVessel.storage_capacity || 'N/A'} kg</p>
                            )}
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase font-bold mb-1">Fuel</p>
                            {editingVessel ? (
                              <select
                                value={editedVesselData.fuel_type || 'Diesel'}
                                onChange={(e) => handleVesselInputChange('fuel_type', e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                              >
                                <option value="Diesel">Diesel</option>
                                <option value="Petrol">Petrol</option>
                                <option value="Solar Hybrid">Solar Hybrid</option>
                              </select>
                            ) : (
                              <p className="text-slate-200 font-medium">{selectedVessel.fuel_type || 'Diesel'}</p>
                            )}
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase font-bold mb-1">Crew</p>
                            {editingVessel ? (
                              <input
                                type="number"
                                value={editedVesselData.crew_capacity || ''}
                                onChange={(e) => handleVesselInputChange('crew_capacity', e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                              />
                            ) : (
                              <p className="text-slate-200 font-medium">{selectedVessel.crew_capacity || 'N/A'}</p>
                            )}
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
    <div className="min-h-screen bg-slate-950 text-white flex flex-col md:flex-row font-sans selection:bg-blue-500/30 selection:text-blue-200">
      {/* Sidebar - Hidden on mobile */}
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

        <AdminProfileMini />

        <nav className="flex-1 p-4 space-y-2">
          <SidebarItem id="overview" label="Overview" icon={LayoutDashboard} />
          <SidebarItem id="vessels" label="Vessel Registry" icon={Ship} />
          <SidebarItem id="trips" label="Trip Management" icon={Anchor} />
          <SidebarItem id="registry" label="Registry" icon={Database} />
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
      <main className="flex-1 md:ml-64 p-4 sm:p-6 lg:p-8 pb-24 md:pb-8">
        {/* Mobile Header */}
        <div className="md:hidden flex justify-between items-center mb-6 sticky top-0 bg-slate-950/90 backdrop-blur-lg -mx-4 px-4 py-3 z-10 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-blue-600 to-cyan-500 p-1.5 rounded-lg">
              <Anchor className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-lg font-bold text-white">BlueOS Admin</h1>
          </div>
          <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-400">
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile Bottom Navigation */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 z-20 px-2 py-2 pb-safe">
          <div className="flex justify-around items-center">
            <button onClick={() => setActiveView('overview')} className={`mobile-nav-item ${activeView === 'overview' ? 'text-blue-400 bg-blue-500/10' : 'text-slate-400'}`}>
              <LayoutDashboard className="w-5 h-5" />
              <span className="text-[10px] font-medium">Overview</span>
            </button>
            <button onClick={() => setActiveView('vessels')} className={`mobile-nav-item ${activeView === 'vessels' ? 'text-blue-400 bg-blue-500/10' : 'text-slate-400'}`}>
              <Ship className="w-5 h-5" />
              <span className="text-[10px] font-medium">Vessels</span>
            </button>
            <button onClick={() => setActiveView('trips')} className={`mobile-nav-item ${activeView === 'trips' ? 'text-blue-400 bg-blue-500/10' : 'text-slate-400'}`}>
              <Anchor className="w-5 h-5" />
              <span className="text-[10px] font-medium">Trips</span>
            </button>
            <button onClick={() => setActiveView('registry')} className={`mobile-nav-item ${activeView === 'registry' ? 'text-blue-400 bg-blue-500/10' : 'text-slate-400'}`}>
              <Database className="w-5 h-5" />
              <span className="text-[10px] font-medium">Registry</span>
            </button>
            <button onClick={() => navigate('/qr-generator')} className="mobile-nav-item text-slate-400">
              <QrCode className="w-5 h-5" />
              <span className="text-[10px] font-medium">QR</span>
            </button>
          </div>
        </div>

        {activeView === 'overview' && (
          <div className="space-y-6 lg:space-y-8 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <h2 className="text-xl sm:text-2xl font-bold text-white">Dashboard Overview</h2>
              <button 
                onClick={loadDashboardData} 
                className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center gap-2"
              >
                <Waves className="w-4 h-4" />
                Refresh Data
              </button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
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
                        {(() => {
                          const isPending = trip.trip_code?.startsWith('REQ-') || trip.status === 'pending';
                          return (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              !isPending && trip.status === 'active' 
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                                : isPending
                                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}>
                              {isPending ? 'Pending Approval' : trip.status === 'active' ? 'Active' : trip.status}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4 flex items-center gap-3">
                        {(trip.trip_code?.startsWith('REQ-') || trip.status === 'pending') && (
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

        {activeView === 'registry' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <Database className="w-7 h-7 text-blue-400" />
                  Registry
                </h2>
                <p className="text-slate-400 text-sm mt-1">Master Data & Root ID Management</p>
              </div>
              <button 
                onClick={() => setShowAddParticipant(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
              >
                <Plus className="w-5 h-5" />
                Add Participant
              </button>
            </div>

            {/* Registry Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-xl p-4">
                <p className="text-slate-400 text-xs font-medium">Total Entries</p>
                <h3 className="text-2xl font-bold text-white">{registryStats.total}</h3>
              </div>
              <div className="bg-slate-900/50 backdrop-blur-xl border border-emerald-500/30 rounded-xl p-4">
                <p className="text-emerald-400 text-xs font-medium">Active</p>
                <h3 className="text-2xl font-bold text-emerald-400">{registryStats.active}</h3>
              </div>
              <div className="bg-slate-900/50 backdrop-blur-xl border border-red-500/30 rounded-xl p-4">
                <p className="text-red-400 text-xs font-medium">Inactive</p>
                <h3 className="text-2xl font-bold text-red-400">{registryStats.inactive}</h3>
              </div>
              <div className="bg-slate-900/50 backdrop-blur-xl border border-blue-500/30 rounded-xl p-4">
                <p className="text-blue-400 text-xs font-medium">Types</p>
                <h3 className="text-2xl font-bold text-blue-400">{Object.keys(registryStats.byType || {}).length}</h3>
              </div>
            </div>
            
            {/* Pending Registrations Section */}
            {pendingRegistrations.length > 0 && (
              <div className="bg-slate-900/50 backdrop-blur-xl border border-yellow-500/30 rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500"></div>
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-yellow-500" />
                  Pending Approvals ({pendingRegistrations.length})
                </h3>
                
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
                          <td className="px-4 py-3 text-slate-300">{reg.contact_info || reg.contact_number || 'N/A'}</td>
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
              </div>
            )}

            {/* Registry Master View */}
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="p-6 pb-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b border-slate-800">
                <h3 className="text-lg font-bold text-white">All Participants</h3>
                <div className="flex flex-wrap gap-2">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                    <input 
                      type="text" 
                      placeholder="Search by name, Root ID..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 w-52"
                    />
                  </div>
                  <select 
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-400 focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="all">All Types</option>
                    {Object.entries(PARTICIPANT_TYPES).map(([key, val]) => (
                      <option key={key} value={key}>{val.label}</option>
                    ))}
                  </select>
                  <select 
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-400 focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-950/50 border-b border-slate-800">
                    <tr>
                      <th className="px-6 py-4 text-sm font-medium text-slate-400">Root ID</th>
                      <th className="px-6 py-4 text-sm font-medium text-slate-400">Name/Identifier</th>
                      <th className="px-6 py-4 text-sm font-medium text-slate-400">Type</th>
                      <th className="px-6 py-4 text-sm font-medium text-slate-400">Status</th>
                      <th className="px-6 py-4 text-sm font-medium text-slate-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredRegistry.length > 0 ? (
                      filteredRegistry.map((entry) => {
                        const typeConfig = PARTICIPANT_TYPES[entry.type] || { label: entry.type, color: 'slate' };
                        return (
                          <tr key={entry.root_id} className="hover:bg-slate-800/30 transition-colors">
                            <td className="px-6 py-4">
                              <span className="font-mono text-sm bg-slate-800 px-2 py-1 rounded text-blue-400 border border-slate-700">
                                {entry.root_id}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div>
                                <p className="font-medium text-white">{entry.name}</p>
                                {entry.email && <p className="text-xs text-slate-500">{entry.email}</p>}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`text-xs font-medium px-2 py-1 rounded-full bg-${typeConfig.color}-500/20 text-${typeConfig.color}-400 border border-${typeConfig.color}-500/30`}>
                                {typeConfig.label}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                                entry.status === 'active' 
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
                              }`}>
                                {entry.status === 'active' ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => handleViewParticipant(entry)}
                                  className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors border border-blue-500/30"
                                  title="View Profile"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleToggleParticipantStatus(entry.root_id)}
                                  className={`p-1.5 rounded-lg transition-colors border ${
                                    entry.status === 'active'
                                      ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border-red-500/30'
                                      : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border-emerald-500/30'
                                  }`}
                                  title={entry.status === 'active' ? 'Disable' : 'Enable'}
                                >
                                  {entry.status === 'active' ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                          {registry.length === 0 
                            ? 'No participants in registry yet. Click "Add Participant" to create the first entry.'
                            : 'No participants found matching your filters.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Add Participant Modal */}
        {showAddParticipant && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-blue-400" />
                  Add New Participant
                </h3>
                <button onClick={() => setShowAddParticipant(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Name/Identifier *</label>
                  <input 
                    type="text"
                    value={newParticipant.name}
                    onChange={(e) => setNewParticipant(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                    placeholder="Enter name or identifier"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Participant Type *</label>
                  <select 
                    value={newParticipant.type}
                    onChange={(e) => setNewParticipant(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  >
                    {Object.entries(PARTICIPANT_TYPES).map(([key, val]) => (
                      <option key={key} value={key}>{val.label}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Email</label>
                  <input 
                    type="email"
                    value={newParticipant.email}
                    onChange={(e) => setNewParticipant(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                    placeholder="email@example.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Contact Number</label>
                  <input 
                    type="tel"
                    value={newParticipant.contact_number}
                    onChange={(e) => setNewParticipant(prev => ({ ...prev, contact_number: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                    placeholder="+91 XXXXX XXXXX"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Address</label>
                  <textarea 
                    value={newParticipant.address}
                    onChange={(e) => setNewParticipant(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 resize-none"
                    rows={2}
                    placeholder="Enter address"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button 
                  onClick={() => setShowAddParticipant(false)}
                  className="flex-1 px-4 py-3 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddParticipant}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
                >
                  Add to Registry
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Participant Modal */}
        {selectedParticipant && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Participant Profile</h3>
                <button onClick={closeParticipantDetails} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                  <p className="text-xs text-slate-500 mb-1">Root ID (Permanent)</p>
                  <p className="font-mono text-lg text-blue-400 font-bold">{selectedParticipant.root_id}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Name</p>
                    <p className="text-white font-medium">{selectedParticipant.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Type</p>
                    <p className="text-white">{PARTICIPANT_TYPES[selectedParticipant.type]?.label || selectedParticipant.type}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Status</p>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                      selectedParticipant.status === 'active' 
                        ? 'bg-emerald-500/20 text-emerald-400' 
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {selectedParticipant.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Created</p>
                    <p className="text-white text-sm">{new Date(selectedParticipant.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                
                {selectedParticipant.email && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Email</p>
                    <p className="text-white">{selectedParticipant.email}</p>
                  </div>
                )}
                
                {selectedParticipant.contact_number && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Contact</p>
                    <p className="text-white">{selectedParticipant.contact_number}</p>
                  </div>
                )}
                
                {selectedParticipant.address && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Address</p>
                    <p className="text-white text-sm">{selectedParticipant.address}</p>
                  </div>
                )}
              </div>
              
              <div className="flex gap-3 mt-6">
                <button 
                  onClick={closeParticipantDetails}
                  className="flex-1 px-4 py-3 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors"
                >
                  Close
                </button>
                <button 
                  onClick={() => {
                    handleToggleParticipantStatus(selectedParticipant.root_id);
                    closeParticipantDetails();
                  }}
                  className={`flex-1 px-4 py-3 rounded-xl font-medium transition-colors ${
                    selectedParticipant.status === 'active'
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
                >
                  {selectedParticipant.status === 'active' ? 'Disable Access' : 'Enable Access'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
