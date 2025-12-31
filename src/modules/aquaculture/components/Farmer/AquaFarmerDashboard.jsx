import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut, Home, Droplets, Fish, MapPin, Calendar, Plus, Edit, Trash2, 
  Eye, Search, Filter, ChevronRight, Waves, Leaf, Package, BarChart3,
  AlertCircle, CheckCircle, Clock
} from 'lucide-react';
import { useLanguage } from '../../../shared/context/LanguageContext';
import LanguageToggle from '../../../shared/components/Shared/LanguageToggle';
import Toast from '../../../shared/components/Shared/Toast';

const AquaFarmerDashboard = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState('overview');
  const [toast, setToast] = useState(null);
  const [showAddPondModal, setShowAddPondModal] = useState(false);
  const [showHarvestModal, setShowHarvestModal] = useState(false);

  // Demo farmer data
  const [farmerData] = useState({
    id: 'AF-001',
    name: 'Kumar Rajan',
    phone: '+91 98765 43210',
    email: 'kumar.rajan@email.com',
    address: 'Nellore District, Andhra Pradesh',
    registeredDate: '2024-01-15',
    totalFarms: 2,
    totalPonds: 8,
    activeHarvests: 3
  });

  // Demo farms data
  const [farms] = useState([
    {
      id: 'FARM-001',
      name: 'Sunrise Aqua Farm',
      address: 'Muthukur, Nellore District',
      location: { lat: 14.2896, lng: 80.0174 },
      waterSource: 'Bore Well + Canal',
      primarySpecies: 'Vannamei',
      totalArea: '4.2 Acres',
      pondsCount: 5,
      status: 'active',
      lastHarvest: '2024-11-15'
    },
    {
      id: 'FARM-002',
      name: 'Blue Waters Farm',
      address: 'Kavali, Nellore District',
      location: { lat: 14.9167, lng: 79.9833 },
      waterSource: 'Canal Water',
      primarySpecies: 'Vannamei',
      totalArea: '3.5 Acres',
      pondsCount: 3,
      status: 'active',
      lastHarvest: '2024-10-20'
    }
  ]);

  // Demo ponds data
  const [ponds] = useState([
    { id: 'P001', farmId: 'FARM-001', name: 'Pond A1', area: '0.8 Acre', type: 'Earthen', species: 'Vannamei', stockingDate: '2024-09-01', stockingDensity: '60 PL/m²', status: 'stocked', doc: 75 },
    { id: 'P002', farmId: 'FARM-001', name: 'Pond A2', area: '0.9 Acre', type: 'Earthen', species: 'Vannamei', stockingDate: '2024-09-15', stockingDensity: '55 PL/m²', status: 'stocked', doc: 60 },
    { id: 'P003', farmId: 'FARM-001', name: 'Pond A3', area: '0.75 Acre', type: 'Lined', species: 'Vannamei', stockingDate: '2024-10-01', stockingDensity: '70 PL/m²', status: 'stocked', doc: 45 },
    { id: 'P004', farmId: 'FARM-001', name: 'Pond B1', area: '0.85 Acre', type: 'Earthen', species: 'Vannamei', stockingDate: null, stockingDensity: null, status: 'empty', doc: 0 },
    { id: 'P005', farmId: 'FARM-001', name: 'Pond B2', area: '0.9 Acre', type: 'Earthen', species: 'Vannamei', stockingDate: null, stockingDensity: null, status: 'preparation', doc: 0 },
    { id: 'P006', farmId: 'FARM-002', name: 'Pond C1', area: '1.2 Acre', type: 'Lined', species: 'Vannamei', stockingDate: '2024-08-15', stockingDensity: '65 PL/m²', status: 'ready', doc: 95 },
    { id: 'P007', farmId: 'FARM-002', name: 'Pond C2', area: '1.15 Acre', type: 'Earthen', species: 'Vannamei', stockingDate: '2024-10-20', stockingDensity: '58 PL/m²', status: 'stocked', doc: 30 },
    { id: 'P008', farmId: 'FARM-002', name: 'Pond C3', area: '1.15 Acre', type: 'Earthen', species: 'Vannamei', stockingDate: null, stockingDensity: null, status: 'empty', doc: 0 }
  ]);

  // Demo harvests data
  const [harvests] = useState([
    { id: 'H001', pondId: 'P006', pondName: 'Pond C1', farmName: 'Blue Waters Farm', date: '2024-12-10', quantity: '2500 kg', method: 'Partial Drain', avgWeight: '32g', status: 'pending_inspection', grade: null },
    { id: 'H002', pondId: 'P001', pondName: 'Pond A1', farmName: 'Sunrise Aqua Farm', date: '2024-12-08', quantity: '1800 kg', method: 'Full Drain', avgWeight: '28g', status: 'inspected', grade: '30 Count' },
    { id: 'H003', pondId: 'P003', pondName: 'Pond A3', farmName: 'Sunrise Aqua Farm', date: '2024-12-05', quantity: '2100 kg', method: 'Partial Drain', avgWeight: '35g', status: 'packed', grade: '40 Count' }
  ]);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'farms', label: 'My Farms', icon: MapPin },
    { id: 'ponds', label: 'Pond Management', icon: Waves },
    { id: 'harvests', label: 'Harvests', icon: Package },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'stocked': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'ready': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'empty': return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
      case 'preparation': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'pending_inspection': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'inspected': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'packed': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const handleLogout = () => {
    navigate('/aquaculture');
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6">
        <h2 className="text-2xl font-bold text-white mb-2">Welcome, {farmerData.name}!</h2>
        <p className="text-emerald-100">Farmer ID: {farmerData.id}</p>
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
          <p className="text-2xl font-bold text-white">{ponds.filter(p => p.status === 'stocked').length}</p>
          <p className="text-sm text-slate-400">Active Stocks</p>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Package className="w-5 h-5 text-purple-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{harvests.filter(h => h.status === 'pending_inspection').length}</p>
          <p className="text-sm text-slate-400">Pending Inspection</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Harvests</h3>
        <div className="space-y-3">
          {harvests.slice(0, 3).map(harvest => (
            <div key={harvest.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 rounded-lg">
                  <Package className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-white font-medium">{harvest.pondName}</p>
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

      {/* Ponds Ready for Harvest */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Ponds Ready for Harvest</h3>
        <div className="space-y-3">
          {ponds.filter(p => p.status === 'ready' || p.doc >= 90).map(pond => (
            <div key={pond.id} className="flex items-center justify-between p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-white font-medium">{pond.name}</p>
                  <p className="text-sm text-slate-400">DOC: {pond.doc} days • {pond.area}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowHarvestModal(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm transition-colors"
              >
                Start Harvest
              </button>
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
        <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors">
          <Plus className="w-4 h-4" />
          Add Farm
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {farms.map(farm => (
          <div key={farm.id} className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
            <div className="h-32 bg-gradient-to-br from-emerald-600/30 to-teal-600/30 flex items-center justify-center">
              <MapPin className="w-12 h-12 text-emerald-400" />
            </div>
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">{farm.name}</h3>
                  <p className="text-sm text-slate-400">{farm.id}</p>
                </div>
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs">
                  {farm.status}
                </span>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Address</span>
                  <span className="text-white">{farm.address}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Water Source</span>
                  <span className="text-white">{farm.waterSource}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Species</span>
                  <span className="text-white">{farm.primarySpecies}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Area</span>
                  <span className="text-white">{farm.totalArea}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Ponds</span>
                  <span className="text-white">{farm.pondsCount}</span>
                </div>
              </div>

              <div className="flex gap-2 mt-4 pt-4 border-t border-slate-700">
                <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm transition-colors">
                  <Eye className="w-4 h-4" />
                  View Ponds
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

  const renderPonds = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Pond Management</h2>
        <button 
          onClick={() => setShowAddPondModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Pond
        </button>
      </div>

      {/* Filter by Farm */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm whitespace-nowrap">
          All Ponds
        </button>
        {farms.map(farm => (
          <button key={farm.id} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm whitespace-nowrap transition-colors">
            {farm.name}
          </button>
        ))}
      </div>

      {/* Ponds Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ponds.map(pond => {
          const farm = farms.find(f => f.id === pond.farmId);
          return (
            <div key={pond.id} className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">{pond.name}</h3>
                  <p className="text-sm text-slate-400">{farm?.name}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs border ${getStatusColor(pond.status)}`}>
                  {pond.status}
                </span>
              </div>

              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-slate-400">Area</span>
                  <span className="text-white">{pond.area}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Type</span>
                  <span className="text-white">{pond.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Species</span>
                  <span className="text-white">{pond.species}</span>
                </div>
                {pond.stockingDate && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Stocking Date</span>
                      <span className="text-white">{pond.stockingDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Density</span>
                      <span className="text-white">{pond.stockingDensity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">DOC</span>
                      <span className={`font-medium ${pond.doc >= 90 ? 'text-emerald-400' : pond.doc >= 60 ? 'text-amber-400' : 'text-blue-400'}`}>
                        {pond.doc} days
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* DOC Progress Bar */}
              {pond.status === 'stocked' && (
                <div className="mb-4">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Harvest Progress</span>
                    <span className="text-white">{Math.min(pond.doc, 100)}%</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${pond.doc >= 90 ? 'bg-emerald-500' : pond.doc >= 60 ? 'bg-amber-500' : 'bg-blue-500'}`}
                      style={{ width: `${Math.min(pond.doc, 100)}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                {pond.status === 'stocked' && pond.doc >= 60 && (
                  <button 
                    onClick={() => setShowHarvestModal(true)}
                    className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm transition-colors"
                  >
                    Harvest
                  </button>
                )}
                {pond.status === 'empty' && (
                  <button className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm transition-colors">
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
    </div>
  );

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
              <th className="text-left text-sm font-medium text-slate-400 px-4 py-3">Pond</th>
              <th className="text-left text-sm font-medium text-slate-400 px-4 py-3">Farm</th>
              <th className="text-left text-sm font-medium text-slate-400 px-4 py-3">Date</th>
              <th className="text-left text-sm font-medium text-slate-400 px-4 py-3">Quantity</th>
              <th className="text-left text-sm font-medium text-slate-400 px-4 py-3">Method</th>
              <th className="text-left text-sm font-medium text-slate-400 px-4 py-3">Grade</th>
              <th className="text-left text-sm font-medium text-slate-400 px-4 py-3">Status</th>
              <th className="text-left text-sm font-medium text-slate-400 px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {harvests.map(harvest => (
              <tr key={harvest.id} className="border-t border-slate-800">
                <td className="px-4 py-3 text-white">{harvest.pondName}</td>
                <td className="px-4 py-3 text-slate-400">{harvest.farmName}</td>
                <td className="px-4 py-3 text-slate-400">{harvest.date}</td>
                <td className="px-4 py-3 text-white">{harvest.quantity}</td>
                <td className="px-4 py-3 text-slate-400">{harvest.method}</td>
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
              <span className="text-2xl font-bold text-emerald-400">6,400 kg</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
              <span className="text-slate-400">Average Size</span>
              <span className="text-2xl font-bold text-blue-400">31.7g</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
              <span className="text-slate-400">Survival Rate</span>
              <span className="text-2xl font-bold text-amber-400">87%</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Grade Distribution</h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-400">30 Count</span>
                <span className="text-white">45%</span>
              </div>
              <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '45%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-400">40 Count</span>
                <span className="text-white">35%</span>
              </div>
              <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: '35%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-400">50 Count</span>
                <span className="text-white">20%</span>
              </div>
              <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: '20%' }} />
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

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default AquaFarmerDashboard;
