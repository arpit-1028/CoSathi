import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import api from '../../services/api';
import { IncomingBookingAlert } from '../../components/worker/IncomingBookingAlert';
import { VoiceWorkReportModal } from '../../components/worker/VoiceWorkReportModal';
import {
  Power,
  Star,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  MapPin,
  Clock,
  Phone,
  MessageSquare,
  Navigation,
  Wrench,
  Calendar,
  IndianRupee,
  Bell,
  ArrowRight,
  Radio,
  XCircle,
  Trash2,
  AlertCircle,
} from 'lucide-react';

export const WorkerDashboard = () => {
  const { t, language } = useLanguage();
  const { user, profile } = useAuth();
  const { socket, isConnected } = useSocket();

  // Duty Toggle
  const [isOnDuty, setIsOnDuty] = useState(true);
  const [serviceRadius, setServiceRadius] = useState(12);

  // Incoming Alert State
  const [showIncomingAlert, setShowIncomingAlert] = useState(false);
  const [incomingBookingOffer, setIncomingBookingOffer] = useState(null);

  // Active Job State: null | { ...bookingDetails, state: 'accepted' | 'en_route' | 'arrived' | 'working' | 'billed' }
  const [activeJob, setActiveJob] = useState(null);
  const [performanceData, setPerformanceData] = useState(null);

  // Voice Report Modal
  const [showVoiceReport, setShowVoiceReport] = useState(false);

  // Bill Submitted Confirmation Pill
  const [billSubmittedNotice, setBillSubmittedNotice] = useState(false);

  // Verification state
  const verifStatus = profile?.verificationStatus?.toUpperCase() || 'VERIFIED';

  // Fetch performance metrics
  useEffect(() => {
    const fetchPerformance = async () => {
      try {
        const res = await api.get('/worker/my-performance');
        if (res.data?.success && res.data?.data?.performance) {
          setPerformanceData(res.data.data.performance);
        }
      } catch (err) {
        // Safe ignore fallback
      }
    };
    fetchPerformance();
  }, []);

  // Listen for real-time dispatch offers via Socket.io
  useEffect(() => {
    if (!socket) return;

    const handleOffer = (offerPayload) => {
      console.log('[WorkerDashboard] Real-time booking offer received:', offerPayload);
      setIncomingBookingOffer(offerPayload);
      setShowIncomingAlert(true);
    };

    const handleTimeout = (data) => {
      console.log('[WorkerDashboard] Offer timed out:', data);
      setShowIncomingAlert(false);
      setIncomingBookingOffer(null);
    };

    socket.on('booking:offer', handleOffer);
    socket.on('booking:offer_timeout', handleTimeout);

    return () => {
      socket.off('booking:offer', handleOffer);
      socket.off('booking:offer_timeout', handleTimeout);
    };
  }, [socket]);

  // Load existing active booking on initial mount and poll every 2.5s
  useEffect(() => {
    const fetchActiveJob = async () => {
      try {
        let res;
        try {
          res = await api.get('/bookings/worker/active');
        } catch (e) {
          res = await api.get('/bookings/active');
        }

        // 1. Set active job if ongoing
        if (res.data?.hasActiveBooking && res.data.booking) {
          const b = res.data.booking;
          setActiveJob({
            ...b,
            bookingId: b._id,
            bookingNumber: b.bookingNumber,
            customerName: b.customer?.name || 'Customer',
            rawText: b.voiceTranscript || 'Service requirement',
            address: b.address?.addressLine || b.address?.city || 'Delhi',
            floorPayout: b.finalPrice || b.initialEstimate,
            status: b.status === 'ACCEPTED' ? 'accepted'
              : b.status === 'ON_THE_WAY' ? 'en_route'
              : b.status === 'ARRIVED' ? 'arrived'
              : b.status === 'IN_PROGRESS' ? 'working'
              : 'accepted',
          });
        } else {
          setActiveJob(null);
        }

        // 2. Set incoming dispatch offer (runs independently so new requests always show!)
        if (res.data?.hasPendingOffer && res.data.offer) {
          setIncomingBookingOffer(res.data.offer);
          setShowIncomingAlert(true);
        }
      } catch (err) {
        // Safe ignore
      }
    };

    fetchActiveJob();
    const interval = setInterval(fetchActiveJob, 2500);
    return () => clearInterval(interval);
  }, []);

  const handleAcceptBooking = async (bookingData) => {
    setShowIncomingAlert(false);
    const bId = bookingData?.bookingId || bookingData?._id;

    if (bId) {
      try {
        await api.post(`/bookings/${bId}/accept`);
      } catch (err) {
        console.warn('[Worker] API accept error:', err.response?.data?.message || err.message);
      }
    }

    setActiveJob({
      ...bookingData,
      status: 'accepted',
    });
    setIncomingBookingOffer(null);
  };

  const handleDeclineBooking = async () => {
    setShowIncomingAlert(false);
    const bId = incomingBookingOffer?.bookingId || incomingBookingOffer?._id;
    if (bId) {
      try {
        await api.post(`/bookings/${bId}/decline`, { reason: 'Worker declined via companion app' });
      } catch (err) {
        console.warn('[Worker] API decline error:', err.response?.data?.message || err.message);
      }
    }
    setIncomingBookingOffer(null);
  };

  const handleClearActiveJob = async () => {
    if (!window.confirm(language === 'hi' ? 'क्या आप इस कार्य को पूर्ण और साफ़ करना चाहते हैं? इससे नया कार्य प्राप्त हो सकेगा।' : 'Clear this active job and mark complete? This enables receiving new requests.')) return;
    try {
      await api.post('/bookings/worker/clear-active');
      setActiveJob(null);
    } catch (e) {
      console.warn('Clear error:', e);
      setActiveJob(null);
    }
  };

  const handleJobAction = async () => {
    if (!activeJob) return;
    const bId = activeJob.bookingId || activeJob._id;

    if (activeJob.status === 'accepted') {
      if (bId) {
        try { await api.post(`/bookings/${bId}/on-the-way`); } catch (e) {}
      }
      setActiveJob({ ...activeJob, status: 'en_route' });
    } else if (activeJob.status === 'en_route') {
      if (bId) {
        try { await api.post(`/bookings/${bId}/arrived`); } catch (e) {}
      }
      setActiveJob({ ...activeJob, status: 'arrived' });
    } else if (activeJob.status === 'arrived') {
      if (bId) {
        try { await api.post(`/bookings/${bId}/start-work`); } catch (e) {}
      }
      setActiveJob({ ...activeJob, status: 'working' });
    } else if (activeJob.status === 'working') {
      setShowVoiceReport(true);
    }
  };

  const handleBillSubmitted = (billData) => {
    setShowVoiceReport(false);
    setActiveJob(null);
    setBillSubmittedNotice(true);
    setTimeout(() => setBillSubmittedNotice(false), 5000);
  };

  return (
    <div className="space-y-5 pb-12 max-w-xl mx-auto">
      {/* 1. Large AVAILABLE / NOT AVAILABLE Switch */}
      <div className="bg-[#FFFFFF] rounded-xl p-5 sm:p-6 border border-[#D9D5CC] shadow-card space-y-4">
        <div className="flex items-center justify-between border-b border-[#E2DDD3] pb-3">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#C58B2A]">
              {language === 'hi' ? 'साथी कार्यक्षेत्र' : 'Worker Companion'}
            </span>
            <h2 className="font-serif text-lg font-bold text-[#20242A]">
              {user?.name || 'Worker'}
            </h2>
          </div>

          <div className="flex items-center space-x-1.5">
            <span
              className={`px-3 py-1 rounded-md text-xs font-bold border ${
                verifStatus === 'VERIFIED' || verifStatus === 'APPROVED'
                  ? 'bg-[#F2EFEB] text-[#3C5A48] border-[#D9D5CC]'
                  : 'bg-[#FFF8E7] text-[#C58B2A] border-[#DF9F35]'
              }`}
            >
              {t(`worker.verifStates.${verifStatus}`) || (language === 'hi' ? 'सत्यापित सदस्य' : 'Verified Member')}
            </span>
          </div>
        </div>

        {/* Big Tactile Duty Button */}
        <button
          type="button"
          onClick={() => setIsOnDuty(!isOnDuty)}
          className={`w-full py-4 px-6 rounded-xl font-bold text-sm sm:text-base transition-all shadow-card flex items-center justify-center space-x-3 ${
            isOnDuty
              ? 'bg-[#24324A] hover:bg-[#162031] text-white ring-2 ring-[#DF9F35]'
              : 'bg-[#F7F4EE] hover:bg-[#F2EFEB] text-[#20242A] border border-[#D9D5CC]'
          }`}
        >
          <Power className={`w-5 h-5 ${isOnDuty ? 'text-[#DF9F35]' : 'text-[#636D79]'}`} />
          <span>{isOnDuty ? (language === 'hi' ? 'ड्यूटी पर उपस्थित' : 'AVAILABLE FOR WORK') : (language === 'hi' ? 'विश्राम पर' : 'NOT AVAILABLE (OFF DUTY)')}</span>
        </button>

        <p className="text-[11px] text-[#636D79] text-center italic">
          {t('worker.toggleDutyPrompt')}
        </p>
      </div>

      {/* TOP URGENT BANNER: NEW WORK ASSIGNED / INCOMING REQUEST */}
      {incomingBookingOffer && (
        <div className="bg-gradient-to-br from-amber-50 via-white to-orange-50 border-2 border-[#DF9F35] rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4 ring-4 ring-amber-300/60 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-start justify-between border-b border-amber-200/80 pb-3">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-[#24324A] text-[#DF9F35] flex items-center justify-center font-bold shadow-md flex-shrink-0">
                <Bell className="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider bg-red-600 text-white px-2.5 py-0.5 rounded-full inline-block mb-1 animate-pulse shadow-xs">
                  🚨 {language === 'hi' ? 'नया काम आवंटित • तत्काल उत्तर दें' : 'NEW WORK ASSIGNED • ACT NOW'}
                </span>
                <h3 className="font-serif text-lg font-bold text-[#20242A]">
                  {incomingBookingOffer.category || 'Cooperative Service'}
                </h3>
                <span className="text-xs text-[#636D79] block">
                  Ref #{incomingBookingOffer.bookingNumber} • {incomingBookingOffer.distance || '1.2 km away'}
                </span>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <span className="text-[10px] uppercase font-bold text-[#636D79] block">Floor Payout</span>
              <span className="text-xl font-serif font-black text-[#3C5A48]">₹{incomingBookingOffer.floorPayout}</span>
            </div>
          </div>

          {/* Customer Requirement & Location */}
          <div className="bg-white rounded-xl p-3.5 border border-amber-200 space-y-1.5 text-xs shadow-xs">
            <div className="flex items-center justify-between font-semibold text-[#20242A]">
              <span>👤 {incomingBookingOffer.customerName || 'Verified Customer'}</span>
              <span className="text-[#636D79]">📍 {incomingBookingOffer.address}</span>
            </div>
            <p className="text-sm font-serif italic text-[#24324A] font-medium bg-amber-50/70 p-2.5 rounded-lg border border-amber-200/60">
              "{incomingBookingOffer.rawText}"
            </p>
          </div>

          {/* Action Buttons: Accept or Reject */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={handleDeclineBooking}
              className="py-3 px-4 rounded-xl border border-rose-300 bg-white hover:bg-rose-50 text-rose-700 font-bold text-xs sm:text-sm flex items-center justify-center space-x-1.5 transition-all shadow-xs active:scale-98"
            >
              <XCircle className="w-4 h-4" />
              <span>{language === 'hi' ? 'अस्वीकार करें (Reject)' : 'Reject'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleAcceptBooking(incomingBookingOffer)}
              className="py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center space-x-1.5 transition-all shadow-md ring-2 ring-emerald-500 animate-pulse active:scale-98"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{language === 'hi' ? 'कार्य स्वीकार करें (Accept Work)' : 'Accept Work'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Service Area & Operational Radius Card */}
      <div className="bg-[#FFFFFF] rounded-xl p-5 border border-[#D9D5CC] shadow-card space-y-3">
        <div className="flex items-center justify-between border-b border-[#E2DDD3] pb-2">
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-[#A65343]" />
            <h4 className="text-xs font-serif font-bold text-[#20242A] uppercase tracking-wider">
              {language === 'hi' ? 'सेवा क्षेत्र दायरा' : 'Service Radius'}
            </h4>
          </div>
          <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-[#24324A] text-white">
            {serviceRadius} km radius
          </span>
        </div>

        <div className="space-y-1.5 pt-1">
          <input
            type="range"
            min="3"
            max="30"
            step="1"
            value={serviceRadius}
            onChange={async (e) => {
              const rad = Number(e.target.value);
              setServiceRadius(rad);
              try {
                await api.put('/geo/worker-service-area', { serviceRadiusKm: rad });
              } catch (err) {}
            }}
            className="w-full accent-[#24324A] h-2 bg-[#D9D5CC] rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-[#636D79] font-semibold">
            <span>3 km (Hyperlocal)</span>
            <span>15 km (Central Delhi)</span>
            <span>30 km (Entire NCR)</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-[#636D79] pt-2 border-t border-[#E2DDD3]">
          <span>Active Base: <strong>South & Central Delhi</strong></span>
          <span className="text-[#3C5A48] font-semibold flex items-center space-x-1">
            <Radio className="w-3 h-3 animate-pulse" />
            <span>GPS Ready</span>
          </span>
        </div>
      </div>

      {/* Bill Submitted Toast */}
      {billSubmittedNotice && (
        <div className="p-4 rounded-xl bg-[#F2EFEB] border border-[#D9D5CC] text-[#20242A] text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 text-[#3C5A48] flex-shrink-0" />
          <span className="font-bold">{t('worker.billSubmittedSuccess')}</span>
        </div>
      )}

      {/* 2. Active Job Card (if accepted) */}
      {activeJob ? (
        <div className="bg-[#FFFFFF] rounded-xl p-5 sm:p-6 border-2 border-[#24324A] shadow-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E2DDD3]">
            <span className="text-xs font-bold text-[#24324A] uppercase tracking-wider flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-[#3C5A48] animate-pulse" />
              <span>{t('worker.activeJobTitle')} • सक्रिय सेवा कार्य</span>
            </span>
            <span className="font-mono text-xs font-bold text-[#20242A]">
              #{activeJob.bookingNumber}
            </span>
          </div>

          <div className="space-y-1">
            <h3 className="font-serif font-bold text-base text-[#20242A]">{activeJob.serviceTitle}</h3>
            <p className="text-xs text-[#636D79] italic bg-[#F7F4EE] p-2 rounded-lg border border-[#D9D5CC]">"{activeJob.rawText}"</p>
          </div>

          <div className="p-3.5 rounded-lg bg-[#F7F4EE] border border-[#D9D5CC] space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[#636D79] font-medium">Customer:</span>
              <span className="font-bold text-[#20242A]">{activeJob.customerName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#636D79] font-medium">Address:</span>
              <span className="font-semibold text-[#20242A]">{activeJob.address}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#636D79] font-medium">Floor Rate:</span>
              <span className="font-serif font-bold text-[#24324A] text-sm">₹{activeJob.floorPayout}</span>
            </div>
          </div>

          {/* Dynamic Job Progression Button */}
          <button
            onClick={handleJobAction}
            className="w-full py-3.5 bg-[#24324A] hover:bg-[#162031] text-white text-xs sm:text-sm font-semibold rounded-lg shadow-card transition-all flex items-center justify-center space-x-2"
          >
            {activeJob.status === 'accepted' && (
              <>
                <Navigation className="w-4 h-4 text-[#DF9F35]" />
                <span>{t('worker.btnEnRoute')}</span>
              </>
            )}
            {activeJob.status === 'en_route' && (
              <>
                <MapPin className="w-4 h-4 text-[#DF9F35]" />
                <span>{t('worker.btnArrived')}</span>
              </>
            )}
            {activeJob.status === 'arrived' && (
              <>
                <Wrench className="w-4 h-4 text-[#DF9F35]" />
                <span>{t('worker.btnStartWork')}</span>
              </>
            )}
            {activeJob.status === 'working' && (
              <>
                <CheckCircle2 className="w-4 h-4 text-[#DF9F35]" />
                <span>{t('worker.btnFinishWork')}</span>
              </>
            )}
          </button>

          {/* Reset / Clear Active Job button (for demo / hackathon resets) */}
          <div className="pt-2 flex items-center justify-between border-t border-[#E2DDD3] text-xs">
            <span className="text-[#636D79]">Need to free your account for new jobs?</span>
            <button
              type="button"
              onClick={handleClearActiveJob}
              className="text-rose-600 hover:text-rose-800 hover:underline font-bold flex items-center space-x-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'कार्य पूर्ण / साफ़ करें (Clear Job)' : 'Clear / Reset Job'}</span>
            </button>
          </div>
        </div>
      ) : (
        /* Demo Dispatch Simulator Button */
        <div className="p-4 rounded-xl bg-[#FFFFFF] border border-[#D9D5CC] flex items-center justify-between shadow-xs">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-[#20242A] block">Test Matching Engine Dispatch</span>
            <span className="text-[11px] text-[#636D79]">Simulate incoming socket dispatch offer with 60s countdown</span>
          </div>
          <button
            onClick={() => setShowIncomingAlert(true)}
            disabled={!isOnDuty}
            className="px-3.5 py-2 rounded-lg bg-[#24324A] hover:bg-[#162031] disabled:opacity-40 text-white text-xs font-semibold transition-all shadow-xs flex items-center space-x-1.5"
          >
            <Bell className="w-3.5 h-3.5 text-[#DF9F35]" />
            <span>Simulate Offer</span>
          </button>
        </div>
      )}

      {/* 3. Performance & Earnings Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-[#FFFFFF] p-3.5 rounded-xl border border-[#D9D5CC] shadow-xs text-center">
          <span className="text-[11px] font-semibold text-[#636D79] block">
            {t('worker.todayBookings')}
          </span>
          <span className="text-2xl font-serif font-bold text-[#20242A] block mt-1">2</span>
          <span className="text-[10px] text-[#3C5A48] font-semibold block">All Completed</span>
        </div>

        <div className="bg-[#FFFFFF] p-3.5 rounded-xl border border-[#D9D5CC] shadow-xs text-center">
          <span className="text-[11px] font-semibold text-[#636D79] block">
            {t('worker.todayEarnings')}
          </span>
          <span className="text-2xl font-serif font-bold text-[#24324A] block mt-1">₹850</span>
          <span className="text-[10px] text-[#636D79] block">Direct Cooperative Payout</span>
        </div>

        <div className="bg-[#FFFFFF] p-3.5 rounded-xl border border-[#D9D5CC] shadow-xs text-center">
          <span className="text-[11px] font-semibold text-[#636D79] block">
            {t('worker.rating')}
          </span>
          <span className="text-2xl font-serif font-bold text-[#20242A] block mt-1 flex items-center justify-center space-x-1">
            <Star className="w-4 h-4 fill-[#DF9F35] text-[#DF9F35]" />
            <span>{performanceData?.averageRating ? performanceData.averageRating.toFixed(1) : '4.9'}</span>
          </span>
          <span className="text-[10px] text-[#636D79] block">
            {performanceData?.totalRatingsCount !== undefined ? performanceData.totalRatingsCount : 180} Verified Reviews
          </span>
        </div>

        <div className="bg-[#FFFFFF] p-3.5 rounded-xl border border-[#D9D5CC] shadow-xs text-center">
          <span className="text-[11px] font-semibold text-[#636D79] block">
            {t('worker.completedJobs')}
          </span>
          <span className="text-2xl font-serif font-bold text-[#20242A] block mt-1">
            {performanceData?.lifetimeJobsCompleted !== undefined ? performanceData.lifetimeJobsCompleted : 200}
          </span>
          <span className="text-[10px] text-[#636D79] block">Lifetime Certified</span>
        </div>

        <div className="bg-[#FFFFFF] p-3.5 rounded-xl border border-[#D9D5CC] shadow-xs text-center">
          <span className="text-[11px] font-semibold text-[#636D79] block">
            {t('worker.completionRate')}
          </span>
          <span className="text-2xl font-serif font-bold text-[#3C5A48] block mt-1">
            {performanceData?.completionRatePercent !== undefined ? `${performanceData.completionRatePercent}%` : '98%'}
          </span>
          <span className="text-[10px] text-[#636D79] block">Cooperative Trust Tier 1</span>
        </div>

        <Link
          to="/worker/availability"
          className="bg-[#F2EFEB] p-3.5 rounded-xl border border-[#D9D5CC] hover:border-[#24324A] shadow-xs text-center transition-all flex flex-col items-center justify-center"
        >
          <Calendar className="w-5 h-5 text-[#24324A] mb-1" />
          <span className="text-xs font-bold text-[#20242A]">Weekly Shifts</span>
          <span className="text-[10px] text-[#636D79]">Manage Hours →</span>
        </Link>
      </div>

      {/* 3b. Customer Compliments & Fair Opportunity Card */}
      <div className="bg-[#FFFFFF] rounded-xl p-5 border border-[#D9D5CC] shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-[#E2DDD3] pb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#24324A] flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#3C5A48]" />
            <span>Customer Compliments & Verified Badges</span>
          </span>
          <span className="text-[10px] font-semibold text-[#636D79]">
            Acceptance: {performanceData?.acceptanceRatePercent || 96}%
          </span>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <div className="px-3 py-1 rounded-md bg-[#F7F4EE] border border-[#D9D5CC] text-[#20242A] text-xs font-semibold flex items-center space-x-1.5">
            <span>⏱️ On time</span>
            <span className="bg-[#EAE5DA] text-[#20242A] rounded px-1.5 py-0.2 text-[10px]">
              {performanceData?.tagCounts?.onTime || 42}
            </span>
          </div>
          <div className="px-3 py-1 rounded-md bg-[#F7F4EE] border border-[#D9D5CC] text-[#20242A] text-xs font-semibold flex items-center space-x-1.5">
            <span>🤝 Professional</span>
            <span className="bg-[#EAE5DA] text-[#20242A] rounded px-1.5 py-0.2 text-[10px]">
              {performanceData?.tagCounts?.professional || 38}
            </span>
          </div>
          <div className="px-3 py-1 rounded-md bg-[#F7F4EE] border border-[#D9D5CC] text-[#20242A] text-xs font-semibold flex items-center space-x-1.5">
            <span>✨ Good quality</span>
            <span className="bg-[#EAE5DA] text-[#20242A] rounded px-1.5 py-0.2 text-[10px]">
              {performanceData?.tagCounts?.goodQuality || 35}
            </span>
          </div>
          <div className="px-3 py-1 rounded-md bg-[#F7F4EE] border border-[#D9D5CC] text-[#20242A] text-xs font-semibold flex items-center space-x-1.5">
            <span>🏷️ Fair pricing</span>
            <span className="bg-[#EAE5DA] text-[#20242A] rounded px-1.5 py-0.2 text-[10px]">
              {performanceData?.tagCounts?.fairPricing || 29}
            </span>
          </div>
          <div className="px-3 py-1 rounded-md bg-[#F7F4EE] border border-[#D9D5CC] text-[#20242A] text-xs font-semibold flex items-center space-x-1.5">
            <span>🧹 Clean work</span>
            <span className="bg-[#EAE5DA] text-[#20242A] rounded px-1.5 py-0.2 text-[10px]">
              {performanceData?.tagCounts?.cleanWork || 27}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Quick Links for Onboarding & KYC */}
      <div className="p-4 rounded-xl bg-[#FFFFFF] border border-[#D9D5CC] shadow-xs flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-[#F2EFEB] text-[#24324A] flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-[#24324A]" />
          </div>
          <div>
            <span className="text-xs font-serif font-bold text-[#20242A] block">सहकारी सदस्यता प्रमाणन (Member Verification)</span>
            <span className="text-[11px] text-[#636D79]">Review KYC docs, Face photo & 15s Intro video</span>
          </div>
        </div>

        <Link
          to="/worker/kyc"
          className="px-3.5 py-1.5 rounded-lg bg-[#24324A] hover:bg-[#162031] text-white text-xs font-semibold transition-all flex items-center space-x-1"
        >
          <span>View KYC</span>
          <ArrowRight className="w-3 h-3 text-[#DF9F35]" />
        </Link>
      </div>

      {/* Incoming Offer Alert Modal */}
      {showIncomingAlert && (
        <IncomingBookingAlert
          booking={incomingBookingOffer}
          onAccept={handleAcceptBooking}
          onDecline={handleDeclineBooking}
        />
      )}

      {/* Voice Work Report Modal */}
      {showVoiceReport && (
        <VoiceWorkReportModal
          booking={activeJob}
          onSubmitBill={handleBillSubmitted}
          onClose={() => setShowVoiceReport(false)}
        />
      )}
    </div>
  );
};
