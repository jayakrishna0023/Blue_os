import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, RefreshCw, X, Zap, ZapOff, MapPin, AlertTriangle, Navigation, Signal, Crosshair } from 'lucide-react';
import { useToast } from './Toast';

const CameraModal = ({ isOpen, onClose, onCapture, title = "Take Photo", metadata = {} }) => {
  const toast = useToast();
  const videoRef = useRef(null);
  const watchIdRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [facingMode, setFacingMode] = useState('environment');
  const [flash, setFlash] = useState(false);
  const [error, setError] = useState('');
  const [location, setLocation] = useState(null);
  const [locError, setLocError] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);
  const [locationAccuracy, setLocationAccuracy] = useState(null);
  const [isLocating, setIsLocating] = useState(false);

  // Cleanup function
  const cleanup = useCallback(() => {
    // Stop camera
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    // Stop location watching
    if (watchIdRef.current && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, [stream]);

  useEffect(() => {
    if (isOpen) {
      startCamera();
      startLocationTracking();
    } else {
      cleanup();
    }
    return () => cleanup();
  }, [isOpen, facingMode]);

  // Advanced location tracking with continuous updates
  const startLocationTracking = () => {
    if (!navigator.geolocation) {
      setLocError('Geolocation not supported');
      return;
    }
    
    setIsLocating(true);
    setLocError('');
    
    // First, try to get a quick position
    navigator.geolocation.getCurrentPosition(
      (position) => {
        updateLocation(position);
      },
      (err) => {
        console.warn('Initial location fetch failed:', err.message);
      },
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
    );
    
    // Then start watching for high-accuracy updates
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        updateLocation(position);
        setLocError('');
      },
      (err) => {
        console.error('Location watch error:', err);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setLocError('Location permission denied. Please enable in settings.');
            break;
          case err.POSITION_UNAVAILABLE:
            setLocError('Location unavailable. Move to open area.');
            break;
          case err.TIMEOUT:
            setLocError('Location timeout. Retrying...');
            // Retry with lower accuracy
            retryWithLowAccuracy();
            break;
          default:
            setLocError('Could not get location');
        }
      },
      { 
        enableHighAccuracy: true, 
        timeout: 15000, 
        maximumAge: 5000 
      }
    );
  };
  
  const retryWithLowAccuracy = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        updateLocation(position);
        setLocError('');
      },
      (err) => {
        setLocError('Location unavailable. Check GPS settings.');
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 30000 }
    );
  };
  
  const updateLocation = (position) => {
    const accuracy = position.coords.accuracy;
    setLocation({
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      latDisplay: position.coords.latitude.toFixed(6),
      lngDisplay: position.coords.longitude.toFixed(6),
      accuracy: accuracy,
      altitude: position.coords.altitude,
      heading: position.coords.heading,
      speed: position.coords.speed,
      timestamp: position.timestamp
    });
    setLocationAccuracy(accuracy);
    setIsLocating(false);
  };
  
  // Get accuracy indicator color
  const getAccuracyColor = () => {
    if (!locationAccuracy) return 'text-gray-400';
    if (locationAccuracy <= 10) return 'text-green-400'; // Excellent
    if (locationAccuracy <= 30) return 'text-green-300'; // Good
    if (locationAccuracy <= 100) return 'text-yellow-400'; // Fair
    return 'text-orange-400'; // Poor
  };
  
  const getAccuracyLabel = () => {
    if (!locationAccuracy) return 'Locating...';
    if (locationAccuracy <= 10) return 'Excellent GPS';
    if (locationAccuracy <= 30) return 'Good GPS';
    if (locationAccuracy <= 100) return 'Fair GPS';
    return 'Weak GPS';
  };

  const startCamera = async () => {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
      setError('');
    } catch (err) {
      console.error("Camera Error:", err);
      setError('Could not access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const toggleFlash = async () => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    try {
      const capabilities = track.getCapabilities();
      if (!capabilities.torch) {
        toast.warning('Flashlight not supported on this device', 'Not Supported');
        return;
      }
      await track.applyConstraints({
        advanced: [{ torch: !flash }]
      });
      setFlash(!flash);
    } catch (err) {
      console.warn('Flash error', err);
    }
  };

  // Re-acquire location manually
  const refreshLocation = () => {
    setIsLocating(true);
    setLocError('');
    startLocationTracking();
  };

  const capture = () => {
    if (!videoRef.current) {
      toast.error("Camera not ready", "Error");
      return;
    }
    
    if (!location) {
      toast.warning("Waiting for GPS location...", "Location Required");
      return;
    }
    
    setIsCapturing(true);

    const canvas = document.createElement('canvas');
    const video = videoRef.current;
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    
    // Draw video frame
    ctx.drawImage(video, 0, 0);
    
    // --- ADVANCED WATERMARKING ---
    const width = canvas.width;
    const height = canvas.height;
    const fontSize = Math.max(14, Math.floor(width * 0.022));
    const padding = Math.floor(width * 0.02);
    
    // Enable shadow for all text
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    
    // 1. Branding (Top Right)
    ctx.font = `bold ${fontSize * 1.1}px sans-serif`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText('BlueOS by RootVerse', width - padding, padding);
    
    // 2. GPS Accuracy Indicator (Top Left)
    ctx.textAlign = 'left';
    const accuracyText = location.accuracy 
      ? `GPS ±${Math.round(location.accuracy)}m` 
      : 'GPS Active';
    ctx.font = `${fontSize * 0.9}px monospace`;
    ctx.fillStyle = location.accuracy <= 30 ? '#22c55e' : (location.accuracy <= 100 ? '#eab308' : '#f97316');
    ctx.fillText(`📍 ${accuracyText}`, padding, padding);
    
    // 3. Metadata Overlay (Bottom)
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.font = `${fontSize}px monospace`;
    ctx.fillStyle = '#ffffff';
    
    const now = new Date();
    const timestamp = now.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    
    const lines = [
      `📌 ${location.latDisplay}°N, ${location.lngDisplay}°E`,
      `🕐 ${timestamp} IST`,
      `🚢 ${metadata?.vesselCode || metadata?.tripCode || 'BlueOS Capture'}`,
      `📋 ${metadata?.purpose || 'Verification Photo'}`
    ];
    
    // Draw gradient background for metadata
    const lineHeight = fontSize * 1.6;
    const boxHeight = lines.length * lineHeight + padding * 2.5;
    
    const gradient = ctx.createLinearGradient(0, height - boxHeight - 20, 0, height);
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(0.3, 'rgba(0,0,0,0.5)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.85)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, height - boxHeight - 20, width, boxHeight + 20);
    
    // Draw text lines
    ctx.fillStyle = '#ffffff';
    lines.reverse().forEach((line, index) => {
      ctx.fillText(line, padding, height - padding - (index * lineHeight));
    });
    
    // 4. Hash/Verification stripe (very bottom)
    const hash = `#${Date.now().toString(36).toUpperCase()}`;
    ctx.font = `${fontSize * 0.7}px monospace`;
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.textAlign = 'right';
    ctx.fillText(hash, width - padding, height - 5);

    // Generate Image
    const imageSrc = canvas.toDataURL('image/jpeg', 0.85);
    onCapture(imageSrc);
    setIsCapturing(false);
    cleanup();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-black/60 absolute top-0 w-full z-10 backdrop-blur-md">
        <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-white font-medium">{title}</h3>
            {location ? (
                <div className="flex items-center gap-2">
                    <span className={`flex items-center text-xs px-2 py-1 rounded-full ${getAccuracyColor()} bg-white/10`}>
                        <Crosshair className="w-3 h-3 mr-1" /> 
                        {getAccuracyLabel()}
                    </span>
                    {locationAccuracy && (
                        <span className="text-xs text-white/60">
                            ±{Math.round(locationAccuracy)}m
                        </span>
                    )}
                </div>
            ) : isLocating ? (
                <span className="flex items-center text-yellow-400 text-xs bg-yellow-400/20 px-2 py-1 rounded-full animate-pulse">
                    <Navigation className="w-3 h-3 mr-1 animate-spin" /> Acquiring GPS...
                </span>
            ) : (
                <button 
                    onClick={refreshLocation}
                    className="flex items-center text-blue-400 text-xs bg-blue-400/20 px-2 py-1 rounded-full hover:bg-blue-400/30"
                >
                    <MapPin className="w-3 h-3 mr-1" /> Retry GPS
                </button>
            )}
        </div>
        <button onClick={onClose} className="p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors">
          <X className="w-6 h-6" />
        </button>
      </div>
      
      {/* GPS Coordinates Display */}
      {location && (
        <div className="absolute top-16 left-4 right-4 z-10">
          <div className="bg-black/50 backdrop-blur-md rounded-lg px-3 py-2 text-xs text-white/80 font-mono flex items-center justify-between">
            <span>📍 {location.latDisplay}°N, {location.lngDisplay}°E</span>
            <button onClick={refreshLocation} className="p-1 hover:bg-white/10 rounded">
              <RefreshCw className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      )}

      {/* Video Feed */}
      <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
        {error ? (
          <div className="text-white text-center p-4 bg-red-500/20 rounded-xl m-4 border border-red-500/50">
            <AlertTriangle className="w-12 h-12 mx-auto mb-2 text-red-400" />
            <p>{error}</p>
            <button 
              onClick={startCamera}
              className="mt-3 px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20"
            >
              Retry Camera
            </button>
          </div>
        ) : (
            <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted
                className="w-full h-full object-cover"
            />
        )}
        
        {/* Location Error Overlay */}
        {locError && !error && (
            <div className="absolute top-28 left-4 right-4 bg-red-500/90 text-white p-3 rounded-lg text-sm text-center backdrop-blur-md">
                <AlertTriangle className="w-4 h-4 inline mr-2" />
                {locError}
                <button 
                  onClick={refreshLocation}
                  className="ml-3 px-2 py-1 bg-white/20 rounded text-xs hover:bg-white/30"
                >
                  Retry
                </button>
            </div>
        )}
        
        {/* Capture frame guide */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3/4 h-1/2 border-2 border-white/30 rounded-2xl"></div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-black/80 p-6 pb-8 backdrop-blur-md">
        <div className="flex justify-around items-center max-w-md mx-auto">
          <button 
            onClick={toggleFlash} 
            className={`p-4 rounded-full transition-all ${flash ? 'bg-yellow-400 text-black' : 'bg-slate-800 text-white hover:bg-slate-700'}`}
          >
            {flash ? <Zap className="w-6 h-6" /> : <ZapOff className="w-6 h-6" />}
          </button>

          <button 
            onClick={capture}
            disabled={!location || !!error || isCapturing}
            className={`w-20 h-20 rounded-full border-4 flex items-center justify-center transition-all transform active:scale-95 ${
              (!location || !!error) 
                ? 'border-slate-600 opacity-50 cursor-not-allowed' 
                : 'border-white cursor-pointer hover:scale-105'
            }`}
          >
            <div className={`w-16 h-16 rounded-full transition-colors ${
              isCapturing 
                ? 'bg-red-500 animate-pulse' 
                : (!location || !!error) 
                  ? 'bg-slate-500'
                  : 'bg-white'
            }`}></div>
          </button>

          <button 
            onClick={toggleCamera} 
            className="p-4 bg-slate-800 rounded-full text-white hover:bg-slate-700 transition-all"
          >
            <RefreshCw className="w-6 h-6" />
          </button>
        </div>
        <p className="text-center text-slate-400 text-xs mt-4">
            {!location 
              ? "📡 Acquiring GPS signal..." 
              : isCapturing 
                ? "📸 Capturing..."
                : `✓ GPS locked (±${Math.round(locationAccuracy || 0)}m) - Tap to capture`
            }
        </p>
      </div>
    </div>
  );
};

export default CameraModal;