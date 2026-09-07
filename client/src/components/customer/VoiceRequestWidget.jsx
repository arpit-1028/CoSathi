import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Mic, MicOff, Type, Sparkles, Volume2, ArrowRight, CornerDownLeft } from 'lucide-react';

export const VoiceRequestWidget = ({ onRequestReady, initialText = '', selectedCategory = 'electrical' }) => {
  const { t, language } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [textInput, setTextInput] = useState(initialText);
  const [isTextMode, setIsTextMode] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const recognitionRef = useRef(null);

  // Initialize Web Speech API if available
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = language === 'hi' ? 'hi-IN' : 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((res) => res[0].transcript)
          .join('');
        setTextInput(transcript);
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition warning/error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      setSpeechSupported(false);
    }
  }, [language]);

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
          recognitionRef.current.start();
        } catch (e) {
          // Fallback simulation if already started or permission blocked
          simulateVoiceInput();
        }
      } else {
        simulateVoiceInput();
      }
    }
  };

  // Simulated speech input for demo environment if microphone unavailable or permission blocked
  const simulateVoiceInput = () => {
    setIsListening(true);
    const demoPhrases = {
      en: "Ceiling fan in bedroom is making humming sound and running very slow.",
      hi: "कमरे का सीलिंग फैन बहुत धीमी गति से चल रहा है और आवाज कर रहा है।",
    };
    const phrase = demoPhrases[language] || demoPhrases.en;

    let index = 0;
    setTextInput('');
    const interval = setInterval(() => {
      index += 3;
      setTextInput(phrase.slice(0, index));
      if (index >= phrase.length) {
        clearInterval(interval);
        setTimeout(() => setIsListening(false), 500);
      }
    }, 40);
  };

  const handleSampleClick = (sampleText) => {
    setTextInput(sampleText);
    onRequestReady(sampleText, selectedCategory);
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!textInput.trim()) return;
    onRequestReady(textInput.trim(), selectedCategory);
  };

  const sampleQueries = [
    { en: 'Bathroom tap leaking & sewage pipe blocked', hi: 'बाथरूम का नल बदलना है और नाली जाम है', cat: 'plumbing' },
    { en: 'Ceiling fan humming sound & slow speed', hi: 'कमरे का सीलिंग फैन आवाज कर रहा है और धीमा चल रहा है', cat: 'electrical' },
    { en: 'Full house deep cleaning after painting', hi: 'घर की पूरी डीप क्लीनिंग करवानी है', cat: 'cleaning' },
    { en: 'Wooden door lock jammed & hinges repair', hi: 'दरवाजे का लॉक अटक गया है और कब्जा ठीक करना है', cat: 'carpentry' },
  ];

  return (
    <div className="bg-[#1B4278] rounded-2xl sm:rounded-3xl p-6 sm:p-10 text-white shadow-card relative overflow-hidden">
      {/* Subtle geometric background accent */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/5 pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />

      <div className="relative z-10 max-w-3xl mx-auto text-center space-y-6">
        {/* Hero Title & Subtitle */}
        <div className="space-y-2">
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
            {language === 'hi' ? 'आज हम आपकी क्या सेवा कर सकते हैं?' : 'How can we help today?'}
          </h1>
          <p className="text-sm sm:text-base text-slate-200 max-w-2xl mx-auto leading-relaxed">
            {language === 'hi'
              ? 'अपनी समस्या को अपनी भाषा में बताएं — हिंदी या अंग्रेजी में। को-साथी और आपकी स्थानीय सहकारी समिति बाकी सब संभाल लेगी।'
              : 'Describe the problem in your own words — Hindi or English. CoSathi and your local cooperative take it from there.'}
          </p>
        </div>

        {/* Search & Voice Input Pill (Screenshot 1 & 2) */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl sm:rounded-full p-2 pl-3 sm:pl-4 flex flex-col sm:flex-row items-center gap-2 shadow-xl border border-white/20 transition-all focus-within:ring-2 focus-within:ring-amber-400"
        >
          <div className="flex items-center w-full flex-1">
            {/* Mic button inside pill */}
            <button
              type="button"
              onClick={toggleListening}
              className={`p-2.5 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${
                isListening
                  ? 'bg-rose-600 text-white animate-pulse'
                  : 'bg-slate-100 hover:bg-slate-200 text-[#1B4278]'
              }`}
              title={isListening ? 'Stop recording' : 'Click to speak'}
              aria-label="Toggle Voice Recording"
            >
              {isListening ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Input field */}
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={
                isListening
                  ? (language === 'hi' ? 'सुन रहे हैं... बोलिए...' : 'Listening... speak now...')
                  : (language === 'hi'
                      ? 'उदा. बाथरूम का नल बदलना है, पंखा भी खराब है...'
                      : 'e.g. bathroom ka nal change karna hai, switchboard spark...')
              }
              className="w-full px-3 py-2 text-sm sm:text-base text-[#20242A] placeholder:text-slate-400 focus:outline-none bg-transparent"
            />
          </div>

          {/* Terracotta 'Get an estimate' Action Button (#9E472A) */}
          <button
            type="submit"
            disabled={!textInput.trim()}
            className="w-full sm:w-auto px-6 py-3 rounded-xl sm:rounded-full bg-[#9E472A] hover:bg-[#853920] active:scale-95 disabled:opacity-50 text-white font-semibold text-sm transition-all shadow-sm flex items-center justify-center space-x-2 flex-shrink-0"
          >
            <span>{language === 'hi' ? 'अनुमानित रेट देखें' : 'Get an estimate'}</span>
            <ArrowRight className="w-4 h-4 text-amber-200" />
          </button>
        </form>

        {/* Quick Sample Suggestions */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
          <span className="text-xs text-slate-300 font-medium hidden sm:inline">
            {language === 'hi' ? 'त्वरित उदाहरण:' : 'Try asking:'}
          </span>
          {sampleQueries.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSampleClick(language === 'hi' ? sample.hi : sample.en)}
              className="text-xs bg-white/10 hover:bg-white/20 border border-white/15 px-3 py-1.5 rounded-full text-slate-100 transition-colors"
            >
              "{language === 'hi' ? sample.hi : sample.en}"
            </button>
          ))}
        </div>

        {/* Trust Badges Bar */}
        <div className="pt-4 border-t border-white/15 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-200 font-medium">
          <span className="flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>{language === 'hi' ? 'सत्यापित सहकारी साथी' : 'Verified cooperative workers'}</span>
          </span>
          <span className="hidden sm:inline opacity-40">•</span>
          <span className="flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            <span>{language === 'hi' ? 'पारदर्शी रेट कार्ड बिलिंग' : 'Transparent, rate-card pricing'}</span>
          </span>
          <span className="hidden sm:inline opacity-40">•</span>
          <span className="flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
            <span>{language === 'hi' ? 'न्यायसंगत कार्य अवसर' : 'Fair worker opportunities'}</span>
          </span>
        </div>
      </div>
    </div>
  );
};
