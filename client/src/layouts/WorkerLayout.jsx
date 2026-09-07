import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { useLanguage } from '../context/LanguageContext';
import { LayoutDashboard, Calendar, IndianRupee, UserCheck } from 'lucide-react';

export const WorkerLayout = () => {
  const { t } = useLanguage();
  const location = useLocation();

  const navItems = [
    { path: '/worker/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
    { path: '/worker/availability', label: 'Shifts', icon: Calendar },
    { path: '/worker/earnings', label: t('nav.earnings'), icon: IndianRupee },
    { path: '/worker/profile', label: t('nav.profile'), icon: UserCheck },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F4EE] pb-24 md:pb-8">
      <Navbar />
      <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-5 flex-1">
        <Outlet />
      </div>
      {/* Mobile-first bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#FFFFFF] border-t border-[#D9D5CC] flex justify-around py-2.5 z-40 shadow-[0_-2px_10px_rgba(36,50,74,0.06)]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center py-1.5 px-4 text-xs font-semibold transition-colors ${
                active ? 'text-[#24324A]' : 'text-[#636D79] hover:text-[#20242A]'
              }`}
            >
              <Icon className={`w-5 h-5 mb-1 ${active ? 'text-[#C58B2A]' : 'text-[#636D79]'}`} />
              <span>{item.label}</span>
              {active && <span className="w-1.5 h-1.5 rounded-full bg-[#C58B2A] mt-0.5"></span>}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
