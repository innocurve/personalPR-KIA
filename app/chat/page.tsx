'use client'

import { useState, useRef, useEffect } from 'react'
import { ArrowLeft, Trash2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useLanguage } from '../hooks/useLanguage'
import { translate } from '../utils/translations'
import ChatInput, { Message } from '../components/ChatBot/ChatInput'
import ChatMessage from '../components/ChatBot/ChatMessage'
import Navigation from '../components/Navigation'
import { useTheme } from '../contexts/ThemeContext'
import { useRouter } from 'next/navigation'
import { storage } from '../utils/storage'
import WaveformIcon from '../components/WaveformIcon'

const initialMessages = {
  ko: "안녕하세요! 저는 정이노's Clone입니다. 무엇을 도와드릴까요?",
  en: "Hello! I'm Jeong Ino's Clone. How can I help you?",
  ja: "こんにちは！イノ's Cloneです。どのようにお手伝いできますか？",
  zh: "你好！我是Jeong Ino's Clone。我能为您做些什么？"
};

export default function ChatPage() {
  const router = useRouter()
  const { language } = useLanguage()
  const { isDarkMode } = useTheme()
  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    content: initialMessages[language as keyof typeof initialMessages] || initialMessages.ko,
    id: crypto.randomUUID()
  }]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [pdfContent, setPdfContent] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // localStorage에서 메시지 불러오기
  useEffect(() => {
    const savedMessages = storage.get('chatMessages');
    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages);
        if (Array.isArray(parsedMessages) && parsedMessages.length > 0) {
          setMessages(parsedMessages);
        }
      } catch (error) {
        console.error('메시지 파싱 오류:', error);
      }
    }
  }, []);

  // 언어 변경 시 첫 메시지 업데이트
  useEffect(() => {
    setMessages(prevMessages => {
      if (prevMessages.length === 0) {
        return [{
          role: 'assistant',
          content: initialMessages[language as keyof typeof initialMessages] || initialMessages.ko,
          id: crypto.randomUUID()
        }];
      }
      return prevMessages;
    });
  }, [language]);

  // 메시지가 변경될 때마다 localStorage 업데이트
  useEffect(() => {
    storage.set('chatMessages', JSON.stringify(messages));
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = { 
      role: 'user', 
      content: content,
      id: crypto.randomUUID()
    }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          messages: updatedMessages,
          pdfContent: pdfContent
        })
      });

      if (!response.ok) {
        throw new Error(translate('apiError', language));
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      const aiMessage: Message = { 
        role: 'assistant', 
        content: data.response,
        id: crypto.randomUUID()
      }
      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: translate(
          error instanceof Error ? error.message : 'chatError',
          language
        ),
        id: crypto.randomUUID()
      };
      setMessages(prev => [...prev, errorMessage])
    }
  }

  const clearMessages = () => {
    const initialMessage: Message = {
      role: 'assistant' as const,
      content: initialMessages[language as keyof typeof initialMessages] || initialMessages.ko,
      id: crypto.randomUUID()
    };
    setMessages([initialMessage]);
    storage.set('chatMessages', JSON.stringify([initialMessage]));
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      console.log('No file selected');
      return;
    }

    console.log('File details:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    const formData = new FormData();
    formData.append('file', file);

    try {
      console.log('Starting file upload...');
      const response = await fetch('/api/fileupload', {
        method: 'POST',
        body: formData,
      });

      console.log('Response details:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      if (!response.ok) {
        let errorMessage;
        try {
          const errorText = await response.text();
          console.error('Error response body:', errorText);
          errorMessage = errorText;
        } catch (textError) {
          console.error('Failed to read error response:', textError);
          errorMessage = response.statusText;
        }
        throw new Error(`Upload failed (${response.status}): ${errorMessage}`);
      }

      let data;
      try {
        data = await response.json();
        console.log('Success response data:', data);
      } catch (jsonError) {
        console.error('Failed to parse response as JSON:', jsonError);
        throw new Error('Invalid response format from server');
      }
      
      if (data.success) {
        setPdfContent(data.text);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `PDF 파일 "${data.filename}"이(가) 성공적으로 업로드되었습니다. 이제 파일 내용에 대해 질문해주세요.`,
          id: crypto.randomUUID()
        }]);
      } else {
        throw new Error(data.error || 'Upload failed without error message');
      }
    } catch (error) {
      console.error('File upload error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `파일 업로드 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
        id: crypto.randomUUID()
      }]);
    } finally {
      // Reset file input
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  // 메시지 컴포넌트에 고유한 키 생성
  const getMessageKey = (message: Message, index: number) => {
    // 다크모드 상태를 키에 포함시켜 상태 변경 시 컴포넌트가 다시 렌더링되도록 함
    return `${index}-${message.role}-${isDarkMode ? 'dark' : 'light'}`;
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col">
      <div className="fixed top-0 left-0 right-0 z-50 border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <Navigation language={language} />
      </div>

      <div className="max-w-3xl mx-auto shadow-sm w-full flex-1 pt-24 flex flex-col">
        <header className="flex items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Link href="/" className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2">
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              <span className="text-gray-600 dark:text-gray-300">Back</span>
            </Link>
          </div>
          <div className="flex-1 flex flex-col items-center">
            <div className="w-16 h-16 relative rounded-full overflow-hidden mb-2">
              <Image
                src="/profile.png"
                alt={translate('name', language)}
                fill
                sizes="(max-width: 768px) 64px, 96px"
                className="rounded-full object-cover object-top w-auto h-auto" 
                priority
              />
            </div>
            <span className="text-lg font-medium text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-400">{translate('name', language)}{translate('cloneTitle', language)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/voice-chat"
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Voice Chat"
              title={translate('voiceChat', language)}
            >
              <WaveformIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </Link>
            <button
              onClick={clearMessages}
              className={`p-2 rounded-full ${
                isDarkMode 
                  ? 'hover:bg-gray-700 text-white' 
                  : 'hover:bg-gray-100 text-gray-900'
              }`}
              aria-label="Clear chat history"
              title={translate('clearChat', language) || "채팅 내역 비우기"}
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".pdf"
              className="hidden"
            />
          </div>
        </header>

        <div className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <ChatMessage key={getMessageKey(message, index)} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 p-4 sticky bottom-0 bg-white dark:bg-gray-900">
          <ChatInput onSendMessage={handleSendMessage} placeholder={translate('chatInputPlaceholder', language)} isDarkMode={isDarkMode} />
        </div>
      </div>
    </div>
  )
}