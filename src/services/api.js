import axios from 'axios';

// Use relative path '/api' to trigger the Vite proxy
const API_URL = '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const saveUserSession = (user) => {
  const userString = JSON.stringify(user);
  let saved = false;
  try { localStorage.setItem('user', userString); saved = true; console.log('Saved to localStorage'); } catch (e) { console.warn('localStorage failed', e); }
  if (!saved) { try { sessionStorage.setItem('user', userString); saved = true; console.log('Saved to sessionStorage'); } catch (e) { console.warn('sessionStorage failed', e); } }
  if (!saved) { window.currentUser = user; console.log('Saved to memory'); }
};

// Auth API
export const authAPI = {
  login: async (username, password) => {
    try {
      const response = await api.post('/auth/login', { username, password });
      console.log('Login API Response:', response.data);
      if (response.data.success && response.data.user) {
        saveUserSession(response.data.user);
      }
      return response.data;
    } catch (error) {
      console.error("Login Error:", error);
      throw error;
    }
  },
  logout: () => {
    try {
      localStorage.removeItem('user');
      sessionStorage.removeItem('user');
      window.currentUser = null;
      window.location.href = '/';
    } catch (e) {
      console.error('Logout error:', e);
      window.location.href = '/';
    }
  },
  fisherLogin: async (mobile) => {
    try {
      const response = await api.post('/auth/fisher/login', { mobile });
      console.log('Fisher Login API Response:', response.data);
      if (response.data.success && !response.data.isNewUser && response.data.user) {
        saveUserSession(response.data.user);
      }
      return response.data;
    } catch (error) {
      console.error('Fisher Login Error:', error);
      throw error;
    }
  },
  registerFisher: async (data) => {
    try {
      const response = await api.post('/fishers', data);
      console.log('Fisher Registration Response:', response.data);
      if (response.data.success && response.data.user) {
        saveUserSession(response.data.user);
      }
      return response.data;
    } catch (error) {
      console.error('Fisher Registration Error:', error);
      throw error;
    }
  }
};

// Fisher API
export const fisherAPI = {
  getTrips: async (fisherId) => {
    const response = await api.get(`/fishers/${fisherId}/trips`);
    return response.data;
  },
  getProfileByQR: async (qrCode) => {
    const response = await api.get(`/fishers/qr/${qrCode}`);
    return response.data;
  }
};

// Captain & Worker API
export const mainAPI = {
  // Trip Management
  checkTripCode: async (code) => {
    return { success: true, valid: true }; 
  },
  // QR Generation (Admin)
  generateQRCodes: async (config) => {
    // Expects: { qrType, countryCode, landingCentre, year, quantity }
    const response = await api.post('/qr/generate', config);
    return response.data;
  },
  saveTrip: async (tripData) => {
    const response = await api.post('/trips', tripData);
    return response.data;
  },
  updateTripExpenses: async (data) => {
    const response = await api.post('/trips/expenses', data);
    return response.data;
  },
  getAvailableTrips: async () => {
    const response = await api.get('/trips/active');
    return response.data;
  },
  getTripCatch: async (tripId) => {
    const response = await api.get(`/trips/${tripId}/catch`);
    return response.data;
  },
  getPendingTrips: async () => {
    const response = await api.get('/trips/pending');
    return response.data;
  },
  approveTrip: async (tripId) => {
    const response = await api.post('/trips/approve', { tripId });
    return response.data;
  },
  getCaptainTrips: async (vesselName) => {
    const response = await api.get(`/trips/captain?vessel=${vesselName}`);
    return response.data;
  },
  getLogByQR: async (qrCode) => {
    const response = await api.get(`/catch/qr/${qrCode}`);
    return response.data;
  },

  // Catch Logging
  saveSpecies: async (speciesData) => {
    // Transform frontend data to match backend expectation
    const payload = {
        tripId: speciesData.tripId,
        species: speciesData.species,
        weight: speciesData.weight || 0,
        count: speciesData.count || 1,
        qualityGrade: speciesData.grade || speciesData.qualityGrade || 'B', // Map grade to qualityGrade
        freshness: speciesData.freshness || 'Excellent',
        damage: speciesData.damage || 'None',
        locationName: speciesData.locationName || 'Unknown',
        images: speciesData.images || [],
        qrCode: speciesData.qr || speciesData.qrCode || speciesData.tagId, // Handle various input names
        gps: {
            lat: speciesData.latitude || 0,
            lng: speciesData.longitude || 0
        },
        catchSessionId: speciesData.catchSessionId,
        userId: speciesData.userId,
        crateId: speciesData.crateId,
        inspectorId: speciesData.inspectorId
    };
    const response = await api.post('/catch', payload);
    return response.data;
  },
  // Alias for Worker (uses same endpoint but might have different field names in calling component)
  saveFish: async (data) => {
    // WorkerEntry sends: qrCode, weight, qualityGrade, freshness, damage, crateId, tripId, inspectorId
    return mainAPI.saveSpecies(data);
  },
  
  // Crate Management
  getCrates: async () => {
    const response = await api.get('/crates');
    return response.data;
  },
  verifyFishForCrate: async (qrCode) => {
    const response = await api.post('/crates/verify-fish', { qrCode });
    return response.data;
  },
  inspectCrate: async (qrCode) => {
    const response = await api.get(`/crates/${qrCode}`);
    return response.data;
  },
  sealCrate: async (tripId, fishQrs) => {
    const response = await api.post('/crates/seal', { tripId, fishQrs });
    return response.data;
  },
  assignCrate: async (data) => {
    const response = await api.post('/crates/assign', data);
    return response.data;
  },
  getCrate: async (crateId) => {
    const response = await api.get(`/crates/${crateId}`);
    return response.data;
  },
  submitVesselRegistration: async (data) => {
    const response = await api.post('/vessels', data);
    return response.data;
  }
};

