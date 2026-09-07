import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useSocket } from '../../context/SocketContext';
import api from '../../services/api';
import {
  Navigation,
  MapPin,
  Clock,
  ShieldCheck,
  Zap,
  Play,
  CheckCircle2,
  Phone,
  AlertCircle,
} from 'lucide-react';

export const EnRouteMapTracker = ({
  bookingId,
  workerData,
  destinationAddress,
  destinationCoords = [77.2433, 28.5700],
  initialStatus = 'ON_THE_WAY',
  onArrived,
}) => {
  const { t } = useLanguage();
  const { socket } = useSocket();

  const [liveLocation, setLiveLocation] = useState(null);
  const [distanceKm, setDistanceKm] = useState(6.4);
  const [durationMinutes, setDurationMinutes] = useState(18);
  const [routeProgress, setRouteProgress] = useState(15);
  const [isSimulating, setIsSimulating] = useState(false);
  const [currentStepText, setCurrentStepText] = useState('Worker dispatched and en route');
  const [hasArrived, setHasArrived] = useState(false);

  // 1. Fetch initial live tracking telemetry from backend
  useEffect(() => {
    if (!bookingId) return;

    const fetchTracking = async () => {
      try {
        const res = await api.get(`/bookings/${bookingId}/live-tracking`);
        if (res.data?.success && res.data.trackingAvailable) {
          setLiveLocation(res.data.workerLocation);
          setDistanceKm(res.data.distanceKm || 6.4);
          setDurationMinutes(res.data.durationMinutes || 18);
          if (res.data.status === 'ARRIVED') {
            setHasArrived(true);
            setRouteProgress(100);
          }
        }
      } catch (err) {
        // Fallback default
        setLiveLocation([77.215, 28.625]);
      }
    };

    fetchTracking();
  }, [bookingId]);

  // 2. Real-time Socket.io listener for en-route GPS telemetry updates
  useEffect(() => {
    if (!socket || !bookingId) return;

    socket.emit('join:booking', { bookingId });

    const handleLocationUpdate = (payload) => {
      console.log('[EnRouteMapTracker] Live telemetry received:', payload);
      if (payload.workerLocation) {
        setLiveLocation(payload.workerLocation);
      }
      if (payload.distanceKm !== undefined || payload.distanceRemainingKm !== undefined) {
        setDistanceKm(payload.distanceKm ?? payload.distanceRemainingKm);
      }
      if (payload.durationMinutes !== undefined || payload.etaMinutes !== undefined) {
        setDurationMinutes(payload.durationMinutes ?? payload.etaMinutes);
      }
      if (payload.progressPercent !== undefined) {
        setRouteProgress(payload.progressPercent);
      }
      if (payload.isArrived || payload.status === 'ARRIVED') {
        setHasArrived(true);
        setRouteProgress(100);
        setCurrentStepText('Worker arrived at your doorstep!');
        if (onArrived) onArrived();
      }
    };

    socket.on('booking:worker_location', handleLocationUpdate);

    return () => {
      socket.off('booking:worker_location', handleLocationUpdate);
      socket.emit('leave:booking', { bookingId });
    };
  }, [socket, bookingId, onArrived]);

  // 3. Trigger Live Demo GPS Simulation
  const handleTriggerSimulation = async () => {
    setIsSimulating(true);
    setCurrentStepText('Simulating real-time transit telemetry...');
    try {
      await api.post(`/bookings/${bookingId}/simulate-enroute`, { steps: 6 });
    } catch (err) {
      console.warn('[EnRouteMapTracker] Simulation error:', err.message);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-cosathi-border shadow-sm space-y-5">
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <span className="text-xs font-bold uppercase tracking-wider text-cosathi-forest flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span>{hasArrived ? 'Worker Arrived' : 'Live En-Route Transit'}</span>
          </span>
          <h3 className="text-base font-bold text-cosathi-slate">
            {hasArrived ? 'Service Partner at Doorstep' : `Arriving in ~${durationMinutes} mins`}
          </h3>
        </div>

        <div className="text-right">
          <span className="text-xs font-extrabold text-cosathi-forest bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
            {hasArrived ? '0 km away' : `${distanceKm} km away`}
          </span>
        </div>
      </div>

      {/* Stylized En-Route Map View */}
      <div className="relative rounded-2xl overflow-hidden border border-cosathi-border bg-slate-100 h-64 flex flex-col justify-between p-4 shadow-inner">
        {/* Map Grid Background */}
        <div
          className="absolute inset-0 opacity-80"
          style={{
            backgroundImage:
              'radial-gradient(#94a3b8 1.5px, transparent 1.5px), radial-gradient(#94a3b8 1.5px, #f8fafc 1.5px)',
            backgroundSize: '28px 28px',
            backgroundPosition: '0 0, 14px 14px',
          }}
        />

        {/* SVG Route Path */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#143D30" />
              <stop offset="100%" stopColor="#C45A38" />
            </linearGradient>
          </defs>
          {/* Base Road Trace */}
          <path
            d="M 50 200 C 120 120, 200 180, 320 80 S 440 100, 520 40"
            fill="transparent"
            stroke="#cbd5e1"
            strokeWidth="8"
            strokeLinecap="round"
          />
          {/* Active Colored Route Path */}
          <path
            d="M 50 200 C 120 120, 200 180, 320 80 S 440 100, 520 40"
            fill="transparent"
            stroke="url(#routeGradient)"
            strokeWidth="5"
            strokeDasharray="6 4"
            className="animate-pulse"
          />
        </svg>

        {/* Start / Worker Position Marker */}
        <div
          className="absolute transition-all duration-1000 ease-out z-20 flex flex-col items-center"
          style={{
            left: `${Math.min(85, Math.max(12, 12 + routeProgress * 0.72))}%`,
            top: `${Math.min(80, Math.max(18, 75 - routeProgress * 0.6))}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          {/* Pulsing beacon */}
          <div className="relative flex items-center justify-center">
            <div className="absolute w-12 h-12 rounded-full bg-cosathi-forest/20 animate-ping" />
            <div className="w-9 h-9 rounded-2xl bg-cosathi-forest text-white shadow-lg flex items-center justify-center border-2 border-white">
              <Navigation className="w-5 h-5 -rotate-45" />
            </div>
          </div>
          <span className="mt-1 px-2 py-0.5 rounded-md bg-cosathi-slate text-white text-[10px] font-bold shadow-md whitespace-nowrap">
            {workerData?.name || 'Worker'}
          </span>
        </div>

        {/* Destination / Customer Home Pin */}
        <div
          className="absolute z-10 flex flex-col items-center"
          style={{ right: '12%', top: '15%', transform: 'translate(50%, -50%)' }}
        >
          <div className="relative flex flex-col items-center">
            <span className="px-2 py-0.5 rounded-md bg-cosathi-clay text-white text-[10px] font-bold shadow-md mb-1 whitespace-nowrap">
              Your Doorstep
            </span>
            <MapPin className="w-8 h-8 text-cosathi-clay fill-cosathi-clay drop-shadow-lg" />
          </div>
        </div>

        {/* Top Floating Telemetry Overlay */}
        <div className="relative z-30 flex items-center justify-between bg-white/90 backdrop-blur-xs px-3 py-2 rounded-xl border border-cosathi-border text-xs">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-cosathi-forest" />
            <span className="font-semibold text-cosathi-slate">
              Estimated Arrival: <strong className="text-cosathi-forest">{durationMinutes} minutes</strong>
            </span>
          </div>
          <span className="text-[11px] font-mono text-cosathi-muted">
            {Math.round(routeProgress)}% completed
          </span>
        </div>

        {/* Bottom Floating Status Bar */}
        <div className="relative z-30 flex items-center justify-between bg-white/90 backdrop-blur-xs p-2.5 rounded-xl border border-cosathi-border text-xs">
          <div className="truncate pr-2">
            <span className="text-[10px] uppercase tracking-wider text-cosathi-muted block">Destination</span>
            <span className="font-bold text-cosathi-slate truncate block">
              {destinationAddress || 'Lajpat Nagar II, New Delhi'}
            </span>
          </div>
          <div className="flex items-center space-x-1.5 shrink-0">
            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
              Safe Telemetry
            </span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-cosathi-muted">{currentStepText}</span>
          <span className="font-bold text-cosathi-forest">{Math.round(routeProgress)}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-cosathi-border overflow-hidden">
          <div
            className="h-full bg-cosathi-forest rounded-full transition-all duration-700"
            style={{ width: `${routeProgress}%` }}
          />
        </div>
      </div>

      {/* Demo Simulation Action Banner */}
      {!hasArrived && (
        <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="text-amber-900 font-medium">
              Demo Simulation: Simulate worker moving towards doorstep in real-time.
            </span>
          </div>
          <button
            type="button"
            onClick={handleTriggerSimulation}
            disabled={isSimulating}
            className="px-3 py-1.5 rounded-xl bg-cosathi-clay hover:bg-cosathi-clay-light text-white text-xs font-bold transition-all shadow-xs flex items-center space-x-1 shrink-0"
          >
            <Play className="w-3 h-3 fill-white" />
            <span>{isSimulating ? 'Simulating...' : 'Simulate GPS'}</span>
          </button>
        </div>
      )}

      {/* Privacy Guarantee Note */}
      <div className="p-3 rounded-xl bg-cosathi-surface border border-cosathi-border text-[11px] text-cosathi-muted flex items-start space-x-2">
        <ShieldCheck className="w-4 h-4 text-cosathi-forest shrink-0 mt-0.5" />
        <span>
          <strong>CoSathi Privacy Guardrail</strong>: Worker residential coordinates are strictly
          protected. Approximate en-route waypoints are generated to safeguard worker privacy while
          ensuring precise arrival accuracy.
        </span>
      </div>
    </div>
  );
};
