import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import {
  IndianRupee,
  HeartHandshake,
  TrendingUp,
  Calendar,
  CheckCircle2,
  ShieldCheck,
  Receipt,
} from 'lucide-react';

export const WorkerEarnings = () => {
  const { t } = useLanguage();

  const metrics = [
    { label: t('worker.todayTotal'), amount: '₹850', count: '2 jobs' },
    { label: t('worker.weekTotal'), amount: '₹4,250', count: '11 jobs' },
    { label: t('worker.monthTotal'), amount: '₹18,500', count: '48 jobs' },
  ];

  const settlements = [
    {
      bookingNumber: 'CS-2026-0905-081',
      date: 'Today, 02:45 PM',
      task: 'Ceiling Fan Diagnostic & Capacitor Fix',
      gross: 298,
      welfare: 15,
      net: 283,
      status: 'Credited via UPI',
    },
    {
      bookingNumber: 'CS-2026-0905-012',
      date: 'Today, 11:30 AM',
      task: 'Switchboard Socket Replacement',
      gross: 597,
      welfare: 30,
      net: 567,
      status: 'Credited via UPI',
    },
    {
      bookingNumber: 'CS-2026-0904-099',
      date: 'Yesterday, 04:15 PM',
      task: 'MCB Tripping Fault Diagnostic',
      gross: 299,
      welfare: 15,
      net: 284,
      status: 'Credited via UPI',
    },
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
          <span className="text-xl font-serif font-bold text-[#3C5A48]">₹1,420</span>
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
      </div>
    </div>
  );
};
