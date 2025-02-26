'use client';

import { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import { storage } from '../utils/storage';

export type Language = 'ko' | 'en' | 'ja' | 'zh';

export interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('ko');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // 클라이언트 사이드에서만 실행
    const storedLanguage = storage.get('language');
    
    if (storedLanguage && ['ko', 'en', 'ja', 'zh'].includes(storedLanguage)) {
      setLanguageState(storedLanguage as Language);
    } else {
      // 기본값은 한국어
      setLanguageState('ko');
      storage.set('language', 'ko');
    }
    
    setIsInitialized(true);
  }, []);

  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
    storage.set('language', newLanguage);
    
    // 언어 변경 이벤트 발생 (다른 컴포넌트에서 감지할 수 있도록)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('languagechange'));
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {isInitialized ? children : null}
    </LanguageContext.Provider>
  );
}

// 편의를 위한 훅
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
} 