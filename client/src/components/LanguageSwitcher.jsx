import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Globe, Check } from 'lucide-react';

export const LanguageSwitcher = ({ variant = 'dropdown' }) => {
  const { language, selectLanguage, t } = useLanguage();

  if (variant === 'pill') {
    return (
      <div className="inline-flex rounded-lg bg-[#F2EFEB] p-1 border border-[#D9D5CC]">
        <button
          onClick={() => selectLanguage('hi')}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center space-x-1.5 ${
            language === 'hi'
              ? 'bg-[#24324A] text-white shadow-xs'
              : 'text-[#636D79] hover:text-[#20242A]'
          }`}
        >
          {language === 'hi' && <Check className="w-3.5 h-3.5" />}
          <span>हिंदी</span>
        </button>
        <button
          onClick={() => selectLanguage('en')}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center space-x-1.5 ${
            language === 'en'
              ? 'bg-[#24324A] text-white shadow-xs'
              : 'text-[#636D79] hover:text-[#20242A]'
          }`}
        >
          {language === 'en' && <Check className="w-3.5 h-3.5" />}
          <span>English</span>
        </button>
      </div>
    );
  }

  // Default button toggle
  return (
    <button
      onClick={() => selectLanguage(language === 'en' ? 'hi' : 'en')}
      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-[#D9D5CC] bg-white hover:bg-[#F2EFEB] text-[#20242A] transition-colors text-xs font-semibold shadow-xs"
      title="Toggle Language / भाषा बदलें"
    >
      <Globe className="w-3.5 h-3.5 text-[#C58B2A]" />
      <span>{language === 'en' ? 'हिंदी' : 'English'}</span>
    </button>
  );
};
