import React, { useState } from 'react';
import { User, Mail, Phone, MapPin, Shield, Edit2, Camera, Check, X, Calendar, Award, Briefcase } from 'lucide-react';

const UserProfileCard = ({ user, onUpdate, compact = false }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || user?.mobile_number || '',
    address: user?.address || ''
  });

  const getRoleBadge = (role) => {
    const badges = {
      admin: { color: 'bg-purple-500', label: 'Administrator' },
      captain: { color: 'bg-blue-500', label: 'Captain' },
      worker: { color: 'bg-green-500', label: 'Quality Inspector' },
      inspector: { color: 'bg-amber-500', label: 'Field Inspector' },
      fisher: { color: 'bg-cyan-500', label: 'Registered Fisher' },
      vessel_owner: { color: 'bg-indigo-500', label: 'Vessel Owner' }
    };
    return badges[role] || { color: 'bg-slate-500', label: role };
  };

  const badge = getRoleBadge(user?.role);

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl border border-slate-700">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold text-sm shadow-lg">
          {getInitials(user?.full_name || user?.username)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-white truncate">{user?.full_name || user?.username}</p>
          <p className="text-xs text-slate-400">{badge.label}</p>
        </div>
        <span className={`${badge.color} px-2 py-1 rounded-full text-[10px] font-bold text-white uppercase`}>
          {user?.role}
        </span>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl border border-slate-700 overflow-hidden shadow-2xl">
      {/* Header with gradient */}
      <div className="relative h-24 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50"></div>
        
        {/* Edit button */}
        {onUpdate && (
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className="absolute top-3 right-3 p-2 bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/20 transition-colors"
          >
            {isEditing ? <X className="w-4 h-4 text-white" /> : <Edit2 className="w-4 h-4 text-white" />}
          </button>
        )}
      </div>

      {/* Avatar overlapping header */}
      <div className="relative px-6 pb-6">
        <div className="-mt-12 mb-4 relative inline-block">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-400 flex items-center justify-center text-white text-3xl font-bold shadow-xl border-4 border-slate-900">
            {getInitials(user?.full_name || user?.username)}
          </div>
          <div className={`absolute -bottom-1 -right-1 w-6 h-6 ${badge.color} rounded-full border-2 border-slate-900 flex items-center justify-center`}>
            <Shield className="w-3 h-3 text-white" />
          </div>
        </div>

        {/* User info */}
        <div className="space-y-1 mb-6">
          <h2 className="text-2xl font-bold text-white">{user?.full_name || user?.username}</h2>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`${badge.color} px-3 py-1 rounded-full text-xs font-bold text-white uppercase tracking-wide`}>
              {badge.label}
            </span>
            {user?.vessel_name && (
              <span className="bg-slate-700 px-3 py-1 rounded-full text-xs text-slate-300 flex items-center gap-1">
                <Briefcase className="w-3 h-3" /> {user.vessel_name}
              </span>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-slate-800/50 rounded-xl p-3 text-center border border-slate-700">
            <p className="text-2xl font-bold text-white">@{user?.username || 'user'}</p>
            <p className="text-xs text-slate-400">Username</p>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-3 text-center border border-slate-700">
            <p className="text-2xl font-bold text-emerald-400">●</p>
            <p className="text-xs text-slate-400">Active</p>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-3 text-center border border-slate-700">
            <p className="text-lg font-bold text-white">{formatDate(user?.created_at)}</p>
            <p className="text-xs text-slate-400">Joined</p>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-3">
          {user?.email && (
            <div className="flex items-center gap-3 text-slate-300">
              <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center">
                <Mail className="w-4 h-4 text-blue-400" />
              </div>
              <span className="text-sm">{user.email}</span>
            </div>
          )}
          {(user?.phone || user?.mobile_number) && (
            <div className="flex items-center gap-3 text-slate-300">
              <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center">
                <Phone className="w-4 h-4 text-green-400" />
              </div>
              <span className="text-sm">{user.phone || user.mobile_number}</span>
            </div>
          )}
          {user?.home_port && (
            <div className="flex items-center gap-3 text-slate-300">
              <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center">
                <MapPin className="w-4 h-4 text-amber-400" />
              </div>
              <span className="text-sm">{user.home_port}</span>
            </div>
          )}
          {user?.address && (
            <div className="flex items-center gap-3 text-slate-300">
              <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center">
                <MapPin className="w-4 h-4 text-rose-400" />
              </div>
              <span className="text-sm">{user.address}</span>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-6 pt-6 border-t border-slate-700 flex gap-3">
          <button className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2">
            <Award className="w-4 h-4" />
            View Achievements
          </button>
          <button className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2">
            <Calendar className="w-4 h-4" />
            Activity Log
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfileCard;
