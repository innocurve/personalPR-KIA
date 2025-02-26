'use client'

import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import Script from 'next/script';

interface ReservationFormProps {
  onSubmit: (data: { name: string; email: string; phoneNumber: string; date: string; message: string }) => void;
  onCancel: () => void;
}

declare global {
  interface Window {
    Kakao: any;
  }
}

export function ReservationForm({ onSubmit, onCancel }: ReservationFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [date, setDate] = useState('');
  const [message, setMessage] = useState('');
  const [isKakaoInitialized, setIsKakaoInitialized] = useState(false);
  const [isChannelSubscribed, setIsChannelSubscribed] = useState(false);
  const kakaoButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initializeKakao = () => {
      if (typeof window !== 'undefined' && window.Kakao) {
        if (!window.Kakao.isInitialized()) {
          window.Kakao.init(process.env.NEXT_PUBLIC_KAKAO_JavaScript_KEY);
          console.log('Kakao SDK initialized');
        }
        createChannelButton();
      }
    };
    initializeKakao();
  }, []);

  const createChannelButton = () => {
    if (window.Kakao && window.Kakao.Channel && kakaoButtonRef.current) {
      window.Kakao.Channel.createAddChannelButton({
        container: kakaoButtonRef.current,
        channelPublicId: process.env.NEXT_PUBLIC_KAKAO_CHANNEL_ID,
        size: 'large',
        supportMultipleDensities: true,
      });
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 예약 정보 전달
    onSubmit({ name, email, phoneNumber, date, message });
  };

  return (
    <Card className="w-full reservation-form dark:bg-gray-800 dark:border-gray-700">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-500 dark:to-cyan-400 text-white">
        <CardTitle>상담 예약</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="mb-6">
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            상담 예약을 위해 아래 정보를 입력해주세요. 입력하신 정보는 상담 목적으로만 사용됩니다.
          </p>
          <div ref={kakaoButtonRef} className="flex justify-center mb-4"></div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">이름</label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">이메일</label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300">전화번호</label>
            <Input
              id="phoneNumber"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
              placeholder="01012345678"
              className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">날짜</label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300">메시지</label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button type="button" variant="outline" onClick={onCancel} className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">취소</Button>
        <Button type="submit" onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800">예약하기</Button>
      </CardFooter>
    </Card>
  );
}
