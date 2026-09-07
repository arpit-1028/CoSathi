import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { LocationPickerModal } from './LocationPickerModal';
import { Calendar, Clock, MapPin, Check, ArrowRight, Navigation } from 'lucide-react';

export const SlotAndAddressStep = ({ onConfirmSchedule, onBack, initialAddress = '' }) => {
  const { t } = useLanguage();
  const { profile } = useAuth();

  const now = new Date();
  const todayFormatted = now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const tomorrowDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const tomorrowFormatted = tomorrowDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const todayISO = now.toISOString().split('T')[0];

  const [dateSelectionType, setDateSelectionType] = useState('today');
  const [customDate, setCustomDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('02:00 PM - 04:00 PM');
  const [mapArea, setMapArea] = useState(
    initialAddress || profile?.defaultAddress?.street || 'Lajpat Nagar II, New Delhi, 110024'
  );
  const [houseNo, setHouseNo] = useState('');
  const [streetLandmark, setStreetLandmark] = useState('');
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

  const getSelectedDateString = () => {
    if (dateSelectionType === 'today') return `Today (${todayFormatted})`;
    if (dateSelectionType === 'tomorrow') return `Tomorrow (${tomorrowFormatted})`;
    if (dateSelectionType === 'custom' && customDate) {
      const d = new Date(customDate);
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    return `Today (${todayFormatted})`;
  };

  const getCombinedAddress = () => {
    const parts = [];
    if (houseNo.trim()) parts.push(houseNo.trim());
    if (streetLandmark.trim()) parts.push(streetLandmark.trim());
    if (mapArea.trim()) parts.push(mapArea.trim());
    return parts.join(', ');
  };

  const handleProceed = (e) => {
    e.preventDefault();
    const finalAddress = getCombinedAddress();
    onConfirmSchedule({
      date: getSelectedDateString(),
      timeSlot: selectedSlot,
      address: finalAddress,
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

        {/* Dynamic Date Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={() => setDateSelectionType('today')}
            className={`p-3 rounded-lg border text-center transition-all flex flex-col items-center space-y-0.5 ${
              dateSelectionType === 'today'
                ? 'bg-[#24324A] text-white border-[#162031] font-bold shadow-xs'
                : 'bg-[#F7F4EE] border-[#D9D5CC] text-[#20242A] hover:bg-[#F2EFEB]'
            }`}
          >
            <span className="text-xs">{t('customer.dateToday')}</span>
            <span className="text-sm font-serif font-bold">{todayFormatted}</span>
          </button>

          <button
            type="button"
            onClick={() => setDateSelectionType('tomorrow')}
            className={`p-3 rounded-lg border text-center transition-all flex flex-col items-center space-y-0.5 ${
              dateSelectionType === 'tomorrow'
                ? 'bg-[#24324A] text-white border-[#162031] font-bold shadow-xs'
                : 'bg-[#F7F4EE] border-[#D9D5CC] text-[#20242A] hover:bg-[#F2EFEB]'
            }`}
          >
            <span className="text-xs">{t('customer.dateTomorrow')}</span>
            <span className="text-sm font-serif font-bold">{tomorrowFormatted}</span>
          </button>

          <div
            onClick={() => setDateSelectionType('custom')}
            className={`p-2.5 rounded-lg border text-center transition-all flex flex-col justify-center cursor-pointer ${
              dateSelectionType === 'custom'
                ? 'bg-[#24324A] text-white border-[#162031] font-bold shadow-xs'
                : 'bg-[#F7F4EE] border-[#D9D5CC] text-[#20242A] hover:bg-[#F2EFEB]'
            }`}
          >
            <span className="text-xs mb-1">Pick Date (अन्य तारीख)</span>
            <input
              type="date"
              min={todayISO}
              value={customDate}
              onChange={(e) => {
                setCustomDate(e.target.value);
                setDateSelectionType('custom');
              }}
              className="text-xs p-1 rounded border border-[#D9D5CC] text-[#20242A] bg-white w-full"
            />
          </div>
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

      {/* Address Selection with Google Maps / Detailed Address Fields */}
      <div className="bg-[#FFFFFF] rounded-xl p-5 sm:p-6 border border-[#D9D5CC] shadow-card space-y-4">
        <div className="flex items-center justify-between border-b border-[#E2DDD3] pb-3">
          <div>
            <h3 className="font-serif text-base font-bold text-[#20242A] flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-[#A65343]" />
              <span>Service Address • सेवा का सटीक पता</span>
            </h3>
            <p className="text-xs text-[#636D79] mt-0.5">Google Maps location & your detailed doorstep address</p>
          </div>

          <button
            type="button"
            onClick={() => setIsMapModalOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-[#24324A] hover:bg-[#162031] text-white text-xs font-semibold transition-all flex items-center space-x-1.5 shadow-2xs"
          >
            <Navigation className="w-3.5 h-3.5 text-[#DF9F35]" />
            <span>Choose on Map / GPS</span>
          </button>
        </div>

        {/* 1. Directly Editable Area, Locality or City */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-bold text-[#20242A] uppercase">
              Area, Locality or City (क्षेत्र / इलाका) <span className="text-[#A65343]">*</span>
            </label>
            <button
              type="button"
              onClick={() => setIsMapModalOpen(true)}
              className="text-[11px] font-bold text-[#A65343] hover:underline flex items-center space-x-1"
            >
              <Navigation className="w-3 h-3 text-[#A65343]" />
              <span>Pick on Map / GPS</span>
            </button>
          </div>
          <input
            type="text"
            required
            placeholder="e.g. Modinagar, Ghaziabad or Lajpat Nagar, Delhi"
            value={mapArea}
            onChange={(e) => setMapArea(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-[#D9D5CC] focus:outline-none focus:border-[#24324A] bg-white text-[#20242A]"
          />
          <div className="flex items-center space-x-1.5 pt-1.5 font-mono text-[10px] text-[#3C5A48]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3C5A48]" />
            <span>GPS: [{coordinates[0].toFixed(4)}, {coordinates[1].toFixed(4)}] • Verified Coordinates</span>
          </div>
        </div>

        {/* 2. House / Flat / Floor No. & Building Name */}
        <div>
          <label className="block text-xs font-bold text-[#20242A] uppercase mb-1">
            House / Flat No. & Building Name <span className="text-[#A65343]">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Flat 302, Tower B, Sunrise Apartments"
            value={houseNo}
            onChange={(e) => setHouseNo(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-[#D9D5CC] focus:outline-none focus:border-[#24324A] bg-white text-[#20242A]"
          />
        </div>

        {/* 3. Street / Lane / Landmark */}
        <div>
          <label className="block text-xs font-bold text-[#20242A] uppercase mb-1">
            Street, Lane or Landmark (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g. Near Community Hall, Main Market Road, Lane 4"
            value={streetLandmark}
            onChange={(e) => setStreetLandmark(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-[#D9D5CC] focus:outline-none focus:border-[#24324A] bg-white text-[#20242A]"
          />
        </div>

        {/* 4. Complete Address Preview */}
        <div className="p-2.5 rounded-lg bg-[#F2EFEB] border border-[#E2DDD3] text-xs text-[#20242A]">
          <span className="font-bold text-[#636D79] block text-[10px] uppercase mb-0.5">Worker will navigate to:</span>
          <span className="font-serif text-[#162031] font-semibold">{getCombinedAddress()}</span>
        </div>
      </div>

      {/* Location Picker Modal */}
      <LocationPickerModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        initialAddress={mapArea}
        onSelectLocation={(loc) => {
          if (loc.formattedAddress) setMapArea(loc.formattedAddress);
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
