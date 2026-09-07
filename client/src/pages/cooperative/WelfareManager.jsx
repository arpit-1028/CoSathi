import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  HeartHandshake,
  ShieldCheck,
  Users,
  Plus,
  IndianRupee,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  RefreshCw,
  Umbrella,
  FileCheck2,
  AlertCircle,
  X,
} from 'lucide-react';

export const WelfareManager = () => {
  const [data, setData] = useState(null);
  const [insurances, setInsurances] = useState([]);
  const [workersList, setWorkersList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showDisburseModal, setShowDisburseModal] = useState(false);
  const [showGrantInsuranceModal, setShowGrantInsuranceModal] = useState(false);

  // Form states
  const [disburseForm, setDisburseForm] = useState({
    workerId: '',
    benefitType: 'payout_medical',
    amount: '3000',
    justification: 'Emergency diagnostic and medical subsidy for dependent family member',
  });

  const [insuranceForm, setInsuranceForm] = useState({
    workerId: '',
    provider: 'Pradhan Mantri Suraksha Bima Yojana (PMSBY)',
    coverageAmount: '200000',
    annualPremium: '436',
    coverageType: 'Accidental Death & Permanent Disability Cover',
  });

  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  const fetchWelfareData = async () => {
    try {
      setLoading(true);
      const [welfareRes, insuranceRes, workersRes] = await Promise.all([
        api.get('/cooperative/welfare/overview'),
        api.get('/cooperative/welfare/insurance'),
        api.get('/cooperative/workers'),
      ]);

      if (welfareRes.data.success) {
        setData(welfareRes.data);
      }
      if (insuranceRes.data.success) {
        setInsurances(insuranceRes.data.policies || []);
      }
      if (workersRes.data.success) {
        setWorkersList(workersRes.data.workers || []);
        if (workersRes.data.workers?.length > 0) {
          const firstWorker = workersRes.data.workers[0]._id;
          setDisburseForm((prev) => ({ ...prev, workerId: prev.workerId || firstWorker }));
          setInsuranceForm((prev) => ({ ...prev, workerId: prev.workerId || firstWorker }));
        }
      }
    } catch (err) {
      console.error('Failed to fetch welfare data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWelfareData();
  }, []);

  const poolBalance = data?.welfarePoolBalance || 175065;
  const buckets = data?.buckets || {
    insurance: 52519,
    emergencyWelfare: 43766,
    skillsTraining: 35013,
    platformOperations: 26259,
    reserve: 17506,
  };
  const beneficiaries = data?.activeBeneficiaries || insurances.length || 12;
  const records = data?.records || [];

  const handleGrantInsurance = async (e) => {
    e.preventDefault();
    setActionError('');
    try {
      const res = await api.post('/cooperative/welfare/insurance', {
        workerId: insuranceForm.workerId,
        provider: insuranceForm.provider,
        coverageAmount: Number(insuranceForm.coverageAmount),
        annualPremium: Number(insuranceForm.annualPremium),
        coverageType: insuranceForm.coverageType,
      });

      if (res.data.success) {
        setActionSuccess(
          `Insurance policy granted/renewed successfully! Premium of ₹${insuranceForm.annualPremium} subsidized from cooperative fund.`
        );
        setShowGrantInsuranceModal(false);
        fetchWelfareData();
        setTimeout(() => setActionSuccess(''), 5000);
      }
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to grant insurance policy');
    }
  };

  const handleDisburseSubmit = async (e) => {
    e.preventDefault();
    setActionError('');
    try {
      const res = await api.post('/cooperative/welfare/disburse', {
        workerId: disburseForm.workerId,
        amount: Number(disburseForm.amount),
        justification: disburseForm.justification,
        benefitType: disburseForm.benefitType,
      });

      if (res.data.success) {
        setActionSuccess(`Disbursement of ₹${disburseForm.amount} sanctioned successfully. AuditLog created.`);
        setShowDisburseModal(false);
        fetchWelfareData();
        setTimeout(() => setActionSuccess(''), 5000);
      }
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to disburse assistance');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-cosathi-border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <HeartHandshake className="w-4 h-4 text-cosathi-forest" />
            <span className="text-xs font-bold uppercase tracking-wider text-cosathi-forest">
              Worker Welfare, Dignity & Social Security
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-cosathi-slate">
            Welfare Reserve Pool & Insurance
          </h2>
          <p className="text-xs text-cosathi-muted">
            100% cooperative-retained fund providing group medical, accidental cover, and zero-interest tool grants.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowGrantInsuranceModal(true)}
            className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center space-x-1.5"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Grant Insurance</span>
          </button>

          <button
            onClick={() => setShowDisburseModal(true)}
            className="px-4 py-2.5 bg-cosathi-forest hover:bg-cosathi-forest-dark text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Sanction Assistance</span>
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center space-x-2 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Welfare Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-cosathi-border shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-cosathi-muted uppercase tracking-wider">
              Total Welfare Balance
            </span>
            <div className="p-2 bg-emerald-50 rounded-xl text-cosathi-forest">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-cosathi-slate">
            ₹{poolBalance?.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-cosathi-muted">
            10% retained from all household service billings
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-cosathi-border shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-cosathi-muted uppercase tracking-wider">
              Insurance Bucket (30%)
            </span>
            <div className="p-2 bg-sky-50 rounded-xl text-sky-600">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-sky-800">
            ₹{buckets.insurance?.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-cosathi-muted">
            Accidental & Health Group Cover Subsidy
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-cosathi-border shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-cosathi-muted uppercase tracking-wider">
              Emergency Aid Bucket (25%)
            </span>
            <div className="p-2 bg-rose-50 rounded-xl text-rose-600">
              <HeartHandshake className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-800">
            ₹{buckets.emergencyWelfare?.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-cosathi-muted">
            Immediate family & medical relief pool
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-cosathi-border shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-cosathi-muted uppercase tracking-wider">
              Insured Worker Members
            </span>
            <div className="p-2 bg-emerald-50 rounded-xl text-cosathi-forest">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-cosathi-slate">
            {beneficiaries} Members
          </div>
          <p className="text-[11px] text-cosathi-muted">
            100% cashless premium subsidized
          </p>
        </div>
      </div>

      {/* Active Worker Insurance Records Table */}
      <div className="bg-white rounded-3xl p-6 border border-cosathi-border shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-cosathi-border">
          <div>
            <h3 className="font-bold text-base text-cosathi-slate">
              Active Worker Insurance Policies
            </h3>
            <p className="text-xs text-cosathi-muted">
              PMSBY accidental and health coverage subsidized directly from the Cooperative Welfare Fund.
            </p>
          </div>
          <span className="text-xs font-bold text-sky-800 bg-sky-50 px-3 py-1 rounded-xl border border-sky-200">
            Cashless Coverage Subsidized
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-cosathi-border text-[11px] text-cosathi-muted font-bold uppercase tracking-wider">
                <th className="py-3 px-2">Member / Worker</th>
                <th className="py-3 px-2">Policy Number</th>
                <th className="py-3 px-2">Provider & Scheme</th>
                <th className="py-3 px-2">Coverage</th>
                <th className="py-3 px-2">Annual Premium</th>
                <th className="py-3 px-2">Coop Subsidy</th>
                <th className="py-3 px-2">Expiry Date</th>
                <th className="py-3 px-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cosathi-border/60">
              {insurances.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-cosathi-muted">
                    No active insurance policies found. Use "Grant Insurance" to issue a policy for a worker.
                  </td>
                </tr>
              ) : (
                insurances.map((pol, idx) => (
                  <tr key={pol._id || idx} className="hover:bg-cosathi-surface/60 transition-colors">
                    <td className="py-3 px-2 font-bold text-cosathi-slate">
                      {pol.worker?.name || 'Worker Member'}
                      <span className="block text-[10px] text-cosathi-muted font-normal">
                        {pol.worker?.phone || 'Certified Member'}
                      </span>
                    </td>
                    <td className="py-3 px-2 font-mono text-cosathi-slate font-medium">
                      {pol.policyNumber}
                    </td>
                    <td className="py-3 px-2 text-cosathi-slate">
                      <span className="font-semibold block">{pol.provider}</span>
                      <span className="text-[10px] text-cosathi-muted">{pol.coverageType}</span>
                    </td>
                    <td className="py-3 px-2 font-bold font-mono text-cosathi-forest">
                      ₹{pol.coverageAmount?.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-2 font-mono text-slate-700">
                      ₹{pol.annualPremium}/yr
                    </td>
                    <td className="py-3 px-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        100% Subsidized
                      </span>
                    </td>
                    <td className="py-3 px-2 font-mono text-cosathi-muted text-[11px]">
                      {new Date(pol.endDate).toLocaleDateString('en-IN')}
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className="inline-flex items-center space-x-1 text-emerald-700 text-[11px] font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Active</span>
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grant / Renew Insurance Modal */}
      {showGrantInsuranceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-cosathi-slate/80 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 sm:p-8 border border-cosathi-border shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-cosathi-border">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-sky-600" />
                <h3 className="font-bold text-base text-cosathi-slate">
                  Grant / Renew Insurance Policy
                </h3>
              </div>
              <button
                onClick={() => setShowGrantInsuranceModal(false)}
                className="text-xs font-bold text-cosathi-muted hover:text-cosathi-slate"
              >
                ✕ Close
              </button>
            </div>

            <form onSubmit={handleGrantInsurance} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-cosathi-slate block">Select Worker Member</label>
                <select
                  value={insuranceForm.workerId}
                  onChange={(e) => setInsuranceForm({ ...insuranceForm, workerId: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-cosathi-border bg-cosathi-surface font-medium text-cosathi-slate"
                  required
                >
                  {workersList.map((w) => (
                    <option key={w._id} value={w._id}>
                      {w.name} ({w.primarySkill || 'Member'}) - {w.phone}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-cosathi-slate block">Insurance Provider & Scheme</label>
                <input
                  type="text"
                  value={insuranceForm.provider}
                  onChange={(e) => setInsuranceForm({ ...insuranceForm, provider: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-cosathi-border bg-cosathi-surface font-medium text-cosathi-slate"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-cosathi-slate block">Coverage Amount (₹)</label>
                  <input
                    type="number"
                    value={insuranceForm.coverageAmount}
                    onChange={(e) => setInsuranceForm({ ...insuranceForm, coverageAmount: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-cosathi-border bg-cosathi-surface font-mono font-bold text-cosathi-slate"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-cosathi-slate block">Annual Premium (₹)</label>
                  <input
                    type="number"
                    value={insuranceForm.annualPremium}
                    onChange={(e) => setInsuranceForm({ ...insuranceForm, annualPremium: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-cosathi-border bg-cosathi-surface font-mono font-bold text-cosathi-slate"
                    required
                  />
                </div>
              </div>

              <div className="p-3 bg-sky-50 rounded-xl border border-sky-200 text-sky-900 text-[11px] space-y-1">
                <span className="font-bold block">100% Cooperative Subsidized</span>
                <p>
                  The annual premium of ₹{insuranceForm.annualPremium} will be auto-debited from the Cooperative Fund Insurance bucket. The worker pays ₹0 out of pocket.
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl shadow-md transition-all text-xs"
              >
                Sanction Insurance Policy & Generate AuditLog
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Disburse Emergency Aid Modal */}
      {showDisburseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-cosathi-slate/80 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 sm:p-8 border border-cosathi-border shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-cosathi-border">
              <div className="flex items-center space-x-2">
                <HeartHandshake className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-base text-cosathi-slate">
                  Sanction Emergency Welfare Aid
                </h3>
              </div>
              <button
                onClick={() => setShowDisburseModal(false)}
                className="text-xs font-bold text-cosathi-muted hover:text-cosathi-slate"
              >
                ✕ Close
              </button>
            </div>

            <form onSubmit={handleDisburseSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-cosathi-slate block">Select Worker Beneficiary</label>
                <select
                  value={disburseForm.workerId}
                  onChange={(e) => setDisburseForm({ ...disburseForm, workerId: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-cosathi-border bg-cosathi-surface font-medium text-cosathi-slate"
                  required
                >
                  {workersList.map((w) => (
                    <option key={w._id} value={w._id}>
                      {w.name} ({w.primarySkill || 'Member'}) - {w.phone}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-cosathi-slate block">Assistance Category</label>
                <select
                  value={disburseForm.benefitType}
                  onChange={(e) => setDisburseForm({ ...disburseForm, benefitType: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-cosathi-border bg-cosathi-surface font-medium text-cosathi-slate"
                >
                  <option value="payout_medical">Medical & Diagnostic Hardship</option>
                  <option value="payout_emergency">Family Emergency Relief</option>
                  <option value="payout_education">Children Education Support</option>
                  <option value="tool_subsidy">Trade Tool Subsidy</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-cosathi-slate block">Sanction Amount (₹)</label>
                <input
                  type="number"
                  value={disburseForm.amount}
                  onChange={(e) => setDisburseForm({ ...disburseForm, amount: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-cosathi-border bg-cosathi-surface font-mono font-bold text-cosathi-slate"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-cosathi-slate block">Justification & Case Notes</label>
                <textarea
                  rows={3}
                  value={disburseForm.justification}
                  onChange={(e) => setDisburseForm({ ...disburseForm, justification: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-cosathi-border bg-cosathi-surface font-medium text-cosathi-slate resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-cosathi-forest hover:bg-cosathi-forest-dark text-white font-bold rounded-xl shadow-md transition-all text-xs"
              >
                Disburse Aid from Emergency Bucket & Record AuditLog
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
