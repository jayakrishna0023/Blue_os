import React from 'react';
import { User, Mail, Phone, MapPin, Shield, Calendar, Ship, Anchor } from 'lucide-react';

const UserProfileCard = ({ user, compact = false }) => {
  const getRoleInfo = (role) => {
    const roles = {
      admin: { label: 'Administrator', icon: Shield },
      captain: { label: 'Captain', icon: Anchor },
      worker: { label: 'Quality Inspector', icon: User },
      inspector: { label: 'Field Inspector', icon: User },
      fisher: { label: 'Registered Fisher', icon: User },
      vessel_owner: { label: 'Vessel Owner', icon: Ship }
    };
    return roles[role] || { label: role || 'User', icon: User };
  };

  const roleInfo = getRoleInfo(user?.role);
  const RoleIcon = roleInfo.icon;

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200">
        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-semibold text-sm">
          {getInitials(user?.full_name || user?.username)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-slate-800 truncate">{user?.full_name || user?.username}</p>
          <p className="text-xs text-slate-500">{roleInfo.label}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-slate-800">My Profile</h1>
        <p className="text-sm text-slate-500">Account details and information</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
              <span className="text-2xl font-semibold text-slate-600">
                {getInitials(user?.full_name || user?.username)}
              </span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800">
                {user?.full_name || user?.username || 'User'}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-medium">
                  <RoleIcon className="w-3 h-3" />
                  {roleInfo.label}
                </span>
                {user?.vessel_name && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs font-medium">
                    <Ship className="w-3 h-3" />
                    {user.vessel_name}
                  </span>
                )}
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

            {(user?.phone || user?.mobile_number || user?.contact_number) && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                  <Phone className="w-4 h-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Phone</p>
                  <p className="text-sm font-medium text-slate-700">
                    {user.phone || user.mobile_number || user.contact_number}
                  </p>
                </div>
              </div>
            )}

            {user?.home_port && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                  <Anchor className="w-4 h-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Home Port</p>
                  <p className="text-sm font-medium text-slate-700">{user.home_port}</p>
                </div>
              </div>
            )}

            {user?.address && (
              <div className="flex items-center gap-3 sm:col-span-2">
                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Address</p>
                  <p className="text-sm font-medium text-slate-700">{user.address}</p>
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

      {/* Status Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium text-slate-700">Account Status</span>
          </div>
          <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-xs font-medium">
            Active
          </span>
        </div>
      </div>
    </div>
  );
};

export default UserProfileCard;
