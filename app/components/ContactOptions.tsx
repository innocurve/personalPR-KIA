'use client'

import { Card } from "@/components/ui/card"
import { Language, translate } from '../utils/translations'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

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
      router.push('/inquiry')
    }
  }

  const options = [
    {
      key: 'aiClone',
      title: translate('aiClone', language),
      icon: (
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="32" cy="20" r="12" stroke="#3B82F6" strokeWidth="2" fill="none"/>
          <path d="M32 36C18.7452 36 8 46.7452 8 60" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round"/>
          <path d="M56 60C56 46.7452 45.2548 36 32 36" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round"/>
          <path d="M32 60V48" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round"/>
          <path d="M24 56H40" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round"/>
          <circle cx="32" cy="20" r="4" fill="#3B82F6"/>
        </svg>
      ),
    },
    {
      key: 'greetingVideo',
      title: translate('greetingVideo', language),
      icon: (
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="8" y="12" width="48" height="40" rx="2" stroke="#3B82F6" strokeWidth="2" fill="none"/>
          <path d="M28 24L40 32L28 40V24Z" fill="#3B82F6"/>
        </svg>
      ),
    },
    {
      key: 'phone',
      title: translate('phone', language),
      icon: (
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="18" y="4" width="28" height="56" rx="4" stroke="#3B82F6" strokeWidth="2" fill="none"/>
          <line x1="18" y1="12" x2="46" y2="12" stroke="#3B82F6" strokeWidth="2"/>
          <line x1="18" y1="52" x2="46" y2="52" stroke="#3B82F6" strokeWidth="2"/>
          <circle cx="32" cy="56" r="2" fill="#3B82F6"/>
          <rect x="26" y="6" width="12" height="4" rx="2" fill="#3B82F6"/>
        </svg>
      ),
    },
    {
      key: 'innocard',
      title: translate('innoCardInquiry', language),
      icon: (
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 54L14 42L50 6L58 14L22 50L10 54Z" stroke="#3B82F6" strokeWidth="2" fill="none"/>
          <path d="M42 14L50 22" stroke="#3B82F6" strokeWidth="2"/>
          <path d="M10 54L14 42" stroke="#3B82F6" strokeWidth="2"/>
          <path d="M8 58H56" stroke="#3B82F6" strokeWidth="2"/>
        </svg>
      ),
    }
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {options.map((option) => (
        <Card
          key={option.key}
          className="cursor-pointer hover:shadow-md transition-shadow duration-200 p-6 relative h-48 group"
          onClick={() => handleOptionClick(option.key)}
        >
          <div className="absolute top-6 left-4">
            <h3 className="text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-gray-600 to-gray-600 dark:from-gray-100 dark:to-gray-100 group-hover:from-blue-600 group-hover:to-cyan-500 transition-all duration-300">
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

