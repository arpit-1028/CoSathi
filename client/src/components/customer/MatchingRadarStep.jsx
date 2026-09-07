import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useSocket } from '../../context/SocketContext';
import { Scale, Users, ShieldCheck, CheckCircle2, Sparkles, Radio } from 'lucide-react';

export const MatchingRadarStep = ({ bookingId, onMatched }) => {
  const { t } = useLanguage();
  const { socket, joinBooking } = useSocket();
  const [seconds, setSeconds] = useState(45);
  const [statusText, setStatusText] = useState('Finding nearest certified cooperative worker...');

  // Simulated cooperative worker match fallback
  const fallbackWorker = {
    name: 'Ramesh Kumar',
    memberId: 'COS-DL-2026-101',
    trade: 'Certified Master Electrician',
    rating: 4.9,
    reviewsCount: 180,
    jobsCompleted: 200,
    aadhaarMasked: 'XXXX-XXXX-3203',
    phone: '+91 98100 10001',
    distanceKm: '1.4 km away',
    etaMinutes: '18 mins',
    fairScoreRank: 'Priority Tier 1 (Democratic Rotation)',
  };

  useEffect(() => {
    if (!socket) return;

    if (bookingId) {
      joinBooking(bookingId);
    }

    const handleAccepted = (data) => {
      console.log('[MatchingRadar] Real-time booking:accepted received:', data);
      setStatusText(`Accepted by ${data.worker?.name || 'Worker'}! Preparing dispatch...`);
      setTimeout(() => {
        onMatched(data.worker || fallbackWorker);
      }, 800);
    };

    const handleMatching = (data) => {
      if (data.message) setStatusText(data.message);
    };

    socket.on('booking:accepted', handleAccepted);
    socket.on('booking:assigned', handleAccepted);
    socket.on('booking:matching', handleMatching);

    return () => {
      socket.off('booking:accepted', handleAccepted);
      socket.off('booking:assigned', handleAccepted);
      socket.off('booking:matching', handleMatching);
    };
  }, [socket, bookingId, onMatched]);

  useEffect(() => {
    if (seconds <= 0) {
      onMatched(fallbackWorker);
      return;
    }
    const timer = setInterval(() => setSeconds((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [seconds, onMatched]);

  return (
    <div className="bg-[#FFFFFF] rounded-xl p-6 sm:p-8 border border-[#D9D5CC] shadow-card space-y-6 max-w-lg mx-auto">
      {/* Header with Dispatch Status */}
      <div className="text-center space-y-2 pb-2 border-b border-[#E2DDD3]">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-md bg-[#F2EFEB] text-[#24324A] text-xs font-semibold border border-[#D9D5CC]">
          <span className="w-2 h-2 rounded-full bg-[#3C5A48] animate-pulse"></span>
          <span>सहकारी प्रेषण केंद्र • Cooperative Dispatch Station</span>
        </div>
        <h3 className="font-serif text-xl font-bold text-[#20242A]">
          {t('customer.matchingTitle')}
        </h3>
        <p className="text-xs text-[#636D79]">
          {statusText}
        </p>
      </div>

      {/* Operational Dispatch Checklist */}
      <div className="space-y-3 text-left">
        <div className="p-3 rounded-lg bg-[#F7F4EE] border border-[#D9D5CC] flex items-center space-x-3">
          <div className="w-6 h-6 rounded-full bg-[#3C5A48] text-white flex items-center justify-center text-xs flex-shrink-0">
            ✓
          </div>
          <div className="text-xs">
            <span className="font-bold text-[#20242A] block">1. Requirement Interpreted & Verified</span>
            <span className="text-[#636D79] text-[11px]">Tasks mapped to MongoDB cooperative rate card</span>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-[#F7F4EE] border border-[#D9D5CC] flex items-center space-x-3">
          <div className="w-6 h-6 rounded-full bg-[#24324A] text-[#DF9F35] flex items-center justify-center text-xs flex-shrink-0 font-bold">
            2
          </div>
          <div className="text-xs">
            <span className="font-bold text-[#20242A] block">2. Fair Opportunity & Geospatial Engine Active</span>
            <span className="text-[#636D79] text-[11px]">Evaluating nearby verified members via rotation ledger</span>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-[#F7F4EE] border border-[#D9D5CC] flex items-center space-x-3">
          <div className="w-6 h-6 rounded-full bg-white border border-[#D9D5CC] text-[#636D79] flex items-center justify-center text-xs flex-shrink-0">
            3
          </div>
          <div className="text-xs">
            <span className="font-bold text-[#20242A] block">3. Worker Confirmation & En-Route Dispatch</span>
            <span className="text-[#636D79] text-[11px]">Awaiting worker acceptance ({seconds}s remaining)</span>
          </div>
        </div>
      </div>

      {/* Fairness algorithm badge */}
      <div className="p-3.5 rounded-lg bg-[#F2EFEB] border border-[#D9D5CC] text-left space-y-1.5">
        <div className="flex items-center space-x-2 text-xs font-bold text-[#24324A]">
          <Scale className="w-4 h-4 text-[#C58B2A]" />
          <span>Fair Distribution Principle • लोकतांत्रिक निष्पक्षता</span>
        </div>
        <p className="text-[11px] text-[#636D79] leading-relaxed">
          {t('customer.fairnessFact')}
        </p>
      </div>

      {/* Demo speed-up trigger */}
      <div className="pt-1 flex items-center justify-between text-xs text-[#636D79] border-t border-[#E2DDD3]">
        <span>Auto-assign in: <strong className="text-[#20242A]">{seconds}s</strong></span>
        <button
          onClick={() => onMatched(fallbackWorker)}
          className="font-semibold text-[#A65343] hover:underline"
        >
          Fast-forward Matching (Demo) →
        </button>
      </div>
    </div>
  );
};
export default MatchingRadarStep;
