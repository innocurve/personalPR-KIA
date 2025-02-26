'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'

interface AudioContextType {
  playingMessageId: string | null
  isProcessing: boolean
  setPlayingMessageId: (id: string | null) => void
  setIsProcessing: (isProcessing: boolean) => void
}

const AudioContext = createContext<AudioContextType | undefined>(undefined)

export const AudioProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  return (
    <AudioContext.Provider
      value={{
        playingMessageId,
        isProcessing,
        setPlayingMessageId,
        setIsProcessing
      }}
    >
      {children}
    </AudioContext.Provider>
  )
}

export const useAudio = (): AudioContextType => {
  const context = useContext(AudioContext)
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider')
  }
  return context
} 