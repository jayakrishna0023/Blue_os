import React, { useState, useEffect } from 'react';
import { getCurrentUser } from '../../../shared/services/utils';
import { mainAPI } from '../../../shared/services/api';
import { useToast } from '../../../shared/components/Shared/Toast';
import { 
  Clock, Package, User, Mail, Phone, 
  Building2, Calendar, Shield, RefreshCw, Fish, Clipboard, Activity
} from 'lucide-react';

const WorkerProfile = () => {
  const toast = useToast();
  const user = getCurrentUser();
  const [stats, setStats] = useState({ inspected: 0, approved: 0, cratesPacked: 0 });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    
    try {
      const response = await mainAPI.getWorkerStats(user.id);
      if (response.success) {
        setStats(response.stats);
        
        const catches = (response.recentActivity?.catches || []).map(c => ({
          type: 'inspection',
          detail: c.species_name || c.qr_code,
          qrCode: c.qr_code,
          time: c.inspected_at || c.created_at
        }));
        const crates = (response.recentActivity?.crates || []).map(c => ({
          type: 'crate',
          detail: c.crate_qr,
          qrCode: c.crate_qr,
          time: c.created_at
        }));
        
        const combined = [...catches, ...crates]
          .sort((a, b) => new Date(b.time) - new Date(a.time))
          .slice(0, 5);
        
        setRecentActivity(combined);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    toast.success('Stats refreshed!', 'Updated');
    setRefreshing(false);
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-10 h-10 border-3 border-slate-200 border-t-slate-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">My Profile</h1>
          <p className="text-sm text-slate-500">Account details and work stats</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
              <span className="text-2xl font-semibold text-slate-600">
                {(user?.full_name || user?.username || 'W').charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800">
                {user?.full_name || user?.username || 'Worker'}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-medium">
                  <Shield className="w-3 h-3" />
                  {user?.role === 'worker' ? 'Quality Inspector' : user?.role || 'Worker'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {user?.username && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                  <User className="w-4 h-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Username</p>
                  <p className="text-sm font-medium text-slate-700">{user.username}</p>
                </div>
              </div>
            )}

            {user?.email && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                  <Mail className="w-4 h-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Email</p>
                  <p className="text-sm font-medium text-slate-700 truncate">{user.email}</p>
                </div>
              </div>
            )}

            {user?.contact_number && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                  <Phone className="w-4 h-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Phone</p>
                  <p className="text-sm font-medium text-slate-700">{user.contact_number}</p>
                </div>
              </div>
            )}

            {user?.vessel_name && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Assigned Vessel</p>
                  <p className="text-sm font-medium text-slate-700">{user.vessel_name}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-4 h-4 text-slate-500" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Member Since</p>
                <p className="text-sm font-medium text-slate-700">
                  {user?.created_at 
                    ? new Date(user.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
                    : 'N/A'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Fish className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-800">{stats.inspected}</p>
          <p className="text-xs text-slate-500 mt-1">Fish Inspected</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <Clipboard className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-800">{stats.approved}</p>
          <p className="text-xs text-slate-500 mt-1">Trips Approved</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-800">{stats.cratesPacked}</p>
          <p className="text-xs text-slate-500 mt-1">Crates Packed</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <Activity className="w-4 h-4 text-slate-400" />
            Recent Activity
          </h3>
        </div>
        
        <div className="divide-y divide-slate-100">
          {recentActivity.length > 0 ? (
            recentActivity.map((item, idx) => (
              <div key={idx} className="px-6 py-3 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  item.type === 'inspection' ? 'bg-blue-50' : 'bg-amber-50'
                }`}>
                  {item.type === 'inspection' 
                    ? <Fish className="w-4 h-4 text-blue-600" />
                    : <Package className="w-4 h-4 text-amber-600" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700">
                    {item.type === 'inspection' ? 'Inspected fish' : 'Packed crate'}
                  </p>
                  <p className="text-xs text-slate-400 font-mono truncate">{item.detail}</p>
                </div>
                <span className="text-xs text-slate-400">{formatTimeAgo(item.time)}</span>
              </div>
            ))
          ) : (
            <div className="px-6 py-8 text-center">
              <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No recent activity</p>
              <p className="text-xs text-slate-400 mt-1">Start working to see your activity here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkerProfile;
