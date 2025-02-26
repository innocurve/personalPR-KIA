'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import ChatMessage from './ChatMessage';
import ChatInput, { Message } from './ChatInput';
import { ReservationForm } from '@/app/components/ReservationForm';
import { translate } from '@/app/utils/translations';
import { useLanguage } from '@/app/hooks/useLanguage';
import { useTheme } from '@/app/contexts/ThemeContext';

interface ChatBotProps {
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
}

const ChatBot = ({ isOpen: externalIsOpen, onOpenChange }: ChatBotProps) => {
  const { language } = useLanguage();
  const { isDarkMode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [showReservationForm, setShowReservationForm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatMessagesRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pdfContent, setPdfContent] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToLatestResponse = () => {
    const lastBotMessage = chatMessagesRef.current?.querySelector('.bot-message:last-child');
    if (lastBotMessage) {
      lastBotMessage.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  useEffect(() => {
    if (externalIsOpen !== undefined) {
      setIsOpen(externalIsOpen);
      if (externalIsOpen) {
        setTimeout(scrollToBottom, 100);
      }
    }
  }, [externalIsOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleOpenChange = (newIsOpen: boolean) => {
    setIsOpen(newIsOpen);
    onOpenChange?.(newIsOpen);
  };

  useEffect(() => {
    const savedMessages = localStorage.getItem('chatMessages');
    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages);
        if (Array.isArray(parsedMessages) && parsedMessages.length > 0) {
          const messagesWithIds = parsedMessages.map(msg => ({
            ...msg,
            id: msg.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          }));
          setMessages(messagesWithIds);
        } else {
          setMessages([{
            role: 'assistant',
            content: translate('initialMessage', language),
            timestamp: Date.now(),
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          }]);
        }
      } catch (error) {
        console.error('Error parsing saved messages:', error);
        setMessages([{
          role: 'assistant',
          content: translate('initialMessage', language),
          timestamp: Date.now(),
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }]);
      }
    } else {
      setMessages([{
        role: 'assistant',
        content: translate('initialMessage', language),
        timestamp: Date.now(),
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }]);
    }
  }, [language]);

  useEffect(() => {
    if (messages.length > 0) {
      try {
        localStorage.setItem('chatMessages', JSON.stringify(messages));
      } catch (error) {
        console.error('Error saving messages:', error);
      }
    }
  }, [messages]);

  useEffect(() => {
    if (messages.length > 0 && messages[messages.length - 1].role === 'assistant') {
      scrollToLatestResponse();
    }
  }, [messages]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/fileupload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success) {
        setPdfContent(data.text);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `PDF 파일 "${data.filename}"이(가) 성공적으로 업로드되었습니다. 이제 파일 내용에 대해 질문해주세요.`,
          timestamp: Date.now(),
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }]);
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `파일 업로드 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
        timestamp: Date.now(),
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }]);
    }
  };

  const handleSendMessage = async (message: string) => {
    try {
      setIsLoading(true);
      
      // 사용자 메시지 추가
      const newUserMessage: Message = { 
        role: 'user', 
        content: message,
        timestamp: Date.now(),
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
      const updatedMessages = [...messages, newUserMessage];
      setMessages(updatedMessages);

      // PDF 내용이 있으면 시스템 메시지에 추가
      const systemMessage: Message | null = pdfContent ? {
        role: 'system',
        content: `다음은 업로드된 PDF 파일의 내용입니다:\n\n${pdfContent}\n\n이 내용을 참고하여 사용자의 질문에 답변해주세요.`,
        timestamp: Date.now(),
        id: `msg_system_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      } : null;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: systemMessage 
            ? [systemMessage, ...updatedMessages]
            : updatedMessages
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      
      // 봇 응답 추가
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.response,
        timestamp: Date.now(),
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '죄송합니다. 오류가 발생했습니다.',
        timestamp: Date.now(),
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReservationSubmit = async (reservationData: { 
    name: string; 
    email: string; 
    phoneNumber: string; 
    date: string; 
    message: string; 
  }) => {
    try {
      const response = await fetch('/api/reservation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reservationData)
      });

      if (response.ok) {
        const reservationMessage = `예약이 완료되었습니다!

📅 예약 날짜: ${reservationData.date}
👤 이름: ${reservationData.name}
📧 이메일: ${reservationData.email}
📞 연락처: ${reservationData.phoneNumber}
📝 상담 내용: ${reservationData.message}

✓ 예약하신 내용은 확인 후 연락드리겠습니다.`;

        setMessages(prev => [...prev, {
          role: 'assistant',
          content: reservationMessage,
          timestamp: Date.now(),
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }]);
        setShowReservationForm(false);
      } else {
        throw new Error('예약 API 응답이 실패했습니다.');
      }
    } catch (error) {
      console.error('Reservation Error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '죄송합니다. 예약 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        timestamp: Date.now(),
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }]);
    }
  };

  // 예약 폼이 표시될 때 스크롤
  useEffect(() => {
    if (showReservationForm) {
      setTimeout(() => {
        const reservationFormElement = document.querySelector('.reservation-form');
        if (reservationFormElement) {
          reservationFormElement.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  }, [showReservationForm]);

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem('chatMessages');
  };

  return (
    <div className="fixed bottom-4 right-4 z-[9999]">
      {isOpen && (
        <div className="w-[350px] h-[500px] rounded-lg shadow-lg flex flex-col mb-4 animate-slideIn bg-white dark:bg-gray-800">
          <div className="p-4 rounded-t-lg flex items-center justify-between bg-blue-500 dark:bg-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-white">
                <Image
                  src="/profile.png"
                  alt="ChatBot Profile"
                  width={40}
                  height={40}
                  className="object-cover"
                />
              </div>
              <div>
                <h2 className="font-bold text-white">정이노&apos;s clone</h2>
                <p className="text-sm text-gray-100">온라인</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleOpenChange(false)}
                className="text-white hover:text-gray-200 p-2"
                title="뒤로가기"
              >
                ←
              </button>
              <button 
                onClick={clearChat}
                className="text-white hover:text-gray-200 p-2"
                title="내역 지우기"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  strokeWidth={1.5} 
                  stroke="currentColor" 
                  className="w-5 h-5"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" 
                  />
                </svg>
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="text-center my-4 text-gray-500 dark:text-gray-400">
                  안녕하세요! 무엇을 도와드릴까요?
                </div>
              )}
              {messages.map((message, index) => (
                <ChatMessage 
                  key={index} 
                  message={message}
                  isDarkMode={isDarkMode}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {showReservationForm && (
              <div className="mt-4 w-full">
                <div className="bg-white rounded-lg shadow-sm">
                  <ReservationForm
                    onSubmit={handleReservationSubmit}
                    onCancel={() => {
                      setShowReservationForm(false);
                      scrollToBottom();
                    }}
                  />
                </div>
              </div>
            )}
          </div>
          
          {!showReservationForm && (
            <div className="p-4 border-t">
              <ChatInput 
                onSendMessage={handleSendMessage}
                placeholder={translate('chatInputPlaceholder', language)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatBot;

