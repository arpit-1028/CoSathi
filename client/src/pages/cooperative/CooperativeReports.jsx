import React, { useState } from 'react';
import {
  FileBarChart,
  TrendingUp,
  Award,
  Download,
  CheckCircle2,
  Calendar,
  Users,
  ShieldCheck,
  IndianRupee,
  Clock,
  Sparkles,
} from 'lucide-react';

export const CooperativeReports = () => {
  const [timeframe, setTimeframe] = useState('30days');
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState('');

  const handleDownload = (format) => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      setDownloadSuccess(`CoSathi_${timeframe}_Audit_Report.${format} generated successfully!`);
      setTimeout(() => setDownloadSuccess(''), 4000);
    }, 800);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-cosathi-border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <FileBarChart className="w-4 h-4 text-cosathi-forest" />
            <span className="text-xs font-bold uppercase tracking-wider text-cosathi-forest">
              Transparency & Governance
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-cosathi-slate">
            Cooperative Analytics & Fairness Audit
          </h2>
          <p className="text-xs text-cosathi-muted">
            Independent audit metrics tracking equitable job distribution, fair wages, and collective social impact.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="text-xs font-bold px-3 py-2 rounded-xl border border-cosathi-border bg-white text-cosathi-slate"
          >
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
            <option value="ytd">Year to Date (2026)</option>
          </select>

          <button
            onClick={() => handleDownload('csv')}
            disabled={downloading}
            className="p-2.5 rounded-xl border border-cosathi-border hover:bg-cosathi-surface text-cosathi-slate transition-all text-xs font-bold flex items-center space-x-1.5"
            title="Export CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {downloadSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{downloadSuccess}</span>
        </div>
      )}

      {/* Fairness & Social Impact KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-cosathi-border shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-cosathi-muted uppercase tracking-wider">
              Fairness Equality Score
            </span>
            <div className="p-2 bg-emerald-50 rounded-xl text-cosathi-forest">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-cosathi-forest">0.92 / 1.0</div>
          <p className="text-[11px] text-cosathi-muted">
            Work distributed evenly with zero algorithmic favoritism
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-cosathi-border shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-cosathi-muted uppercase tracking-wider">
              Worker Retention Rate
            </span>
            <div className="p-2 bg-sky-50 rounded-xl text-sky-700">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-cosathi-slate">98.4%</div>
          <p className="text-[11px] text-cosathi-muted">
            Certified members active for {'>'} 90 consecutive days
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-cosathi-border shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-cosathi-muted uppercase tracking-wider">
              Corporate Commission Saved
            </span>
            <div className="p-2 bg-amber-50 rounded-xl text-amber-700">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-cosathi-slate">₹42,800</div>
          <p className="text-[11px] text-cosathi-muted">
            Retained directly by workers vs traditional 20-25% private platform cuts
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-cosathi-border shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-cosathi-muted uppercase tracking-wider">
              Average Service SLA
            </span>
            <div className="p-2 bg-purple-50 rounded-xl text-purple-700">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-cosathi-slate">24.5 Mins</div>
          <p className="text-[11px] text-cosathi-muted">
            From booking request to verified worker doorstep arrival
          </p>
        </div>
      </div>

      {/* Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Trade Distribution */}
        <div className="bg-white rounded-3xl p-6 border border-cosathi-border shadow-sm space-y-4">
          <h3 className="font-bold text-base text-cosathi-slate">Trade Volume Distribution</h3>
          <p className="text-xs text-cosathi-muted">
            Proportion of services fulfilled across registered skilled trades.
          </p>

          <div className="space-y-3 pt-2">
            {[
              { trade: 'Electrical Works', pct: 38, count: '142 services', color: 'bg-cosathi-forest' },
              { trade: 'Plumbing Services', pct: 28, count: '105 services', color: 'bg-sky-600' },
              { trade: 'Cleaning & Domestic', pct: 18, count: '68 services', color: 'bg-amber-500' },
              { trade: 'Carpentry & Fixtures', pct: 10, count: '38 services', color: 'bg-cosathi-clay' },
              { trade: 'Painting & Maintenance', pct: 6, count: '22 services', color: 'bg-purple-500' },
            ].map((row, idx) => (
              <div key={idx} className="space-y-1 text-xs">
                <div className="flex justify-between font-semibold text-cosathi-slate">
                  <span>{row.trade}</span>
                  <span className="text-cosathi-muted">{row.count} ({row.pct}%)</span>
                </div>
                <div className="h-2 w-full bg-cosathi-surface rounded-full overflow-hidden">
                  <div style={{ width: `${row.pct}%` }} className={`h-full ${row.color}`} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Worker Earnings Distribution (Fairness Check) */}
        <div className="bg-white rounded-3xl p-6 border border-cosathi-border shadow-sm space-y-4">
          <h3 className="font-bold text-base text-cosathi-slate">Worker Income Dispersion Audit</h3>
          <p className="text-xs text-cosathi-muted">
            CoSathi algorithmic fairness actively avoids top 10% worker monopolies.
          </p>

          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 space-y-2">
            <div className="font-bold flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-cosathi-forest" />
              <span>Gini Index: 0.14 (Extremely Low Income Inequality)</span>
            </div>
            <p className="text-emerald-800 text-[11px] leading-relaxed">
              In conventional gig platforms, the top 10% highest-rated workers claim over 60% of bookings. In CoSathi, the 7-day workload rotation ensures that all active certified workers receive within 15% of the median weekly earnings.
            </p>
          </div>

          <div className="space-y-2 text-xs pt-1">
            <div className="flex justify-between py-1.5 border-b border-cosathi-border">
              <span className="text-cosathi-muted">Median Weekly Worker Earnings</span>
              <span className="font-bold text-cosathi-slate">₹6,850</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-cosathi-border">
              <span className="text-cosathi-muted">Lowest 20th Percentile Earnings</span>
              <span className="font-bold text-cosathi-slate">₹5,900</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-cosathi-border">
              <span className="text-cosathi-muted">Top 80th Percentile Earnings</span>
              <span className="font-bold text-cosathi-slate">₹7,400</span>
            </div>
            <div className="flex justify-between py-1.5 text-cosathi-forest font-bold">
              <span>Fairness Dispersion Ratio</span>
              <span>1.25x (Safe & Equitable)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
