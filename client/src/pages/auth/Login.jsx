import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  ShieldCheck,
  User,
  Wrench,
  Building2,
  Lock,
  Phone,
  Mail,
  AlertCircle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export const Login = () => {
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const [role, setRole] = useState('customer'); // 'customer' | 'worker' | 'cooperative_admin'
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Check if user was redirected from an unauthorized attempt
  const wasUnauthorized = location.state?.unauthorizedAttempt;

  const handleLogin = async (e, customIdentifier, customPassword) => {
    if (e) e.preventDefault();
    setError('');
    setSubmitting(true);

    const loginId = customIdentifier || identifier;
    const loginPass = customPassword || password;

    const result = await login(loginId, loginPass);
    setSubmitting(false);

    if (result.success) {
      const userRole = result.user.role;
      if (userRole === 'customer') navigate('/customer/home');
      else if (userRole === 'worker') navigate('/worker/dashboard');
      else if (userRole === 'cooperative_admin') navigate('/cooperative/dashboard');
      else navigate('/');
    } else {
      setError(result.message);
    }
  };

  const handleQuickDemo = (demoEmail, demoRole) => {
    setRole(demoRole);
    setIdentifier(demoEmail);
    setPassword('CoSathi@2026');
    handleLogin(null, demoEmail, 'CoSathi@2026');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 py-8">
      <div className="bg-white max-w-lg w-full rounded-3xl p-6 sm:p-8 border border-cosathi-border shadow-sm">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-cosathi-forest text-white font-bold flex items-center justify-center mx-auto mb-3 text-2xl shadow">
            सह
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-cosathi-slate">
            {t('auth.welcomeBack')}
          </h2>
          <p className="text-xs sm:text-sm text-cosathi-muted mt-1">
            {t('auth.loginSubtitle')}
          </p>
        </div>

        {/* Unauthorized Redirection Alert */}
        {wasUnauthorized && (
          <div className="mb-5 p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start space-x-3 text-amber-800 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
            <div>
              <span className="font-bold block">{t('auth.unauthorizedTitle')}</span>
              <span>{t('auth.unauthorizedDesc')}</span>
            </div>
          </div>
        )}

        {/* 1-Click Development Demo Accounts */}
        <div className="mb-6 p-4 rounded-2xl bg-cosathi-surface border border-cosathi-border">
          <div className="flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-cosathi-forest mb-3">
            <Sparkles className="w-3.5 h-3.5 text-cosathi-ochre" />
            <span>{t('auth.demoQuickLogin')}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemo('customer@cosathi.demo', 'customer')}
              className="p-2.5 rounded-xl bg-white border border-cosathi-border hover:border-cosathi-clay hover:bg-cosathi-clay/5 text-left transition-all group"
            >
              <div className="flex items-center space-x-2 mb-1">
                <User className="w-3.5 h-3.5 text-cosathi-clay" />
                <span className="text-xs font-bold text-cosathi-slate">Customer</span>
              </div>
              <span className="text-[10px] text-cosathi-muted block truncate">customer@cosathi.demo</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo('worker@cosathi.demo', 'worker')}
              className="p-2.5 rounded-xl bg-white border border-cosathi-border hover:border-cosathi-forest hover:bg-cosathi-forest/5 text-left transition-all group"
            >
              <div className="flex items-center space-x-2 mb-1">
                <Wrench className="w-3.5 h-3.5 text-cosathi-forest" />
                <span className="text-xs font-bold text-cosathi-slate">Worker</span>
              </div>
              <span className="text-[10px] text-cosathi-muted block truncate">worker@cosathi.demo</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo('admin@cosathi.demo', 'cooperative_admin')}
              className="p-2.5 rounded-xl bg-white border border-cosathi-border hover:border-cosathi-ochre hover:bg-cosathi-ochre/5 text-left transition-all group"
            >
              <div className="flex items-center space-x-2 mb-1">
                <Building2 className="w-3.5 h-3.5 text-cosathi-ochre" />
                <span className="text-xs font-bold text-cosathi-slate">Admin</span>
              </div>
              <span className="text-[10px] text-cosathi-muted block truncate">admin@cosathi.demo</span>
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Role Tabs */}
        <div className="flex rounded-xl bg-cosathi-surface p-1 border border-cosathi-border mb-5">
          <button
            type="button"
            onClick={() => setRole('customer')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
              role === 'customer'
                ? 'bg-cosathi-clay text-white shadow-sm'
                : 'text-cosathi-muted hover:text-cosathi-slate'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>{t('roles.customer')}</span>
          </button>
          <button
            type="button"
            onClick={() => setRole('worker')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
              role === 'worker'
                ? 'bg-cosathi-forest text-white shadow-sm'
                : 'text-cosathi-muted hover:text-cosathi-slate'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>{t('roles.worker')}</span>
          </button>
          <button
            type="button"
            onClick={() => setRole('cooperative_admin')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
              role === 'cooperative_admin'
                ? 'bg-cosathi-ochre text-white shadow-sm'
                : 'text-cosathi-muted hover:text-cosathi-slate'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>{t('roles.cooperative_admin')}</span>
          </button>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-cosathi-muted uppercase mb-1.5">
              {role === 'cooperative_admin' ? t('auth.emailLabel') : t('auth.identifierLabel')}
            </label>
            <div className="relative">
              {role === 'cooperative_admin' ? (
                <Mail className="w-4 h-4 absolute left-3.5 top-3 text-cosathi-muted" />
              ) : (
                <Phone className="w-4 h-4 absolute left-3.5 top-3 text-cosathi-muted" />
              )}
              <input
                type="text"
                required
                placeholder={
                  role === 'cooperative_admin'
                    ? t('auth.emailPlaceholder')
                    : t('auth.identifierPlaceholder')
                }
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-cosathi-border focus:outline-none focus:border-cosathi-forest focus:ring-1 focus:ring-cosathi-forest bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-cosathi-muted uppercase mb-1.5">
              {t('auth.passwordLabel')}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3 text-cosathi-muted" />
              <input
                type="password"
                required
                placeholder={t('auth.passwordPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-cosathi-border focus:outline-none focus:border-cosathi-forest focus:ring-1 focus:ring-cosathi-forest bg-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className={`w-full py-3 text-white font-bold rounded-xl text-sm transition-all shadow-md flex items-center justify-center space-x-2 ${
              role === 'customer'
                ? 'bg-cosathi-clay hover:bg-cosathi-clay-light'
                : role === 'worker'
                ? 'bg-cosathi-forest hover:bg-cosathi-forest-dark'
                : 'bg-cosathi-ochre hover:opacity-90'
            }`}
          >
            <span>{submitting ? t('auth.loggingIn') : t('auth.loginButton')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Footer Registration Links */}
        <div className="mt-6 pt-5 border-t border-cosathi-border/60 text-center text-xs space-y-2">
          {role === 'customer' && (
            <div className="text-cosathi-muted">
              {t('auth.noAccount')}{' '}
              <Link to="/register/customer" className="font-bold text-cosathi-clay hover:underline">
                {t('auth.registerCustomer')}
              </Link>
            </div>
          )}

          {role === 'worker' && (
            <div className="text-cosathi-muted">
              {t('auth.noAccount')}{' '}
              <Link to="/register/worker" className="font-bold text-cosathi-forest hover:underline">
                {t('auth.joinAsWorker')}
              </Link>
            </div>
          )}

          {role === 'cooperative_admin' && (
            <p className="text-cosathi-muted text-[11px]">
              Cooperative Admin registration is provisioned by society executive decree.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
