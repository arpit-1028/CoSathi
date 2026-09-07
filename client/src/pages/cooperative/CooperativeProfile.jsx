import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';
import { Building2, Globe, ShieldCheck, Mail, Phone } from 'lucide-react';

export const CooperativeProfile = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  return (
    <div className="max-w-2xl space-y-6">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-cosathi-border shadow-sm">
        <div className="flex items-center space-x-4 mb-6 pb-6 border-b border-cosathi-border">
          <div className="w-16 h-16 rounded-2xl bg-cosathi-ochre text-white font-bold flex items-center justify-center text-2xl shadow">
            {user?.name ? user.name.charAt(0) : 'A'}
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-cosathi-slate">{user?.name}</h2>
            <div className="flex items-center space-x-2 mt-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cosathi-surface text-cosathi-ochre border border-cosathi-border">
                {t('roles.cooperative_admin')}
              </span>
              <span className="text-xs text-cosathi-muted">Executive Board Member</span>
            </div>
          </div>
        </div>

        {/* Language Preference Box */}
        <div className="mb-6 p-5 rounded-2xl bg-cosathi-surface border border-cosathi-border">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-cosathi-forest flex items-center space-x-1.5">
                <Globe className="w-4 h-4 text-cosathi-ochre" />
                <span>{t('profile.languagePreference')}</span>
              </span>
              <p className="text-xs text-cosathi-muted">{t('profile.changeLanguagePrompt')}</p>
            </div>
            <LanguageSwitcher variant="pill" />
          </div>
        </div>

        {/* Administrative Details */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-cosathi-slate uppercase tracking-wide">
            {t('profile.accountDetails')}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white border border-cosathi-border flex items-start space-x-3">
              <Phone className="w-4 h-4 text-cosathi-muted mt-0.5" />
              <div>
                <span className="block text-[11px] text-cosathi-muted font-medium">Contact Phone</span>
                <span className="text-sm font-semibold text-cosathi-slate">{user?.phone}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-cosathi-border flex items-start space-x-3">
              <Mail className="w-4 h-4 text-cosathi-muted mt-0.5" />
              <div>
                <span className="block text-[11px] text-cosathi-muted font-medium">Official Email</span>
                <span className="text-sm font-semibold text-cosathi-slate">{user?.email || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-cosathi-border flex items-start space-x-3">
            <Building2 className="w-4 h-4 text-cosathi-forest mt-0.5" />
            <div>
              <span className="block text-[11px] text-cosathi-muted font-medium">Registered Society</span>
              <span className="text-sm font-semibold text-cosathi-slate">
                Delhi Shramik Kalyan Sahakari Samiti Ltd. (Reg: DL-COOP-2026-9874)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
