'use client';

import { useContext } from 'react';
import { LanguageContext, type Language } from '../contexts/LanguageContext';
import { Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from '../contexts/ThemeContext';

const languages: { value: Language; label: string }[] = [
  { value: 'ko', label: '한국어' },
  { value: 'en', label: 'English' },
  { value: 'ja', label: '日本語' },
  { value: 'zh', label: '中文' }
];

export default function LanguageToggle() {
  const context = useContext(LanguageContext);
  const { isDarkMode } = useTheme();
  if (!context) return null;
  const { language, setLanguage } = context;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
        <Globe className="w-5 h-5 text-gray-600 dark:text-white" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-white dark:bg-gray-800 min-w-[120px]">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.value}
            onClick={() => setLanguage(lang.value)}
            className={`cursor-pointer text-gray-900 dark:text-white hover:text-white hover:bg-blue-500 dark:hover:bg-blue-600 ${language === lang.value ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
          >
            {lang.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

