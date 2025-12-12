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
  },
  fisherLogin: async (mobile) => {
    const response = await api.post('/auth/fisher/login', { mobile });
    if (response.data.success && !response.data.isNewUser) {
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },
  registerFisher: async (data) => {
    const response = await api.post('/fishers', data);
    if (response.data.success) {
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
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
        weight: speciesData.weight || 0, // Default to 0 if not provided
        count: speciesData.count || 1,
        grade: speciesData.grade || 'B',
        location: speciesData.location || 'Unknown',
        image: speciesData.image,
        tagId: speciesData.tagId
    };
    const response = await api.post('/catch', payload);
    return response.data;
  },
  
  // Crate Management
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
  }
};
