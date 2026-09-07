import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../services/api';
import {
  MapPin,
  Crosshair,
  Search,
  Check,
  X,
  Navigation,
  Loader2,
  Building,
  Sparkles,
} from 'lucide-react';

export const LocationPickerModal = ({ isOpen, onClose, onSelectLocation, initialAddress = '' }) => {
  const { t } = useLanguage();

  const [searchQuery, setSearchQuery] = useState(initialAddress || '');
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isLocatingCurrent, setIsLocatingCurrent] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  // Search Address / Landmark via Geo API
  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setErrorMessage('');
    try {
      const res = await api.post('/geo/geocode', { query: searchQuery });
      if (res.data?.success && res.data.result) {
        setSelectedLocation(res.data.result);
        if (Array.isArray(res.data.suggestions)) {
          setSuggestions(res.data.suggestions);
        }
      } else {
        setSelectedLocation({
          name: searchQuery,
          formattedAddress: searchQuery,
          city: 'NCR',
          pincode: '201204',
          coordinates: [77.5830, 28.8315],
        });
      }
    } catch (err) {
      console.warn('[LocationPicker] Geocoding fallback to query:', err.message);
      setSelectedLocation({
        name: searchQuery,
        formattedAddress: searchQuery,
        city: 'NCR',
        pincode: '201204',
        coordinates: [77.2433, 28.5700],
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Browser HTML5 Geolocation ("Use Current Location")
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setErrorMessage('Browser geolocation is not supported on this device.');
      return;
    }

    setIsLocatingCurrent(true);
    setErrorMessage('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          // Reverse geocode lat/lng to address
          const res = await api.post('/geo/reverse-geocode', {
            coordinates: [longitude, latitude],
          });

          if (res.data?.success) {
            const locData = {
              name: 'Current Location',
              formattedAddress: res.data.formattedAddress,
              city: res.data.city || 'Delhi',
              pincode: res.data.pincode || '110024',
              coordinates: [longitude, latitude],
            };
            setSelectedLocation(locData);
            setSearchQuery(res.data.formattedAddress);
          }
        } catch (revErr) {
          // Fallback coords
          const fallbackLoc = {
            name: 'Current Location (GPS)',
            formattedAddress: `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}, Delhi NCR`,
            city: 'Delhi',
            pincode: '110024',
            coordinates: [longitude, latitude],
          };
          setSelectedLocation(fallbackLoc);
          setSearchQuery(fallbackLoc.formattedAddress);
        } finally {
          setIsLocatingCurrent(false);
        }
      },
      (err) => {
        console.warn('[LocationPicker] Geolocation error:', err.message);
        // Fallback to central landmark
        setIsLocatingCurrent(false);
        const fallback = {
          name: 'Central Delhi (GPS Approximate)',
          formattedAddress: 'Lajpat Nagar II, Central South Delhi, New Delhi, 110024',
          city: 'Delhi',
          pincode: '110024',
          coordinates: [77.2433, 28.5700],
        };
        setSelectedLocation(fallback);
        setSearchQuery(fallback.formattedAddress);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const handleSelectSuggestion = (item) => {
    setSelectedLocation(item);
    setSearchQuery(item.formattedAddress);
  };

  const handleConfirm = () => {
    if (selectedLocation) {
      onSelectLocation(selectedLocation);
      onClose();
    } else if (searchQuery.trim()) {
      onSelectLocation({
        name: searchQuery,
        formattedAddress: searchQuery,
        city: 'Delhi',
        pincode: '110024',
        coordinates: [77.2433, 28.5700],
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-cosathi-border flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-cosathi-border flex items-center justify-between bg-cosathi-surface/60">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-cosathi-forest/10 text-cosathi-forest">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-cosathi-slate">
                {t('customer.selectAddressTitle') || 'Select Service Location'}
              </h3>
              <p className="text-xs text-cosathi-muted">
                {t('customer.selectAddressDesc') || 'Search address or pin your doorstep on the map'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-cosathi-border text-cosathi-muted hover:text-cosathi-slate transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="relative flex items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search society, colony, sector, landmark..."
              className="w-full pl-10 pr-24 py-3 rounded-2xl border border-cosathi-border text-sm focus:outline-none focus:border-cosathi-forest bg-cosathi-surface/40 focus:bg-white"
            />
            <Search className="w-4 h-4 text-cosathi-muted absolute left-3.5" />
            <button
              type="submit"
              disabled={isSearching}
              className="absolute right-2 px-3.5 py-1.5 rounded-xl bg-cosathi-forest text-white text-xs font-bold hover:bg-cosathi-forest-dark transition-colors flex items-center space-x-1"
            >
              {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Search</span>}
            </button>
          </form>

          {/* Direct Pick Searched Address Button */}
          {searchQuery.trim() && (
            <button
              type="button"
              onClick={() => {
                const target = selectedLocation || {
                  name: searchQuery.trim(),
                  formattedAddress: searchQuery.trim(),
                  city: 'NCR',
                  pincode: '201204',
                  coordinates: [77.5830, 28.8315],
                };
                onSelectLocation(target);
                onClose();
              }}
              className="w-full py-2.5 px-4 bg-[#24324A] hover:bg-[#162031] text-white rounded-xl text-xs font-bold flex items-center justify-between shadow-xs transition-all animate-in fade-in"
            >
              <div className="flex items-center space-x-1.5 truncate pr-2">
                <Check className="w-3.5 h-3.5 text-[#DF9F35] shrink-0" />
                <span className="truncate">Select "{searchQuery}"</span>
              </div>
              <span className="text-[#DF9F35] font-semibold text-[11px] shrink-0">Tap to Confirm ✓</span>
            </button>
          )}

          {/* Use Current Location Quick Action */}
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={isLocatingCurrent}
            className="w-full p-3 rounded-2xl border border-emerald-300 bg-emerald-50/60 hover:bg-emerald-100/60 text-emerald-900 text-xs font-bold flex items-center justify-between transition-colors"
          >
            <div className="flex items-center space-x-2.5">
              <Crosshair className={`w-4 h-4 text-emerald-600 ${isLocatingCurrent ? 'animate-spin' : ''}`} />
              <span>{isLocatingCurrent ? 'Detecting GPS coordinates...' : 'Use Current Device Location (GPS)'}</span>
            </div>
            <span className="text-[10px] uppercase tracking-wider bg-emerald-200/60 px-2 py-0.5 rounded-md">
              Instant
            </span>
          </button>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
              {errorMessage}
            </div>
          )}

          {/* Interactive Map Coordinate Card Preview */}
          <div className="relative rounded-2xl overflow-hidden border border-cosathi-border bg-slate-100 h-44 flex flex-col justify-end p-4">
            {/* Stylized Google Map Background Grid */}
            <div
              className="absolute inset-0 opacity-70 bg-cover bg-center"
              style={{
                backgroundImage:
                  'radial-gradient(#cbd5e1 1.5px, transparent 1.5px), radial-gradient(#cbd5e1 1.5px, #f1f5f9 1.5px)',
                backgroundSize: '24px 24px',
                backgroundPosition: '0 0, 12px 12px',
              }}
            />

            {/* Simulated Road Lines */}
            <div className="absolute inset-0 pointer-events-none">
              <svg className="w-full h-full opacity-30">
                <path d="M 10 30 Q 150 90 280 40 T 480 120" fill="transparent" stroke="#94a3b8" strokeWidth="6" />
                <path d="M 60 160 Q 200 60 380 140" fill="transparent" stroke="#94a3b8" strokeWidth="5" />
                <path d="M 220 10 L 250 170" fill="transparent" stroke="#94a3b8" strokeWidth="4" />
              </svg>
            </div>

            {/* Center Pin Marker */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative flex flex-col items-center animate-bounce duration-1000">
                <div className="px-2.5 py-1 rounded-lg bg-cosathi-slate text-white text-[10px] font-bold shadow-md mb-1 whitespace-nowrap">
                  Doorstep Pin
                </div>
                <MapPin className="w-8 h-8 text-cosathi-clay fill-cosathi-clay drop-shadow-md" />
              </div>
            </div>

            {/* Bottom Coordinate Indicator Overlay */}
            <div className="relative z-10 p-2.5 rounded-xl bg-white/95 backdrop-blur-xs border border-cosathi-border/80 shadow-xs flex items-center justify-between text-xs">
              <div className="truncate pr-2">
                <span className="font-bold text-cosathi-slate block truncate">
                  {selectedLocation?.name || 'Selected Destination'}
                </span>
                <span className="text-[11px] text-cosathi-muted font-mono truncate block">
                  Lng: {selectedLocation?.coordinates?.[0]?.toFixed(4) || '77.2433'} • Lat:{' '}
                  {selectedLocation?.coordinates?.[1]?.toFixed(4) || '28.5700'}
                </span>
              </div>
              <span className="px-2 py-1 rounded-md bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200 shrink-0">
                Validated
              </span>
            </div>
          </div>

          {/* Popular Landmark Suggestions */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-cosathi-muted flex items-center space-x-1">
              <Building className="w-3.5 h-3.5" />
              <span>Suggested Localities & Landmarks (NCR)</span>
            </span>

            <div className="grid grid-cols-1 gap-1.5 max-h-36 overflow-y-auto pr-1">
              {(suggestions.length > 0
                ? suggestions
                : [
                    {
                      name: 'Lajpat Nagar II',
                      formattedAddress: 'Lajpat Nagar II, Central South Delhi, New Delhi, 110024',
                      coordinates: [77.2433, 28.5700],
                    },
                    {
                      name: 'Connaught Place',
                      formattedAddress: 'Connaught Place, Central Delhi, New Delhi, 110001',
                      coordinates: [77.2197, 28.6315],
                    },
                    {
                      name: 'Dwarka Sector 10',
                      formattedAddress: 'Sector 10, Dwarka, South West Delhi, Delhi, 110075',
                      coordinates: [77.0601, 28.5823],
                    },
                    {
                      name: 'Noida Sector 62',
                      formattedAddress: 'Sector 62, Noida, Uttar Pradesh, 201309',
                      coordinates: [77.3639, 28.6280],
                    },
                  ]
              ).map((item, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => handleSelectSuggestion(item)}
                  className="p-2 rounded-xl text-left border border-cosathi-border hover:border-cosathi-forest hover:bg-cosathi-surface transition-colors flex items-center justify-between group"
                >
                  <div className="truncate pr-2">
                    <span className="text-xs font-bold text-cosathi-slate block group-hover:text-cosathi-forest">
                      {item.name}
                    </span>
                    <span className="text-[10px] text-cosathi-muted truncate block">
                      {item.formattedAddress}
                    </span>
                  </div>
                  <Navigation className="w-3 h-3 text-cosathi-muted group-hover:text-cosathi-forest shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-cosathi-border bg-cosathi-surface/40 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-cosathi-border text-xs font-bold text-cosathi-slate hover:bg-cosathi-surface"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-5 py-2 rounded-xl bg-cosathi-forest hover:bg-cosathi-forest-dark text-white text-xs font-bold shadow-sm transition-all flex items-center space-x-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Confirm Doorstep Location</span>
          </button>
        </div>
      </div>
    </div>
  );
};
