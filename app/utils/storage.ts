/**
 * 안전한 로컬스토리지 접근을 위한 유틸리티
 * SSR 환경에서도 안전하게 사용할 수 있습니다.
 */
export const storage = {
  get: (key: string): string | null => {
    if (typeof window === 'undefined') return null
    try {
      return localStorage.getItem(key)
    } catch (error) {
      console.error('로컬스토리지 접근 오류:', error)
      return null
    }
  },
  set: (key: string, value: string): void => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(key, value)
    } catch (error) {
      console.error('로컬스토리지 저장 오류:', error)
    }
  },
  remove: (key: string): void => {
    if (typeof window === 'undefined') return
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error('로컬스토리지 삭제 오류:', error)
    }
  }
} 