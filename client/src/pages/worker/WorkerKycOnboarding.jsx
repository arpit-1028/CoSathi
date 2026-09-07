import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldCheck,
  Camera,
  Video,
  FileText,
  Building2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  User,
  Wrench,
  Upload,
} from 'lucide-react';

export const WorkerKycOnboarding = () => {
  const { t } = useLanguage();
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1: Skills, 2: Gov ID, 3: Face Capture, 4: Intro Video, 5: Cooperative, 6: Status View

  // Form State
  const [primarySkill, setPrimarySkill] = useState('electrical');
  const [additionalSkills, setAdditionalSkills] = useState(['plumbing']);
  const [experienceYears, setExperienceYears] = useState(5);
  const [idDocName, setIdDocName] = useState('aadhaar_front_back_scan.pdf');
  const [faceImage, setFaceImage] = useState(null);
  const [isCapturingFace, setIsCapturingFace] = useState(false);
  const [introVideoDuration, setIntroVideoDuration] = useState(0);
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [videoRecorded, setVideoRecorded] = useState(false);
  const [selectedCoop, setSelectedCoop] = useState('Delhi Shramik Kalyan Sahakari Samiti Ltd.');

  // Verification State: PENDING | PROVISIONAL | VERIFIED | SUSPENDED
  const [verificationState, setVerificationState] = useState('PROVISIONAL');

  const skillsOptions = [
    { value: 'electrical', label: 'Electrical Works' },
    { value: 'plumbing', label: 'Plumbing Services' },
    { value: 'appliance-repair', label: 'Appliance Repair' },
    { value: 'carpentry', label: 'Carpentry & Woodwork' },
    { value: 'cleaning', label: 'Home Sanitization & Cleaning' },
    { value: 'domestic-help', label: 'Domestic Household Help' },
    { value: 'painting', label: 'Painting & Waterproofing' },
    { value: 'driver', label: 'Driver Services' },
    { value: 'gardening', label: 'Gardening & Horticulture' },
    { value: 'caregiver', label: 'Caregiver Services' },
  ];

  const toggleAdditionalSkill = (skillVal) => {
    if (additionalSkills.includes(skillVal)) {
      setAdditionalSkills(additionalSkills.filter((s) => s !== skillVal));
    } else {
      setAdditionalSkills([...additionalSkills, skillVal]);
    }
  };

  // Face Capture Simulation
  const handleCaptureFace = () => {
    setIsCapturingFace(true);
    setTimeout(() => {
      setFaceImage('captured_face_avatar_2026.png');
      setIsCapturingFace(false);
    }, 1200);
  };

  // Video Recording Simulation
  const handleStartVideo = () => {
    setIsRecordingVideo(true);
    setIntroVideoDuration(0);
    const interval = setInterval(() => {
      setIntroVideoDuration((prev) => {
        if (prev >= 15) {
          clearInterval(interval);
          setIsRecordingVideo(false);
          setVideoRecorded(true);
          return 15;
        }
        return prev + 1;
      });
    }, 500);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-cosathi-border shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-cosathi-border">
          <div className="space-y-0.5">
            <span className="text-xs font-bold uppercase tracking-wider text-cosathi-forest">
              {t('worker.kycTitle')}
            </span>
            <h2 className="text-lg font-bold text-cosathi-slate">
              {t('worker.kycSubtitle')}
            </h2>
          </div>
          <span className="text-xs font-mono font-bold bg-cosathi-surface px-2.5 py-1 rounded-lg border border-cosathi-border">
            Step {step} / 6
          </span>
        </div>

        {/* Stepper Dots */}
        <div className="flex items-center justify-between pt-4 px-2">
          {[1, 2, 3, 4, 5, 6].map((st) => (
            <div
              key={st}
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step === st
                  ? 'bg-cosathi-forest text-white shadow-xs'
                  : step > st
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-cosathi-surface text-cosathi-muted'
              }`}
            >
              {step > st ? '✓' : st}
            </div>
          ))}
        </div>
      </div>

      {/* STEP 1: Skill Selection (No Practical Test) */}
      {step === 1 && (
        <div className="bg-white rounded-3xl p-6 border border-cosathi-border shadow-sm space-y-5">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-cosathi-slate flex items-center space-x-2">
              <Wrench className="w-4 h-4 text-cosathi-forest" />
              <span>{t('worker.skillSelection')}</span>
            </h3>
            <p className="text-xs text-cosathi-muted">
              Select your trades. Approval is based on cooperative community vouching.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-cosathi-muted uppercase mb-1.5">
              {t('worker.primarySkillLabel')}
            </label>
            <select
              value={primarySkill}
              onChange={(e) => setPrimarySkill(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-cosathi-border text-sm font-semibold text-cosathi-slate bg-cosathi-surface focus:bg-white"
            >
              {skillsOptions.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-cosathi-muted uppercase mb-1.5">
              {t('worker.additionalSkillsLabel')}
            </label>
            <div className="flex flex-wrap gap-2">
              {skillsOptions.filter((s) => s.value !== primarySkill).map((s) => {
                const isSelected = additionalSkills.includes(s.value);
                return (
                  <button
                    type="button"
                    key={s.value}
                    onClick={() => toggleAdditionalSkill(s.value)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                      isSelected
                        ? 'bg-cosathi-forest text-white border-cosathi-forest'
                        : 'bg-cosathi-surface text-cosathi-slate border-cosathi-border'
                    }`}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-cosathi-muted uppercase mb-1.5">
              {t('worker.experienceYearsLabel')}
            </label>
            <input
              type="number"
              min="1"
              max="40"
              value={experienceYears}
              onChange={(e) => setExperienceYears(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-cosathi-border text-sm font-semibold text-cosathi-slate bg-cosathi-surface focus:bg-white"
            />
          </div>

          {/* No Practical Test Notice */}
          <div className="p-3.5 rounded-2xl bg-cosathi-surface border border-cosathi-border text-xs text-cosathi-muted space-y-1">
            <span className="font-bold text-cosathi-slate block">Cooperative Trust Architecture:</span>
            <p className="text-[11px] leading-relaxed">
              {t('worker.noPracticalTestNotice')}
            </p>
          </div>

          <button
            onClick={() => setStep(2)}
            className="w-full py-3 bg-cosathi-forest hover:bg-cosathi-forest-dark text-white font-bold rounded-xl text-sm shadow-md transition-all flex items-center justify-center space-x-2"
          >
            <span>Next: Upload Government ID →</span>
          </button>
        </div>
      )}

      {/* STEP 2: KYC Document Upload (No UIDAI Claim) */}
      {step === 2 && (
        <div className="bg-white rounded-3xl p-6 border border-cosathi-border shadow-sm space-y-5">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-cosathi-slate flex items-center space-x-2">
              <FileText className="w-4 h-4 text-cosathi-clay" />
              <span>{t('worker.uploadGovId')}</span>
            </h3>
            <p className="text-xs text-cosathi-muted">
              Physical document verification for cooperative compliance.
            </p>
          </div>

          {/* Upload Area */}
          <div className="p-6 rounded-2xl border-2 border-dashed border-cosathi-border hover:border-cosathi-forest text-center space-y-3 bg-cosathi-surface">
            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center mx-auto text-cosathi-forest shadow-xs">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-cosathi-slate block">Aadhaar Card / Voter ID Uploaded</span>
              <span className="text-[11px] text-cosathi-muted font-mono">{idDocName}</span>
            </div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-semibold">
              <Clock className="w-3.5 h-3.5 text-amber-700" />
              <span>{t('worker.govIdDocSubmitted')} ({t('worker.govIdPendingReview')})</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 text-xs">
            <span className="font-bold block">Verification Notice:</span>
            <p className="text-[11px] mt-0.5">
              Physical in-person document verification and background check are completed by local cooperative administrators before work assignment.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="px-5 py-3 rounded-xl border border-cosathi-border text-xs font-bold text-cosathi-slate hover:bg-cosathi-surface"
            >
              {t('common.back')}
            </button>
            <button
              onClick={() => setStep(3)}
              className="flex-1 py-3 bg-cosathi-forest hover:bg-cosathi-forest-dark text-white font-bold rounded-xl text-sm shadow-md transition-all flex items-center justify-center space-x-2"
            >
              <span>Next: Face Capture →</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Face Capture (Becomes Profile Picture) */}
      {step === 3 && (
        <div className="bg-white rounded-3xl p-6 border border-cosathi-border shadow-sm space-y-5">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-cosathi-slate flex items-center space-x-2">
              <Camera className="w-4 h-4 text-cosathi-forest" />
              <span>{t('worker.captureFaceTitle')}</span>
            </h3>
            <p className="text-xs text-cosathi-muted">
              {t('worker.captureFaceDesc')}
            </p>
          </div>

          {/* Camera Viewport Simulation */}
          <div className="relative w-48 h-48 mx-auto rounded-full border-4 border-cosathi-forest/30 overflow-hidden flex items-center justify-center bg-cosathi-surface shadow-inner">
            {faceImage ? (
              <div className="flex flex-col items-center space-y-1">
                <div className="w-24 h-24 rounded-full bg-cosathi-forest text-white font-bold flex items-center justify-center text-4xl shadow">
                  {user?.name ? user.name.charAt(0) : 'W'}
                </div>
                <span className="text-[11px] font-bold text-cosathi-forest">Verified Face</span>
              </div>
            ) : isCapturingFace ? (
              <div className="flex flex-col items-center space-y-2">
                <div className="w-8 h-8 border-3 border-cosathi-forest border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-bold text-cosathi-slate">Capturing...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center text-cosathi-muted space-y-2">
                <User className="w-16 h-16 opacity-30" />
                <span className="text-[11px] font-medium">Position face in circle</span>
              </div>
            )}
          </div>

          <div className="flex justify-center">
            <button
              onClick={handleCaptureFace}
              disabled={isCapturingFace}
              className="px-6 py-2.5 rounded-xl bg-cosathi-surface hover:bg-cosathi-border/40 border border-cosathi-border text-cosathi-slate text-xs font-bold flex items-center space-x-2 transition-all"
            >
              <Camera className="w-4 h-4 text-cosathi-clay" />
              <span>{faceImage ? t('worker.retakeSelfie') : t('worker.takeSelfie')}</span>
            </button>
          </div>

          {faceImage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs text-center flex items-center justify-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{t('worker.faceCapturedSuccess')}</span>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setStep(2)}
              className="px-5 py-3 rounded-xl border border-cosathi-border text-xs font-bold text-cosathi-slate hover:bg-cosathi-surface"
            >
              {t('common.back')}
            </button>
            <button
              onClick={() => setStep(4)}
              className="flex-1 py-3 bg-cosathi-forest hover:bg-cosathi-forest-dark text-white font-bold rounded-xl text-sm shadow-md transition-all flex items-center justify-center space-x-2"
            >
              <span>Next: Intro Video →</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: 10-20s Video Introduction */}
      {step === 4 && (
        <div className="bg-white rounded-3xl p-6 border border-cosathi-border shadow-sm space-y-5">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-cosathi-slate flex items-center space-x-2">
              <Video className="w-4 h-4 text-cosathi-ochre" />
              <span>{t('worker.recordIntroTitle')}</span>
            </h3>
            <p className="text-xs text-cosathi-muted">
              {t('worker.recordIntroDesc')}
            </p>
          </div>

          {/* Video Recording Container */}
          <div className="p-6 rounded-2xl bg-cosathi-surface border border-cosathi-border text-center space-y-4">
            <div className="relative w-full max-w-xs h-36 mx-auto rounded-2xl bg-cosathi-slate/90 text-white flex flex-col items-center justify-center space-y-2 shadow-inner">
              <Video className={`w-8 h-8 ${isRecordingVideo ? 'text-red-500 animate-pulse' : 'text-cosathi-ochre'}`} />
              <div className="text-xs font-mono">
                {isRecordingVideo ? (
                  <span className="text-red-400 font-bold">● REC: {introVideoDuration}s / 15s</span>
                ) : videoRecorded ? (
                  <span className="text-emerald-400 font-bold">✓ 15s Recorded</span>
                ) : (
                  <span className="text-white/70">Ready to record</span>
                )}
              </div>
            </div>

            <button
              onClick={handleStartVideo}
              disabled={isRecordingVideo}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
                isRecordingVideo
                  ? 'bg-red-600 text-white animate-pulse'
                  : 'bg-cosathi-forest text-white hover:bg-cosathi-forest-dark'
              }`}
            >
              {isRecordingVideo ? 'Recording in progress...' : videoRecorded ? 'Re-record Video' : t('worker.startRecording')}
            </button>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setStep(3)}
              className="px-5 py-3 rounded-xl border border-cosathi-border text-xs font-bold text-cosathi-slate hover:bg-cosathi-surface"
            >
              {t('common.back')}
            </button>
            <button
              onClick={() => setStep(5)}
              className="flex-1 py-3 bg-cosathi-forest hover:bg-cosathi-forest-dark text-white font-bold rounded-xl text-sm shadow-md transition-all flex items-center justify-center space-x-2"
            >
              <span>Next: Select Cooperative →</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: Cooperative Selection */}
      {step === 5 && (
        <div className="bg-white rounded-3xl p-6 border border-cosathi-border shadow-sm space-y-5">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-cosathi-slate flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-cosathi-forest" />
              <span>{t('worker.selectCooperative')}</span>
            </h3>
            <p className="text-xs text-cosathi-muted">
              Choose the primary registered society representing your district.
            </p>
          </div>

          <div className="space-y-2.5">
            {[
              {
                name: 'Delhi Shramik Kalyan Sahakari Samiti Ltd.',
                reg: 'DL-COOP-2026-9874',
                zones: 'South, Central, and West Delhi',
                selected: true,
              },
              {
                name: 'NCR Urban Artisan Cooperative Society',
                reg: 'DL-COOP-2025-4102',
                zones: 'Dwarka, Rohini, and North Delhi',
                selected: false,
              },
            ].map((coop, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedCoop(coop.name)}
                className={`w-full p-4 rounded-2xl border text-left transition-all ${
                  selectedCoop === coop.name
                    ? 'bg-cosathi-surface border-cosathi-forest shadow-xs'
                    : 'bg-white border-cosathi-border hover:bg-cosathi-surface/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-cosathi-slate">{coop.name}</span>
                  <span className="font-mono text-[10px] bg-white px-2 py-0.5 rounded border">{coop.reg}</span>
                </div>
                <span className="text-[11px] text-cosathi-muted block">Zones: {coop.zones}</span>
              </button>
            ))}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setStep(4)}
              className="px-5 py-3 rounded-xl border border-cosathi-border text-xs font-bold text-cosathi-slate hover:bg-cosathi-surface"
            >
              {t('common.back')}
            </button>
            <button
              onClick={() => setStep(6)}
              className="flex-1 py-3 bg-cosathi-forest hover:bg-cosathi-forest-dark text-white font-bold rounded-xl text-sm shadow-md transition-all flex items-center justify-center space-x-2"
            >
              <span>{t('worker.submitForApproval')} →</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 6: Verification Status View (4 States: PENDING | PROVISIONAL | VERIFIED | SUSPENDED) */}
      {step === 6 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-cosathi-border shadow-sm space-y-6">
          <div className="text-center space-y-2 pb-4 border-b border-cosathi-border">
            <span className="text-xs font-bold uppercase tracking-wider text-cosathi-forest">
              {t('worker.verificationStatus')}
            </span>
            <h3 className="text-xl font-bold text-cosathi-slate">Cooperative Member Status</h3>
          </div>

          {/* Current Status Badge Display */}
          <div className="p-5 rounded-2xl text-center space-y-2 border">
            {verificationState === 'VERIFIED' && (
              <div className="space-y-1 text-emerald-900 bg-emerald-50 p-4 rounded-xl border border-emerald-200">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-1" />
                <span className="text-base font-bold block">{t('worker.verifStates.VERIFIED')}</span>
                <p className="text-xs text-emerald-700">Fully certified member. Eligible for all cooperative job dispatches and welfare claims.</p>
              </div>
            )}

            {verificationState === 'PROVISIONAL' && (
              <div className="space-y-1 text-amber-900 bg-amber-50 p-4 rounded-xl border border-amber-200">
                <Clock className="w-10 h-10 text-amber-600 mx-auto mb-1" />
                <span className="text-base font-bold block">{t('worker.verifStates.PROVISIONAL')}</span>
                <p className="text-xs text-amber-700">New member status. Can accept initial starter jobs under cooperative mentorship.</p>
              </div>
            )}

            {verificationState === 'PENDING' && (
              <div className="space-y-1 text-sky-900 bg-sky-50 p-4 rounded-xl border border-sky-200">
                <Clock className="w-10 h-10 text-sky-600 mx-auto mb-1" />
                <span className="text-base font-bold block">{t('worker.verifStates.PENDING')}</span>
                <p className="text-xs text-sky-700">Submitted documents are under executive review by cooperative admins.</p>
              </div>
            )}

            {verificationState === 'SUSPENDED' && (
              <div className="space-y-1 text-red-900 bg-red-50 p-4 rounded-xl border border-red-200">
                <AlertTriangle className="w-10 h-10 text-red-600 mx-auto mb-1" />
                <span className="text-base font-bold block">{t('worker.verifStates.SUSPENDED')}</span>
                <p className="text-xs text-red-700">Membership temporarily paused. Contact cooperative board for grievance resolution.</p>
              </div>
            )}
          </div>

          {/* Interactive State Switcher for Verification Preview */}
          <div className="p-4 rounded-2xl bg-cosathi-surface border border-cosathi-border space-y-2">
            <span className="text-[11px] font-bold text-cosathi-muted uppercase tracking-wider block">
              Verification Status Preview
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {['PENDING', 'PROVISIONAL', 'VERIFIED', 'SUSPENDED'].map((st) => (
                <button
                  type="button"
                  key={st}
                  onClick={() => setVerificationState(st)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all border ${
                    verificationState === st
                      ? 'bg-cosathi-forest text-white border-cosathi-forest'
                      : 'bg-white text-cosathi-slate border-cosathi-border'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => navigate('/worker/dashboard')}
            className="w-full py-3 bg-cosathi-forest hover:bg-cosathi-forest-dark text-white font-bold rounded-xl text-sm shadow-md transition-all flex items-center justify-center space-x-2"
          >
            <span>Go to Worker Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
