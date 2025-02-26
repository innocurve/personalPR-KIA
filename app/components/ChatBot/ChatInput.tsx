'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Mic, MicOff, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAudio } from '@/app/contexts/AudioContext'
import { useLanguage } from '@/app/contexts/LanguageContext'
import { translate } from '@/app/utils/translations'

export interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp?: number
  id: string
}

interface ChatInputProps {
  onSendMessage: (message: string) => void
  placeholder?: string
  isDarkMode?: boolean
  isVoiceMode?: boolean
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  placeholder = '메시지를 입력하세요...',
  isDarkMode,
  isVoiceMode,
}) => {
  const { language } = useLanguage()
  const [message, setMessage] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [isLocalProcessing, setIsLocalProcessing] = useState(false)
  const [audioLevel, setAudioLevel] = useState<number>(0)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const animationFrameRef = useRef<number | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const microphoneStreamRef = useRef<MediaStream | null>(null)
  const recordingStartRef = useRef<number | null>(null)
  const mimeTypeRef = useRef<string>('audio/webm')
  
  const { isProcessing, setIsProcessing } = useAudio()

  // 음성 검증을 위한 무효한 구문 목록 추가
  const invalidPhrases = [
    '끝',
    '완성',
    'MBC 뉴스 이덕영입니다.'
  ];

  // 텍스트 검증 함수
  const validateText = (text: string): string | null => {
    // 1. 빈 텍스트 체크
    if (!text?.trim()) {
      return null;
    }

    // 2. 너무 짧은 텍스트 체크
    if (text.trim().length < 2) {
      return null;
    }

    // 3. 의미 없는 텍스트 체크
    if (invalidPhrases.some(phrase => 
      text.toLowerCase().includes(phrase.toLowerCase())
    )) {
      return null;
    }

    return text.trim();
  };

  // 텍스트 입력 제출 처리
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim()) {
      onSendMessage(message.trim())
      setMessage('')
    }
  }

  // 음성 데이터 처리 (STT API 호출)
  const processAudio = async (audioBlob: Blob) => {
    try {
      setIsLocalProcessing(true)
      
      // MIME 타입에 따른 파일 확장자 결정
      const fileExtension = audioBlob.type.includes('wav') 
        ? 'wav' 
        : audioBlob.type.includes('mp3') 
          ? 'mp3' 
          : 'webm';
      
      const fileName = `recording.${fileExtension}`;
      console.log('STT API 요청 파일:', { name: fileName, type: audioBlob.type, size: audioBlob.size });
      
      const formData = new FormData()
      formData.append('audio', audioBlob, fileName)

      const response = await fetch('/api/stt', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('음성 변환에 실패했습니다.')
      }

      const data = await response.json()
      
      // 음성 인식 결과 검증
      const validatedText = data.text ? validateText(data.text) : null;
      
      if (validatedText) {
        onSendMessage(validatedText)
        toast.success('음성 인식이 완료되었습니다')
      } else {
        // 음성이 인식되지 않았거나 유효하지 않은 텍스트인 경우
        toast.error('음성이 감지되지 않았습니다.')
      }
    } catch (error) {
      console.error('음성 처리 오류:', error)
      toast.error('음성을 텍스트로 변환하는 중 오류가 발생했습니다.')
    } finally {
      setIsLocalProcessing(false)
    }
  }

  // 녹음 관련 리소스 정리
  const cleanupRecording = () => {
    // 상태 초기화
    setIsRecording(false)
    setIsLocalProcessing(false)
    setAudioLevel(0)
    
    // 애니메이션 프레임 정리
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    
    // 오디오 컨텍스트 정리
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(err => console.error('오디오 컨텍스트 정리 오류:', err))
      audioContextRef.current = null
    }
    
    // 마이크 스트림 정리
    if (microphoneStreamRef.current) {
      microphoneStreamRef.current.getTracks().forEach(track => track.stop())
      microphoneStreamRef.current = null
    }
    
    // 미디어 레코더 정리
    mediaRecorderRef.current = null
    
    // 녹음 데이터 정리
    chunksRef.current = []
    
    // 녹음 시작 시간 정리
    recordingStartRef.current = null
  }

  // 음성 녹음 시작
  const startRecording = async () => {
    // 이미 녹음 중이면 무시
    if (isRecording || isLocalProcessing) return
    
    try {
      // 기존 녹음 리소스 정리
      cleanupRecording()
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      microphoneStreamRef.current = stream

      // 지원되는 MIME 타입 확인
      const mimeType = MediaRecorder.isTypeSupported('audio/wav') 
        ? 'audio/wav' 
        : MediaRecorder.isTypeSupported('audio/mp3')
          ? 'audio/mp3'
          : MediaRecorder.isTypeSupported('audio/webm')
            ? 'audio/webm'
            : 'audio/webm;codecs=opus';
      
      console.log('사용할 MIME 타입:', mimeType);
      mimeTypeRef.current = mimeType;
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType
      })
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []
      
      // 오디오 컨텍스트 및 분석기 설정 (음성 레벨 표시용)
      const audioContext = new AudioContext()
      audioContextRef.current = audioContext
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      analyserRef.current = analyser

      const updateAudioLevel = () => {
        if (!isRecording) return
        const dataArray = new Uint8Array(analyser.frequencyBinCount)
        analyser.getByteFrequencyData(dataArray)
        const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length
        setAudioLevel(average)
        animationFrameRef.current = requestAnimationFrame(updateAudioLevel)
      }
      
      // 데이터 수집 이벤트 핸들러 설정
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      // 녹음 중지 이벤트 핸들러 설정
      mediaRecorder.onstop = async () => {
        // 마지막 데이터 조각이 모두 수집될 수 있도록 약간의 지연 추가
        setTimeout(async () => {
          try {
            if (chunksRef.current.length === 0) {
              toast.error('녹음된 데이터가 없습니다. 다시 시도해 주세요.');
              cleanupRecording();
              return;
            }
            
            // 올바른 MIME 타입으로 Blob 생성
            const audioBlob = new Blob(chunksRef.current, { type: mimeTypeRef.current });
            console.log('생성된 오디오 Blob:', { size: audioBlob.size, type: audioBlob.type });
            
            if (audioBlob.size === 0) {
              toast.error('녹음된 데이터가 없습니다. 다시 시도해 주세요.');
              cleanupRecording();
              return;
            }
            
            await processAudio(audioBlob);
          } catch (error) {
            console.error('녹음 처리 오류:', error);
            toast.error('녹음 처리 중 오류가 발생했습니다.');
          } finally {
            cleanupRecording();
          }
        }, 300); // 300ms 지연
      };
      
      // 녹음 시작 시간 기록 - 실제 녹음 시작 직전에 설정
      recordingStartRef.current = Date.now()
      
      // 상태 업데이트를 먼저 하고 녹음 시작
      setIsRecording(true)
      setIsLocalProcessing(false) // 녹음 시작 시 처리 중 상태 확실히 해제
      
      // 녹음 시작 - 타임슬라이스를 더 짧게 설정하여 짧은 녹음에도 데이터가 수집되도록 함
      mediaRecorder.start(100) // 100ms마다 데이터 수집
      
      // 녹음 시작 메시지
      toast.success('음성 녹음을 시작합니다. 마이크 버튼을 다시 누르면 녹음이 종료됩니다.')
      
      // 오디오 레벨 업데이트 시작
      updateAudioLevel()
    } catch (error) {
      console.error('녹음 시작 오류:', error)
      toast.error('마이크 접근 권한이 필요합니다')
      cleanupRecording()
    }
  }

  // 녹음 중지
  const stopRecording = () => {
    if (!mediaRecorderRef.current || !isRecording) return;
    
    try {
      // 녹음 중지 전에 마지막 데이터 조각을 명시적으로 요청
      mediaRecorderRef.current.requestData();
      
      // 녹음 중지 메시지 표시
      toast.success('녹음이 종료되었습니다. 변환 중...');
      
      // 녹음 상태 해제하고 처리 상태 설정
      setIsRecording(false);
      setIsLocalProcessing(true);
      
      // 녹음 중지
      mediaRecorderRef.current.stop();
    } catch (error) {
      console.error('녹음 중지 오류:', error);
      cleanupRecording();
    }
  }

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop()
      }
      cleanupRecording()
    }
  }, [])

  // isVoiceMode에 따른 자동 녹음 시작/종료
  useEffect(() => {
    // 음성 모드가 활성화되면 자동으로 녹음 시작
    if (isVoiceMode && !isRecording && !isLocalProcessing) {
      startRecording();
    }
    
    // 음성 모드가 비활성화되면 녹음 중지 (모드 전환 시에만)
    if (!isVoiceMode && isRecording) {
      stopRecording();
    }
  }, [isVoiceMode]); // isRecording, isLocalProcessing 의존성 제거

  // 녹음 중일 때는 placeholder 변경
  const getPlaceholder = () => {
    return isRecording ? '음성인식 중입니다...' : placeholder
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div
        className={`flex items-center rounded-lg border p-2 ${
          isDarkMode
            ? 'bg-gray-800 border-gray-700 text-white'
            : 'bg-white border-gray-300 text-gray-900'
        }`}
      >
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={getPlaceholder()}
          className={`flex-grow px-3 py-2 outline-none bg-transparent ${
            isDarkMode ? 'text-white placeholder-gray-400' : 'text-gray-900 placeholder-gray-500'
          }`}
          disabled={isRecording || isLocalProcessing}
        />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isLocalProcessing}
            className={`p-2 rounded-full transition-all duration-300 ${
              isRecording 
                ? 'bg-red-100 dark:bg-red-900 text-red-500 ring-2 ring-red-500' 
                : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 hover:scale-110'
            } ${
              isLocalProcessing ? 'cursor-not-allowed opacity-50' : ''
            }`}
            title={
              isRecording 
                ? translate('stopRecording', language) || '녹음 중지' 
                : translate('voiceInput', language) || '음성으로 입력'
            }
          >
            {isLocalProcessing ? (
              <div className="relative">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs whitespace-nowrap">
                  변환 중...
                </span>
              </div>
            ) : isRecording ? (
              <div className="relative">
                <MicOff className="w-5 h-5 text-red-500" />
                <div
                  className="absolute -bottom-1 -right-1 w-2 h-2 rounded-full bg-red-500 animate-pulse"
                  style={{
                    transform: `scale(${1 + audioLevel / 100})`,
                    opacity: 0.8,
                  }}
                />
              </div>
            ) : (
              <Mic className="w-5 h-5 animate-pulse" />
            )}
          </button>
          <button
            type="submit"
            disabled={!message.trim() || isLocalProcessing}
            className={`p-2 rounded-full transition-all duration-300 ${
              message.trim() && !isLocalProcessing
                ? 'bg-blue-500 text-white hover:bg-blue-600 hover:scale-110'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </form>
  )
}

export default ChatInput
