import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { LogOut, LogIn, Menu, X, HelpCircle } from 'lucide-react';

export const Navbar = () => {
  const { t, language } = useLanguage();
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMobileMenuOpen(false);
  };

  const navLinks = [
    { label: language === 'hi' ? 'सेवाएं' : 'Services', href: '/customer/home#services' },
    { label: language === 'hi' ? 'कार्यप्रणाली' : 'How it works', href: '/customer/home#how-it-works' },
    { label: language === 'hi' ? 'श्रमिकों के लिए' : 'For workers', href: '/worker/dashboard' },
    { label: language === 'hi' ? 'सहकारी एडमिन' : 'Cooperative admin', href: '/cooperative/dashboard' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full shadow-[0_1px_3px_rgba(18,42,78,0.06)]">
      {/* 1. Top Navy Utility Bar (#122A4E) */}
      <div className="bg-[#122A4E] text-[#F6F2EA] text-xs py-1.5 px-4 sm:px-6 lg:px-8 border-b border-[#1A3866]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#DF9F35]"></span>
            <span className="text-[11px] sm:text-xs tracking-wide text-slate-200 truncate max-w-[220px] sm:max-w-none">
              {language === 'hi'
                ? 'घरेलू सेवाओं के लिए एक पारदर्शी सहकारी नेटवर्क'
                : 'A cooperative service network for households'}
            </span>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-4">
            <LanguageSwitcher />

            <Link
              to="/customer/home#how-it-works"
              className="text-[11px] text-slate-300 hover:text-white hidden sm:flex items-center space-x-1 transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'सहायता' : 'Help'}</span>
            </Link>

            {!isAuthenticated && (
              <Link
                to="/login"
                className="text-[11px] font-medium text-slate-200 hover:text-white transition-colors"
              >
                {t('nav.login')}
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* 2. Main White Navbar */}
      <div className="bg-[#FFFFFF] text-[#20242A] border-b border-[#D9D5CC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo with 3-dot badge */}
          <Link to="/customer/home" className="flex items-center space-x-3 group">
            {/* 3 dots in a triangle circular badge */}
            <div className="w-9 h-9 rounded-full bg-[#122A4E] text-white flex items-center justify-center relative shadow-xs group-hover:bg-[#1B4278] transition-colors">
              <svg className="w-5 h-5 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="7" r="2.2" />
                <circle cx="7.5" cy="15" r="2.2" />
                <circle cx="16.5" cy="15" r="2.2" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-2xl font-bold tracking-tight text-[#122A4E] leading-none">
                CoSathi
              </span>
              <span className="text-[11px] text-[#636D79] font-medium mt-0.5">
                {language === 'hi' ? 'सहकारी घरेलू सेवाएं' : 'Cooperative household services'}
              </span>
            </div>
          </Link>

          {/* Center Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium text-[#20242A]">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                className="hover:text-[#1B4278] transition-colors py-1 hover:border-b-2 hover:border-[#1B4278]"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center space-x-3">
            {isAuthenticated && user ? (
              <div className="flex items-center space-x-2 sm:space-x-3 pl-2">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-semibold text-[#20242A] truncate max-w-[130px]">
                    {user.name}
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#3C5A48]">
                    {t(`roles.${user.role}`)}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg border border-[#D9D5CC] hover:bg-[#F2EFEB] text-[#636D79] hover:text-[#A65343] transition-colors"
                  title={t('nav.logout')}
                  aria-label="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="hidden sm:inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-[#122A4E] hover:bg-[#1B4278] text-white text-xs font-semibold tracking-wide transition-all shadow-xs"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{t('nav.login')}</span>
              </Link>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg border border-[#D9D5CC] text-[#20242A] hover:bg-[#F2EFEB]"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#D9D5CC] bg-[#FFFFFF] px-4 py-3 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-sm font-medium text-[#20242A] hover:text-[#1B4278] border-b border-[#F2EFEB]"
              >
                {link.label}
              </Link>
            ))}
            {!isAuthenticated && (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-sm font-semibold text-[#122A4E]"
              >
                {t('nav.login')}
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
