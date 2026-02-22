import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut, Package, Search, Eye, QrCode, CheckCircle, 
  AlertCircle, Clock, Printer, Plus, Scan, X, Truck,
  RefreshCw, User, Bell, MapPin, Fish, Activity, Scale,
  TrendingUp, Award, ChevronRight, Loader2, FileText, Shield,
  Calendar, Waves, BarChart3, Target, Box, Send
} from 'lucide-react';
import { useLanguage } from '../../../shared/context/LanguageContext';
import LanguageToggle from '../../../shared/components/Shared/LanguageToggle';
import Toast from '../../../shared/components/Shared/Toast';
import { aquaAuthAPI, aquaPackerAPI } from '../../services/aquaApi';

const AquaPackerDashboard = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState('ready');
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState(null);

  // Data states
  const [approvedHarvests, setApprovedHarvests] = useState([]);
  const [packedCrates, setPackedCrates] = useState([]);
  const [stats, setStats] = useState({ ready: 0, packed: 0, dispatched: 0, today: 0 });

  // Modal states
  const [selectedHarvest, setSelectedHarvest] = useState(null);
  const [showPackingModal, setShowPackingModal] = useState(false);
  const [showCrateModal, setShowCrateModal] = useState(false);
  const [selectedCrate, setSelectedCrate] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Packing form state
  const [packingForm, setPackingForm] = useState({
    weight_kg: '',
    number_of_crates: 1,
    ice_weight_kg: '',
    notes: ''
  });

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'ready', label: 'Ready to Pack', icon: CheckCircle },
    { id: 'crates', label: 'Packed Crates', icon: Package },
  ];

  // Check auth and load data on mount
  useEffect(() => {
    const initDashboard = async () => {
      try {
        const isAuth = await aquaAuthAPI.isAuthenticated();
        if (!isAuth) {
          navigate('/aquaculture/login/packer');
          return;
        }

        const currentUser = aquaAuthAPI.getCurrentUser();
        if (!currentUser || currentUser.role !== 'packer') {
          navigate('/aquaculture/login/packer');
          return;
        }

        setUser(currentUser);
        await loadAllData();
      } catch (error) {
        console.error('Init error:', error);
        showToast('Failed to initialize dashboard', 'error');
      } finally {
        setLoading(false);
      }
    };

    initDashboard();
  }, [navigate]);

  const loadAllData = async () => {
    try {
      setRefreshing(true);
      const [harvestsRes, cratesRes, dashboardRes] = await Promise.all([
        aquaPackerAPI.getApprovedHarvests().catch(e => ({ success: false, data: [] })),
        aquaPackerAPI.getCrates().catch(e => ({ success: false, data: [] })),
        aquaPackerAPI.getDashboardStats().catch(e => ({ success: false, stats: {} }))
      ]);

      console.log('Packer API Responses:', { harvestsRes, cratesRes, dashboardRes });

      if (harvestsRes.success) setApprovedHarvests(harvestsRes.data || []);
      if (cratesRes.success) setPackedCrates(cratesRes.data || []);
      if (dashboardRes.success && dashboardRes.stats) setStats(dashboardRes.stats);
    } catch (error) {
      console.error('Load data error:', error);
      if (error.response?.status === 401) {
        showToast('Session expired. Please login again.', 'error');
        setTimeout(() => navigate('/aquaculture/login/packer'), 1500);
        return;
      }
      showToast('Failed to load data', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    await loadAllData();
    showToast('Data refreshed successfully', 'success');
  };

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleLogout = () => {
    aquaAuthAPI.logout();
  };

  const handleStartPacking = (harvest) => {
    setSelectedHarvest(harvest);
    setPackingForm({
      weight_kg: '',
      number_of_crates: 1,
      ice_weight_kg: '',
      notes: ''
    });
    setShowPackingModal(true);
  };

  const handleSubmitPacking = async (e) => {
    e.preventDefault();
    if (!selectedHarvest) return;

    setSubmitting(true);
    try {
      const packingData = {
        harvest_id: selectedHarvest.id,
        weight_kg: parseFloat(packingForm.weight_kg),
        number_of_crates: parseInt(packingForm.number_of_crates),
        ice_weight_kg: parseFloat(packingForm.ice_weight_kg) || 0,
        notes: packingForm.notes
      };

      const result = await aquaPackerAPI.packCrate(packingData);
      
      if (result.success) {
        showToast(`${packingForm.number_of_crates} crate(s) packed successfully!`, 'success');
        setShowPackingModal(false);
        setSelectedHarvest(null);
        await loadAllData();
      } else {
        showToast(result.error || 'Failed to pack crates', 'error');
      }
    } catch (error) {
      console.error('Packing error:', error);
      showToast('Failed to pack crates', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDispatch = async (crate) => {
    const destination = window.prompt('Enter dispatch destination:', 'Distribution Center');
    if (!destination) return;
    const vehicleNumber = window.prompt('Enter vehicle number (optional):', '') || 'N/A';
    try {
      const result = await aquaPackerAPI.dispatchCrate(crate.id, {
        dispatched_to: destination,
        vehicle_number: vehicleNumber
      });
      
      if (result.success) {
        showToast('Crate dispatched successfully!', 'success');
        await loadAllData();
      } else {
        showToast(result.error || 'Failed to dispatch', 'error');
      }
    } catch (error) {
      showToast('Failed to dispatch crate', 'error');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      approved: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      packed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      active: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      dispatched: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      ready: 'bg-amber-500/20 text-amber-400 border-amber-500/30'
    };
    return colors[status] || 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-orange-950 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-orange-500/30 rounded-full animate-pulse"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-orange-500 rounded-full animate-spin"></div>
            <Package className="absolute inset-0 m-auto w-8 h-8 text-orange-400 animate-bounce" />
          </div>
          <p className="text-slate-400 mt-6 text-lg">Loading packer dashboard...</p>
        </div>
      </div>
    );
  }

  const colorMap = {
    emerald: { bg10: 'bg-emerald-500/10', hoverBg20: 'group-hover:bg-emerald-500/20', from20: 'from-emerald-500/20', to10: 'to-emerald-600/10', border20: 'border-emerald-500/20', text: 'text-emerald-400' },
    blue: { bg10: 'bg-blue-500/10', hoverBg20: 'group-hover:bg-blue-500/20', from20: 'from-blue-500/20', to10: 'to-blue-600/10', border20: 'border-blue-500/20', text: 'text-blue-400' },
    amber: { bg10: 'bg-amber-500/10', hoverBg20: 'group-hover:bg-amber-500/20', from20: 'from-amber-500/20', to10: 'to-amber-600/10', border20: 'border-amber-500/20', text: 'text-amber-400' },
    purple: { bg10: 'bg-purple-500/10', hoverBg20: 'group-hover:bg-purple-500/20', from20: 'from-purple-500/20', to10: 'to-purple-600/10', border20: 'border-purple-500/20', text: 'text-purple-400' },
  };

  const StatCard = ({ icon: Icon, label, value, subValue, color, onClick }) => {
    const c = colorMap[color] || colorMap.emerald;
    return (
    <div 
      onClick={onClick}
      className={`group relative bg-gradient-to-br from-slate-900/80 to-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className={`absolute -top-20 -right-20 w-40 h-40 ${c.bg10} rounded-full blur-3xl ${c.hoverBg20} transition-all duration-700`} />
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 bg-gradient-to-br ${c.from20} ${c.to10} rounded-xl border ${c.border20} group-hover:scale-110 transition-transform duration-300`}>
            <Icon className={`w-6 h-6 ${c.text}`} />
          </div>
        </div>
        <p className="text-3xl font-bold text-white mb-1 tracking-tight">{value}</p>
        <p className="text-sm text-slate-400">{label}</p>
        {subValue && <p className="text-xs text-slate-500 mt-1">{subValue}</p>}
      </div>
    </div>
    );
  };

  const renderOverview = () => (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 rounded-3xl p-8 shadow-2xl">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTRzLTItMi00LTJjMCAwLTIgMi0yIDRzMiA0IDIgNCAyLTIgMi00Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                <Package className="w-6 h-6 text-white" />
              </div>
              <span className="text-orange-100 text-sm font-medium uppercase tracking-wider">Crate Packer</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Welcome, {user?.fullName || user?.username || 'Packer'}! 📦
            </h2>
            <p className="text-orange-100/80 text-lg">
              Packer ID: <span className="font-mono bg-white/10 px-2 py-0.5 rounded">{String(user?.id || 'N/A')}</span>
            </p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-5 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-xl font-medium transition-all duration-300 hover:scale-105"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => setActiveTab('ready')}
              className="flex items-center gap-2 px-5 py-3 bg-white text-orange-600 rounded-xl font-bold transition-all duration-300 hover:scale-105 hover:shadow-lg"
            >
              <CheckCircle className="w-5 h-5" />
              Start Packing
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard icon={CheckCircle} label="Ready to Pack" value={approvedHarvests.length} color="emerald" onClick={() => setActiveTab('ready')} />
        <StatCard icon={Package} label="Total Packed" value={stats.packedCrates || packedCrates.length} color="blue" onClick={() => setActiveTab('crates')} />
        <StatCard icon={Box} label="Total Crates" value={packedCrates.length} color="amber" />
        <StatCard icon={Truck} label="Dispatched" value={packedCrates.filter(c => c.status === 'dispatched').length} color="purple" />
      </div>

      {/* Ready for Packing */}
      {approvedHarvests.length > 0 && (
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              Ready for Packing
            </h3>
            <button onClick={() => setActiveTab('ready')} className="text-emerald-400 hover:text-emerald-300 text-sm font-medium flex items-center gap-1">
              View All <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-3">
            {approvedHarvests.slice(0, 3).map((harvest, idx) => (
              <div 
                key={harvest.id || idx}
                className="flex items-center justify-between p-4 bg-slate-800/50 hover:bg-slate-800 rounded-xl transition-all duration-300"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center border border-emerald-500/20">
                    <Fish className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-white font-semibold">{harvest.harvest_code || `Harvest #${harvest.id}`}</p>
                    <p className="text-sm text-slate-400">{harvest.total_quantity_kg} kg • Grade {harvest.grade || 'A'}</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleStartPacking(harvest)}
                  className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl text-sm font-medium transition-all"
                >
                  Pack
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Packed Crates */}
      {packedCrates.length > 0 && (
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-400" />
              Recent Crates
            </h3>
            <button onClick={() => setActiveTab('crates')} className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center gap-1">
              View All <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4">
            {packedCrates.slice(0, 3).map((crate, idx) => (
              <div 
                key={crate.id || idx}
                className="p-4 bg-slate-800/50 rounded-xl border border-slate-700"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-sm text-blue-400">{crate.crate_code || `C-${crate.id}`}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${getStatusColor(crate.status)}`}>
                    {crate.status}
                  </span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Weight</span>
                    <span className="text-white font-medium">{crate.weight_kg} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Packed</span>
                    <span className="text-white">
                      {crate.packed_at ? new Date(crate.packed_at).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderReady = () => (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Ready for Packing</h2>
          <p className="text-slate-400">Approved harvests ready to be packed into crates</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {approvedHarvests.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {approvedHarvests.map((harvest, idx) => (
            <div 
              key={harvest.id || idx}
              className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-6 transition-all duration-500 hover:shadow-2xl hover:shadow-emerald-500/10"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/20">
                    <Fish className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{harvest.harvest_code || `H-${harvest.id}`}</h3>
                    <p className="text-sm text-slate-400">{harvest.species || 'Vannamei'}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor('approved')}`}>
                  Approved
                </span>
              </div>

              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-slate-400 flex items-center gap-2"><MapPin className="w-4 h-4" /> Farm</span>
                  <span className="text-white">{harvest.farm_name || 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 flex items-center gap-2"><Scale className="w-4 h-4" /> Quantity</span>
                  <span className="text-white font-bold">{harvest.total_quantity_kg} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 flex items-center gap-2"><Award className="w-4 h-4" /> Grade</span>
                  <span className="text-emerald-400 font-bold">{harvest.grade || 'A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 flex items-center gap-2"><Calendar className="w-4 h-4" /> Inspected</span>
                  <span className="text-white">
                    {harvest.inspection_date ? new Date(harvest.inspection_date).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>

              <button 
                onClick={() => handleStartPacking(harvest)}
                className="w-full py-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl font-bold transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/25 flex items-center justify-center gap-2"
              >
                <Package className="w-5 h-5" />
                Start Packing
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-900/50 border border-slate-800 rounded-2xl">
          <CheckCircle className="w-20 h-20 text-slate-700 mx-auto mb-6" />
          <h3 className="text-xl font-bold text-white mb-2">No Harvests Ready</h3>
          <p className="text-slate-400">Waiting for approved harvests from inspection</p>
        </div>
      )}
    </div>
  );

  const renderCrates = () => (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-2xl font-bold text-white">Packed Crates</h2>
        <p className="text-slate-400">Manage and track your packed crates</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-5 text-center">
          <Package className="w-8 h-8 text-blue-400 mx-auto mb-3" />
          <p className="text-3xl font-bold text-white">{packedCrates.filter(c => c.status === 'active').length}</p>
          <p className="text-sm text-slate-400">Active</p>
        </div>
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-5 text-center">
          <Truck className="w-8 h-8 text-purple-400 mx-auto mb-3" />
          <p className="text-3xl font-bold text-white">{packedCrates.filter(c => c.status === 'dispatched').length}</p>
          <p className="text-sm text-slate-400">Dispatched</p>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 text-center">
          <Scale className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
          <p className="text-3xl font-bold text-white">
            {packedCrates.reduce((sum, c) => sum + (parseFloat(c.weight_kg) || 0), 0).toLocaleString()}
          </p>
          <p className="text-sm text-slate-400">Total Kg</p>
        </div>
      </div>

      {packedCrates.length > 0 ? (
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800/50">
                <tr>
                  <th className="text-left text-sm font-semibold text-slate-300 px-6 py-4">Crate Code</th>
                  <th className="text-left text-sm font-semibold text-slate-300 px-6 py-4">Weight</th>
                  <th className="text-left text-sm font-semibold text-slate-300 px-6 py-4">Species</th>
                  <th className="text-left text-sm font-semibold text-slate-300 px-6 py-4">Packed</th>
                  <th className="text-left text-sm font-semibold text-slate-300 px-6 py-4">Status</th>
                  <th className="text-left text-sm font-semibold text-slate-300 px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {packedCrates.map((crate, idx) => (
                  <tr 
                    key={crate.id || idx}
                    className="border-t border-slate-800 hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                          <Package className="w-5 h-5 text-blue-400" />
                        </div>
                        <span className="text-white font-mono font-medium">{crate.crate_code || `C-${crate.id}`}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-white font-bold">{crate.weight_kg} kg</td>
                    <td className="px-6 py-4 text-slate-400">{crate.species || 'Vannamei'}</td>
                    <td className="px-6 py-4 text-slate-400">
                      {crate.packed_at ? new Date(crate.packed_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(crate.status)}`}>
                        {crate.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => showToast(`Crate QR: ${crate.crate_code || `CRATE-${crate.id}`}`, 'info')}
                          className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                        >
                          <QrCode className="w-4 h-4 text-slate-400" />
                        </button>
                        {(crate.status === 'packed' || crate.status === 'active') && (
                          <button 
                            onClick={() => handleDispatch(crate)}
                            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-sm rounded-lg flex items-center gap-1 transition-colors"
                          >
                            <Truck className="w-3 h-3" />
                            Dispatch
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-900/50 border border-slate-800 rounded-2xl">
          <Package className="w-20 h-20 text-slate-700 mx-auto mb-6" />
          <h3 className="text-xl font-bold text-white mb-2">No Crates Yet</h3>
          <p className="text-slate-400">Pack your first harvest to see crates here</p>
        </div>
      )}
    </div>
  );

  const inputClass = "w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all";
  const labelClass = "block text-sm font-medium text-slate-400 mb-2";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-orange-950">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.5s ease-out; }
        .animate-slideUp { animation: slideUp 0.4s ease-out; }
      `}</style>

      {/* Header */}
      <header className="bg-slate-900/80 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl shadow-lg shadow-orange-500/25">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Crate Packer</h1>
              <p className="text-xs text-slate-400">Aquaculture Division</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <LanguageToggle />
            <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors relative">
              <Bell className="w-5 h-5 text-slate-400" />
              {approvedHarvests.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full text-xs text-white flex items-center justify-center font-bold">
                  {approvedHarvests.length}
                </span>
              )}
            </button>
            <div className="hidden sm:flex items-center gap-3 px-3 py-2 bg-slate-800/50 rounded-xl">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-medium">{user?.fullName || user?.username}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="bg-slate-900/50 border-b border-slate-800 sticky top-[65px] z-30 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 py-2">
            {tabs.map(tab => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-orange-600/20 to-amber-500/10 text-orange-400 border border-orange-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  {tab.label}
                  {tab.id === 'ready' && approvedHarvests.length > 0 && (
                    <span className="ml-1 px-2 py-0.5 bg-emerald-500 text-white text-xs rounded-full">
                      {approvedHarvests.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'ready' && renderReady()}
        {activeTab === 'crates' && renderCrates()}
      </main>

      {/* Packing Modal */}
      {showPackingModal && selectedHarvest && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div 
            className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl animate-slideUp"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-gradient-to-r from-orange-600/10 to-transparent">
              <div className="flex items-center gap-3">
                <Package className="w-6 h-6 text-orange-400" />
                <div>
                  <h3 className="text-xl font-bold text-white">Pack Crates</h3>
                  <p className="text-sm text-slate-400">{selectedHarvest.harvest_code || `Harvest #${selectedHarvest.id}`}</p>
                </div>
              </div>
              <button onClick={() => setShowPackingModal(false)} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmitPacking} className="p-6 space-y-6">
              {/* Harvest Info */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-slate-800/50 rounded-xl">
                <div>
                  <p className="text-xs text-slate-400">Available</p>
                  <p className="text-white font-bold">{selectedHarvest.total_quantity_kg} kg</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Species</p>
                  <p className="text-white font-bold">{selectedHarvest.species || 'Vannamei'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Grade</p>
                  <p className="text-emerald-400 font-bold">{selectedHarvest.grade || 'A'}</p>
                </div>
              </div>

              {/* Packing Form */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Weight per Crate (kg) *</label>
                  <input 
                    type="number" 
                    step="0.1"
                    value={packingForm.weight_kg} 
                    onChange={e => setPackingForm({ ...packingForm, weight_kg: e.target.value })} 
                    className={inputClass} 
                    placeholder="25"
                    required
                  />
                </div>
                <div>
                  <label className={labelClass}>Number of Crates *</label>
                  <input 
                    type="number" 
                    min="1"
                    value={packingForm.number_of_crates} 
                    onChange={e => setPackingForm({ ...packingForm, number_of_crates: e.target.value })} 
                    className={inputClass} 
                    placeholder="1"
                    required
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Ice Weight (kg)</label>
                <input 
                  type="number" 
                  step="0.1"
                  value={packingForm.ice_weight_kg} 
                  onChange={e => setPackingForm({ ...packingForm, ice_weight_kg: e.target.value })} 
                  className={inputClass} 
                  placeholder="5"
                />
              </div>

              <div>
                <label className={labelClass}>Notes</label>
                <textarea 
                  value={packingForm.notes} 
                  onChange={e => setPackingForm({ ...packingForm, notes: e.target.value })} 
                  className={inputClass} 
                  rows={2}
                  placeholder="Additional notes..."
                />
              </div>

              {/* Summary */}
              <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-400">Total Weight</span>
                  <span className="text-white font-bold">
                    {((parseFloat(packingForm.weight_kg) || 0) * (parseInt(packingForm.number_of_crates) || 1)).toFixed(1)} kg
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Crates to Create</span>
                  <span className="text-orange-400 font-bold">{packingForm.number_of_crates || 1}</span>
                </div>
              </div>

              {/* Submit Button */}
              <button 
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl font-bold text-lg transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating Crates...
                  </>
                ) : (
                  <>
                    <Package className="w-5 h-5" />
                    Create {packingForm.number_of_crates || 1} Crate(s)
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default AquaPackerDashboard;
