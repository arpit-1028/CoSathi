import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { CreditCard, CheckCircle2, ShieldCheck, ArrowRight, Smartphone, Banknote } from 'lucide-react';

export const MockPaymentModal = ({ amount = 298, onPaymentComplete }) => {
  const { t } = useLanguage();
  const [selectedMethod, setSelectedMethod] = useState('upi_gpay');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [txnId, setTxnId] = useState('');

  const paymentOptions = [
    { id: 'upi_gpay', name: 'Google Pay', icon: Smartphone, subtitle: 'Instant UPI Transfer' },
    { id: 'upi_phonepe', name: 'PhonePe', icon: Smartphone, subtitle: 'Instant UPI Transfer' },
    { id: 'upi_bhim', name: 'BHIM UPI', icon: Smartphone, subtitle: 'Direct Bank UPI' },
    { id: 'cash', name: 'Cash on Delivery', icon: Banknote, subtitle: 'Pay physical cash to Worker' },
  ];

  const handlePay = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const generatedTxn = `TXN-UPI-MOCK-${Math.floor(100000 + Math.random() * 900000)}`;
      setTxnId(generatedTxn);
      setIsProcessing(false);
      setIsPaid(true);
    }, 1200);
  };

  return (
    <div className="bg-[#FFFFFF] rounded-xl p-6 sm:p-7 border border-[#D9D5CC] shadow-elevated space-y-6 max-w-lg mx-auto">
      {!isPaid ? (
        <>
          <div className="text-center space-y-1 pb-4 border-b border-[#E2DDD3]">
            <span className="text-[10px] uppercase tracking-wider text-[#C58B2A] font-bold block">
              Direct Settlement • त्वरित भुगतान
            </span>
            <h3 className="font-serif text-xl font-bold text-[#20242A]">{t('customer.mockPayTitle')}</h3>
            <p className="text-xs text-[#636D79]">{t('customer.mockPaySubtitle')}</p>
            <div className="pt-2">
              <span className="text-3xl font-serif font-bold text-[#24324A]">₹{amount}</span>
            </div>
          </div>

          <div className="space-y-2">
            {paymentOptions.map((opt) => {
              const isSelected = selectedMethod === opt.id;
              const Icon = opt.icon;

              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedMethod(opt.id)}
                  className={`w-full p-3 rounded-lg border text-left transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-[#F2EFEB] border-[#24324A] shadow-xs'
                      : 'bg-white border-[#D9D5CC] hover:bg-[#F7F4EE]'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-9 h-9 rounded-md flex items-center justify-center ${
                        isSelected ? 'bg-[#24324A] text-[#DF9F35]' : 'bg-[#F7F4EE] text-[#636D79]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[#20242A] block">{opt.name}</span>
                      <span className="text-[10px] text-[#636D79]">{opt.subtitle}</span>
                    </div>
                  </div>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      isSelected ? 'border-[#24324A] bg-[#24324A] text-white' : 'border-[#D9D5CC]'
                    }`}
                  >
                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#DF9F35]" />}
                  </div>
                </button>
              );
            })}
          </div>

          <button
            onClick={handlePay}
            disabled={isProcessing}
            className="w-full py-3 bg-[#24324A] hover:bg-[#162031] disabled:opacity-50 text-white font-semibold rounded-lg text-sm shadow-card transition-all flex items-center justify-center space-x-2"
          >
            {isProcessing ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Confirm Mock Payment (₹{amount})</span>
                <ArrowRight className="w-4 h-4 text-[#DF9F35]" />
              </>
            )}
          </button>
        </>
      ) : (
        /* Success State */
        <div className="text-center py-6 space-y-4 animate-in zoom-in-95 duration-200">
          <div className="w-14 h-14 rounded-full bg-[#F2EFEB] text-[#3C5A48] flex items-center justify-center mx-auto border border-[#D9D5CC]">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h3 className="font-serif text-xl font-bold text-[#20242A]">{t('customer.paySuccessTitle')}</h3>
            <p className="text-xs text-[#636D79]">
              Amount of <span className="font-bold text-[#24324A]">₹{amount}</span> settled directly to worker and cooperative social security fund.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-[#F7F4EE] border border-[#D9D5CC] text-xs font-mono text-[#636D79]">
            {t('customer.txnId')}: <span className="font-bold text-[#20242A]">{txnId}</span>
          </div>

          <button
            onClick={() => onPaymentComplete(txnId)}
            className="w-full py-3 bg-[#24324A] hover:bg-[#162031] text-white font-semibold rounded-lg text-sm shadow-card transition-all flex items-center justify-center space-x-2"
          >
            <span>{t('customer.reviewTitle')}</span>
            <ArrowRight className="w-4 h-4 text-[#DF9F35]" />
          </button>
        </div>
      )}
    </div>
  );
};
