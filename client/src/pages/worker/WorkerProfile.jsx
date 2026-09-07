import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';
import {
  Wrench,
  ShieldCheck,
  Globe,
  Award,
  CreditCard,
  Building2,
  Calendar,
  CheckCircle2,
} from 'lucide-react';

export const WorkerProfile = () => {
  const { user, profile } = useAuth();
  const { t } = useLanguage();

  return (
    <div className="space-y-4">
      {/* Identity Card */}
      <div className="bg-white rounded-3xl p-6 border border-cosathi-border shadow-sm">
        <div className="flex items-center space-x-4 mb-5 pb-5 border-b border-cosathi-border">
          <div className="w-16 h-16 rounded-2xl bg-cosathi-forest text-white font-bold flex items-center justify-center text-2xl shadow">
            {user?.name ? user.name.charAt(0) : 'W'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-cosathi-slate">{user?.name}</h2>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cosathi-surface text-cosathi-forest border border-cosathi-border">
                {t('roles.worker')}
              </span>
              <span className="text-xs text-cosathi-muted">
                {profile?.memberId || 'COS-DL-2026-101'}
              </span>
            </div>
          </div>
        </div>

        {/* Language Preference Box */}
        <div className="mb-5 p-4 rounded-2xl bg-cosathi-surface border border-cosathi-border">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold uppercase tracking-wider text-cosathi-forest flex items-center space-x-1.5">
                <Globe className="w-4 h-4 text-cosathi-ochre" />
                <span>{t('profile.languagePreference')}</span>
              </span>
              <p className="text-[11px] text-cosathi-muted">{t('profile.changeLanguagePrompt')}</p>
            </div>
            <LanguageSwitcher variant="pill" />
          </div>
        </div>

        {/* Cooperative Membership Badge */}
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 mb-5 flex items-start space-x-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="text-xs font-bold text-emerald-900 block">
              Cooperative Certified Member
            </span>
            <span className="text-xs text-emerald-700">
              {profile?.cooperative?.name || 'Delhi Shramik Kalyan Sahakari Samiti Ltd.'}
            </span>
            <div className="mt-2 flex items-center space-x-2 text-[11px] text-emerald-800">
              <span className="bg-white/80 px-2 py-0.5 rounded font-mono">
                {profile?.aadhaarVerification?.maskedNumber || 'XXXX-XXXX-1234'}
              </span>
              <span className="flex items-center space-x-1 text-emerald-700 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Physical KYC Verified</span>
              </span>
            </div>
          </div>
        </div>

        {/* Trade and Details */}
        <div className="space-y-3 text-xs">
          <div className="p-3.5 rounded-xl bg-white border border-cosathi-border flex items-center justify-between">
            <span className="text-cosathi-muted font-medium">{t('auth.primarySkill')}</span>
            <span className="font-bold text-cosathi-slate capitalize">
              {profile?.primarySkill ? t(`skills.${profile.primarySkill}`) : 'Electrical Works'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-cosathi-border flex items-center justify-between">
            <span className="text-cosathi-muted font-medium">{t('auth.experienceYears')}</span>
            <span className="font-bold text-cosathi-slate">
              {profile?.experienceYears || 5} Years Certified
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-cosathi-border flex items-center justify-between">
            <span className="text-cosathi-muted font-medium">Bank / UPI Settlement</span>
            <span className="font-mono font-bold text-cosathi-slate">
              {profile?.bankDetails?.upiId || `${user?.phone}@upi`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
