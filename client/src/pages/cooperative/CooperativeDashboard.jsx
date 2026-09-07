import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Users,
  UserCheck,
  CalendarCheck,
  CheckCircle2,
  IndianRupee,
  HeartHandshake,
  Activity,
  ArrowUpRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

export const CooperativeDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const res = await api.get('/cooperative/overview');
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load overview data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const kpis = data?.kpis || {
    activeWorkers: 12,
    pendingVerification: 0,
    todayBookings: 1,
    completedServices: 1,
    workerEarnings: 189,
    cooperativeFund: 175000,
    societyName: 'Delhi Shramik Kalyan Sahakari Samiti Ltd.',
  };

  const liveOperations = data?.liveOperations?.length > 0
    ? data.liveOperations
    : [
        {
          bookingId: 'CS-2026-0905-001',
          service: 'Ceiling Fan Repair / Capacitor Replace',
          category: 'Electrical Works',
          worker: 'Ramesh Kumar (Worker A)',
          area: 'B-42, Lajpat Nagar II',
          status: 'completed',
          amount: 199,
        },
        {
          bookingId: 'CS-2026-0905-081',
          service: 'Ceiling Fan Diagnostic & Service',
          category: 'Electrical Works',
          worker: 'Suresh Yadav (Worker C)',
          area: 'Sector 11, Dwarka',
          status: 'in_progress',
          amount: 298,
        },
      ];

  const cards = [
    { label: 'Active On-Duty Workers', value: kpis.activeWorkers, icon: Users, color: 'text-cosathi-forest', bg: 'bg-emerald-50' },
    { label: 'Pending KYC Approvals', value: kpis.pendingVerification, icon: UserCheck, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: "Today's Total Bookings", value: kpis.todayBookings, icon: CalendarCheck, color: 'text-sky-600', bg: 'bg-sky-50' },
    { label: 'Completed Services', value: kpis.completedServices, icon: CheckCircle2, color: 'text-cosathi-clay', bg: 'bg-rose-50' },
    { label: 'Total Worker Earnings', value: `₹${kpis.workerEarnings.toLocaleString('en-IN')}`, icon: IndianRupee, color: 'text-cosathi-forest', bg: 'bg-emerald-50' },
    { label: 'Cooperative Welfare Fund', value: `₹${kpis.cooperativeFund.toLocaleString('en-IN')}`, icon: HeartHandshake, color: 'text-cosathi-ochre', bg: 'bg-amber-50' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#FFFFFF] rounded-xl p-5 sm:p-6 border border-[#D9D5CC] shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-[#C58B2A]" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#C58B2A]">
              Cooperative Governance Console • प्रशासनिक नियंत्रण केंद्र
            </span>
          </div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#20242A]">
            {kpis.societyName}
          </h2>
          <p className="text-xs text-[#636D79]">
            Registered Cooperative Society • Live Operations & Member Guild Registry
          </p>
        </div>

        <button
          onClick={fetchOverview}
          disabled={loading}
          className="p-2.5 rounded-lg border border-[#D9D5CC] bg-[#F7F4EE] hover:bg-[#F2EFEB] text-xs font-semibold text-[#20242A] flex items-center space-x-1.5 self-start sm:self-auto transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#24324A]' : ''}`} />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* 6 Primary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {cards.map((c, idx) => {
          const Icon = c.icon;
          return (
            <div
              key={idx}
              className="bg-[#FFFFFF] p-3.5 rounded-xl border border-[#D9D5CC] shadow-xs space-y-2 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-[#636D79] leading-tight">
                  {c.label}
                </span>
                <div className="w-7 h-7 rounded-md bg-[#F2EFEB] text-[#24324A] flex items-center justify-center">
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
              <span className="font-serif text-lg font-bold text-[#20242A] block">{c.value}</span>
            </div>
          );
        })}
      </div>

      {/* Live Operations Table */}
      <div className="bg-[#FFFFFF] rounded-xl p-5 sm:p-6 border border-[#D9D5CC] shadow-card space-y-4">
        <div className="flex items-center justify-between border-b border-[#E2DDD3] pb-3">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-[#3C5A48] animate-pulse" />
            <h3 className="font-serif text-base font-bold text-[#20242A]">
              Live Operations Monitoring • सक्रिय सेवा निगरानी
            </h3>
          </div>
          <span className="text-xs text-[#636D79]">Real-Time Dispatch Ledger</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#D9D5CC] text-[#636D79] uppercase text-[10px] font-bold bg-[#F7F4EE]">
                <th className="py-2.5 px-3">Booking ID</th>
                <th className="py-2.5 px-3">Service</th>
                <th className="py-2.5 px-3">Assigned Sathi</th>
                <th className="py-2.5 px-3">Area</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2DDD3]">
              {liveOperations.map((b, idx) => (
                <tr key={idx} className="hover:bg-[#F7F4EE] transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-[#24324A]">
                    {b.bookingId}
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-semibold text-[#20242A] block">{b.service}</span>
                    <span className="text-[10px] text-[#636D79]">{b.category}</span>
                  </td>
                  <td className="py-3 px-3 font-medium text-[#20242A]">
                    {b.worker}
                  </td>
                  <td className="py-3 px-3 text-[#636D79]">
                    {b.area}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        b.status === 'completed'
                          ? 'bg-[#F2EFEB] text-[#3C5A48] border border-[#D9D5CC]'
                          : 'bg-[#FFF8E7] text-[#C58B2A] border border-[#DF9F35]'
                      }`}
                    >
                      {b.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-serif font-bold text-[#20242A]">
                    ₹{b.amount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
