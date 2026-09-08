import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { CheckCircle2, Phone, Loader2 } from 'lucide-react';

export const MatchingRadarStep = ({ bookingId, onMatched, onCancel }) => {
  const { socket, joinBooking } = useSocket();
  const [seconds, setSeconds] = useState(60);
  const [workerFound, setWorkerFound] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [phase, setPhase] = useState('searching'); // 'searching' | 'found'
  const hasMatchedRef = useRef(false);

  // ── Real-time socket listener ──────────────────────────────────
  useEffect(() => {
    if (!socket) return;
    if (bookingId) joinBooking(bookingId);

    const handleAccepted = (data) => {
      if (data.worker && !hasMatchedRef.current) {
        hasMatchedRef.current = true;
        setWorkerFound(data.worker);
        setPhase('found');
        setTimeout(() => onMatched(data.worker), 1500);
      }
    };

    socket.on('booking:accepted', handleAccepted);
    socket.on('booking:assigned', handleAccepted);
    return () => {
      socket.off('booking:accepted', handleAccepted);
      socket.off('booking:assigned', handleAccepted);
    };
  }, [socket, bookingId]);

  // ── Polling fallback every 2s ──────────────────────────────────
  useEffect(() => {
    if (!bookingId) return;
    let mounted = true;

    const poll = async () => {
      if (hasMatchedRef.current) return;
      try {
        const res = await api.get(`/bookings/${bookingId}`);
        if (!mounted || !res.data?.booking) return;
        const b = res.data.booking;
        const worker =
          res.data.workerDetails ||
          (b.assignedWorker && typeof b.assignedWorker === 'object' ? b.assignedWorker : null);

        const acceptedStates = [
          'ACCEPTED', 'ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS',
          'WORK_SUBMITTED', 'PAID', 'COMPLETED',
        ];
        if (acceptedStates.includes(b.status?.toUpperCase()) && worker && !hasMatchedRef.current) {
          hasMatchedRef.current = true;
          setWorkerFound(worker);
          setPhase('found');
          setTimeout(() => { if (mounted) onMatched(worker); }, 1500);
        }
      } catch (e) {}
    };

    poll();
    const interval = setInterval(poll, 2000);
    return () => { mounted = false; clearInterval(interval); };
  }, [bookingId]);

  // ── Countdown + auto-assign via demo-accept ───────────────────
  useEffect(() => {
    if (seconds <= 0 && !hasMatchedRef.current) {
      (async () => {
        try {
          const res = await api.post(`/bookings/${bookingId}/demo-accept`);
          if (res.data?.worker && !hasMatchedRef.current) {
            hasMatchedRef.current = true;
            setWorkerFound(res.data.worker);
            setPhase('found');
            setTimeout(() => onMatched(res.data.worker), 1500);
          }
        } catch (e) {}
      })();
      return;
    }
    const t = setInterval(() => setSeconds((p) => p - 1), 1000);
    return () => clearInterval(t);
  }, [seconds]);

  const handleCancel = async () => {
    if (!window.confirm('Cancel this service request?')) return;
    setIsCancelling(true);
    try {
      if (bookingId) {
        await api.post(`/bookings/${bookingId}/cancel`, { reason: 'Customer cancelled' });
      }
    } catch (e) {}
    setIsCancelling(false);
    if (onCancel) onCancel();
  };

  // ── Worker found state ────────────────────────────────────────
  if (phase === 'found' && workerFound) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-[#D9D5CC] shadow-card text-center space-y-5 max-w-sm mx-auto">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-9 h-9" />
        </div>
        <div>
          <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-1">
            Sathi Assigned!
          </p>
          <h3 className="text-xl font-bold text-[#20242A]">{workerFound.name}</h3>
          <p className="text-sm text-[#636D79] mt-1">
            {workerFound.trade || 'Certified Cooperative Member'}
          </p>
        </div>
        {workerFound.phone && (
          <div className="flex items-center justify-center space-x-2 text-sm font-semibold text-[#1B4278]">
            <Phone className="w-4 h-4" />
            <span>{workerFound.phone}</span>
          </div>
        )}
        <p className="text-xs text-[#636D79]">
          Your Sathi is on the way. Please wait at your address.
        </p>
      </div>
    );
  }

  // ── Searching state ───────────────────────────────────────────
  return (
    <div className="bg-white rounded-2xl p-8 border border-[#D9D5CC] shadow-card text-center space-y-6 max-w-sm mx-auto">
      {/* Pulsing loader */}
      <div className="relative flex items-center justify-center h-24">
        <span className="absolute w-24 h-24 rounded-full bg-blue-100 animate-ping opacity-40" />
        <span className="absolute w-20 h-20 rounded-full bg-blue-200 animate-ping opacity-30" style={{ animationDelay: '0.3s' }} />
        <div className="relative w-16 h-16 rounded-full bg-[#1B4278] text-white flex items-center justify-center shadow-xl">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </div>

      <div className="space-y-1">
        <h3 className="text-lg font-bold text-[#20242A]">Finding your Sathi…</h3>
        <p className="text-sm text-[#636D79] leading-relaxed">
          Booking confirmed! We are finding the nearest verified cooperative worker for you.
        </p>
      </div>

      {/* Countdown */}
      <div className="text-xs text-[#636D79]">
        Auto-assigning in{' '}
        <span className="font-bold text-[#20242A]">{Math.max(0, seconds)}s</span>
      </div>

      {/* Cancel */}
      <button
        type="button"
        onClick={handleCancel}
        disabled={isCancelling}
        className="w-full py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all disabled:opacity-60"
      >
        {isCancelling ? 'Cancelling…' : '✕ Cancel Request'}
      </button>
    </div>
  );
};

export default MatchingRadarStep;
