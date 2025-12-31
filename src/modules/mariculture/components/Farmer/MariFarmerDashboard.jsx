import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut, Home, Shell, Waves, MapPin, Calendar, Plus, Edit, Trash2, 
  Eye, Search, Filter, ChevronRight, Anchor, Leaf, Package, BarChart3,
  AlertCircle, CheckCircle, Clock, Ship
} from 'lucide-react';
import { useLanguage } from '../../../shared/context/LanguageContext';
import LanguageToggle from '../../../shared/components/Shared/LanguageToggle';
import Toast from '../../../shared/components/Shared/Toast';

const MariFarmerDashboard = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState('overview');
  const [toast, setToast] = useState(null);
  const [showAddUnitModal, setShowAddUnitModal] = useState(false);
  const [showHarvestModal, setShowHarvestModal] = useState(false);

  // Demo farmer data
  const [farmerData] = useState({
    id: 'MF-001',
    name: 'Selvam Murugan',
    phone: '+91 94876 54321',
    email: 'selvam.m@email.com',
    address: 'Ramanathapuram District, Tamil Nadu',
    registeredDate: '2024-02-10',
    totalFarms: 2,
    totalUnits: 12,
    activeHarvests: 2
  });

  // Demo farms data
  const [farms] = useState([
    {
      id: 'MFARM-001',
      name: 'Coastal Seaweed Farm',
      address: 'Mandapam Coast, Ramanathapuram',
      location: { lat: 9.2800, lng: 79.1200 },
      primarySpecies: 'Kappaphycus alvarezii',
      totalCapacity: '4500 kg',
      unitsCount: 8,
      unitTypes: ['Raft', 'Longline'],
      status: 'active',
      lastHarvest: '2024-11-20'
    },
    {
      id: 'MFARM-002',
      name: 'Blue Lagoon Farm',
      address: 'Pamban, Ramanathapuram',
      location: { lat: 9.2767, lng: 79.2117 },
      primarySpecies: 'Asian Seabass',
      totalCapacity: '2000 kg',
      unitsCount: 4,
      unitTypes: ['Sea Cage'],
      status: 'active',
      lastHarvest: '2024-10-15'
    }
  ]);

  // Demo farming units data
  const [units] = useState([
    { id: 'U001', farmId: 'MFARM-001', name: 'Raft A1', type: 'Raft', species: 'Kappaphycus alvarezii', capacity: '500 kg', seedSource: 'CMFRI', seedingDate: '2024-09-15', status: 'growing', daysToHarvest: 15 },
    { id: 'U002', farmId: 'MFARM-001', name: 'Raft A2', type: 'Raft', species: 'Kappaphycus alvarezii', capacity: '500 kg', seedSource: 'CMFRI', seedingDate: '2024-09-20', status: 'growing', daysToHarvest: 20 },
    { id: 'U003', farmId: 'MFARM-001', name: 'Raft B1', type: 'Raft', species: 'Kappaphycus alvarezii', capacity: '500 kg', seedSource: 'Local', seedingDate: '2024-10-01', status: 'growing', daysToHarvest: 30 },
    { id: 'U004', farmId: 'MFARM-001', name: 'Longline L1', type: 'Longline', species: 'Kappaphycus alvarezii', capacity: '750 kg', seedSource: 'CMFRI', seedingDate: '2024-08-20', status: 'ready', daysToHarvest: 0 },
    { id: 'U005', farmId: 'MFARM-001', name: 'Longline L2', type: 'Longline', species: 'Kappaphycus alvarezii', capacity: '750 kg', seedSource: 'CMFRI', seedingDate: '2024-09-05', status: 'ready', daysToHarvest: 5 },
    { id: 'U006', farmId: 'MFARM-001', name: 'Raft C1', type: 'Raft', species: 'Gracilaria', capacity: '400 kg', seedSource: 'Local', seedingDate: null, status: 'empty', daysToHarvest: null },
    { id: 'U007', farmId: 'MFARM-001', name: 'Raft C2', type: 'Raft', species: 'Gracilaria', capacity: '400 kg', seedSource: null, seedingDate: null, status: 'maintenance', daysToHarvest: null },
    { id: 'U008', farmId: 'MFARM-001', name: 'Longline L3', type: 'Longline', species: 'Kappaphycus alvarezii', capacity: '750 kg', seedSource: null, seedingDate: null, status: 'empty', daysToHarvest: null },
    { id: 'U009', farmId: 'MFARM-002', name: 'Cage Alpha', type: 'Sea Cage', species: 'Asian Seabass', capacity: '500 kg', seedSource: 'MPEDA Hatchery', seedingDate: '2024-07-01', status: 'ready', daysToHarvest: 0 },
    { id: 'U010', farmId: 'MFARM-002', name: 'Cage Beta', type: 'Sea Cage', species: 'Asian Seabass', capacity: '500 kg', seedSource: 'MPEDA Hatchery', seedingDate: '2024-08-15', status: 'growing', daysToHarvest: 45 },
    { id: 'U011', farmId: 'MFARM-002', name: 'Cage Gamma', type: 'Sea Cage', species: 'Cobia', capacity: '500 kg', seedSource: 'RGCA', seedingDate: '2024-09-01', status: 'growing', daysToHarvest: 60 },
    { id: 'U012', farmId: 'MFARM-002', name: 'Cage Delta', type: 'Sea Cage', species: 'Asian Seabass', capacity: '500 kg', seedSource: null, seedingDate: null, status: 'empty', daysToHarvest: null }
  ]);

  // Demo harvests data
  const [harvests] = useState([
    { id: 'MH001', unitId: 'U004', unitName: 'Longline L1', farmName: 'Coastal Seaweed Farm', date: '2024-12-10', quantity: '720 kg', method: 'Manual', species: 'Kappaphycus alvarezii', status: 'pending_inspection', grade: null },
    { id: 'MH002', unitId: 'U009', unitName: 'Cage Alpha', farmName: 'Blue Lagoon Farm', date: '2024-12-08', quantity: '450 kg', method: 'Net Harvest', species: 'Asian Seabass', status: 'inspected', grade: 'Premium' },
    { id: 'MH003', unitId: 'U005', unitName: 'Longline L2', farmName: 'Coastal Seaweed Farm', date: '2024-12-05', quantity: '680 kg', method: 'Manual', species: 'Kappaphycus alvarezii', status: 'packed', grade: 'Grade A' }
  ]);

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
            const farm = farms.find(f => f.id === unit.farmId);
            return (
              <div key={unit.id} className="flex items-center justify-between p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/20 rounded-lg">
                    {getUnitTypeIcon(unit.type)}
                  </div>
                  <div>
                    <p className="text-white font-medium">{unit.name}</p>
                    <p className="text-sm text-slate-400">{farm?.name} • {unit.species}</p>
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
                  <p className="text-white font-medium">{harvest.unitName}</p>
                  <p className="text-sm text-slate-400">{harvest.farmName} • {harvest.date}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white font-medium">{harvest.quantity}</p>
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
        <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors">
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
                  <h3 className="text-lg font-semibold text-white">{farm.name}</h3>
                  <p className="text-sm text-slate-400">{farm.id}</p>
                </div>
                <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs">
                  {farm.status}
                </span>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Location</span>
                  <span className="text-white">{farm.address}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Primary Species</span>
                  <span className="text-white">{farm.primarySpecies}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Capacity</span>
                  <span className="text-white">{farm.totalCapacity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Units</span>
                  <span className="text-white">{farm.unitsCount} ({farm.unitTypes.join(', ')})</span>
                </div>
              </div>

              <div className="flex gap-2 mt-4 pt-4 border-t border-slate-700">
                <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm transition-colors">
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
          const farm = farms.find(f => f.id === unit.farmId);
          return (
            <div key={unit.id} className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    unit.type === 'Raft' ? 'bg-blue-500/20' : 
                    unit.type === 'Longline' ? 'bg-purple-500/20' : 'bg-emerald-500/20'
                  }`}>
                    {getUnitTypeIcon(unit.type)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{unit.name}</h3>
                    <p className="text-sm text-slate-400">{unit.type}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs border ${getStatusColor(unit.status)}`}>
                  {unit.status}
                </span>
              </div>

              <p className="text-xs text-slate-500 mb-3">{farm?.name}</p>

              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-slate-400">Species</span>
                  <span className="text-white">{unit.species}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Capacity</span>
                  <span className="text-white">{unit.capacity}</span>
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
                <td className="px-4 py-3 text-white">{harvest.unitName}</td>
                <td className="px-4 py-3 text-slate-400">{harvest.farmName}</td>
                <td className="px-4 py-3 text-slate-400">{harvest.date}</td>
                <td className="px-4 py-3 text-white">{harvest.quantity}</td>
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
    </div>
  );
};

export default MariFarmerDashboard;
