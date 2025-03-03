'use client'

import { Card } from "@/components/ui/card"
import { Language, translate } from '../utils/translations'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CarFront } from 'lucide-react'

// Telegram WebApp 타입 선언
declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        openLink: (url: string) => void;
      };
    };
  }
}

interface ContactOptionsProps {
  language: Language
}

const ContactOptions: React.FC<ContactOptionsProps> = ({ language }) => {
  const router = useRouter()

  const handleOptionClick = (key: string) => {
    if (key === 'aiClone') {
      router.push('/chat')
    } else if (key === 'greetingVideo') {
      router.push('/greeting')
    } else if (key === 'phone') {
      window.location.href = 'tel:+8210-1234-5678'
    } else if (key === 'innocard') {
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.openLink('https://m.kia.com/kr/vehicles/catalog-price')
      } else {
        window.open('https://www.kia.com/kr/vehicles/catalog-price', '_blank', 'noopener,noreferrer')
      }
    }
  }

  const options = [
    {
      key: 'aiClone',
      title: translate('aiClone', language),
      icon: (
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#05141F] group-hover:text-[#EA0029] transition-colors duration-100">
          <circle cx="32" cy="20" r="12" stroke="currentColor" strokeWidth="2" fill="none"/>
          <path d="M32 36C18.7452 36 8 46.7452 8 60" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M56 60C56 46.7452 45.2548 36 32 36" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M32 60V48" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M24 56H40" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <circle cx="32" cy="20" r="4" fill="currentColor"/>
        </svg>
      ),
    },
    {
      key: 'greetingVideo',
      title: translate('greetingVideo', language),
      icon: (
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#05141F] group-hover:text-[#EA0029] transition-colors duration-100">
          <rect x="8" y="12" width="48" height="40" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
          <path d="M28 24L40 32L28 40V24Z" fill="currentColor"/>
        </svg>
      ),
    },
    {
      key: 'phone',
      title: translate('phone', language),
      icon: (
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#05141F] group-hover:text-[#EA0029] transition-colors duration-100">
          <rect x="18" y="4" width="28" height="56" rx="4" stroke="currentColor" strokeWidth="2" fill="none"/>
          <line x1="18" y1="12" x2="46" y2="12" stroke="currentColor" strokeWidth="2"/>
          <line x1="18" y1="52" x2="46" y2="52" stroke="currentColor" strokeWidth="2"/>
          <circle cx="32" cy="56" r="2" fill="currentColor"/>
          <rect x="26" y="6" width="12" height="4" rx="2" fill="currentColor"/>
        </svg>
      ),
    },
    {
      key: 'innocard',
      title: translate('catalog', language),
      icon: (
        <CarFront className="w-16 h-16 text-[#05141F] group-hover:text-[#EA0029] transition-colors duration-100" strokeWidth={1.2} />
      ),
    }
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {options.map((option) => (
        <Card
          key={option.key}
          className="cursor-pointer hover:shadow-md transition-shadow duration-200 p-6 relative h-48 group bg-white hover:bg-gray-50"
          onClick={() => handleOptionClick(option.key)}
        >
          <div className="absolute top-6 left-4">
            <h3 className="text-2xl font-semibold text-[#05141F] group-hover:text-[#EA0029] transition-colors duration-100">
              {option.title.split('\n').map((line, i) => (
                <span key={i} className="block">{line}</span>
              ))}
            </h3>
          </div>
          <div className="absolute bottom-6 right-6">
            {option.icon}
          </div>
        </Card>
      ))}
    </div>
  )
}

export default ContactOptions

