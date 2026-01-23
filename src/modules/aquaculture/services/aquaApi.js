import axios from 'axios';

// Use relative path '/api' to trigger the Vite proxy
const API_URL = '/api/aquaculture';

const aquaApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to all requests
aquaApi.interceptors.request.use((config) => {
  const session = getAquaSession();
  if (session?.token) {
    config.headers.Authorization = `Bearer ${session.token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Session management
const AQUA_SESSION_KEY = 'blueos_aqua_session';

const getAquaSession = () => {
  try {
    const session = localStorage.getItem(AQUA_SESSION_KEY);
    return session ? JSON.parse(session) : null;
  } catch {
    return null;
  }
};

const setAquaSession = (session) => {
  localStorage.setItem(AQUA_SESSION_KEY, JSON.stringify(session));
};

const clearAquaSession = () => {
  localStorage.removeItem(AQUA_SESSION_KEY);
};

// =====================================================
// AUTH API
// =====================================================
export const aquaAuthAPI = {
  login: async (username, password, role) => {
    const response = await aquaApi.post('/auth/login', { username, password, role });
    if (response.data.success && response.data.user) {
      setAquaSession({
        user: response.data.user,
        token: response.data.token,
        loginTime: Date.now()
      });
    }
    return response.data;
  },

  logout: () => {
    clearAquaSession();
    window.location.href = '/aquaculture';
  },

  getCurrentUser: () => {
    const session = getAquaSession();
    return session?.user || null;
  },

  isAuthenticated: () => {
    const session = getAquaSession();
    return !!(session?.user && session?.token);
  },

  validateSession: async () => {
    try {
      const response = await aquaApi.get('/auth/validate');
      return response.data.valid;
    } catch {
      return false;
    }
  }
};

// =====================================================
// FARMER API
// =====================================================
export const aquaFarmerAPI = {
  // Dashboard Stats
  getDashboardStats: async () => {
    const response = await aquaApi.get('/farmer/dashboard');
    return response.data;
  },

  // Farms
  getFarms: async () => {
    const response = await aquaApi.get('/farmer/farms');
    return response.data;
  },

  getFarmById: async (farmId) => {
    const response = await aquaApi.get(`/farmer/farms/${farmId}`);
    return response.data;
  },

  createFarm: async (farmData) => {
    const response = await aquaApi.post('/farmer/farms', farmData);
    return response.data;
  },

  updateFarm: async (farmId, farmData) => {
    const response = await aquaApi.put(`/farmer/farms/${farmId}`, farmData);
    return response.data;
  },

  // Ponds
  getPonds: async (farmId = null) => {
    const params = farmId ? `?farmId=${farmId}` : '';
    const response = await aquaApi.get(`/farmer/ponds${params}`);
    return response.data;
  },

  getPondById: async (pondId) => {
    const response = await aquaApi.get(`/farmer/ponds/${pondId}`);
    return response.data;
  },

  createPond: async (pondData) => {
    const response = await aquaApi.post('/farmer/ponds', pondData);
    return response.data;
  },

  updatePond: async (pondId, pondData) => {
    const response = await aquaApi.put(`/farmer/ponds/${pondId}`, pondData);
    return response.data;
  },

  // Stocking
  createStocking: async (stockingData) => {
    const response = await aquaApi.post('/farmer/stockings', stockingData);
    return response.data;
  },

  getStockings: async (pondId = null) => {
    const params = pondId ? `?pondId=${pondId}` : '';
    const response = await aquaApi.get(`/farmer/stockings${params}`);
    return response.data;
  },

  // Water Quality
  recordWaterQuality: async (qualityData) => {
    const response = await aquaApi.post('/farmer/water-quality', qualityData);
    return response.data;
  },

  getWaterQualityHistory: async (pondId, days = 30) => {
    const response = await aquaApi.get(`/farmer/water-quality/${pondId}?days=${days}`);
    return response.data;
  },

  // Feed Records
  recordFeed: async (feedData) => {
    const response = await aquaApi.post('/farmer/feed', feedData);
    return response.data;
  },

  getFeedHistory: async (pondId, days = 30) => {
    const response = await aquaApi.get(`/farmer/feed/${pondId}?days=${days}`);
    return response.data;
  },

  // Growth Sampling
  recordGrowthSample: async (sampleData) => {
    const response = await aquaApi.post('/farmer/growth-samples', sampleData);
    return response.data;
  },

  getGrowthHistory: async (pondId) => {
    const response = await aquaApi.get(`/farmer/growth-samples/${pondId}`);
    return response.data;
  },

  // Harvests
  createHarvest: async (harvestData) => {
    const response = await aquaApi.post('/farmer/harvests', harvestData);
    return response.data;
  },

  getHarvests: async (farmId = null) => {
    const params = farmId ? `?farmId=${farmId}` : '';
    const response = await aquaApi.get(`/farmer/harvests${params}`);
    return response.data;
  },

  getHarvestById: async (harvestId) => {
    const response = await aquaApi.get(`/farmer/harvests/${harvestId}`);
    return response.data;
  }
};

// =====================================================
// INSPECTOR API
// =====================================================
export const aquaInspectorAPI = {
  // Dashboard
  getDashboardStats: async () => {
    const response = await aquaApi.get('/inspector/dashboard');
    return response.data;
  },

  // Pending Inspections
  getPendingInspections: async () => {
    const response = await aquaApi.get('/inspector/pending');
    return response.data;
  },

  // Get harvest details for inspection
  getHarvestForInspection: async (harvestId) => {
    const response = await aquaApi.get(`/inspector/harvest/${harvestId}`);
    return response.data;
  },

  // Submit Inspection
  submitInspection: async (inspectionData) => {
    const response = await aquaApi.post('/inspector/inspect', inspectionData);
    return response.data;
  },

  // Get inspection history
  getInspectionHistory: async () => {
    const response = await aquaApi.get('/inspector/history');
    return response.data;
  },

  // Get inspection by ID
  getInspectionById: async (inspectionId) => {
    const response = await aquaApi.get(`/inspector/inspection/${inspectionId}`);
    return response.data;
  },

  // Farm Audits
  getFarmsForAudit: async () => {
    const response = await aquaApi.get('/inspector/farms');
    return response.data;
  },

  submitFarmAudit: async (auditData) => {
    const response = await aquaApi.post('/inspector/farm-audit', auditData);
    return response.data;
  }
};

// =====================================================
// PACKER API
// =====================================================
export const aquaPackerAPI = {
  // Dashboard
  getDashboardStats: async () => {
    const response = await aquaApi.get('/packer/dashboard');
    return response.data;
  },

  // Get approved harvests ready for packing
  getApprovedHarvests: async () => {
    const response = await aquaApi.get('/packer/approved-harvests');
    return response.data;
  },

  // Get available crates
  getCrates: async () => {
    const response = await aquaApi.get('/packer/crates');
    return response.data;
  },

  // Scan/Inspect crate
  inspectCrate: async (crateCode) => {
    const response = await aquaApi.get(`/packer/crates/${crateCode}`);
    return response.data;
  },

  // Pack a crate
  packCrate: async (packingData) => {
    const response = await aquaApi.post('/packer/pack', packingData);
    return response.data;
  },

  // Dispatch crate
  dispatchCrate: async (crateId, dispatchData) => {
    const response = await aquaApi.post(`/packer/dispatch/${crateId}`, dispatchData);
    return response.data;
  },

  // Get packing history
  getPackingHistory: async () => {
    const response = await aquaApi.get('/packer/history');
    return response.data;
  }
};

// =====================================================
// TRACEABILITY API
// =====================================================
export const aquaTraceAPI = {
  // Public traceability - scan QR code
  traceByQR: async (qrCode) => {
    const response = await aquaApi.get(`/trace/${qrCode}`);
    return response.data;
  },

  // Get full chain for a product
  getTraceChain: async (qrCode) => {
    const response = await aquaApi.get(`/trace/chain/${qrCode}`);
    return response.data;
  }
};

// =====================================================
// QR GENERATION API
// =====================================================
export const aquaQRAPI = {
  // Generate harvest QR
  generateHarvestQR: async (harvestId) => {
    const response = await aquaApi.post('/qr/harvest', { harvestId });
    return response.data;
  },

  // Generate crate QR
  generateCrateQR: async (crateData) => {
    const response = await aquaApi.post('/qr/crate', crateData);
    return response.data;
  },

  // Generate batch QR codes
  generateBatchQR: async (type, quantity, prefix) => {
    const response = await aquaApi.post('/qr/batch', { type, quantity, prefix });
    return response.data;
  }
};

// Export all APIs
export default {
  auth: aquaAuthAPI,
  farmer: aquaFarmerAPI,
  inspector: aquaInspectorAPI,
  packer: aquaPackerAPI,
  trace: aquaTraceAPI,
  qr: aquaQRAPI
};
