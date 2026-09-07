import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { useLanguage } from '../context/LanguageContext';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  ReceiptText,
  IndianRupee,
  HeartHandshake,
  AlertTriangle,
  TrendingUp,
  FileBarChart,
  Settings,
  Building2,
} from 'lucide-react';

export const CooperativeLayout = () => {
  const { t } = useLanguage();
  const location = useLocation();

  const sidebarLinks = [
    { path: '/cooperative/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/cooperative/workers', label: 'Workers', icon: Users },
    { path: '/cooperative/bookings', label: 'Bookings', icon: CalendarCheck },
    { path: '/cooperative/rate-card', label: 'Rate Card', icon: ReceiptText },
    { path: '/cooperative/finance', label: 'Finance', icon: IndianRupee },
    { path: '/cooperative/welfare', label: 'Welfare & Insurance', icon: HeartHandshake },
    { path: '/cooperative/disputes', label: 'Disputes', icon: AlertTriangle },
    { path: '/cooperative/forecast', label: 'Demand Forecast', icon: TrendingUp },
    { path: '/cooperative/reports', label: 'Reports', icon: FileBarChart },
    { path: '/cooperative/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F4EE]">
      <Navbar />

      <div className="flex-1 flex flex-col md:flex-row max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 gap-6">
        {/* Desktop Admin Sidebar */}
        <aside className="w-full md:w-64 bg-[#FFFFFF] rounded-xl shadow-xs border border-[#D9D5CC] p-4 h-fit sticky top-20">
          <div className="pb-3 mb-3 border-b border-[#D9D5CC] px-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#C58B2A] block">
              Cooperative Governance
            </span>
            <span className="text-xs font-serif font-bold text-[#20242A] block truncate">
              दिल्ली श्रमिक कल्याण समिति
            </span>
            <span className="text-[11px] text-[#636D79] block">
              Delhi Workers Guild Board
            </span>
          </div>

          <nav className="space-y-1">
            {sidebarLinks.map((link) => {
              const Icon = link.icon;
              const active = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    active
                      ? 'bg-[#24324A] text-white shadow-xs'
                      : 'text-[#20242A] hover:bg-[#F2EFEB]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-[#C58B2A]' : 'text-[#636D79]'}`} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
