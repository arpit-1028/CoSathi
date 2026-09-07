import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import {
  Settings,
  Building2,
  ShieldCheck,
  Globe,
  Sliders,
  CheckCircle2,
  Save,
  MapPin,
  Layers,
  Phone,
  Mail,
} from 'lucide-react';

export const CooperativeSettings = () => {
  const { language, setLanguage } = useLanguage();
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState('');

  const [societyInfo, setSocietyInfo] = useState({
    name: 'Delhi Shramik Kalyan Sahakari Samiti Ltd.',
    regNumber: 'DL-COOP-2026-9874',
    act: 'Delhi Cooperative Societies Act, 2003 / Rules 2007',
    registeredOffice: 'Plot 14, Institutional Area, Lodhi Road, New Delhi 110003',
    nodalOfficer: 'Sunita Sharma, Registrar Representative',
    contactEmail: 'admin@cosathi.demo',
    contactPhone: '011-24368901',
  });

  const [parameters, setParameters] = useState({
    welfareDeductionPct: 5,
    maxDailyJobsPerWorker: 4,
    fairnessDispersionTolerancePct: 15,
    defaultDispatchRadiusKm: 7,
    allowEmergencySurge: false,
  });

  const [zones, setZones] = useState([
    'South Delhi - Lajpat Nagar / Saket',
    'South Delhi - Hauz Khas / Malviya Nagar',
    'West Delhi - Janakpuri / Uttam Nagar',
    'West Delhi - Dwarka Sectors 1-23',
    'Central Delhi - Karol Bagh / Connaught Place',
    'East Delhi - Mayur Vihar / Preet Vihar',
  ]);

  const [newZone, setNewZone] = useState('');

  const handleAddZone = (e) => {
    e.preventDefault();
    if (newZone.trim() && !zones.includes(newZone.trim())) {
      setZones([...zones, newZone.trim()]);
      setNewZone('');
    }
  };

  const handleRemoveZone = (zoneToRemove) => {
    setZones(zones.filter((z) => z !== zoneToRemove));
  };

  const handleSave = (e) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSavedSuccess('Cooperative Society configuration updated and ratified successfully!');
      setTimeout(() => setSavedSuccess(''), 4000);
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-cosathi-border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <Settings className="w-4 h-4 text-cosathi-forest" />
            <span className="text-xs font-bold uppercase tracking-wider text-cosathi-forest">
              Society Governance & By-Laws
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-cosathi-slate">
            Cooperative Configuration & Operational Rules
          </h2>
          <p className="text-xs text-cosathi-muted">
            Configure statutory registration details, fair allocation parameters, and service territory zones.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-cosathi-forest hover:bg-cosathi-moss text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center space-x-2 self-start sm:self-auto"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{savedSuccess}</span>
        </div>
      )}

      {/* Language Preference Bar */}
      <div className="bg-white rounded-2xl p-4 border border-cosathi-border shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-cosathi-surface rounded-xl text-cosathi-forest">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-xs text-cosathi-slate">Admin Console Language</h4>
            <p className="text-[11px] text-cosathi-muted">Choose your preferred administrative language</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              language === 'en'
                ? 'bg-cosathi-forest text-white'
                : 'bg-cosathi-surface text-cosathi-slate border border-cosathi-border'
            }`}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => setLanguage('hi')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              language === 'hi'
                ? 'bg-cosathi-forest text-white'
                : 'bg-cosathi-surface text-cosathi-slate border border-cosathi-border'
            }`}
          >
            हिंदी
          </button>
        </div>
      </div>

      {/* Society Registration Card */}
      <div className="bg-white rounded-3xl p-6 border border-cosathi-border shadow-sm space-y-4">
        <div className="flex items-center space-x-2 pb-2 border-b border-cosathi-border">
          <Building2 className="w-4 h-4 text-cosathi-forest" />
          <h3 className="font-bold text-sm text-cosathi-slate">Legal Registration & Identification</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-cosathi-slate mb-1">Cooperative Society Name</label>
            <input
              type="text"
              value={societyInfo.name}
              onChange={(e) => setSocietyInfo({ ...societyInfo, name: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-cosathi-border bg-cosathi-surface text-xs font-medium"
            />
          </div>

          <div>
            <label className="block font-semibold text-cosathi-slate mb-1">State Registration Number</label>
            <input
              type="text"
              value={societyInfo.regNumber}
              onChange={(e) => setSocietyInfo({ ...societyInfo, regNumber: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-cosathi-border bg-cosathi-surface text-xs font-mono font-bold text-cosathi-forest"
            />
          </div>

          <div>
            <label className="block font-semibold text-cosathi-slate mb-1">Governing Act</label>
            <input
              type="text"
              value={societyInfo.act}
              onChange={(e) => setSocietyInfo({ ...societyInfo, act: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-cosathi-border bg-cosathi-surface text-xs"
            />
          </div>

          <div>
            <label className="block font-semibold text-cosathi-slate mb-1">Nodal Oversight Officer</label>
            <input
              type="text"
              value={societyInfo.nodalOfficer}
              onChange={(e) => setSocietyInfo({ ...societyInfo, nodalOfficer: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-cosathi-border bg-cosathi-surface text-xs"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block font-semibold text-cosathi-slate mb-1">Registered Office Address</label>
            <input
              type="text"
              value={societyInfo.registeredOffice}
              onChange={(e) => setSocietyInfo({ ...societyInfo, registeredOffice: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-cosathi-border bg-cosathi-surface text-xs"
            />
          </div>
        </div>
      </div>

      {/* Fairness & Algorithm Policy Rules */}
      <div className="bg-white rounded-3xl p-6 border border-cosathi-border shadow-sm space-y-4">
        <div className="flex items-center space-x-2 pb-2 border-b border-cosathi-border">
          <Sliders className="w-4 h-4 text-cosathi-forest" />
          <h3 className="font-bold text-sm text-cosathi-slate">Algorithmic Fairness & Labor Standards</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-2xl border border-cosathi-border bg-cosathi-surface/40 space-y-2">
            <label className="block font-semibold text-cosathi-slate">
              Social Security Welfare Pool Levy
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min="3"
                max="10"
                value={parameters.welfareDeductionPct}
                onChange={(e) =>
                  setParameters({ ...parameters, welfareDeductionPct: Number(e.target.value) })
                }
                className="w-20 px-3 py-2 rounded-xl border border-cosathi-border bg-white text-xs font-bold text-cosathi-forest"
              />
              <span className="font-bold text-cosathi-slate">% of gross job bill</span>
            </div>
            <p className="text-[10px] text-cosathi-muted">
              Statutory reserve for PMSBY insurance and worker emergency grants.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl border border-cosathi-border bg-cosathi-surface/40 space-y-2">
            <label className="block font-semibold text-cosathi-slate">
              Max Daily Jobs per Worker (Anti-Fatigue)
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min="2"
                max="8"
                value={parameters.maxDailyJobsPerWorker}
                onChange={(e) =>
                  setParameters({ ...parameters, maxDailyJobsPerWorker: Number(e.target.value) })
                }
                className="w-20 px-3 py-2 rounded-xl border border-cosathi-border bg-white text-xs font-bold text-cosathi-slate"
              />
              <span className="font-bold text-cosathi-slate">jobs / day</span>
            </div>
            <p className="text-[10px] text-cosathi-muted">
              Prevents worker exhaustion and ensures quality of workmanship.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl border border-cosathi-border bg-cosathi-surface/40 space-y-2">
            <label className="block font-semibold text-cosathi-slate">
              Dispatch Geofence Radius
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min="3"
                max="25"
                value={parameters.defaultDispatchRadiusKm}
                onChange={(e) =>
                  setParameters({ ...parameters, defaultDispatchRadiusKm: Number(e.target.value) })
                }
                className="w-20 px-3 py-2 rounded-xl border border-cosathi-border bg-white text-xs font-bold text-cosathi-slate"
              />
              <span className="font-bold text-cosathi-slate">km radius</span>
            </div>
            <p className="text-[10px] text-cosathi-muted">
              Prevents unpaid worker transit strain across city zones.
            </p>
          </div>
        </div>
      </div>

      {/* Service Zones Territory */}
      <div className="bg-white rounded-3xl p-6 border border-cosathi-border shadow-sm space-y-4">
        <div className="flex items-center space-x-2 pb-2 border-b border-cosathi-border">
          <MapPin className="w-4 h-4 text-cosathi-clay" />
          <h3 className="font-bold text-sm text-cosathi-slate">Authorized Operating Zones</h3>
        </div>

        <div className="flex flex-wrap gap-2">
          {zones.map((zone, idx) => (
            <span
              key={idx}
              className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-cosathi-surface border border-cosathi-border text-xs font-semibold text-cosathi-slate"
            >
              <span>{zone}</span>
              <button
                type="button"
                onClick={() => handleRemoveZone(zone)}
                className="text-cosathi-muted hover:text-rose-600 font-bold ml-1 text-sm"
              >
                ×
              </button>
            </span>
          ))}
        </div>

        <form onSubmit={handleAddZone} className="flex items-center space-x-2 pt-2">
          <input
            type="text"
            placeholder="Add new operating zone (e.g. North Delhi - Rohini Sector 9)..."
            value={newZone}
            onChange={(e) => setNewZone(e.target.value)}
            className="flex-1 px-3 py-2 text-xs rounded-xl border border-cosathi-border bg-cosathi-surface focus:border-cosathi-forest"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-cosathi-forest hover:bg-cosathi-moss text-white font-bold text-xs transition-all shadow-xs"
          >
            Add Zone
          </button>
        </form>
      </div>
    </div>
  );
};
