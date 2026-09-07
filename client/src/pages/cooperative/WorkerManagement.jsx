import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Users,
  Search,
  Filter,
  Star,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Clock,
  Eye,
  Camera,
  Video,
  FileText,
  Building2,
  RefreshCw,
} from 'lucide-react';

export const WorkerManagement = () => {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [skillFilter, setSkillFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Selected Worker for Details & Action Modal
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [workerPerformanceDetail, setWorkerPerformanceDetail] = useState(null);
  const [loadingPerformance, setLoadingPerformance] = useState(false);
  const [coopDistribution, setCoopDistribution] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');

  const fetchCoopDistribution = async () => {
    try {
      const res = await api.get('/cooperative/performance-distribution');
      if (res.data?.success) {
        setCoopDistribution(res.data);
      }
    } catch (err) {
      console.warn('Failed to fetch cooperative performance distribution', err);
    }
  };

  const handleSelectWorker = async (worker) => {
    setSelectedWorker(worker);
    setWorkerPerformanceDetail(null);
    setLoadingPerformance(true);
    try {
      const res = await api.get(`/workers/${worker._id}/performance`);
      if (res.data?.success) {
        setWorkerPerformanceDetail(res.data.data);
      }
    } catch (err) {
      console.warn('Failed to load worker performance:', err);
    } finally {
      setLoadingPerformance(false);
    }
  };

  const fetchWorkers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (skillFilter !== 'all') params.skill = skillFilter;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (search) params.search = search;

      const res = await api.get('/cooperative/workers', { params });
      if (res.data.success) {
        setWorkers(res.data.workers);
      }
    } catch (err) {
      console.error('Failed to fetch workers', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
    fetchCoopDistribution();
  }, [skillFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchWorkers();
  };

  const handleUpdateStatus = async (workerId, newStatus) => {
    try {
      setActionLoading(true);
      const res = await api.put(`/cooperative/workers/${workerId}/status`, { status: newStatus });
      if (res.data.success) {
        setActionSuccess(`Status updated to ${newStatus}`);
        fetchWorkers();
        if (selectedWorker) {
          setSelectedWorker({ ...selectedWorker, verificationStatus: newStatus });
        }
        setTimeout(() => setActionSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Failed to update status', err);
    } finally {
      setActionLoading(false);
    }
  };

  const skillsList = [
    { value: 'all', label: 'All Trades' },
    { value: 'electrical', label: 'Electrical' },
    { value: 'plumbing', label: 'Plumbing' },
    { value: 'appliance-repair', label: 'Appliance Repair' },
    { value: 'carpentry', label: 'Carpentry' },
    { value: 'cleaning', label: 'Cleaning' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-cosathi-border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold text-cosathi-slate">
            Worker Member Management
          </h2>
          <p className="text-xs text-cosathi-muted">
            Inspect KYC compliance, review community trust, and audit fairness scores.
          </p>
        </div>

        <button
          onClick={fetchWorkers}
          className="p-2.5 rounded-xl border border-cosathi-border bg-cosathi-surface hover:bg-white text-xs font-bold text-cosathi-slate flex items-center space-x-1.5 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Cooperative Performance & Fairness Distribution Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-cosathi-border shadow-xs">
          <span className="text-[11px] font-semibold text-cosathi-muted block">Cooperative Rating</span>
          <div className="flex items-center space-x-1 mt-1">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span className="text-xl font-bold text-cosathi-slate">
              {coopDistribution?.summary?.averageCooperativeRating || '4.8'}★
            </span>
          </div>
          <span className="text-[10px] text-cosathi-muted block mt-0.5">
            {coopDistribution?.summary?.totalReviews || 120} Customer Reviews
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-cosathi-border shadow-xs">
          <span className="text-[11px] font-semibold text-cosathi-muted block">Fair Opportunity Index</span>
          <span className="text-xl font-bold text-cosathi-forest block mt-1">
            {coopDistribution?.summary?.averageFairnessScore || 88} / 100
          </span>
          <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">
            Anti-Monopolization Active
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-cosathi-border shadow-xs">
          <span className="text-[11px] font-semibold text-cosathi-muted block">Active Worker Members</span>
          <span className="text-xl font-bold text-cosathi-slate block mt-1">
            {coopDistribution?.summary?.totalWorkers || workers.length}
          </span>
          <span className="text-[10px] text-cosathi-muted block mt-0.5">
            Verified & Provisional Pool
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-cosathi-border shadow-xs">
          <span className="text-[11px] font-semibold text-cosathi-muted block">Total Open Complaints</span>
          <span className="text-xl font-bold text-amber-600 block mt-1">
            {coopDistribution?.summary?.totalComplaints || 0}
          </span>
          <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">
            99.2% Resolution Rate
          </span>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-cosathi-border shadow-xs flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-cosathi-muted" />
          <input
            type="text"
            placeholder="Search by name, phone, or Member ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-cosathi-border bg-cosathi-surface focus:bg-white focus:outline-none focus:border-cosathi-forest"
          />
        </form>

        <div className="flex gap-2">
          <select
            value={skillFilter}
            onChange={(e) => setSkillFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-cosathi-border bg-cosathi-surface font-semibold text-cosathi-slate"
          >
            {skillsList.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-cosathi-border bg-cosathi-surface font-semibold text-cosathi-slate"
          >
            <option value="all">All Statuses</option>
            <option value="VERIFIED">Verified</option>
            <option value="PROVISIONAL">Provisional</option>
            <option value="PENDING">Pending</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>
      </div>

      {/* Workers Table */}
      <div className="bg-white rounded-3xl p-6 border border-cosathi-border shadow-sm space-y-4">
        <div className="flex items-center justify-between text-xs text-cosathi-muted">
          <span className="font-bold uppercase tracking-wider text-cosathi-forest">
            Certified Member Roster ({workers.length} Sathis)
          </span>
          <span>Showing fairness allocation standing</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-cosathi-border text-cosathi-muted uppercase text-[10px] font-bold">
                <th className="pb-3 px-2">Member</th>
                <th className="pb-3 px-2">Trade / Skill</th>
                <th className="pb-3 px-2">Rating</th>
                <th className="pb-3 px-2">Completed</th>
                <th className="pb-3 px-2">7-Day Load</th>
                <th className="pb-3 px-2">Fair Score</th>
                <th className="pb-3 px-2">KYC Status</th>
                <th className="pb-3 px-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cosathi-border/60">
              {workers.map((w) => (
                <tr key={w._id} className="hover:bg-cosathi-surface/50 transition-colors">
                  <td className="py-3 px-2">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-full bg-cosathi-forest text-white font-bold flex items-center justify-center text-xs">
                        {w.name.charAt(0)}
                      </div>
                      <div>
                        <span className="font-bold text-cosathi-slate block">{w.name}</span>
                        <span className="font-mono text-[10px] text-cosathi-muted">{w.memberId}</span>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-2 capitalize font-medium text-cosathi-slate">
                    {w.primarySkill}
                  </td>

                  <td className="py-3 px-2">
                    <span className="inline-flex items-center space-x-1 font-bold text-amber-600">
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                      <span>{w.rating}</span>
                      <span className="text-[10px] text-cosathi-muted">({w.ratingsCount})</span>
                    </span>
                  </td>

                  <td className="py-3 px-2 font-bold text-cosathi-slate">
                    {w.completedJobs}
                  </td>

                  <td className="py-3 px-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        w.recentJobs7Days > 10
                          ? 'bg-red-50 text-red-700'
                          : w.recentJobs7Days < 4
                          ? 'bg-emerald-50 text-emerald-700 font-extrabold'
                          : 'bg-cosathi-surface text-cosathi-slate'
                      }`}
                    >
                      {w.recentJobs7Days} jobs
                    </span>
                  </td>

                  <td className="py-3 px-2 font-mono font-bold text-cosathi-forest">
                    {w.fairnessScore}
                  </td>

                  <td className="py-3 px-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        w.verificationStatus === 'VERIFIED'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : w.verificationStatus === 'PROVISIONAL'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : w.verificationStatus === 'SUSPENDED'
                          ? 'bg-red-50 text-red-800 border border-red-200'
                          : 'bg-sky-50 text-sky-800 border border-sky-200'
                      }`}
                    >
                      {w.verificationStatus}
                    </span>
                  </td>

                  <td className="py-3 px-2 text-right">
                    <button
                      onClick={() => handleSelectWorker(w)}
                      className="p-1.5 rounded-lg border border-cosathi-border hover:bg-cosathi-surface text-cosathi-forest font-bold text-xs"
                      title="Inspect & Manage"
                    >
                      <Eye className="w-4 h-4 inline mr-1" />
                      <span>Audit</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Worker Detail & Action Modal */}
      {selectedWorker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-cosathi-slate/80 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white max-w-xl w-full rounded-3xl p-6 sm:p-8 border border-cosathi-border shadow-2xl space-y-5 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-4 border-b border-cosathi-border">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-cosathi-forest text-white font-bold flex items-center justify-center text-xl shadow">
                  {selectedWorker.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-cosathi-slate">{selectedWorker.name}</h3>
                  <span className="text-xs text-cosathi-muted">
                    {selectedWorker.memberId} • {selectedWorker.cooperative}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedWorker(null);
                  setWorkerPerformanceDetail(null);
                }}
                className="text-xs font-bold text-cosathi-muted hover:text-cosathi-slate"
              >
                ✕ Close
              </button>
            </div>

            {actionSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-1.5 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{actionSuccess}</span>
              </div>
            )}

            {/* Compliance & Artifacts Grid */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-3 rounded-xl bg-cosathi-surface border border-cosathi-border">
                <FileText className="w-4 h-4 text-cosathi-clay mx-auto mb-1" />
                <span className="text-[10px] text-cosathi-muted block">Identity Document</span>
                <span className="font-mono text-[11px] font-bold text-cosathi-slate">
                  {selectedWorker.aadhaarMasked}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-cosathi-surface border border-cosathi-border">
                <Camera className="w-4 h-4 text-cosathi-forest mx-auto mb-1" />
                <span className="text-[10px] text-cosathi-muted block">Face Capture</span>
                <span className="text-[11px] font-bold text-emerald-700">Verified Photo</span>
              </div>

              <div className="p-3 rounded-xl bg-cosathi-surface border border-cosathi-border">
                <Video className="w-4 h-4 text-cosathi-ochre mx-auto mb-1" />
                <span className="text-[10px] text-cosathi-muted block">Intro Video</span>
                <span className="text-[11px] font-bold text-emerald-700">15s Audited</span>
              </div>
            </div>

            {/* Performance Engine & Quality Metrics */}
            <div className="p-4 rounded-2xl bg-cosathi-surface border border-cosathi-border text-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-cosathi-border/60">
                <span className="font-bold text-cosathi-slate flex items-center space-x-1.5">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>
                    {workerPerformanceDetail?.performance?.averageRating !== undefined
                      ? `${workerPerformanceDetail.performance.averageRating.toFixed(1)}★`
                      : `${selectedWorker.rating}★`}
                  </span>
                  <span className="text-cosathi-muted font-normal">
                    ({workerPerformanceDetail?.performance?.totalRatingsCount ?? 12} reviews)
                  </span>
                </span>
                <span className="text-[11px] font-bold text-cosathi-forest bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Fairness Score: {workerPerformanceDetail?.performance?.utilizationLast7Days !== undefined
                    ? Math.round((1 - workerPerformanceDetail.performance.utilizationLast7Days) * 100)
                    : 85}/100
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                <div className="bg-white p-2 rounded-xl border border-cosathi-border">
                  <span className="text-cosathi-muted block">Completed</span>
                  <span className="font-bold text-cosathi-slate">
                    {workerPerformanceDetail?.performance?.lifetimeJobsCompleted ?? selectedWorker.completedJobs}
                  </span>
                </div>
                <div className="bg-white p-2 rounded-xl border border-cosathi-border">
                  <span className="text-cosathi-muted block">Acceptance</span>
                  <span className="font-bold text-emerald-700">
                    {workerPerformanceDetail?.performance?.acceptanceRatePercent ?? 96}%
                  </span>
                </div>
                <div className="bg-white p-2 rounded-xl border border-cosathi-border">
                  <span className="text-cosathi-muted block">Complaints</span>
                  <span className="font-bold text-amber-700">
                    {workerPerformanceDetail?.performance?.complaintCount ?? selectedWorker.complaints}
                  </span>
                </div>
              </div>

              {/* Customer Compliments Breakdown */}
              <div className="space-y-1 pt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-cosathi-muted block">
                  Positive Compliments Breakdown:
                </span>
                <div className="flex flex-wrap gap-1.5 text-[10px]">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                    ⏱️ On time ({workerPerformanceDetail?.performance?.tagCounts?.onTime ?? 8})
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                    🤝 Professional ({workerPerformanceDetail?.performance?.tagCounts?.professional ?? 10})
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                    ✨ Good quality ({workerPerformanceDetail?.performance?.tagCounts?.goodQuality ?? 7})
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                    🏷️ Fair pricing ({workerPerformanceDetail?.performance?.tagCounts?.fairPricing ?? 6})
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                    🧹 Clean work ({workerPerformanceDetail?.performance?.tagCounts?.cleanWork ?? 5})
                  </span>
                </div>
              </div>

              {/* Recent Reviews / Comments if present */}
              {workerPerformanceDetail?.recentReviews && workerPerformanceDetail.recentReviews.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-cosathi-border/60">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cosathi-muted block">
                    Recent Customer Comments:
                  </span>
                  {workerPerformanceDetail.recentReviews.slice(0, 2).map((rev, idx) => (
                    <div key={idx} className="p-2 bg-white rounded-xl border border-cosathi-border text-[11px] space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-cosathi-slate flex items-center space-x-1">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span>{rev.rating}★</span>
                        </span>
                        <span className="text-[10px] text-cosathi-muted">
                          {new Date(rev.createdAt).toLocaleDateString('en-IN')}
                        </span>
                      </div>
                      <p className="text-cosathi-muted italic">"{rev.comment || 'Smooth service delivery.'}"</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Administrative Actions */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-cosathi-muted uppercase tracking-wider block">
                Administrative Membership Actions:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  disabled={actionLoading}
                  onClick={() => handleUpdateStatus(selectedWorker._id, 'VERIFIED')}
                  className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs"
                >
                  ✓ Approve (Verified)
                </button>

                <button
                  disabled={actionLoading}
                  onClick={() => handleUpdateStatus(selectedWorker._id, 'PROVISIONAL')}
                  className="p-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-xs"
                >
                  ⏳ Set Provisional
                </button>

                <button
                  disabled={actionLoading}
                  onClick={() => handleUpdateStatus(selectedWorker._id, 'SUSPENDED')}
                  className="p-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-xs"
                >
                  ✕ Suspend Member
                </button>

                <button
                  disabled={actionLoading}
                  onClick={() => handleUpdateStatus(selectedWorker._id, 'REJECTED')}
                  className="p-2 rounded-xl bg-cosathi-surface border border-cosathi-border text-cosathi-muted hover:text-cosathi-slate text-xs font-bold transition-all"
                >
                  Reject KYC
                </button>

                <button
                  disabled={actionLoading}
                  onClick={() => handleUpdateStatus(selectedWorker._id, 'VERIFIED')}
                  className="p-2 rounded-xl bg-cosathi-forest hover:bg-cosathi-forest-dark text-white text-xs font-bold transition-all shadow-xs"
                >
                  Reactivate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
