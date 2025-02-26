'use client'

import { useState, useMemo } from 'react'
import SophisticatedButton from './SophisticatedButton'
import { useLanguage } from '../hooks/useLanguage'

type YearHistory = {
  [key: string]: string[]
}

type HistoryByLanguage = {
  [key: string]: YearHistory
}

export default function Career() {
  const [isExpanded, setIsExpanded] = useState(false)
  const { language } = useLanguage()

  const fullHistory: HistoryByLanguage = useMemo(() => ({
    ko: {
      "2025": [
        "추가 예정"
      ],
      "2024": [
        "추가 예정"
      ],
      "2023": [
        "추가 예정"
      ],
      "2022": [
        "추가 예정"
      ],
      "2021": [
        "추가 예정"
      ]
    },
    en: {
      "2025": [
        "추가 예정"
      ],
      "2024": [
        "추가 예정"
      ],
      "2023": [
        "추가 예정"
      ],
      "2022": [
        "추가 예정"
      ],
      "2021": [
        "추가 예정"
      ]
    },
    ja: {
      "2025": [
        "추가 예정"
      ],
      "2024": [
        "추가 예정"
      ],
      "2023": [
        "추가 예정"
      ],
      "2022": [
        "추가 예정"
      ],
      "2021": [
        "추가 예정"
      ]
    },
    zh: {
      "2025": [
        "추가 예정"
      ],
      "2024": [
        "추가 예정"
      ],
      "2023": [
        "추가 예정"
      ],
      "2022": [
        "추가 예정"
      ],
      "2021": [
        "추가 예정"
      ]
    }
  }), [])

  const currentHistory = useMemo(() => {
    return fullHistory[language] || fullHistory['ko']
  }, [language, fullHistory])

  const years = useMemo(() => {
    return Object.keys(currentHistory).sort((a, b) => parseInt(b) - parseInt(a))
  }, [currentHistory])

  const displayedYears = useMemo(() => {
    return isExpanded ? years : years.filter(year => parseInt(year) >= 2024)
  }, [isExpanded, years])

  return (
    <section className="mb-4 px-4 md:px-6 lg:px-8" role="region" aria-label="경력 사항">
      <div className="space-y-6">
        {displayedYears.map((year, index) => (
          <div 
            key={year} 
            className={`pb-4 ${index !== displayedYears.length - 1 ? 'border-b border-gray-200' : ''}`}
            role="article"
            aria-labelledby={`year-${year}`}
          >
            <h3 
              id={`year-${year}`}
              className="text-2xl md:text-3xl font-bold text-blue-600 mb-3"
            >
              {year}
            </h3>
            <ul className="space-y-2 text-sm md:text-base" role="list">
              {currentHistory[year]?.map((item: string, index: number) => (
                <li 
                  key={index} 
                  className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
                  role="listitem"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="flex justify-center mt-6">
        <SophisticatedButton 
          expanded={isExpanded} 
          onClick={() => setIsExpanded(!isExpanded)} 
          language={language}
          aria-expanded={isExpanded}
          aria-controls="career-history"
        />
      </div>
    </section>
  )
}