import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut, Package, Shell, Search, Eye, QrCode, CheckCircle, 
  AlertCircle, Clock, Printer, Plus, Scan, ArrowLeft, X
} from 'lucide-react';
import { useLanguage } from '../../../shared/context/LanguageContext';
import LanguageToggle from '../../../shared/components/Shared/LanguageToggle';
import Toast from '../../../shared/components/Shared/Toast';
import { mariAuthAPI, mariPackerAPI } from '../../services/mariApi';

const MariPackerDashboard = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState('ready');
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedHarvest, setSelectedHarvest] = useState(null);
  const [showPackingModal, setShowPackingModal] = useState(false);
  const [showCrateQR, setShowCrateQR] = useState(null);

  // Real data state
  const [packerData, setPackerData] = useState({
    id: '', name: '', designation: 'Crate Packer', packingCenter: 'Packing Center',
    cratesPacked: 0, todaysCrates: 0
  });
  const [readyForPacking, setReadyForPacking] = useState([]);
  const [packedCrates, setPackedCrates] = useState([]);

  // Packing form state
  const [packingForm, setPackingForm] = useState({
    weight: '', numberOfCrates: 1, notes: ''
  });

  // Auth check + initial load
  useEffect(() => {
    if (!mariAuthAPI.isAuthenticated()) {
      navigate('/mariculture/login/packer');
      return;
    }
    const user = mariAuthAPI.getCurrentUser();
    if (user) {
      setPackerData(prev => ({ ...prev, id: user.id, name: user.name || user.username }));
    }
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [readyRes, cratesRes, statsRes] = await Promise.all([
        mariPackerAPI.getApprovedHarvests().catch(() => ({ data: { data: [] } })),
        mariPackerAPI.getCrates().catch(() => ({ data: { data: [] } })),
        mariPackerAPI.getDashboardStats().catch(() => ({ data: { stats: {} } }))
      ]);
      setReadyForPacking(readyRes.data?.data || []);
      setPackedCrates(cratesRes.data?.data || []);
      const stats = statsRes.data?.stats || {};
      setPackerData(prev => ({
        ...prev,
        cratesPacked: stats.packedCrates || cratesRes.data?.data?.length || 0,
        todaysCrates: (cratesRes.data?.data || []).filter(c => c.packing_date?.startsWith(new Date().toISOString().split('T')[0])).length
      }));
    } catch (err) {
      console.error('Load data error:', err);
    }
    setLoading(false);
  };

  const handleLogout = () => {
    mariAuthAPI.logout();
    navigate('/mariculture');
  };

  const handleStartPacking = (harvest) => {
    setSelectedHarvest(harvest);
    setShowPackingModal(true);
  };

  const generateCrateCode = () => {
    const date = new Date();
    const dateStr = date.toISOString().slice(0,10).replace(/-/g, '');
    const sequence = String(packedCrates.length + 1).padStart(2, '0');
    return `N-M-${dateStr}${sequence}`;
  };

  const handleCreateCrates = async () => {
    try {
      for (let i = 0; i < packingForm.numberOfCrates; i++) {
        await mariPackerAPI.packCrate({
          harvest_id: selectedHarvest.id,
          species: selectedHarvest.species,
          weight_kg: parseFloat(packingForm.weight) || 0,
          grade: selectedHarvest.grade || 'A',
          notes: packingForm.notes
        });
      }
      setToast({ message: `${packingForm.numberOfCrates} crate(s) created successfully!`, type: 'success' });
      setShowPackingModal(false);
      setSelectedHarvest(null);
      setPackingForm({ weight: '', numberOfCrates: 1, notes: '' });
      loadAllData();
    } catch (err) {
      setToast({ message: 'Failed to create crates: ' + (err.response?.data?.message || err.message), type: 'error' });
    }
  };

  const isSeaweed = (species) => {
    return species?.toLowerCase().includes('kappaphycus') || species?.toLowerCase().includes('gracilaria');
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="bg-slate-900/80 border-b border-slate-800 sticky top-0 z-50 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-orange-600 to-amber-500 rounded-xl">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Crate Packer</h1>
              <p className="text-xs text-slate-400">Mariculture Division</p>
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

      {/* Packer Info Banner */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white">{packerData.name}</h2>
              <p className="text-purple-100">{packerData.designation} • {packerData.packingCenter}</p>
              <p className="text-purple-200 text-sm">ID: {packerData.id}</p>
            </div>
            <div className="flex gap-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-3 text-center">
                <p className="text-3xl font-bold text-white">{packerData.todaysCrates}</p>
                <p className="text-purple-100 text-sm">Crates Today</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-3 text-center">
                <p className="text-3xl font-bold text-white">{packerData.cratesPacked}</p>
                <p className="text-purple-100 text-sm">Total Crates</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <nav className="bg-slate-900/50 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('ready')}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'ready'
                  ? 'text-blue-400 border-blue-400'
                  : 'text-slate-400 border-transparent hover:text-white'
              }`}
            >
              <Clock className="w-4 h-4" />
              Ready to Pack ({readyForPacking.length})
            </button>
            <button
              onClick={() => setActiveTab('crates')}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'crates'
                  ? 'text-emerald-400 border-emerald-400'
                  : 'text-slate-400 border-transparent hover:text-white'
              }`}
            >
              <Package className="w-4 h-4" />
              Packed Crates ({packedCrates.length})
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'ready' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4">Ready for Packing</h3>
            {readyForPacking.map(harvest => (
              <div key={harvest.id} className="bg-slate-900/50 border border-blue-500/30 rounded-xl p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs">
                        Inspected & Approved
                      </span>
                      <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs">
                        {harvest.method || 'harvest'}
                      </span>
                    </div>
                    <h4 className="text-lg font-semibold text-white mb-1">
                      {harvest.species} - {harvest.harvest_code || harvest.id}
                    </h4>
                    <p className="text-slate-400 text-sm mb-3">
                      Farm ID: {harvest.farm_id || 'N/A'}
                    </p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-slate-500">Species</p>
                        <p className="text-white">{harvest.species}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Quantity</p>
                        <p className="text-white">{harvest.total_quantity_kg ? harvest.total_quantity_kg + ' kg' : harvest.quantity}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Harvest Date</p>
                        <p className="text-white">{harvest.harvest_date || harvest.harvestDate}</p>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleStartPacking(harvest)}
                    className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
                  >
                    <Package className="w-5 h-5" />
                    Create Crates
                  </button>
                </div>
              </div>
            ))}

            {readyForPacking.length === 0 && (
              <div className="text-center py-12">
                <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Pending Items</h3>
                <p className="text-slate-400">No harvests ready for packing at the moment.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'crates' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white">Packed Crates</h3>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search crate..."
                    className="pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Crates Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {packedCrates.map(crate => (
                <div key={crate.id} className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Crate Code</p>
                      <p className="text-lg font-mono font-bold text-purple-400">{crate.crate_code || crate.id}</p>
                    </div>
                    <button
                      onClick={() => setShowCrateQR(crate)}
                      className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <QrCode className="w-5 h-5 text-slate-400" />
                    </button>
                  </div>

                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Species</span>
                      <span className="text-white">{crate.species || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Weight</span>
                      <span className="text-white">{crate.weight_kg ? crate.weight_kg + ' kg' : crate.weight || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Grade</span>
                      <span className="text-purple-400">{crate.grade || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Status</span>
                      <span className={`${crate.status === 'dispatched' ? 'text-emerald-400' : 'text-blue-400'}`}>{crate.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Packed</span>
                      <span className="text-white">{crate.packing_date ? new Date(crate.packing_date).toLocaleDateString() : crate.packedDate}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => setShowCrateQR(crate)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm transition-colors"
                    >
                      <Printer className="w-4 h-4" />
                      Print Label
                    </button>
                    <button className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Packing Modal */}
      {showPackingModal && selectedHarvest && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full">
            <div className="p-6 border-b border-slate-800">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-white">Create Crates</h2>
                  <p className="text-slate-400">{selectedHarvest.species} - {selectedHarvest.harvest_code || selectedHarvest.id}</p>
                </div>
                <button
                  onClick={() => setShowPackingModal(false)}
                  className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Harvest Info */}
              <div className="bg-slate-800/50 rounded-xl p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">Species</p>
                    <p className="text-white">{selectedHarvest.species}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Total Quantity</p>
                    <p className="text-white">{selectedHarvest.total_quantity_kg ? selectedHarvest.total_quantity_kg + ' kg' : selectedHarvest.quantity}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Grade</p>
                    <p className="text-purple-400">{selectedHarvest.grade || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Method</p>
                    <p className="text-white">{selectedHarvest.method || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Crate Details */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Weight per Crate (kg)</label>
                  <input
                    type="number"
                    value={packingForm.weight}
                    onChange={(e) => setPackingForm({...packingForm, weight: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-purple-500 focus:outline-none"
                    placeholder={isSeaweed(selectedHarvest.species) ? "50" : "30"}
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-1">Number of Crates</label>
                  <input
                    type="number"
                    min="1"
                    value={packingForm.numberOfCrates}
                    onChange={(e) => setPackingForm({...packingForm, numberOfCrates: parseInt(e.target.value) || 1})}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
                  <p className="text-sm text-slate-400 mb-1">Crate Code Format</p>
                  <p className="text-lg font-mono text-purple-400">N-M-YYYYMMDDXX</p>
                  <p className="text-xs text-slate-500 mt-1">N = National, M = Mariculture</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setShowPackingModal(false)}
                  className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateCrates}
                  disabled={!packingForm.weight}
                  className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl font-medium transition-colors"
                >
                  Create {packingForm.numberOfCrates} Crate(s)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showCrateQR && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 text-center relative">
            <button
              onClick={() => setShowCrateQR(null)}
              className="absolute top-4 right-4 p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
            
            <div className="bg-white rounded-xl p-6 mb-4 inline-block">
              {showCrateQR.qr_image_url ? (
                <img src={showCrateQR.qr_image_url} alt="QR Code" className="w-48 h-48" />
              ) : (
                <div className="w-48 h-48 bg-slate-200 flex items-center justify-center">
                  <QrCode className="w-32 h-32 text-slate-800" />
                </div>
              )}
            </div>
            
            <p className="text-2xl font-mono font-bold text-purple-400 mb-2">{showCrateQR.crate_code || showCrateQR.id}</p>
            <p className="text-slate-400 mb-4">{showCrateQR.species} • {showCrateQR.weight_kg ? showCrateQR.weight_kg + ' kg' : showCrateQR.weight} • {showCrateQR.grade}</p>
            
            <div className="flex gap-2">
              <button
                onClick={() => setShowCrateQR(null)}
                className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
              >
                Close
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors">
                <Printer className="w-4 h-4" />
                Print
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default MariPackerDashboard;
