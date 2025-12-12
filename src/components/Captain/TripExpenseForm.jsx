import React, { useState } from 'react';
import { DollarSign, Fuel, Snowflake, Save, X, AlertCircle } from 'lucide-react';
import { mainAPI } from '../../services/api';

const TripExpenseForm = ({ trip, onClose, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    fuelLiters: trip.fuelLiters || trip.fuel_liters || '',
    fuelPrice: trip.fuelPrice || trip.fuel_price || '',
    iceKg: trip.iceKg || trip.ice_kg || '',
    icePrice: trip.icePrice || trip.ice_price || '',
    foodBudget: trip.foodBudget || trip.food_budget || '',
    otherExpenses: trip.otherExpenses || trip.other_expenses || ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const totalExpenses = (
        (parseFloat(formData.fuelLiters || 0) * parseFloat(formData.fuelPrice || 0)) +
        (parseFloat(formData.iceKg || 0) * parseFloat(formData.icePrice || 0)) +
        parseFloat(formData.foodBudget || 0) +
        parseFloat(formData.otherExpenses || 0)
      ).toFixed(2);

      const updateData = {
        tripId: trip.id,
        ...formData,
        totalExpenses
      };

      const response = await mainAPI.updateTripExpenses(updateData);
      if (response.success) {
        onUpdate(updateData);
        onClose();
      } else {
        setError(response.message || 'Failed to update expenses');
      }
    } catch (err) {
      console.error(err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-scale-up">
        <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50">
          <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            Trip Expenses
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-2 text-sm">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Fuel */}
            <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Fuel className="w-4 h-4" /> Fuel Costs
                </h4>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Quantity (Liters)</label>
                        <input
                            type="number"
                            name="fuelLiters"
                            value={formData.fuelLiters}
                            onChange={handleChange}
                            className="input-field"
                            placeholder="0"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Price per Liter</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-slate-400">₹</span>
                            <input
                                type="number"
                                name="fuelPrice"
                                value={formData.fuelPrice}
                                onChange={handleChange}
                                className="input-field pl-8"
                                placeholder="0.00"
                                required
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Ice */}
            <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Snowflake className="w-4 h-4" /> Ice Costs
                </h4>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Quantity (Kg)</label>
                        <input
                            type="number"
                            name="iceKg"
                            value={formData.iceKg}
                            onChange={handleChange}
                            className="input-field"
                            placeholder="0"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Price per Kg</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-slate-400">₹</span>
                            <input
                                type="number"
                                name="icePrice"
                                value={formData.icePrice}
                                onChange={handleChange}
                                className="input-field pl-8"
                                placeholder="0.00"
                                required
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Other */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Food Budget</label>
                    <div className="relative">
                        <span className="absolute left-3 top-2.5 text-slate-400">₹</span>
                        <input
                            type="number"
                            name="foodBudget"
                            value={formData.foodBudget}
                            onChange={handleChange}
                            className="input-field pl-8"
                            placeholder="0.00"
                            required
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Other Expenses</label>
                    <div className="relative">
                        <span className="absolute left-3 top-2.5 text-slate-400">₹</span>
                        <input
                            type="number"
                            name="otherExpenses"
                            value={formData.otherExpenses}
                            onChange={handleChange}
                            className="input-field pl-8"
                            placeholder="0.00"
                        />
                    </div>
                </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-green-500/25 flex items-center justify-center gap-2"
            >
              {loading ? 'Updating...' : (
                <>
                  <Save className="w-5 h-5" />
                  Update Expenses
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TripExpenseForm;