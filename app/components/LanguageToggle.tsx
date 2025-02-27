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

const languages: { value: Language; label: string }[] = [
  { value: 'ko', label: '한국어' },
  { value: 'en', label: 'English' },
  { value: 'ja', label: '日本語' },
  { value: 'zh', label: '中文' }
];

export default function LanguageToggle() {
  const context = useContext(LanguageContext);
  if (!context) return null;
  const { language, setLanguage } = context;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-[#EA0029] dark:hover:text-[#EA0029] transition-colors duration-75">
        <Globe className="w-5 h-5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-white dark:bg-gray-800 min-w-[120px]">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.value}
            onClick={() => setLanguage(lang.value)}
            className={`cursor-pointer text-[#05141F] dark:text-gray-300 hover:text-[#EA0029] dark:hover:text-[#EA0029] hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-75 ${
              language === lang.value ? 'text-[#EA0029] dark:text-[#EA0029]' : ''
            }`}
          >
            {lang.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

