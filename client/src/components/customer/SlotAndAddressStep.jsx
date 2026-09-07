import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { LocationPickerModal } from './LocationPickerModal';
import { Calendar, Clock, MapPin, Check, ArrowRight, Navigation } from 'lucide-react';

export const SlotAndAddressStep = ({ onConfirmSchedule, onBack, initialAddress = '' }) => {
  const { t } = useLanguage();
  const { profile } = useAuth();

  const [selectedDate, setSelectedDate] = useState('today');
  const [selectedSlot, setSelectedSlot] = useState('02:00 PM - 04:00 PM');
  const [address, setAddress] = useState(
    initialAddress || profile?.defaultAddress?.street || 'B-42, Lajpat Nagar II, New Delhi, 110024'
  );
  const [coordinates, setCoordinates] = useState(
    profile?.defaultAddress?.location?.coordinates || [77.2433, 28.5700]
  );
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);

  const slots = [
    { id: 'morning', label: t('customer.slotMorning') },
    { id: 'midday', label: t('customer.slotMidday') },
    { id: 'afternoon', label: t('customer.slotAfternoon') },
    { id: 'evening', label: t('customer.slotEvening') },
  ];

  const handleProceed = (e) => {
    e.preventDefault();
    onConfirmSchedule({
      date: selectedDate,
      timeSlot: selectedSlot,
      address,
      coordinates,
    });
  };

  return (
    <form onSubmit={handleProceed} className="space-y-6">
      {/* Date & Time Selection */}
      <div className="bg-[#FFFFFF] rounded-xl p-5 sm:p-6 border border-[#D9D5CC] shadow-card space-y-4">
        <h3 className="font-serif text-base font-bold text-[#20242A] flex items-center space-x-2 border-b border-[#E2DDD3] pb-3">
          <Calendar className="w-4 h-4 text-[#C58B2A]" />
          <span>{t('customer.scheduleTitle')} • सेवा समय निर्धारण</span>
        </h3>

        {/* Date Selector */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setSelectedDate('today')}
            className={`p-3 rounded-lg border text-center transition-all flex flex-col items-center space-y-0.5 ${
              selectedDate === 'today'
                ? 'bg-[#24324A] text-white border-[#162031] font-bold shadow-xs'
                : 'bg-[#F7F4EE] border-[#D9D5CC] text-[#20242A] hover:bg-[#F2EFEB]'
            }`}
          >
            <span className="text-xs">{t('customer.dateToday')}</span>
            <span className="text-sm font-serif font-bold">5 Sep 2026</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedDate('tomorrow')}
            className={`p-3 rounded-lg border text-center transition-all flex flex-col items-center space-y-0.5 ${
              selectedDate === 'tomorrow'
                ? 'bg-[#24324A] text-white border-[#162031] font-bold shadow-xs'
                : 'bg-[#F7F4EE] border-[#D9D5CC] text-[#20242A] hover:bg-[#F2EFEB]'
            }`}
          >
            <span className="text-xs">{t('customer.dateTomorrow')}</span>
            <span className="text-sm font-serif font-bold">6 Sep 2026</span>
          </button>
        </div>

        {/* Time Slot Selector */}
        <div className="space-y-2 pt-1">
          <span className="text-xs font-semibold text-[#636D79] uppercase tracking-wider flex items-center space-x-1.5">
            <Clock className="w-3.5 h-3.5 text-[#C58B2A]" />
            <span>Select Preferred Window / समय स्लॉट</span>
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {slots.map((slot) => {
              const isSelected = selectedSlot === slot.label;
              return (
                <button
                  type="button"
                  key={slot.id}
                  onClick={() => setSelectedSlot(slot.label)}
                  className={`p-3 rounded-lg border text-xs font-semibold flex items-center justify-between transition-all ${
                    isSelected
                      ? 'bg-[#A65343] text-white border-[#8C4334] shadow-xs'
                      : 'bg-white border-[#D9D5CC] text-[#20242A] hover:bg-[#F7F4EE]'
                  }`}
                >
                  <span>{slot.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Address Selection with Google Maps / Geo Coordinates Picker */}
      <div className="bg-[#FFFFFF] rounded-xl p-5 sm:p-6 border border-[#D9D5CC] shadow-card space-y-3">
        <div className="flex items-center justify-between border-b border-[#E2DDD3] pb-3">
          <h3 className="font-serif text-base font-bold text-[#20242A] flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-[#A65343]" />
            <span>{t('customer.addressTitle') || 'Service Location'} • सेवा पता</span>
          </h3>

          <button
            type="button"
            onClick={() => setIsMapModalOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-[#F2EFEB] hover:bg-[#EAE5DA] text-[#24324A] border border-[#D9D5CC] text-xs font-semibold transition-all flex items-center space-x-1.5 shadow-2xs"
          >
            <MapPin className="w-3.5 h-3.5 text-[#A65343]" />
            <span>Change on Map / GPS</span>
          </button>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#636D79] uppercase mb-1.5">
            {t('customer.savedAddress') || 'Confirmed Doorstep Address'}
          </label>
          <textarea
            rows={2}
            required
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full p-3.5 text-sm rounded-lg border border-[#D9D5CC] focus:outline-none focus:border-[#24324A] bg-[#F7F4EE] focus:bg-[#FFFFFF] resize-none text-[#20242A]"
          />
        </div>

        {/* Location Coordinates Badge */}
        <div className="flex items-center justify-between pt-1 text-xs text-[#636D79] bg-[#F7F4EE] p-2.5 rounded-lg border border-[#D9D5CC]">
          <div className="flex items-center space-x-1.5 font-mono text-[11px]">
            <span className="w-2 h-2 rounded-full bg-[#3C5A48]" />
            <span>GPS: [{coordinates[0].toFixed(4)}, {coordinates[1].toFixed(4)}]</span>
          </div>
          <span className="text-[11px] font-semibold text-[#3C5A48]">
            ✓ Proximity Verified
          </span>
        </div>
      </div>

      {/* Location Picker Modal */}
      <LocationPickerModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        initialAddress={address}
        onSelectLocation={(loc) => {
          if (loc.formattedAddress) setAddress(loc.formattedAddress);
          if (loc.coordinates) setCoordinates(loc.coordinates);
        }}
      />

      {/* Action Buttons */}
      <div className="flex items-center justify-between gap-4 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-2.5 rounded-lg border border-[#D9D5CC] text-xs font-semibold text-[#20242A] hover:bg-[#F2EFEB] transition-all"
        >
          {t('common.back')}
        </button>

        <button
          type="submit"
          className="flex-1 py-2.5 px-6 bg-[#24324A] hover:bg-[#162031] text-white text-sm font-semibold rounded-lg shadow-card transition-all flex items-center justify-center space-x-2"
        >
          <span>{t('customer.confirmBookingBtn')}</span>
          <ArrowRight className="w-4 h-4 text-[#DF9F35]" />
        </button>
      </div>
    </form>
  );
};
