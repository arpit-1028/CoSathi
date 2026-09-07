import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { useLanguage } from '../context/LanguageContext';
import { Home, CalendarPlus, Clock, User } from 'lucide-react';

export const CustomerLayout = () => {
  const { t } = useLanguage();
  const location = useLocation();

  const navItems = [
    { path: '/customer/home', label: t('nav.home'), icon: Home },
    { path: '/customer/book', label: t('nav.book'), icon: CalendarPlus },
    { path: '/customer/history', label: t('nav.history'), icon: Clock },
    { path: '/customer/profile', label: t('nav.profile'), icon: User },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F4EE]">
      <Navbar />
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex-1 pb-24 md:pb-8">
        <Outlet />
      </div>
      {/* Footer matching user screenshot (#122A4E) */}
      <footer className="bg-[#122A4E] text-[#F6F2EA] border-t border-[#1A3866] mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand column */}
            <div className="space-y-4 md:col-span-1">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center">
                  <svg className="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="7" r="2.2" />
                    <circle cx="7.5" cy="15" r="2.2" />
                    <circle cx="16.5" cy="15" r="2.2" />
                  </svg>
                </div>
                <div>
                  <span className="font-serif text-xl font-bold tracking-tight text-white block">
                    CoSathi
                  </span>
                  <span className="text-[11px] text-slate-300 block">
                    Cooperative household services
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                A cooperative network matching households with verified service professionals. Transparent rate cards and 90% direct worker wages.
              </p>
              <div className="text-[11px] text-slate-400">
                © 2026 CoSathi Cooperative Society.
              </div>
            </div>

            {/* Column 1: For Workers */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                For Workers
              </h4>
              <ul className="space-y-2 text-xs text-slate-300">
                <li>
                  <Link to="/worker/dashboard" className="hover:text-white transition-colors">
                    Worker Dashboard
                  </Link>
                </li>
                <li>
                  <Link to="/worker/kyc" className="hover:text-white transition-colors">
                    Member KYC Onboarding
                  </Link>
                </li>
                <li>
                  <span className="text-slate-400">Welfare & Pension Fund (10%)</span>
                </li>
                <li>
                  <span className="text-slate-400">Democratic Member Governance</span>
                </li>
              </ul>
            </div>

            {/* Column 2: Customers */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                Customers
              </h4>
              <ul className="space-y-2 text-xs text-slate-300">
                <li>
                  <Link to="/customer/home" className="hover:text-white transition-colors">
                    Book a Service
                  </Link>
                </li>
                <li>
                  <Link to="/customer/history" className="hover:text-white transition-colors">
                    Booking History
                  </Link>
                </li>
                <li>
                  <Link to="/customer/home#services" className="hover:text-white transition-colors">
                    Approved Trade Rate Cards
                  </Link>
                </li>
                <li>
                  <Link to="/customer/home#how-it-works" className="hover:text-white transition-colors">
                    How Assignment Works
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Cooperative */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                Cooperative Administration
              </h4>
              <ul className="space-y-2 text-xs text-slate-300">
                <li>
                  <Link to="/cooperative/dashboard" className="hover:text-white transition-colors">
                    Society Admin Console
                  </Link>
                </li>
                <li>
                  <Link to="/cooperative/allocation" className="hover:text-white transition-colors">
                    Demand Forecasting & Allocation
                  </Link>
                </li>
                <li>
                  <Link to="/cooperative/disputes" className="hover:text-white transition-colors">
                    Dispute & Fair Resolution
                  </Link>
                </li>
                <li>
                  <span className="text-slate-400">State Cooperative Registry</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#FFFFFF] border-t border-[#D9D5CC] flex justify-around py-2 z-40 shadow-[0_-2px_10px_rgba(36,50,74,0.05)]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center py-1 px-3 text-[11px] font-medium transition-colors ${
                active ? 'text-[#122A4E] font-bold' : 'text-[#636D79] hover:text-[#20242A]'
              }`}
            >
              <Icon className={`w-5 h-5 mb-1 ${active ? 'text-[#9E472A]' : 'text-[#636D79]'}`} />
              <span>{item.label}</span>
              {active && <span className="w-1 h-1 rounded-full bg-[#9E472A] mt-0.5"></span>}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
