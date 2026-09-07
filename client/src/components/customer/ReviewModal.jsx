import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Star, Heart, Check, ArrowRight } from 'lucide-react';

export const ReviewModal = ({ workerName = 'Cooperative Sathi', onSubmitReview }) => {
  const { t } = useLanguage();
  const [overallRating, setOverallRating] = useState(5);
  const [punctuality, setPunctuality] = useState(5);
  const [quality, setQuality] = useState(5);
  const [behavior, setBehavior] = useState(5);
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState(['On time', 'Clean work']);
  const [selectedIssues, setSelectedIssues] = useState([]);

  // Phase 12 canonical positive tags
  const positiveTags = [
    'On time',
    'Professional',
    'Good quality',
    'Fair pricing',
    'Clean work',
  ];

  // Phase 12 canonical issue tags
  const issueTags = [
    'Overcharged',
    'Incomplete',
    'Late',
    'Poor quality',
    'Other',
  ];

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const toggleIssue = (issue) => {
    if (selectedIssues.includes(issue)) {
      setSelectedIssues(selectedIssues.filter((i) => i !== issue));
    } else {
      setSelectedIssues([...selectedIssues, issue]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmitReview({
      rating: overallRating,
      punctualityRating: punctuality,
      qualityRating: quality,
      behaviorRating: behavior,
      tags: selectedTags,
      issues: selectedIssues,
      comment,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-[#FFFFFF] rounded-xl p-6 sm:p-7 border border-[#D9D5CC] shadow-elevated space-y-6 max-w-lg mx-auto">
      <div className="text-center space-y-1 pb-4 border-b border-[#E2DDD3]">
        <span className="text-[10px] uppercase tracking-wider text-[#C58B2A] font-bold block">
          Worker Quality Evaluation • साथी कार्य समीक्षा
        </span>
        <h3 className="font-serif text-xl font-bold text-[#20242A]">{t('customer.reviewTitle')}</h3>
        <p className="text-xs text-[#636D79]">
          Reviewing verified service by <span className="font-bold text-[#24324A]">{workerName}</span>
        </p>

        {/* Big Star Selector */}
        <div className="flex justify-center space-x-2 pt-3">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              type="button"
              key={star}
              onClick={() => setOverallRating(star)}
              className="p-1 transition-transform hover:scale-110 focus:outline-none"
            >
              <Star
                className={`w-8 h-8 ${
                  star <= overallRating
                    ? 'fill-[#DF9F35] text-[#DF9F35]'
                    : 'text-[#D9D5CC]'
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Sub-ratings */}
      <div className="space-y-3 text-xs">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-[#20242A]">{t('customer.punctuality')}</span>
          <div className="flex space-x-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                type="button"
                key={s}
                onClick={() => setPunctuality(s)}
                className={`w-6 h-6 rounded-md text-xs font-bold transition-colors ${
                  s <= punctuality ? 'bg-[#24324A] text-[#DF9F35]' : 'bg-[#F7F4EE] text-[#636D79] border border-[#D9D5CC]'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="font-semibold text-[#20242A]">{t('customer.workQuality')}</span>
          <div className="flex space-x-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                type="button"
                key={s}
                onClick={() => setQuality(s)}
                className={`w-6 h-6 rounded-md text-xs font-bold transition-colors ${
                  s <= quality ? 'bg-[#24324A] text-[#DF9F35]' : 'bg-[#F7F4EE] text-[#636D79] border border-[#D9D5CC]'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="font-semibold text-[#20242A]">{t('customer.behavior')}</span>
          <div className="flex space-x-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                type="button"
                key={s}
                onClick={() => setBehavior(s)}
                className={`w-6 h-6 rounded-md text-xs font-bold transition-colors ${
                  s <= behavior ? 'bg-[#24324A] text-[#DF9F35]' : 'bg-[#F7F4EE] text-[#636D79] border border-[#D9D5CC]'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Positive Compliments / Tags */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-[#24324A] uppercase tracking-wider block">
          Compliments (Select any) • सकारात्मक प्रतिक्रिया
        </span>
        <div className="flex flex-wrap gap-2">
          {positiveTags.map((tag) => {
            const active = selectedTags.includes(tag);
            return (
              <button
                type="button"
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1 ${
                  active
                    ? 'bg-[#24324A] text-white shadow-xs'
                    : 'bg-[#F7F4EE] text-[#20242A] border border-[#D9D5CC] hover:bg-[#F2EFEB]'
                }`}
              >
                {active && <Check className="w-3 h-3 text-[#DF9F35]" />}
                <span>{tag}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Any Issues or Feedback */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-[#A65343] uppercase tracking-wider block">
          Report Any Issue (Optional) • कोई समस्या दर्ज करें
        </span>
        <div className="flex flex-wrap gap-2">
          {issueTags.map((issue) => {
            const active = selectedIssues.includes(issue);
            return (
              <button
                type="button"
                key={issue}
                onClick={() => toggleIssue(issue)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1 ${
                  active
                    ? 'bg-[#A65343] text-white shadow-xs'
                    : 'bg-white text-[#A65343] border border-[#A65343]/40 hover:bg-[#F7F4EE]'
                }`}
              >
                {active && <Check className="w-3 h-3 text-white" />}
                <span>{issue}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Comment */}
      <div>
        <textarea
          rows={2}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t('customer.feedbackPlaceholder')}
          className="w-full p-3.5 text-xs rounded-lg border border-[#D9D5CC] focus:outline-none focus:border-[#24324A] bg-[#F7F4EE] focus:bg-white resize-none text-[#20242A]"
        />
      </div>

      <button
        type="submit"
        className="w-full py-3 bg-[#24324A] hover:bg-[#162031] text-white font-semibold rounded-lg text-sm shadow-card transition-all flex items-center justify-center space-x-2"
      >
        <span>{t('customer.submitReviewBtn')}</span>
        <ArrowRight className="w-4 h-4 text-[#DF9F35]" />
      </button>
    </form>
  );
};
