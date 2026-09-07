import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import {
  Clock,
  CheckCircle2,
  Calendar,
  Receipt,
  RotateCcw,
  Star,
  ShieldCheck,
} from 'lucide-react';

export const BookingHistory = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  useEffect(() => {
    // Combine seeded history with any completed during this session
    const local = JSON.parse(localStorage.getItem('cosathi_history') || '[]');
    const seeded = [
      {
        bookingNumber: 'CS-2026-0905-001',
        category: 'electrical',
        serviceTitle: 'Ceiling Fan Repair / Capacitor Replace',
        date: '05 Sep 2026',
        workerName: 'Ramesh Kumar (Worker A)',
        amount: 199,
        status: 'completed',
        rating: 5,
      },
      {
        bookingNumber: 'CS-2026-0828-042',
        category: 'plumbing',
        serviceTitle: 'Water Tap Leakage Fix / Spindle Change',
        date: '28 Aug 2026',
        workerName: 'Amit Sharma (Plumber)',
        amount: 149,
        status: 'completed',
        rating: 5,
      },
    ];

    setBookings([...local, ...seeded]);
  }, []);

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

      {bookings.length === 0 ? (
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
