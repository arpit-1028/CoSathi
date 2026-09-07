import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../services/api';
import {
  Mic,
  MicOff,
  Sparkles,
  Receipt,
  HeartHandshake,
  CheckCircle2,
  ArrowRight,
  Volume2,
  Scale,
  ShieldCheck,
} from 'lucide-react';

export const VoiceWorkReportModal = ({ booking, onSubmitBill, onClose }) => {
  const { t, language } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [workDescription, setWorkDescription] = useState(
    'Purana bathroom tap remove karke naya tap lagaya aur drain ka blockage clear kiya.'
  );

  const [isAnalyzed, setIsAnalyzed] = useState(true);
  const [rateCardVersion, setRateCardVersion] = useState('v2026.1');

  // Gemini Extracted Items matched to Rate Card
  const [extractedItems, setExtractedItems] = useState([
    { title: 'Tap Replacement & Installation', code: 'TAP_REPLACEMENT', rate: 300, qty: 1 },
    { title: 'Drain Blockage & Sewage Clearance', code: 'DRAIN_BLOCKAGE', rate: 250, qty: 1 },
    { title: 'Pipe Cleaning & Scale Flush', code: 'PIPE_CLEANING', rate: 100, qty: 1 },
  ]);

  const subtotal = extractedItems.reduce((sum, item) => sum + (item.rate || 250) * (item.qty || 1), 0);
  // 90% Worker Earning, 10% Cooperative Fund
  const netEarnings = Math.round(subtotal * 0.90);
  const welfareCut = subtotal - netEarnings;

  const handleAnalyzeWithAI = async (descText) => {
    const textToAnalyze = descText || workDescription;
    if (!textToAnalyze.trim()) return;
    setIsAiLoading(true);
    try {
      const res = await api.post('/ai/interpret-completion', { description: textToAnalyze });
      if (res.data?.success && res.data?.data) {
        const data = res.data.data;
        if (Array.isArray(data.tasks) && data.tasks.length > 0) {
          // Reconcile tasks against MongoDB RateCard for authoritative pricing
          try {
            const estRes = await api.post('/rate-card/estimate', { tasks: data.tasks });
            if (estRes.data?.success && estRes.data?.data) {
              const est = estRes.data.data;
              setRateCardVersion(est.rateCardVersion || 'v2026.1');
              setExtractedItems(
                est.items.map((it) => ({
                  title: it.name,
                  code: it.code,
                  rate: it.unitPrice,
                  qty: it.quantity || 1,
                  isReview: it.needsReview,
                }))
              );
              return;
            }
          } catch (estErr) {
            console.warn('Rate card lookup fallback notice:', estErr.message);
          }

          const fallbackItems = data.tasks.map((t) => ({
            title: t.label || t.code,
            code: t.code,
            rate: t.code === 'TAP_REPLACEMENT' ? 300 : t.code === 'DRAIN_BLOCKAGE' ? 250 : t.code === 'PIPE_CLEANING' ? 100 : 199,
            qty: t.quantity || 1,
            isReview: t.code === 'NEEDS_REVIEW',
          }));
          setExtractedItems(fallbackItems);
        }
      }
    } catch (err) {
      console.warn('AI worker completion notice:', err.message);
    } finally {
      setIsAiLoading(false);
      setIsAnalyzed(true);
    }
  };

  const simulateSpeech = () => {
    setIsListening(true);
    const demoPhrases = {
      en: 'Purana bathroom tap remove karke naya tap lagaya aur drain ka blockage clear kiya.',
      hi: 'पुराना बाथरूम नल बदलकर नया नल लगाया और ड्रेन का ब्लॉकेज साफ किया।',
    };
    const phrase = demoPhrases[language] || demoPhrases.en;

    let index = 0;
    setWorkDescription('');
    const interval = setInterval(() => {
      index += 3;
      setWorkDescription(phrase.slice(0, index));
      if (index >= phrase.length) {
        clearInterval(interval);
        setTimeout(() => {
          setIsListening(false);
          handleAnalyzeWithAI(phrase);
        }, 500);
      }
    }, 35);
  };

  const handleSubmit = () => {
    onSubmitBill({
      tasks: extractedItems.map((it) => ({
        code: it.code,
        title: it.title,
        quantity: it.qty,
      })),
      completedTasks: extractedItems.map((it) => ({
        code: it.code,
        title: it.title,
        quantity: it.qty,
      })),
      description: workDescription,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#20242A]/80 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-[#FFFFFF] max-w-lg w-full rounded-xl p-5 sm:p-7 border border-[#D9D5CC] shadow-2xl space-y-5 my-8">
        {/* Cooperative Fair Pricing Directive Banner */}
        <div className="p-3.5 rounded-xl bg-[#24324A] text-white shadow-card flex items-center space-x-3 border border-[#162031]">
          <Scale className="w-5 h-5 text-[#DF9F35] flex-shrink-0" />
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase tracking-wider text-[#DF9F35] font-bold block">
              Cooperative Fair Pricing Directive
            </span>
            <p className="text-xs font-serif italic text-white/95 leading-tight">
              "AI identifies the work. The cooperative rate card determines the price."
            </p>
          </div>
        </div>

        <div className="flex items-start justify-between pb-3 border-b border-[#E2DDD3]">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#C58B2A]">
              {t('worker.reportTitle')} • कार्य समाप्ति विवरण
            </span>
            <h3 className="font-serif text-lg font-bold text-[#20242A]">
              Booking #{booking?.bookingNumber || 'CS-2026-0905-081'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-xs font-semibold text-[#636D79] hover:text-[#20242A]"
          >
            ✕ {t('common.close')}
          </button>
        </div>

        <p className="text-xs text-[#636D79] leading-relaxed">
          {t('worker.reportSubtitle')}
        </p>

        {/* Voice Input Section */}
        <div className="p-4 rounded-xl bg-[#F7F4EE] border border-[#D9D5CC] flex flex-col items-center text-center space-y-3">
          <button
            type="button"
            onClick={simulateSpeech}
            className={`w-16 h-16 rounded-full flex items-center justify-center text-white shadow-card transition-all ${
              isListening
                ? 'bg-[#A65343] animate-voice-pulse shadow-[0_0_20px_rgba(166,83,67,0.35)]'
                : 'bg-[#A65343] hover:bg-[#8C4334]'
            }`}
          >
            {isListening ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
          </button>

          <span className="text-xs font-bold text-[#20242A]">
            {isListening ? t('worker.listeningWork') : t('worker.speakPrompt')}
          </span>

          <textarea
            rows={2}
            value={workDescription}
            onChange={(e) => setWorkDescription(e.target.value)}
            placeholder={t('worker.orTypeText')}
            className="w-full p-3 text-xs rounded-lg border border-[#D9D5CC] bg-white resize-none text-[#20242A]"
          />

          <div className="w-full flex justify-end">
            <button
              type="button"
              disabled={isAiLoading || !workDescription.trim()}
              onClick={() => handleAnalyzeWithAI()}
              className="px-3.5 py-1.5 rounded-lg bg-[#24324A] hover:bg-[#162031] text-white text-xs font-semibold flex items-center space-x-1.5 shadow-xs disabled:opacity-50"
            >
              <Sparkles className={`w-3.5 h-3.5 text-[#DF9F35] ${isAiLoading ? 'animate-spin' : ''}`} />
              <span>{isAiLoading ? 'Analyzing Tasks...' : 'Reconcile Tasks with AI'}</span>
            </button>
          </div>
        </div>

        {/* Reconciled Tasks from Rate Card */}
        {isAnalyzed && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-[#20242A] uppercase tracking-wider">
              <div className="flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#C58B2A]" />
                <span>{t('worker.reconciledTitle')}</span>
              </div>
              <span className="font-mono text-[10px] bg-[#F2EFEB] text-[#24324A] px-2 py-0.5 rounded border border-[#D9D5CC]">
                Rate Card {rateCardVersion}
              </span>
            </div>

            <div className="divide-y divide-[#E2DDD3] border border-[#D9D5CC] rounded-lg bg-[#FFFFFF] overflow-hidden text-xs">
              {extractedItems.map((item, idx) => (
                <div key={idx} className={`p-3 flex justify-between items-center ${item.isReview ? 'bg-[#FFF8E7]' : ''}`}>
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="font-bold text-[#20242A]">{item.title}</span>
                      {item.isReview && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#DF9F35]/20 text-[#8C4334]">
                          Needs Review
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-[#636D79]">
                      <code className="font-mono text-[10px] bg-[#F7F4EE] px-1 rounded border border-[#D9D5CC] mr-1">{item.code}</code>
                      Rate: ₹{item.rate} × {item.qty}
                    </span>
                  </div>
                  <span className="font-bold text-[#20242A]">
                    ₹{item.rate * item.qty}
                  </span>
                </div>
              ))}
            </div>

            {/* Transparent Earning Breakdown: 90% Worker, 10% Cooperative Fund */}
            <div className="p-3.5 rounded-lg bg-[#F7F4EE] border border-[#D9D5CC] text-xs space-y-2">
              <div className="flex justify-between text-[#636D79]">
                <span>Total Work Reconciled</span>
                <span className="font-bold text-[#20242A]">₹{subtotal}</span>
              </div>
              <div className="flex justify-between text-[#3C5A48]">
                <span>Cooperative Welfare Allocation (10%)</span>
                <span>- ₹{welfareCut}</span>
              </div>
              <div className="pt-2 border-t border-[#D9D5CC] flex justify-between font-bold text-sm">
                <span className="text-[#20242A]">Worker Net Payout (90%)</span>
                <span className="font-serif font-bold text-[#24324A] text-base">₹{netEarnings}</span>
              </div>
            </div>

            {/* Explanation Note */}
            <div className="p-2.5 rounded-lg bg-[#F2EFEB] border border-[#D9D5CC] text-[#20242A] text-[11px] flex items-start space-x-2">
              <ShieldCheck className="w-4 h-4 text-[#3C5A48] flex-shrink-0 mt-0.5" />
              <span>"Final amount is based on completed work and the cooperative rate card."</span>
            </div>

            <button
              onClick={handleSubmit}
              className="w-full py-3 rounded-lg bg-[#24324A] hover:bg-[#162031] text-white text-xs font-semibold shadow-card transition-all flex items-center justify-center space-x-2"
            >
              <span>Submit Reconciled Bill for Customer Approval</span>
              <ArrowRight className="w-4 h-4 text-[#DF9F35]" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceWorkReportModal;
