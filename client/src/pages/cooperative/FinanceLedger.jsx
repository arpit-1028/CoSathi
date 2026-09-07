import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  IndianRupee,
  TrendingUp,
  ShieldCheck,
  HeartHandshake,
  Wrench,
  Building2,
  RefreshCw,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  CheckCircle2,
  Download,
  Filter,
  PiggyBank,
} from 'lucide-react';

export const FinanceLedger = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('all');

  const fetchFinance = async () => {
    try {
      setLoading(true);
      const res = await api.get('/cooperative/finance');
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch finance', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinance();
  }, []);

  const summary = data?.summary || {
    customerPayments: 650,
    workerPayouts: 585,
    cooperativeFund: 175065,
    buckets: {
      insurance: 52519,
      emergencyWelfare: 43766,
      skillsTraining: 35013,
      platformOperations: 26259,
      reserve: 17506,
    },
  };

  const allTransactions = data?.transactions || [];
  const filteredTransactions = allTransactions.filter((t) => {
    if (selectedTypeFilter === 'all') return true;
    return t.type === selectedTypeFilter;
  });

  const bucketsData = summary.buckets || {};
  const totalFund = summary.cooperativeFund || 175065;

  const breakdownItems = [
    {
      label: 'Health & Accidental Group Insurance',
      pct: '30%',
      amount: bucketsData.insurance || Math.round(totalFund * 0.30),
      icon: ShieldCheck,
      color: 'text-sky-600',
      bg: 'bg-sky-50',
      barColor: 'bg-sky-500',
    },
    {
      label: 'Emergency Welfare & Family Relief',
      pct: '25%',
      amount: bucketsData.emergencyWelfare || Math.round(totalFund * 0.25),
      icon: HeartHandshake,
      color: 'text-rose-600',
      bg: 'bg-rose-50',
      barColor: 'bg-rose-500',
    },
    {
      label: 'Skills Training, Apprenticeship & Tool Subsidies',
      pct: '20%',
      amount: bucketsData.skillsTraining || Math.round(totalFund * 0.20),
      icon: Wrench,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      barColor: 'bg-amber-500',
    },
    {
      label: 'Platform Operations & Support Infrastructure',
      pct: '15%',
      amount: bucketsData.platformOperations || Math.round(totalFund * 0.15),
      icon: Building2,
      color: 'text-cosathi-forest',
      bg: 'bg-emerald-50',
      barColor: 'bg-cosathi-forest',
    },
    {
      label: 'Capital Reserve & Stability Buffer',
      pct: '10%',
      amount: bucketsData.reserve || Math.round(totalFund * 0.10),
      icon: PiggyBank,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      barColor: 'bg-purple-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#FFFFFF] rounded-xl p-6 border border-[#D9D5CC] shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="w-5 h-5 rounded-full bg-[#3C5A48] text-[#F7F4EE] font-serif text-[10px] font-bold flex items-center justify-center">
              वित्त
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#3C5A48]">
              Cooperative Financial Democracy • 90% Worker / 10% Fund / 0% Middleman
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#20242A]">
            Financial Ledger & Cooperative Fund
          </h2>
          <p className="text-xs text-[#636D79] mt-0.5">
            Immutable transaction ledger, 90/10 direct earnings split, and transparent 5-bucket statutory reserve allocations.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={fetchFinance}
            className="p-2.5 rounded-lg border border-[#D9D5CC] hover:bg-[#F7F4EE] text-[#20242A] transition-colors text-xs font-semibold flex items-center space-x-1.5"
            title="Refresh Ledger"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#3C5A48]' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* 90 / 10 Split Model KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-[#FFFFFF] rounded-xl p-5 border border-[#D9D5CC] shadow-card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#636D79] uppercase tracking-wider">
              Customer Total (100%)
            </span>
            <div className="p-2 bg-[#F2EFEB] rounded-lg text-[#24324A]">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-serif font-bold text-[#20242A]">
            ₹{summary.customerPayments?.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-[#636D79]">
            100% transparent rate card billing with zero surge pricing
          </p>
        </div>

        <div className="bg-[#FFFFFF] rounded-xl p-5 border border-[#D9D5CC] shadow-card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#636D79] uppercase tracking-wider">
              Worker Direct Share (90%)
            </span>
            <div className="p-2 bg-[#DDE5E0] rounded-lg text-[#3C5A48]">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-serif font-bold text-[#3C5A48]">
            ₹{summary.workerPayouts?.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-[#636D79]">
            Direct deposit into worker bank accounts & UPI
          </p>
        </div>

        <div className="bg-[#FFFFFF] rounded-xl p-5 border border-[#24324A]/20 shadow-card space-y-2 bg-[#F7F4EE]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#24324A] uppercase tracking-wider">
              Cooperative Fund (10%)
            </span>
            <div className="p-2 bg-[#EAE5DA] rounded-lg text-[#24324A]">
              <HeartHandshake className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-serif font-bold text-[#24324A]">
            ₹{summary.cooperativeFund?.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-[#24324A] font-medium">
            Collective social safety net managed by worker members
          </p>
        </div>

        <div className="bg-[#FFFFFF] rounded-xl p-5 border border-[#D9D5CC] shadow-card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#636D79] uppercase tracking-wider">
              Intermediary Take
            </span>
            <span className="text-[10px] font-bold text-[#3C5A48] bg-[#DDE5E0] px-2 py-0.5 rounded-full">
              Zero Extraction
            </span>
          </div>
          <div className="text-2xl font-serif font-bold text-[#3C5A48]">
            ₹0 (0%)
          </div>
          <p className="text-[11px] text-[#636D79]">
            No private venture capital extraction or shadow fees
          </p>
        </div>
      </div>

      {/* Cooperative Fund 5-Bucket Allocation Breakdown */}
      <div className="bg-[#FFFFFF] rounded-xl p-6 border border-[#D9D5CC] shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-serif font-bold text-base text-[#20242A]">
              Cooperative Fund 5-Bucket Allocation • कल्याण कोष विभाजन
            </h3>
            <p className="text-xs text-[#636D79] mt-0.5">
              By-laws mandate strict automatic division across group insurance, emergency aid, training, operations, and reserve.
            </p>
          </div>
          <span className="text-xs font-bold text-[#3C5A48] px-3 py-1 bg-[#DDE5E0] rounded-lg border border-[#3C5A48]/30 self-start sm:self-auto">
            100% Cooperative Owned
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
          {breakdownItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-4 rounded-xl border border-[#D9D5CC] bg-[#F7F4EE] space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-[#FFFFFF] text-[#24324A] border border-[#D9D5CC]">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-[#20242A]">{item.pct}</span>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-[#20242A] block line-clamp-2">
                    {item.label}
                  </span>
                  <div className="text-lg font-serif font-bold text-[#24324A] mt-1">
                    ₹{item.amount?.toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="w-full bg-[#E2DDD3] h-1.5 rounded-full overflow-hidden">
                  <div className="h-full bg-[#3C5A48] w-full" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Real Immutable Transaction Ledger Table */}
      <div className="bg-[#FFFFFF] rounded-xl border border-[#D9D5CC] shadow-card overflow-hidden">
        <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2DDD3]">
          <div>
            <h3 className="font-serif font-bold text-base text-[#20242A]">
              Immutable Platform Transaction Ledger • स्थायी वित्तीय खाता
            </h3>
            <p className="text-xs text-[#636D79] mt-0.5">
              Real-time audit log of customer payments, worker payouts, fund retentions, and arbitration refunds.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="w-3.5 h-3.5 text-[#636D79]" />
            <select
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
              className="text-xs border border-[#D9D5CC] rounded-lg px-2.5 py-1.5 bg-[#F7F4EE] font-semibold text-[#20242A]"
            >
              <option value="all">All Ledger Events</option>
              <option value="customer_payment">Customer Payments</option>
              <option value="worker_payout">Worker Payouts (90%)</option>
              <option value="cooperative_fee">Cooperative Retentions (10%)</option>
              <option value="refund">Arbitration Refunds</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#F7F4EE] border-b border-[#D9D5CC] text-[11px] text-[#636D79] font-serif font-bold uppercase tracking-wider">
                <th className="py-3 px-3">Transaction ID</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Counterparty / Member</th>
                <th className="py-3 px-3">Timestamp</th>
                <th className="py-3 px-3">Direction</th>
                <th className="py-3 px-3 text-right">Amount</th>
                <th className="py-3 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2DDD3]">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-[#636D79]">
                    No transactions found for the selected filter.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx, idx) => (
                  <tr key={tx._id || idx} className="hover:bg-[#F7F4EE]/70 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-[#24324A]">
                      {tx.transactionNumber || `TXN-${idx + 1}`}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold ${
                          tx.type === 'customer_payment'
                            ? 'bg-[#F2EFEB] text-[#24324A] border border-[#D9D5CC]'
                            : tx.type === 'worker_payout'
                            ? 'bg-[#DDE5E0] text-[#3C5A48] border border-[#3C5A48]/30'
                            : tx.type === 'cooperative_fee'
                            ? 'bg-[#EAE5DA] text-[#24324A] border border-[#D9D5CC]'
                            : 'bg-[#F9E2DF] text-[#A65343] border border-[#A65343]/30'
                        }`}
                      >
                        {tx.type === 'customer_payment'
                          ? 'Customer Pay'
                          : tx.type === 'worker_payout'
                          ? 'Worker 90%'
                          : tx.type === 'cooperative_fee'
                          ? 'Coop 10%'
                          : 'Refund'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[#20242A] font-semibold">
                      {tx.user?.name || (tx.type === 'customer_payment' ? 'Customer' : 'Worker Member')}
                    </td>
                    <td className="py-3 px-3 text-[#636D79] font-mono text-[11px]">
                      {new Date(tx.createdAt || Date.now()).toLocaleString('en-IN', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`font-semibold text-[11px] ${
                          tx.direction === 'credit' ? 'text-[#3C5A48]' : 'text-[#636D79]'
                        }`}
                      >
                        {tx.direction === 'credit' ? '+ Credit' : '- Debit'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-sm font-mono text-[#20242A]">
                      ₹{tx.amount?.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex items-center space-x-1 text-[#3C5A48] text-[11px] font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Settled</span>
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
