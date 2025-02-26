export interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp?: number
  isLoading?: boolean
}   