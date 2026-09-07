import React, { useState } from 'react';
import api from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { EnRouteMapTracker } from './EnRouteMapTracker';
import {
  User,
  ShieldCheck,
  Star,
  Phone,
  MessageSquare,
  Navigation,
  CheckCircle2,
  Clock,
  ArrowRight,
  Receipt,
  CreditCard,
  Building2,
  HeartHandshake,
} from 'lucide-react';

export const ActiveBookingTracker = ({
  bookingData,
  workerData,
  onCompleteJob,
  onCancelBooking,
}) => {
  const { t } = useLanguage();

  // Statuses: 'assigned' -> 'en_route' -> 'in_progress' -> 'completed'
  const [jobStatus, setJobStatus] = useState('assigned');

  const statusSteps = [
    { key: 'assigned', label: t('customer.statusAssigned'), icon: CheckCircle2 },
    { key: 'en_route', label: t('customer.statusEnRoute'), icon: Navigation },
    { key: 'in_progress', label: t('customer.statusInProgress'), icon: Clock },
    { key: 'completed', label: t('customer.statusCompleted'), icon: CheckCircle2 },
  ];

  const currentStepIndex = statusSteps.findIndex((s) => s.key === jobStatus);

  const advanceStatus = () => {
    if (jobStatus === 'assigned') setJobStatus('en_route');
    else if (jobStatus === 'en_route') setJobStatus('in_progress');
    else if (jobStatus === 'in_progress') {
      setJobStatus('completed');
      if (onCompleteJob) onCompleteJob();
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Stepper Bar */}
      <div className="bg-[#FFFFFF] rounded-xl p-5 sm:p-6 border border-[#D9D5CC] shadow-card">
        <div className="flex items-center justify-between mb-5 border-b border-[#E2DDD3] pb-3">
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#24324A]">
              {t('customer.trackingTitle')} • सेवा ट्रैकिंग
            </span>
            <h3 className="font-serif text-lg font-bold text-[#20242A]">
              Booking #{bookingData?.bookingNumber || 'CS-2026-0905-081'}
            </h3>
          </div>
          <span className="px-3 py-1 rounded-md text-xs font-semibold bg-[#F2EFEB] text-[#24324A] border border-[#D9D5CC]">
            {statusSteps[currentStepIndex]?.label}
          </span>
        </div>

        {/* Step Progress Line */}
        <div className="relative flex items-center justify-between px-2 sm:px-6">
          <div className="absolute left-6 right-6 top-1/2 h-0.5 bg-[#D9D5CC] -translate-y-1/2 z-0" />
          <div
            className="absolute left-6 top-1/2 h-0.5 bg-[#24324A] -translate-y-1/2 z-0 transition-all duration-500"
            style={{ width: `${(currentStepIndex / (statusSteps.length - 1)) * 100}%` }}
          />

          {statusSteps.map((step, idx) => {
            const isPassed = idx <= currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            const Icon = step.icon;

            return (
              <div key={step.key} className="relative z-10 flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    isPassed
                      ? 'bg-[#24324A] text-white shadow-xs'
                      : 'bg-white text-[#636D79] border border-[#D9D5CC]'
                  } ${isCurrent ? 'ring-2 ring-[#DF9F35]' : ''}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span
                  className={`text-[11px] font-semibold mt-2 text-center whitespace-nowrap ${
                    isPassed ? 'text-[#20242A]' : 'text-[#636D79]'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Demo simulator trigger */}
        {jobStatus !== 'completed' && (
          <div className="mt-7 pt-3 border-t border-[#E2DDD3] flex items-center justify-between bg-[#F7F4EE] p-3 rounded-lg">
            <span className="text-xs text-[#636D79] font-medium">
              💡 {t('customer.simulateProgress')}
            </span>
            <button
              onClick={advanceStatus}
              className="px-3.5 py-1 rounded-md bg-[#24324A] hover:bg-[#162031] text-white text-xs font-semibold transition-all shadow-xs"
            >
              Advance Step →
            </button>
          </div>
        )}
      </div>

      {/* Live En-Route Map Telemetry Tracker (Active during en_route and in_progress) */}
      {(jobStatus === 'en_route' || jobStatus === 'in_progress') && (
        <EnRouteMapTracker
          bookingId={bookingData?._id || bookingData?.bookingId}
          workerData={workerData}
          destinationAddress={bookingData?.address?.addressLine}
          initialStatus={jobStatus === 'en_route' ? 'ON_THE_WAY' : 'IN_PROGRESS'}
          onArrived={() => {
            if (jobStatus === 'en_route') setJobStatus('in_progress');
          }}
        />
      )}

      {/* Worker Details Card (strictly revealed after assignment) */}
      <div className="bg-[#FFFFFF] rounded-xl p-5 sm:p-6 border border-[#D9D5CC] shadow-card space-y-4">
        <div className="flex items-start justify-between pb-3 border-b border-[#E2DDD3]">
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#24324A]">
              {t('customer.workerRevealedTitle')} • अधिकृत सहकारी साथी
            </span>
            <p className="text-xs text-[#636D79]">
              {t('customer.workerRevealedSubtitle')}
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-[#F2EFEB] text-[#3C5A48] border border-[#D9D5CC]">
            {workerData?.fairScoreRank || 'Fair Allocation Match'}
          </span>
        </div>

        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-lg bg-[#24324A] text-[#DF9F35] font-serif font-bold flex items-center justify-center text-xl shadow-xs border border-[#162031]">
            {workerData?.name ? workerData.name.charAt(0) : 'W'}
          </div>

          <div className="space-y-1 flex-1">
            <div className="flex items-center justify-between">
              <h4 className="font-serif text-lg font-bold text-[#20242A]">{workerData?.name}</h4>
              <div className="flex items-center space-x-1 text-xs font-semibold text-[#20242A] bg-[#F7F4EE] px-2 py-0.5 rounded-md border border-[#D9D5CC]">
                <Star className="w-3.5 h-3.5 fill-[#DF9F35] text-[#DF9F35]" />
                <span>{workerData?.rating || 4.9}</span>
                <span className="text-[#636D79] font-normal">({workerData?.reviewsCount || 180})</span>
              </div>
            </div>

            <p className="text-xs text-[#636D79] font-medium">
              {workerData?.trade || 'Certified Master Electrician'}
            </p>

            <div className="flex flex-wrap gap-2 pt-1 text-[11px]">
              <span className="bg-[#F2EFEB] text-[#20242A] font-mono px-2 py-0.5 rounded border border-[#D9D5CC]">
                ID: {workerData?.memberId || 'COS-DL-2026-101'}
              </span>
              <span className="bg-[#F7F4EE] text-[#3C5A48] font-semibold px-2 py-0.5 rounded border border-[#D9D5CC] flex items-center space-x-1">
                <ShieldCheck className="w-3 h-3 text-[#3C5A48]" />
                <span>Physical KYC Verified</span>
              </span>
            </div>
          </div>
        </div>

        {/* Contact actions */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <a
            href={`tel:${workerData?.phone || '+919810010001'}`}
            className="p-2.5 rounded-lg bg-[#F7F4EE] hover:bg-[#F2EFEB] border border-[#D9D5CC] text-[#20242A] text-xs font-semibold flex items-center justify-center space-x-2 transition-colors"
          >
            <Phone className="w-3.5 h-3.5 text-[#24324A]" />
            <span>{t('customer.callWorker')}</span>
          </a>

          <button
            onClick={() => alert(`Messaging channel connected with ${workerData?.name}`)}
            className="p-2.5 rounded-lg bg-[#F7F4EE] hover:bg-[#F2EFEB] border border-[#D9D5CC] text-[#20242A] text-xs font-semibold flex items-center justify-center space-x-2 transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5 text-[#A65343]" />
            <span>{t('customer.chatWorker')}</span>
          </button>
        </div>

        {/* Cancel Booking Action */}
        <div className="pt-2 border-t border-[#E2DDD3]">
          <button
            type="button"
            onClick={async () => {
              if (window.confirm('Are you sure you want to cancel this booking? / क्या आप यह बुकिंग रद्द करना चाहते हैं?')) {
                try {
                  const bId = bookingData?._id || bookingData?.bookingId;
                  if (bId) {
                    await api.post(`/bookings/${bId}/cancel`, { reason: 'Cancelled by customer' });
                  }
                } catch (e) {
                  console.warn('Cancel error:', e.message);
                }
                if (onCancelBooking) onCancelBooking();
              }
            }}
            className="w-full py-2.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors text-center"
          >
            ✕ Cancel Booking / बुकिंग रद्द करें
          </button>
        </div>
      </div>
    </div>
  );
};
