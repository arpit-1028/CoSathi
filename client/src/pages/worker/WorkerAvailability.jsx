import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import {
  Calendar,
  Clock,
  ShieldAlert,
  CheckCircle2,
  Scale,
  Save,
} from 'lucide-react';

export const WorkerAvailability = () => {
  const { t } = useLanguage();
  const [savedSuccess, setSavedSuccess] = useState(false);

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const [schedule, setSchedule] = useState({
    Monday: { morning: true, afternoon: true, evening: false },
    Tuesday: { morning: true, afternoon: true, evening: false },
    Wednesday: { morning: true, afternoon: true, evening: true },
    Thursday: { morning: true, afternoon: true, evening: false },
    Friday: { morning: true, afternoon: true, evening: true },
    Saturday: { morning: true, afternoon: true, evening: false },
    Sunday: { morning: false, afternoon: false, evening: false },
  });

  const toggleSlot = (day, slot) => {
    setSchedule({
      ...schedule,
      [day]: {
        ...schedule[day],
        [slot]: !schedule[day][slot],
      },
    });
    setSavedSuccess(false);
  };

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-12">
      <div className="bg-white rounded-3xl p-6 border border-cosathi-border shadow-sm space-y-2">
        <div className="flex items-center space-x-2 text-xs font-bold text-cosathi-forest uppercase tracking-wider">
          <Clock className="w-4 h-4 text-cosathi-ochre" />
          <span>{t('worker.availabilityTitle')}</span>
        </div>
        <h2 className="text-xl font-bold text-cosathi-slate">
          {t('worker.availabilitySubtitle')}
        </h2>
      </div>

      {/* No Offline Policy Alert */}
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start space-x-3">
        <ShieldAlert className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block">Strict Platform Policy:</span>
          <p className="text-[11px] text-amber-800 leading-relaxed mt-0.5">
            {t('worker.noOfflinePolicy')}
          </p>
        </div>
      </div>

      {/* Weekly Schedule Matrix */}
      <div className="bg-white rounded-3xl p-6 border border-cosathi-border shadow-sm space-y-4">
        <div className="divide-y divide-cosathi-border">
          {daysOfWeek.map((day) => {
            const daySlots = schedule[day];
            return (
              <div key={day} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-bold text-cosathi-slate w-24">{day}</span>
                <div className="grid grid-cols-3 gap-2 flex-1">
                  <button
                    type="button"
                    onClick={() => toggleSlot(day, 'morning')}
                    className={`py-1.5 px-2 rounded-xl text-[11px] font-semibold border transition-all ${
                      daySlots.morning
                        ? 'bg-cosathi-forest text-white border-cosathi-forest shadow-xs'
                        : 'bg-cosathi-surface text-cosathi-muted border-cosathi-border hover:text-cosathi-slate'
                    }`}
                  >
                    Morning (8-12)
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleSlot(day, 'afternoon')}
                    className={`py-1.5 px-2 rounded-xl text-[11px] font-semibold border transition-all ${
                      daySlots.afternoon
                        ? 'bg-cosathi-clay text-white border-cosathi-clay shadow-xs'
                        : 'bg-cosathi-surface text-cosathi-muted border-cosathi-border hover:text-cosathi-slate'
                    }`}
                  >
                    Afternoon (12-4)
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleSlot(day, 'evening')}
                    className={`py-1.5 px-2 rounded-xl text-[11px] font-semibold border transition-all ${
                      daySlots.evening
                        ? 'bg-cosathi-ochre text-white border-cosathi-ochre shadow-xs'
                        : 'bg-cosathi-surface text-cosathi-muted border-cosathi-border hover:text-cosathi-slate'
                    }`}
                  >
                    Evening (4-8)
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {savedSuccess && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs text-center flex items-center justify-center space-x-1.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Availability schedule updated successfully!</span>
          </div>
        )}

        <button
          onClick={handleSave}
          className="w-full py-3 bg-cosathi-forest hover:bg-cosathi-forest-dark text-white font-bold rounded-xl text-sm shadow-md transition-all flex items-center justify-center space-x-2"
        >
          <Save className="w-4 h-4" />
          <span>{t('worker.saveSchedule')}</span>
        </button>
      </div>
    </div>
  );
};
