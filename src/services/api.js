import axios from 'axios';

// Use relative path '/api' to trigger the Vite proxy
const API_URL = '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth API
export const authAPI = {
  login: async (username, password) => {
    try {
      const response = await api.post('/auth/login', { username, password });
      if (response.data.success) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      console.error("Login Error:", error);
      throw error;
    }
  },
  logout: () => {
    localStorage.removeItem('user');
    window.location.href = '/';
  }
};

// Captain & Worker API
export const mainAPI = {
  // Trip Management
  checkTripCode: async (code) => {
    return { success: true, valid: true }; 
  },
  saveTrip: async (tripData) => {
    const response = await api.post('/trips', tripData);
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
        weight: speciesData.weight || 0, // Default to 0 if not provided
        count: speciesData.count || 1,   // Default to 1 per QR
        gps: {
            lat: speciesData.latitude,
            lng: speciesData.longitude
        },
        locationName: speciesData.locationName,
        qrCode: speciesData.qr,
        images: speciesData.images,
        catchSessionId: speciesData.catchSessionId,
        userId: speciesData.userId,
        timestamp: speciesData.timestamp
    };
    const response = await api.post('/catch', payload);
    return response.data;
  },
  
  // Worker specific
  getCrates: async () => {
    const response = await api.get('/crates');
    return response.data;
  },
  verifyFishForCrate: async (qrCode) => {
    const response = await api.post('/crates/verify-fish', { qrCode });
    return response.data;
  },
  sealCrate: async (tripId, fishQrCodes) => {
    const response = await api.post('/crates/seal', { tripId, fishQrCodes });
    return response.data;
  },
  inspectCrate: async (crateQr) => {
    const response = await api.get(`/crates/${crateQr}`);
    return response.data;
  },
  saveFish: async (fishData) => {
    const response = await api.post('/catch', fishData);
    return response.data;
  },

  // QR Generation
  generateQRCodes: async (params) => {
    const response = await api.post('/qr/generate', params);
    return response.data;
  },

  // Vessel Registry (Public/Shared)
  getVessels: async () => {
    const response = await api.get('/vessels');
    return response.data;
  },
  submitVesselRegistration: async (registrationData) => {
    const response = await api.post('/vessels', registrationData);
    return response.data;
  }
};

// Inspector API
export const inspectorAPI = {
  getTrips: async () => {
    const response = await api.get('/inspector/trips');
    return response.data;
  },
  getTripCatch: async (tripId) => {
    const response = await api.get(`/inspector/trip/${tripId}/catch`);
    return response.data;
  },
  getCatchDetails: async (qrCode) => {
    const response = await api.get(`/trace/${qrCode}`);
    return response.data;
  },
  updateQuality: async (data) => {
    const response = await api.post('/inspector/quality', data);
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
  getTripDetails: async (tripId) => {
    const response = await api.get(`/trips/${tripId}/catch`);
    return response.data;
  },
  getSpecies: async () => {
    return { success: true, data: [] };
  },
  getFish: async () => {
    return { success: true, data: [] };
  },
  getPendingRegistrations: async () => {
    const response = await api.get('/registrations/pending');
    return response.data;
  },
  approveRegistration: async (data) => {
    const response = await api.post('/registrations/approve', data);
    return response.data;
  },
  getUsers: async () => {
    const response = await api.get('/users');
    return response.data;
  }
};

// Public API (Traceability)
export const publicAPI = {
    traceCatch: async (qrCode) => {
        const response = await api.get(`/trace/${qrCode}`);
        return response.data;
    }
};
