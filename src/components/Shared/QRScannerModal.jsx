import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X } from 'lucide-react';

const QRScannerModal = ({ isOpen, onClose, onScan, title = "Scan QR Code" }) => {
  const scannerRef = useRef(null);
  const [scanError, setScanError] = useState('');

  useEffect(() => {
    if (isOpen && scannerRef.current) {
      const scanner = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      );

      scanner.render(
        (decodedText) => {
          onScan(decodedText);
          scanner.clear();
          onClose();
        },
        (errorMessage) => {
          // parse error, ignore it.
        }
      );

      return () => {
        scanner.clear().catch(error => {
          console.error("Failed to clear html5-qrcode scanner. ", error);
        });
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden relative">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="font-bold text-lg">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-4">
          <div id="reader" ref={scannerRef} className="w-full"></div>
          <p className="text-center text-sm text-slate-500 mt-4">
            Point camera at a QR code
          </p>
        </div>
      </div>
    </div>
  );
};

export default QRScannerModal;
