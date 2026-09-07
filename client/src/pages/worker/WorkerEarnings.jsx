import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../services/api';
import {
  IndianRupee,
  HeartHandshake,
  TrendingUp,
  Calendar,
  CheckCircle2,
  ShieldCheck,
  Receipt,
  Loader2,
} from 'lucide-react';

export const WorkerEarnings = () => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [settlements, setSettlements] = useState([]);
  const [todayTotal, setTodayTotal] = useState(0);
  const [weekTotal, setWeekTotal] = useState(0);
  const [monthTotal, setMonthTotal] = useState(0);
  const [welfareBalance, setWelfareBalance] = useState(0);

  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        setLoading(true);
        const res = await api.get('/bookings/assigned');
        if (res.data?.success && Array.isArray(res.data.bookings)) {
          const completedJobs = res.data.bookings.filter(
            (b) => b.status === 'COMPLETED' || b.paymentStatus === 'PAID'
          );

          let todaySum = 0;
          let monthSum = 0;
          let welfareSum = 0;

          const now = new Date();
          const isToday = (d) => {
            const dt = new Date(d);
            return (
              dt.getDate() === now.getDate() &&
              dt.getMonth() === now.getMonth() &&
              dt.getFullYear() === now.getFullYear()
            );
          };

          const mapped = completedJobs.map((b) => {
            const gross = b.finalPrice || b.initialEstimate || 299;
            const welfare = Math.round(gross * 0.1);
            const net = gross - welfare;

            monthSum += net;
            welfareSum += welfare;
            if (isToday(b.createdAt || b.updatedAt)) {
              todaySum += net;
            }

            return {
              bookingNumber: b.bookingNumber || 'CS-BOOKING',
              date: new Date(b.updatedAt || b.createdAt).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              }),
              task: b.requirementInput?.parsedTasks?.[0]?.title || `${b.category?.name || 'Service'} Task`,
              gross,
              welfare,
              net,
              status: b.paymentStatus === 'PAID' ? 'Credited via UPI' : 'Pending Settlement',
            };
          });

          setSettlements(mapped);
          setTodayTotal(todaySum);
          setWeekTotal(monthSum);
          setMonthTotal(monthSum);
          setWelfareBalance(welfareSum);
        }
      } catch (err) {
        console.warn('Worker earnings load notice:', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchEarnings();
  }, []);

  const metrics = [
    { label: t('worker.todayTotal'), amount: `₹${todayTotal}`, count: `${settlements.length} jobs` },
    { label: t('worker.weekTotal'), amount: `₹${weekTotal}`, count: `${settlements.length} jobs` },
    { label: t('worker.monthTotal'), amount: `₹${monthTotal}`, count: `${settlements.length} jobs` },
  ];

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-12">
      <div className="bg-[#FFFFFF] rounded-xl p-5 sm:p-6 border border-[#D9D5CC] shadow-card space-y-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#C58B2A]">
          {t('worker.earningsTitle')} • आय पंजी
        </span>
        <h2 className="font-serif text-xl font-bold text-[#20242A]">
          Direct Member Payouts & Cooperative Welfare Pool
        </h2>
        <p className="text-xs text-[#636D79]">
          100% transparent: 90% instant net transfer to bank/UPI, 10% dedicated to member insurance & welfare.
        </p>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-3 gap-3">
        {metrics.map((m, idx) => (
          <div key={idx} className="bg-[#FFFFFF] p-3.5 rounded-xl border border-[#D9D5CC] shadow-xs text-center space-y-0.5">
            <span className="text-[11px] font-semibold text-[#636D79] block">{m.label}</span>
            <span className="text-xl font-serif font-bold text-[#24324A] block">{m.amount}</span>
            <span className="text-[10px] text-[#3C5A48] font-semibold block">{m.count}</span>
          </div>
        ))}
      </div>

      {/* Social Security & Welfare Pool Card */}
      <div className="p-4 sm:p-5 rounded-xl bg-[#F7F4EE] border border-[#D9D5CC] text-[#20242A] space-y-2">
        <div className="flex items-center justify-between border-b border-[#E2DDD3] pb-2">
          <div className="flex items-center space-x-2">
            <HeartHandshake className="w-5 h-5 text-[#A65343]" />
            <span className="text-xs font-serif font-bold uppercase tracking-wider text-[#20242A]">
              {t('worker.welfareBalance')} • संचित कल्याण निधि
            </span>
          </div>
          <span className="text-xl font-serif font-bold text-[#3C5A48]">₹{welfareBalance}</span>
        </div>
        <p className="text-xs text-[#636D79] leading-relaxed">
          {t('worker.welfareDesc')} Accumulated automatically with 0% platform extraction. Covers accidental medical claims and union emergency reserves.
        </p>
      </div>

      {/* Recent Settlements */}
      <div className="bg-[#FFFFFF] rounded-xl p-5 sm:p-6 border border-[#D9D5CC] shadow-card space-y-4">
        <div className="flex items-center justify-between border-b border-[#E2DDD3] pb-3">
          <h3 className="text-xs font-serif font-bold text-[#20242A] uppercase tracking-wider flex items-center space-x-1.5">
            <Receipt className="w-4 h-4 text-[#C58B2A]" />
            <span>{t('worker.recentPayouts')} • हाल के भुगतान</span>
          </h3>
          <span className="text-[10px] text-[#3C5A48] font-bold">100% Payout Rate</span>
        </div>

        {loading ? (
          <div className="py-8 flex justify-center items-center text-[#636D79]">
            <Loader2 className="w-6 h-6 animate-spin text-[#1B4278]" />
          </div>
        ) : settlements.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#636D79] italic">
            No completed settlements yet. New completed jobs will reflect here automatically.
          </div>
        ) : (
          <div className="divide-y divide-[#E2DDD3]">
            {settlements.map((s, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-[#20242A]">{s.task}</span>
                    <span className="text-[10px] font-mono text-[#24324A] bg-[#F2EFEB] px-1.5 py-0.5 rounded border border-[#D9D5CC]">
                      {s.bookingNumber}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#636D79] block">
                    {s.date} • Gross: ₹{s.gross} (-₹{s.welfare} Welfare)
                  </span>
                </div>

                <div className="text-right space-y-0.5">
                  <span className="text-sm font-serif font-bold text-[#3C5A48] block">₹{s.net}</span>
                  <span className="text-[10px] text-[#3C5A48] font-semibold block flex items-center justify-end space-x-0.5">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{s.status}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
