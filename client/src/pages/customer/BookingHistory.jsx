import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  Clock,
  CheckCircle2,
  Calendar,
  Receipt,
  RotateCcw,
  Star,
  ShieldCheck,
  Loader2,
} from 'lucide-react';

export const BookingHistory = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const res = await api.get('/bookings/my');
        if (res.data?.success && Array.isArray(res.data.bookings)) {
          const apiBookings = res.data.bookings.map((b) => ({
            id: b._id,
            bookingNumber: b.bookingNumber,
            category: b.category?.slug || 'general',
            serviceTitle:
              b.requirementInput?.parsedTasks?.[0]?.title ||
              b.requirementInput?.rawVoiceTranscript ||
              'Cooperative Household Service',
            date: new Date(b.createdAt).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            }),
            workerName: (b.assignedWorker || b.workerId)?.name || 'Cooperative Worker',
            amount: b.finalPrice || b.initialEstimate || 199,
            status: b.status?.toLowerCase() || 'completed',
          }));

          const local = JSON.parse(localStorage.getItem('cosathi_history') || '[]');
          const combined = [...apiBookings, ...local];

          // Deduplicate by bookingNumber
          const uniqueMap = new Map();
          combined.forEach((item) => {
            if (item.bookingNumber && !uniqueMap.has(item.bookingNumber)) {
              uniqueMap.set(item.bookingNumber, item);
            }
          });
          const uniqueBookings = Array.from(uniqueMap.values());

          // Only show sample demo records if it is specifically the demo user Aarav and has zero records
          if (uniqueBookings.length === 0 && user?.phone === '9876543210') {
            setBookings([
              {
                bookingNumber: 'CS-2026-0905-001',
                category: 'electrical',
                serviceTitle: 'Ceiling Fan Repair / Capacitor Replace',
                date: '05 Sep 2026',
                workerName: 'Ramesh Kumar (Worker A)',
                amount: 199,
                status: 'completed',
              },
            ]);
          } else {
            setBookings(uniqueBookings);
          }
        }
      } catch (err) {
        console.warn('Failed to load history:', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [user]);

  const handleRebook = (item) => {
    navigate('/customer/book', {
      state: {
        rawInput: `Need service for ${item.serviceTitle}`,
        category: item.category,
      },
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-cosathi-slate">{t('history.title')}</h2>
          <p className="text-xs text-cosathi-muted">{t('history.subtitle')}</p>
        </div>
        <Link
          to="/customer/book"
          className="px-4 py-2 bg-cosathi-forest hover:bg-cosathi-forest-dark text-white text-xs font-bold rounded-xl shadow-xs transition-all"
        >
          + New Service Request
        </Link>
      </div>

      {loading ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-cosathi-border">
          <Loader2 className="w-8 h-8 text-cosathi-forest animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-cosathi-muted">Loading your booking history...</p>
        </div>
      ) : bookings.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-cosathi-border">
          <Clock className="w-12 h-12 text-cosathi-muted mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium text-cosathi-muted">{t('history.noBookings')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((b, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl p-5 border border-cosathi-border shadow-xs hover:border-cosathi-forest/40 transition-all space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-cosathi-border/60">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-bold text-cosathi-forest">
                    {b.bookingNumber}
                  </span>
                  <span className="text-[11px] text-cosathi-muted">• {b.date}</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Completed</span>
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <h4 className="font-bold text-sm text-cosathi-slate">{b.serviceTitle}</h4>
                  <p className="text-xs text-cosathi-muted">
                    Sathi: <span className="font-semibold text-cosathi-slate">{b.workerName}</span> • Cooperative Certified
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <span className="text-xs text-cosathi-muted block">Settled Amount</span>
                    <span className="text-base font-bold text-cosathi-forest">₹{b.amount}</span>
                  </div>

                  <button
                    onClick={() => handleRebook(b)}
                    className="p-2.5 rounded-xl bg-cosathi-surface hover:bg-cosathi-border/40 text-cosathi-slate border border-cosathi-border text-xs font-bold transition-all flex items-center space-x-1"
                    title={t('history.rebook')}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{t('history.rebook')}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
