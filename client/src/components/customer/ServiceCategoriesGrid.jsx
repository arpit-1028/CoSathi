import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import {
  Wrench,
  Zap,
  Sparkles,
  Home,
  Hammer,
  Paintbrush,
  Car,
  Heart,
  Flower2,
  Tv,
} from 'lucide-react';

export const serviceCategoriesData = [
  { id: 'plumbing', slug: 'plumbing', icon: Wrench, color: 'text-sky-600', bg: 'bg-sky-50' },
  { id: 'electrical', slug: 'electrical', icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50' },
  { id: 'cleaning', slug: 'cleaning', icon: Sparkles, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { id: 'domestic-help', slug: 'domestic-help', icon: Home, color: 'text-rose-600', bg: 'bg-rose-50' },
  { id: 'carpentry', slug: 'carpentry', icon: Hammer, color: 'text-amber-800', bg: 'bg-amber-100/50' },
  { id: 'painting', slug: 'painting', icon: Paintbrush, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { id: 'driver', slug: 'driver', icon: Car, color: 'text-teal-600', bg: 'bg-teal-50' },
  { id: 'caregiver', slug: 'caregiver', icon: Heart, color: 'text-red-500', bg: 'bg-red-50' },
  { id: 'gardening', slug: 'gardening', icon: Flower2, color: 'text-green-600', bg: 'bg-green-50' },
  { id: 'appliance-repair', slug: 'appliance-repair', icon: Tv, color: 'text-purple-600', bg: 'bg-purple-50' },
];

export const ServiceCategoriesGrid = ({ onSelectCategory, selectedCategory }) => {
  const { t, language } = useLanguage();

  return (
    <div id="services" className="space-y-4 pt-2">
      <div className="flex items-center justify-between border-b border-[#D9D5CC] pb-3">
        <div>
          <h3 className="font-serif text-xl font-bold text-[#20242A]">
            {language === 'hi' ? 'या कोई सेवा चुनें' : 'Or choose a trade'}
          </h3>
          <p className="text-xs text-[#636D79]">
            {language === 'hi'
              ? 'सहकारी-अनुमोदित कार्यक्षेत्र एवं पारदर्शी रेट कार्ड'
              : 'Browse approved trades and cooperative rate cards'}
          </p>
        </div>
        <span className="text-[11px] font-semibold text-[#9E472A] tracking-wider uppercase bg-[#F2EFEB] px-2.5 py-1 rounded-md border border-[#D9D5CC]">
          10 Approved Trades
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {serviceCategoriesData.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.slug;

          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.slug)}
              className={`p-3.5 rounded-xl border text-center transition-all group flex flex-col items-center justify-center space-y-2 ${
                isSelected
                  ? 'bg-[#24324A] text-white border-[#162031] shadow-card scale-[1.02]'
                  : 'bg-[#FFFFFF] border-[#D9D5CC] hover:border-[#24324A]/40 hover:bg-[#F7F4EE] shadow-xs'
              }`}
            >
              <div
                className={`w-11 h-11 rounded-lg flex items-center justify-center transition-transform ${
                  isSelected
                    ? 'bg-white/15 text-[#DF9F35]'
                    : 'bg-[#F2EFEB] text-[#24324A] group-hover:bg-[#EAE5DA]'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <span
                  className={`text-xs font-bold leading-snug block ${
                    isSelected ? 'text-white' : 'text-[#20242A]'
                  }`}
                >
                  {t(`categories.${cat.slug}`)}
                </span>
                <span
                  className={`text-[10px] block ${
                    isSelected ? 'text-[#DF9F35]' : 'text-[#636D79]'
                  }`}
                >
                  {cat.slug === 'plumbing' ? '₹150 min' : cat.slug === 'electrical' ? '₹200 min' : 'Std Rate'}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
