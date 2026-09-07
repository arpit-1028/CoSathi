import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  AlertTriangle,
  Scale,
  ShieldCheck,
  CheckCircle2,
  Clock,
  User,
  Phone,
  FileText,
  Image,
  RefreshCw,
  X,
  MessageSquare,
  Sparkles,
  IndianRupee,
  AlertCircle,
  Eye,
  ShieldAlert,
  RotateCcw,
} from 'lucide-react';

export const DisputesPanel = () => {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedDispute, setSelectedDispute] = useState(null);

  // Resolution Action State
  const [resolutionAction, setResolutionAction] = useState('partial_refund');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [refundAmount, setRefundAmount] = useState('100');
  const [resolving, setResolving] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      const res = await api.get('/cooperative/disputes');
      if (res.data.success) {
        setDisputes(res.data.disputes || []);
      }
    } catch (err) {
      console.error('Failed to fetch disputes', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  const filteredDisputes = disputes.filter((d) => {
    if (filter === 'all') return true;
    if (filter === 'open') return d.status === 'under_cooperative_review' || d.status === 'raised';
    if (filter === 'resolved') return d.status === 'resolved_settlement' || d.status === 'resolved_refund' || d.status === 'resolved_dismissed';
    return true;
  });

  const handleOpenDisputeModal = (disp) => {
    setSelectedDispute(disp);
    setResolutionNotes('');
    setRefundAmount(disp.booking?.finalPrice ? Math.round(disp.booking.finalPrice * 0.5).toString() : '100');
    setResolutionAction('partial_refund');
    setActionError('');
  };

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDispute) return;
    setResolving(true);
    setActionError('');

    try {
      const res = await api.post(`/cooperative/disputes/${selectedDispute._id}/resolve`, {
        action: resolutionAction,
        notes: resolutionNotes || `Arbitration decision executed: ${resolutionAction}`,
        refundAmount: Number(refundAmount),
      });

      if (res.data.success) {
        setActionSuccess(
          `Dispute ${selectedDispute.disputeTicketNumber} resolved: [${resolutionAction.toUpperCase()}]. Immutable AuditLog recorded.`
        );
        setSelectedDispute(null);
        fetchDisputes();
        setTimeout(() => setActionSuccess(''), 6000);
      }
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to resolve dispute');
    } finally {
      setResolving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#FFFFFF] rounded-xl p-6 border border-[#D9D5CC] shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="w-5 h-5 rounded-full bg-[#A65343] text-[#F7F4EE] font-serif text-[10px] font-bold flex items-center justify-center">
              न्याय
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#A65343]">
              Peer Review & Cooperative Justice • सहकारी न्याय पीठ
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#20242A]">
            Cooperative Dispute Arbitration Panel
          </h2>
          <p className="text-xs text-[#636D79] mt-0.5">
            Evidence-backed dispute arbitration by elected cooperative delegates. AI organizes evidence but never makes final decisions.
          </p>
        </div>

        <button
          onClick={fetchDisputes}
          className="p-2.5 rounded-lg border border-[#D9D5CC] hover:bg-[#F7F4EE] text-[#20242A] transition-colors text-xs font-semibold flex items-center space-x-1.5 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#3C5A48]' : ''}`} />
          <span>Refresh Cases</span>
        </button>
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-xl bg-[#DDE5E0] border border-[#3C5A48]/30 text-[#3C5A48] text-xs font-bold flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-[#3C5A48] flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
            filter === 'all'
              ? 'bg-[#24324A] text-white shadow-xs'
              : 'bg-[#FFFFFF] text-[#20242A] border border-[#D9D5CC] hover:bg-[#F7F4EE]'
          }`}
        >
          All Disputes ({disputes.length})
        </button>
        <button
          onClick={() => setFilter('open')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
            filter === 'open'
              ? 'bg-[#C58B2A] text-white shadow-xs'
              : 'bg-[#FFFFFF] text-[#20242A] border border-[#D9D5CC] hover:bg-[#F7F4EE]'
          }`}
        >
          Under Review ({disputes.filter((d) => d.status === 'under_cooperative_review' || d.status === 'raised').length})
        </button>
        <button
          onClick={() => setFilter('resolved')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
            filter === 'resolved'
              ? 'bg-[#3C5A48] text-white shadow-xs'
              : 'bg-[#FFFFFF] text-[#20242A] border border-[#D9D5CC] hover:bg-[#F7F4EE]'
          }`}
        >
          Settled ({disputes.filter((d) => d.status.includes('resolved')).length})
        </button>
      </div>

      {/* Disputes Table */}
      <div className="bg-[#FFFFFF] rounded-xl border border-[#D9D5CC] shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#F7F4EE] border-b border-[#D9D5CC] text-[11px] text-[#636D79] font-serif font-bold uppercase tracking-wider">
                <th className="py-3 px-3">Ticket #</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Complainant</th>
                <th className="py-3 px-3">Respondent Worker</th>
                <th className="py-3 px-3">Issue Description</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Arbitration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2DDD3]">
              {filteredDisputes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-[#636D79]">
                    No active dispute arbitration cases found.
                  </td>
                </tr>
              ) : (
                filteredDisputes.map((d) => (
                  <tr key={d._id} className="hover:bg-[#F7F4EE]/70 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-[#24324A]">
                      {d.disputeTicketNumber}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                          d.disputeCategory === 'billing'
                            ? 'bg-[#EAE5DA] text-[#24324A] border border-[#D9D5CC]'
                            : d.disputeCategory === 'quality'
                            ? 'bg-[#DDE5E0] text-[#3C5A48] border border-[#3C5A48]/30'
                            : d.disputeCategory === 'behavior'
                            ? 'bg-[#F9E2DF] text-[#A65343] border border-[#A65343]/30'
                            : 'bg-[#FDF3E3] text-[#C58B2A] border border-[#C58B2A]/30'
                        }`}
                      >
                        {d.disputeCategory}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-[#20242A]">
                      {d.raisedBy?.name || 'Customer'}
                    </td>
                    <td className="py-3 px-3 text-[#20242A]">
                      {d.againstUser?.name || 'Assigned Worker'}
                    </td>
                    <td className="py-3 px-3 text-[#636D79] max-w-xs truncate">
                      {d.description}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          d.status.includes('resolved')
                            ? 'bg-[#DDE5E0] text-[#3C5A48]'
                            : 'bg-[#FDF3E3] text-[#C58B2A]'
                        }`}
                      >
                        {d.status.includes('resolved') ? 'Resolved' : 'Under Review'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleOpenDisputeModal(d)}
                        className="p-1.5 rounded-lg border border-[#D9D5CC] hover:bg-[#F2EFEB] text-[#3C5A48] font-bold text-xs inline-flex items-center space-x-1 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect & Arbitrate</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comprehensive Dispute Inspection & Arbitration Decision Modal */}
      {selectedDispute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-[#FFFFFF] max-w-2xl w-full rounded-xl p-6 sm:p-7 border border-[#D9D5CC] shadow-2xl space-y-5 my-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-[#E2DDD3]">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-bold text-[#24324A] bg-[#F2EFEB] px-2 py-0.5 rounded border border-[#D9D5CC]">
                    {selectedDispute.disputeTicketNumber}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#FDF3E3] text-[#C58B2A] border border-[#C58B2A]/30">
                    Category: {selectedDispute.disputeCategory}
                  </span>
                </div>
                <h3 className="text-base font-serif font-bold text-[#20242A] mt-1">
                  Dispute Evidence Pack & Arbitration • साक्ष्य व मध्यस्थता निर्णय
                </h3>
              </div>
              <button
                onClick={() => setSelectedDispute(null)}
                className="text-xs font-semibold text-[#636D79] hover:text-[#20242A] p-1 rounded"
              >
                ✕ Close
              </button>
            </div>

            {actionError && (
              <div className="p-3 bg-[#F9E2DF] border border-[#A65343]/30 rounded-lg text-[#A65343] text-xs font-bold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4" />
                <span>{actionError}</span>
              </div>
            )}

            {/* Evidence Pack Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-lg bg-[#F7F4EE] border border-[#D9D5CC] space-y-1">
                <span className="text-[10px] font-bold uppercase text-[#636D79] block">
                  Customer Claim:
                </span>
                <p className="text-[#20242A] font-medium">"{selectedDispute.description}"</p>
                <span className="text-[10px] text-[#636D79] block mt-1">
                  Filing Member: {selectedDispute.raisedBy?.name} ({selectedDispute.raisedBy?.phone})
                </span>
              </div>

              <div className="p-3.5 rounded-lg bg-[#F7F4EE] border border-[#D9D5CC] space-y-1">
                <span className="text-[10px] font-bold uppercase text-[#636D79] block">
                  Worker Defense & Transcript:
                </span>
                <p className="text-[#20242A] italic">
                  "{selectedDispute.evidence?.voiceTranscript || selectedDispute.booking?.voiceTranscript || 'Voice work completion submitted.'}"
                </p>
                <span className="text-[10px] text-[#636D79] block mt-1">
                  Respondent: {selectedDispute.againstUser?.name}
                </span>
              </div>
            </div>

            {/* Bill & Rate Card Snapshot */}
            <div className="p-3.5 rounded-lg bg-[#FFFFFF] border border-[#D9D5CC] text-xs space-y-2">
              <div className="flex items-center justify-between font-bold">
                <span className="text-[#20242A]">Rate Card & Bill Record:</span>
                <span className="text-[#24324A] font-mono text-sm">
                  Final Invoiced: ₹{selectedDispute.booking?.finalPrice || 650}
                </span>
              </div>
              <p className="text-[11px] text-[#636D79]">
                Line Items Billed: {selectedDispute.booking?.tasks?.map((t) => t.title || t.code).join(', ') || 'Standard plumbing items'}
              </p>
            </div>

            {/* AI Evidence Organization Card (STRICT DISCLAIMER) */}
            <div className="p-4 rounded-lg bg-[#F7F4EE] border border-[#C58B2A]/40 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#20242A] flex items-center space-x-1.5">
                  <Sparkles className="w-4 h-4 text-[#C58B2A]" />
                  <span className="font-serif">AI Evidence Synthesis (Assistant Only)</span>
                </span>
                <span className="text-[10px] bg-[#FDF3E3] text-[#C58B2A] border border-[#C58B2A]/30 px-2 py-0.5 rounded font-bold">
                  Human Decision Only
                </span>
              </div>

              <p className="text-[#636D79] text-[11px] leading-relaxed">
                {selectedDispute.aiEvidenceSummary?.summary ||
                  'AI has cross-referenced the customer dispute statement with the worker transcript and rate card line items.'}
              </p>

              {selectedDispute.aiEvidenceSummary?.keyFacts && (
                <div className="space-y-0.5 pt-1 text-[11px] text-[#20242A]">
                  <span className="font-bold block">Synthesized Facts:</span>
                  <ul className="list-disc pl-4 space-y-0.5 text-[#636D79]">
                    {selectedDispute.aiEvidenceSummary.keyFacts.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Mandatory Non-Decision Disclaimer */}
              <div className="mt-2 p-2.5 rounded-lg bg-[#FFFFFF] border border-[#D9D5CC] text-[11px] text-[#24324A] font-medium flex items-start space-x-2">
                <ShieldCheck className="w-4 h-4 text-[#3C5A48] flex-shrink-0 mt-0.5" />
                <span>
                  {selectedDispute.aiEvidenceSummary?.disclaimer ||
                    'AI organizes and synthesizes evidence strictly for human arbitrator assistance. AI does not and must not make the final decision.'}
                </span>
              </div>
            </div>

            {/* Human Cooperative Arbitration Form */}
            <form onSubmit={handleResolveSubmit} className="space-y-4 pt-2 border-t border-[#E2DDD3] text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-[#20242A] uppercase tracking-wider text-[11px] block">
                  Select Cooperative Arbitration Decision:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'no_action', label: 'No Action (Uphold Bill)' },
                    { id: 'partial_refund', label: 'Partial Refund' },
                    { id: 'full_refund', label: 'Full Refund' },
                    { id: 'rework', label: 'Free Rework Scheduled' },
                    { id: 'warning', label: 'Issue Formal Warning' },
                    { id: 'suspend', label: 'Suspend Worker Member' },
                  ].map((act) => (
                    <button
                      type="button"
                      key={act.id}
                      onClick={() => setResolutionAction(act.id)}
                      className={`p-2.5 rounded-lg text-left font-semibold transition-colors border ${
                        resolutionAction === act.id
                          ? 'bg-[#24324A] text-white border-[#24324A] shadow-xs'
                          : 'bg-[#F7F4EE] text-[#20242A] border-[#D9D5CC] hover:bg-[#F2EFEB]'
                      }`}
                    >
                      {act.label}
                    </button>
                  ))}
                </div>
              </div>

              {(resolutionAction === 'partial_refund' || resolutionAction === 'full_refund') && (
                <div className="space-y-1">
                  <label className="font-semibold text-[#20242A] block">
                    Refund Amount to Customer (₹)
                  </label>
                  <input
                    type="number"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-[#D9D5CC] bg-[#F7F4EE] font-mono font-bold text-[#20242A] text-xs"
                    required
                  />
                  <span className="text-[10px] text-[#636D79] block">
                    Will be credited from cooperative arbitration buffer and logged in the immutable transaction ledger.
                  </span>
                </div>
              )}

              <div className="space-y-1">
                <label className="font-semibold text-[#20242A] block">
                  Arbitration Committee Notes & Reason
                </label>
                <textarea
                  rows={2}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="State the findings of the peer review committee..."
                  className="w-full p-2.5 rounded-lg border border-[#D9D5CC] bg-[#F7F4EE] font-normal text-[#20242A] resize-none text-xs"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={resolving}
                className="w-full py-3 bg-[#3C5A48] hover:bg-[#2A4032] text-white font-semibold rounded-lg shadow-xs transition-colors text-xs flex items-center justify-center space-x-1.5"
              >
                <span>Execute Human Decision & Record AuditLog</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
