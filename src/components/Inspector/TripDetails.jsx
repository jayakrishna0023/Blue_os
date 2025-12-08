import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { inspectorAPI } from '../../services/api';
import { ArrowLeft, Fish, Thermometer, Scale, Award } from 'lucide-react';

const TripDetails = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [catchLogs, setCatchLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tripId) {
      loadCatchLogs();
    }
  }, [tripId]);

  const loadCatchLogs = async () => {
    try {
      const response = await inspectorAPI.getTripCatch(tripId);
      if (response.success) {
        setCatchLogs(response.logs);
      }
    } catch (error) {
      console.error("Failed to load catch logs", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <button onClick={() => navigate('/inspector')} className="flex items-center text-slate-500 hover:text-slate-800 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
      </button>
      
      <div className="glass-card p-6">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-800">Trip Catch Log</h2>
            <span className="text-sm text-slate-500">Trip ID: {tripId}</span>
        </div>

        {loading ? (
            <div className="text-center py-12">Loading...</div>
        ) : (
            <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                <tr>
                    <th className="p-4 font-semibold">Species</th>
                    <th className="p-4 font-semibold">QR Code</th>
                    <th className="p-4 font-semibold">Weight (kg)</th>
                    <th className="p-4 font-semibold">Grade</th>
                    <th className="p-4 font-semibold">Temp (°C)</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                {catchLogs.map((log, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-medium text-slate-800 flex items-center gap-2">
                        <Fish className="w-4 h-4 text-ocean-500" />
                        {log.species_name}
                    </td>
                    <td className="p-4 font-mono text-xs text-slate-500">{log.qr_code}</td>
                    <td className="p-4">{log.weight_kg || '-'}</td>
                    <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                        log.quality_grade === 'A' ? 'bg-green-100 text-green-700' :
                        log.quality_grade === 'B' ? 'bg-yellow-100 text-yellow-700' :
                        log.quality_grade ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                        {log.quality_grade || 'Pending'}
                        </span>
                    </td>
                    <td className="p-4">{log.temperature || '-'}</td>
                    </tr>
                ))}
                {catchLogs.length === 0 && (
                    <tr>
                        <td colSpan="5" className="p-8 text-center text-slate-400">
                            No catch logs found for this trip.
                        </td>
                    </tr>
                )}
                </tbody>
            </table>
            </div>
        )}
      </div>
    </div>
  );
};

export default TripDetails;
