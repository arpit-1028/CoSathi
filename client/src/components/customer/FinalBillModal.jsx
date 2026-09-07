import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Receipt, HeartHandshake, ShieldCheck, ArrowRight, CreditCard, Scale, CheckCircle2 } from 'lucide-react';

export const FinalBillModal = ({
  billItems = [],
  grossTotal = 650,
  rateCardVersion = 'v2026.1',
  initialEstimateRange = '₹450–₹750',
  onProceedToPayment,
}) => {
  const { t } = useLanguage();

  const defaultItems = [
    { title: 'Tap Replacement & Installation', code: 'TAP_REPLACEMENT', unitPrice: 300, quantity: 1 },
    { title: 'Drain Blockage Clearance', code: 'DRAIN_BLOCKAGE', unitPrice: 250, quantity: 1 },
    { title: 'Pipe Cleaning & Scale Flush', code: 'PIPE_CLEANING', unitPrice: 100, quantity: 1 },
  ];

  const items = billItems.length > 0 ? billItems : defaultItems;
  const total = grossTotal || items.reduce((sum, item) => sum + (item.unitPrice * (item.quantity || 1)), 0);
  
  // 90% Worker Earning, 10% Cooperative Fund
  const workerShare = Math.round(total * 0.90);
  const cooperativeShare = total - workerShare;

  return (
    <div className="bg-[#FFFFFF] rounded-xl p-6 sm:p-8 border border-[#D9D5CC] shadow-elevated space-y-6 max-w-2xl mx-auto">
      {/* Cooperative Fair Pricing Directive Header */}
      <div className="p-4 rounded-xl bg-[#24324A] text-white shadow-card flex items-start sm:items-center space-x-3.5 border border-[#162031]">
        <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 text-[#DF9F35] font-serif font-bold">
          <Scale className="w-5 h-5 text-[#DF9F35]" />
        </div>
        <div className="space-y-0.5">
          <span className="text-[10px] uppercase tracking-wider text-[#DF9F35] font-bold block">
            सहकारी मूल्य निर्धारण निर्देश • Cooperative Rate Directive
          </span>
          <p className="text-sm font-serif italic text-white leading-snug">
            "AI identifies the work. The cooperative rate card determines the price."
          </p>
        </div>
      </div>

      {/* Official Cooperative Invoice Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between pb-4 border-b border-[#D9D5CC] gap-3">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-1.5 text-[11px] font-bold uppercase tracking-wider text-[#24324A]">
            <Receipt className="w-3.5 h-3.5 text-[#C58B2A]" />
            <span>Official Cooperative Invoice • सेवा बिल</span>
          </div>
          <h3 className="font-serif text-2xl font-bold text-[#20242A]">
            {t('customer.billTitle')}
          </h3>
          <p className="text-xs text-[#636D79]">
            {t('customer.billSubtitle')}
          </p>
        </div>

        <div className="text-left sm:text-right bg-[#F7F4EE] p-2.5 rounded-lg border border-[#D9D5CC]">
          <span className="text-[10px] text-[#636D79] block">Rate Card Snapshot:</span>
          <span className="font-mono text-xs font-bold text-[#24324A]">
            {rateCardVersion} (Frozen)
          </span>
        </div>
      </div>

      {/* Comparison: Initial Estimate vs Final Bill */}
      <div className="grid grid-cols-2 gap-3 p-3.5 rounded-lg bg-[#F7F4EE] border border-[#D9D5CC] text-xs">
        <div>
          <span className="text-[11px] text-[#636D79] block">Initial Estimated Range</span>
          <span className="font-semibold text-[#20242A] text-sm">{initialEstimateRange || '₹450–₹750'}</span>
        </div>
        <div className="text-right">
          <span className="text-[11px] text-[#636D79] block">Final Verified Bill</span>
          <span className="font-serif font-bold text-[#24324A] text-lg">₹{total}</span>
        </div>
      </div>

      {/* Itemized Table */}
      <div className="space-y-2">
        <div className="flex justify-between text-[11px] font-bold text-[#636D79] uppercase px-2">
          <span>{t('customer.itemDescription')}</span>
          <span>{t('customer.subtotal')}</span>
        </div>

        <div className="divide-y divide-[#E2DDD3] border border-[#D9D5CC] rounded-lg bg-[#FFFFFF] overflow-hidden">
          {items.map((item, idx) => (
            <div key={idx} className="p-3 flex items-center justify-between text-xs">
              <div>
                <span className="font-semibold text-[#20242A] block">{item.title || item.name}</span>
                <span className="text-[11px] text-[#636D79]">
                  <code className="font-mono text-[10px] bg-[#F2EFEB] px-1 py-0.5 rounded border border-[#D9D5CC] mr-1.5">{item.code || 'CODE'}</code>
                  ₹{item.unitPrice} × {item.quantity || 1} unit
                </span>
              </div>
              <span className="font-bold text-[#20242A] text-sm">
                ₹{item.unitPrice * (item.quantity || 1)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Democratic Revenue Distribution: 90% Worker / 10% Cooperative Fund */}
      <div className="p-4 rounded-lg bg-[#F7F4EE] border border-[#D9D5CC] text-[#20242A] space-y-2.5 text-xs">
        <div className="flex items-center justify-between font-bold border-b border-[#D9D5CC] pb-2">
          <span className="flex items-center space-x-1.5 text-[#24324A]">
            <HeartHandshake className="w-4 h-4 text-[#A65343]" />
            <span>पारदर्शी आय वितरण (90/10 Transparent Split)</span>
          </span>
          <span className="text-[11px] text-[#3C5A48] font-mono font-bold">100% Retained by Guild</span>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="p-3 rounded-lg bg-[#FFFFFF] border border-[#D9D5CC]">
            <span className="text-[10px] text-[#636D79] uppercase font-semibold block">Worker Direct Share (90%)</span>
            <span className="text-lg font-serif font-bold text-[#3C5A48]">₹{workerShare}</span>
          </div>
          <div className="p-3 rounded-lg bg-[#FFFFFF] border border-[#D9D5CC]">
            <span className="text-[10px] text-[#636D79] uppercase font-semibold block">Cooperative Fund (10%)</span>
            <span className="text-lg font-serif font-bold text-[#24324A]">₹{cooperativeShare}</span>
          </div>
        </div>
        
        <p className="text-[11px] text-[#636D79] leading-relaxed pt-0.5">
          CoSathi does not extract corporate VC commissions. 90% goes directly to the worker's bank account. 10% funds group healthcare, accident insurance, and the cooperative emergency corpus.
        </p>
      </div>

      {/* Mandatory Explanation Box */}
      <div className="p-3 rounded-lg bg-[#F2EFEB] border border-[#D9D5CC] text-xs flex items-start space-x-2.5">
        <ShieldCheck className="w-4 h-4 text-[#3C5A48] flex-shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-bold text-[#20242A] block">Audit & Reconciliation Guarantee</span>
          <p className="leading-relaxed text-[11px] text-[#636D79]">
            "Final amount is based on completed work and the cooperative rate card."
          </p>
        </div>
      </div>

      {/* Totals and Payment CTA */}
      <div className="pt-2 border-t border-[#D9D5CC] flex items-center justify-between">
        <div>
          <span className="block text-xs text-[#636D79]">{t('customer.netPayable')}</span>
          <span className="text-2xl font-serif font-bold text-[#24324A]">₹{total}</span>
        </div>

        <button
          onClick={onProceedToPayment}
          className="px-6 py-3 bg-[#24324A] hover:bg-[#162031] text-white text-sm font-semibold rounded-lg shadow-card transition-all flex items-center space-x-2"
        >
          <CreditCard className="w-4 h-4 text-[#DF9F35]" />
          <span>Pay ₹{total} (Mock UPI / Payment)</span>
          <ArrowRight className="w-4 h-4 text-[#DF9F35]" />
        </button>
      </div>
    </div>
  );
};

export default FinalBillModal;
