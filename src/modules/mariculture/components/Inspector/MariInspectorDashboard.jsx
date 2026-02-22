import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut, ClipboardCheck, Shell, Search, Eye, Camera, CheckCircle, 
  AlertCircle, Clock, Thermometer, Droplet, Scale, Star, ArrowLeft, Waves
} from 'lucide-react';
import { useLanguage } from '../../../shared/context/LanguageContext';
import LanguageToggle from '../../../shared/components/Shared/LanguageToggle';
import Toast from '../../../shared/components/Shared/Toast';
import { mariAuthAPI, mariInspectorAPI } from '../../services/mariApi';

const MariInspectorDashboard = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState('pending');
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedHarvest, setSelectedHarvest] = useState(null);
  const [showInspectionModal, setShowInspectionModal] = useState(false);

  // Real data state
  const [inspectorData, setInspectorData] = useState({
    id: '', name: '', designation: 'Quality Inspector', zone: 'Mariculture Zone',
    inspectionsToday: 0, totalInspections: 0
  });
  const [pendingInspections, setPendingInspections] = useState([]);
  const [completedInspections, setCompletedInspections] = useState([]);

  // Inspection form state
  const [inspectionForm, setInspectionForm] = useState({
    waterTemp: '', salinity: '', moistureContent: '', cleanliness: '',
    grade: '', qualityScore: '', remarks: '', images: []
  });

  // Auth check + initial load
  useEffect(() => {
    if (!mariAuthAPI.isAuthenticated()) {
      navigate('/mariculture/login/inspector');
      return;
    }
    const user = mariAuthAPI.getCurrentUser();
    if (user) {
      setInspectorData(prev => ({ ...prev, id: user.id, name: user.name || user.username }));
    }
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [pendingRes, historyRes, statsRes] = await Promise.all([
        mariInspectorAPI.getPendingInspections().catch(() => ({ data: { data: [] } })),
        mariInspectorAPI.getInspectionHistory().catch(() => ({ data: { data: [] } })),
        mariInspectorAPI.getDashboardStats().catch(() => ({ data: { stats: {} } }))
      ]);
      setPendingInspections(pendingRes.data?.data || []);
      setCompletedInspections(historyRes.data?.data || []);
      const stats = statsRes.data?.stats || {};
      setInspectorData(prev => ({
        ...prev,
        inspectionsToday: pendingRes.data?.data?.length || 0,
        totalInspections: stats.completedInspections || historyRes.data?.data?.length || 0
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

  const handleStartInspection = (harvest) => {
    setSelectedHarvest(harvest);
    setShowInspectionModal(true);
  };

  const handleSubmitInspection = async () => {
    try {
      const isApproved = inspectionForm.grade && !inspectionForm.grade.toLowerCase().includes('rejected');
      await mariInspectorAPI.submitInspection({
        harvest_id: selectedHarvest.id,
        water_temp_c: inspectionForm.waterTemp,
        ph_level: inspectionForm.salinity,
        dissolved_oxygen: null,
        avg_weight_g: null,
        freshness_score: 8,
        quality_score: inspectionForm.qualityScore === 'A' ? 9 : inspectionForm.qualityScore === 'B' ? 7 : 5,
        grade: inspectionForm.grade,
        remarks: inspectionForm.remarks,
        decision: isApproved ? 'approve' : 'reject'
      });
      setToast({ message: 'Inspection submitted successfully!', type: 'success' });
      setShowInspectionModal(false);
      setSelectedHarvest(null);
      setInspectionForm({ waterTemp: '', salinity: '', moistureContent: '', cleanliness: '', grade: '', qualityScore: '', remarks: '', images: [] });
      loadAllData();
    } catch (err) {
      setToast({ message: 'Failed to submit inspection: ' + (err.response?.data?.message || err.message), type: 'error' });
    }
  };

  const seaweedGrades = ['Grade A', 'Grade B', 'Grade C', 'Rejected'];
  const fishGrades = ['Premium', 'Grade A', 'Grade B', 'Rejected'];
  const qualityOptions = ['A', 'B', 'C', 'Rejected'];

  const isSeaweed = (species) => {
    return species?.toLowerCase().includes('kappaphycus') || species?.toLowerCase().includes('gracilaria');
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="bg-slate-900/80 border-b border-slate-800 sticky top-0 z-50 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl">
              <ClipboardCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Quality Inspector</h1>
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

      {/* Inspector Info Banner */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white">{inspectorData.name}</h2>
              <p className="text-purple-100">{inspectorData.designation} • {inspectorData.zone}</p>
              <p className="text-purple-200 text-sm">ID: {inspectorData.id}</p>
            </div>
            <div className="flex gap-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-3 text-center">
                <p className="text-3xl font-bold text-white">{pendingInspections.length}</p>
                <p className="text-purple-100 text-sm">Pending Today</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-3 text-center">
                <p className="text-3xl font-bold text-white">{inspectorData.totalInspections}</p>
                <p className="text-purple-100 text-sm">Total Inspections</p>
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
              onClick={() => setActiveTab('pending')}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'pending'
                  ? 'text-amber-400 border-amber-400'
                  : 'text-slate-400 border-transparent hover:text-white'
              }`}
            >
              <Clock className="w-4 h-4" />
              Pending ({pendingInspections.length})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'completed'
                  ? 'text-emerald-400 border-emerald-400'
                  : 'text-slate-400 border-transparent hover:text-white'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              Completed ({completedInspections.length})
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'pending' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4">Pending Inspections</h3>
            {pendingInspections.map(harvest => (
              <div key={harvest.id} className="bg-slate-900/50 border border-amber-500/30 rounded-xl p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs">
                        Pending Inspection
                      </span>
                      <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs">
                        {harvest.method || harvest.unitType || 'harvest'}
                      </span>
                      <span className="text-slate-500 text-sm">{harvest.harvest_code || ''}</span>
                    </div>
                    <h4 className="text-lg font-semibold text-white mb-1">
                      {harvest.species} - {harvest.harvest_code || harvest.id}
                    </h4>
                    <p className="text-slate-400 text-sm mb-3">
                      Farm ID: {harvest.farm_id || 'N/A'}
                    </p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-slate-500">Harvest Date</p>
                        <p className="text-white">{harvest.harvest_date || harvest.harvestDate}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Quantity</p>
                        <p className="text-white">{harvest.total_quantity_kg ? harvest.total_quantity_kg + ' kg' : harvest.quantity}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Species</p>
                        <p className="text-white">{harvest.species}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Method</p>
                        <p className="text-white">{harvest.method || harvest.harvestMethod || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleStartInspection(harvest)}
                    className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
                  >
                    <ClipboardCheck className="w-5 h-5" />
                    Start Inspection
                  </button>
                </div>
              </div>
            ))}

            {pendingInspections.length === 0 && (
              <div className="text-center py-12">
                <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">All Caught Up!</h3>
                <p className="text-slate-400">No pending inspections at the moment.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'completed' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4">Completed Inspections</h3>
            {completedInspections.map(inspection => (
              <div key={inspection.id} className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        inspection.decision === 'approve' || inspection.status === 'approved'
                          ? 'bg-emerald-500/20 text-emerald-400' 
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {inspection.decision === 'approve' || inspection.status === 'approved' ? 'Approved' : 'Rejected'}
                      </span>
                      <span className="text-slate-500 text-sm">Inspected: {inspection.inspection_date || inspection.inspectionDate}</span>
                    </div>
                    <h4 className="text-lg font-semibold text-white mb-1">
                      Inspection #{inspection.id}
                    </h4>
                    
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                      <div>
                        <p className="text-slate-500">Grade</p>
                        <p className="text-purple-400 font-medium">{inspection.quality_grade || inspection.grade || '-'}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Score</p>
                        <p className="text-emerald-400 font-medium">{inspection.overall_score || inspection.qualityScore || '-'}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Remarks</p>
                        <p className="text-white">{inspection.remarks || '-'}</p>
                      </div>
                    </div>
                  </div>
                  
                  <button className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors">
                    <Eye className="w-5 h-5 text-slate-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Inspection Modal */}
      {showInspectionModal && selectedHarvest && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-800">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-white">Quality Inspection</h2>
                  <p className="text-slate-400">{selectedHarvest.species} - {selectedHarvest.harvest_code || selectedHarvest.id}</p>
                </div>
                <button
                  onClick={() => setShowInspectionModal(false)}
                  className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-slate-400" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Harvest Info */}
              <div className="bg-slate-800/50 rounded-xl p-4">
                <h3 className="text-sm font-medium text-slate-400 mb-3">Harvest Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">Farm ID</p>
                    <p className="text-white">{selectedHarvest.farm_id || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Quantity</p>
                    <p className="text-white">{selectedHarvest.total_quantity_kg ? selectedHarvest.total_quantity_kg + ' kg' : selectedHarvest.quantity}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Species</p>
                    <p className="text-white">{selectedHarvest.species}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Method</p>
                    <p className="text-white">{selectedHarvest.method || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Inspection Parameters */}
              <div>
                <h3 className="text-sm font-medium text-slate-400 mb-3">
                  {isSeaweed(selectedHarvest.species) ? 'Seaweed Parameters' : 'Fish Parameters'}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {isSeaweed(selectedHarvest.species) ? (
                    <>
                      <div>
                        <label className="block text-sm text-slate-400 mb-1">Moisture Content (%)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={inspectionForm.moistureContent}
                          onChange={(e) => setInspectionForm({...inspectionForm, moistureContent: e.target.value})}
                          className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                          placeholder="82"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-slate-400 mb-1">Cleanliness</label>
                        <select
                          value={inspectionForm.cleanliness}
                          onChange={(e) => setInspectionForm({...inspectionForm, cleanliness: e.target.value})}
                          className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                        >
                          <option value="">Select</option>
                          <option value="Excellent">Excellent</option>
                          <option value="Good">Good</option>
                          <option value="Fair">Fair</option>
                          <option value="Poor">Poor</option>
                        </select>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm text-slate-400 mb-1">
                          <Thermometer className="w-4 h-4 inline mr-1" />
                          Water Temp (°C)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={inspectionForm.waterTemp}
                          onChange={(e) => setInspectionForm({...inspectionForm, waterTemp: e.target.value})}
                          className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                          placeholder="27.5"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-slate-400 mb-1">
                          <Waves className="w-4 h-4 inline mr-1" />
                          Salinity (ppt)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={inspectionForm.salinity}
                          onChange={(e) => setInspectionForm({...inspectionForm, salinity: e.target.value})}
                          className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                          placeholder="32"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Grading */}
              <div>
                <h3 className="text-sm font-medium text-slate-400 mb-3">Product Grading</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">
                      <Scale className="w-4 h-4 inline mr-1" />
                      Grade
                    </label>
                    <select
                      value={inspectionForm.grade}
                      onChange={(e) => setInspectionForm({...inspectionForm, grade: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                    >
                      <option value="">Select Grade</option>
                      {(isSeaweed(selectedHarvest.species) ? seaweedGrades : fishGrades).map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">
                      <Star className="w-4 h-4 inline mr-1" />
                      Quality Score
                    </label>
                    <select
                      value={inspectionForm.qualityScore}
                      onChange={(e) => setInspectionForm({...inspectionForm, qualityScore: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                    >
                      <option value="">Select Quality</option>
                      {qualityOptions.map(q => (
                        <option key={q} value={q}>Grade {q}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Photo Capture */}
              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  <Camera className="w-4 h-4 inline mr-1" />
                  Capture Photos
                </label>
                <button className="w-full py-8 border-2 border-dashed border-slate-700 rounded-xl hover:border-purple-500 transition-colors flex flex-col items-center gap-2">
                  <Camera className="w-8 h-8 text-slate-500" />
                  <span className="text-slate-400">Click to capture inspection photos</span>
                </button>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-sm text-slate-400 mb-1">Remarks</label>
                <textarea
                  value={inspectionForm.remarks}
                  onChange={(e) => setInspectionForm({...inspectionForm, remarks: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-purple-500 focus:outline-none resize-none"
                  placeholder="Add any additional remarks..."
                />
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setShowInspectionModal(false)}
                  className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitInspection}
                  className="flex-1 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium transition-colors"
                >
                  Submit Inspection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default MariInspectorDashboard;
