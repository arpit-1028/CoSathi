import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { useSocket } from '../../context/SocketContext';
import { Scale, ShieldCheck, CheckCircle2, UserCheck, AlertCircle } from 'lucide-react';

export const MatchingRadarStep = ({ bookingId, onMatched, onCancel }) => {
  const { t, language } = useLanguage();
  const { socket, joinBooking } = useSocket();
  const [seconds, setSeconds] = useState(45);
  const [candidateWorker, setCandidateWorker] = useState(null);
  const [statusText, setStatusText] = useState(
    language === 'hi'
      ? 'निकटतम प्रमाणित सहकारी साथी की खोज जारी है...'
      : 'Finding nearest certified cooperative worker in your area...'
  );
  const [isCancelling, setIsCancelling] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const hasMatchedRef = useRef(false);

  const handleCancelSearch = async () => {
    const confirmMsg =
      language === 'hi'
        ? 'क्या आप यह सेवा अनुरोध रद्द करना चाहते हैं?'
        : 'Are you sure you want to cancel this service request?';
    if (!window.confirm(confirmMsg)) {
      return;
    }
    setIsCancelling(true);
    try {
      if (bookingId) {
        await api.post(`/bookings/${bookingId}/cancel`, { reason: 'Customer cancelled during matching search' });
      }
    } catch (err) {
      console.warn('Cancel warning:', err.message);
    } finally {
      setIsCancelling(false);
      if (onCancel) onCancel();
    }
  };

  const handleFastForward = async () => {
    if (!bookingId || isAccepting || hasMatchedRef.current) return;
    setIsAccepting(true);
    setStatusText(
      language === 'hi'
        ? 'सहकारी प्रेषण द्वारा चयनित साथी को कार्य सौंपा जा रहा है...'
        : 'Dispatching confirmation to matched cooperative member...'
    );
    try {
      const res = await api.post(`/bookings/${bookingId}/demo-accept`);
      if (res.data?.worker && !hasMatchedRef.current) {
        hasMatchedRef.current = true;
        setStatusText(
          language === 'hi'
            ? `${res.data.worker.name} ने कार्य स्वीकार किया! प्रेषण तैयार...`
            : `Accepted by ${res.data.worker.name}! Preparing dispatch...`
        );
        setTimeout(() => {
          onMatched(res.data.worker);
        }, 500);
      }
    } catch (err) {
      console.warn('Demo accept error:', err.message);
      // Poll fallback
      try {
        const bRes = await api.get(`/bookings/${bookingId}`);
        if (bRes.data?.workerDetails && !hasMatchedRef.current) {
          hasMatchedRef.current = true;
          onMatched(bRes.data.workerDetails);
        }
      } catch (e) {
        console.warn('Fallback error:', e.message);
      }
    } finally {
      setIsAccepting(false);
    }
  };

  // 1. Socket.IO Listener
  useEffect(() => {
    if (!socket) return;

    if (bookingId) {
      joinBooking(bookingId);
    }

    const handleAccepted = (data) => {
      console.log('[MatchingRadar] Real-time booking:accepted received:', data);
      if (data.worker && !hasMatchedRef.current) {
        hasMatchedRef.current = true;
        setStatusText(
          language === 'hi'
            ? `${data.worker.name} ने कार्य स्वीकार किया! प्रेषण तैयार...`
            : `Accepted by ${data.worker.name}! Preparing dispatch...`
        );
        setTimeout(() => {
          onMatched(data.worker);
        }, 700);
      }
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
  }, [socket, bookingId, onMatched, language]);

  // 2. Continuous Polling of MongoDB booking state (2s interval)
  useEffect(() => {
    if (!bookingId) return;
    let isMounted = true;

    const checkBookingStatus = async () => {
      if (hasMatchedRef.current) return;
      try {
        const res = await api.get(`/bookings/${bookingId}`);
        if (!isMounted || !res.data?.booking) return;

        const b = res.data.booking;
        const wDetails = res.data.workerDetails || (b.assignedWorker && typeof b.assignedWorker === 'object' ? b.assignedWorker : null);

        if (wDetails) {
          setCandidateWorker(wDetails);
        }

        const acceptedStates = ['ACCEPTED', 'ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS', 'WORK_SUBMITTED', 'PAID', 'COMPLETED'];
        if (acceptedStates.includes(b.status?.toUpperCase())) {
          if (!hasMatchedRef.current) {
            hasMatchedRef.current = true;
            setStatusText(
              language === 'hi'
                ? `${wDetails?.name || 'साथी'} ने कार्य स्वीकार किया!`
                : `Accepted by ${wDetails?.name || 'Cooperative Worker'}! Preparing dispatch...`
            );
            setTimeout(() => {
              if (isMounted) onMatched(wDetails || b.assignedWorker);
            }, 600);
          }
        } else if (b.status === 'OFFERED' && wDetails) {
          setStatusText(
            language === 'hi'
              ? `सहकारी साथी ${wDetails.name} (${wDetails.trade || 'विशेषज्ञ'}) को अनुरोध भेजा गया है। स्वीकृति की प्रतीक्षा है...`
              : `Dispatched offer to verified member ${wDetails.name} (${wDetails.trade || 'Specialist'}). Awaiting acceptance...`
          );
        }
      } catch (err) {
        console.warn('[MatchingRadar] Polling check notice:', err.message);
      }
    };

    checkBookingStatus();
    const interval = setInterval(checkBookingStatus, 2000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [bookingId, onMatched, language]);

  // 3. Countdown timer for auto-assigning real candidate
  useEffect(() => {
    if (seconds <= 0) {
      handleFastForward();
      return;
    }
    const timer = setInterval(() => setSeconds((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [seconds]);

  return (
    <div className="bg-[#FFFFFF] rounded-xl p-6 sm:p-8 border border-[#D9D5CC] shadow-card space-y-6 max-w-lg mx-auto">
      {/* Header with Dispatch Status */}
      <div className="text-center space-y-2 pb-2 border-b border-[#E2DDD3]">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-md bg-[#F2EFEB] text-[#24324A] text-xs font-semibold border border-[#D9D5CC]">
          <span className="w-2 h-2 rounded-full bg-[#3C5A48] animate-pulse"></span>
          <span>
            {language === 'hi'
              ? 'सहकारी प्रेषण केंद्र • लाइव आवंटन'
              : 'Cooperative Dispatch Station • Live Matching'}
          </span>
        </div>
        <h3 className="font-serif text-xl font-bold text-[#20242A]">
          {t('customer.matchingTitle')}
        </h3>
        <p className="text-xs text-[#24324A] font-medium leading-relaxed bg-[#F7F4EE] p-2.5 rounded-lg border border-[#D9D5CC]">
          {statusText}
        </p>
      </div>

      {/* Candidate Worker preview if offered */}
      {candidateWorker && (
        <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-200 flex items-center space-x-3 text-left">
          <div className="w-10 h-10 rounded-lg bg-[#24324A] text-amber-400 flex items-center justify-center font-bold font-serif text-sm">
            {candidateWorker.name?.charAt(0) || 'W'}
          </div>
          <div className="flex-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#20242A]">{candidateWorker.name}</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                ★ {candidateWorker.rating || '4.8'}
              </span>
            </div>
            <p className="text-slate-600 text-[11px]">
              {candidateWorker.trade || 'Certified Cooperative Member'} • {candidateWorker.phone}
            </p>
          </div>
        </div>
      )}

      {/* Operational Dispatch Checklist */}
      <div className="space-y-3 text-left">
        <div className="p-3 rounded-lg bg-[#F7F4EE] border border-[#D9D5CC] flex items-center space-x-3">
          <div className="w-6 h-6 rounded-full bg-[#3C5A48] text-white flex items-center justify-center text-xs flex-shrink-0">
            ✓
          </div>
          <div className="text-xs">
            <span className="font-bold text-[#20242A] block">
              {language === 'hi' ? '1. आवश्यकता व्याख्या और दर सत्यापन' : '1. Requirement Interpreted & Verified'}
            </span>
            <span className="text-[#636D79] text-[11px]">
              {language === 'hi' ? 'सहकारी रेट कार्ड से कार्य और मूल्य मिलान' : 'Tasks mapped to cooperative rate card'}
            </span>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-[#F7F4EE] border border-[#D9D5CC] flex items-center space-x-3">
          <div className="w-6 h-6 rounded-full bg-[#24324A] text-[#DF9F35] flex items-center justify-center text-xs flex-shrink-0 font-bold">
            2
          </div>
          <div className="text-xs">
            <span className="font-bold text-[#20242A] block">
              {language === 'hi' ? '2. निष्पक्ष अवसर एवं भू-स्थानिक इंजन' : '2. Fair Opportunity & Geospatial Engine Active'}
            </span>
            <span className="text-[#636D79] text-[11px]">
              {language === 'hi' ? 'रोटेशन लेज़र द्वारा निकटतम सत्यापित साथी का चयन' : 'Evaluating nearby verified members via rotation ledger'}
            </span>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-[#F7F4EE] border border-[#D9D5CC] flex items-center space-x-3">
          <div className="w-6 h-6 rounded-full bg-white border border-[#D9D5CC] text-[#636D79] flex items-center justify-center text-xs flex-shrink-0">
            3
          </div>
          <div className="text-xs">
            <span className="font-bold text-[#20242A] block">
              {language === 'hi' ? '3. साथी पुष्टि एवं रवानगी' : '3. Worker Confirmation & En-Route Dispatch'}
            </span>
            <span className="text-[#636D79] text-[11px]">
              {language === 'hi'
                ? `साथी स्वीकृति की प्रतीक्षा (${seconds}s शेष)`
                : `Awaiting worker acceptance (${seconds}s remaining)`}
            </span>
          </div>
        </div>
      </div>

      {/* Fairness algorithm badge */}
      <div className="p-3.5 rounded-lg bg-[#F2EFEB] border border-[#D9D5CC] text-left space-y-1.5">
        <div className="flex items-center space-x-2 text-xs font-bold text-[#24324A]">
          <Scale className="w-4 h-4 text-[#C58B2A]" />
          <span>
            {language === 'hi' ? 'लोकतांत्रिक निष्पक्षता सिद्धांत' : 'Fair Distribution Principle'}
          </span>
        </div>
        <p className="text-[11px] text-[#636D79] leading-relaxed">
          {t('customer.fairnessFact')}
        </p>
      </div>

      {/* Live fast-forward trigger */}
      <div className="pt-1 flex items-center justify-between text-xs text-[#636D79] border-t border-[#E2DDD3]">
        <span>
          {language === 'hi' ? 'स्वतः असाइन: ' : 'Auto-assign in: '}
          <strong className="text-[#20242A]">{seconds}s</strong>
        </span>
        <button
          onClick={handleFastForward}
          disabled={isAccepting}
          className="font-semibold text-[#1B4278] hover:text-[#0f284e] hover:underline"
        >
          {isAccepting ? 'Confirming...' : 'Fast-forward Matching (Demo) →'}
        </button>
      </div>

      {/* Cancel Search Button */}
      <div className="pt-2 text-center">
        <button
          type="button"
          onClick={handleCancelSearch}
          disabled={isCancelling}
          className="w-full py-2 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all"
        >
          {isCancelling
            ? (language === 'hi' ? 'अनुरोध रद्द किया जा रहा है...' : 'Cancelling request...')
            : (language === 'hi' ? '✕ अनुरोध रद्द करें' : '✕ Cancel Search')}
        </button>
      </div>
    </div>
  );
};
export default MatchingRadarStep;
