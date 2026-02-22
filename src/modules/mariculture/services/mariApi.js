import axios from 'axios';

// Use relative path '/api' to trigger the Vite proxy
const API_URL = '/api/mariculture';

// Session management
const MARI_SESSION_KEY = 'blueos_mari_session';

const getMariSession = () => {
  try {
    const session = localStorage.getItem(MARI_SESSION_KEY);
    return session ? JSON.parse(session) : null;
  } catch {
    return null;
  }
};

const setMariSession = (session) => {
  localStorage.setItem(MARI_SESSION_KEY, JSON.stringify(session));
};

const clearMariSession = () => {
  localStorage.removeItem(MARI_SESSION_KEY);
};

// Create axios instance
const mariApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to all requests
mariApi.interceptors.request.use((config) => {
  const session = getMariSession();
  if (session?.token) {
    config.headers.Authorization = `Bearer ${session.token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// =====================================================
// AUTH API
// =====================================================
export const mariAuthAPI = {
  login: async (username, password, role) => {
    const response = await mariApi.post('/auth/login', { username, password, role });
    if (response.data.success && response.data.user) {
      setMariSession({
        user: response.data.user,
        token: response.data.token,
        loginTime: Date.now()
      });
    }
    return response.data;
  },

  logout: () => {
    clearMariSession();
    window.location.href = '/mariculture';
  },

  getCurrentUser: () => {
    const session = getMariSession();
    return session?.user || null;
  },

  isAuthenticated: () => {
    const session = getMariSession();
    return !!(session?.user && session?.token);
  },

  validateSession: async () => {
    try {
      const response = await mariApi.get('/auth/validate');
      return response.data.valid;
    } catch {
      return false;
    }
  }
};

// =====================================================
// FARMER API
// =====================================================
export const mariFarmerAPI = {
  // Farms
  getFarms: async () => {
    const response = await mariApi.get('/farmer/farms');
    return response.data;
  },

  createFarm: async (farmData) => {
    const response = await mariApi.post('/farmer/farms', farmData);
    return response.data;
  },

  updateFarm: async (farmId, farmData) => {
    const response = await mariApi.put(`/farmer/farms/${farmId}`, farmData);
    return response.data;
  },

  // Culture Units (Rafts, Longlines, Sea Cages)
  getUnits: async () => {
    const response = await mariApi.get('/farmer/units');
    return response.data;
  },

  createUnit: async (unitData) => {
    const response = await mariApi.post('/farmer/units', unitData);
    return response.data;
  },

  updateUnit: async (unitId, unitData) => {
    const response = await mariApi.put(`/farmer/units/${unitId}`, unitData);
    return response.data;
  },

  // Seeding / Stocking
  createSeeding: async (seedingData) => {
    const response = await mariApi.post('/farmer/seedings', seedingData);
    return response.data;
  },

  getSeedings: async () => {
    const response = await mariApi.get('/farmer/seedings');
    return response.data;
  },

  // Harvests
  createHarvest: async (harvestData) => {
    const response = await mariApi.post('/farmer/harvests', harvestData);
    return response.data;
  },

  getHarvests: async () => {
    const response = await mariApi.get('/farmer/harvests');
    return response.data;
  },

  // Water Quality
  recordWaterQuality: async (qualityData) => {
    const response = await mariApi.post('/farmer/water-quality', qualityData);
    return response.data;
  },

  getAllWaterQuality: async (days = 90) => {
    const response = await mariApi.get(`/farmer/water-quality-all?days=${days}`);
    return response.data;
  },

  // Growth Sampling
  recordGrowthSample: async (sampleData) => {
    const response = await mariApi.post('/farmer/growth-samples', sampleData);
    return response.data;
  },

  // Dashboard Stats
  getDashboardStats: async () => {
    const response = await mariApi.get('/farmer/dashboard');
    return response.data;
  }
};

// =====================================================
// INSPECTOR API
// =====================================================
export const mariInspectorAPI = {
  getDashboardStats: async () => {
    const response = await mariApi.get('/inspector/dashboard');
    return response.data;
  },

  getPendingInspections: async () => {
    const response = await mariApi.get('/inspector/pending');
    return response.data;
  },

  submitInspection: async (inspectionData) => {
    const response = await mariApi.post('/inspector/inspect', inspectionData);
    return response.data;
  },

  getInspectionHistory: async () => {
    const response = await mariApi.get('/inspector/history');
    return response.data;
  },

  getFarmsForAudit: async () => {
    const response = await mariApi.get('/inspector/farms');
    return response.data;
  },

  submitFarmAudit: async (auditData) => {
    const response = await mariApi.post('/inspector/farm-audit', auditData);
    return response.data;
  }
};

// =====================================================
// PACKER API
// =====================================================
export const mariPackerAPI = {
  getDashboardStats: async () => {
    const response = await mariApi.get('/packer/dashboard');
    return response.data;
  },

  getApprovedHarvests: async () => {
    const response = await mariApi.get('/packer/approved-harvests');
    return response.data;
  },

  getCrates: async () => {
    const response = await mariApi.get('/packer/crates');
    return response.data;
  },

  packCrate: async (packingData) => {
    const response = await mariApi.post('/packer/pack', packingData);
    return response.data;
  },

  dispatchCrate: async (crateId, dispatchData) => {
    const response = await mariApi.post(`/packer/dispatch/${crateId}`, dispatchData);
    return response.data;
  },

  getPackingHistory: async () => {
    const response = await mariApi.get('/packer/history');
    return response.data;
  }
};

export default mariApi;
