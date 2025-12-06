import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mainAPI } from '../../services/api';
import { fileToBase64 } from '../../services/utils';
import { Ship, User, FileText, Upload, CheckCircle, ArrowLeft, AlertCircle } from 'lucide-react';

const VesselRegistry = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="glass-card max-w-md w-full p-8 text-center">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Registration Submitted!</h2>
          <p className="text-slate-500 mb-8">
            Your vessel registration has been submitted successfully. An admin will review your documents and approve your account shortly.
          </p>
          <button 
            onClick={() => navigate('/')}
            className="btn-primary w-full"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center text-slate-500 hover:text-slate-900 mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Login
        </button>

        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-slate-900">Vessel Registry</h1>
          <p className="text-slate-500 mt-2">Register your vessel with BlueOS</p>
        </div>

        <div className="glass-card p-8">
          {error && (
            <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-2 text-sm">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Step 1: Owner Details */}
            <div className="space-y-6">
              <h3 className="text-lg font-bold flex items-center gap-2 text-slate-800 border-b pb-2">
                <User className="w-5 h-5 text-ocean-600" />
                Owner Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    name="ownerName"
                    value={formData.ownerName}
                    onChange={handleChange}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Contact Number</label>
                  <input
                    type="tel"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleChange}
                    className="input-field"
                    required
                  />
                </div>
                <div className="col-span-full">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    name="emailAddress"
                    value={formData.emailAddress}
                    onChange={handleChange}
                    className="input-field"
                    required
                  />
                </div>
                <div className="col-span-full">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="input-field min-h-[100px]"
                    required
                  />
                </div>
                <div className="col-span-full">
                  <label className="block text-sm font-medium text-slate-700 mb-1">ID Proof</label>
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-50 transition-colors cursor-pointer relative">
                    <input
                      type="file"
                      name="idProof"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      accept="image/*,.pdf"
                    />
                    <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">
                      {formData.idProof ? 'File Selected' : 'Click to upload ID Proof'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Vessel Details */}
            <div className="space-y-6 pt-6">
              <h3 className="text-lg font-bold flex items-center gap-2 text-slate-800 border-b pb-2">
                <Ship className="w-5 h-5 text-ocean-600" />
                Vessel Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Vessel Name</label>
                  <input
                    type="text"
                    name="vesselName"
                    value={formData.vesselName}
                    onChange={handleChange}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Registration Number</label>
                  <input
                    type="text"
                    name="registrationNumber"
                    value={formData.registrationNumber}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="e.g., TN02T2756"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Vessel Type</label>
                  <select
                    name="vesselType"
                    value={formData.vesselType}
                    onChange={handleChange}
                    className="input-field"
                    required
                  >
                    <option value="">Select Type</option>
                    <option value="M - Mechanised">M - Mechanised</option>
                    <option value="O - Motorised">O - Motorised</option>
                    <option value="D - Deep Sea">D - Deep Sea</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Home Port</label>
                  <select
                    name="homePort"
                    value={formData.homePort}
                    onChange={handleChange}
                    className="input-field"
                    required
                  >
                    <option value="">Select Port</option>
                    <option value="C - Chennai">Chennai</option>
                    <option value="N - Nagapattinam">Nagapattinam</option>
                    <option value="T - Thuthookudi">Thuthookudi</option>
                    <option value="R - Ramanathapuram">Ramanathapuram</option>
                    <option value="K - Kanyakumari">Kanyakumari</option>
                  </select>
                </div>
                
                {/* Technical Specs */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Crew Capacity</label>
                  <input
                    type="number"
                    name="crewCapacity"
                    value={formData.crewCapacity}
                    onChange={handleChange}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Storage (kg)</label>
                  <input
                    type="number"
                    name="storageCapacity"
                    value={formData.storageCapacity}
                    onChange={handleChange}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Engine Power (HP)</label>
                  <input
                    type="number"
                    name="enginePower"
                    value={formData.enginePower}
                    onChange={handleChange}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Fuel Type</label>
                  <select
                    name="fuelType"
                    value={formData.fuelType}
                    onChange={handleChange}
                    className="input-field"
                    required
                  >
                    <option value="">Select Fuel</option>
                    <option value="Diesel">Diesel</option>
                    <option value="Petrol">Petrol</option>
                    <option value="Solar Hybrid">Solar Hybrid</option>
                  </select>
                </div>

                <div className="col-span-full">
                  <label className="block text-sm font-medium text-slate-700 mb-1">License Number</label>
                  <input
                    type="text"
                    name="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={handleChange}
                    className="input-field"
                    required
                  />
                </div>

                <div className="col-span-full">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Vessel Documents</label>
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-50 transition-colors cursor-pointer relative">
                    <input
                      type="file"
                      name="vesselDocuments"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      multiple
                      accept="image/*,.pdf"
                    />
                    <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">
                      {formData.vesselDocuments.length > 0 
                        ? `${formData.vesselDocuments.length} files selected` 
                        : 'Upload Registration & License Docs'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary flex items-center justify-center gap-2"
              >
                {loading ? 'Submitting...' : 'Register Vessel'}
                {!loading && <CheckCircle className="w-5 h-5" />}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VesselRegistry;
