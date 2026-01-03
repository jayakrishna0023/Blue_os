import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ship, User, Phone, Mail, MapPin, FileText, ArrowLeft, Anchor, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { authAPI } from '../../services/api';
import { useToast } from '../Shared/Toast';
import { useLanguage } from '../../context/LanguageContext';
import LanguageToggle from '../Shared/LanguageToggle';
import { PORTS } from '../../services/faoConstants';

const VesselOwnerRegistration = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const toast = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Owner Details
  const [ownerData, setOwnerData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    aadhaarNumber: '',
    panNumber: ''
  });
  
  // Vessel Details
  const [vesselData, setVesselData] = useState({
    vesselName: '',
    registrationNumber: '',
    imnNumber: '',
    vesselType: 'trawler',
    length: '',
    storageCapacity: '',
    crewCapacity: '',
    enginePower: '',
    fuelType: 'Diesel',
    homePort: '',
    buildYear: ''
  });
  
  // Account Credentials
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false
  });

  const handleOwnerChange = (e) => {
    setOwnerData({ ...ownerData, [e.target.name]: e.target.value });
  };

  const handleVesselChange = (e) => {
    setVesselData({ ...vesselData, [e.target.name]: e.target.value });
  };

  const handleCredentialsChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCredentials({ 
      ...credentials, 
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const validateStep1 = () => {
    if (!ownerData.name.trim()) {
      setError(t('enterFullName'));
      return false;
    }
    if (!ownerData.phone.trim() || ownerData.phone.length < 10) {
      setError(t('enterValidPhone'));
      return false;
    }
    setError('');
    return true;
  };

  const validateStep2 = () => {
    if (!vesselData.vesselName.trim()) {
      setError(t('enterVesselName') || 'Please enter vessel name');
      return false;
    }
    if (!vesselData.registrationNumber.trim()) {
      setError(t('enterRegistrationNumber') || 'Please enter vessel registration number');
      return false;
    }
    if (!vesselData.homePort.trim()) {
      setError(t('selectHomePort') || 'Please select home port');
      return false;
    }
    setError('');
    return true;
  };

  const validateStep3 = () => {
    if (!credentials.username || !credentials.username.trim()) {
      setError(t('usernameMustBe'));
      return false;
    }
    if (credentials.username.trim().length < 4) {
      setError(t('usernameMustBe'));
      return false;
    }
    if (!credentials.password || !credentials.password.trim()) {
      setError(t('passwordMustBe'));
      return false;
    }
    if (credentials.password.trim().length < 6) {
      setError(t('passwordMustBe'));
      return false;
    }
    if (!credentials.confirmPassword || credentials.password !== credentials.confirmPassword) {
      setError(t('passwordsDoNotMatch'));
      return false;
    }
    if (!credentials.agreeTerms) {
      setError(t('agreeToTerms'));
      return false;
    }
    setError('');
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep3()) return;

    setLoading(true);
    setError('');

    try {
      const response = await authAPI.registerVesselOwner({
        owner: ownerData,
        vessel: vesselData,
        credentials: {
          username: credentials.username,
          password: credentials.password
        }
      });

      if (response.success) {
        toast.success('Registration submitted! Awaiting admin approval.', 'Success');
        navigate('/login');
      } else {
        setError(response.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('Failed to submit registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan-600/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="max-w-2xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <button 
            onClick={() => navigate('/login')}
            className="flex items-center text-slate-400 hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            {t('back')}
          </button>
          <LanguageToggle className="!bg-slate-800 !border-slate-700" />
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-4 bg-blue-600/20 rounded-2xl mb-6 border border-blue-500/30">
            <Ship className="w-10 h-10 text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">{t('vesselOwnerRegistration')}</h1>
          <p className="text-slate-400">{t('registerVesselAndAccount')}</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                step === s ? 'bg-blue-600 text-white' : 
                step > s ? 'bg-green-500 text-white' : 'bg-slate-800 text-slate-500'
              }`}>
                {step > s ? <CheckCircle className="w-5 h-5" /> : s}
              </div>
              {s < 3 && (
                <div className={`w-16 h-1 mx-2 rounded ${step > s ? 'bg-green-500' : 'bg-slate-800'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Form Card */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3 mb-6">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Step 1: Owner Details */}
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
                <User className="w-5 h-5 text-blue-400" />
                {t('ownerDetails')}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">{t('fullName')} *</label>
                  <input
                    type="text"
                    name="name"
                    value={ownerData.name}
                    onChange={handleOwnerChange}
                    className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-3 rounded-xl focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder={t('enterFullName')}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">{t('phoneNumber')} *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={ownerData.phone}
                    onChange={handleOwnerChange}
                    className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-3 rounded-xl focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder={t('tenDigitMobile')}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">{t('emailOptional')}</label>
                  <input
                    type="email"
                    name="email"
                    value={ownerData.email}
                    onChange={handleOwnerChange}
                    className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-3 rounded-xl focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="your@email.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">{t('aadhaarNumber')}</label>
                  <input
                    type="text"
                    name="aadhaarNumber"
                    value={ownerData.aadhaarNumber}
                    onChange={handleOwnerChange}
                    className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-3 rounded-xl focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="12 digit Aadhaar"
                    maxLength={12}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">Address</label>
                <textarea
                  name="address"
                  value={ownerData.address}
                  onChange={handleOwnerChange}
                  className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-3 rounded-xl focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Full address"
                  rows={2}
                />
              </div>
            </div>
          )}

          {/* Step 2: Vessel Details */}
          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
                <Anchor className="w-5 h-5 text-blue-400" />
                {t('vesselDetails')}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">{t('vesselName')} *</label>
                  <input
                    type="text"
                    name="vesselName"
                    value={vesselData.vesselName}
                    onChange={handleVesselChange}
                    className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-3 rounded-xl focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="e.g., Ocean Queen"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">{t('registrationNumber')} *</label>
                  <input
                    type="text"
                    name="registrationNumber"
                    value={vesselData.registrationNumber}
                    onChange={handleVesselChange}
                    className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-3 rounded-xl focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="e.g., IND-TN-1234"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">{t('imnNumber')}</label>
                  <input
                    type="text"
                    name="imnNumber"
                    value={vesselData.imnNumber}
                    onChange={handleVesselChange}
                    className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-3 rounded-xl focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="IMN number if available"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">{t('vesselType')} *</label>
                  <select
                    name="vesselType"
                    value={vesselData.vesselType}
                    onChange={handleVesselChange}
                    className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-3 rounded-xl focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    <option value="trawler">Trawler</option>
                    <option value="gillnetter">Gillnetter</option>
                    <option value="longliner">Longliner</option>
                    <option value="purse_seiner">Purse Seiner</option>
                    <option value="traditional">Traditional Craft</option>
                    <option value="motorized">Motorized Boat</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">{t('homePort')} *</label>
                  <select
                    name="homePort"
                    value={vesselData.homePort}
                    onChange={handleVesselChange}
                    className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-3 rounded-xl focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    required
                  >
                    <option value="">{t('selectHomePort')}</option>
                    {PORTS.map(port => (
                      <option key={port.code} value={port.name}>{port.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">Length (meters)</label>
                  <input
                    type="number"
                    name="length"
                    value={vesselData.length}
                    onChange={handleVesselChange}
                    className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-3 rounded-xl focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="e.g., 15"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">Engine Power (HP)</label>
                  <input
                    type="number"
                    name="enginePower"
                    value={vesselData.enginePower}
                    onChange={handleVesselChange}
                    className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-3 rounded-xl focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="e.g., 150"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">Storage Capacity (kg)</label>
                  <input
                    type="number"
                    name="storageCapacity"
                    value={vesselData.storageCapacity}
                    onChange={handleVesselChange}
                    className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-3 rounded-xl focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="e.g., 5000"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">Crew Capacity</label>
                  <input
                    type="number"
                    name="crewCapacity"
                    value={vesselData.crewCapacity}
                    onChange={handleVesselChange}
                    className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-3 rounded-xl focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="e.g., 10"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">Fuel Type</label>
                  <select
                    name="fuelType"
                    value={vesselData.fuelType}
                    onChange={handleVesselChange}
                    className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-3 rounded-xl focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    <option value="Diesel">Diesel</option>
                    <option value="Petrol">Petrol</option>
                    <option value="Kerosene">Kerosene</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">{t('buildYear')}</label>
                  <input
                    type="number"
                    name="buildYear"
                    value={vesselData.buildYear}
                    onChange={handleVesselChange}
                    className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-3 rounded-xl focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="e.g., 2020"
                    min="1950"
                    max={new Date().getFullYear()}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Account Credentials */}
          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
                <FileText className="w-5 h-5 text-blue-400" />
                {t('accountCredentials')}
              </h2>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">{t('username')} *</label>
                  <input
                    type="text"
                    name="username"
                    value={credentials.username}
                    onChange={handleCredentialsChange}
                    className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-3 rounded-xl focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder={t('usernamePlaceholder')}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">{t('password')} *</label>
                  <input
                    type="password"
                    name="password"
                    value={credentials.password}
                    onChange={handleCredentialsChange}
                    className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-3 rounded-xl focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder={t('passwordPlaceholder')}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">{t('confirmPassword')} *</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={credentials.confirmPassword}
                    onChange={handleCredentialsChange}
                    className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-3 rounded-xl focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="Re-enter password"
                    required
                  />
                </div>
                
                <div className="flex items-center gap-3 p-4 bg-slate-900 rounded-lg border border-slate-800 mt-4">
                  <input
                    type="checkbox"
                    name="agreeTerms"
                    id="agreeTerms"
                    checked={credentials.agreeTerms}
                    onChange={handleCredentialsChange}
                    className="w-4 h-4 rounded"
                    required
                  />
                  <label htmlFor="agreeTerms" className="text-sm text-slate-300">
                    {t('agreeToTerms')}
                  </label>
                </div>
              </div>
              
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mt-6">
                <p className="text-blue-400 text-sm">
                  <strong>{t('noteLabel')}:</strong> {t('registrationNote')}
                </p>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            {step > 1 ? (
              <button
                onClick={() => setStep(step - 1)}
                className="px-6 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors"
              >
                {t('previous')}
              </button>
            ) : (
              <div></div>
            )}
            
            {step < 3 ? (
              <button
                onClick={handleNext}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-colors font-medium"
              >
                {t('next')}
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-8 py-3 bg-green-600 text-white rounded-xl hover:bg-green-500 transition-colors font-medium flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    {t('submitting')}...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    {t('submitRegistration')}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VesselOwnerRegistration;
