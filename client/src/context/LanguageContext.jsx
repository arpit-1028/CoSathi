import React, { createContext, useContext, useState, useEffect } from 'react';
import { en } from '../i18n/en';
import { hi } from '../i18n/hi';

const translations = { en, hi };

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('cosathi_lang') || 'en';
  });

  const [hasChosenLanguage, setHasChosenLanguage] = useState(() => {
    return Boolean(localStorage.getItem('cosathi_lang_selected'));
  });

  useEffect(() => {
    localStorage.setItem('cosathi_lang', language);
    document.documentElement.lang = language;
  }, [language]);

  const selectLanguage = (lang) => {
    setLanguageState(lang);
    setHasChosenLanguage(true);
    localStorage.setItem('cosathi_lang', lang);
    localStorage.setItem('cosathi_lang_selected', 'true');
    document.documentElement.lang = lang;
  };

  const toggleLanguage = () => {
    const nextLang = language === 'en' ? 'hi' : 'en';
    selectLanguage(nextLang);
  };

  const t = (keyPath) => {
    const keys = keyPath.split('.');
    let value = translations[language];
    for (const key of keys) {
      if (value && value[key] !== undefined) {
        value = value[key];
      } else {
        // Fallback to English if translation key missing
        let fallback = translations.en;
        for (const fKey of keys) {
          if (fallback && fallback[fKey] !== undefined) {
            fallback = fallback[fKey];
          } else {
            return keyPath;
          }
        }
        return fallback;
      }
    }
    return value;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        hasChosenLanguage,
        selectLanguage,
        toggleLanguage,
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
