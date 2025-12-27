import axios from 'axios';

// Use relative path '/api' to trigger the Vite proxy
const API_URL = '/api';

// Generate a unique browser/tab identifier
const getBrowserId = () => {
  let browserId = sessionStorage.getItem('blueos_browser_id');
  if (!browserId) {
    browserId = 'browser_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    sessionStorage.setItem('blueos_browser_id', browserId);
  }
  return browserId;
};

// Session storage keys (unique per session)
const getSessionKey = (sessionId) => `blueos_session_${sessionId}`;
const getCurrentSessionIdKey = () => `blueos_current_session_${getBrowserId()}`;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to all requests
api.interceptors.request.use((config) => {
  const session = getCurrentSession();
  if (session?.token) {
    config.headers.Authorization = `Bearer ${session.token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Handle 401 responses (session expired)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Session expired, clear and redirect to login
      clearSession();
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Get current session data
const getCurrentSession = () => {
  try {
    const sessionId = sessionStorage.getItem(getCurrentSessionIdKey());
    if (!sessionId) return null;
    
    const sessionData = sessionStorage.getItem(getSessionKey(sessionId));
    if (!sessionData) return null;
    
    return JSON.parse(sessionData);
  } catch (e) {
    console.warn('Error reading session:', e);
    return null;
  }
};

// Save session data
const saveSession = (token, sessionId, user) => {
  try {
    const sessionData = {
      token,
      sessionId,
      user,
      createdAt: new Date().toISOString(),
      browserId: getBrowserId()
    };
    
    // Store session data with unique key
    sessionStorage.setItem(getSessionKey(sessionId), JSON.stringify(sessionData));
    
    // Mark this as the current session for this browser
    sessionStorage.setItem(getCurrentSessionIdKey(), sessionId);
    
    // Also store user in legacy format for backwards compatibility
    sessionStorage.setItem('user', JSON.stringify(user));
    
    console.log('Session saved:', sessionId);
  } catch (e) {
    console.error('Error saving session:', e);
    // Fallback to memory
    window.currentSession = { token, sessionId, user };
    window.currentUser = user;
  }
};

// Clear current session
const clearSession = () => {
  try {
    const sessionId = sessionStorage.getItem(getCurrentSessionIdKey());
    if (sessionId) {
      sessionStorage.removeItem(getSessionKey(sessionId));
    }
    sessionStorage.removeItem(getCurrentSessionIdKey());
    sessionStorage.removeItem('user');
    window.currentSession = null;
    window.currentUser = null;
  } catch (e) {
    console.error('Error clearing session:', e);
  }
};

// Validate current session with server
const validateSession = async () => {
  try {
    const response = await api.get('/auth/validate');
    return response.data.valid === true;
  } catch (e) {
    return false;
  }
};

// Auth API
export const authAPI = {
  login: async (username, password) => {
    try {
      const response = await api.post('/auth/login', { username, password });
      console.log('Login API Response:', response.data);
      if (response.data.success && response.data.user) {
        saveSession(response.data.token, response.data.sessionId, response.data.user);
      }
      return response.data;
    } catch (error) {
      console.error("Login Error:", error);
      throw error;
    }
  },
  logout: async () => {
    try {
      // Notify server to invalidate session
      await api.post('/auth/logout');
    } catch (e) {
      console.warn('Logout API error:', e);
    }
    clearSession();
    window.location.href = '/';
  },
  validateSession,
  fisherLogin: async (mobile) => {
    try {
      const response = await api.post('/auth/fisher/login', { mobile });
      console.log('Fisher Login API Response:', response.data);
      if (response.data.success && !response.data.isNewUser && response.data.user) {
        saveSession(response.data.token, response.data.sessionId, response.data.user);
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
        saveSession(response.data.token, response.data.sessionId, response.data.user);
      }
      return response.data;
    } catch (error) {
      console.error('Fisher Registration Error:', error);
      throw error;
    }
  },
  getSessions: async () => {
    const response = await api.get('/auth/sessions');
    return response.data;
  },
  registerVesselOwner: async (data) => {
    try {
      const response = await api.post('/auth/vessel-owner/register', data);
      console.log('Vessel Owner Registration Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Vessel Owner Registration Error:', error);
      throw error;
    }
  },
  vesselOwnerLogin: async (username, password) => {
    try {
      const response = await api.post('/auth/vessel-owner/login', { username, password });
      if (response.data.success && response.data.user) {
        sessionStorage.setItem('user', JSON.stringify(response.data.user));
        if (response.data.token) {
          sessionStorage.setItem('token', response.data.token);
        }
      }
      return response.data;
    } catch (error) {
      console.error('Vessel Owner Login Error:', error);
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
  },
  resolveQR: async (qrCode) => {
    const response = await api.post('/fishers/resolve-qr', { qrCode });
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
  getTripCrew: async (tripId) => {
    const response = await api.get(`/trips/${tripId}/crew`);
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
  getCaptainTrips: async (vesselName, userId) => {
    const response = await api.get(`/trips/captain?vessel=${vesselName || ''}&userId=${userId || ''}`);
    return response.data;
  },
  getLogByQR: async (qrCode) => {
    const response = await api.get(`/catch/qr/${qrCode}`);
    return response.data;
  },

  // Validate if QR code is already used
  validateQR: async (qrCode) => {
    try {
      const response = await api.get(`/catch/validate-qr/${qrCode}`);
      return response.data;
    } catch (error) {
      console.error('QR validation error:', error);
      return { success: false, isUsed: false };
    }
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
  
  // Worker Stats
  getWorkerStats: async (workerId) => {
    const response = await api.get(`/worker/stats/${workerId}`);
    return response.data;
  },
  getActiveTripsForCrates: async () => {
    const response = await api.get('/worker/active-trips');
    return response.data;
  },
  
  // Crate Management
  getCrates: async (tripId) => {
    const params = tripId ? `?tripId=${tripId}` : '';
    const response = await api.get(`/crates${params}`);
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
  updateCrateWithFish: async (crateId, fishData, packerId) => {
    const response = await api.post(`/crates/${crateId}/add-fish`, { 
      fishQrCodes: fishData.map(f => f.qr_code),
      packerId: packerId  // Chain of custody: track who packed the crate
    });
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
  },
  
  // Export trip data for Excel generation
  exportTripData: async (tripId) => {
    const response = await api.get(`/export/trip/${tripId}`);
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
    const response = await api.get('/registry/stats');
    return response.data;
  },
  
  // New Unified Registry Endpoints
  getFishersRegistry: async () => {
    const response = await api.get('/registry/fishers');
    return response.data;
  },
  getStaffRegistry: async () => {
    const response = await api.get('/registry/staff');
    return response.data;
  },
  toggleFisherStatus: async (fisherId) => {
    const response = await api.post(`/registry/fishers/${fisherId}/toggle-status`);
    return response.data;
  },
  toggleStaffStatus: async (staffId) => {
    const response = await api.post(`/registry/staff/${staffId}/toggle-status`);
    return response.data;
  },
};

// Helper Functions
export const getCurrentUser = () => {
  // First try to get from current session
  const session = getCurrentSession();
  if (session?.user) {
    return session.user;
  }
  
  // Fallback to legacy storage
  try {
    const userStr = sessionStorage.getItem('user');
    if (userStr) return JSON.parse(userStr);
  } catch (e) { 
    console.warn('Error reading user from storage', e); 
  }
  
  return window.currentUser || null;
};

// Export session utilities for use in other components
export const sessionUtils = {
  getCurrentSession,
  validateSession,
  clearSession,
  getBrowserId
};
