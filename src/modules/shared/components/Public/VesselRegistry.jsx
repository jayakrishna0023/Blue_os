import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mainAPI } from '../../../shared/services/api';
import { fileToBase64 } from '../../../shared/services/utils';
import { Ship, User, FileText, Upload, CheckCircle, ArrowLeft, AlertCircle, Waves } from 'lucide-react';

const VesselRegistry = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    // Owner Details
    ownerName: '',
    contactNumber: '',
    emailAddress: '',
    address: '',
    idProof: null,
    
    // Vessel Details
    vesselName: '',
    registrationNumber: '',
    vesselType: '',
    homePort: '',
    licenseNumber: '',
    crewCapacity: '',
    storageCapacity: '',
    enginePower: '',
    fuelType: '',
    vesselDocuments: []
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (e) => {
    const { name, files } = e.target;
    if (name === 'idProof') {
      const file = files[0];
      if (file) {
        const base64 = await fileToBase64(file);
        setFormData(prev => ({ 
          ...prev, 
          idProof: { data: base64, meta: JSON.stringify({ name: file.name, type: file.type }) } 
        }));
      }
    } else if (name === 'vesselDocuments') {
      const newDocs = [];
      for (const file of files) {
        const base64 = await fileToBase64(file);
        newDocs.push({ data: base64, name: file.name, type: file.type });
      }
      setFormData(prev => ({ ...prev, vesselDocuments: [...prev.vesselDocuments, ...newDocs] }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Generate IDs locally for submission (backend should verify/finalize)
      const timestamp = Date.now().toString().slice(-5);
      const submissionData = {
        ...formData,
        ownerId: `NA${timestamp}`,
        vesselId: `NAD${timestamp}`,
        linkedOwnerId: `NA${timestamp}`
      };

      const response = await mainAPI.submitVesselRegistration(submissionData);
      
      if (response.success) {
        setSuccess(true);
      } else {
        setError(response.message || 'Registration failed');
      }
    } catch (err) {
      console.error(err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px]"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-teal-600/10 rounded-full blur-[120px]"></div>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 max-w-md w-full p-8 text-center rounded-3xl shadow-2xl relative z-10">
          <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/30">
            <CheckCircle className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Registration Submitted!</h2>
          <p className="text-slate-400 mb-8">
            Your vessel registration has been submitted successfully. An admin will review your documents and approve your account shortly.
          </p>
          <button 
            onClick={() => navigate('/')}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 py-6 sm:py-12 px-3 sm:px-6 lg:px-8 relative overflow-x-hidden font-sans selection:bg-blue-500/30 selection:text-blue-200">
      
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-teal-600/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center text-slate-400 hover:text-white mb-6 sm:mb-8 transition-colors group touch-target"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm sm:text-base">Back to Login</span>
        </button>

        <div className="text-center mb-6 sm:mb-10">
          <div className="inline-flex items-center justify-center p-2 sm:p-3 bg-blue-600/20 rounded-xl sm:rounded-2xl mb-3 sm:mb-4 border border-blue-500/30 backdrop-blur-md">
             <Waves className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">Vessel Registry</h1>
          <p className="text-slate-400 mt-1 sm:mt-2 text-sm sm:text-lg">Register your vessel with the BlueOS Platform</p>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl shadow-2xl">
          {error && (
            <div className="mb-4 sm:mb-6 bg-red-500/10 border border-red-500/20 text-red-400 p-3 sm:p-4 rounded-xl flex items-center gap-2 text-xs sm:text-sm">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
            {/* Step 1: Owner Details */}
            <div className="space-y-4 sm:space-y-6">
              <h3 className="text-lg sm:text-xl font-bold flex items-center gap-2 sm:gap-3 text-white border-b border-slate-800 pb-3 sm:pb-4">
                <div className="p-1.5 sm:p-2 bg-blue-500/10 rounded-lg text-blue-400">
                    <User className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                Owner Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-1.5 sm:mb-2">Full Name</label>
                  <input
                    type="text"
                    name="ownerName"
                    value={formData.ownerName}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600"
                    placeholder="Enter owner's full name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-1.5 sm:mb-2">Contact Number</label>
                  <input
                    type="tel"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600"
                    placeholder="+91 98765 43210"
                    required
                  />
                </div>
                <div className="col-span-full">
                  <label className="block text-sm font-medium text-slate-400 mb-2">Email Address</label>
                  <input
                    type="email"
                    name="emailAddress"
                    value={formData.emailAddress}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600"
                    placeholder="owner@example.com"
                    required
                  />
                </div>
                <div className="col-span-full">
                  <label className="block text-sm font-medium text-slate-400 mb-2">Address</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600 min-h-[100px]"
                    placeholder="Enter complete address"
                    required
                  />
                </div>
                <div className="col-span-full">
                  <label className="block text-sm font-medium text-slate-400 mb-2">ID Proof</label>
                  <div className="border-2 border-dashed border-slate-700 rounded-xl p-8 text-center hover:bg-slate-800/50 hover:border-blue-500/50 transition-all cursor-pointer relative group">
                    <input
                      type="file"
                      name="idProof"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      accept="image/*,.pdf"
                    />
                    <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                        <Upload className="w-6 h-6 text-blue-400" />
                    </div>
                    <p className="text-sm text-slate-400 group-hover:text-white transition-colors">
                      {formData.idProof ? <span className="text-emerald-400 font-medium">File Selected</span> : 'Click to upload ID Proof (PDF/Image)'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Vessel Details */}
            <div className="space-y-4 sm:space-y-6 pt-4 sm:pt-6">
              <h3 className="text-lg sm:text-xl font-bold flex items-center gap-2 sm:gap-3 text-white border-b border-slate-800 pb-3 sm:pb-4">
                <div className="p-1.5 sm:p-2 bg-cyan-500/10 rounded-lg text-cyan-400">
                    <Ship className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                Vessel Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Vessel Name</label>
                  <input
                    type="text"
                    name="vesselName"
                    value={formData.vesselName}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600"
                    placeholder="e.g., Sea Warrior"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Registration Number</label>
                  <input
                    type="text"
                    name="registrationNumber"
                    value={formData.registrationNumber}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600"
                    placeholder="e.g., TN02T2756"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Vessel Type</label>
                  <select
                    name="vesselType"
                    value={formData.vesselType}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    required
                  >
                    <option value="" className="bg-slate-900">Select Type</option>
                    <option value="M - Mechanised" className="bg-slate-900">M - Mechanised</option>
                    <option value="O - Motorised" className="bg-slate-900">O - Motorised</option>
                    <option value="D - Deep Sea" className="bg-slate-900">D - Deep Sea</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Home Port</label>
                  <select
                    name="homePort"
                    value={formData.homePort}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    required
                  >
                    <option value="" className="bg-slate-900">Select Port</option>
                    <option value="C - Chennai" className="bg-slate-900">Chennai</option>
                    <option value="N - Nagapattinam" className="bg-slate-900">Nagapattinam</option>
                    <option value="T - Thuthookudi" className="bg-slate-900">Thuthookudi</option>
                    <option value="R - Ramanathapuram" className="bg-slate-900">Ramanathapuram</option>
                    <option value="K - Kanyakumari" className="bg-slate-900">Kanyakumari</option>
                  </select>
                </div>
                
                {/* Technical Specs */}
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Crew Capacity</label>
                  <input
                    type="number"
                    name="crewCapacity"
                    value={formData.crewCapacity}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Storage (kg)</label>
                  <input
                    type="number"
                    name="storageCapacity"
                    value={formData.storageCapacity}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Engine Power (HP)</label>
                  <input
                    type="number"
                    name="enginePower"
                    value={formData.enginePower}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Fuel Type</label>
                  <select
                    name="fuelType"
                    value={formData.fuelType}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    required
                  >
                    <option value="" className="bg-slate-900">Select Fuel</option>
                    <option value="Diesel" className="bg-slate-900">Diesel</option>
                    <option value="Petrol" className="bg-slate-900">Petrol</option>
                    <option value="Solar Hybrid" className="bg-slate-900">Solar Hybrid</option>
                  </select>
                </div>

                <div className="col-span-full">
                  <label className="block text-sm font-medium text-slate-400 mb-2">License Number</label>
                  <input
                    type="text"
                    name="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600"
                    required
                  />
                </div>

                <div className="col-span-full">
                  <label className="block text-sm font-medium text-slate-400 mb-2">Vessel Documents</label>
                  <div className="border-2 border-dashed border-slate-700 rounded-xl p-8 text-center hover:bg-slate-800/50 hover:border-blue-500/50 transition-all cursor-pointer relative group">
                    <input
                      type="file"
                      name="vesselDocuments"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      multiple
                      accept="image/*,.pdf"
                    />
                    <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                        <FileText className="w-6 h-6 text-blue-400" />
                    </div>
                    <p className="text-sm text-slate-400 group-hover:text-white transition-colors">
                      {formData.vesselDocuments.length > 0 
                        ? <span className="text-emerald-400 font-medium">{formData.vesselDocuments.length} Files Selected</span> 
                        : 'Click to upload Registration/Insurance Docs'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 sm:pt-6 border-t border-slate-800">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl font-bold text-base sm:text-lg shadow-lg shadow-blue-900/20 transition-all transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 touch-target"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span className="text-sm sm:text-base">Submitting...</span>
                  </>
                ) : (
                  <>
                    <span className="text-sm sm:text-base">Submit Registration</span>
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VesselRegistry;
