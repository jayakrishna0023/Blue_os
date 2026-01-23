import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, XCircle, Camera, RefreshCw, Keyboard, Upload, Flashlight, SwitchCamera, CheckCircle, AlertTriangle } from 'lucide-react';

const QRScannerModal = ({ isOpen, onClose, onScan, title = "Scan QR Code", allowManualEntry = true }) => {
  const scannerRef = useRef(null);
  const scannerInstanceRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const [scanError, setScanError] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [hasFlash, setHasFlash] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  
  const hasScannedRef = useRef(false);
  
  // Refs for callbacks to avoid stale closures
  const onScanRef = useRef(onScan);
  const onCloseRef = useRef(onClose);
  
  useEffect(() => {
    onScanRef.current = onScan;
    onCloseRef.current = onClose;
  }, [onScan, onClose]);

  // Get available cameras
  const getCameras = async () => {
    try {
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length > 0) {
        setCameras(devices);
        // Prefer back camera on mobile
        const backCamera = devices.find(d => 
          d.label.toLowerCase().includes('back') || 
          d.label.toLowerCase().includes('rear') ||
          d.label.toLowerCase().includes('environment')
        );
        setSelectedCamera(backCamera?.id || devices[0].id);
        return devices;
      }
      return [];
    } catch (err) {
      console.error('Error getting cameras:', err);
      setScanError('Could not access cameras. Please check permissions.');
      return [];
    }
  };

  // Start scanning with selected camera
  const startScanning = async (cameraId) => {
    if (!cameraId) return;
    
    if (scannerInstanceRef.current) {
      try {
        await scannerInstanceRef.current.stop();
      } catch (e) {
        console.warn('Stop error:', e);
      }
    }
    
    setIsInitializing(true);
    setScanError('');
    hasScannedRef.current = false;
    
    try {
      const scanner = new Html5Qrcode("qr-reader");
      scannerInstanceRef.current = scanner;
      
      // Detect device type for optimal settings
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      
      // Adaptive QR box size based on screen
      const screenWidth = Math.min(window.innerWidth - 48, 400);
      const qrBoxSize = isMobile ? Math.floor(screenWidth * 0.65) : 220;
      
      const config = {
        fps: isMobile ? 15 : 10,
        qrbox: { width: qrBoxSize, height: qrBoxSize },
        aspectRatio: isMobile ? 1.0 : 1.33,
        disableFlip: false,
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true
        }
      };
      
      await scanner.start(
        cameraId,
        config,
        (decodedText) => {
          if (hasScannedRef.current) return;
          hasScannedRef.current = true;
          
          // Vibrate on success (mobile)
          if (navigator.vibrate) {
            navigator.vibrate(100);
          }
          
          setScanSuccess(true);
          
          // Brief delay to show success state
          setTimeout(() => {
            handleSuccessfulScan(decodedText);
          }, 300);
        },
        (errorMessage) => {
          // Silent - just scanning attempts
        }
      );
      
      setIsScanning(true);
      setIsInitializing(false);
      
      // Check for flash/torch support
      try {
        const track = scanner.getRunningTrackCameraCapabilities();
        if (track && track.torchFeature && track.torchFeature().isSupported()) {
          setHasFlash(true);
        }
      } catch (e) {
        setHasFlash(false);
      }
      
    } catch (err) {
      console.error('Scanner start error:', err);
      setIsInitializing(false);
      
      if (err.name === 'NotAllowedError') {
        setScanError('Camera permission denied. Please allow camera access in your browser settings.');
      } else if (err.name === 'NotFoundError') {
        setScanError('No camera found. Please connect a camera or use manual entry.');
      } else if (err.name === 'NotReadableError') {
        setScanError('Camera is in use by another app. Please close other apps using the camera.');
      } else {
        setScanError(`Camera error: ${err.message || 'Unknown error'}. Try manual entry instead.`);
      }
    }
  };

  // Handle successful scan
  const handleSuccessfulScan = async (code) => {
    // Stop camera immediately
    setIsScanning(false);
    await stopScanner();
    
    // Reset state
    setScanSuccess(false);
    hasScannedRef.current = false;
    
    // Call callbacks after camera is fully stopped
    onScanRef.current(code);
    onCloseRef.current();
  };

  // Stop scanner and release all camera resources
  const stopScanner = async () => {
    // First, stop the Html5Qrcode instance
    if (scannerInstanceRef.current) {
      try {
        if (flashOn) {
          await scannerInstanceRef.current.turnOffFlash().catch(() => {});
        }
        const state = scannerInstanceRef.current.getState();
        if (state === 2) { // Html5QrcodeScannerState.SCANNING
          await scannerInstanceRef.current.stop();
        }
        // Clear the scanner to release DOM elements
        await scannerInstanceRef.current.clear().catch(() => {});
      } catch (e) {
        console.warn('Stop scanner error:', e);
      }
      scannerInstanceRef.current = null;
    }
    
    // Forcefully stop all video tracks to ensure camera is released
    try {
      const videoElements = document.querySelectorAll('#qr-reader video');
      videoElements.forEach(video => {
        if (video.srcObject) {
          const tracks = video.srcObject.getTracks();
          tracks.forEach(track => {
            track.stop();
            console.log('Stopped track:', track.label);
          });
          video.srcObject = null;
        }
      });
      
      // Also check for any lingering streams
      if (navigator.mediaDevices) {
        // Get all active media streams and stop them
        const allVideos = document.querySelectorAll('video');
        allVideos.forEach(video => {
          if (video.srcObject && video.srcObject instanceof MediaStream) {
            video.srcObject.getTracks().forEach(track => track.stop());
            video.srcObject = null;
          }
        });
      }
    } catch (e) {
      console.warn('Error stopping video tracks:', e);
    }
    
    setIsScanning(false);
    setFlashOn(false);
    setHasFlash(false);
  };

  // Toggle flash
  const toggleFlash = async () => {
    if (!scannerInstanceRef.current || !hasFlash) return;
    
    try {
      if (flashOn) {
        await scannerInstanceRef.current.turnOffFlash();
        setFlashOn(false);
      } else {
        await scannerInstanceRef.current.turnOnFlash();
        setFlashOn(true);
      }
    } catch (e) {
      console.warn('Flash toggle error:', e);
    }
  };

  // Switch camera
  const switchCamera = async () => {
    if (cameras.length < 2) return;
    
    const currentIndex = cameras.findIndex(c => c.id === selectedCamera);
    const nextIndex = (currentIndex + 1) % cameras.length;
    const nextCamera = cameras[nextIndex];
    
    setSelectedCamera(nextCamera.id);
    await startScanning(nextCamera.id);
  };

  // Handle file upload (for QR from image)
  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setScanError('');
    
    try {
      // Stop camera first
      await stopScanner();
      
      const scanner = new Html5Qrcode("qr-reader");
      const result = await scanner.scanFile(file, true);
      
      if (result) {
        if (navigator.vibrate) navigator.vibrate(100);
        setScanSuccess(true);
        setTimeout(() => {
          handleSuccessfulScan(result);
        }, 300);
      }
      
      await scanner.clear();
    } catch (err) {
      console.error('File scan error:', err);
      setScanError('No QR code found in image. Try another image or scan directly.');
      // Restart camera
      if (selectedCamera) {
        setTimeout(() => startScanning(selectedCamera), 500);
      }
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle manual entry submit
  const handleManualSubmit = () => {
    const code = manualCode.trim();
    if (code) {
      if (navigator.vibrate) navigator.vibrate(100);
      setScanSuccess(true);
      setTimeout(() => {
        handleSuccessfulScan(code);
      }, 300);
    }
  };

  // Handle close
  const handleClose = useCallback(async () => {
    // Immediately set scanning to false to prevent re-renders
    setIsScanning(false);
    
    // Stop scanner and release camera
    await stopScanner();
    
    // Reset all state
    setShowManualEntry(false);
    setManualCode('');
    setScanError('');
    setScanSuccess(false);
    hasScannedRef.current = false;
    
    // Call onClose callback
    onCloseRef.current();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Force stop all cameras when component unmounts
      stopScanner();
    };
  }, []);

  // Initialize on open
  useEffect(() => {
    if (isOpen) {
      setScanSuccess(false);
      setShowManualEntry(false);
      setManualCode('');
      setScanError('');
      hasScannedRef.current = false;
      
      getCameras().then(devices => {
        if (devices.length > 0) {
          const backCamera = devices.find(d => 
            d.label.toLowerCase().includes('back') || 
            d.label.toLowerCase().includes('rear')
          );
          const cameraToUse = backCamera?.id || devices[0].id;
          setSelectedCamera(cameraToUse);
          
          // Small delay for DOM
          setTimeout(() => {
            if (isOpen) { // Double-check still open
              startScanning(cameraToUse);
            }
          }, 200);
        } else {
          // No cameras - show manual entry option
          setScanError('No cameras detected. Use manual entry or upload an image.');
        }
      });
    } else {
      // Modal closed - ensure camera is stopped
      stopScanner();
    }
    
    return () => {
      stopScanner();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-2 sm:p-4">
      {/* Hidden file input for image upload */}
      <input 
        type="file" 
        ref={fileInputRef}
        accept="image/*"
        capture="environment"
        onChange={handleFileUpload}
        className="hidden"
      />
      
      {/* Close button - always visible */}
      <button 
        onClick={handleClose}
        className="absolute top-3 right-3 sm:top-4 sm:right-4 z-[60] bg-red-500 hover:bg-red-600 text-white p-2 sm:p-3 rounded-full shadow-lg transition-all flex items-center gap-1 sm:gap-2"
        aria-label="Cancel scanning"
      >
        <XCircle className="w-5 h-5 sm:w-6 sm:h-6" />
        <span className="font-medium pr-1 text-sm sm:text-base">Close</span>
      </button>

      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden relative shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-3 sm:p-4 border-b bg-gradient-to-r from-blue-600 to-blue-700 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-white" />
            <h3 className="font-bold text-base sm:text-lg text-white">{title}</h3>
          </div>
          {cameras.length > 1 && isScanning && (
            <button 
              onClick={switchCamera}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
              title="Switch Camera"
            >
              <SwitchCamera className="w-4 h-4 text-white" />
            </button>
          )}
        </div>
        
        <div className="p-3 sm:p-4">
          {/* Error Display */}
          {scanError && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p>{scanError}</p>
                <button 
                  onClick={() => selectedCamera && startScanning(selectedCamera)}
                  className="mt-2 text-xs bg-red-100 hover:bg-red-200 px-3 py-1 rounded-full"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}
          
          {/* Success State */}
          {scanSuccess && (
            <div className="absolute inset-0 bg-green-500/90 flex items-center justify-center z-20 rounded-2xl">
              <div className="text-center text-white">
                <CheckCircle className="w-16 h-16 mx-auto mb-2 animate-bounce" />
                <p className="text-xl font-bold">Scanned!</p>
              </div>
            </div>
          )}
          
          {/* Manual Entry Mode */}
          {showManualEntry ? (
            <div className="space-y-4">
              <div className="text-center py-4">
                <Keyboard className="w-12 h-12 mx-auto text-blue-500 mb-2" />
                <p className="text-slate-600 text-sm">Enter the QR code manually</p>
              </div>
              
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                placeholder="Enter QR code (e.g., FISH-12345)"
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-center text-lg font-mono uppercase"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
              />
              
              <button
                onClick={handleManualSubmit}
                disabled={!manualCode.trim()}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                Submit Code
              </button>
              
              <button
                onClick={() => {
                  setShowManualEntry(false);
                  setScanError('');
                  if (selectedCamera) startScanning(selectedCamera);
                }}
                className="w-full py-2 text-slate-600 hover:text-slate-800 text-sm"
              >
                ← Back to Camera
              </button>
            </div>
          ) : (
            <>
              {/* Scanner Area */}
              <div className="relative bg-black rounded-xl overflow-hidden" style={{ minHeight: '280px' }}>
                {isInitializing && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-10">
                    <div className="text-center text-white">
                      <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin" />
                      <p className="text-sm">Starting camera...</p>
                    </div>
                  </div>
                )}
                
                <div id="qr-reader" ref={scannerRef} className="w-full"></div>
                
                {/* Scanning overlay with corners */}
                {isScanning && !scanSuccess && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="relative w-48 h-48 sm:w-56 sm:h-56">
                      {/* Animated corners */}
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-400 rounded-tl-lg animate-pulse"></div>
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-400 rounded-tr-lg animate-pulse"></div>
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-400 rounded-bl-lg animate-pulse"></div>
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-400 rounded-br-lg animate-pulse"></div>
                      
                      {/* Scan line animation */}
                      <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-scan"></div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Scanner Controls */}
              {isScanning && (
                <div className="flex justify-center gap-3 mt-3">
                  {hasFlash && (
                    <button
                      onClick={toggleFlash}
                      className={`p-3 rounded-full transition-all ${flashOn ? 'bg-yellow-400 text-black' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                      title="Toggle Flash"
                    >
                      <Flashlight className="w-5 h-5" />
                    </button>
                  )}
                  
                  {cameras.length > 1 && (
                    <button
                      onClick={switchCamera}
                      className="p-3 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-full transition-all"
                      title="Switch Camera"
                    >
                      <SwitchCamera className="w-5 h-5" />
                    </button>
                  )}
                  
                  <button
                    onClick={() => selectedCamera && startScanning(selectedCamera)}
                    className="p-3 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-full transition-all"
                    title="Restart Scanner"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>
                </div>
              )}
              
              <p className="text-center text-xs sm:text-sm text-slate-500 mt-3">
                {isScanning ? 'Position QR code within the frame' : isInitializing ? 'Starting camera...' : 'Camera not available'}
              </p>
              
              {/* Alternative Options */}
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-center text-xs text-slate-400 mb-3">Or try these options:</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Upload Image
                  </button>
                  
                  {allowManualEntry && (
                    <button
                      onClick={() => {
                        stopScanner();
                        setShowManualEntry(true);
                      }}
                      className="flex-1 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                      <Keyboard className="w-4 h-4" />
                      Type Code
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
          
          {/* Bottom Cancel */}
          <button 
            onClick={handleClose}
            className="w-full mt-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <X className="w-5 h-5" />
            Cancel
          </button>
        </div>
      </div>
      
      {/* Custom styles for scan animation */}
      <style>{`
        @keyframes scan {
          0%, 100% { top: 10%; }
          50% { top: 85%; }
        }
        .animate-scan {
          animation: scan 2s ease-in-out infinite;
        }
        #qr-reader video {
          border-radius: 12px !important;
          object-fit: cover !important;
        }
        #qr-reader__dashboard_section_csr button {
          background: #3b82f6 !important;
          border: none !important;
          border-radius: 8px !important;
          padding: 10px 20px !important;
          color: white !important;
          font-weight: 600 !important;
        }
        #qr-reader__dashboard_section_swaplink {
          color: #3b82f6 !important;
          text-decoration: none !important;
        }
        #qr-reader__status_span {
          display: none !important;
        }
        #qr-reader__dashboard_section_fsr {
          display: none !important;
        }
        #qr-reader__header_message {
          display: none !important;
        }
        #qr-reader > div:first-child {
          display: none !important;
        }
      `}</style>
    </div>
  );
};

export default QRScannerModal;
