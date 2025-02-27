'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { storage } from '../utils/storage'

interface ThemeContextType {
  isDarkMode: boolean
  toggleDarkMode: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    // 항상 라이트모드로 시작
    setIsDarkMode(false)
    storage.set('darkMode', 'false')
    setIsInitialized(true)
  }, [])

  useEffect(() => {
    if (isInitialized) {
      if (isDarkMode) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  }, [isDarkMode, isInitialized])

  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const newMode = !prev
      storage.set('darkMode', String(newMode))
      return newMode
    })
  }

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
} 