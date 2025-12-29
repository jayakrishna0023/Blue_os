// Utility functions

// Get browser ID for session isolation
const getBrowserId = () => {
  let browserId = sessionStorage.getItem('blueos_browser_id');
  if (!browserId) {
    browserId = 'browser_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    sessionStorage.setItem('blueos_browser_id', browserId);
  }
  return browserId;
};

// Session storage keys
const getSessionKey = (sessionId) => `blueos_session_${sessionId}`;
const getCurrentSessionIdKey = () => `blueos_current_session_${getBrowserId()}`;

// Get current session
const getCurrentSession = () => {
  try {
    const sessionId = sessionStorage.getItem(getCurrentSessionIdKey());
    if (!sessionId) return null;
    
    const sessionData = sessionStorage.getItem(getSessionKey(sessionId));
    if (!sessionData) return null;
    
    return JSON.parse(sessionData);
  } catch (e) {
    return null;
  }
};

export const getCurrentUser = () => {
  // 1. Try current session (preferred - supports multi-login)
  const session = getCurrentSession();
  if (session?.user) {
    return session.user;
  }
  
  // 2. Try Legacy LocalStorage (backwards compatibility)
  try {
    const localUser = sessionStorage.getItem('user');
    if (localUser) return JSON.parse(localUser);
  } catch (e) {
    // Ignore
  }

  // 3. Try SessionStorage
  try {
    const sessionUser = sessionStorage.getItem('user');
    if (sessionUser) return JSON.parse(sessionUser);
  } catch (e) {
    // Ignore
  }

  // 4. Try Memory Fallback
  if (window.currentUser) {
    return window.currentUser;
  }

  return null;
};

// Check if user is authenticated
export const isAuthenticated = () => {
  const session = getCurrentSession();
  return session?.token != null;
};

// Get current auth token
export const getAuthToken = () => {
  const session = getCurrentSession();
  return session?.token || null;
};

export const generateTripCode = async () => {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const timeStr = now.getTime().toString().slice(-6);
  const random = Math.random().toString(36).substr(2, 3).toUpperCase();
  return `TRIP_${dateStr}_${timeStr}_${random}`;
};

export const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const getGeolocation = (options = {}) => {
  const defaultOptions = {
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 0
  };
  
  const mergedOptions = { ...defaultOptions, ...options };
  
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }
    
    // Try high accuracy first
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          altitudeAccuracy: position.coords.altitudeAccuracy,
          heading: position.coords.heading,
          speed: position.coords.speed,
          timestamp: position.timestamp
        });
      },
      (error) => {
        // If high accuracy fails, try without it
        if (mergedOptions.enableHighAccuracy) {
          console.warn('High accuracy location failed, trying low accuracy...');
          navigator.geolocation.getCurrentPosition(
            (position) => {
              resolve({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                altitude: position.coords.altitude,
                altitudeAccuracy: position.coords.altitudeAccuracy,
                heading: position.coords.heading,
                speed: position.coords.speed,
                timestamp: position.timestamp,
                lowAccuracy: true
              });
            },
            (fallbackError) => {
              reject(fallbackError);
            },
            { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
          );
        } else {
          reject(error);
        }
      },
      mergedOptions
    );
  });
};

// Watch location with continuous updates
export const watchGeolocation = (callback, errorCallback, options = {}) => {
  const defaultOptions = {
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 5000
  };
  
  const mergedOptions = { ...defaultOptions, ...options };
  
  if (!navigator.geolocation) {
    if (errorCallback) errorCallback(new Error('Geolocation is not supported'));
    return null;
  }
  
  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      callback({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude,
        heading: position.coords.heading,
        speed: position.coords.speed,
        timestamp: position.timestamp
      });
    },
    (error) => {
      if (errorCallback) errorCallback(error);
    },
    mergedOptions
  );
  
  return watchId;
};

// Stop watching location
export const clearGeolocationWatch = (watchId) => {
  if (watchId && navigator.geolocation) {
    navigator.geolocation.clearWatch(watchId);
  }
};

export const getLocationName = async (lat, lng) => {
  try {
    // Try primary service
    const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
    const data = await response.json();
    
    // Build a more detailed location string
    const parts = [];
    if (data.locality) parts.push(data.locality);
    else if (data.city) parts.push(data.city);
    
    if (data.principalSubdivision) parts.push(data.principalSubdivision);
    if (data.countryName) parts.push(data.countryName);
    
    if (parts.length > 0) {
      return parts.join(', ');
    }
    
    // Fallback to coordinates
    return `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`;
  } catch (error) {
    console.error('Error fetching location name:', error);
    // Return formatted coordinates as fallback
    return `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`;
  }
};

// Get location with name in one call
export const getFullLocation = async (options = {}) => {
  try {
    const coords = await getGeolocation(options);
    const name = await getLocationName(coords.latitude, coords.longitude);
    return {
      ...coords,
      name: name
    };
  } catch (error) {
    throw error;
  }
};

export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
};

export const compressImage = async (base64Str, maxWidth = 800, quality = 0.7) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
  });
};
