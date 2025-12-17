import React, { useState, useEffect } from 'react';
import { getCurrentUser } from '../../services/utils';
import { mainAPI } from '../../services/api';
import { useToast } from '../Shared/Toast';
import { 
  CheckCircle, Clock, Package, TrendingUp, User, Mail, Phone, 
  Building2, Calendar, Shield, RefreshCw, Fish, Clipboard
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
        
        // Combine and sort recent activity
        const catches = (response.recentActivity?.catches || []).map(c => ({
          type: 'inspection',
          detail: c.species_name || c.qr_code,
          qrCode: c.qr_code,
          time: c.created_at
        }));
        const crates = (response.recentActivity?.crates || []).map(c => ({
          type: 'crate',
          detail: c.crate_qr,
          qrCode: c.crate_qr,
          time: c.created_at
        }));
        
        const combined = [...catches, ...crates]
          .sort((a, b) => new Date(b.time) - new Date(a.time))
          .slice(0, 6);
        
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
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
          <p className="text-slate-500">View your account details and performance stats</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Profile Header */}
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-6 text-center">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 ring-4 ring-white/30">
                <span className="text-3xl font-bold text-white">
                  {(user?.full_name || user?.username || 'W').charAt(0).toUpperCase()}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white">{user?.full_name || user?.username || 'Worker'}</h2>
              <p className="text-blue-100 text-sm mt-1 flex items-center justify-center gap-1">
                <Shield className="w-4 h-4" />
                {user?.role === 'worker' ? 'Quality Inspector' : user?.role || 'Worker'}
              </p>
            </div>

            {/* Profile Details */}
            <div className="p-5 space-y-4">
              {user?.username && (
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500">Username</p>
                    <p className="font-medium text-slate-800 truncate">{user.username}</p>
                  </div>
                </div>
              )}

              {user?.email && (
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Mail className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500">Email</p>
                    <p className="font-medium text-slate-800 truncate">{user.email}</p>
                  </div>
                </div>
              )}

              {user?.contact_number && (
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center">
                    <Phone className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500">Phone</p>
                    <p className="font-medium text-slate-800">{user.contact_number}</p>
                  </div>
                </div>
              )}

              {user?.vessel_name && (
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500">Assigned Vessel</p>
                    <p className="font-medium text-slate-800">{user.vessel_name}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <div className="w-9 h-9 bg-slate-200 rounded-lg flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-slate-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-500">Member Since</p>
                  <p className="font-medium text-slate-800">
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

        {/* Stats & Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Performance Stats */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              Performance Overview
            </h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-5 text-center border border-blue-100">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-500/20">
                  <Fish className="w-6 h-6 text-white" />
                </div>
                <p className="text-3xl font-bold text-blue-700">{stats.inspected}</p>
                <p className="text-sm text-blue-600 font-medium mt-1">Fish Inspected</p>
              </div>

              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl p-5 text-center border border-emerald-100">
                <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-500/20">
                  <Clipboard className="w-6 h-6 text-white" />
                </div>
                <p className="text-3xl font-bold text-emerald-700">{stats.approved}</p>
                <p className="text-sm text-emerald-600 font-medium mt-1">Trips Approved</p>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-xl p-5 text-center border border-amber-100">
                <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-amber-500/20">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <p className="text-3xl font-bold text-amber-700">{stats.cratesPacked}</p>
                <p className="text-sm text-amber-600 font-medium mt-1">Crates Packed</p>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-slate-400" />
              Recent Activity
            </h3>
            
            {recentActivity.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      item.type === 'inspection' 
                        ? 'bg-blue-100' 
                        : 'bg-amber-100'
                    }`}>
                      {item.type === 'inspection' 
                        ? <Fish className="w-5 h-5 text-blue-600" />
                        : <Package className="w-5 h-5 text-amber-600" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700">
                        {item.type === 'inspection' ? 'Inspected fish' : 'Packed crate'}
                      </p>
                      <p className="text-xs text-slate-500 font-mono truncate">{item.detail}</p>
                    </div>
                    <span className="text-xs text-slate-400 whitespace-nowrap">{formatTimeAgo(item.time)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400">
                <Clock className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No recent activity</p>
                <p className="text-xs mt-1">Start inspecting fish or packing crates to see your activity here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkerProfile;
