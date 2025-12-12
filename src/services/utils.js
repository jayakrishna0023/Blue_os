// Utility functions

export const getCurrentUser = () => {
  // 1. Try LocalStorage
  try {
    const localUser = localStorage.getItem('user');
    if (localUser) return JSON.parse(localUser);
  } catch (e) {
    // Ignore
  }

  // 2. Try SessionStorage
  try {
    const sessionUser = sessionStorage.getItem('user');
    if (sessionUser) return JSON.parse(sessionUser);
  } catch (e) {
    // Ignore
  }

  // 3. Try Memory Fallback
  if (window.currentUser) {
    return window.currentUser;
  }

  return null;
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

export const getGeolocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
    } else {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          reject(error);
        }
      );
    }
  });
};

export const getLocationName = async (lat, lng) => {
  try {
    const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
    const data = await response.json();
    return data.city || data.locality || 'Unknown Location';
  } catch (error) {
    console.error('Error fetching location name:', error);
    return 'Unknown Location';
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
