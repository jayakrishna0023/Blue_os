import React, { useState } from 'react';
import QRCode from 'qrcode';
import { ArrowLeft, Download, Printer, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { mainAPI } from '../../services/api';
import { useToast } from '../Shared/Toast';

const QRGenerator = () => {
  const toast = useToast();
  const [config, setConfig] = useState({
    qrType: 'FISH',
    countryCode: 'IND',
    landingCentre: 'CHN',
    year: new Date().getFullYear().toString(),
    quantity: 10
  });
  const [generatedCodes, setGeneratedCodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const generateCodes = async () => {
    // Validate quantity
    if (!config.quantity || config.quantity < 1 || config.quantity > 500) {
      toast.error('Quantity must be between 1 and 500', 'Invalid Quantity');
      return;
    }

    setLoading(true);
    try {
      const response = await mainAPI.generateQRCodes(config);
      if (response.success) {
        // Check for duplicates in response
        if (response.duplicates && response.duplicates.length > 0) {
          toast.warning(
            `Generated ${response.codes.length} new codes. ${response.duplicates.length} codes were already in use and skipped.`,
            'Partial Generation'
          );
        }

        const codesWithUrls = await Promise.all(response.codes.map(async (code) => ({
            id: code,
            url: await QRCode.toDataURL(code, { width: 200, margin: 2 })
        })));
        setGeneratedCodes(codesWithUrls);
        
        if (config.qrType === 'CRATE') {
          toast.success(`Generated ${codesWithUrls.length} crate QR codes. Workers can now scan these to pack fish.`, 'Success');
        } else {
          toast.success(`Generated ${codesWithUrls.length} fish QR codes.`, 'Success');
        }
      } else {
        if (response.isDuplicate) {
          toast.error('Some QR codes already exist. ' + response.message, 'Duplicate Codes');
        } else {
          toast.error('Failed to generate codes: ' + response.message, 'Error');
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Error generating codes. Please try again.', 'Error');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 p-3 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8 no-print">
          <button 
            onClick={() => navigate('/admin')}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors touch-target"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600" />
          </button>
          <h1 className="text-lg sm:text-2xl font-bold text-slate-900">QR Code Generator</h1>
        </div>

        <div className="glass-card p-4 sm:p-6 mb-6 sm:mb-8 no-print">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">Type</label>
                <select 
                    value={config.qrType}
                    onChange={(e) => setConfig({...config, qrType: e.target.value})}
                    className="w-full p-2 sm:p-2.5 border rounded-lg text-sm text-slate-900 bg-white"
                >
                    <option value="FISH">Fish</option>
                    <option value="CRATE">Crate</option>
                </select>
            </div>
            <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">Country</label>
                <input 
                    type="text" 
                    value={config.countryCode}
                    onChange={(e) => setConfig({...config, countryCode: e.target.value.toUpperCase()})}
                    className="w-full p-2 sm:p-2.5 border rounded-lg text-sm text-slate-900 bg-white"
                    maxLength={3}
                />
            </div>
            <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">Center</label>
                <input 
                    type="text" 
                    value={config.landingCentre}
                    onChange={(e) => setConfig({...config, landingCentre: e.target.value.toUpperCase()})}
                    className="w-full p-2 sm:p-2.5 border rounded-lg text-sm text-slate-900 bg-white"
                    maxLength={3}
                />
            </div>
            <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">Year</label>
                <input 
                    type="text" 
                    value={config.year}
                    onChange={(e) => setConfig({...config, year: e.target.value})}
                    className="w-full p-2 sm:p-2.5 border rounded-lg text-sm text-slate-900 bg-white"
                    maxLength={4}
                />
            </div>
            <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">Quantity</label>
                <input 
                    type="number" 
                    value={config.quantity}
                    onChange={(e) => setConfig({...config, quantity: parseInt(e.target.value)})}
                    className="w-full p-2 sm:p-2.5 border rounded-lg text-sm text-slate-900 bg-white"
                    min="1"
                    max="100"
                />
            </div>
          </div>

          <button
            onClick={generateCodes}
            disabled={loading}
            className="w-full bg-ocean-600 text-white py-2.5 sm:py-3 rounded-xl font-medium hover:bg-ocean-700 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base touch-target"
          >
            {loading ? <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />}
            Generate QR Codes
          </button>
        </div>

        {generatedCodes.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4 print:grid-cols-4 print:gap-2">
            {generatedCodes.map((code) => (
              <div key={code.id} className="bg-white p-2 sm:p-4 rounded-lg sm:rounded-xl border border-slate-200 flex flex-col items-center text-center print:border-black print:p-2 relative group">
                <img src={code.url} alt="QR Code" className="w-20 h-20 sm:w-32 sm:h-32 mb-1 sm:mb-2" />
                <p className="font-mono text-[8px] sm:text-xs text-slate-500 break-all print:text-black line-clamp-2">{code.id}</p>
                <p className="text-[8px] sm:text-[10px] text-slate-400 mt-0.5 sm:mt-1 uppercase tracking-wider print:text-black">BlueOS Tag</p>
                
                {/* Download Overlay */}
                <a 
                  href={code.url} 
                  download={`${code.id}.png`}
                  className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg sm:rounded-xl no-print cursor-pointer"
                  title="Download QR Code"
                >
                  <Download className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @media print {
          .no-print { display: none; }
          body { background: white; }
          .glass-card { box-shadow: none; border: none; }
        }
      `}</style>
    </div>
  );
};

export default QRGenerator;
