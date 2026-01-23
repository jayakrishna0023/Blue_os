import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut, ClipboardCheck, Search, Eye, Camera, CheckCircle, 
  AlertCircle, Clock, Thermometer, Droplet, Scale, Star, X,
  RefreshCw, User, Bell, MapPin, Fish, Package, Activity,
  TrendingUp, Award, ChevronRight, Loader2, FileText, Shield,
  Calendar, Waves, BarChart3, Target, Zap
} from 'lucide-react';
import { useLanguage } from '../../../shared/context/LanguageContext';
import LanguageToggle from '../../../shared/components/Shared/LanguageToggle';
import Toast from '../../../shared/components/Shared/Toast';
import { aquaAuthAPI, aquaInspectorAPI } from '../../services/aquaApi';

const AquaInspectorDashboard = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState('pending');
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState(null);

  // Data states
  const [pendingInspections, setPendingInspections] = useState([]);
  const [completedInspections, setCompletedInspections] = useState([]);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, today: 0 });

  // Modal states
  const [selectedHarvest, setSelectedHarvest] = useState(null);
  const [showInspectionModal, setShowInspectionModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Inspection form state
  const [inspectionForm, setInspectionForm] = useState({
    water_temp_c: '',
    ph_level: '',
    dissolved_oxygen: '',
    avg_weight_g: '',
    grade: '',
    quality_score: '',
    freshness_score: 8,
    remarks: '',
    decision: 'approve'
  });

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'pending', label: 'Pending', icon: Clock },
    { id: 'completed', label: 'Completed', icon: CheckCircle },
  ];

  // Check auth and load data on mount
  useEffect(() => {
    const initDashboard = async () => {
      try {
        const isAuth = await aquaAuthAPI.isAuthenticated();
        if (!isAuth) {
          navigate('/aquaculture/login/inspector');
          return;
        }

        const currentUser = aquaAuthAPI.getCurrentUser();
        if (!currentUser || currentUser.role !== 'inspector') {
          navigate('/aquaculture/login/inspector');
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
      const [pendingRes, historyRes, dashboardRes] = await Promise.all([
        aquaInspectorAPI.getPendingInspections().catch(e => ({ success: false, data: [] })),
        aquaInspectorAPI.getInspectionHistory().catch(e => ({ success: false, data: [] })),
        aquaInspectorAPI.getDashboardStats().catch(e => ({ success: false, stats: {} }))
      ]);

      console.log('Inspector API Responses:', { pendingRes, historyRes, dashboardRes });

      if (pendingRes.success) setPendingInspections(pendingRes.data || []);
      if (historyRes.success) setCompletedInspections(historyRes.data || []);
      if (dashboardRes.success && dashboardRes.stats) setStats(dashboardRes.stats);
    } catch (error) {
      console.error('Load data error:', error);
      if (error.response?.status === 401) {
        showToast('Session expired. Please login again.', 'error');
        setTimeout(() => navigate('/aquaculture/login/inspector'), 1500);
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

  const handleStartInspection = async (harvest) => {
    setSelectedHarvest(harvest);
    setInspectionForm({
      water_temp_c: '',
      ph_level: '',
      dissolved_oxygen: '',
      avg_weight_g: harvest.avg_body_weight_g || '',
      grade: '',
      quality_score: '',
      freshness_score: 8,
      remarks: '',
      decision: 'approve'
    });
    setShowInspectionModal(true);
  };

  const handleSubmitInspection = async (e) => {
    e.preventDefault();
    if (!selectedHarvest) return;

    setSubmitting(true);
    try {
      const inspectionData = {
        harvest_id: selectedHarvest.id,
        water_temp_c: parseFloat(inspectionForm.water_temp_c) || null,
        ph_level: parseFloat(inspectionForm.ph_level) || null,
        dissolved_oxygen: parseFloat(inspectionForm.dissolved_oxygen) || null,
        avg_weight_g: parseFloat(inspectionForm.avg_weight_g) || null,
        grade: inspectionForm.grade,
        quality_score: inspectionForm.quality_score,
        freshness_score: inspectionForm.freshness_score,
        remarks: inspectionForm.remarks,
        decision: inspectionForm.decision
      };

      const result = await aquaInspectorAPI.submitInspection(inspectionData);
      
      if (result.success) {
        showToast('Inspection submitted successfully!', 'success');
        setShowInspectionModal(false);
        setSelectedHarvest(null);
        await loadAllData();
      } else {
        showToast(result.error || 'Failed to submit inspection', 'error');
      }
    } catch (error) {
      console.error('Submit error:', error);
      showToast('Failed to submit inspection', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const gradeOptions = ['20 Count', '30 Count', '40 Count', '50 Count', '60 Count', '70 Count', '80 Count'];
  const qualityOptions = ['A+', 'A', 'B', 'C', 'Rejected'];

  const getStatusColor = (status) => {
    const colors = {
      pending_inspection: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      approved: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
      packed: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
    };
    return colors[status] || 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  };

  const getQualityColor = (score) => {
    if (score === 'A+' || score === 'A') return 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30';
    if (score === 'B') return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
    if (score === 'C') return 'text-amber-400 bg-amber-500/20 border-amber-500/30';
    return 'text-red-400 bg-red-500/20 border-red-500/30';
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-500/30 rounded-full animate-pulse"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
            <ClipboardCheck className="absolute inset-0 m-auto w-8 h-8 text-blue-400 animate-bounce" />
          </div>
          <p className="text-slate-400 mt-6 text-lg">Loading inspector dashboard...</p>
        </div>
      </div>
    );
  }

  const StatCard = ({ icon: Icon, label, value, subValue, color, onClick }) => (
    <div 
      onClick={onClick}
      className={`group relative bg-gradient-to-br from-slate-900/80 to-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className={`absolute -top-20 -right-20 w-40 h-40 bg-${color}-500/10 rounded-full blur-3xl group-hover:bg-${color}-500/20 transition-all duration-700`} />
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 bg-gradient-to-br from-${color}-500/20 to-${color}-600/10 rounded-xl border border-${color}-500/20 group-hover:scale-110 transition-transform duration-300`}>
            <Icon className={`w-6 h-6 text-${color}-400`} />
          </div>
        </div>
        <p className="text-3xl font-bold text-white mb-1 tracking-tight">{value}</p>
        <p className="text-sm text-slate-400">{label}</p>
        {subValue && <p className="text-xs text-slate-500 mt-1">{subValue}</p>}
      </div>
    </div>
  );

  const renderOverview = () => (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 rounded-3xl p-8 shadow-2xl">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTRzLTItMi00LTJjMCAwLTIgMi0yIDRzMiA0IDIgNCAyLTIgMi00Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                <ClipboardCheck className="w-6 h-6 text-white" />
              </div>
              <span className="text-blue-100 text-sm font-medium uppercase tracking-wider">Quality Inspector</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Welcome, {user?.fullName || user?.username || 'Inspector'}! 🔍
            </h2>
            <p className="text-blue-100/80 text-lg">
              Inspector ID: <span className="font-mono bg-white/10 px-2 py-0.5 rounded">{String(user?.id || 'N/A')}</span>
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
              onClick={() => setActiveTab('pending')}
              className="flex items-center gap-2 px-5 py-3 bg-white text-blue-600 rounded-xl font-bold transition-all duration-300 hover:scale-105 hover:shadow-lg"
            >
              <Clock className="w-5 h-5" />
              View Pending
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard icon={Clock} label="Pending Inspections" value={pendingInspections.length} color="amber" onClick={() => setActiveTab('pending')} />
        <StatCard icon={CheckCircle} label="Approved Today" value={stats.today || 0} color="emerald" />
        <StatCard icon={Target} label="Total Approved" value={stats.approved || completedInspections.filter(i => i.status === 'approved').length} color="blue" />
        <StatCard icon={AlertCircle} label="Rejected" value={stats.rejected || completedInspections.filter(i => i.status === 'rejected').length} color="red" />
      </div>

      {/* Recent Pending */}
      {pendingInspections.length > 0 && (
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              Pending Inspections
            </h3>
            <button onClick={() => setActiveTab('pending')} className="text-amber-400 hover:text-amber-300 text-sm font-medium flex items-center gap-1">
              View All <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-3">
            {pendingInspections.slice(0, 3).map((harvest, idx) => (
              <div 
                key={harvest.id || idx}
                className="flex items-center justify-between p-4 bg-slate-800/50 hover:bg-slate-800 rounded-xl transition-all duration-300"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center border border-amber-500/20">
                    <Fish className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-white font-semibold">{harvest.harvest_code || `Harvest #${harvest.id}`}</p>
                    <p className="text-sm text-slate-400">{harvest.total_quantity_kg} kg • {harvest.species || 'Vannamei'}</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleStartInspection(harvest)}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl text-sm font-medium transition-all"
                >
                  Inspect
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Completed */}
      {completedInspections.length > 0 && (
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              Recent Inspections
            </h3>
            <button onClick={() => setActiveTab('completed')} className="text-emerald-400 hover:text-emerald-300 text-sm font-medium flex items-center gap-1">
              View All <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-3">
            {completedInspections.slice(0, 3).map((inspection, idx) => (
              <div 
                key={inspection.id || idx}
                className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    inspection.status === 'approved' 
                      ? 'bg-emerald-500/20 border border-emerald-500/20' 
                      : 'bg-red-500/20 border border-red-500/20'
                  }`}>
                    {inspection.status === 'approved' 
                      ? <CheckCircle className="w-5 h-5 text-emerald-400" />
                      : <AlertCircle className="w-5 h-5 text-red-400" />
                    }
                  </div>
                  <div>
                    <p className="text-white font-semibold">{inspection.harvest_code || `Inspection #${inspection.id}`}</p>
                    <p className="text-sm text-slate-400">
                      {inspection.inspection_date ? new Date(inspection.inspection_date).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getQualityColor(inspection.quality_score)}`}>
                    Grade {inspection.quality_score}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderPending = () => (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Pending Inspections</h2>
          <p className="text-slate-400">Harvests awaiting quality inspection</p>
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

      {pendingInspections.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-6">
          {pendingInspections.map((harvest, idx) => (
            <div 
              key={harvest.id || idx}
              className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 hover:border-amber-500/50 rounded-2xl p-6 transition-all duration-500 hover:shadow-2xl hover:shadow-amber-500/10"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20">
                    <Fish className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{harvest.harvest_code || `H-${harvest.id}`}</h3>
                    <p className="text-sm text-slate-400">{harvest.species || 'Vannamei'}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor('pending_inspection')}`}>
                  Pending
                </span>
              </div>

              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-slate-400 flex items-center gap-2"><MapPin className="w-4 h-4" /> Farm</span>
                  <span className="text-white">{harvest.farm_name || 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 flex items-center gap-2"><Waves className="w-4 h-4" /> Pond</span>
                  <span className="text-white">{harvest.pond_name || 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 flex items-center gap-2"><Scale className="w-4 h-4" /> Quantity</span>
                  <span className="text-white font-bold">{harvest.total_quantity_kg} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 flex items-center gap-2"><Calendar className="w-4 h-4" /> Harvest Date</span>
                  <span className="text-white">
                    {harvest.harvest_date ? new Date(harvest.harvest_date).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                {harvest.avg_body_weight_g && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Avg Weight</span>
                    <span className="text-white">{harvest.avg_body_weight_g}g</span>
                  </div>
                )}
              </div>

              <button 
                onClick={() => handleStartInspection(harvest)}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl font-bold transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/25 flex items-center justify-center gap-2"
              >
                <ClipboardCheck className="w-5 h-5" />
                Start Inspection
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-900/50 border border-slate-800 rounded-2xl">
          <CheckCircle className="w-20 h-20 text-emerald-500/50 mx-auto mb-6" />
          <h3 className="text-xl font-bold text-white mb-2">All Caught Up!</h3>
          <p className="text-slate-400">No pending inspections at the moment</p>
        </div>
      )}
    </div>
  );

  const renderCompleted = () => (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-2xl font-bold text-white">Inspection History</h2>
        <p className="text-slate-400">Your completed quality inspections</p>
      </div>

      {completedInspections.length > 0 ? (
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800/50">
                <tr>
                  <th className="text-left text-sm font-semibold text-slate-300 px-6 py-4">Harvest</th>
                  <th className="text-left text-sm font-semibold text-slate-300 px-6 py-4">Date</th>
                  <th className="text-left text-sm font-semibold text-slate-300 px-6 py-4">Grade</th>
                  <th className="text-left text-sm font-semibold text-slate-300 px-6 py-4">Quality</th>
                  <th className="text-left text-sm font-semibold text-slate-300 px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {completedInspections.map((inspection, idx) => (
                  <tr 
                    key={inspection.id || idx}
                    className="border-t border-slate-800 hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          inspection.status === 'approved' ? 'bg-emerald-500/20' : 'bg-red-500/20'
                        }`}>
                          {inspection.status === 'approved' 
                            ? <CheckCircle className="w-5 h-5 text-emerald-400" />
                            : <AlertCircle className="w-5 h-5 text-red-400" />
                          }
                        </div>
                        <div>
                          <p className="text-white font-medium">{inspection.harvest_code || `H-${inspection.harvest_id}`}</p>
                          <p className="text-xs text-slate-400">{inspection.species || 'Vannamei'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {inspection.inspection_date ? new Date(inspection.inspection_date).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-white font-medium">{inspection.grade || '-'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getQualityColor(inspection.quality_score)}`}>
                        {inspection.quality_score || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(inspection.status)}`}>
                        {inspection.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-900/50 border border-slate-800 rounded-2xl">
          <FileText className="w-20 h-20 text-slate-700 mx-auto mb-6" />
          <h3 className="text-xl font-bold text-white mb-2">No Inspection History</h3>
          <p className="text-slate-400">Complete your first inspection to see it here</p>
        </div>
      )}
    </div>
  );

  const inputClass = "w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all";
  const labelClass = "block text-sm font-medium text-slate-400 mb-2";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950">
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
            <div className="p-2.5 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl shadow-lg shadow-blue-500/25">
              <ClipboardCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Quality Inspector</h1>
              <p className="text-xs text-slate-400">Aquaculture Division</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <LanguageToggle />
            <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors relative">
              <Bell className="w-5 h-5 text-slate-400" />
              {pendingInspections.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full text-xs text-white flex items-center justify-center font-bold">
                  {pendingInspections.length}
                </span>
              )}
            </button>
            <div className="hidden sm:flex items-center gap-3 px-3 py-2 bg-slate-800/50 rounded-xl">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center">
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
                      ? 'bg-gradient-to-r from-blue-600/20 to-cyan-500/10 text-blue-400 border border-blue-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  {tab.label}
                  {tab.id === 'pending' && pendingInspections.length > 0 && (
                    <span className="ml-1 px-2 py-0.5 bg-amber-500 text-white text-xs rounded-full">
                      {pendingInspections.length}
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
        {activeTab === 'pending' && renderPending()}
        {activeTab === 'completed' && renderCompleted()}
      </main>

      {/* Inspection Modal */}
      {showInspectionModal && selectedHarvest && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div 
            className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl animate-slideUp"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-gradient-to-r from-blue-600/10 to-transparent">
              <div className="flex items-center gap-3">
                <ClipboardCheck className="w-6 h-6 text-blue-400" />
                <div>
                  <h3 className="text-xl font-bold text-white">Quality Inspection</h3>
                  <p className="text-sm text-slate-400">{selectedHarvest.harvest_code || `Harvest #${selectedHarvest.id}`}</p>
                </div>
              </div>
              <button onClick={() => setShowInspectionModal(false)} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmitInspection} className="p-6 overflow-y-auto max-h-[calc(90vh-180px)] space-y-6">
              {/* Harvest Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-800/50 rounded-xl">
                <div>
                  <p className="text-xs text-slate-400">Quantity</p>
                  <p className="text-white font-bold">{selectedHarvest.total_quantity_kg} kg</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Species</p>
                  <p className="text-white font-bold">{selectedHarvest.species || 'Vannamei'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Harvest Date</p>
                  <p className="text-white font-bold">
                    {selectedHarvest.harvest_date ? new Date(selectedHarvest.harvest_date).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Method</p>
                  <p className="text-white font-bold capitalize">{selectedHarvest.method?.replace('_', ' ') || 'N/A'}</p>
                </div>
              </div>

              {/* Water Parameters */}
              <div>
                <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <Thermometer className="w-4 h-4 text-cyan-400" />
                  Water Parameters
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className={labelClass}>Temperature (°C)</label>
                    <input 
                      type="number" 
                      step="0.1"
                      value={inspectionForm.water_temp_c} 
                      onChange={e => setInspectionForm({ ...inspectionForm, water_temp_c: e.target.value })} 
                      className={inputClass} 
                      placeholder="28.5" 
                    />
                  </div>
                  <div>
                    <label className={labelClass}>pH Level</label>
                    <input 
                      type="number" 
                      step="0.1"
                      value={inspectionForm.ph_level} 
                      onChange={e => setInspectionForm({ ...inspectionForm, ph_level: e.target.value })} 
                      className={inputClass} 
                      placeholder="7.8" 
                    />
                  </div>
                  <div>
                    <label className={labelClass}>DO (mg/L)</label>
                    <input 
                      type="number" 
                      step="0.1"
                      value={inspectionForm.dissolved_oxygen} 
                      onChange={e => setInspectionForm({ ...inspectionForm, dissolved_oxygen: e.target.value })} 
                      className={inputClass} 
                      placeholder="6.5" 
                    />
                  </div>
                </div>
              </div>

              {/* Quality Assessment */}
              <div>
                <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  Quality Assessment
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Avg Weight (g) *</label>
                    <input 
                      type="number" 
                      value={inspectionForm.avg_weight_g} 
                      onChange={e => setInspectionForm({ ...inspectionForm, avg_weight_g: e.target.value })} 
                      className={inputClass} 
                      placeholder="32"
                      required
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Grade *</label>
                    <select 
                      value={inspectionForm.grade} 
                      onChange={e => setInspectionForm({ ...inspectionForm, grade: e.target.value })} 
                      className={inputClass}
                      required
                    >
                      <option value="">Select Grade</option>
                      {gradeOptions.map(grade => (
                        <option key={grade} value={grade}>{grade}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Quality Score *</label>
                    <select 
                      value={inspectionForm.quality_score} 
                      onChange={e => setInspectionForm({ ...inspectionForm, quality_score: e.target.value })} 
                      className={inputClass}
                      required
                    >
                      <option value="">Select Quality</option>
                      {qualityOptions.map(q => (
                        <option key={q} value={q}>{q}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Freshness Score (1-10)</label>
                    <input 
                      type="number" 
                      min="1" 
                      max="10"
                      value={inspectionForm.freshness_score} 
                      onChange={e => setInspectionForm({ ...inspectionForm, freshness_score: parseInt(e.target.value) })} 
                      className={inputClass} 
                    />
                  </div>
                </div>
              </div>

              {/* Decision */}
              <div>
                <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  Inspection Decision
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setInspectionForm({ ...inspectionForm, decision: 'approve' })}
                    className={`p-4 rounded-xl border-2 transition-all flex items-center justify-center gap-3 ${
                      inspectionForm.decision === 'approve'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                        : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <CheckCircle className="w-6 h-6" />
                    <span className="font-bold">Approve</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setInspectionForm({ ...inspectionForm, decision: 'reject' })}
                    className={`p-4 rounded-xl border-2 transition-all flex items-center justify-center gap-3 ${
                      inspectionForm.decision === 'reject'
                        ? 'bg-red-500/20 border-red-500 text-red-400'
                        : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <AlertCircle className="w-6 h-6" />
                    <span className="font-bold">Reject</span>
                  </button>
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className={labelClass}>Remarks / Notes</label>
                <textarea 
                  value={inspectionForm.remarks} 
                  onChange={e => setInspectionForm({ ...inspectionForm, remarks: e.target.value })} 
                  className={inputClass} 
                  rows={3}
                  placeholder="Additional observations or notes..."
                />
              </div>

              {/* Submit Button */}
              <button 
                type="submit"
                disabled={submitting}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                  inspectionForm.decision === 'approve'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white hover:shadow-lg hover:shadow-emerald-500/25'
                    : 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white hover:shadow-lg hover:shadow-red-500/25'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    {inspectionForm.decision === 'approve' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    {inspectionForm.decision === 'approve' ? 'Approve Harvest' : 'Reject Harvest'}
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

export default AquaInspectorDashboard;
