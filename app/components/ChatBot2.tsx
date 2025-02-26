'use client'

import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { ReservationForm } from "./ReservationForm";

type Message = {
  role: 'user' | 'assistant';
  content: string;
}

export function ChatBot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [showReservationForm, setShowReservationForm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const updatedMessages: Message[] = [...messages, { role: 'user', content: input }];
    setMessages(updatedMessages);
    setInput('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages([...updatedMessages, { role: 'assistant', content: data.content }]);

        if (data.content.toLowerCase().includes('예약 폼을 표시하겠습니다')) {
          setShowReservationForm(true);
        }
      } else {
        throw new Error('API 응답이 실패했습니다.');
      }
    } catch (error) {
      console.error('Error in chat:', error);
      setMessages([...updatedMessages, { role: 'assistant', content: '죄송합니다. 오류가 발생했습니다. 다시 시도해 주세요.' }]);
    }
  };

  const handleReservation = async (reservationData: { name: string; email: string; phoneNumber: string; date: string; message: string }) => {
    try {
      const response = await fetch('/api/reservation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reservationData),
      });

      if (response.ok) {
        setMessages([...messages, { role: 'assistant', content: '예약이 완료되었습니다. 감사합니다!' }]);
        setShowReservationForm(false);
      } else {
        throw new Error('예약 API 응답이 실패했습니다.');
      }
    } catch (error) {
      console.error('Reservation error:', error);
      setMessages([...messages, { role: 'assistant', content: '예약 중 오류가 발생했습니다. 다시 시도해주세요.' }]);
    }
  };

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader>
        <CardTitle>이재권 AI 어시스턴트</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow overflow-y-auto">
        {messages.map((message, index) => (
          <div key={index} className={`mb-4 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
            <span className={`inline-block p-2 rounded-lg ${message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
              {message.content}
            </span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </CardContent>
      <CardFooter>
        {showReservationForm ? (
          <ReservationForm
            onSubmit={handleReservation}
            onCancel={() => setShowReservationForm(false)}
          />
        ) : (
          <div className="flex w-full">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="메시지를 입력하세요..."
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <Button onClick={handleSendMessage} className="ml-2">전송</Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
