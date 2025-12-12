import React, { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, X, Zap, ZapOff, MapPin, AlertTriangle } from 'lucide-react';

const CameraModal = ({ isOpen, onClose, onCapture, title = "Take Photo", metadata = {} }) => {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [facingMode, setFacingMode] = useState('environment');
  const [flash, setFlash] = useState(false);
  const [error, setError] = useState('');
  const [location, setLocation] = useState(null);
  const [locError, setLocError] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      startCamera();
      getLocation();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen, facingMode]);

  const getLocation = () => {
    if (!navigator.geolocation) {
      setLocError('Geolocation is not supported by your browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude.toFixed(4),
          long: position.coords.longitude.toFixed(4),
          accuracy: position.coords.accuracy
        });
        setLocError('');
      },
      (err) => {
        setLocError('Location access denied. Required for verification.');
        console.error(err);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
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
        alert('Flashlight not supported on this device');
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

  const capture = () => {
    if (!videoRef.current || !location) {
        if (!location) alert("Waiting for GPS location...");
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
    
    // --- WATERMARKING LOGIC ---
    const width = canvas.width;
    const height = canvas.height;
    const fontSize = Math.max(16, Math.floor(width * 0.025)); // Responsive font size
    const padding = Math.floor(width * 0.02);
    
    // 1. Branding (Top Right)
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 4;
    ctx.fillText('BlueOS by RootVerse', width - padding, padding);
    
    // 2. Metadata Overlay (Bottom Left)
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.font = `${fontSize}px monospace`;
    
    const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const lines = [
      `Vessel: ${metadata?.vesselCode || 'Unknown'}`,
      `Time: ${timestamp} UTC`,
      `Loc: ${location ? location.lat : '...'} N, ${location ? location.long : '...'} E`,
      `Purpose: ${metadata?.purpose || 'Verification'}`
    ];
    
    // Draw background for metadata for better readability
    const lineHeight = fontSize * 1.5;
    const boxHeight = lines.length * lineHeight + padding * 2;
    
    // Gradient background at bottom
    const gradient = ctx.createLinearGradient(0, height - boxHeight, 0, height);
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.8)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, height - boxHeight - 50, width, boxHeight + 50);
    
    // Draw text lines
    ctx.fillStyle = '#ffffff';
    lines.reverse().forEach((line, index) => {
      ctx.fillText(line, padding, height - padding - (index * lineHeight));
    });

    // Generate Image
    const imageSrc = canvas.toDataURL('image/jpeg', 0.8);
    onCapture(imageSrc);
    setIsCapturing(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-black/50 absolute top-0 w-full z-10 backdrop-blur-sm">
        <div className="flex items-center gap-2">
            <h3 className="text-white font-medium">{title}</h3>
            {location ? (
                <span className="flex items-center text-green-400 text-xs bg-green-400/20 px-2 py-1 rounded-full">
                    <MapPin className="w-3 h-3 mr-1" /> GPS Active
                </span>
            ) : (
                <span className="flex items-center text-yellow-400 text-xs bg-yellow-400/20 px-2 py-1 rounded-full animate-pulse">
                    <MapPin className="w-3 h-3 mr-1" /> Finding GPS...
                </span>
            )}
        </div>
        <button onClick={onClose} className="p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Video Feed */}
      <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
        {error ? (
          <div className="text-white text-center p-4 bg-red-500/20 rounded-xl m-4 border border-red-500/50">
            <AlertTriangle className="w-12 h-12 mx-auto mb-2 text-red-400" />
            <p>{error}</p>
          </div>
        ) : (
            <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-cover"
            />
        )}
        
        {/* Location Error Overlay */}
        {locError && !error && (
            <div className="absolute top-20 left-4 right-4 bg-red-500/80 text-white p-3 rounded-lg text-sm text-center backdrop-blur-md">
                {locError}
            </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-black/80 p-6 pb-8 backdrop-blur-md">
        <div className="flex justify-around items-center max-w-md mx-auto">
          <button 
            onClick={toggleFlash} 
            className={`p-4 rounded-full transition-all ${flash ? 'bg-yellow-400 text-black' : 'bg-slate-800 text-white'}`}
          >
            {flash ? <Zap className="w-6 h-6" /> : <ZapOff className="w-6 h-6" />}
          </button>

          <button 
            onClick={capture}
            disabled={!location || !!error || isCapturing}
            className={`w-20 h-20 rounded-full border-4 flex items-center justify-center transition-all transform active:scale-95 ${(!location || !!error) ? 'border-slate-600 opacity-50 cursor-not-allowed' : 'border-white cursor-pointer hover:scale-105'}`}
          >
            <div className={`w-16 h-16 rounded-full ${isCapturing ? 'bg-red-500 animate-pulse' : 'bg-white'}`}></div>
          </button>

          <button 
            onClick={toggleCamera} 
            className="p-4 bg-slate-800 rounded-full text-white hover:bg-slate-700 transition-all"
          >
            <RefreshCw className="w-6 h-6" />
          </button>
        </div>
        <p className="text-center text-slate-400 text-xs mt-4">
            {!location ? "Waiting for GPS signal..." : "Tap shutter to capture & watermark"}
        </p>
      </div>
    </div>
  );
};

export default CameraModal;