import React from 'react';
import { getCurrentUser } from '../../services/utils';
import UserProfileCard from '../Shared/UserProfileCard';
import { CheckCircle, Clock, Package, TrendingUp } from 'lucide-react';

const WorkerProfile = () => {
  const user = getCurrentUser();

  // Mock stats - in real app, fetch from API
  const stats = {
    inspected: 156,
    approved: 142,
    cratesPacked: 45,
    avgTime: '2.5 min'
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
          <p className="text-slate-500">Manage your account and view your stats</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <UserProfileCard user={user} />
        </div>

        {/* Stats & Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Performance Stats */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Performance Overview</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <p className="text-2xl font-bold text-blue-700">{stats.inspected}</p>
                <p className="text-xs text-blue-600 font-medium">Fish Inspected</p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 text-center">
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <p className="text-2xl font-bold text-green-700">{stats.approved}</p>
                <p className="text-xs text-green-600 font-medium">Trips Approved</p>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 text-center">
                <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <p className="text-2xl font-bold text-amber-700">{stats.cratesPacked}</p>
                <p className="text-xs text-amber-600 font-medium">Crates Packed</p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 text-center">
                <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <p className="text-2xl font-bold text-purple-700">{stats.avgTime}</p>
                <p className="text-xs text-purple-600 font-medium">Avg. Inspection</p>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Recent Activity</h3>
            
            <div className="space-y-4">
              {[
                { action: 'Approved trip', detail: 'TRIP_20251212_414953', time: '2 hours ago', type: 'success' },
                { action: 'Packed crate', detail: 'CRATE-1765558947620-937', time: '3 hours ago', type: 'info' },
                { action: 'Inspected fish', detail: 'FISH-IND-CHN-2025-000012', time: '4 hours ago', type: 'default' },
                { action: 'Started shift', detail: 'Morning shift', time: '6 hours ago', type: 'default' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
                  <div className={`w-2 h-2 rounded-full ${
                    item.type === 'success' ? 'bg-green-500' : 
                    item.type === 'info' ? 'bg-blue-500' : 'bg-slate-400'
                  }`}></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-700">{item.action}</p>
                    <p className="text-xs text-slate-500 font-mono">{item.detail}</p>
                  </div>
                  <span className="text-xs text-slate-400">{item.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkerProfile;
