'use client'

import { useState, useEffect, useRef } from 'react'
import { Message } from './ChatInput'
import { Volume2, VolumeX, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAudio } from '@/app/contexts/AudioContext'
import { usePathname, useSearchParams, useRouter } from 'next/navigation'

// 오디오 캐시를 위한 Map 객체
const audioCache = new Map<string, { blob: Blob; timestamp: number }>()

// 캐시 만료 시간 (1시간)
const CACHE_EXPIRY = 60 * 60 * 1000

interface ChatMessageProps {
  message: Message
  isDarkMode?: boolean
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isDarkMode }) => {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const prevPathnameRef = useRef<string | null>(null)
  
  // 로컬 상태
  const [isLoading, setIsLoading] = useState(false)
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  
  // 전역 오디오 상태
  const { 
    playingMessageId, 
    isProcessing, 
    setPlayingMessageId, 
    setIsProcessing 
  } = useAudio()

  // 현재 메시지가 재생 중인지 확인
  const isThisMessagePlaying = playingMessageId === message.id

  // 다른 메시지가 재생 중인지 확인
  const isOtherMessagePlaying = playingMessageId !== null && playingMessageId !== message.id

  // 토스트 ID 참조
  const toastIdRef = useRef<string | number | null>(null)
  // 타임아웃 ID 참조
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null)
  // 현재 재생 중인 메시지 ID 참조
  const currentPlayingIdRef = useRef<string | null>(null)

  // 전역 상태 변경 시 로컬 참조 업데이트
  useEffect(() => {
    currentPlayingIdRef.current = playingMessageId
    console.log('전역 상태 변경 감지: playingMessageId =', playingMessageId, 'currentPlayingIdRef =', currentPlayingIdRef.current)
  }, [playingMessageId])

  // 컴포넌트 언마운트 시 오디오 리소스 정리
  useEffect(() => {
    return () => {
      cleanupAudio()
    }
  }, [])

  // 페이지 이동 감지를 위한 useEffect
  useEffect(() => {
    const handleRouteChange = () => {
      console.log('라우트 변경 감지')
      if (audio && !audio.paused) {
        cleanupAudio()
      }
    }

    // 페이지 변경 감지
    if (prevPathnameRef.current !== null && prevPathnameRef.current !== pathname) {
      console.log('페이지 변경 감지: 오디오 정리')
      handleRouteChange()
    }
    prevPathnameRef.current = pathname

    // 브라우저 네비게이션 이벤트
    window.addEventListener('popstate', handleRouteChange)
    
    // 페이지 숨김/표시 이벤트
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && audio && !audio.paused) {
        cleanupAudio()
      }
    })

    return () => {
      window.removeEventListener('popstate', handleRouteChange)
    }
  }, [pathname, searchParams, audio])

  // 동기적인 오디오 정리를 위한 useEffect
  useEffect(() => {
    const stopAudioSync = () => {
      if (audio) {
        console.log('페이지 닫힘 감지: 즉시 오디오 중지')
        try {
          audio.pause()
          audio.currentTime = 0
          audio.src = ''
          setAudio(null)
        } catch (error) {
          console.error('동기적 오디오 정리 중 오류:', error)
        }
      }
    }

    window.addEventListener('beforeunload', stopAudioSync)
    window.addEventListener('pagehide', stopAudioSync)
    window.addEventListener('unload', stopAudioSync)

    return () => {
      window.removeEventListener('beforeunload', stopAudioSync)
      window.removeEventListener('pagehide', stopAudioSync)
      window.removeEventListener('unload', stopAudioSync)
    }
  }, [audio])

  // 링크 클릭 감지를 위한 useEffect
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const linkElement = target.tagName === 'A' ? target : target.closest('a')
      
      if (linkElement && audio && !audio.paused) {
        console.log('링크 클릭 감지: 오디오 즉시 정리')
        e.preventDefault()
        cleanupAudio()
        // 약간의 지연 후 네비게이션 진행
        setTimeout(() => {
          const href = linkElement.getAttribute('href')
          if (href) {
            router.push(href)
          }
        }, 50)
      }
    }
    
    // 캡처링 단계에서 이벤트 처리
    window.addEventListener('click', handleClick, true)

    return () => {
      window.removeEventListener('click', handleClick, true)
    }
  }, [audio, router])

  // 컴포넌트 언마운트 시 오디오 리소스 정리
  useEffect(() => {
    return () => {
      console.log('컴포넌트 언마운트: 오디오 정리')
      if (audio && !audio.paused) {
        cleanupAudio()
      }
    }
  }, [audio])

  // 오디오 리소스 정리 함수
  const cleanupAudio = () => {
    console.log('오디오 리소스 정리 시작')
    
    // 즉시 실행되어야 하는 정리 작업
    const cleanup = () => {
      if (audio) {
        try {
          // 1. 먼저 재생 중지
          audio.pause()
          
          // 2. 이벤트 리스너 제거
          audio.onended = null
          audio.oncanplaythrough = null
          audio.onloadeddata = null
          audio.onloadedmetadata = null
          audio.onerror = null
          
          // 3. 오디오 리소스 해제
          audio.src = ''
          audio.load()
          
          // 4. 상태 초기화
          setAudio(null)
          if (audioUrl) {
            URL.revokeObjectURL(audioUrl)
            setAudioUrl(null)
            setAudioBlob(null)
          }
          
          // 5. 전역 상태 초기화
          if (isThisMessagePlaying) {
            setPlayingMessageId(null)
            setIsProcessing(false)
          }
          setIsLoading(false)
          
          // 6. 토스트 정리
          if (toastIdRef.current) {
            toast.dismiss(toastIdRef.current)
            toastIdRef.current = null
          }
          
          // 7. 타임아웃 정리
          if (timeoutIdRef.current) {
            clearTimeout(timeoutIdRef.current)
            timeoutIdRef.current = null
          }
        } catch (error) {
          console.error('오디오 정리 중 오류:', error)
        }
      }
    }
    
    // 즉시 실행
    cleanup()
    
    console.log('오디오 리소스 정리 완료')
  }

  // 캐시에서 오디오 가져오기
  const getAudioFromCache = (text: string) => {
    console.log('캐시에서 오디오 확인 중:', text.substring(0, 20) + '...')
    const cached = audioCache.get(text)
    if (!cached) {
      console.log('캐시에 오디오 없음')
      return null
    }

    // 캐시 만료 확인
    if (Date.now() - cached.timestamp > CACHE_EXPIRY) {
      console.log('캐시된 오디오 만료됨')
      audioCache.delete(text)
      return null
    }

    console.log('캐시에서 오디오 찾음')
    return cached.blob
  }

  // 오디오 재생 시작
  const startPlayback = (newAudio: HTMLAudioElement, toastId: string | number, currentMessageId: string) => {
    try {
      console.log('오디오 재생 시작 시도')
      
      // 타임아웃 정리
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current)
        timeoutIdRef.current = null
      }
      
      // 재생 시작 전 로딩 상태 확인
      if (currentMessageId !== message.id && currentPlayingIdRef.current !== message.id) {
        console.log('재생 시작 전 메시지 ID가 변경됨, 재생 취소')
        setIsLoading(false)
        setIsProcessing(false)
        toast.dismiss(toastId)
        return
      }
      
      // 전역 상태 확인
      if (playingMessageId === null) {
        console.log('재생 시작 전 playingMessageId가 null임, 상태 복구 시도')
        setPlayingMessageId(message.id)
      }
      
      // 오디오 볼륨 설정
      newAudio.volume = 1.0
      
      console.log('오디오 재생 직접 시작')
      
      // 로딩 상태 해제 (재생 시작 전)
      setIsLoading(false)
      toast.dismiss(toastId)
      
      const playPromise = newAudio.play()
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('오디오 재생 시작됨')
            // 재생이 시작되면 로딩 상태를 확실히 해제
            setIsLoading(false)
          })
          .catch(error => {
            console.error('오디오 재생 Promise 오류:', error)
            toast.error('오디오 재생을 시작할 수 없습니다', {
              className: 'dark-toast toast-error'
            })
            setPlayingMessageId(null)
            setIsProcessing(false)
            setIsLoading(false)
          })
      } else {
        // play() 메서드가 Promise를 반환하지 않는 경우 (구형 브라우저)
        console.log('오디오 재생이 Promise를 반환하지 않음 (구형 브라우저)')
        // 구형 브라우저에서도 로딩 상태 해제
        setIsLoading(false)
      }
    } catch (error) {
      console.error('오디오 재생 오류:', error)
      toast.error('오디오 재생 중 오류가 발생했습니다', {
        className: 'dark-toast toast-error'
      })
      setPlayingMessageId(null)
      setIsProcessing(false)
      setIsLoading(false)
    }
  }

  // 오디오 객체 생성 및 이벤트 핸들러 설정
  const setupAudioObject = (blob: Blob, toastId: string | number, currentMessageId: string) => {
    console.log('오디오 객체 설정 시작, Blob 크기:', blob.size, 'currentPlayingIdRef =', currentPlayingIdRef.current)
    
    // 이전 오디오 객체 정리
    if (audio) {
      audio.pause()
      audio.onended = null
      audio.oncanplaythrough = null
      audio.onloadeddata = null
      audio.onloadedmetadata = null
      audio.onerror = null
    }
    
    // 이전 URL 정리
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
    }
    
    // 새 URL 생성
    const newAudioUrl = URL.createObjectURL(blob)
    console.log('새 오디오 URL 생성:', newAudioUrl)
    
    // 새 오디오 객체 생성
    const newAudio = new Audio()
    
    // 재생 준비 완료 이벤트
    let playbackStarted = false
    const safeStartPlayback = () => {
      console.log('safeStartPlayback 호출됨, playbackStarted:', playbackStarted, 'currentMessageId:', currentMessageId, 'message.id:', message.id, 'currentPlayingIdRef:', currentPlayingIdRef.current)
      if (!playbackStarted && (currentMessageId === message.id || currentPlayingIdRef.current === message.id)) {
        console.log('안전한 재생 시작 호출됨')
        playbackStarted = true
        startPlayback(newAudio, toastId, currentMessageId)
      } else {
        console.log('재생 시작 조건 불충족: playbackStarted =', playbackStarted, 'currentMessageId =', currentMessageId, 'message.id =', message.id, 'currentPlayingIdRef =', currentPlayingIdRef.current)
        
        // 재생이 이미 시작되었지만 로딩 상태가 남아있는 경우 정리
        if (playbackStarted && isLoading) {
          console.log('재생이 이미 시작되었지만 로딩 상태가 남아있어 정리')
          setIsLoading(false)
          toast.dismiss(toastId)
        }
      }
    }
    
    // 이벤트 핸들러 설정
    newAudio.onended = () => {
      console.log('오디오 재생 완료')
      setPlayingMessageId(null)
      setIsProcessing(false)
      setIsLoading(false) // 재생 완료 시 로딩 상태 확실히 해제
    }
    
    newAudio.onerror = (e) => {
      console.error('오디오 재생 오류:', e)
      console.error('오디오 오류 코드:', newAudio.error ? newAudio.error.code : '알 수 없음')
      console.error('오디오 오류 메시지:', newAudio.error ? newAudio.error.message : '알 수 없음')
      setPlayingMessageId(null)
      setIsProcessing(false)
      setIsLoading(false)
      toast.dismiss(toastId)
      toast.error(`오디오 재생 중 오류가 발생했습니다: ${newAudio.error?.message || '알 수 없는 오류'}`, {
        className: 'dark-toast toast-error'
      })
    }
    
    newAudio.oncanplaythrough = () => {
      console.log('오디오 재생 준비 완료 (canplaythrough)')
      safeStartPlayback()
    }
    
    newAudio.onloadeddata = () => {
      console.log('오디오 데이터 로드됨 (loadeddata)')
      safeStartPlayback()
    }
    
    newAudio.onloadedmetadata = () => {
      console.log('오디오 메타데이터 로드됨 (loadedmetadata), 길이:', newAudio.duration)
    }
    
    // 상태 업데이트
    setAudioUrl(newAudioUrl)
    setAudio(newAudio)
    setAudioBlob(blob)
    
    // 오디오 소스 설정 및 로드 시작
    console.log('오디오 소스 설정 전')
    newAudio.src = newAudioUrl
    newAudio.playbackRate = 1.0
    console.log('오디오 소스 설정 완료')
    
    // 로드 시작
    console.log('오디오 로드 시작')
    newAudio.load()
    
    // 백업 타이머: 모든 이벤트가 실패해도 3초 후 재생 시도
    const backupTimerId = setTimeout(() => {
      console.log('백업 타이머 실행됨, playbackStarted:', playbackStarted, 'isLoading:', isLoading, 'currentMessageId:', currentMessageId, 'currentPlayingIdRef:', currentPlayingIdRef.current)
      if (isLoading && (currentMessageId === message.id || currentPlayingIdRef.current === message.id) && !playbackStarted) {
        console.log('백업 타이머로 재생 시도 (3초)')
        safeStartPlayback()
      } else {
        console.log('백업 타이머 조건 불충족: isLoading =', isLoading, 'currentMessageId =', currentMessageId, 'message.id =', message.id, 'playbackStarted =', playbackStarted, 'currentPlayingIdRef =', currentPlayingIdRef.current)
        
        // 로딩 상태가 남아있는 경우 정리
        if (isLoading && (currentMessageId === message.id || currentPlayingIdRef.current === message.id)) {
          console.log('백업 타이머에서 로딩 상태 정리')
          setIsLoading(false)
          toast.dismiss(toastId)
        }
      }
    }, 3000)
    
    // 최대 타임아웃 설정 (10초)
    const maxTimeoutId = setTimeout(() => {
      if (isLoading && (currentMessageId === message.id || currentPlayingIdRef.current === message.id)) {
        console.log('오디오 로딩 최대 타임아웃 (10초)')
        toast.dismiss(toastId)
        toast.error('오디오 로딩 시간이 초과되었습니다', {
          className: 'dark-toast toast-error'
        })
        setIsLoading(false)
        setIsProcessing(false)
        setPlayingMessageId(null)
        
        // 백업 타이머 정리
        clearTimeout(backupTimerId)
      }
    }, 10000)
    
    // 타임아웃 ID 저장
    timeoutIdRef.current = maxTimeoutId
    
    // 강제 재생 시도 (1초 후)
    setTimeout(() => {
      if (isLoading && (currentMessageId === message.id || currentPlayingIdRef.current === message.id) && !playbackStarted) {
        console.log('1초 후 강제 재생 시도')
        safeStartPlayback()
      }
    }, 1000)
    
    // 즉시 재생 시도 (상태 업데이트 후)
    setTimeout(() => {
      console.log('즉시 재생 시도 (상태 업데이트 후), currentPlayingIdRef:', currentPlayingIdRef.current)
      safeStartPlayback()
    }, 0)
  }

  // TTS 재생 함수
  const playTTS = async () => {
    console.log('playTTS 함수 호출됨, 메시지 ID:', message.id)
    
    // 현재 메시지가 재생 중이고 로딩 중이 아닐 때만 중지 가능
    if (isThisMessagePlaying && !isLoading) {
      console.log('현재 메시지 재생 중지')
      cleanupAudio()
      setIsLoading(false)  // 로딩 상태 초기화 추가
      return
    }
    
    // 로딩 중이면 작업 불가
    if (isLoading) {
      console.log('음성 변환 중이므로 작업 불가')
      return
    }
    
    // 다른 메시지가 재생 중이거나 처리 중이면 중복 실행 방지
    if (isOtherMessagePlaying || (isProcessing && !isThisMessagePlaying)) {
      console.log('다른 메시지 재생 중이거나 처리 중이므로 작업 불가')
      return
    }
    
    // 처리 시작
    console.log('재생 시작 전 상태: playingMessageId =', playingMessageId)
    setIsProcessing(true)
    setPlayingMessageId(message.id)
    setIsLoading(true)
    
    // 현재 메시지 ID를 로컬 변수와 참조에 저장 (상태 업데이트는 비동기적이므로)
    const currentMessageId = message.id
    currentPlayingIdRef.current = currentMessageId
    console.log('재생 시작: currentMessageId =', currentMessageId, 'currentPlayingIdRef =', currentPlayingIdRef.current)
    
    // 상태 업데이트 확인을 위한 즉시 실행 함수
    setTimeout(() => {
      console.log('상태 업데이트 확인: playingMessageId =', playingMessageId, 'currentPlayingIdRef =', currentPlayingIdRef.current)
    }, 0)
    
    try {
      // 토스트 메시지 표시
      const toastId = toast.loading('목소리 가다듬는 중...', {
        className: 'dark-toast toast-info'
      })
      toastIdRef.current = toastId
      
      // 이미 변환된 오디오가 있는 경우 (재생 중지 후 다시 재생)
      if (audioBlob) {
        console.log('이미 변환된 오디오 사용, Blob 크기:', audioBlob.size)
        setupAudioObject(audioBlob, toastId, currentMessageId)
        return
      }
      
      // 캐시에서 오디오 확인
      const cachedAudio = getAudioFromCache(message.content)
      
      if (cachedAudio) {
        console.log('캐시된 오디오 사용, Blob 크기:', cachedAudio.size)
        setupAudioObject(cachedAudio, toastId, currentMessageId)
      } else {
        console.log('API에서 오디오 가져오기 시작')
        // API 호출
        try {
          console.log('TTS API 요청 시작:', message.content.substring(0, 50) + '...')
          
          const response = await fetch('/api/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              text: message.content,
              voice_settings: {
                stability: 0.3,
                similarity_boost: 0.8,
              }
            }),
          })
          
          console.log('TTS API 응답 상태:', response.status)
          
          if (!response.ok) {
            let errorMessage = 'TTS 요청 실패'
            try {
              const errorData = await response.json()
              errorMessage = errorData.error || errorMessage
              console.error('TTS API 오류 응답:', errorData)
            } catch (e) {
              console.error('TTS API 오류 응답 파싱 실패:', e)
            }
            
            toast.dismiss(toastId)
            throw new Error(errorMessage)
          }
          
          console.log('TTS API 응답 성공, Blob 변환 시작')
          const contentType = response.headers.get('content-type')
          console.log('응답 Content-Type:', contentType)
          
          const newAudioBlob = await response.blob()
          console.log('응답 Blob 생성 완료, 크기:', newAudioBlob.size, 'type:', newAudioBlob.type)
          
          if (newAudioBlob.size === 0) {
            throw new Error('TTS API에서 빈 오디오 데이터가 반환되었습니다')
          }
          
          // 캐시에 저장
          audioCache.set(message.content, {
            blob: newAudioBlob,
            timestamp: Date.now()
          })
          
          console.log('오디오 캐시에 저장 완료')
          setupAudioObject(newAudioBlob, toastId, currentMessageId)
        } catch (apiError) {
          console.error('TTS API 호출 중 오류:', apiError)
          throw apiError
        }
      }
    } catch (error) {
      console.error('TTS 재생 오류:', error)
      toast.error(error instanceof Error ? error.message : 'TTS 재생 중 오류가 발생했습니다', {
        className: 'dark-toast toast-error'
      })
      setPlayingMessageId(null)
      setIsProcessing(false)
      setIsLoading(false)
    }
  }

  const isUser = message.role === 'user'
  
  // 버튼 비활성화 상태 계산
  const isButtonDisabled = isOtherMessagePlaying || (isProcessing && !isThisMessagePlaying) || (isLoading && isThisMessagePlaying)

  // 버튼 상태에 따른 아이콘 및 툴팁 결정
  const getButtonState = () => {
    if (isThisMessagePlaying && !isLoading) {
      return {
        icon: <VolumeX className="w-4 h-4" />,
        tooltip: '음성 중지',
        disabled: false
      }
    }
    
    if (isLoading && isThisMessagePlaying) {
      return {
        icon: <Loader2 className="w-4 h-4 animate-spin" />,
        tooltip: '음성 변환 중...',
        disabled: true // 로딩 중에는 클릭 불가능하도록 변경
      }
    }
    
    if (isOtherMessagePlaying) {
      return {
        icon: <Volume2 className="w-4 h-4" />,
        tooltip: '다른 메시지 재생 중',
        disabled: true
      }
    }
    
    if (isProcessing && !isThisMessagePlaying) {
      return {
        icon: <Volume2 className="w-4 h-4" />,
        tooltip: '오디오 처리 중',
        disabled: true
      }
    }
    
    return {
      icon: <Volume2 className="w-4 h-4" />,
      tooltip: '음성으로 듣기',
      disabled: false
    }
  }
  
  const buttonState = getButtonState()

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-lg px-4 py-2 ${
          isUser
            ? 'bg-blue-500 text-white'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
        }`}
      >
        <div className="flex items-start gap-2">
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
          {message.role === 'assistant' && (
            <button
              onClick={playTTS}
              disabled={buttonState.disabled}
              className={`ml-2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 ${
                buttonState.disabled 
                  ? 'cursor-not-allowed opacity-50' 
                  : ''
              } ${
                isLoading && isThisMessagePlaying
                  ? 'cursor-not-allowed opacity-50 pointer-events-none'
                  : ''
              }`}
              title={buttonState.tooltip}
            >
              {buttonState.icon}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ChatMessage