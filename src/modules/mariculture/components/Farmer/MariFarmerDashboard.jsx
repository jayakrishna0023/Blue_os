import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut, Home, Shell, Waves, MapPin, Calendar, Plus, Edit, Trash2, 
  Eye, Search, Filter, ChevronRight, Anchor, Leaf, Package, BarChart3,
  AlertCircle, CheckCircle, Clock, Ship, X
} from 'lucide-react';
import { useLanguage } from '../../../shared/context/LanguageContext';
import LanguageToggle from '../../../shared/components/Shared/LanguageToggle';
import Toast from '../../../shared/components/Shared/Toast';
import { mariAuthAPI, mariFarmerAPI } from '../../services/mariApi';

const MariFarmerDashboard = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState('overview');
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddFarmModal, setShowAddFarmModal] = useState(false);
  const [showAddUnitModal, setShowAddUnitModal] = useState(false);
  const [showHarvestModal, setShowHarvestModal] = useState(false);

  // Real data state
  const [farmerData, setFarmerData] = useState({ id: '', name: '', totalFarms: 0, totalUnits: 0, activeHarvests: 0 });
  const [farms, setFarms] = useState([]);
  const [units, setUnits] = useState([]);
  const [harvests, setHarvests] = useState([]);

  // Form states
  const [farmForm, setFarmForm] = useState({ farm_name: '', address: '', district: '', water_body_type: 'Sea', total_area_hectares: '', primary_species: 'Seaweed' });
  const [unitForm, setUnitForm] = useState({ farm_id: '', unit_name: '', unit_type: 'raft', species: 'Seaweed', capacity: '' });
  const [harvestForm, setHarvestForm] = useState({ farm_id: '', unit_id: '', species: '', total_quantity_kg: '', method: 'manual' });

  // Auth check + initial load
  useEffect(() => {
    if (!mariAuthAPI.isAuthenticated()) {
      navigate('/mariculture/login/farmer');
      return;
    }
    const user = mariAuthAPI.getCurrentUser();
    if (user) {
      setFarmerData(prev => ({ ...prev, id: user.id, name: user.name || user.username }));
    }
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [farmsRes, unitsRes, harvestsRes] = await Promise.all([
        mariFarmerAPI.getFarms().catch(() => ({ data: { data: [] } })),
        mariFarmerAPI.getUnits().catch(() => ({ data: { data: [] } })),
        mariFarmerAPI.getHarvests().catch(() => ({ data: { data: [] } }))
      ]);
      const farmsData = farmsRes.data?.data || [];
      const unitsData = unitsRes.data?.data || [];
      const harvestsData = harvestsRes.data?.data || [];
      setFarms(farmsData);
      setUnits(unitsData);
      setHarvests(harvestsData);
      setFarmerData(prev => ({ ...prev, totalFarms: farmsData.length, totalUnits: unitsData.length, activeHarvests: harvestsData.filter(h => h.status === 'pending_inspection').length }));
    } catch (err) {
      console.error('Load data error:', err);
    }
    setLoading(false);
  };

  const handleCreateFarm = async () => {
    try {
      await mariFarmerAPI.createFarm(farmForm);
      setToast({ message: 'Farm created successfully!', type: 'success' });
      setShowAddFarmModal(false);
      setFarmForm({ farm_name: '', address: '', district: '', water_body_type: 'Sea', total_area_hectares: '', primary_species: 'Seaweed' });
      loadAllData();
    } catch (err) {
      setToast({ message: 'Failed to create farm: ' + (err.response?.data?.message || err.message), type: 'error' });
    }
  };

  const handleCreateUnit = async () => {
    try {
      await mariFarmerAPI.createUnit(unitForm);
      setToast({ message: 'Culture unit created successfully!', type: 'success' });
      setShowAddUnitModal(false);
      setUnitForm({ farm_id: '', unit_name: '', unit_type: 'raft', species: 'Seaweed', capacity: '' });
      loadAllData();
    } catch (err) {
      setToast({ message: 'Failed to create unit: ' + (err.response?.data?.message || err.message), type: 'error' });
    }
  };

  const handleCreateHarvest = async () => {
    try {
      await mariFarmerAPI.createHarvest(harvestForm);
      setToast({ message: 'Harvest recorded successfully! QR code generated.', type: 'success' });
      setShowHarvestModal(false);
      setHarvestForm({ farm_id: '', unit_id: '', species: '', total_quantity_kg: '', method: 'manual' });
      loadAllData();
    } catch (err) {
      setToast({ message: 'Failed to record harvest: ' + (err.response?.data?.message || err.message), type: 'error' });
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'farms', label: 'My Farms', icon: MapPin },
    { id: 'units', label: 'Farming Units', icon: Anchor },
    { id: 'harvests', label: 'Harvests', icon: Package },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'growing': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'ready': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'empty': return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
      case 'maintenance': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'pending_inspection': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'inspected': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'packed': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getUnitTypeIcon = (type) => {
    switch (type) {
      case 'Raft': return <Waves className="w-4 h-4" />;
      case 'Longline': return <Anchor className="w-4 h-4" />;
      case 'Sea Cage': return <Ship className="w-4 h-4" />;
      default: return <Shell className="w-4 h-4" />;
    }
  };

  const handleLogout = () => {
    mariAuthAPI.logout();
    navigate('/mariculture');
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6">
        <h2 className="text-2xl font-bold text-white mb-2">Welcome, {farmerData.name}!</h2>
        <p className="text-purple-100">Farmer ID: {farmerData.id}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <MapPin className="w-5 h-5 text-purple-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{farms.length}</p>
          <p className="text-sm text-slate-400">Total Farms</p>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Anchor className="w-5 h-5 text-blue-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{units.length}</p>
          <p className="text-sm text-slate-400">Farming Units</p>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <Leaf className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{units.filter(u => u.status === 'growing').length}</p>
          <p className="text-sm text-slate-400">Active Growing</p>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-500/20 rounded-lg">
              <Package className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{harvests.filter(h => h.status === 'pending_inspection').length}</p>
          <p className="text-sm text-slate-400">Pending Inspection</p>
        </div>
      </div>

      {/* Units by Type */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Units by Type</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border border-blue-500/30 rounded-xl p-4 text-center">
            <Waves className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{units.filter(u => u.type === 'Raft').length}</p>
            <p className="text-sm text-slate-400">Rafts</p>
          </div>
          <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-xl p-4 text-center">
            <Anchor className="w-8 h-8 text-purple-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{units.filter(u => u.type === 'Longline').length}</p>
            <p className="text-sm text-slate-400">Longlines</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-600/20 to-teal-600/20 border border-emerald-500/30 rounded-xl p-4 text-center">
            <Ship className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{units.filter(u => u.type === 'Sea Cage').length}</p>
            <p className="text-sm text-slate-400">Sea Cages</p>
          </div>
        </div>
      </div>

      {/* Ready for Harvest */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Ready for Harvest</h3>
        <div className="space-y-3">
          {units.filter(u => u.status === 'ready').map(unit => {
            const farm = farms.find(f => f.id === unit.farm_id);
            return (
              <div key={unit.id} className="flex items-center justify-between p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/20 rounded-lg">
                    {getUnitTypeIcon(unit.unit_type || unit.type)}
                  </div>
                  <div>
                    <p className="text-white font-medium">{unit.unit_name || unit.name}</p>
                    <p className="text-sm text-slate-400">{farm?.farm_name || farm?.name} • {unit.species}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowHarvestModal(true)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm transition-colors"
                >
                  Start Harvest
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Harvests */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Harvests</h3>
        <div className="space-y-3">
          {harvests.slice(0, 3).map(harvest => (
            <div key={harvest.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Package className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <p className="text-white font-medium">{harvest.harvest_code || harvest.species}</p>
                  <p className="text-sm text-slate-400">{harvest.species} • {harvest.harvest_date || harvest.date}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white font-medium">{harvest.total_quantity_kg ? harvest.total_quantity_kg + ' kg' : harvest.quantity}</p>
                <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(harvest.status)}`}>
                  {harvest.status.replace('_', ' ')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderFarms = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">My Farms</h2>
        <button onClick={() => setShowAddFarmModal(true)} className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors">
          <Plus className="w-4 h-4" />
          Add Farm
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {farms.map(farm => (
          <div key={farm.id} className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
            <div className="h-32 bg-gradient-to-br from-purple-600/30 to-pink-600/30 flex items-center justify-center">
              <Shell className="w-12 h-12 text-purple-400" />
            </div>
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">{farm.farm_name || farm.name}</h3>
                  <p className="text-sm text-slate-400">{farm.farm_code || farm.id}</p>
                </div>
                <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs">
                  {farm.status}
                </span>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Location</span>
                  <span className="text-white">{farm.address || farm.district || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Primary Species</span>
                  <span className="text-white">{farm.primary_species || farm.primarySpecies || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Area</span>
                  <span className="text-white">{farm.total_area_hectares ? farm.total_area_hectares + ' ha' : 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Water Body</span>
                  <span className="text-white">{farm.water_body_type || 'Sea'}</span>
                </div>
              </div>

              <div className="flex gap-2 mt-4 pt-4 border-t border-slate-700">
                <button onClick={() => setActiveTab('units')} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm transition-colors">
                  <Eye className="w-4 h-4" />
                  View Units
                </button>
                <button className="flex items-center justify-center p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors">
                  <Edit className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderUnits = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Farming Units</h2>
        <button 
          onClick={() => setShowAddUnitModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Unit
        </button>
      </div>

      {/* Filter by Type */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm whitespace-nowrap">
          All Units
        </button>
        <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm whitespace-nowrap transition-colors flex items-center gap-2">
          <Waves className="w-4 h-4" /> Rafts
        </button>
        <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm whitespace-nowrap transition-colors flex items-center gap-2">
          <Anchor className="w-4 h-4" /> Longlines
        </button>
        <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm whitespace-nowrap transition-colors flex items-center gap-2">
          <Ship className="w-4 h-4" /> Sea Cages
        </button>
      </div>

      {/* Units Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {units.map(unit => {
          const farm = farms.find(f => f.id === unit.farm_id);
          const uType = unit.unit_type || unit.type || '';
          const uName = unit.unit_name || unit.name || '';
          return (
            <div key={unit.id} className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    uType === 'raft' || uType === 'Raft' ? 'bg-blue-500/20' : 
                    uType === 'longline' || uType === 'Longline' ? 'bg-purple-500/20' : 'bg-emerald-500/20'
                  }`}>
                    {getUnitTypeIcon(uType)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{uName}</h3>
                    <p className="text-sm text-slate-400">{uType}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs border ${getStatusColor(unit.status)}`}>
                  {unit.status}
                </span>
              </div>

              <p className="text-xs text-slate-500 mb-3">{farm?.farm_name || farm?.name}</p>

              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-slate-400">Species</span>
                  <span className="text-white">{unit.species}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Capacity</span>
                  <span className="text-white">{unit.capacity || 'N/A'}</span>
                </div>
                {unit.seedSource && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Seed Source</span>
                    <span className="text-white">{unit.seedSource}</span>
                  </div>
                )}
                {unit.seedingDate && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Seeding Date</span>
                    <span className="text-white">{unit.seedingDate}</span>
                  </div>
                )}
                {unit.daysToHarvest !== null && unit.status !== 'empty' && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Days to Harvest</span>
                    <span className={`font-medium ${unit.daysToHarvest <= 0 ? 'text-emerald-400' : unit.daysToHarvest <= 15 ? 'text-amber-400' : 'text-blue-400'}`}>
                      {unit.daysToHarvest <= 0 ? 'Ready!' : `${unit.daysToHarvest} days`}
                    </span>
                  </div>
                )}
              </div>

              {/* Progress Bar for Growing */}
              {unit.status === 'growing' && unit.daysToHarvest !== null && (
                <div className="mb-4">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Growth Progress</span>
                    <span className="text-white">{Math.max(0, Math.min(100, 100 - unit.daysToHarvest))}%</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${unit.daysToHarvest <= 15 ? 'bg-amber-500' : 'bg-blue-500'}`}
                      style={{ width: `${Math.max(0, Math.min(100, 100 - unit.daysToHarvest))}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                {unit.status === 'ready' && (
                  <button 
                    onClick={() => setShowHarvestModal(true)}
                    className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm transition-colors"
                  >
                    Harvest
                  </button>
                )}
                {unit.status === 'empty' && (
                  <button className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm transition-colors">
                    Start Seeding
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
    </div>
  );

  const renderHarvests = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Harvest Records</h2>
        <button 
          onClick={() => setShowHarvestModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
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
          <p className="text-2xl font-bold text-white">{harvests.filter(h => h.status === 'inspected').length}</p>
          <p className="text-sm text-slate-400">Inspected</p>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center">
          <Package className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{harvests.filter(h => h.status === 'packed').length}</p>
          <p className="text-sm text-slate-400">Packed</p>
        </div>
      </div>

      {/* Harvest List */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-800/50">
            <tr>
              <th className="text-left text-sm font-medium text-slate-400 px-4 py-3">Unit</th>
              <th className="text-left text-sm font-medium text-slate-400 px-4 py-3">Farm</th>
              <th className="text-left text-sm font-medium text-slate-400 px-4 py-3">Date</th>
              <th className="text-left text-sm font-medium text-slate-400 px-4 py-3">Quantity</th>
              <th className="text-left text-sm font-medium text-slate-400 px-4 py-3">Species</th>
              <th className="text-left text-sm font-medium text-slate-400 px-4 py-3">Grade</th>
              <th className="text-left text-sm font-medium text-slate-400 px-4 py-3">Status</th>
              <th className="text-left text-sm font-medium text-slate-400 px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {harvests.map(harvest => (
              <tr key={harvest.id} className="border-t border-slate-800">
                <td className="px-4 py-3 text-white">{harvest.harvest_code || harvest.species}</td>
                <td className="px-4 py-3 text-slate-400">{harvest.species}</td>
                <td className="px-4 py-3 text-slate-400">{harvest.harvest_date || harvest.date}</td>
                <td className="px-4 py-3 text-white">{harvest.total_quantity_kg ? harvest.total_quantity_kg + ' kg' : harvest.quantity}</td>
                <td className="px-4 py-3 text-slate-400">{harvest.species}</td>
                <td className="px-4 py-3 text-white">{harvest.grade || '-'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs border ${getStatusColor(harvest.status)}`}>
                    {harvest.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
                    <Eye className="w-4 h-4 text-slate-400" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white">Analytics & Reports</h2>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Production Summary</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
              <span className="text-slate-400">Total Harvest (This Month)</span>
              <span className="text-2xl font-bold text-purple-400">1,850 kg</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
              <span className="text-slate-400">Seaweed Production</span>
              <span className="text-2xl font-bold text-blue-400">1,400 kg</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
              <span className="text-slate-400">Fish Production</span>
              <span className="text-2xl font-bold text-emerald-400">450 kg</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Species Distribution</h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-400">Kappaphycus alvarezii</span>
                <span className="text-white">55%</span>
              </div>
              <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full" style={{ width: '55%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-400">Asian Seabass</span>
                <span className="text-white">30%</span>
              </div>
              <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: '30%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-400">Others</span>
                <span className="text-white">15%</span>
              </div>
              <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '15%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="bg-slate-900/80 border-b border-slate-800 sticky top-0 z-50 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-600 to-pink-500 rounded-xl">
              <Shell className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Mariculture</h1>
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
              Logout
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
                      ? 'text-purple-400 border-purple-400'
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
        {activeTab === 'units' && renderUnits()}
        {activeTab === 'harvests' && renderHarvests()}
        {activeTab === 'analytics' && renderAnalytics()}
      </main>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Add Farm Modal */}
      {showAddFarmModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Add New Farm</h2>
              <button onClick={() => setShowAddFarmModal(false)} className="p-2 hover:bg-slate-800 rounded-lg"><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Farm Name*</label>
                <input type="text" value={farmForm.farm_name} onChange={e => setFarmForm({...farmForm, farm_name: e.target.value})} className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-purple-500 focus:outline-none" placeholder="Coastal Seaweed Farm" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Address</label>
                <input type="text" value={farmForm.address} onChange={e => setFarmForm({...farmForm, address: e.target.value})} className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-purple-500 focus:outline-none" placeholder="Mandapam Coast" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">District</label>
                  <input type="text" value={farmForm.district} onChange={e => setFarmForm({...farmForm, district: e.target.value})} className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-purple-500 focus:outline-none" placeholder="Ramanathapuram" />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Area (hectares)</label>
                  <input type="number" value={farmForm.total_area_hectares} onChange={e => setFarmForm({...farmForm, total_area_hectares: e.target.value})} className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-purple-500 focus:outline-none" placeholder="5" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Water Body Type</label>
                  <select value={farmForm.water_body_type} onChange={e => setFarmForm({...farmForm, water_body_type: e.target.value})} className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-purple-500 focus:outline-none">
                    <option value="Sea">Sea</option><option value="Lagoon">Lagoon</option><option value="Estuary">Estuary</option><option value="Creek">Creek</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Primary Species</label>
                  <select value={farmForm.primary_species} onChange={e => setFarmForm({...farmForm, primary_species: e.target.value})} className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-purple-500 focus:outline-none">
                    <option value="Seaweed">Seaweed</option><option value="Asian Seabass">Asian Seabass</option><option value="Cobia">Cobia</option><option value="Mussel">Mussel</option><option value="Oyster">Oyster</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button onClick={() => setShowAddFarmModal(false)} className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl">Cancel</button>
                <button onClick={handleCreateFarm} disabled={!farmForm.farm_name} className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl font-medium">Create Farm</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Unit Modal */}
      {showAddUnitModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Add Culture Unit</h2>
              <button onClick={() => setShowAddUnitModal(false)} className="p-2 hover:bg-slate-800 rounded-lg"><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Farm*</label>
                <select value={unitForm.farm_id} onChange={e => setUnitForm({...unitForm, farm_id: e.target.value})} className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-purple-500 focus:outline-none">
                  <option value="">Select Farm</option>
                  {farms.map(f => <option key={f.id} value={f.id}>{f.farm_name || f.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Unit Name*</label>
                <input type="text" value={unitForm.unit_name} onChange={e => setUnitForm({...unitForm, unit_name: e.target.value})} className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-purple-500 focus:outline-none" placeholder="Raft A1" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Unit Type</label>
                  <select value={unitForm.unit_type} onChange={e => setUnitForm({...unitForm, unit_type: e.target.value})} className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-purple-500 focus:outline-none">
                    <option value="raft">Raft</option><option value="longline">Longline</option><option value="sea_cage">Sea Cage</option><option value="pen">Pen</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Capacity</label>
                  <input type="number" value={unitForm.capacity} onChange={e => setUnitForm({...unitForm, capacity: e.target.value})} className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-purple-500 focus:outline-none" placeholder="500" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Species</label>
                <select value={unitForm.species} onChange={e => setUnitForm({...unitForm, species: e.target.value})} className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-purple-500 focus:outline-none">
                  <option value="Seaweed">Seaweed</option><option value="Asian Seabass">Asian Seabass</option><option value="Cobia">Cobia</option><option value="Mussel">Mussel</option>
                </select>
              </div>
              <div className="flex gap-4 pt-4">
                <button onClick={() => setShowAddUnitModal(false)} className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl">Cancel</button>
                <button onClick={handleCreateUnit} disabled={!unitForm.farm_id || !unitForm.unit_name} className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl font-medium">Create Unit</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Harvest Modal */}
      {showHarvestModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Record Harvest</h2>
              <button onClick={() => setShowHarvestModal(false)} className="p-2 hover:bg-slate-800 rounded-lg"><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Farm*</label>
                <select value={harvestForm.farm_id} onChange={e => setHarvestForm({...harvestForm, farm_id: e.target.value})} className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-purple-500 focus:outline-none">
                  <option value="">Select Farm</option>
                  {farms.map(f => <option key={f.id} value={f.id}>{f.farm_name || f.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Unit</label>
                <select value={harvestForm.unit_id} onChange={e => setHarvestForm({...harvestForm, unit_id: e.target.value})} className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-purple-500 focus:outline-none">
                  <option value="">Select Unit (optional)</option>
                  {units.filter(u => !harvestForm.farm_id || u.farm_id === harvestForm.farm_id).map(u => <option key={u.id} value={u.id}>{u.unit_name || u.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Species*</label>
                  <select value={harvestForm.species} onChange={e => setHarvestForm({...harvestForm, species: e.target.value})} className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-purple-500 focus:outline-none">
                    <option value="">Select Species</option><option value="Seaweed">Seaweed</option><option value="Asian Seabass">Asian Seabass</option><option value="Cobia">Cobia</option><option value="Mussel">Mussel</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Quantity (kg)*</label>
                  <input type="number" value={harvestForm.total_quantity_kg} onChange={e => setHarvestForm({...harvestForm, total_quantity_kg: e.target.value})} className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-purple-500 focus:outline-none" placeholder="500" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Harvest Method</label>
                <select value={harvestForm.method} onChange={e => setHarvestForm({...harvestForm, method: e.target.value})} className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-purple-500 focus:outline-none">
                  <option value="manual">Manual</option><option value="net">Net Harvest</option><option value="mechanical">Mechanical</option>
                </select>
              </div>
              <div className="flex gap-4 pt-4">
                <button onClick={() => setShowHarvestModal(false)} className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl">Cancel</button>
                <button onClick={handleCreateHarvest} disabled={!harvestForm.farm_id || !harvestForm.species || !harvestForm.total_quantity_kg} className="flex-1 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl font-medium">Record Harvest</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MariFarmerDashboard;
