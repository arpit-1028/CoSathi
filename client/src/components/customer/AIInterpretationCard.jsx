import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Sparkles, ShieldCheck, CheckCircle2, AlertTriangle, Receipt, Languages, Check, Scale } from 'lucide-react';

export const AIInterpretationCard = ({
  parsedTasks = [],
  estimatedTotal = 550,
  minEstimate = 450,
  maxEstimate = 750,
  rateCardVersion = 'v2026.1',
  rawRequirement = '',
  confidence = 0.94,
  languageDetected = 'hi',
  category = 'plumbing',
}) => {
  const { t } = useLanguage();

  const defaultTasks = [
    {
      code: 'TAP_REPLACEMENT',
      title: 'Tap replacement',
      quantity: 1,
      unitPrice: 300,
      minPrice: 250,
      maxPrice: 350,
    },
    {
      code: 'DRAIN_BLOCKAGE',
      title: 'Drain blockage clearance',
      quantity: 1,
      unitPrice: 250,
      minPrice: 200,
      maxPrice: 300,
    },
  ];

  // Only show default tasks if truly no parsed tasks
  const tasksToDisplay = parsedTasks.length > 0 ? parsedTasks : [];
  const hasRealPrices = tasksToDisplay.some((t) => t.unitPrice != null && t.unitPrice > 0);
  const computedTotal = estimatedTotal != null && estimatedTotal > 0
    ? estimatedTotal
    : hasRealPrices
      ? tasksToDisplay.reduce((sum, item) => sum + ((item.unitPrice || 0) * (item.quantity || 1)), 0)
      : null;
  const minRange = minEstimate && minEstimate > 0 ? minEstimate : (computedTotal ? Math.round(computedTotal * 0.85) : null);
  const maxRange = maxEstimate && maxEstimate > 0 ? maxEstimate : (computedTotal ? Math.round(computedTotal * 1.25) : null);

  return (
    <div className="space-y-4">
      {/* Cooperative Fair Pricing Directive Header */}
      <div className="p-4 rounded-xl bg-[#24324A] text-white shadow-card flex items-start sm:items-center space-x-3.5 border border-[#162031]">
        <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 text-[#DF9F35] font-serif font-bold">
          <Scale className="w-5 h-5 text-[#DF9F35]" />
        </div>
        <div className="space-y-0.5">
          <span className="text-[10px] uppercase tracking-wider text-[#DF9F35] font-bold block">
            सहकारी मूल्य निर्धारण निर्देश • Cooperative Rate Directive
          </span>
          <p className="text-sm font-serif italic text-white leading-snug">
            "AI identifies the work. The cooperative rate card determines the price."
          </p>
        </div>
      </div>

      {/* AI Task Structuring Box */}
      <div className="bg-[#FFFFFF] rounded-xl p-5 sm:p-6 border border-[#D9D5CC] shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#E2DDD3] gap-2">
          <div className="space-y-0.5">
            <div className="inline-flex items-center space-x-1.5 text-[11px] font-bold uppercase tracking-wider text-[#24324A]">
              <Sparkles className="w-3.5 h-3.5 text-[#C58B2A]" />
              <span>{t('customer.aiBreakdownTitle')}</span>
            </div>
            <h3 className="text-base font-serif font-bold text-[#20242A]">
              {t('customer.aiBreakdownSubtitle')}
            </h3>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="px-2.5 py-1 rounded-md bg-[#F2EFEB] text-[#3C5A48] font-bold border border-[#D9D5CC] flex items-center space-x-1">
              <Check className="w-3 h-3" />
              <span>Confidence: {Math.round((confidence || 0.94) * 100)}%</span>
            </span>
            <span className="px-2.5 py-1 rounded-md bg-[#F7F4EE] text-[#20242A] font-medium border border-[#D9D5CC] flex items-center space-x-1 uppercase text-[10px]">
              <Languages className="w-3 h-3 text-[#A65343]" />
              <span>{languageDetected === 'hi' ? 'Hindi / Hinglish' : 'English'}</span>
            </span>
          </div>
        </div>

        {/* Structured Task Items */}
        <div className="space-y-2">
          {tasksToDisplay.map((task, idx) => {
            const isReview = task.code === 'NEEDS_REVIEW';
            return (
              <div
                key={idx}
                className={`p-3 rounded-lg border flex items-center justify-between ${
                  isReview
                    ? 'bg-[#FFF8E7] border-[#DF9F35]'
                    : 'bg-[#F7F4EE] border-[#D9D5CC]'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-7 h-7 rounded-md border flex items-center justify-center text-xs font-bold ${
                    isReview
                      ? 'bg-[#DF9F35] text-white border-[#C58B2A]'
                      : 'bg-white text-[#24324A] border-[#D9D5CC]'
                  }`}>
                    {idx + 1}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="text-xs font-bold text-[#20242A]">{task.title || task.label || task.name}</h4>
                      {isReview && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#DF9F35]/20 text-[#8C4334] uppercase">
                          Manual Review
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-[#636D79]">
                      Item Code: <code className={`font-mono text-xs px-1 py-0.5 rounded border ${
                        isReview ? 'bg-white text-[#8C4334]' : 'bg-white text-[#24324A]'
                      }`}>{task.code || 'TASK_STANDARD'}</code> • Qty: {task.quantity || 1}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-[#20242A]">
                    {task.unitPrice != null
                      ? `₹${(task.unitPrice * (task.quantity || 1))}`
                      : 'On-site rate'}
                  </span>
                  <span className="block text-[10px] text-[#636D79]">Official Rate</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Rate Card Estimate Breakdown with Range */}
        <div className="p-4 rounded-xl bg-[#FFFFFF] border border-[#D9D5CC] space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#636D79] font-medium">Cooperative Rate Card Version:</span>
            <span className="font-mono text-[11px] font-bold text-[#24324A] bg-[#F2EFEB] px-2 py-0.5 rounded border border-[#D9D5CC]">
              {rateCardVersion}
            </span>
          </div>

          {minRange && maxRange ? (
            <div className="flex items-center justify-between text-xs text-[#636D79]">
              <span>Estimated Range (Uncertainty Buffer):</span>
              <span className="font-semibold text-[#20242A]">₹{minRange}–₹{maxRange}</span>
            </div>
          ) : null}

          <div className="pt-2 border-t border-[#E2DDD3] flex items-center justify-between text-sm font-bold text-[#20242A]">
            <div>
              <span className="font-serif">Initial Estimate / अनुमानित शुल्क:</span>
              <span className="block text-[11px] font-normal text-[#636D79]">Based on scheduled rate card</span>
            </div>
            <div className="text-right">
              {computedTotal != null ? (
                <>
                  <span className="text-2xl font-serif font-bold text-[#24324A]">₹{computedTotal}</span>
                  {minRange && maxRange && (
                    <span className="block text-[10px] text-[#636D79]">Range: ₹{minRange}–₹{maxRange}</span>
                  )}
                </>
              ) : (
                <span className="text-base font-serif font-bold text-[#636D79]">On-site estimate</span>
              )}
            </div>
          </div>
        </div>

        {/* Mandatory Explanation Box */}
        <div className="p-3 rounded-lg bg-[#F7F4EE] border border-[#D9D5CC] text-xs flex items-start space-x-2.5">
          <ShieldCheck className="w-4 h-4 text-[#3C5A48] flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold text-[#20242A] block">पारदर्शी सहकारी गारंटी (Rate Guarantee)</span>
            <p className="leading-relaxed text-[11px] text-[#636D79]">
              "Final amount is based on completed work and the cooperative rate card."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
export default AIInterpretationCard;
