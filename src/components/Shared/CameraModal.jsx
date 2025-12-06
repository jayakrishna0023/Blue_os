import React, { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, X, Zap, ZapOff } from 'lucide-react';

const CameraModal = ({ isOpen, onClose, onCapture, title = "Take Photo" }) => {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [facingMode, setFacingMode] = useState('environment');
  const [flash, setFlash] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen, facingMode]);

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
      await track.applyConstraints({
        advanced: [{ torch: !flash }]
      });
      setFlash(!flash);
    } catch (err) {
      console.warn('Flash not supported', err);
      // Fallback or UI feedback
    }
  };

  const capture = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0);
    
    const imageSrc = canvas.toDataURL('image/jpeg', 0.8);
    onCapture(imageSrc);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-black/50 absolute top-0 w-full z-10">
        <h3 className="text-white font-medium">{title}</h3>
        <button onClick={onClose} className="p-2 bg-white/10 rounded-full text-white">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Video Feed */}
      <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
        {error ? (
          <div className="text-white text-center p-4">
            <p className="text-red-400 mb-2">Camera Error</p>
            <p className="text-sm text-slate-400">{error}</p>
          </div>
        ) : (
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Controls */}
      <div className="bg-black/80 p-6 pb-10 flex justify-around items-center">
        <button 
          onClick={toggleFlash}
          className={`p-3 rounded-full ${flash ? 'bg-yellow-500 text-black' : 'bg-white/10 text-white'}`}
        >
          {flash ? <Zap className="w-6 h-6" /> : <ZapOff className="w-6 h-6" />}
        </button>

        <button 
          onClick={capture}
          className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center bg-white/20 active:bg-white/50 transition-all"
        >
          <div className="w-16 h-16 bg-white rounded-full"></div>
        </button>

        <button 
          onClick={toggleCamera}
          className="p-3 bg-white/10 rounded-full text-white"
        >
          <RefreshCw className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default CameraModal;
