'use client'

import { useState, useRef, useEffect } from 'react'
import { Search as SearchIcon, Loader2, Trash2 } from 'lucide-react'
import { Language, translate } from '../utils/translations'

interface SearchProps {
  language: Language
  className?: string
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export default function Search({ language, className = '' }: SearchProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [error, setError] = useState<string | null>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // 채팅창 스크롤을 하단으로 이동
  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  // 메시지가 추가될 때마다 스크롤
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchTerm.trim()) return

    setIsLoading(true)
    setError(null)

    // 사용자 메시지 추가
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: searchTerm.trim(),
      timestamp: Date.now()
    }
    setMessages(prev => [...prev, userMessage])
    setSearchTerm('')

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: userMessage.content }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '오류가 발생했습니다.')
      }

      if (data.results?.[0]) {
        // AI 응답 메시지 추가
        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.results[0].text || '',
          timestamp: Date.now()
        }
        setMessages(prev => [...prev, assistantMessage])
      }
    } catch (err) {
      console.error('Error:', err)
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // 메시지 시간 포맷팅
  const formatTime = (timestamp: number) => {
    return new Intl.DateTimeFormat('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(new Date(timestamp))
  }

  // 채팅 내역 초기화 함수
  const clearMessages = () => {
    setMessages([]);
    setError(null);
  };

  return (
    <div className="flex flex-col h-[400px] max-w-lg mx-auto bg-gray-50 dark:bg-gray-900 rounded-lg shadow-lg">
      {/* 헤더 영역 */}
      <div className="flex justify-end items-center px-3 py-1.5 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={clearMessages}
          className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-[#EA0029] dark:hover:text-[#EA0029] transition-colors duration-75"
          title={translate('clearChat', language)}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* 채팅 메시지 영역 */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-3 space-y-3"
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-lg p-2.5 ${
                message.role === 'user'
                  ? 'bg-[#EA0029] text-white ml-3'
                  : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 mr-3'
              }`}
            >
              <div className="flex flex-col">
                <div className={`whitespace-pre-line text-sm ${
                  message.role === 'user'
                    ? 'text-white'
                    : 'text-gray-800 dark:text-gray-200'
                }`}>
                  {message.content}
                </div>
                <div className={`text-[10px] mt-1 text-right ${
                  message.role === 'user'
                    ? 'text-gray-100'
                    : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {formatTime(message.timestamp)}
                </div>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-2.5 border border-gray-200 dark:border-gray-700 mr-3">
              <div className="flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#EA0029]" />
                <span className="text-xs text-gray-600 dark:text-gray-300">
                  {translate('thinking', language)}
                </span>
              </div>
            </div>
          </div>
        )}
        {error && (
          <div className="flex justify-center">
            <div className="bg-red-50 dark:bg-red-900/10 text-red-500 rounded-lg p-2.5 text-xs">
              {error}
            </div>
          </div>
        )}
      </div>

      {/* 입력 영역 */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={translate('chatInputPlaceholder', language)}
            className="w-full px-4 py-1.5 pl-9 pr-16 text-sm text-gray-900 placeholder-gray-500 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EA0029] focus:border-transparent dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:border-gray-600"
          />
          <SearchIcon className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <button
            type="submit"
            disabled={isLoading || !searchTerm.trim()}
            className={`absolute right-1.5 top-1/2 transform -translate-y-1/2 px-3 py-1 text-xs font-medium text-white rounded-md transition-all duration-75 min-w-[60px] group disabled:opacity-50 ${
              searchTerm.trim() && !isLoading
                ? 'bg-[#EA0029] hover:bg-[#FF1F4B]'
                : 'bg-gray-400'
            }`}
          >
            <span className="group-hover:scale-105 transition-transform duration-200">
              {translate('send', language)}
            </span>
          </button>
        </form>
      </div>
    </div>
  )
} 