import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Routes, Route, useLocation, Link } from 'react-router-dom';
import { 
  LogOut, Home, Droplets, Fish, MapPin, Calendar, Plus, Edit, Trash2, 
  Eye, Search, Filter, ChevronRight, Waves, Leaf, Package, BarChart3,
  AlertCircle, CheckCircle, Clock, Loader2, RefreshCw, X, Thermometer,
  Beaker, Scale, Activity, TrendingUp, Bell, Settings, User, Menu,
  ChevronDown, ArrowUpRight, Zap, Target, Award, Droplet, Wind,
  Sun, Moon, CloudRain, FileText, Camera, QrCode, Share2, Download
} from 'lucide-react';
import { useLanguage } from '../../../shared/context/LanguageContext';
import LanguageToggle from '../../../shared/components/Shared/LanguageToggle';
import Toast from '../../../shared/components/Shared/Toast';
import { aquaAuthAPI, aquaFarmerAPI } from '../../services/aquaApi';

const AquaFarmerDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState('overview');
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Modal states
  const [showAddFarmModal, setShowAddFarmModal] = useState(false);
  const [showAddPondModal, setShowAddPondModal] = useState(false);
  const [showHarvestModal, setShowHarvestModal] = useState(false);
  const [showStockingModal, setShowStockingModal] = useState(false);
  const [showWaterQualityModal, setShowWaterQualityModal] = useState(false);
  const [showFeedModal, setShowFeedModal] = useState(false);
  const [selectedPond, setSelectedPond] = useState(null);
  const [selectedFarm, setSelectedFarm] = useState(null);

  // Data states
  const [user, setUser] = useState(null);
  const [farms, setFarms] = useState([]);
  const [ponds, setPonds] = useState([]);
  const [harvests, setHarvests] = useState([]);
  const [stockings, setStockings] = useState([]);
  const [waterQuality, setWaterQuality] = useState([]);
  const [feedRecords, setFeedRecords] = useState([]);

  // Form states
  const [farmForm, setFarmForm] = useState({
    farm_name: '',
    address: '',
    district: '',
    total_area_acres: '',
    water_source: '',
    primary_species: 'Vannamei'
  });

  const [pondForm, setPondForm] = useState({
    farm_id: '',
    pond_name: '',
    area_acres: '',
    depth_meters: '',
    pond_type: 'earthen',
    species: 'Vannamei'
  });

  const [harvestForm, setHarvestForm] = useState({
    pond_id: '',
    harvest_date: new Date().toISOString().split('T')[0],
    harvest_type: 'full',
    total_quantity_kg: '',
    avg_body_weight_g: '',
    method: 'full_drain',
    notes: ''
  });

  const [stockingForm, setStockingForm] = useState({
    pond_id: '',
    stocking_date: new Date().toISOString().split('T')[0],
    species: 'Vannamei',
    quantity: '',
    stocking_density: '',
    seed_source: '',
    hatchery_name: '',
    notes: ''
  });

  const [waterQualityForm, setWaterQualityForm] = useState({
    pond_id: '',
    temperature_c: '',
    ph: '',
    dissolved_oxygen: '',
    ammonia_ppm: '',
    salinity_ppt: '',
    transparency_cm: ''
  });

  const [feedForm, setFeedForm] = useState({
    pond_id: '',
    feed_type: '',
    brand: '',
    quantity_kg: '',
    feed_size: '',
    feeding_times: 4
  });

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Home, color: 'emerald' },
    { id: 'farms', label: 'My Farms', icon: MapPin, color: 'blue' },
    { id: 'ponds', label: 'Pond Management', icon: Waves, color: 'cyan' },
    { id: 'stockings', label: 'Stockings', icon: Fish, color: 'amber' },
    { id: 'water-quality', label: 'Water Quality', icon: Droplet, color: 'sky' },
    { id: 'feed', label: 'Feed Records', icon: Package, color: 'orange' },
    { id: 'harvests', label: 'Harvests', icon: Target, color: 'purple' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, color: 'pink' }
  ];

  // Check auth and load data on mount
  useEffect(() => {
    const initDashboard = async () => {
      try {
        const isAuth = await aquaAuthAPI.isAuthenticated();
        if (!isAuth) {
          navigate('/aquaculture/login/farmer');
          return;
        }

        const currentUser = aquaAuthAPI.getCurrentUser();
        if (!currentUser || currentUser.role !== 'farmer') {
          navigate('/aquaculture/login/farmer');
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
      const [farmsRes, pondsRes, harvestsRes, stockingsRes] = await Promise.all([
        aquaFarmerAPI.getFarms().catch(e => ({ success: false, data: [] })),
        aquaFarmerAPI.getPonds().catch(e => ({ success: false, data: [] })),
        aquaFarmerAPI.getHarvests().catch(e => ({ success: false, data: [] })),
        aquaFarmerAPI.getStockings().catch(e => ({ success: false, data: [] }))
      ]);

      console.log('API Responses:', { farmsRes, pondsRes, harvestsRes, stockingsRes });

      if (farmsRes.success) setFarms(farmsRes.data || []);
      if (pondsRes.success) setPonds(pondsRes.data || []);
      if (harvestsRes.success) setHarvests(harvestsRes.data || []);
      if (stockingsRes.success) setStockings(stockingsRes.data || []);
    } catch (error) {
      console.error('Load data error:', error);
      if (error.response?.status === 401) {
        showToast('Session expired. Please login again.', 'error');
        setTimeout(() => navigate('/aquaculture/login/farmer'), 1500);
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

  const getStatusColor = (status) => {
    const colors = {
      stocked: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      ready: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      empty: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
      preparation: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      pending_inspection: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      inspected: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      approved: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      packed: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      harvesting: 'bg-orange-500/20 text-orange-400 border-orange-500/30'
    };
    return colors[status] || 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  };

  const calculateDOC = (stockingDate) => {
    if (!stockingDate) return 0;
    const start = new Date(stockingDate);
    const now = new Date();
    const diffTime = Math.abs(now - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleLogout = () => {
    aquaAuthAPI.logout();
  };

  // API Handlers
  const handleAddFarm = async (e) => {
    e.preventDefault();
    try {
      const result = await aquaFarmerAPI.createFarm(farmForm);
      if (result.success) {
        showToast('Farm added successfully!', 'success');
        setShowAddFarmModal(false);
        setFarmForm({ farm_name: '', address: '', district: '', total_area_acres: '', water_source: '', primary_species: 'Vannamei' });
        await loadAllData();
      } else {
        showToast(result.error || result.message || 'Failed to add farm', 'error');
      }
    } catch (error) {
      console.error('Farm error:', error);
      showToast(error.response?.data?.message || 'Failed to add farm', 'error');
    }
  };

  const handleAddPond = async (e) => {
    e.preventDefault();
    try {
      const result = await aquaFarmerAPI.createPond(pondForm);
      if (result.success) {
        showToast('Pond added successfully!', 'success');
        setShowAddPondModal(false);
        setPondForm({ farm_id: '', pond_name: '', area_acres: '', depth_meters: '', pond_type: 'earthen', species: 'Vannamei' });
        await loadAllData();
      } else {
        showToast(result.error || result.message || 'Failed to add pond', 'error');
      }
    } catch (error) {
      console.error('Pond error:', error);
      showToast(error.response?.data?.message || 'Failed to add pond', 'error');
    }
  };

  const handleAddStocking = async (e) => {
    e.preventDefault();
    try {
      const result = await aquaFarmerAPI.createStocking({
        ...stockingForm,
        stocking_date: stockingForm.stocking_date || new Date().toISOString().split('T')[0]
      });
      if (result.success) {
        showToast('Stocking recorded successfully!', 'success');
        setShowStockingModal(false);
        setStockingForm({ pond_id: '', stocking_date: new Date().toISOString().split('T')[0], species: 'Vannamei', quantity: '', stocking_density: '', seed_source: '', hatchery_name: '', notes: '' });
        await loadAllData();
      } else {
        showToast(result.error || result.message || 'Failed to record stocking', 'error');
      }
    } catch (error) {
      console.error('Stocking error:', error);
      showToast(error.response?.data?.message || 'Failed to record stocking', 'error');
    }
  };

  const handleAddHarvest = async (e) => {
    e.preventDefault();
    try {
      const result = await aquaFarmerAPI.createHarvest({
        ...harvestForm,
        harvest_date: harvestForm.harvest_date || new Date().toISOString().split('T')[0]
      });
      if (result.success) {
        showToast('Harvest recorded successfully!', 'success');
        setShowHarvestModal(false);
        setHarvestForm({ pond_id: '', harvest_date: new Date().toISOString().split('T')[0], harvest_type: 'full', total_quantity_kg: '', avg_body_weight_g: '', method: 'full_drain', notes: '' });
        await loadAllData();
      } else {
        showToast(result.error || result.message || 'Failed to record harvest', 'error');
      }
    } catch (error) {
      console.error('Harvest error:', error);
      showToast(error.response?.data?.message || 'Failed to record harvest', 'error');
    }
  };

  const handleAddWaterQuality = async (e) => {
    e.preventDefault();
    try {
      const result = await aquaFarmerAPI.recordWaterQuality({
        ...waterQualityForm,
        recorded_date: new Date().toISOString().split('T')[0]
      });
      if (result.success) {
        showToast('Water quality recorded!', 'success');
        setShowWaterQualityModal(false);
        setWaterQualityForm({ pond_id: '', temperature_c: '', ph: '', dissolved_oxygen: '', ammonia_ppm: '', salinity_ppt: '', transparency_cm: '' });
        await loadAllData();
      } else {
        showToast(result.error || result.message || 'Failed to record', 'error');
      }
    } catch (error) {
      console.error('Water quality error:', error);
      showToast(error.response?.data?.message || 'Failed to record water quality', 'error');
    }
  };

  const handleAddFeed = async (e) => {
    e.preventDefault();
    try {
      const result = await aquaFarmerAPI.recordFeed({
        ...feedForm,
        feed_date: new Date().toISOString().split('T')[0]
      });
      if (result.success) {
        showToast('Feed record added!', 'success');
        setShowFeedModal(false);
        setFeedForm({ pond_id: '', feed_type: '', brand: '', quantity_kg: '', feed_size: '', feeding_times: 4 });
        await loadAllData();
      } else {
        showToast(result.error || result.message || 'Failed to record', 'error');
      }
    } catch (error) {
      console.error('Feed error:', error);
      showToast(error.response?.data?.message || 'Failed to record feed', 'error');
    }
  };

  // Get active stocking for a pond
  const getActiveStocking = (pondId) => {
    return stockings.find(s => s.pond_id === pondId && s.status === 'active');
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-emerald-500/30 rounded-full animate-pulse"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-emerald-500 rounded-full animate-spin"></div>
            <Fish className="absolute inset-0 m-auto w-8 h-8 text-emerald-400 animate-bounce" />
          </div>
          <p className="text-slate-400 mt-6 text-lg">Loading your aquaculture dashboard...</p>
          <div className="flex justify-center gap-1 mt-4">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Stats calculations
  const totalPonds = ponds.length;
  const stockedPonds = ponds.filter(p => p.status === 'stocked').length;
  const readyPonds = ponds.filter(p => p.status === 'ready').length;
  const emptyPonds = ponds.filter(p => p.status === 'empty').length;
  const totalHarvestKg = harvests.reduce((sum, h) => sum + (parseFloat(h.total_quantity_kg) || 0), 0);
  const pendingHarvests = harvests.filter(h => h.status === 'pending_inspection').length;

  // Animated stat card component
  const StatCard = ({ icon: Icon, label, value, subValue, color, trend, onClick }) => (
    <div 
      onClick={onClick}
      className={`group relative bg-gradient-to-br from-slate-900/80 to-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-${color}-500/10 ${onClick ? 'cursor-pointer' : ''}`}
    >
      {/* Animated background glow */}
      <div className={`absolute -top-20 -right-20 w-40 h-40 bg-${color}-500/10 rounded-full blur-3xl group-hover:bg-${color}-500/20 transition-all duration-700`} />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 bg-gradient-to-br from-${color}-500/20 to-${color}-600/10 rounded-xl border border-${color}-500/20 group-hover:scale-110 transition-transform duration-300`}>
            <Icon className={`w-6 h-6 text-${color}-400`} />
          </div>
          {trend && (
            <div className={`flex items-center gap-1 text-xs font-medium ${trend > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              <ArrowUpRight className={`w-3 h-3 ${trend < 0 ? 'rotate-90' : ''}`} />
              {Math.abs(trend)}%
            </div>
          )}
        </div>
        <p className="text-3xl font-bold text-white mb-1 tracking-tight">{value}</p>
        <p className="text-sm text-slate-400">{label}</p>
        {subValue && <p className="text-xs text-slate-500 mt-1">{subValue}</p>}
      </div>
      
      {/* Hover border effect */}
      <div className={`absolute inset-0 rounded-2xl border-2 border-${color}-500/0 group-hover:border-${color}-500/30 transition-all duration-500`} />
    </div>
  );

  const renderOverview = () => (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-3xl p-8 shadow-2xl">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTRzLTItMi00LTJjMCAwLTIgMi0yIDRzMiA0IDIgNCAyLTIgMi00Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-300/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                <Fish className="w-6 h-6 text-white" />
              </div>
              <span className="text-emerald-100 text-sm font-medium uppercase tracking-wider">Aquaculture Dashboard</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Welcome back, {user?.fullName || user?.username || 'Farmer'}! 👋
            </h2>
            <p className="text-emerald-100/80 text-lg">
              Farmer ID: <span className="font-mono bg-white/10 px-2 py-0.5 rounded">{String(user?.id || 'N/A').substring(0, 8)}</span>
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
              onClick={() => setShowAddFarmModal(true)}
              className="flex items-center gap-2 px-5 py-3 bg-white text-emerald-600 rounded-xl font-bold transition-all duration-300 hover:scale-105 hover:shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Add Farm
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard icon={MapPin} label="Total Farms" value={farms.length} color="emerald" trend={12} onClick={() => setActiveTab('farms')} />
        <StatCard icon={Waves} label="Total Ponds" value={totalPonds} subValue={`${stockedPonds} stocked`} color="blue" onClick={() => setActiveTab('ponds')} />
        <StatCard icon={Fish} label="Active Stocks" value={stockedPonds} subValue={`${readyPonds} ready for harvest`} color="amber" onClick={() => setActiveTab('stockings')} />
        <StatCard icon={Package} label="Total Harvest" value={`${totalHarvestKg.toLocaleString()} kg`} subValue={`${pendingHarvests} pending inspection`} color="purple" onClick={() => setActiveTab('harvests')} />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Waves, label: 'Add Pond', color: 'blue', onClick: () => setShowAddPondModal(true) },
          { icon: Fish, label: 'New Stocking', color: 'amber', onClick: () => setShowStockingModal(true) },
          { icon: Droplet, label: 'Log Water Quality', color: 'cyan', onClick: () => setShowWaterQualityModal(true) },
          { icon: Package, label: 'Record Harvest', color: 'emerald', onClick: () => setShowHarvestModal(true) }
        ].map((action, idx) => (
          <button
            key={idx}
            onClick={action.onClick}
            className={`group flex flex-col items-center gap-3 p-6 bg-slate-900/50 hover:bg-slate-800/50 border border-slate-800 hover:border-${action.color}-500/50 rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-${action.color}-500/10`}
          >
            <div className={`p-4 bg-${action.color}-500/10 group-hover:bg-${action.color}-500/20 rounded-xl transition-colors duration-300`}>
              <action.icon className={`w-6 h-6 text-${action.color}-400`} />
            </div>
            <span className="text-white font-medium">{action.label}</span>
          </button>
        ))}
      </div>

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Ponds */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Waves className="w-5 h-5 text-blue-400" />
              Pond Status
            </h3>
            <button onClick={() => setActiveTab('ponds')} className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center gap-1">
              View All <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          {ponds.length > 0 ? (
            <div className="space-y-3">
              {ponds.slice(0, 4).map((pond, idx) => {
                const doc = pond.stocking_date ? calculateDOC(pond.stocking_date) : pond.doc || 0;
                return (
                  <div 
                    key={pond.id || idx} 
                    className="group flex items-center justify-between p-4 bg-slate-800/50 hover:bg-slate-800 rounded-xl transition-all duration-300"
                    style={{ animationDelay: `${idx * 100}ms` }}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center border border-blue-500/20`}>
                        <Waves className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-white font-semibold">{pond.pond_name}</p>
                        <p className="text-sm text-slate-400">{pond.area_acres} acres • {pond.pond_type || 'Earthen'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(pond.status)}`}>
                        {pond.status}
                      </span>
                      {pond.status === 'stocked' && (
                        <p className="text-xs text-slate-500 mt-1">DOC: {doc} days</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Waves className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No ponds registered yet</p>
              <button 
                onClick={() => setShowAddPondModal(true)}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm transition-colors"
              >
                Add Your First Pond
              </button>
            </div>
          )}
        </div>

        {/* Recent Harvests */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-purple-400" />
              Recent Harvests
            </h3>
            <button onClick={() => setActiveTab('harvests')} className="text-purple-400 hover:text-purple-300 text-sm font-medium flex items-center gap-1">
              View All <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          {harvests.length > 0 ? (
            <div className="space-y-3">
              {harvests.slice(0, 4).map((harvest, idx) => (
                <div 
                  key={harvest.id || idx} 
                  className="flex items-center justify-between p-4 bg-slate-800/50 hover:bg-slate-800 rounded-xl transition-all duration-300"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-purple-500/20">
                      <Package className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-white font-semibold">{harvest.harvest_code || `Harvest #${harvest.id}`}</p>
                      <p className="text-sm text-slate-400">
                        {harvest.harvest_date ? new Date(harvest.harvest_date).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold">{harvest.total_quantity_kg} kg</p>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(harvest.status)}`}>
                      {harvest.status?.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No harvests recorded yet</p>
              <button 
                onClick={() => setShowHarvestModal(true)}
                className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm transition-colors"
              >
                Record First Harvest
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Ponds Ready for Harvest Alert */}
      {ponds.filter(p => p.status === 'ready' || (p.doc && p.doc >= 90)).length > 0 && (
        <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-500/20 rounded-lg animate-pulse">
              <Bell className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-lg font-bold text-white">Ponds Ready for Harvest</h3>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ponds.filter(p => p.status === 'ready' || (p.doc && p.doc >= 90)).map(pond => (
              <div key={pond.id} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  <div>
                    <p className="text-white font-medium">{pond.pond_name}</p>
                    <p className="text-xs text-slate-400">DOC: {pond.doc || 0} days</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setHarvestForm({ ...harvestForm, pond_id: pond.id });
                    setShowHarvestModal(true);
                  }}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded-lg transition-colors"
                >
                  Harvest
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderFarms = () => (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">My Farms</h2>
          <p className="text-slate-400">Manage your aquaculture farms</p>
        </div>
        <button 
          onClick={() => setShowAddFarmModal(true)}
          className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/25"
        >
          <Plus className="w-5 h-5" />
          Add New Farm
        </button>
      </div>

      {farms.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {farms.map((farm, idx) => {
            const farmPonds = ponds.filter(p => p.farm_id === farm.id);
            return (
              <div 
                key={farm.id || idx}
                className="group bg-slate-900/50 backdrop-blur-xl border border-slate-800 hover:border-emerald-500/50 rounded-2xl overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-emerald-500/10"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                {/* Farm Header */}
                <div className="relative h-40 bg-gradient-to-br from-emerald-600/30 to-teal-600/30 overflow-hidden">
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0YzAtMiAyLTQgMi00cy0yLTItNC0yYzAgMC0yIDItMiA0czIgNCAyIDQgMi0yIDItNCIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <MapPin className="w-16 h-16 text-emerald-400/50 group-hover:scale-110 transition-transform duration-500" />
                  </div>
                  <div className="absolute top-4 right-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(farm.status)}`}>
                      {farm.status}
                    </span>
                  </div>
                </div>

                {/* Farm Details */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-1 group-hover:text-emerald-400 transition-colors">{farm.farm_name}</h3>
                  <p className="text-sm text-slate-400 mb-4">{farm.farm_code}</p>

                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-2">
                        <MapPin className="w-4 h-4" /> Location
                      </span>
                      <span className="text-white text-right truncate max-w-[60%]">{farm.district || farm.address || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-2">
                        <Droplet className="w-4 h-4" /> Water Source
                      </span>
                      <span className="text-white">{farm.water_source || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-2">
                        <Activity className="w-4 h-4" /> Area
                      </span>
                      <span className="text-white">{farm.total_area_acres || 'N/A'} acres</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-2">
                        <Waves className="w-4 h-4" /> Ponds
                      </span>
                      <span className="text-emerald-400 font-semibold">{farmPonds.length}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-6 pt-4 border-t border-slate-800">
                    <button 
                      onClick={() => {
                        setSelectedFarm(farm);
                        setActiveTab('ponds');
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-medium transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      View Ponds
                    </button>
                    <button className="p-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-900/50 border border-slate-800 rounded-2xl">
          <div className="relative inline-block mb-6">
            <MapPin className="w-20 h-20 text-slate-700" />
            <Plus className="absolute -bottom-2 -right-2 w-8 h-8 text-emerald-400 bg-slate-900 rounded-full p-1" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No Farms Registered</h3>
          <p className="text-slate-400 mb-6">Start by adding your first aquaculture farm</p>
          <button 
            onClick={() => setShowAddFarmModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-medium transition-all duration-300 hover:scale-105"
          >
            Add Your First Farm
          </button>
        </div>
      )}
    </div>
  );

  const renderPonds = () => {
    const filteredPonds = selectedFarm ? ponds.filter(p => p.farm_id === selectedFarm.id) : ponds;

    return (
      <div className="space-y-6 animate-fadeIn">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Pond Management</h2>
            <p className="text-slate-400">Monitor and manage your ponds</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setShowWaterQualityModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 border border-cyan-500/30 rounded-xl font-medium transition-all"
            >
              <Droplet className="w-4 h-4" />
              Log Water Quality
            </button>
            <button 
              onClick={() => {
                setPondForm({ ...pondForm, farm_id: farms[0]?.id || '' });
                setShowAddPondModal(true);
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl font-medium transition-all duration-300 hover:scale-105"
            >
              <Plus className="w-5 h-5" />
              Add Pond
            </button>
          </div>
        </div>

        {/* Farm Filter */}
        {farms.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button 
              onClick={() => setSelectedFarm(null)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                !selectedFarm 
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/25' 
                  : 'bg-slate-800 hover:bg-slate-700 text-white'
              }`}
            >
              All Ponds ({ponds.length})
            </button>
            {farms.map(farm => (
              <button 
                key={farm.id}
                onClick={() => setSelectedFarm(farm)}
                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                  selectedFarm?.id === farm.id 
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/25' 
                    : 'bg-slate-800 hover:bg-slate-700 text-white'
                }`}
              >
                {farm.farm_name} ({ponds.filter(p => p.farm_id === farm.id).length})
              </button>
            ))}
          </div>
        )}

        {/* Ponds Grid */}
        {filteredPonds.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPonds.map((pond, idx) => {
              const farm = farms.find(f => f.id === pond.farm_id);
              const doc = pond.stocking_date ? calculateDOC(pond.stocking_date) : pond.doc || 0;
              const harvestProgress = Math.min(doc, 100);
              
              return (
                <div 
                  key={pond.id || idx}
                  className="group bg-slate-900/50 backdrop-blur-xl border border-slate-800 hover:border-blue-500/50 rounded-2xl p-6 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/10"
                  style={{ animationDelay: `${idx * 80}ms` }}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${
                        pond.status === 'stocked' ? 'from-emerald-500/20 to-teal-500/20 border-emerald-500/20' :
                        pond.status === 'ready' ? 'from-blue-500/20 to-cyan-500/20 border-blue-500/20' :
                        'from-slate-500/20 to-slate-600/20 border-slate-500/20'
                      } border`}>
                        <Waves className={`w-5 h-5 ${
                          pond.status === 'stocked' ? 'text-emerald-400' :
                          pond.status === 'ready' ? 'text-blue-400' :
                          'text-slate-400'
                        }`} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">{pond.pond_name}</h3>
                        <p className="text-sm text-slate-400">{farm?.farm_name || 'Unknown Farm'}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(pond.status)}`}>
                      {pond.status}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Area</span>
                      <span className="text-white font-medium">{pond.area_acres} acres</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Type</span>
                      <span className="text-white capitalize">{pond.pond_type || 'Earthen'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Species</span>
                      <span className="text-white capitalize">{pond.species || 'Vannamei'}</span>
                    </div>
                    {pond.status === 'stocked' && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">DOC</span>
                        <span className={`font-bold ${doc >= 90 ? 'text-emerald-400' : doc >= 60 ? 'text-amber-400' : 'text-blue-400'}`}>
                          {doc} days
                        </span>
                      </div>
                    )}
                  </div>

                  {/* DOC Progress Bar */}
                  {pond.status === 'stocked' && (
                    <div className="mb-4">
                      <div className="flex justify-between text-xs mb-2">
                        <span className="text-slate-400">Harvest Progress</span>
                        <span className="text-white font-medium">{harvestProgress}%</span>
                      </div>
                      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ${
                            harvestProgress >= 90 ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 
                            harvestProgress >= 60 ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 
                            'bg-gradient-to-r from-blue-500 to-cyan-500'
                          }`}
                          style={{ width: `${harvestProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {pond.status === 'stocked' && doc >= 60 && (
                      <button 
                        onClick={() => {
                          setHarvestForm({ ...harvestForm, pond_id: pond.id });
                          setShowHarvestModal(true);
                        }}
                        className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-sm font-medium transition-all"
                      >
                        Harvest
                      </button>
                    )}
                    {pond.status === 'empty' && (
                      <button 
                        onClick={() => {
                          setStockingForm({ ...stockingForm, pond_id: pond.id });
                          setShowStockingModal(true);
                        }}
                        className="flex-1 px-4 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl text-sm font-medium transition-all"
                      >
                        Start Stocking
                      </button>
                    )}
                    <button 
                      onClick={() => {
                        setWaterQualityForm({ ...waterQualityForm, pond_id: pond.id });
                        setShowWaterQualityModal(true);
                      }}
                      className="p-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors"
                    >
                      <Droplet className="w-4 h-4" />
                    </button>
                    <button className="p-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-slate-900/50 border border-slate-800 rounded-2xl">
            <Waves className="w-20 h-20 text-slate-700 mx-auto mb-6" />
            <h3 className="text-xl font-bold text-white mb-2">No Ponds Found</h3>
            <p className="text-slate-400 mb-6">
              {selectedFarm ? `No ponds in ${selectedFarm.farm_name}` : 'Start by adding ponds to your farms'}
            </p>
            <button 
              onClick={() => setShowAddPondModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-medium transition-all hover:scale-105"
            >
              Add Your First Pond
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderHarvests = () => (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Harvest Records</h2>
          <p className="text-slate-400">Track your harvest data and inspection status</p>
        </div>
        <button 
          onClick={() => setShowHarvestModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl font-medium transition-all duration-300 hover:scale-105"
        >
          <Plus className="w-5 h-5" />
          New Harvest
        </button>
      </div>

      {/* Harvest Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 text-center">
          <Clock className="w-8 h-8 text-amber-400 mx-auto mb-3" />
          <p className="text-3xl font-bold text-white">{harvests.filter(h => h.status === 'pending_inspection').length}</p>
          <p className="text-sm text-slate-400">Pending Inspection</p>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-5 text-center">
          <CheckCircle className="w-8 h-8 text-blue-400 mx-auto mb-3" />
          <p className="text-3xl font-bold text-white">{harvests.filter(h => h.status === 'approved').length}</p>
          <p className="text-sm text-slate-400">Approved</p>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 text-center">
          <Package className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
          <p className="text-3xl font-bold text-white">{harvests.filter(h => h.status === 'packed').length}</p>
          <p className="text-sm text-slate-400">Packed</p>
        </div>
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-5 text-center">
          <Scale className="w-8 h-8 text-purple-400 mx-auto mb-3" />
          <p className="text-3xl font-bold text-white">{totalHarvestKg.toLocaleString()}</p>
          <p className="text-sm text-slate-400">Total Kg</p>
        </div>
      </div>

      {/* Harvest List */}
      {harvests.length > 0 ? (
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800/50">
                <tr>
                  <th className="text-left text-sm font-semibold text-slate-300 px-6 py-4">Harvest Code</th>
                  <th className="text-left text-sm font-semibold text-slate-300 px-6 py-4">Date</th>
                  <th className="text-left text-sm font-semibold text-slate-300 px-6 py-4">Quantity</th>
                  <th className="text-left text-sm font-semibold text-slate-300 px-6 py-4">Avg Weight</th>
                  <th className="text-left text-sm font-semibold text-slate-300 px-6 py-4">Method</th>
                  <th className="text-left text-sm font-semibold text-slate-300 px-6 py-4">Status</th>
                  <th className="text-left text-sm font-semibold text-slate-300 px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {harvests.map((harvest, idx) => (
                  <tr 
                    key={harvest.id || idx} 
                    className="border-t border-slate-800 hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="text-white font-medium">{harvest.harvest_code || `H-${harvest.id}`}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {harvest.harvest_date ? new Date(harvest.harvest_date).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-white font-bold">{harvest.total_quantity_kg} kg</span>
                    </td>
                    <td className="px-6 py-4 text-slate-400">{harvest.avg_body_weight_g || '-'}g</td>
                    <td className="px-6 py-4 text-slate-400 capitalize">{harvest.method?.replace('_', ' ') || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(harvest.status)}`}>
                        {harvest.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
                          <Eye className="w-4 h-4 text-slate-400" />
                        </button>
                        <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
                          <QrCode className="w-4 h-4 text-slate-400" />
                        </button>
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
          <h3 className="text-xl font-bold text-white mb-2">No Harvests Yet</h3>
          <p className="text-slate-400 mb-6">Record your first harvest to start tracking</p>
          <button 
            onClick={() => setShowHarvestModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium transition-all hover:scale-105"
          >
            Record First Harvest
          </button>
        </div>
      )}
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-2xl font-bold text-white">Analytics & Reports</h2>
        <p className="text-slate-400">Insights into your aquaculture operations</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Production Summary */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            Production Summary
          </h3>
          <div className="space-y-4">
            <div className="p-4 bg-slate-800/50 rounded-xl">
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-400">Total Harvest</span>
                <span className="text-2xl font-bold text-emerald-400">{totalHarvestKg.toLocaleString()} kg</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full" style={{ width: '75%' }} />
              </div>
            </div>
            <div className="p-4 bg-slate-800/50 rounded-xl flex justify-between items-center">
              <span className="text-slate-400">Active Ponds</span>
              <span className="text-2xl font-bold text-blue-400">{stockedPonds}</span>
            </div>
            <div className="p-4 bg-slate-800/50 rounded-xl flex justify-between items-center">
              <span className="text-slate-400">Avg Survival Rate</span>
              <span className="text-2xl font-bold text-amber-400">87%</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            Quick Actions
          </h3>
          <div className="space-y-3">
            <button 
              onClick={() => setShowWaterQualityModal(true)}
              className="w-full p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-xl flex items-center gap-4 hover:bg-cyan-500/20 transition-colors group"
            >
              <div className="p-3 bg-cyan-500/20 rounded-xl group-hover:scale-110 transition-transform">
                <Thermometer className="w-6 h-6 text-cyan-400" />
              </div>
              <div className="text-left">
                <p className="text-white font-medium">Log Water Quality</p>
                <p className="text-sm text-slate-400">pH, DO, Temperature</p>
              </div>
            </button>
            <button 
              onClick={() => setShowFeedModal(true)}
              className="w-full p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-center gap-4 hover:bg-orange-500/20 transition-colors group"
            >
              <div className="p-3 bg-orange-500/20 rounded-xl group-hover:scale-110 transition-transform">
                <Package className="w-6 h-6 text-orange-400" />
              </div>
              <div className="text-left">
                <p className="text-white font-medium">Record Feeding</p>
                <p className="text-sm text-slate-400">Daily feed log</p>
              </div>
            </button>
            <button 
              onClick={() => setShowStockingModal(true)}
              className="w-full p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-4 hover:bg-amber-500/20 transition-colors group"
            >
              <div className="p-3 bg-amber-500/20 rounded-xl group-hover:scale-110 transition-transform">
                <Fish className="w-6 h-6 text-amber-400" />
              </div>
              <div className="text-left">
                <p className="text-white font-medium">New Stocking</p>
                <p className="text-sm text-slate-400">Add seed/PL batch</p>
              </div>
            </button>
          </div>
        </div>

        {/* Pond Status */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Waves className="w-5 h-5 text-blue-400" />
            Pond Distribution
          </h3>
          <div className="space-y-4">
            {[
              { label: 'Stocked', count: stockedPonds, color: 'emerald', pct: totalPonds > 0 ? (stockedPonds / totalPonds * 100) : 0 },
              { label: 'Ready', count: readyPonds, color: 'blue', pct: totalPonds > 0 ? (readyPonds / totalPonds * 100) : 0 },
              { label: 'Empty', count: emptyPonds, color: 'slate', pct: totalPonds > 0 ? (emptyPonds / totalPonds * 100) : 0 }
            ].map((item, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-400">{item.label}</span>
                  <span className="text-white font-medium">{item.count} ({item.pct.toFixed(0)}%)</span>
                </div>
                <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full bg-${item.color}-500 rounded-full transition-all duration-1000`}
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Modal Components
  const Modal = ({ show, onClose, title, children, icon: Icon, color = 'emerald' }) => {
    if (!show) return null;
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
        <div 
          className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl animate-slideUp"
          onClick={e => e.stopPropagation()}
        >
          <div className={`flex items-center justify-between p-6 border-b border-slate-800 bg-gradient-to-r from-${color}-600/10 to-transparent`}>
            <div className="flex items-center gap-3">
              {Icon && <Icon className={`w-6 h-6 text-${color}-400`} />}
              <h3 className="text-xl font-bold text-white">{title}</h3>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            {children}
          </div>
        </div>
      </div>
    );
  };

  const inputClass = "w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all";
  const labelClass = "block text-sm font-medium text-slate-400 mb-2";
  const buttonClass = "w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/25";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950">
      {/* Add CSS animation classes */}
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
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-slate-800 rounded-lg"
            >
              <Menu className="w-6 h-6 text-white" />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg shadow-emerald-500/25">
                <Fish className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Aquaculture</h1>
                <p className="text-xs text-slate-400">Farmer Dashboard</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <LanguageToggle />
            <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors relative">
              <Bell className="w-5 h-5 text-slate-400" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full" />
            </button>
            <div className="hidden sm:flex items-center gap-3 px-3 py-2 bg-slate-800/50 rounded-xl">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-medium">{user?.fullName || user?.username || 'Farmer'}</span>
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
          <div className="flex gap-1 overflow-x-auto py-2 scrollbar-hide">
            {tabs.map(tab => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap rounded-xl transition-all duration-300 ${
                    activeTab === tab.id
                      ? `bg-gradient-to-r from-${tab.color}-600/20 to-${tab.color}-500/10 text-${tab.color}-400 border border-${tab.color}-500/30`
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'farms' && renderFarms()}
        {activeTab === 'ponds' && renderPonds()}
        {activeTab === 'harvests' && renderHarvests()}
        {activeTab === 'analytics' && renderAnalytics()}
        {activeTab === 'stockings' && (
          <div className="text-center py-20">
            <Fish className="w-20 h-20 text-slate-700 mx-auto mb-6" />
            <h3 className="text-xl font-bold text-white mb-2">Stocking Management</h3>
            <p className="text-slate-400 mb-6">Manage your seed stocking records</p>
            <button onClick={() => setShowStockingModal(true)} className="px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl font-medium">
              Add New Stocking
            </button>
          </div>
        )}
        {activeTab === 'water-quality' && (
          <div className="text-center py-20">
            <Droplet className="w-20 h-20 text-slate-700 mx-auto mb-6" />
            <h3 className="text-xl font-bold text-white mb-2">Water Quality Monitoring</h3>
            <p className="text-slate-400 mb-6">Track water parameters for optimal growth</p>
            <button onClick={() => setShowWaterQualityModal(true)} className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl font-medium">
              Log Water Quality
            </button>
          </div>
        )}
        {activeTab === 'feed' && (
          <div className="text-center py-20">
            <Package className="w-20 h-20 text-slate-700 mx-auto mb-6" />
            <h3 className="text-xl font-bold text-white mb-2">Feed Management</h3>
            <p className="text-slate-400 mb-6">Track feeding schedules and consumption</p>
            <button onClick={() => setShowFeedModal(true)} className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl font-medium">
              Record Feeding
            </button>
          </div>
        )}
      </main>

      {/* Modals */}
      <Modal show={showAddFarmModal} onClose={() => setShowAddFarmModal(false)} title="Add New Farm" icon={MapPin} color="emerald">
        <form onSubmit={handleAddFarm} className="space-y-4">
          <div>
            <label className={labelClass}>Farm Name *</label>
            <input type="text" value={farmForm.farm_name} onChange={e => setFarmForm({ ...farmForm, farm_name: e.target.value })} className={inputClass} placeholder="e.g., Sunrise Aqua Farm" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>District</label>
              <input type="text" value={farmForm.district} onChange={e => setFarmForm({ ...farmForm, district: e.target.value })} className={inputClass} placeholder="e.g., Nellore" />
            </div>
            <div>
              <label className={labelClass}>Total Area (Acres)</label>
              <input type="number" step="0.1" value={farmForm.total_area_acres} onChange={e => setFarmForm({ ...farmForm, total_area_acres: e.target.value })} className={inputClass} placeholder="e.g., 4.5" />
            </div>
          </div>
          <div>
            <label className={labelClass}>Address</label>
            <textarea value={farmForm.address} onChange={e => setFarmForm({ ...farmForm, address: e.target.value })} className={inputClass} rows={2} placeholder="Full address..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Water Source</label>
              <select value={farmForm.water_source} onChange={e => setFarmForm({ ...farmForm, water_source: e.target.value })} className={inputClass}>
                <option value="">Select...</option>
                <option value="Bore Well">Bore Well</option>
                <option value="Canal">Canal</option>
                <option value="River">River</option>
                <option value="Mixed">Mixed</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Primary Species</label>
              <select value={farmForm.primary_species} onChange={e => setFarmForm({ ...farmForm, primary_species: e.target.value })} className={inputClass}>
                <option value="Vannamei">Vannamei</option>
                <option value="Rohu">Rohu</option>
                <option value="Catla">Catla</option>
                <option value="Tilapia">Tilapia</option>
              </select>
            </div>
          </div>
          <button type="submit" className={buttonClass}>Add Farm</button>
        </form>
      </Modal>

      <Modal show={showAddPondModal} onClose={() => setShowAddPondModal(false)} title="Add New Pond" icon={Waves} color="blue">
        <form onSubmit={handleAddPond} className="space-y-4">
          <div>
            <label className={labelClass}>Select Farm *</label>
            <select value={pondForm.farm_id} onChange={e => setPondForm({ ...pondForm, farm_id: e.target.value })} className={inputClass} required>
              <option value="">Choose farm...</option>
              {farms.map(farm => <option key={farm.id} value={farm.id}>{farm.farm_name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Pond Name *</label>
            <input type="text" value={pondForm.pond_name} onChange={e => setPondForm({ ...pondForm, pond_name: e.target.value })} className={inputClass} placeholder="e.g., Pond A1" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Area (Acres)</label>
              <input type="number" step="0.01" value={pondForm.area_acres} onChange={e => setPondForm({ ...pondForm, area_acres: e.target.value })} className={inputClass} placeholder="e.g., 0.8" />
            </div>
            <div>
              <label className={labelClass}>Depth (Meters)</label>
              <input type="number" step="0.1" value={pondForm.depth_meters} onChange={e => setPondForm({ ...pondForm, depth_meters: e.target.value })} className={inputClass} placeholder="e.g., 1.5" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Pond Type</label>
              <select value={pondForm.pond_type} onChange={e => setPondForm({ ...pondForm, pond_type: e.target.value })} className={inputClass}>
                <option value="earthen">Earthen</option>
                <option value="lined">Lined</option>
                <option value="concrete">Concrete</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Species</label>
              <select value={pondForm.species} onChange={e => setPondForm({ ...pondForm, species: e.target.value })} className={inputClass}>
                <option value="Vannamei">Vannamei</option>
                <option value="Rohu">Rohu</option>
                <option value="Catla">Catla</option>
                <option value="Tilapia">Tilapia</option>
              </select>
            </div>
          </div>
          <button type="submit" className={buttonClass.replace('emerald', 'blue').replace('teal', 'cyan')}>Add Pond</button>
        </form>
      </Modal>

      <Modal show={showStockingModal} onClose={() => setShowStockingModal(false)} title="Record Stocking" icon={Fish} color="amber">
        <form onSubmit={handleAddStocking} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Select Pond *</label>
              <select value={stockingForm.pond_id} onChange={e => setStockingForm({ ...stockingForm, pond_id: e.target.value })} className={inputClass} required>
                <option value="">Choose pond...</option>
                {ponds.filter(p => p.status === 'empty').map(pond => <option key={pond.id} value={pond.id}>{pond.pond_name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Stocking Date *</label>
              <input type="date" value={stockingForm.stocking_date} onChange={e => setStockingForm({ ...stockingForm, stocking_date: e.target.value })} className={inputClass} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Species</label>
              <select value={stockingForm.species} onChange={e => setStockingForm({ ...stockingForm, species: e.target.value })} className={inputClass}>
                <option value="Vannamei">Vannamei</option>
                <option value="Rohu">Rohu</option>
                <option value="Catla">Catla</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Quantity (PL/Seed) *</label>
              <input type="number" value={stockingForm.quantity} onChange={e => setStockingForm({ ...stockingForm, quantity: e.target.value })} className={inputClass} placeholder="e.g., 100000" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Stocking Density</label>
              <input type="text" value={stockingForm.stocking_density} onChange={e => setStockingForm({ ...stockingForm, stocking_density: e.target.value })} className={inputClass} placeholder="e.g., 60 PL/m²" />
            </div>
            <div>
              <label className={labelClass}>Hatchery Name</label>
              <input type="text" value={stockingForm.hatchery_name} onChange={e => setStockingForm({ ...stockingForm, hatchery_name: e.target.value })} className={inputClass} placeholder="Source hatchery" />
            </div>
          </div>
          <button type="submit" className={buttonClass.replace('emerald', 'amber').replace('teal', 'orange')}>Record Stocking</button>
        </form>
      </Modal>

      <Modal show={showHarvestModal} onClose={() => setShowHarvestModal(false)} title="Record Harvest" icon={Package} color="purple">
        <form onSubmit={handleAddHarvest} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Select Pond *</label>
              <select value={harvestForm.pond_id} onChange={e => setHarvestForm({ ...harvestForm, pond_id: e.target.value })} className={inputClass} required>
                <option value="">Choose pond...</option>
                {ponds.filter(p => p.status === 'stocked' || p.status === 'ready').map(pond => <option key={pond.id} value={pond.id}>{pond.pond_name} (DOC: {pond.doc || 0})</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Harvest Date *</label>
              <input type="date" value={harvestForm.harvest_date} onChange={e => setHarvestForm({ ...harvestForm, harvest_date: e.target.value })} className={inputClass} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Total Quantity (kg) *</label>
              <input type="number" value={harvestForm.total_quantity_kg} onChange={e => setHarvestForm({ ...harvestForm, total_quantity_kg: e.target.value })} className={inputClass} placeholder="e.g., 2500" required />
            </div>
            <div>
              <label className={labelClass}>Avg Weight (g)</label>
              <input type="number" value={harvestForm.avg_body_weight_g} onChange={e => setHarvestForm({ ...harvestForm, avg_body_weight_g: e.target.value })} className={inputClass} placeholder="e.g., 32" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Harvest Type</label>
              <select value={harvestForm.harvest_type} onChange={e => setHarvestForm({ ...harvestForm, harvest_type: e.target.value })} className={inputClass}>
                <option value="full">Full Harvest</option>
                <option value="partial">Partial Harvest</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Method</label>
              <select value={harvestForm.method} onChange={e => setHarvestForm({ ...harvestForm, method: e.target.value })} className={inputClass}>
                <option value="full_drain">Full Drain</option>
                <option value="partial_drain">Partial Drain</option>
                <option value="cast_net">Cast Net</option>
              </select>
            </div>
          </div>
          <div>
            <label className={labelClass}>Notes</label>
            <textarea value={harvestForm.notes} onChange={e => setHarvestForm({ ...harvestForm, notes: e.target.value })} className={inputClass} rows={2} placeholder="Additional notes..." />
          </div>
          <button type="submit" className={buttonClass.replace('emerald', 'purple').replace('teal', 'pink')}>Record Harvest</button>
        </form>
      </Modal>

      <Modal show={showWaterQualityModal} onClose={() => setShowWaterQualityModal(false)} title="Log Water Quality" icon={Droplet} color="cyan">
        <form onSubmit={handleAddWaterQuality} className="space-y-4">
          <div>
            <label className={labelClass}>Select Pond *</label>
            <select value={waterQualityForm.pond_id} onChange={e => setWaterQualityForm({ ...waterQualityForm, pond_id: e.target.value })} className={inputClass} required>
              <option value="">Choose pond...</option>
              {ponds.map(pond => <option key={pond.id} value={pond.id}>{pond.pond_name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Temperature (°C)</label>
              <input type="number" step="0.1" value={waterQualityForm.temperature_c} onChange={e => setWaterQualityForm({ ...waterQualityForm, temperature_c: e.target.value })} className={inputClass} placeholder="e.g., 28.5" />
            </div>
            <div>
              <label className={labelClass}>pH Level</label>
              <input type="number" step="0.1" value={waterQualityForm.ph} onChange={e => setWaterQualityForm({ ...waterQualityForm, ph: e.target.value })} className={inputClass} placeholder="e.g., 7.2" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Dissolved Oxygen (mg/L)</label>
              <input type="number" step="0.1" value={waterQualityForm.dissolved_oxygen} onChange={e => setWaterQualityForm({ ...waterQualityForm, dissolved_oxygen: e.target.value })} className={inputClass} placeholder="e.g., 6.5" />
            </div>
            <div>
              <label className={labelClass}>Ammonia (ppm)</label>
              <input type="number" step="0.01" value={waterQualityForm.ammonia_ppm} onChange={e => setWaterQualityForm({ ...waterQualityForm, ammonia_ppm: e.target.value })} className={inputClass} placeholder="e.g., 0.02" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Salinity (ppt)</label>
              <input type="number" step="0.1" value={waterQualityForm.salinity_ppt} onChange={e => setWaterQualityForm({ ...waterQualityForm, salinity_ppt: e.target.value })} className={inputClass} placeholder="e.g., 15" />
            </div>
            <div>
              <label className={labelClass}>Transparency (cm)</label>
              <input type="number" value={waterQualityForm.transparency_cm} onChange={e => setWaterQualityForm({ ...waterQualityForm, transparency_cm: e.target.value })} className={inputClass} placeholder="e.g., 35" />
            </div>
          </div>
          <button type="submit" className={buttonClass.replace('emerald', 'cyan').replace('teal', 'blue')}>Log Water Quality</button>
        </form>
      </Modal>

      <Modal show={showFeedModal} onClose={() => setShowFeedModal(false)} title="Record Feeding" icon={Package} color="orange">
        <form onSubmit={handleAddFeed} className="space-y-4">
          <div>
            <label className={labelClass}>Select Pond *</label>
            <select value={feedForm.pond_id} onChange={e => setFeedForm({ ...feedForm, pond_id: e.target.value })} className={inputClass} required>
              <option value="">Choose pond...</option>
              {ponds.filter(p => p.status === 'stocked').map(pond => <option key={pond.id} value={pond.id}>{pond.pond_name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Feed Type</label>
              <input type="text" value={feedForm.feed_type} onChange={e => setFeedForm({ ...feedForm, feed_type: e.target.value })} className={inputClass} placeholder="e.g., Starter, Grower" />
            </div>
            <div>
              <label className={labelClass}>Brand</label>
              <input type="text" value={feedForm.brand} onChange={e => setFeedForm({ ...feedForm, brand: e.target.value })} className={inputClass} placeholder="e.g., CP, Avanti" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Quantity (kg) *</label>
              <input type="number" step="0.1" value={feedForm.quantity_kg} onChange={e => setFeedForm({ ...feedForm, quantity_kg: e.target.value })} className={inputClass} placeholder="e.g., 25" required />
            </div>
            <div>
              <label className={labelClass}>Feeding Times</label>
              <input type="number" value={feedForm.feeding_times} onChange={e => setFeedForm({ ...feedForm, feeding_times: e.target.value })} className={inputClass} placeholder="e.g., 4" />
            </div>
          </div>
          <button type="submit" className={buttonClass.replace('emerald', 'orange').replace('teal', 'red')}>Record Feeding</button>
        </form>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default AquaFarmerDashboard;
