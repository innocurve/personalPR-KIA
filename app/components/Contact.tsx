'use client'

import Link from 'next/link';
import { Bot, Phone, Video, CreditCard } from 'lucide-react';
import { Language, translate } from '../utils/translations';

interface ContactProps {
  language: Language;
}

export default function Contact({ language }: ContactProps) {
  return (
    <div className="flex flex-col gap-4 ">
      <Link
        href="/ai-clone"
        className="flex items-center gap-2 group"
      >
        <Bot className="w-6 h-6 text-transparent bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text" />
        <span className="font-mono tracking-tight text-transparent bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text">
          {translate('aiClone', language)}
        </span>
      </Link>
      <Link
        href="/greeting-video"
        className="flex items-center gap-2 group"
      >
        <Video className="w-6 h-6 text-transparent bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text" />
        <span className="font-mono tracking-tight text-transparent bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text">
          {translate('greetingVideo', language)}
        </span>
      </Link>
      <Link
        href="/phone"
        className="flex items-center gap-2 group"
      >
        <Phone className="w-6 h-6 text-transparent bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text" />
        <span className="font-mono tracking-tight text-transparent bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text">
          {translate('phone', language)}
        </span>
      </Link>
      <Link
        href="/innocard-inquiry"
        className="flex items-center gap-2 group"
      >
        <CreditCard className="w-6 h-6 font-mono text-transparent bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text" />
        <span className="font-mono tracking-tight text-transparent bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text whitespace-pre-line">
          {translate('innoCardInquiry', language)}
        </span>
      </Link>
    </div>
  );
} 