import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Globe, ArrowRight, ShieldCheck, HeartHandshake } from 'lucide-react';

export const LanguageGate = () => {
  const { hasChosenLanguage, selectLanguage, t } = useLanguage();

  if (hasChosenLanguage) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-cosathi-slate/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-cosathi-parchment max-w-lg w-full rounded-3xl p-8 border border-cosathi-border shadow-2xl text-center relative overflow-hidden">
        {/* Decorative Top Accent */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-cosathi-forest via-cosathi-ochre to-cosathi-clay" />

        <div className="w-16 h-16 rounded-2xl bg-cosathi-forest text-white font-bold flex items-center justify-center mx-auto mb-4 text-3xl shadow-md">
          सह
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-cosathi-slate mb-1">
          Choose Your Language / अपनी भाषा चुनें
        </h1>
        <p className="text-sm text-cosathi-muted mb-8">
          CoSathi connects households with cooperative service workers across India.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => selectLanguage('hi')}
            className="group p-5 rounded-2xl bg-white border-2 border-cosathi-border hover:border-cosathi-forest hover:bg-cosathi-surface transition-all shadow-sm flex flex-col items-center justify-center text-center"
          >
            <div className="w-10 h-10 rounded-full bg-cosathi-forest/10 flex items-center justify-center text-cosathi-forest font-bold mb-2 group-hover:scale-110 transition-transform">
              हि
            </div>
            <span className="text-xl font-bold text-cosathi-slate mb-1">हिंदी</span>
            <span className="text-xs text-cosathi-muted">हिंदी में आगे बढ़ें</span>
            <div className="mt-3 flex items-center text-xs text-cosathi-forest font-semibold space-x-1">
              <span>जारी रखें</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          <button
            onClick={() => selectLanguage('en')}
            className="group p-5 rounded-2xl bg-white border-2 border-cosathi-border hover:border-cosathi-clay hover:bg-cosathi-surface transition-all shadow-sm flex flex-col items-center justify-center text-center"
          >
            <div className="w-10 h-10 rounded-full bg-cosathi-clay/10 flex items-center justify-center text-cosathi-clay font-bold mb-2 group-hover:scale-110 transition-transform">
              EN
            </div>
            <span className="text-xl font-bold text-cosathi-slate mb-1">English</span>
            <span className="text-xs text-cosathi-muted">Continue in English</span>
            <div className="mt-3 flex items-center text-xs text-cosathi-clay font-semibold space-x-1">
              <span>Continue</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>

        <div className="flex items-center justify-center space-x-2 text-xs text-cosathi-muted">
          <Globe className="w-3.5 h-3.5 text-cosathi-ochre" />
          <span>You can change your language anytime in your profile settings</span>
        </div>
      </div>
    </div>
  );
};
