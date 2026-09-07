import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { ServiceCategoriesGrid } from '../../components/customer/ServiceCategoriesGrid';
import { VoiceRequestWidget } from '../../components/customer/VoiceRequestWidget';
import {
  ShieldCheck,
  Scale,
  Sparkles,
  HeartHandshake,
  Clock,
  ArrowRight,
  ReceiptText,
} from 'lucide-react';

export const CustomerHome = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [selectedCategory, setSelectedCategory] = useState('electrical');

  const handleCategorySelect = (catSlug) => {
    setSelectedCategory(catSlug);
  };

  const handleRequestReady = (text, category) => {
    // Navigate to /customer/book with initial prompt and category state
    navigate('/customer/book', {
      state: {
        rawInput: text,
        category: category || selectedCategory,
      },
    });
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Active Booking Top Notification Pill (If exists) */}
      <div className="p-4 rounded-xl bg-[#FFFFFF] border border-[#D9D5CC] shadow-xs flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="w-2.5 h-2.5 rounded-full bg-[#3C5A48] animate-pulse" />
          <div>
            <span className="text-xs font-serif font-bold text-[#20242A] block">
              {t('customer.activeBookingAlert')}
            </span>
            <span className="text-[11px] text-[#636D79]">
              Booking #CS-2026-0905-081 • Electrician Dispatched
            </span>
          </div>
        </div>
        <Link
          to="/customer/book"
          className="px-3.5 py-1.5 rounded-lg bg-[#24324A] hover:bg-[#162031] text-white text-xs font-semibold transition-all flex items-center space-x-1.5 shadow-xs"
        >
          <span>{t('customer.viewLiveStatus')}</span>
          <ArrowRight className="w-3.5 h-3.5 text-[#DF9F35]" />
        </Link>
      </div>

      {/* Hero Voice & Text Request Widget */}
      <VoiceRequestWidget
        selectedCategory={selectedCategory}
        onRequestReady={handleRequestReady}
      />

      {/* Cooperative Principles Notice (Strict No-Browse Worker Policy) */}
      <div className="p-4 rounded-xl bg-[#FFFFFF] border border-[#D9D5CC] flex items-start space-x-3.5 shadow-xs">
        <div className="p-2 rounded-lg bg-[#F2EFEB] text-[#24324A] flex-shrink-0">
          <Scale className="w-5 h-5 text-[#24324A]" />
        </div>
        <div className="space-y-1">
          <h4 className="text-xs font-serif font-bold text-[#20242A] uppercase tracking-wider">
            Democratic Cooperative Governance • लोकतांत्रिक निष्पक्ष आवंटन
          </h4>
          <p className="text-xs text-[#636D79] leading-relaxed">
            {t('customer.noWorkerPreBrowseNotice')}
          </p>
        </div>
      </div>

      {/* 10 Service Categories Grid */}
      <ServiceCategoriesGrid
        selectedCategory={selectedCategory}
        onSelectCategory={handleCategorySelect}
      />

      {/* How CoSathi Works Section (Matching Screenshot 2) */}
      <section id="how-it-works" className="pt-4 space-y-4">
        <div className="border-b border-[#D9D5CC] pb-3">
          <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#20242A]">
            {t('common.language') === 'hi' ? 'को-साथी कैसे काम करता है' : 'How CoSathi works'}
          </h3>
          <p className="text-xs sm:text-sm text-[#636D79]">
            {t('common.language') === 'hi'
              ? 'बिना किसी बिचौलिये या मनमाने दामों के, पारदर्शी सहकारी सेवा'
              : 'Direct cooperative service without middleman surge or algorithmic bias'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-[#D9D5CC] shadow-xs space-y-2">
            <span className="font-mono text-2xl font-bold text-[#9E472A]">01</span>
            <h4 className="font-serif font-bold text-sm text-[#20242A]">
              Describe the problem
            </h4>
            <p className="text-xs text-[#636D79] leading-relaxed">
              Speak or type it, in Hindi or English — no need to pick a worker yourself.
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-[#D9D5CC] shadow-xs space-y-2">
            <span className="font-mono text-2xl font-bold text-[#1B4278]">02</span>
            <h4 className="font-serif font-bold text-sm text-[#20242A]">
              CoSathi understands
            </h4>
            <p className="text-xs text-[#636D79] leading-relaxed">
              AI identifies the actual tasks and gives an estimate from the cooperative rate card.
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-[#D9D5CC] shadow-xs space-y-2">
            <span className="font-mono text-2xl font-bold text-[#C58B2A]">03</span>
            <h4 className="font-serif font-bold text-sm text-[#20242A]">
              A worker is assigned
            </h4>
            <p className="text-xs text-[#636D79] leading-relaxed">
              The cooperative matches you with a suitable, available worker — fairly, not first-come.
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-[#D9D5CC] shadow-xs space-y-2">
            <span className="font-mono text-2xl font-bold text-[#3C5A48]">04</span>
            <h4 className="font-serif font-bold text-sm text-[#20242A]">
              Work, then the real bill
            </h4>
            <p className="text-xs text-[#636D79] leading-relaxed">
              The final amount is set by the rate card once the work is actually done.
            </p>
          </div>
        </div>
      </section>

      {/* Cooperative Guarantees Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        <div className="p-4 sm:p-5 rounded-xl bg-[#FFFFFF] border border-[#D9D5CC] flex items-start space-x-3.5 shadow-xs">
          <div className="w-9 h-9 rounded-lg bg-[#F2EFEB] text-[#24324A] flex items-center justify-center flex-shrink-0 font-bold">
            <ReceiptText className="w-4 h-4 text-[#C58B2A]" />
          </div>
          <div>
            <h5 className="font-serif font-bold text-xs text-[#20242A]">पारदर्शी रेट कार्ड (Rate Card)</h5>
            <p className="text-[11px] text-[#636D79] mt-0.5 leading-relaxed">
              Standard base rates set transparently by worker cooperatives. No arbitrary surge charges.
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-xl bg-[#FFFFFF] border border-[#D9D5CC] flex items-start space-x-3.5 shadow-xs">
          <div className="w-9 h-9 rounded-lg bg-[#F2EFEB] text-[#24324A] flex items-center justify-center flex-shrink-0 font-bold">
            <ShieldCheck className="w-4 h-4 text-[#3C5A48]" />
          </div>
          <div>
            <h5 className="font-serif font-bold text-xs text-[#20242A]">सत्यापित साथी (Verified Sathis)</h5>
            <p className="text-[11px] text-[#636D79] mt-0.5 leading-relaxed">
              In-person trade verification and police KYC clearance for household security.
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-xl bg-[#FFFFFF] border border-[#D9D5CC] flex items-start space-x-3.5 shadow-xs">
          <div className="w-9 h-9 rounded-lg bg-[#F2EFEB] text-[#24324A] flex items-center justify-center flex-shrink-0 font-bold">
            <HeartHandshake className="w-4 h-4 text-[#A65343]" />
          </div>
          <div>
            <h5 className="font-serif font-bold text-xs text-[#20242A]">श्रमिक कल्याण कोष (90/10 Split)</h5>
            <p className="text-[11px] text-[#636D79] mt-0.5 leading-relaxed">
              90% goes directly to the worker. 10% funds cooperative welfare, pensions, and insurance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