// Inspector API
export const inspectorAPI = {
  getTrips: async () => {
    const response = await api.get('/trips');
    return response.data;
  },
  getCatchDetails: async (qrCode) => {
    const response = await api.get(`/catch/qr/${qrCode}`);
    return response.data;
  },
  updateQuality: async (data) => {
    const response = await api.post('/catch/quality', data);
    return response.data;
  },
  getTripCatch: async (tripId) => {
    const response = await api.get(`/trips/${tripId}/catch`);
    return response.data;
  }
};

// Public API
export const publicAPI = {
  traceCatch: async (qrCode) => {
    const response = await api.get(`/catch/qr/${qrCode}`);
    return response.data;
  }
};

// Admin API
export const adminAPI = {
  getStatistics: async () => {
    const response = await api.get('/stats');
    return response.data;
  },
  getVessels: async () => {
    const response = await api.get('/vessels');
    return response.data;
  },
  getTrips: async () => {
    const response = await api.get('/trips');
    return response.data;
  },
  getPendingRegistrations: async () => {
    // Assuming this endpoint exists or will be created
    const response = await api.get('/admin/pending-registrations'); 
    return response.data;
  },
  getUsers: async () => {
    const response = await api.get('/users');
    return response.data;
  },
  approveTrip: async (tripId) => {
    const response = await api.post('/trips/approve', { tripId });
    return response.data;
  },
  approveRegistration: async (data) => {
    const response = await api.post('/admin/approve-registration', data);
    return response.data;
  },
  getTripDetails: async (tripId) => {
    const response = await api.get(`/trips/${tripId}/catch`);
    return response.data;
  },
  rejectRegistration: async (pendingId) => {
    const response = await api.post('/admin/reject-registration', { pendingId });
    return response.data;
  },
  updateVessel: async (vesselId, data) => {
    const response = await api.put(`/vessels/${vesselId}`, data);
    return response.data;
  },
  
  // Registry API
  getRegistry: async () => {
    const response = await api.get('/registry');
    return response.data;
  },
  getRegistryEntry: async (rootId) => {
    const response = await api.get(`/registry/${rootId}`);
    return response.data;
  },
  createRegistryEntry: async (data) => {
    const response = await api.post('/registry', data);
    return response.data;
  },
  updateRegistryEntry: async (rootId, data) => {
    const response = await api.put(`/registry/${rootId}`, data);
    return response.data;
  },
  toggleRegistryStatus: async (rootId) => {
    const response = await api.post(`/registry/${rootId}/toggle-status`);
    return response.data;
  },
  getRegistryStats: async () => {
    const response = await api.get('/registry/stats/summary');
    return response.data;
  }
};
