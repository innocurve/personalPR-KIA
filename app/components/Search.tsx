'use client'

import { useState } from 'react'
import { Search as SearchIcon, Loader2 } from 'lucide-react'
import { Language, translate } from '../utils/translations'

interface SearchProps {
  language: Language
  className?: string
}

interface SearchResult {
  text: string
  url?: string | null
  title?: string
  sources?: string[]
  additionalInfo?: string
}

export default function Search({ language, className = '' }: SearchProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchTerm.trim()) return

    setIsLoading(true)
    setError(null)
    setHasSearched(true)

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: searchTerm }),
      })

      const data = await response.json()
      console.log('Search response:', data) // 디버깅용 로그

      if (!response.ok) {
        throw new Error(data.error || '검색 중 오류가 발생했습니다.')
      }

      // API 응답 구조에 맞게 결과 처리
      if (data.results?.[0]) {
        const result = data.results[0];
        setResults([{
          title: translate('searchResult', language),
          text: result.text || '',
          sources: result.sources || [],
          additionalInfo: result.additionalInfo || '',
          url: result.url
        }])
      } else {
        setResults([])
      }
    } catch (err) {
      console.error('Search error:', err) // 디버깅용 로그
      setError(err instanceof Error ? err.message : '검색 중 오류가 발생했습니다.')
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={`${results.length > 0 ? 'min-h-[400px] pt-8' : 'min-h-[100px]'} ${className}`}>
      <form onSubmit={handleSearch} className="relative mb-6">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={translate('searchPlaceholder', language)}
            className="w-full px-4 py-2 pl-10 pr-20 text-gray-900 placeholder-gray-500 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EA0029] focus:border-transparent dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 dark:border-gray-700"
          />
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-1.5 text-sm font-medium text-white bg-[#EA0029] rounded-md hover:bg-[#C8002B] transition-all duration-200 min-w-[80px] group disabled:opacity-50 disabled:hover:bg-[#EA0029]"
        >
          <span className="group-hover:scale-105 transition-transform duration-200">
            {translate('search', language)}
          </span>
        </button>
      </form>

      <div className="relative min-h-[100px]">
        {error && (
          <div className="text-red-500 text-center mb-4 p-4 bg-red-50 dark:bg-red-900/10 rounded-lg">
            {error}
          </div>
        )}

        {hasSearched && !isLoading && results.length === 0 && !error && (
          <div className="text-center text-gray-500 dark:text-gray-400 mt-4">
            {translate('noResults', language)}
          </div>
        )}

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-10 rounded-lg">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#EA0029]" />
              <span className="text-gray-600 dark:text-gray-300 font-medium">
                {translate('searching', language)}
              </span>
            </div>
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-6">
            {results.map((result, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700"
              >
                {result.title && (
                  <h3 className="text-xl font-semibold mb-4 text-[#05141F] dark:text-white">
                    {result.title}
                  </h3>
                )}
                <p className="text-gray-600 dark:text-gray-300 whitespace-pre-line text-base leading-relaxed mb-4 break-words">
                  {result.text}
                </p>
                {result.sources && result.sources.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      {translate('sources', language)}:
                    </h4>
                    <ul className="list-none space-y-1">
                      {result.sources.map((source, idx) => (
                        <li key={idx} className="text-sm text-blue-600 dark:text-blue-400">
                          <a 
                            href={source} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="hover:underline break-all inline-block max-w-full overflow-hidden text-ellipsis"
                          >
                            {new URL(source).hostname}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {result.additionalInfo && (
                  <div className="mt-6">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      {translate('additionalInfo', language)}:
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {result.additionalInfo}
                    </p>
                  </div>
                )}
                {result.url && (
                  <a
                    href={result.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#EA0029] hover:text-[#C8002B] text-sm mt-4 inline-block font-medium"
                  >
                    {translate('readMore', language)} →
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 