import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X, XCircle } from 'lucide-react';

const QRScannerModal = ({ isOpen, onClose, onScan, title = "Scan QR Code" }) => {
  const scannerRef = useRef(null);
  const scannerInstanceRef = useRef(null);
  const [scanError, setScanError] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const hasScannedRef = useRef(false); // Prevent double scans
  
  // Use refs for callbacks to avoid stale closures
  const onScanRef = useRef(onScan);
  const onCloseRef = useRef(onClose);
  
  useEffect(() => {
    onScanRef.current = onScan;
    onCloseRef.current = onClose;
  }, [onScan, onClose]);

  const handleClose = useCallback(() => {
    // Clean up scanner before closing
    if (scannerInstanceRef.current) {
      try {
        scannerInstanceRef.current.clear().catch(err => {
          console.warn('Scanner cleanup error:', err);
        });
      } catch (e) {
        console.warn('Scanner clear exception:', e);
      }
      scannerInstanceRef.current = null;
    }
    hasScannedRef.current = false;
    setIsScanning(false);
    setScanError('');
    onCloseRef.current();
  }, []);

  useEffect(() => {
    let mounted = true;
    let initTimeout;
    
    if (isOpen && !scannerInstanceRef.current) {
      // Longer delay to ensure DOM is ready
      initTimeout = setTimeout(() => {
        if (!mounted) return;
        
        // Check if reader element exists
        const readerElement = document.getElementById('reader');
        if (!readerElement) {
          console.error('QR reader element not found');
          setScanError('Failed to initialize camera. Please try again.');
          return;
        }
        
        try {
          hasScannedRef.current = false;
          setScanError('');
          
          const scanner = new Html5QrcodeScanner(
            "reader",
            { 
              fps: 10, 
              qrbox: { width: 250, height: 250 },
              rememberLastUsedCamera: true,
              showTorchButtonIfSupported: true,
              aspectRatio: 1.0
            },
            /* verbose= */ false
          );

          scannerInstanceRef.current = scanner;
          setIsScanning(true);

          scanner.render(
            (decodedText) => {
              // Prevent double scanning
              if (hasScannedRef.current) return;
              hasScannedRef.current = true;
              
              console.log('QR Code scanned:', decodedText);
              
              // Clear scanner first
              try {
                scanner.clear().catch(err => console.warn('Clear error:', err));
              } catch (e) {
                console.warn('Scanner clear exception:', e);
              }
              scannerInstanceRef.current = null;
              setIsScanning(false);
              
              // Then trigger callbacks using refs
              onScanRef.current(decodedText);
              onCloseRef.current();
            },
            (errorMessage) => {
              // Scan error - only log meaningful errors, not "no QR found" messages
              if (errorMessage && !errorMessage.includes('No QR code found')) {
                console.debug('QR scan attempt:', errorMessage);
              }
            }
          );
        } catch (err) {
          console.error('Scanner init error:', err);
          setScanError('Failed to initialize camera. Please allow camera access and try again.');
        }
      }, 300); // Increased delay for DOM readiness

      return () => {
        mounted = false;
        if (initTimeout) clearTimeout(initTimeout);
        if (scannerInstanceRef.current) {
          try {
            scannerInstanceRef.current.clear().catch(error => {
              console.warn("Failed to clear html5-qrcode scanner:", error);
            });
          } catch (e) {
            console.warn('Scanner cleanup exception:', e);
          }
          scannerInstanceRef.current = null;
        }
      };
    }
  }, [isOpen]); // Remove onScan, onClose dependencies - use refs instead

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scannerInstanceRef.current) {
        scannerInstanceRef.current.clear().catch(() => {});
        scannerInstanceRef.current = null;
      }
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
      {/* Large Cancel Button - Top Right Corner */}
      <button 
        onClick={handleClose}
        className="absolute top-4 right-4 z-[60] bg-red-500 hover:bg-red-600 text-white p-3 rounded-full shadow-lg transition-all flex items-center gap-2"
        aria-label="Cancel scanning"
      >
        <XCircle className="w-6 h-6" />
        <span className="font-medium pr-1">Cancel</span>
      </button>

      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden relative">
        <div className="flex justify-between items-center p-4 border-b bg-slate-50">
          <h3 className="font-bold text-lg text-slate-800">{title}</h3>
          <button 
            onClick={handleClose} 
            className="p-2 hover:bg-slate-200 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>
        
        <div className="p-4">
          {scanError && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              {scanError}
            </div>
          )}
          <div id="reader" ref={scannerRef} className="w-full"></div>
          <p className="text-center text-sm text-slate-500 mt-4">
            Point camera at a QR code
          </p>
          
          {/* Bottom Cancel Button */}
          <button 
            onClick={handleClose}
            className="w-full mt-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <X className="w-5 h-5" />
            Cancel Scanning
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRScannerModal;
