import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { ShieldCheck, Users, HeartHandshake, Mic, Sparkles, Scale } from 'lucide-react';

export const LandingPage = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-between">
      <section className="py-12 md:py-20 px-4 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center space-x-2 bg-cosathi-surface border border-cosathi-border px-3.5 py-1.5 rounded-full text-xs font-semibold text-cosathi-forest mb-6">
          <ShieldCheck className="w-4 h-4 text-cosathi-clay" />
          <span>Cooperative Service Network • Verified Members</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-cosathi-slate mb-6">
          Dignified Livelihoods.<br />
          <span className="text-cosathi-forest">Cooperative Community Services.</span>
        </h1>

        <p className="text-lg md:text-xl text-cosathi-muted max-w-2xl mx-auto mb-10 leading-relaxed">
          {t('tagline')}. Direct voice booking, AI task understanding, transparent rate cards, and an algorithm engineered for fair work distribution.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto mb-16">
          <Link
            to="/customer/home"
            className="group p-6 rounded-2xl bg-white border border-cosathi-border hover:border-cosathi-clay transition-all shadow-sm hover:shadow-md text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-cosathi-surface group-hover:bg-cosathi-clay/10 flex items-center justify-center mb-4 transition-colors">
              <Mic className="w-6 h-6 text-cosathi-clay" />
            </div>
            <h3 className="font-bold text-lg text-cosathi-slate mb-1">Customer Portal</h3>
            <p className="text-xs text-cosathi-muted">Describe service requirements via voice or text with instant AI breakdown.</p>
          </Link>

          <Link
            to="/worker/dashboard"
            className="group p-6 rounded-2xl bg-white border border-cosathi-border hover:border-cosathi-forest transition-all shadow-sm hover:shadow-md text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-cosathi-surface group-hover:bg-cosathi-forest/10 flex items-center justify-center mb-4 transition-colors">
              <Users className="w-6 h-6 text-cosathi-forest" />
            </div>
            <h3 className="font-bold text-lg text-cosathi-slate mb-1">Worker Companion</h3>
            <p className="text-xs text-cosathi-muted">Mobile-first dispatch, voice completion summary, fair job distribution & welfare.</p>
          </Link>

          <Link
            to="/cooperative/dashboard"
            className="group p-6 rounded-2xl bg-white border border-cosathi-border hover:border-cosathi-ochre transition-all shadow-sm hover:shadow-md text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-cosathi-surface group-hover:bg-cosathi-ochre/10 flex items-center justify-center mb-4 transition-colors">
              <Scale className="w-6 h-6 text-cosathi-ochre" />
            </div>
            <h3 className="font-bold text-lg text-cosathi-slate mb-1">Cooperative Admin</h3>
            <p className="text-xs text-cosathi-muted">Rate card authority, dispute arbitration, welfare pool ledger & demand forecasts.</p>
          </Link>
        </div>

        <div className="flex flex-wrap justify-center items-center gap-8 text-xs text-cosathi-muted border-t border-cosathi-border/60 pt-8">
          <div className="flex items-center space-x-2">
            <Scale className="w-4 h-4 text-cosathi-forest" />
            <span>Fair Work Distribution Engine</span>
          </div>
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-cosathi-ochre" />
            <span>Gemini AI Task Breakdown</span>
          </div>
          <div className="flex items-center space-x-2">
            <HeartHandshake className="w-4 h-4 text-cosathi-clay" />
            <span>Cooperative Social Security Pool</span>
          </div>
        </div>
      </section>
    </div>
  );
};
