import React, { useState, useEffect } from 'react';
import { mainAPI } from '../../services/api';
import { generateTripCode, getCurrentUser } from '../../services/utils';
import { Ship, Calendar, MapPin, Users, Fuel, Snowflake, DollarSign, AlertCircle, Camera, Fish } from 'lucide-react';

const TripRegistration = ({ onTripCreated, existingTrip }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    tripCode: '',
    fishingMethod: 'Trawling',
    departurePort: 'Chennai',
    tripStart: new Date().toISOString().slice(0, 16),
    expectedReturn: '',
    crewMembers: '',
    fuelLiters: '',
    fuelPrice: '',
    iceKg: '',
    icePrice: '',
    foodBudget: '',
    otherExpenses: '',
    targetSpecies: '',
    vesselImage: null,
    gearImage: null
  });

  useEffect(() => {
    if (existingTrip) {
      setFormData(prev => ({ ...prev, ...existingTrip }));
    } else {
      generateTripCode().then(code => {
        setFormData(prev => ({ ...prev, tripCode: code }));
      });
    }
  }, [existingTrip]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, [name]: reader.result }));
      };
      reader.readAsDataURL(files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const user = getCurrentUser();
      
      const totalExpenses = (
        (parseFloat(formData.fuelLiters || 0) * parseFloat(formData.fuelPrice || 0)) +
        (parseFloat(formData.iceKg || 0) * parseFloat(formData.icePrice || 0)) +
        parseFloat(formData.foodBudget || 0) +
        parseFloat(formData.otherExpenses || 0)
      ).toFixed(2);

      const tripData = {
        ...formData,
        totalExpenses,
        vesselName: user?.vesselName || 'Unknown Vessel',
        vesselId: user?.vessel_id,
        vesselOwnerId: user?.owner_id
      };

      const response = await mainAPI.saveTrip(tripData);
      if (response.success) {
        onTripCreated({ ...tripData, id: response.tripId });
      } else {
        setError(response.message || 'Failed to save trip');
      }
    } catch (err) {
      console.error(err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (existingTrip) {
    return (
      <div className="glass-card p-6 text-center">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Ship className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Trip in Progress</h2>
        <p className="text-slate-500 mb-6">You have an active trip. Go to the Catch Log tab to record species.</p>
        <div className="grid grid-cols-2 gap-4 text-left max-w-md mx-auto bg-slate-50 p-4 rounded-xl">
          <div>
            <p className="text-xs text-slate-400">Trip Code</p>
            <p className="font-mono font-medium">{existingTrip.tripCode}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Start Date</p>
            <p className="font-medium">{new Date(existingTrip.tripStart).toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="glass-card p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-ocean-100 p-3 rounded-xl">
            <Ship className="w-6 h-6 text-ocean-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">New Trip Registration</h2>
            <p className="text-sm text-slate-500">Enter details before departure</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-2 text-sm">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Trip Code (Read Only) */}
            <div className="col-span-full">
              <label className="block text-sm font-medium text-slate-700 mb-1">Trip Code</label>
              <div className="relative">
                <input
                  type="text"
                  name="tripCode"
                  value={formData.tripCode}
                  readOnly
                  className="input-field bg-slate-100 font-mono text-slate-500"
                />
              </div>
            </div>

            {/* Fishing Method */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fishing Method</label>
              <select
                name="fishingMethod"
                value={formData.fishingMethod}
                onChange={handleChange}
                className="input-field"
              >
                <option value="Trawling">Trawling</option>
                <option value="Gillnetting">Gillnetting</option>
                <option value="Longlining">Longlining</option>
                <option value="Purse Seining">Purse Seining</option>
              </select>
            </div>

            {/* Target Species */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Target Species</label>
              <div className="relative">
                <Fish className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  name="targetSpecies"
                  value={formData.targetSpecies}
                  onChange={handleChange}
                  className="input-field pl-10"
                  placeholder="e.g. Tuna, Shrimp"
                />
              </div>
            </div>

            {/* Departure Port */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Departure Port</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                <select
                  name="departurePort"
                  value={formData.departurePort}
                  onChange={handleChange}
                  className="input-field pl-10"
                >
                  <option value="Chennai">Chennai</option>
                  <option value="Nagapattinam">Nagapattinam</option>
                  <option value="Thuthookudi">Thuthookudi</option>
                  <option value="Ramanathapuram">Ramanathapuram</option>
                  <option value="Kanyakumari">Kanyakumari</option>
                </select>
              </div>
            </div>

            {/* Dates */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Departure Time</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                <input
                  type="datetime-local"
                  name="tripStart"
                  value={formData.tripStart}
                  onChange={handleChange}
                  className="input-field pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Expected Return</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                <input
                  type="datetime-local"
                  name="expectedReturn"
                  value={formData.expectedReturn}
                  onChange={handleChange}
                  className="input-field pl-10"
                  required
                />
              </div>
            </div>

            {/* Resources */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Crew Members</label>
              <div className="relative">
                <Users className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                <input
                  type="number"
                  name="crewMembers"
                  value={formData.crewMembers}
                  onChange={handleChange}
                  className="input-field pl-10"
                  placeholder="Count"
                  required
                />
              </div>
            </div>

            {/* Fuel */}
            <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Fuel (Liters)</label>
                  <div className="relative">
                    <Fuel className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                    <input
                      type="number"
                      name="fuelLiters"
                      value={formData.fuelLiters}
                      onChange={handleChange}
                      className="input-field pl-10"
                      placeholder="Qty"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Price/L</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                    <input
                      type="number"
                      name="fuelPrice"
                      value={formData.fuelPrice}
                      onChange={handleChange}
                      className="input-field pl-10"
                      placeholder="₹"
                    />
                  </div>
                </div>
            </div>

            {/* Ice */}
            <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ice (Kg)</label>
                  <div className="relative">
                    <Snowflake className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                    <input
                      type="number"
                      name="iceKg"
                      value={formData.iceKg}
                      onChange={handleChange}
                      className="input-field pl-10"
                      placeholder="Qty"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Price/Kg</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                    <input
                      type="number"
                      name="icePrice"
                      value={formData.icePrice}
                      onChange={handleChange}
                      className="input-field pl-10"
                      placeholder="₹"
                    />
                  </div>
                </div>
            </div>

            {/* Expenses */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Food Budget (₹)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                <input
                  type="number"
                  name="foodBudget"
                  value={formData.foodBudget}
                  onChange={handleChange}
                  className="input-field pl-10"
                  placeholder="0"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Other Expenses (₹)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                <input
                  type="number"
                  name="otherExpenses"
                  value={formData.otherExpenses}
                  onChange={handleChange}
                  className="input-field pl-10"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Images */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Vessel Image</label>
              <div className="relative">
                <Camera className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                <input
                  type="file"
                  name="vesselImage"
                  onChange={handleFileChange}
                  accept="image/*"
                  className="input-field pl-10 pt-2"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Gear Image</label>
              <div className="relative">
                <Camera className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                <input
                  type="file"
                  name="gearImage"
                  onChange={handleFileChange}
                  accept="image/*"
                  className="input-field pl-10 pt-2"
                />
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center gap-2"
            >
              {loading ? 'Starting Trip...' : 'Start Trip'}
              {!loading && <Ship className="w-5 h-5" />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TripRegistration;
