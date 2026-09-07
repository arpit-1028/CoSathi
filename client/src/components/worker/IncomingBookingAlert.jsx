import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import {
  Bell,
  MapPin,
  Clock,
  IndianRupee,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Scale,
} from 'lucide-react';

export const IncomingBookingAlert = ({ booking, onAccept, onDecline }) => {
  const { t } = useLanguage();
  const [timeLeft, setTimeLeft] = useState(60);

  useEffect(() => {
    if (timeLeft <= 0) {
      onDecline();
      return;
    }
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, onDecline]);

  const defaultBooking = {
    bookingNumber: 'CS-2026-0905-081',
    customerName: 'Ananya Deshmukh',
    category: 'Electrical Works',
    serviceTitle: 'Ceiling Fan Repair / Capacitor Replace',
    address: 'B-42, Lajpat Nagar II, New Delhi',
    distance: '1.4 km',
    floorPayout: 298,
    rawText: 'Bedroom ceiling fan humming loudly and rotating slowly.',
  };

  const b = booking || defaultBooking;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#20242A]/80 backdrop-blur-xs p-4 animate-in slide-in-from-bottom duration-200">
      <div className="bg-[#FFFFFF] max-w-lg w-full rounded-xl p-5 sm:p-6 border-2 border-[#24324A] shadow-2xl space-y-4">
        {/* Header with Countdown */}
        <div className="flex items-start justify-between pb-3 border-b border-[#E2DDD3]">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-lg bg-[#F7F4EE] text-[#A65343] border border-[#D9D5CC] flex items-center justify-center font-bold">
              <Bell className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-[#20242A]">
                {t('worker.incomingAlertTitle')} • नया सेवा बुलावा
              </h3>
              <span className="text-xs text-[#636D79] block">
                {b.category} • Ref #{b.bookingNumber}
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-[#636D79] block uppercase font-bold">
              {t('worker.timeRemaining')}
            </span>
            <span className="text-lg font-mono font-bold text-[#A65343]">
              {timeLeft}s
            </span>
          </div>
        </div>

        {/* Fairness Allocation Badge */}
        <div className="p-3 rounded-lg bg-[#F7F4EE] border border-[#D9D5CC] flex items-center space-x-2 text-xs text-[#636D79]">
          <Scale className="w-4 h-4 text-[#C58B2A] flex-shrink-0" />
          <span className="text-[11px] leading-snug">
            {t('worker.incomingAlertSubtitle')}
          </span>
        </div>

        {/* Job Details */}
        <div className="space-y-2 text-xs">
          <div className="p-3 rounded-lg bg-[#F7F4EE] border border-[#D9D5CC]">
            <span className="text-[#636D79] block font-medium">Customer Requirement / ग्राहक विवरण:</span>
            <span className="font-serif font-bold text-[#20242A] text-sm italic">"{b.rawText}"</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded-lg bg-[#FFFFFF] border border-[#D9D5CC] flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-[#A65343] flex-shrink-0" />
              <div>
                <span className="text-[10px] text-[#636D79] block">Distance</span>
                <span className="font-bold text-[#20242A]">{b.distance} (Lajpat Nagar)</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#FFFFFF] border border-[#D9D5CC] flex items-center space-x-2">
              <IndianRupee className="w-4 h-4 text-[#3C5A48] flex-shrink-0" />
              <div>
                <span className="text-[10px] text-[#636D79] block">Rate Card Base</span>
                <span className="font-serif font-bold text-[#3C5A48] text-sm">₹{b.floorPayout}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={onDecline}
            className="py-3 px-4 rounded-lg border border-[#D9D5CC] text-[#636D79] hover:text-[#20242A] hover:bg-[#F2EFEB] text-xs font-semibold transition-colors flex items-center justify-center space-x-1.5"
          >
            <XCircle className="w-4 h-4" />
            <span>{t('worker.declineBtn')}</span>
          </button>

          <button
            onClick={() => onAccept(b)}
            className="py-3 px-4 rounded-lg bg-[#24324A] hover:bg-[#162031] text-white text-xs font-semibold shadow-card transition-all flex items-center justify-center space-x-1.5"
          >
            <CheckCircle2 className="w-4 h-4 text-[#DF9F35]" />
            <span>{t('worker.acceptBtn')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
