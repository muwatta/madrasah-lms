import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { translations, type Language } from '../i18n/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string) => string;
  dir: 'ltr' | 'rtl';
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function getNestedValue(obj: Record<string, any>, path: string): string | undefined {
  const result = path.split('.').reduce((acc: any, part: string) => acc?.[part], obj);
  return typeof result === 'string' ? result : undefined;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem('language');
    return (stored === 'en' || stored === 'ar') ? stored : 'ar';
  });

  const dir = language === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', language);
  }, [language, dir]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguageState(prev => prev === 'ar' ? 'en' : 'ar');
  }, []);

  const t = useCallback((key: string): string => {
    const value = getNestedValue(translations as Record<string, any>, key);
    if (value === undefined) {
      console.warn(`Missing translation: ${key}`);
      return key;
    }
    return value;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
