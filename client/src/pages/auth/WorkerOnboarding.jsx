import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  Wrench,
  User,
  Phone,
  Mail,
  Lock,
  Award,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  Briefcase,
} from 'lucide-react';

export const WorkerOnboarding = () => {
  const { register } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    primarySkill: 'electrical',
    experienceYears: '3',
    aadhaarNumber: '1234',
    role: 'worker',
    preferredLanguage: language,
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const skillsList = [
    { value: 'electrical', labelKey: 'skills.electrical' },
    { value: 'plumbing', labelKey: 'skills.plumbing' },
    { value: 'appliance-repair', labelKey: 'skills.appliance-repair' },
    { value: 'carpentry', labelKey: 'skills.carpentry' },
    { value: 'cleaning', labelKey: 'skills.cleaning' },
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await register(formData);
    setLoading(false);

    if (res.success) {
      navigate('/worker/dashboard');
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 py-8">
      <div className="bg-white max-w-lg w-full rounded-3xl p-6 sm:p-8 border border-cosathi-border shadow-sm">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-cosathi-forest text-white font-bold flex items-center justify-center mx-auto mb-3 text-2xl shadow">
            सह
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-cosathi-slate">
            {t('auth.workerOnboardingTitle')}
          </h2>
          <p className="text-xs sm:text-sm text-cosathi-muted mt-1">
            {t('auth.workerOnboardingSubtitle')}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-cosathi-muted uppercase mb-1">
              {t('auth.fullName')}
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-3 text-cosathi-muted" />
              <input
                type="text"
                required
                name="name"
                placeholder="e.g. Ramesh Kumar"
                value={formData.name}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-cosathi-border focus:outline-none focus:border-cosathi-forest bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-cosathi-muted uppercase mb-1">
                {t('auth.phone')}
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3.5 top-3 text-cosathi-muted" />
                <input
                  type="tel"
                  required
                  name="phone"
                  placeholder="10 digit number"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-cosathi-border focus:outline-none focus:border-cosathi-forest bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-cosathi-muted uppercase mb-1">
                {t('auth.emailLabel')} (Optional)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3 text-cosathi-muted" />
                <input
                  type="email"
                  name="email"
                  placeholder="worker@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-cosathi-border focus:outline-none focus:border-cosathi-forest bg-white"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-cosathi-muted uppercase mb-1">
              {t('auth.passwordLabel')}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3 text-cosathi-muted" />
              <input
                type="password"
                required
                name="password"
                placeholder="Create password"
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-cosathi-border focus:outline-none focus:border-cosathi-forest bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-cosathi-muted uppercase mb-1">
                {t('auth.primarySkill')}
              </label>
              <div className="relative">
                <select
                  name="primarySkill"
                  value={formData.primarySkill}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-cosathi-border focus:outline-none focus:border-cosathi-forest bg-white"
                >
                  {skillsList.map((skill) => (
                    <option key={skill.value} value={skill.value}>
                      {t(skill.labelKey)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-cosathi-muted uppercase mb-1">
                {t('auth.experienceYears')}
              </label>
              <input
                type="number"
                min="0"
                max="40"
                name="experienceYears"
                value={formData.experienceYears}
                onChange={handleChange}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-cosathi-border focus:outline-none focus:border-cosathi-forest bg-white"
              />
            </div>
          </div>

          {/* Simulated Aadhaar KYC */}
          <div>
            <label className="block text-xs font-semibold text-cosathi-muted uppercase mb-1">
              {t('auth.aadhaarNumber')}
            </label>
            <div className="relative">
              <ShieldCheck className="w-4 h-4 absolute left-3.5 top-3 text-cosathi-forest" />
              <input
                type="text"
                maxLength="12"
                name="aadhaarNumber"
                placeholder="XXXX-XXXX-1234 (Last 4 digits simulated)"
                value={formData.aadhaarNumber}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-cosathi-border focus:outline-none focus:border-cosathi-forest bg-white font-mono"
              />
            </div>
            <p className="text-[11px] text-cosathi-muted mt-1 italic">
              ℹ️ {t('auth.aadhaarNote')}
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-cosathi-forest hover:bg-cosathi-forest-dark text-white font-bold rounded-xl text-sm transition-all shadow-md flex items-center justify-center space-x-2"
          >
            <span>{loading ? t('common.loading') : t('auth.submitRegistration')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-cosathi-border/60 text-center text-xs text-cosathi-muted">
          <Link to="/login" className="font-bold text-cosathi-forest hover:underline">
            {t('auth.alreadyHaveAccount')}
          </Link>
        </div>
      </div>
    </div>
  );
};
