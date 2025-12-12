import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { User, Phone, MapPin, Home, Heart, AlertCircle, Save } from 'lucide-react';

const FisherRegistration = ({ mobile, onComplete }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    fathersName: '',
    mobile: mobile,
    homePort: '',
    address: '',
    emergencyName: '',
    emergencyNumber: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authAPI.registerFisher(formData);
      if (response.success) {
        if (onComplete) onComplete();
        else navigate('/fisher');
      } else {
        setError(response.message || 'Registration failed');
      }
    } catch (err) {
      setError('Network error during registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-2xl shadow-xl">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Fisher Registration</h2>
      
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 flex items-center gap-2 text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
          <div className="relative">
            <User className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className="input-field pl-10"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Father's Name</label>
          <div className="relative">
            <User className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
            <input
              type="text"
              name="fathersName"
              value={formData.fathersName}
              onChange={handleChange}
              className="input-field pl-10"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Mobile Number</label>
          <div className="relative">
            <Phone className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
            <input
              type="text"
              name="mobile"
              value={formData.mobile}
              readOnly
              className="input-field pl-10 bg-slate-100 text-slate-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Home Port</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
            <input
              type="text"
              name="homePort"
              value={formData.homePort}
              onChange={handleChange}
              className="input-field pl-10"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Permanent Address</label>
          <div className="relative">
            <Home className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="input-field pl-10 py-2"
              rows="2"
              required
            />
          </div>
        </div>

        <div className="border-t border-slate-200 pt-4 mt-4">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Emergency Contact</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Contact Name</label>
              <div className="relative">
                <Heart className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  name="emergencyName"
                  value={formData.emergencyName}
                  onChange={handleChange}
                  className="input-field pl-10"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Contact Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input
                  type="tel"
                  name="emergencyNumber"
                  value={formData.emergencyNumber}
                  onChange={handleChange}
                  className="input-field pl-10"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 mt-6"
        >
          {loading ? 'Creating Profile...' : (
            <>
              <Save className="w-5 h-5" />
              Create Profile
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default FisherRegistration;
