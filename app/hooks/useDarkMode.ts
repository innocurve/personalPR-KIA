'use client'

import { useTheme } from '../contexts/ThemeContext'

// 기존 코드와의 호환성을 위해 동일한 인터페이스 유지
export function useDarkMode() {
  return useTheme()
} 