import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  CalendarCheck,
  Search,
  Filter,
  Eye,
  Clock,
  User,
  Wrench,
  MapPin,
  IndianRupee,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  X,
  Phone,
  FileText,
} from 'lucide-react';

export const BookingsManager = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/cooperative/bookings');
      if (res.data.success) {
        setBookings(res.data.bookings || []);
      }
    } catch (err) {
      console.error('Failed to fetch bookings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const filteredBookings = bookings.filter((b) => {
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    const q = search.toLowerCase();
    const matchesSearch =
      !search ||
      b.bookingNumber?.toLowerCase().includes(q) ||
      b.customer?.name?.toLowerCase().includes(q) ||
      b.assignedWorker?.name?.toLowerCase().includes(q) ||
      b.category?.name?.en?.toLowerCase().includes(q) ||
      b.location?.addressLine?.toLowerCase().includes(q);

    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
            Completed
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 animate-pulse">
            In Progress
          </span>
        );
      case 'assigned':
      case 'worker_accepted':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800">
            Worker Assigned
          </span>
        );
      case 'matching':
      case 'requested':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
            Matching
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-cosathi-surface text-cosathi-slate border border-cosathi-border">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-cosathi-border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <CalendarCheck className="w-4 h-4 text-cosathi-forest" />
            <span className="text-xs font-bold uppercase tracking-wider text-cosathi-forest">
              Operations Center
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-cosathi-slate">
            Platform Service Bookings
          </h2>
          <p className="text-xs text-cosathi-muted">
            Auditable lifecycle monitoring of all household service requests and worker dispatches.
          </p>
        </div>

        <button
          onClick={fetchBookings}
          className="p-2.5 rounded-xl border border-cosathi-border hover:bg-cosathi-surface text-cosathi-slate transition-all text-xs font-bold flex items-center space-x-1.5 self-start sm:self-auto"
          title="Refresh Bookings"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cosathi-forest' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-2xl p-4 border border-cosathi-border shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-cosathi-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID, customer, worker, area..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-cosathi-border focus:outline-hidden focus:border-cosathi-forest bg-cosathi-surface"
          />
        </div>

        {/* Status Pill Filters */}
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full pb-1 md:pb-0 scrollbar-thin">
          {[
            { id: 'all', label: 'All' },
            { id: 'requested', label: 'Requested' },
            { id: 'assigned', label: 'Assigned' },
            { id: 'in_progress', label: 'In Progress' },
            { id: 'completed', label: 'Completed' },
            { id: 'cancelled', label: 'Cancelled' },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                statusFilter === st.id
                  ? 'bg-cosathi-forest text-white'
                  : 'bg-cosathi-surface text-cosathi-slate hover:bg-cosathi-border'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-3xl border border-cosathi-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-cosathi-slate">
            <thead className="bg-cosathi-surface border-b border-cosathi-border text-cosathi-muted uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Booking ID</th>
                <th className="py-3 px-4">Category & Service</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Assigned Worker</th>
                <th className="py-3 px-4">Area / Locality</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cosathi-border">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-cosathi-muted">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-cosathi-forest mb-2" />
                    Loading platform bookings...
                  </td>
                </tr>
              ) : filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-cosathi-muted">
                    No bookings found matching current query.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => (
                  <tr key={b._id} className="hover:bg-cosathi-surface/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-cosathi-forest">
                      {b.bookingNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-cosathi-slate">
                        {b.requirementInput?.parsedTasks?.[0]?.title ||
                          b.requirementInput?.rawVoiceTranscript ||
                          'Ceiling Fan Repair'}
                      </div>
                      <div className="text-[11px] text-cosathi-muted">
                        {b.category?.name?.en || 'Electrical Works'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-cosathi-slate">
                        {b.customer?.name || 'Customer'}
                      </div>
                      <div className="text-[11px] text-cosathi-muted font-mono">
                        {b.customer?.phone || '9871000001'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {b.assignedWorker ? (
                        <div>
                          <div className="font-semibold text-cosathi-slate">
                            {b.assignedWorker.name}
                          </div>
                          <div className="text-[11px] text-cosathi-muted font-mono">
                            {b.assignedWorker.phone || '9810010001'}
                          </div>
                        </div>
                      ) : (
                        <span className="text-amber-600 font-semibold text-[11px]">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 max-w-[140px] truncate text-cosathi-muted">
                      {b.location?.addressLine || 'Lajpat Nagar II, New Delhi'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {getStatusBadge(b.status)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-cosathi-slate">
                      ₹{b.finalPrice || b.initialEstimate || 199}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedBooking(b)}
                        className="p-1.5 rounded-lg border border-cosathi-border hover:bg-cosathi-surface text-cosathi-slate hover:text-cosathi-forest transition-all"
                        title="View Full Booking Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* INSPECT MODAL */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-xl border border-cosathi-border space-y-4 animate-in fade-in duration-150 max-h-[90vh] overflow-y-auto scrollbar-thin">
            <div className="flex items-center justify-between border-b border-cosathi-border pb-3">
              <div>
                <span className="text-[10px] font-bold text-cosathi-forest uppercase tracking-wider">
                  Audit Inspection
                </span>
                <h3 className="font-bold text-base text-cosathi-slate font-mono">
                  {selectedBooking.bookingNumber}
                </h3>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="p-1.5 rounded-full hover:bg-cosathi-surface text-cosathi-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Status & Timing Banner */}
            <div className="bg-cosathi-surface p-3 rounded-2xl flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-cosathi-muted" />
                <span className="text-cosathi-muted">
                  Booked: {new Date(selectedBooking.createdAt || Date.now()).toLocaleString('en-IN')}
                </span>
              </div>
              <div>{getStatusBadge(selectedBooking.status)}</div>
            </div>

            {/* Customer & Worker Cards */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-2xl border border-cosathi-border bg-white space-y-1">
                <span className="text-[10px] font-bold text-cosathi-muted uppercase">Customer</span>
                <div className="font-bold text-cosathi-slate">
                  {selectedBooking.customer?.name || 'Customer'}
                </div>
                <div className="flex items-center space-x-1 text-cosathi-muted font-mono text-[11px]">
                  <Phone className="w-3 h-3" />
                  <span>{selectedBooking.customer?.phone || '9871000001'}</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl border border-cosathi-border bg-white space-y-1">
                <span className="text-[10px] font-bold text-cosathi-forest uppercase">Worker</span>
                <div className="font-bold text-cosathi-slate">
                  {selectedBooking.assignedWorker?.name || 'Ramesh Kumar'}
                </div>
                <div className="flex items-center space-x-1 text-cosathi-muted font-mono text-[11px]">
                  <Phone className="w-3 h-3" />
                  <span>{selectedBooking.assignedWorker?.phone || '9810010001'}</span>
                </div>
              </div>
            </div>

            {/* Requirement Details */}
            <div className="p-3 rounded-2xl border border-cosathi-border bg-cosathi-surface/40 space-y-2 text-xs">
              <div className="flex items-center space-x-1.5 text-cosathi-slate font-bold">
                <FileText className="w-3.5 h-3.5 text-cosathi-forest" />
                <span>Job Requirement & AI Parsing</span>
              </div>
              <p className="text-cosathi-slate font-medium">
                {selectedBooking.requirementInput?.rawVoiceTranscript ||
                  selectedBooking.requirementInput?.parsedTasks?.[0]?.title ||
                  'Ceiling fan making clicking sound, requires inspection and capacitor check.'}
              </p>
              <div className="flex items-center space-x-2 text-[11px] text-cosathi-muted">
                <MapPin className="w-3 h-3 text-cosathi-clay" />
                <span>{selectedBooking.location?.addressLine || 'Lajpat Nagar II, New Delhi'}</span>
              </div>
            </div>

            {/* Financial Reconciliation Breakdown */}
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs space-y-2">
              <span className="text-[10px] font-bold uppercase text-emerald-900 tracking-wider block">
                Cooperative Financial Settlement
              </span>
              <div className="flex justify-between font-medium text-cosathi-slate">
                <span>Gross Customer Total:</span>
                <span className="font-bold">₹{selectedBooking.finalPrice || selectedBooking.initialEstimate || 199}</span>
              </div>
              <div className="flex justify-between text-emerald-800 text-[11px]">
                <span>5% Social Welfare Pool Levy:</span>
                <span>- ₹{Math.round((selectedBooking.finalPrice || 199) * 0.05)}</span>
              </div>
              <div className="flex justify-between font-bold text-emerald-950 border-t border-emerald-200 pt-1.5 text-sm">
                <span>Worker Take-Home Pay:</span>
                <span>₹{Math.round((selectedBooking.finalPrice || 199) * 0.95)}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedBooking(null)}
                className="px-4 py-2 rounded-xl bg-cosathi-forest hover:bg-cosathi-moss text-white font-bold text-xs transition-all shadow-xs"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
