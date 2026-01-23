import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut, Home, Droplets, Fish, MapPin, Calendar, Plus, Edit, Trash2, 
  Eye, Search, Filter, ChevronRight, Waves, Leaf, Package, BarChart3,
  AlertCircle, CheckCircle, Clock, Loader2, RefreshCw, X, Thermometer,
  Beaker, Scale
} from 'lucide-react';
import { useLanguage } from '../../../shared/context/LanguageContext';
import LanguageToggle from '../../../shared/components/Shared/LanguageToggle';
import Toast from '../../../shared/components/Shared/Toast';
import { aquaAuthAPI, aquaFarmerAPI } from '../../services/aquaApi';

const AquaFarmerDashboard = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState('overview');
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal states
  const [showAddPondModal, setShowAddPondModal] = useState(false);
  const [showHarvestModal, setShowHarvestModal] = useState(false);
  const [showStockingModal, setShowStockingModal] = useState(false);
  const [showWaterQualityModal, setShowWaterQualityModal] = useState(false);
  const [selectedPond, setSelectedPond] = useState(null);
  const [selectedFarm, setSelectedFarm] = useState(null);

  // Data states
  const [user, setUser] = useState(null);
  const [farms, setFarms] = useState([]);
  const [ponds, setPonds] = useState([]);
  const [harvests, setHarvests] = useState([]);
  const [stockings, setStockings] = useState([]);
  const [waterQuality, setWaterQuality] = useState([]);

  // Form states
  const [pondForm, setPondForm] = useState({
    farm_id: '',
    name: '',
    area_sqm: '',
    type: 'earthen',
    species: 'vannamei'
  });

  const [harvestForm, setHarvestForm] = useState({
    stocking_id: '',
    quantity_kg: '',
    avg_weight_g: '',
    method: 'full_drain',
    notes: ''
  });

  const [stockingForm, setStockingForm] = useState({
    pond_id: '',
    species: 'vannamei',
    quantity: '',
    density_per_sqm: '',
    source: '',
    pl_size: '',
    notes: ''
  });

  const [waterQualityForm, setWaterQualityForm] = useState({
    pond_id: '',
    temperature: '',
    ph: '',
    dissolved_oxygen: '',
    ammonia: '',
    salinity: '',
    turbidity: ''
  });

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'farms', label: 'My Farms', icon: MapPin },
    { id: 'ponds', label: 'Pond Management', icon: Waves },
    { id: 'harvests', label: 'Harvests', icon: Package },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 }
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
      const [farmsRes, pondsRes, harvestsRes, stockingsRes] = await Promise.all([
        aquaFarmerAPI.getFarms(),
        aquaFarmerAPI.getPonds(),
        aquaFarmerAPI.getHarvests(),
        aquaFarmerAPI.getStockings()
      ]);

      console.log('API Responses:', { farmsRes, pondsRes, harvestsRes, stockingsRes });

      if (farmsRes.success) setFarms(farmsRes.data || []);
      if (pondsRes.success) setPonds(pondsRes.data || []);
      if (harvestsRes.success) setHarvests(harvestsRes.data || []);
      if (stockingsRes.success) setStockings(stockingsRes.data || []);
    } catch (error) {
      console.error('Load data error:', error);
      // If 401, redirect to login
      if (error.response?.status === 401) {
        showToast('Session expired. Please login again.', 'error');
        setTimeout(() => navigate('/aquaculture/login/farmer'), 1500);
        return;
      }
      showToast('Failed to load data', 'error');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
    showToast('Data refreshed', 'success');
  };

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'stocked': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'ready': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'empty': return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
      case 'preparation': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'pending_inspection': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'inspected': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'approved': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'packed': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'active': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const calculateDOC = (stockingDate) => {
    if (!stockingDate) return 0;
    const start = new Date(stockingDate);
    const now = new Date();
    const diffTime = Math.abs(now - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleLogout = () => {
    aquaAuthAPI.logout();
    navigate('/aquaculture');
  };

  // API Handlers
  const handleAddPond = async (e) => {
    e.preventDefault();
    try {
      const result = await aquaFarmerAPI.createPond(pondForm);
      if (result.success) {
        showToast('Pond added successfully', 'success');
        setShowAddPondModal(false);
        setPondForm({ farm_id: '', name: '', area_sqm: '', type: 'earthen', species: 'vannamei' });
        await loadAllData();
      } else {
        showToast(result.error || 'Failed to add pond', 'error');
      }
    } catch (error) {
      showToast('Failed to add pond', 'error');
    }
  };

  const handleAddStocking = async (e) => {
    e.preventDefault();
    try {
      const result = await aquaFarmerAPI.createStocking(stockingForm);
      if (result.success) {
        showToast('Stocking recorded successfully', 'success');
        setShowStockingModal(false);
        setStockingForm({ pond_id: '', species: 'vannamei', quantity: '', density_per_sqm: '', source: '', pl_size: '', notes: '' });
        await loadAllData();
      } else {
        showToast(result.error || 'Failed to record stocking', 'error');
      }
    } catch (error) {
      showToast('Failed to record stocking', 'error');
    }
  };

  const handleAddHarvest = async (e) => {
    e.preventDefault();
    try {
      const result = await aquaFarmerAPI.createHarvest(harvestForm);
      if (result.success) {
        showToast('Harvest recorded successfully', 'success');
        setShowHarvestModal(false);
        setHarvestForm({ stocking_id: '', quantity_kg: '', avg_weight_g: '', method: 'full_drain', notes: '' });
        await loadAllData();
      } else {
        showToast(result.error || 'Failed to record harvest', 'error');
      }
    } catch (error) {
      showToast('Failed to record harvest', 'error');
    }
  };

  const handleAddWaterQuality = async (e) => {
    e.preventDefault();
    try {
      const result = await aquaFarmerAPI.recordWaterQuality(waterQualityForm);
      if (result.success) {
        showToast('Water quality recorded successfully', 'success');
        setShowWaterQualityModal(false);
        setWaterQualityForm({ pond_id: '', temperature: '', ph: '', dissolved_oxygen: '', ammonia: '', salinity: '', turbidity: '' });
        await loadAllData();
      } else {
        showToast(result.error || 'Failed to record water quality', 'error');
      }
    } catch (error) {
      showToast('Failed to record water quality', 'error');
    }
  };

  // Get active stockings for a pond
  const getActiveStocking = (pondId) => {
    return stockings.find(s => s.pond_id === pondId && s.status === 'active');
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const renderOverview = () => {
    const activeStockings = stockings.filter(s => s.status === 'active');
    const pendingHarvests = harvests.filter(h => h.status === 'pending_inspection');
    const readyPonds = ponds.filter(p => {
      const stocking = getActiveStocking(p.id);
      if (!stocking) return false;
      const doc = calculateDOC(stocking.stocking_date);
      return doc >= 90;
    });

    return (
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Welcome, {user?.name || 'Farmer'}!</h2>
              <p className="text-emerald-100">Farmer ID: {user?.id?.slice(0, 8) || 'N/A'}</p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-5 h-5 text-white ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <MapPin className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{farms.length}</p>
            <p className="text-sm text-slate-400">Total Farms</p>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Waves className="w-5 h-5 text-blue-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{ponds.length}</p>
            <p className="text-sm text-slate-400">Total Ponds</p>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <Fish className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{activeStockings.length}</p>
            <p className="text-sm text-slate-400">Active Stocks</p>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Package className="w-5 h-5 text-purple-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{pendingHarvests.length}</p>
            <p className="text-sm text-slate-400">Pending Inspection</p>
          </div>
        </div>

        {/* Recent Harvests */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Harvests</h3>
          {harvests.length > 0 ? (
            <div className="space-y-3">
              {harvests.slice(0, 3).map(harvest => {
                const stocking = stockings.find(s => s.id === harvest.stocking_id);
                const pond = ponds.find(p => p.id === stocking?.pond_id);
                return (
                  <div key={harvest.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-500/20 rounded-lg">
                        <Package className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{pond?.name || 'Unknown Pond'}</p>
                        <p className="text-sm text-slate-400">
                          {new Date(harvest.harvest_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-medium">{harvest.quantity_kg} kg</p>
                      <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(harvest.status)}`}>
                        {harvest.status?.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-slate-500 text-center py-4">No harvests recorded yet</p>
          )}
        </div>

        {/* Ponds Ready for Harvest */}
        {readyPonds.length > 0 && (
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Ponds Ready for Harvest</h3>
            <div className="space-y-3">
              {readyPonds.map(pond => {
                const stocking = getActiveStocking(pond.id);
                const doc = stocking ? calculateDOC(stocking.stocking_date) : 0;
                return (
                  <div key={pond.id} className="flex items-center justify-between p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-500/20 rounded-lg">
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{pond.name}</p>
                        <p className="text-sm text-slate-400">DOC: {doc} days • {pond.area_sqm} m²</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        setHarvestForm({ ...harvestForm, stocking_id: stocking?.id || '' });
                        setShowHarvestModal(true);
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm transition-colors"
                    >
                      Start Harvest
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderFarms = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">My Farms</h2>
        <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors">
          <Plus className="w-4 h-4" />
          Add Farm
        </button>
      </div>

      {farms.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-6">
          {farms.map(farm => {
            const farmPonds = ponds.filter(p => p.farm_id === farm.id);
            return (
              <div key={farm.id} className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
                <div className="h-32 bg-gradient-to-br from-emerald-600/30 to-teal-600/30 flex items-center justify-center">
                  <MapPin className="w-12 h-12 text-emerald-400" />
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{farm.name}</h3>
                      <p className="text-sm text-slate-400">{farm.id?.slice(0, 8)}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs border ${getStatusColor(farm.status)}`}>
                      {farm.status}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Address</span>
                      <span className="text-white text-right max-w-[60%] truncate">{farm.address || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Water Source</span>
                      <span className="text-white">{farm.water_source || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total Area</span>
                      <span className="text-white">{farm.total_area_acres || 'N/A'} Acres</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Ponds</span>
                      <span className="text-white">{farmPonds.length}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4 pt-4 border-t border-slate-700">
                    <button 
                      onClick={() => {
                        setSelectedFarm(farm);
                        setActiveTab('ponds');
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      View Ponds
                    </button>
                    <button className="flex items-center justify-center p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-slate-900/50 border border-slate-800 rounded-xl">
          <MapPin className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">No farms registered yet</p>
          <button className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors">
            Register Your First Farm
          </button>
        </div>
      )}
    </div>
  );

  const renderPonds = () => {
    const filteredPonds = selectedFarm 
      ? ponds.filter(p => p.farm_id === selectedFarm.id)
      : ponds;

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Pond Management</h2>
          <div className="flex gap-2">
            <button 
              onClick={() => {
                setWaterQualityForm({ ...waterQualityForm, pond_id: '' });
                setShowWaterQualityModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
            >
              <Thermometer className="w-4 h-4" />
              Log Water Quality
            </button>
            <button 
              onClick={() => {
                setPondForm({ ...pondForm, farm_id: farms[0]?.id || '' });
                setShowAddPondModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Pond
            </button>
          </div>
        </div>

        {/* Filter by Farm */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button 
            onClick={() => setSelectedFarm(null)}
            className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
              !selectedFarm ? 'bg-emerald-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-white'
            }`}
          >
            All Ponds
          </button>
          {farms.map(farm => (
            <button 
              key={farm.id} 
              onClick={() => setSelectedFarm(farm)}
              className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
                selectedFarm?.id === farm.id ? 'bg-emerald-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-white'
              }`}
            >
              {farm.name}
            </button>
          ))}
        </div>

        {/* Ponds Grid */}
        {filteredPonds.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPonds.map(pond => {
              const farm = farms.find(f => f.id === pond.farm_id);
              const stocking = getActiveStocking(pond.id);
              const doc = stocking ? calculateDOC(stocking.stocking_date) : 0;
              
              return (
                <div key={pond.id} className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{pond.name}</h3>
                      <p className="text-sm text-slate-400">{farm?.name || 'Unknown Farm'}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs border ${getStatusColor(pond.status)}`}>
                      {pond.status}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Area</span>
                      <span className="text-white">{pond.area_sqm} m²</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Type</span>
                      <span className="text-white capitalize">{pond.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Species</span>
                      <span className="text-white capitalize">{pond.species || stocking?.species || 'N/A'}</span>
                    </div>
                    {stocking && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Stocking Date</span>
                          <span className="text-white">{new Date(stocking.stocking_date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Density</span>
                          <span className="text-white">{stocking.density_per_sqm} PL/m²</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">DOC</span>
                          <span className={`font-medium ${doc >= 90 ? 'text-emerald-400' : doc >= 60 ? 'text-amber-400' : 'text-blue-400'}`}>
                            {doc} days
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* DOC Progress Bar */}
                  {stocking && (
                    <div className="mb-4">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400">Harvest Progress</span>
                        <span className="text-white">{Math.min(doc, 100)}%</span>
                      </div>
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${doc >= 90 ? 'bg-emerald-500' : doc >= 60 ? 'bg-amber-500' : 'bg-blue-500'}`}
                          style={{ width: `${Math.min(doc, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {stocking && doc >= 60 && (
                      <button 
                        onClick={() => {
                          setHarvestForm({ ...harvestForm, stocking_id: stocking.id });
                          setShowHarvestModal(true);
                        }}
                        className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm transition-colors"
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
                        className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm transition-colors"
                      >
                        Start Stocking
                      </button>
                    )}
                    <button className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-slate-900/50 border border-slate-800 rounded-xl">
            <Waves className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No ponds registered yet</p>
          </div>
        )}
      </div>
    );
  };

  const renderHarvests = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Harvest Records</h2>
        <button 
          onClick={() => setShowHarvestModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Harvest
        </button>
      </div>

      {/* Harvest Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-center">
          <Clock className="w-6 h-6 text-amber-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{harvests.filter(h => h.status === 'pending_inspection').length}</p>
          <p className="text-sm text-slate-400">Pending Inspection</p>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-center">
          <CheckCircle className="w-6 h-6 text-blue-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{harvests.filter(h => h.status === 'approved').length}</p>
          <p className="text-sm text-slate-400">Approved</p>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center">
          <Package className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{harvests.filter(h => h.status === 'packed').length}</p>
          <p className="text-sm text-slate-400">Packed</p>
        </div>
      </div>

      {/* Harvest List */}
      {harvests.length > 0 ? (
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800/50">
                <tr>
                  <th className="text-left text-sm font-medium text-slate-400 px-4 py-3">Pond</th>
                  <th className="text-left text-sm font-medium text-slate-400 px-4 py-3">Date</th>
                  <th className="text-left text-sm font-medium text-slate-400 px-4 py-3">Quantity</th>
                  <th className="text-left text-sm font-medium text-slate-400 px-4 py-3">Avg Weight</th>
                  <th className="text-left text-sm font-medium text-slate-400 px-4 py-3">Method</th>
                  <th className="text-left text-sm font-medium text-slate-400 px-4 py-3">Status</th>
                  <th className="text-left text-sm font-medium text-slate-400 px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {harvests.map(harvest => {
                  const stocking = stockings.find(s => s.id === harvest.stocking_id);
                  const pond = ponds.find(p => p.id === stocking?.pond_id);
                  return (
                    <tr key={harvest.id} className="border-t border-slate-800">
                      <td className="px-4 py-3 text-white">{pond?.name || 'Unknown'}</td>
                      <td className="px-4 py-3 text-slate-400">{new Date(harvest.harvest_date).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-white">{harvest.quantity_kg} kg</td>
                      <td className="px-4 py-3 text-white">{harvest.avg_weight_g}g</td>
                      <td className="px-4 py-3 text-slate-400 capitalize">{harvest.method?.replace('_', ' ')}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs border ${getStatusColor(harvest.status)}`}>
                          {harvest.status?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
                          <Eye className="w-4 h-4 text-slate-400" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-slate-900/50 border border-slate-800 rounded-xl">
          <Package className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">No harvests recorded yet</p>
        </div>
      )}
    </div>
  );

  const renderAnalytics = () => {
    const totalHarvest = harvests.reduce((sum, h) => sum + (parseFloat(h.quantity_kg) || 0), 0);
    const avgWeight = harvests.length > 0 
      ? (harvests.reduce((sum, h) => sum + (parseFloat(h.avg_weight_g) || 0), 0) / harvests.length).toFixed(1)
      : 0;

    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-white">Analytics & Reports</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Production Summary</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
                <span className="text-slate-400">Total Harvest</span>
                <span className="text-2xl font-bold text-emerald-400">{totalHarvest.toLocaleString()} kg</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
                <span className="text-slate-400">Average Size</span>
                <span className="text-2xl font-bold text-blue-400">{avgWeight}g</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
                <span className="text-slate-400">Active Ponds</span>
                <span className="text-2xl font-bold text-amber-400">{ponds.filter(p => p.status === 'stocked').length}</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button 
                onClick={() => setShowWaterQualityModal(true)}
                className="w-full p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center gap-3 hover:bg-blue-500/20 transition-colors"
              >
                <Thermometer className="w-6 h-6 text-blue-400" />
                <div className="text-left">
                  <p className="text-white font-medium">Log Water Quality</p>
                  <p className="text-sm text-slate-400">Record pH, DO, Temperature</p>
                </div>
              </button>
              <button 
                onClick={() => setShowStockingModal(true)}
                className="w-full p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-3 hover:bg-amber-500/20 transition-colors"
              >
                <Fish className="w-6 h-6 text-amber-400" />
                <div className="text-left">
                  <p className="text-white font-medium">New Stocking</p>
                  <p className="text-sm text-slate-400">Record new seed stocking</p>
                </div>
              </button>
              <button 
                onClick={() => setShowHarvestModal(true)}
                className="w-full p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3 hover:bg-emerald-500/20 transition-colors"
              >
                <Package className="w-6 h-6 text-emerald-400" />
                <div className="text-left">
                  <p className="text-white font-medium">Record Harvest</p>
                  <p className="text-sm text-slate-400">Log new harvest data</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Modal Components
  const AddPondModal = () => (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white">Add New Pond</h3>
          <button onClick={() => setShowAddPondModal(false)} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleAddPond} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Farm</label>
            <select
              value={pondForm.farm_id}
              onChange={(e) => setPondForm({ ...pondForm, farm_id: e.target.value })}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white"
              required
            >
              <option value="">Select Farm</option>
              {farms.map(farm => (
                <option key={farm.id} value={farm.id}>{farm.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Pond Name</label>
            <input
              type="text"
              value={pondForm.name}
              onChange={(e) => setPondForm({ ...pondForm, name: e.target.value })}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white"
              placeholder="e.g., Pond A1"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Area (m²)</label>
            <input
              type="number"
              value={pondForm.area_sqm}
              onChange={(e) => setPondForm({ ...pondForm, area_sqm: e.target.value })}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white"
              placeholder="e.g., 4000"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Type</label>
              <select
                value={pondForm.type}
                onChange={(e) => setPondForm({ ...pondForm, type: e.target.value })}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white"
              >
                <option value="earthen">Earthen</option>
                <option value="lined">Lined</option>
                <option value="concrete">Concrete</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Species</label>
              <select
                value={pondForm.species}
                onChange={(e) => setPondForm({ ...pondForm, species: e.target.value })}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white"
              >
                <option value="vannamei">Vannamei</option>
                <option value="rohu">Rohu</option>
                <option value="catla">Catla</option>
                <option value="tilapia">Tilapia</option>
              </select>
            </div>
          </div>
          <button
            type="submit"
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-colors"
          >
            Add Pond
          </button>
        </form>
      </div>
    </div>
  );

  const StockingModal = () => (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white">Record Stocking</h3>
          <button onClick={() => setShowStockingModal(false)} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleAddStocking} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Pond</label>
            <select
              value={stockingForm.pond_id}
              onChange={(e) => setStockingForm({ ...stockingForm, pond_id: e.target.value })}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white"
              required
            >
              <option value="">Select Pond</option>
              {ponds.filter(p => p.status === 'empty').map(pond => (
                <option key={pond.id} value={pond.id}>{pond.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Species</label>
            <select
              value={stockingForm.species}
              onChange={(e) => setStockingForm({ ...stockingForm, species: e.target.value })}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white"
            >
              <option value="vannamei">Vannamei</option>
              <option value="rohu">Rohu</option>
              <option value="catla">Catla</option>
              <option value="tilapia">Tilapia</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Quantity</label>
              <input
                type="number"
                value={stockingForm.quantity}
                onChange={(e) => setStockingForm({ ...stockingForm, quantity: e.target.value })}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white"
                placeholder="e.g., 100000"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Density (PL/m²)</label>
              <input
                type="number"
                value={stockingForm.density_per_sqm}
                onChange={(e) => setStockingForm({ ...stockingForm, density_per_sqm: e.target.value })}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white"
                placeholder="e.g., 60"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Source/Hatchery</label>
            <input
              type="text"
              value={stockingForm.source}
              onChange={(e) => setStockingForm({ ...stockingForm, source: e.target.value })}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white"
              placeholder="e.g., ABC Hatchery"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">PL Size</label>
            <input
              type="text"
              value={stockingForm.pl_size}
              onChange={(e) => setStockingForm({ ...stockingForm, pl_size: e.target.value })}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white"
              placeholder="e.g., PL12"
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-colors"
          >
            Record Stocking
          </button>
        </form>
      </div>
    </div>
  );

  const HarvestModal = () => (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white">Record Harvest</h3>
          <button onClick={() => setShowHarvestModal(false)} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleAddHarvest} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Active Stocking</label>
            <select
              value={harvestForm.stocking_id}
              onChange={(e) => setHarvestForm({ ...harvestForm, stocking_id: e.target.value })}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white"
              required
            >
              <option value="">Select Stocking</option>
              {stockings.filter(s => s.status === 'active').map(stocking => {
                const pond = ponds.find(p => p.id === stocking.pond_id);
                return (
                  <option key={stocking.id} value={stocking.id}>
                    {pond?.name} - {stocking.species} (DOC: {calculateDOC(stocking.stocking_date)} days)
                  </option>
                );
              })}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Quantity (kg)</label>
              <input
                type="number"
                value={harvestForm.quantity_kg}
                onChange={(e) => setHarvestForm({ ...harvestForm, quantity_kg: e.target.value })}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white"
                placeholder="e.g., 2500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Avg Weight (g)</label>
              <input
                type="number"
                value={harvestForm.avg_weight_g}
                onChange={(e) => setHarvestForm({ ...harvestForm, avg_weight_g: e.target.value })}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white"
                placeholder="e.g., 32"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Method</label>
            <select
              value={harvestForm.method}
              onChange={(e) => setHarvestForm({ ...harvestForm, method: e.target.value })}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white"
            >
              <option value="full_drain">Full Drain</option>
              <option value="partial_drain">Partial Drain</option>
              <option value="cast_net">Cast Net</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Notes</label>
            <textarea
              value={harvestForm.notes}
              onChange={(e) => setHarvestForm({ ...harvestForm, notes: e.target.value })}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white"
              placeholder="Additional notes..."
              rows={3}
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-colors"
          >
            Record Harvest
          </button>
        </form>
      </div>
    </div>
  );

  const WaterQualityModal = () => (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white">Log Water Quality</h3>
          <button onClick={() => setShowWaterQualityModal(false)} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleAddWaterQuality} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Pond</label>
            <select
              value={waterQualityForm.pond_id}
              onChange={(e) => setWaterQualityForm({ ...waterQualityForm, pond_id: e.target.value })}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white"
              required
            >
              <option value="">Select Pond</option>
              {ponds.map(pond => (
                <option key={pond.id} value={pond.id}>{pond.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Temperature (°C)</label>
              <input
                type="number"
                step="0.1"
                value={waterQualityForm.temperature}
                onChange={(e) => setWaterQualityForm({ ...waterQualityForm, temperature: e.target.value })}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white"
                placeholder="e.g., 28.5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">pH</label>
              <input
                type="number"
                step="0.1"
                value={waterQualityForm.ph}
                onChange={(e) => setWaterQualityForm({ ...waterQualityForm, ph: e.target.value })}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white"
                placeholder="e.g., 7.2"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">DO (mg/L)</label>
              <input
                type="number"
                step="0.1"
                value={waterQualityForm.dissolved_oxygen}
                onChange={(e) => setWaterQualityForm({ ...waterQualityForm, dissolved_oxygen: e.target.value })}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white"
                placeholder="e.g., 6.5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Ammonia (mg/L)</label>
              <input
                type="number"
                step="0.01"
                value={waterQualityForm.ammonia}
                onChange={(e) => setWaterQualityForm({ ...waterQualityForm, ammonia: e.target.value })}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white"
                placeholder="e.g., 0.02"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Salinity (ppt)</label>
              <input
                type="number"
                step="0.1"
                value={waterQualityForm.salinity}
                onChange={(e) => setWaterQualityForm({ ...waterQualityForm, salinity: e.target.value })}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white"
                placeholder="e.g., 15"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Turbidity (cm)</label>
              <input
                type="number"
                value={waterQualityForm.turbidity}
                onChange={(e) => setWaterQualityForm({ ...waterQualityForm, turbidity: e.target.value })}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white"
                placeholder="e.g., 35"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-colors"
          >
            Log Water Quality
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="bg-slate-900/80 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-emerald-600 to-teal-500 rounded-xl">
              <Droplets className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Aquaculture</h1>
              <p className="text-xs text-slate-400">Farmer Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <LanguageToggle />
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="bg-slate-900/50 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map(tab => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'text-emerald-400 border-emerald-400'
                      : 'text-slate-400 border-transparent hover:text-white'
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
      </main>

      {/* Modals */}
      {showAddPondModal && <AddPondModal />}
      {showStockingModal && <StockingModal />}
      {showHarvestModal && <HarvestModal />}
      {showWaterQualityModal && <WaterQualityModal />}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default AquaFarmerDashboard;
