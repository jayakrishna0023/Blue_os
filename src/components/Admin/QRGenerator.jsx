import React, { useState } from 'react';
import QRCode from 'qrcode';
import { ArrowLeft, Download, Printer, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { mainAPI } from '../../services/api';

const QRGenerator = () => {
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
    setLoading(true);
    try {
      const response = await mainAPI.generateQRCodes(config);
      if (response.success) {
        const codesWithUrls = await Promise.all(response.codes.map(async (code) => ({
            id: code,
            url: await QRCode.toDataURL(code, { width: 200, margin: 2 })
        })));
        setGeneratedCodes(codesWithUrls);
      } else {
        alert('Failed to generate codes: ' + response.message);
      }
    } catch (err) {
      console.error(err);
      alert('Error generating codes');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-8 no-print">
          <button 
            onClick={() => navigate('/admin')}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-slate-600" />
          </button>
          <h1 className="text-2xl font-bold text-slate-900">QR Code Generator</h1>
        </div>

        <div className="glass-card p-6 mb-8 no-print">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                <select 
                    value={config.qrType}
                    onChange={(e) => setConfig({...config, qrType: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                >
                    <option value="FISH">Fish</option>
                    <option value="CRATE">Crate</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Country</label>
                <input 
                    type="text" 
                    value={config.countryCode}
                    onChange={(e) => setConfig({...config, countryCode: e.target.value.toUpperCase()})}
                    className="w-full p-2 border rounded-lg"
                    maxLength={3}
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Center</label>
                <input 
                    type="text" 
                    value={config.landingCentre}
                    onChange={(e) => setConfig({...config, landingCentre: e.target.value.toUpperCase()})}
                    className="w-full p-2 border rounded-lg"
                    maxLength={3}
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Year</label>
                <input 
                    type="text" 
                    value={config.year}
                    onChange={(e) => setConfig({...config, year: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                    maxLength={4}
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
                <input 
                    type="number" 
                    value={config.quantity}
                    onChange={(e) => setConfig({...config, quantity: parseInt(e.target.value)})}
                    className="w-full p-2 border rounded-lg"
                    min="1"
                    max="100"
                />
            </div>
          </div>

          <button
            onClick={generateCodes}
            disabled={loading}
            className="w-full bg-ocean-600 text-white py-3 rounded-xl font-medium hover:bg-ocean-700 transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
            Generate QR Codes
          </button>
        </div>

        {generatedCodes.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 print:grid-cols-4 print:gap-2">
            {generatedCodes.map((code) => (
              <div key={code.id} className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col items-center text-center print:border-black print:p-2">
                <img src={code.url} alt="QR Code" className="w-32 h-32 mb-2" />
                <p className="font-mono text-xs text-slate-500 break-all print:text-black">{code.id}</p>
                <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider print:text-black">BlueOS Tag</p>
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
