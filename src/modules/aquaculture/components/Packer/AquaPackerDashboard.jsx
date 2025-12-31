import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut, Package, Droplets, Search, Eye, QrCode, CheckCircle, 
  AlertCircle, Clock, Printer, Plus, Scan, ArrowLeft, X
} from 'lucide-react';
import { useLanguage } from '../../../shared/context/LanguageContext';
import LanguageToggle from '../../../shared/components/Shared/LanguageToggle';
import Toast from '../../../shared/components/Shared/Toast';

const AquaPackerDashboard = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState('ready');
  const [toast, setToast] = useState(null);
  const [selectedHarvest, setSelectedHarvest] = useState(null);
  const [showPackingModal, setShowPackingModal] = useState(false);
  const [showCrateQR, setShowCrateQR] = useState(null);

  // Demo packer data
  const [packerData] = useState({
    id: 'PKR-AQ-001',
    name: 'Suresh Babu',
    designation: 'Crate Packer',
    packingCenter: 'Nellore Packing Center',
    cratesPacked: 45,
    todaysCrates: 12
  });

  // Demo ready for packing (inspected harvests)
  const [readyForPacking] = useState([
    {
      id: 'H002',
      farmerId: 'AF-001',
      farmerName: 'Kumar Rajan',
      farmName: 'Sunrise Aqua Farm',
      pondName: 'Pond A1',
      harvestDate: '2024-12-08',
      quantity: '1800 kg',
      species: 'Vannamei',
      grade: '30 Count',
      qualityScore: 'A',
      inspectorName: 'Ramesh Kumar',
      inspectionDate: '2024-12-08'
    },
    {
      id: 'H003',
      farmerId: 'AF-001',
      farmerName: 'Kumar Rajan',
      farmName: 'Sunrise Aqua Farm',
      pondName: 'Pond A3',
      harvestDate: '2024-12-05',
      quantity: '2100 kg',
      species: 'Vannamei',
      grade: '40 Count',
      qualityScore: 'A',
      inspectorName: 'Ramesh Kumar',
      inspectionDate: '2024-12-05'
    }
  ]);

  // Demo packed crates
  const [packedCrates, setPackedCrates] = useState([
    {
      id: 'N-A-2024120801',
      harvestId: 'H002',
      farmName: 'Sunrise Aqua Farm',
      species: 'Vannamei',
      weight: '25 kg',
      grade: '30 Count',
      qualityScore: 'A',
      packedDate: '2024-12-09',
      packedTime: '09:30 AM',
      status: 'active'
    },
    {
      id: 'N-A-2024120802',
      harvestId: 'H002',
      farmName: 'Sunrise Aqua Farm',
      species: 'Vannamei',
      weight: '25 kg',
      grade: '30 Count',
      qualityScore: 'A',
      packedDate: '2024-12-09',
      packedTime: '09:45 AM',
      status: 'active'
    },
    {
      id: 'N-A-2024120803',
      harvestId: 'H003',
      farmName: 'Sunrise Aqua Farm',
      species: 'Vannamei',
      weight: '30 kg',
      grade: '40 Count',
      qualityScore: 'A',
      packedDate: '2024-12-09',
      packedTime: '10:15 AM',
      status: 'active'
    }
  ]);

  // Packing form state
  const [packingForm, setPackingForm] = useState({
    weight: '',
    numberOfCrates: 1,
    notes: ''
  });

  const handleLogout = () => {
    navigate('/aquaculture');
  };

  const handleStartPacking = (harvest) => {
    setSelectedHarvest(harvest);
    setShowPackingModal(true);
  };

  const generateCrateCode = () => {
    const date = new Date();
    const dateStr = date.toISOString().slice(0,10).replace(/-/g, '');
    const sequence = String(packedCrates.length + 1).padStart(2, '0');
    return `N-A-${dateStr}${sequence}`;
  };

  const handleCreateCrates = () => {
    const newCrates = [];
    for (let i = 0; i < packingForm.numberOfCrates; i++) {
      newCrates.push({
        id: generateCrateCode(),
        harvestId: selectedHarvest.id,
        farmName: selectedHarvest.farmName,
        species: selectedHarvest.species,
        weight: `${packingForm.weight} kg`,
        grade: selectedHarvest.grade,
        qualityScore: selectedHarvest.qualityScore,
        packedDate: new Date().toISOString().slice(0, 10),
        packedTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        status: 'active'
      });
    }
    
    setPackedCrates([...packedCrates, ...newCrates]);
    setToast({ message: `${packingForm.numberOfCrates} crate(s) created successfully!`, type: 'success' });
    setShowPackingModal(false);
    setSelectedHarvest(null);
    setPackingForm({ weight: '', numberOfCrates: 1, notes: '' });
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
              <p className="text-xs text-slate-400">Aquaculture Division</p>
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
      <div className="bg-gradient-to-r from-orange-600 to-amber-600 px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white">{packerData.name}</h2>
              <p className="text-orange-100">{packerData.designation} • {packerData.packingCenter}</p>
              <p className="text-orange-200 text-sm">ID: {packerData.id}</p>
            </div>
            <div className="flex gap-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-3 text-center">
                <p className="text-3xl font-bold text-white">{packerData.todaysCrates}</p>
                <p className="text-orange-100 text-sm">Crates Today</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-3 text-center">
                <p className="text-3xl font-bold text-white">{packerData.cratesPacked}</p>
                <p className="text-orange-100 text-sm">Total Crates</p>
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
                      <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs">
                        Grade {harvest.qualityScore}
                      </span>
                    </div>
                    <h4 className="text-lg font-semibold text-white mb-1">
                      {harvest.farmName} - {harvest.pondName}
                    </h4>
                    <p className="text-slate-400 text-sm mb-3">
                      Farmer: {harvest.farmerName} • Inspector: {harvest.inspectorName}
                    </p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-slate-500">Species</p>
                        <p className="text-white">{harvest.species}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Quantity</p>
                        <p className="text-white">{harvest.quantity}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Size Grade</p>
                        <p className="text-emerald-400 font-medium">{harvest.grade}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Harvest Date</p>
                        <p className="text-white">{harvest.harvestDate}</p>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleStartPacking(harvest)}
                    className="px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
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
                    className="pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:border-orange-500 focus:outline-none"
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
                      <p className="text-lg font-mono font-bold text-orange-400">{crate.id}</p>
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
                      <span className="text-slate-400">Farm</span>
                      <span className="text-white">{crate.farmName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Species</span>
                      <span className="text-white">{crate.species}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Weight</span>
                      <span className="text-white">{crate.weight}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Grade</span>
                      <span className="text-emerald-400">{crate.grade}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Quality</span>
                      <span className="text-emerald-400">Grade {crate.qualityScore}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Packed</span>
                      <span className="text-white">{crate.packedDate} {crate.packedTime}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => setShowCrateQR(crate)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-sm transition-colors"
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
                  <p className="text-slate-400">{selectedHarvest.farmName} - {selectedHarvest.pondName}</p>
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
                    <p className="text-white">{selectedHarvest.quantity}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Grade</p>
                    <p className="text-emerald-400">{selectedHarvest.grade}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Quality</p>
                    <p className="text-emerald-400">Grade {selectedHarvest.qualityScore}</p>
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
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-orange-500 focus:outline-none"
                    placeholder="25"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-1">Number of Crates</label>
                  <input
                    type="number"
                    min="1"
                    value={packingForm.numberOfCrates}
                    onChange={(e) => setPackingForm({...packingForm, numberOfCrates: parseInt(e.target.value) || 1})}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-orange-500 focus:outline-none"
                  />
                </div>

                <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
                  <p className="text-sm text-slate-400 mb-1">Crate Code Format</p>
                  <p className="text-lg font-mono text-orange-400">N-A-YYYYMMDDXX</p>
                  <p className="text-xs text-slate-500 mt-1">N = National, A = Aquaculture</p>
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
                  className="flex-1 px-6 py-3 bg-orange-600 hover:bg-orange-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl font-medium transition-colors"
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
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 text-center">
            <button
              onClick={() => setShowCrateQR(null)}
              className="absolute top-4 right-4 p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
            
            <div className="bg-white rounded-xl p-6 mb-4 inline-block">
              <div className="w-48 h-48 bg-slate-200 flex items-center justify-center">
                <QrCode className="w-32 h-32 text-slate-800" />
              </div>
            </div>
            
            <p className="text-2xl font-mono font-bold text-orange-400 mb-2">{showCrateQR.id}</p>
            <p className="text-slate-400 mb-4">{showCrateQR.species} • {showCrateQR.weight} • {showCrateQR.grade}</p>
            
            <div className="flex gap-2">
              <button
                onClick={() => setShowCrateQR(null)}
                className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
              >
                Close
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg transition-colors">
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

export default AquaPackerDashboard;
