'use client'

import { useState, useRef, useEffect } from 'react'
import { ArrowLeft, Moon, Sun, Mic, MicOff } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage } from '../contexts/LanguageContext'
import { useTheme } from '../contexts/ThemeContext'
import { translate, translateVoiceChat } from '../utils/translations'
import { useAudio } from '../contexts/AudioContext'
import Navigation from '../components/Navigation'

// 파일 상단에 타입 정의 추가
interface SpeechRecognitionEvent {
  resultIndex: number
  results: {
    [key: number]: {
      [key: number]: {
        transcript: string
      }
      isFinal: boolean
    }
  }
}

interface SpeechRecognitionErrorEvent {
  error: string
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start: () => void
  stop: () => void
  onstart: () => void
  onend: () => void
  onerror: (event: SpeechRecognitionErrorEvent) => void
  onresult: (event: SpeechRecognitionEvent) => void
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition
    webkitSpeechRecognition: new () => SpeechRecognition
  }
}

// 모바일 디바이스 감지 함수
const isMobile = () => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// iOS 디바이스 감지 함수
const isIOS = () => {
  if (typeof window === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

// 안드로이드 디바이스 감지 함수
const isAndroid = () => {
  if (typeof window === 'undefined') return false;
  return /Android/i.test(navigator.userAgent);
};

// 안드로이드 크롬에서 오디오 컨텍스트 활성화를 위한 함수
const unlockAudioContext = async (audioContext: AudioContext) => {
  if (audioContext.state === 'suspended' && isAndroid()) {
    const unlockEvents = ['touchstart', 'touchend', 'mousedown', 'mouseup', 'click'];
    
    const unlock = async () => {
      await audioContext.resume();
      console.log('안드로이드에서 AudioContext 활성화됨');
      
      // 이벤트 리스너 제거
      unlockEvents.forEach((event) => {
        document.body.removeEventListener(event, unlock);
      });
    };
    
    // 이벤트 리스너 등록
    unlockEvents.forEach((event) => {
      document.body.addEventListener(event, unlock, false);
    });
    
    // 빈 버퍼 재생으로 오디오 시스템 활성화 시도
    try {
      const buffer = audioContext.createBuffer(1, 1, 22050);
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContext.destination);
      source.start(0);
    } catch (e) {
      console.error('안드로이드에서 오디오 시스템 활성화 실패:', e);
    }
  }
};

export default function VoiceChatPage() {
  const { language } = useLanguage()
  const { isDarkMode, toggleDarkMode } = useTheme()
  
  // 음성 대화 관련 상태 추가
  const [isListening, setIsListening] = useState(false)
  const [isTalking, setIsTalking] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [conversationActive, setConversationActive] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [permissionGranted, setPermissionGranted] = useState(false)
  
  // Refs
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null)
  const isListeningRef = useRef(isListening)
  const isProcessingRef = useRef(isProcessing)
  const isPausedRef = useRef(isPaused)
  const conversationActiveRef = useRef(conversationActive)
  const permissionGrantedRef = useRef(permissionGranted)
  const notAllowedErrorCount = useRef(0)
  const restartTimerRef = useRef<NodeJS.Timeout | null>(null)

  // 음성 감지 설정
  const SILENCE_THRESHOLD = 15 // 묵음 임계값
  const SILENCE_DURATION = 1500 // 묵음 지속 시간 (1.5초)

  // 음성 파형 바들의 애니메이션을 위한 설정
  const bars = Array.from({ length: 30 }) // 30개의 파형 바
  const getRandomHeight = () => Math.random() * 50 + 10 // 10-60px 사이의 랜덤 높이

  // SpeechRecognition 설정 함수 수정
  const setupSpeechRecognition = () => {
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (!SpeechRecognition) {
        throw new Error('Speech Recognition is not supported in this browser')
      }

      const recognition = new SpeechRecognition()
      
      recognition.lang = language === 'ko' ? 'ko-KR' : 'en-US'
      recognition.continuous = false  // 연속 인식 비활성화
      recognition.interimResults = true
      
      recognition.onstart = () => {
        console.log('음성 인식 시작')
        setIsListening(true)
        
        // 모바일 기기에서 음성 인식 시작 시 추가 처리
        if (isMobile()) {
          console.log(`${isIOS() ? 'iOS' : '안드로이드'}에서 음성 인식 시작됨`);
          
          // 오디오 컨텍스트 재개 시도
          if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume().catch(err => {
              console.error('모바일에서 AudioContext 재개 실패:', err);
            });
            
            // 안드로이드에서 추가 처리
            if (isAndroid() && audioContextRef.current) {
              unlockAudioContext(audioContextRef.current).catch(err => {
                console.error('안드로이드에서 AudioContext 활성화 실패:', err);
              });
            }
          }
        }
      }
      
      recognition.onresult = (event) => {
        const current = event.resultIndex
        const transcript = event.results[current][0].transcript
        
        console.log('음성 인식 중:', transcript)
        setTranscript(transcript)
        
        if (event.results[current].isFinal) {
          console.log('🎤 최종 음성 인식 결과:', transcript)
          handleSpeechResult(transcript)
        }
      }
      
      recognition.onerror = (event) => {
        console.error('음성 인식 오류:', event.error)
        
        // 모바일에서 오류 처리
        if (isMobile()) {
          console.log(`모바일에서 음성 인식 오류 발생: ${event.error}`);
          
          // 오류 유형별 메시지 설정
          let errorMsg = '';
          let shouldRetry = false;
          
          switch (event.error) {
            case 'not-allowed':
              if (isIOS()) {
                // iOS에서 not-allowed 오류 카운트 증가
                notAllowedErrorCount.current += 1;
                console.log(`iOS에서 not-allowed 오류 발생 (${notAllowedErrorCount.current}/3)`);
                
                if (notAllowedErrorCount.current >= 3) {
                  errorMsg = '마이크 접근 권한 문제가 지속됩니다. 페이지를 새로고침하고 다시 시도해주세요.';
                  shouldRetry = false;
                } else {
                  errorMsg = '마이크 접근 권한이 필요합니다. 설정에서 권한을 허용해주세요.';
                  shouldRetry = true;
                }
              } else if (isAndroid()) {
                errorMsg = '안드로이드에서는 마이크 권한을 허용해야 합니다. 브라우저 설정을 확인해주세요.';
                shouldRetry = true;
              } else {
                errorMsg = '마이크 접근 권한이 필요합니다. 설정에서 권한을 허용해주세요.';
                shouldRetry = true;
              }
              break;
            case 'network':
              errorMsg = '네트워크 연결을 확인해주세요.';
              shouldRetry = true;
              break;
            case 'aborted':
              // iOS에서는 aborted 오류가 자주 발생하므로 특별 처리
              if (isIOS()) {
                console.log('iOS에서 aborted 오류 발생, 재시작 시도...');
                shouldRetry = true;
                errorMsg = ''; // 오류 메시지 표시하지 않음
              } else {
                // 다른 기기에서는 사용자가 의도적으로 중단한 경우로 간주
                return;
              }
              break;
            case 'audio-capture':
              errorMsg = '마이크를 찾을 수 없습니다. 마이크가 연결되어 있는지 확인해주세요.';
              break;
            case 'service-not-allowed':
              errorMsg = '음성 인식 서비스를 사용할 수 없습니다. 브라우저 설정을 확인해주세요.';
              break;
            default:
              errorMsg = `음성 인식 중 오류가 발생했습니다: ${event.error}`;
          }
          
          // 사용자에게 오류 메시지 표시
          setErrorMessage(errorMsg);
          
          // 재시도 여부 결정
          if (shouldRetry && conversationActiveRef.current) {
            setTimeout(() => {
              if (conversationActiveRef.current) {
                restartRecognition();
              }
            }, 1500);
            return;
          }
        }
        
        stopListening()
      }
      
      recognition.onend = () => {
        console.log('음성 인식 종료')
        // 음성 인식이 종료되었을 때 자동으로 재시작하지 않음
        // 대신 handleSpeechResult에서 AI 응답 후 restartRecognition을 호출
      }

      recognitionRef.current = recognition
      return recognition
    } catch (error) {
      console.error('Speech Recognition 설정 오류:', error)
      return null
    }
  }

  // handleSpeechResult 함수 수정
  const handleSpeechResult = async (text: string) => {
    if (!text.trim() || isProcessing) return
    
    console.log('음성 인식 결과 처리 시작, conversationActive:', conversationActiveRef.current);
    if (!conversationActiveRef.current) {
      console.log('대화가 활성화되지 않아 처리하지 않음');
      return;
    }
    
    setIsProcessing(true)
    try {
      // 음성 인식 일시 중지 (but keep isListening true)
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
          setIsPaused(true);
          console.log('음성 인식 일시 중지: recognition paused during AI response');
          console.log('isPaused 상태를 true로 설정');
        } catch (err) {
          console.error('음성 인식 중지 중 오류:', err);
        }
      }

      const response = await fetch('/api/voice-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text })
      })

      if (!response.ok) throw new Error('API 응답 오류')

      const audioBlob = await response.blob()
      await playAudio(audioBlob)

      console.log('AI 응답 재생 완료');

    } catch (error) {
      if (error instanceof Error) {
        console.warn('음성 처리가 중단되었습니다:', error.message)
      }
    } finally {
      setIsProcessing(false)
      
      // isProcessing이 false로 설정된 후에 재시작 로직 실행
      if (conversationActiveRef.current) {
        console.log('finally 블록에서 재시작 로직 실행, conversationActive:', conversationActiveRef.current);
        // 상태 업데이트가 비동기적으로 이루어지므로, 약간의 지연 후 재시작
        setTimeout(() => {
          console.log('finally 블록의 타임아웃에서 재시작 시도');
          console.log('재시작 직전 상태 - conversationActive:', conversationActiveRef.current, 'isPaused:', isPaused);
          restartRecognition();
        }, 800); // 0.8초로 줄임
      } else {
        console.log('대화가 활성화되지 않아 재시작하지 않음, conversationActive:', conversationActiveRef.current);
      }
    }
  }

  // startListening 함수 수정 - iOS에서 오디오 권한 확보 및 음성 인식 시작 과정 개선
  const startListening = async () => {
    try {
      console.log('대화 시작하기 버튼 클릭됨');
      setErrorMessage(null); // 오류 메시지 초기화
      setConversationActive(true);
      conversationActiveRef.current = true; // 즉시 ref 업데이트
      console.log('conversationActive 상태를 true로 설정 (ref:', conversationActiveRef.current, ')');
      
      // 기존 리소스 정리
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
          recognitionRef.current = null;
        } catch (err) {
          console.warn('기존 음성 인식 중지 중 오류:', err);
        }
      }
      
      // 모바일 기기에서 권한 확보 및 초기화
      if (isMobile()) {
        try {
          // iOS에서 오디오 권한 확보
          if (isIOS()) {
            console.log('iOS에서 오디오 권한 확보 시도');
            await unlockAudioOnIOS();
            // not-allowed 오류 카운터 초기화
            notAllowedErrorCount.current = 0;
          }
          
          // 모바일에서 마이크 권한 확보를 위한 초기 getUserMedia 호출
          console.log('모바일 기기에서 마이크 접근 권한 확보 시도');
          const constraints = {
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            }
          };
          
          // 마이크 권한 미리 요청
          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          
          // 기존 스트림이 있으면 정리
          if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
          }
          
          // 새 스트림 저장
          mediaStreamRef.current = stream;
          console.log('모바일 기기에서 마이크 접근 권한 확보 성공');
          
          // 약간의 지연 후 음성 인식 시작 (iOS에서 더 안정적)
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (err) {
          console.error('모바일 기기에서 권한 확보 실패:', err);
          setErrorMessage('마이크 접근 권한을 허용해주세요.');
          return; // 권한 확보 실패 시 함수 종료
        }
      }

      // 오디오 분석 설정 - 모바일 기기에 최적화된 설정
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      };
      
      // 모바일 기기에서 추가 설정
      if (isMobile()) {
        console.log('모바일 기기에서 마이크 접근 시도');
        // 모바일 기기에서는 기본 설정 사용
      }
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      mediaStreamRef.current = stream
      
      // 오디오 컨텍스트 설정 부분 수정
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();
      
      // 모바일 기기에서 오디오 컨텍스트 상태 확인 및 재개
      if (audioContext.state === 'suspended') {
        try {
          await audioContext.resume();
          console.log('AudioContext 재개됨');
          
          // 모바일 기기에서는 추가 처리
          if (isMobile()) {
            if (isAndroid()) {
              // 안드로이드에서 오디오 컨텍스트 활성화
              await unlockAudioContext(audioContext);
            } else {
              // iOS 및 기타 모바일 브라우저에서는 사용자 상호작용 후 짧은 소리를 재생하여 오디오 시스템 활성화
              try {
                const silentContext = new AudioContextClass();
                const buffer = silentContext.createBuffer(1, 1, 22050);
                const source = silentContext.createBufferSource();
                source.buffer = buffer;
                source.connect(silentContext.destination);
                source.start(0);
                console.log('모바일 기기에서 오디오 시스템 활성화 시도');
              } catch (silentErr) {
                console.error('오디오 시스템 활성화 실패:', silentErr);
              }
            }
          }
        } catch (err) {
          console.error('AudioContext 재개 실패:', err);
        }
      }
      
      const analyser = audioContext.createAnalyser()
      const source = audioContext.createMediaStreamSource(stream)
      
      analyser.fftSize = 2048
      source.connect(analyser)
      
      audioContextRef.current = audioContext
      analyserRef.current = analyser
      
      setIsListening(true)
      monitorAudioLevel()
      
      // Speech Recognition 새로 설정 및 시작
      const recognition = setupSpeechRecognition();
      if (recognition) {
        recognition.start();
      }
      
    } catch (error) {
      console.error('음성 인식 시작 오류:', error)
      stopListening()
    }
  }

  const monitorAudioLevel = () => {
    if (!analyserRef.current) return

    const analyser = analyserRef.current
    const dataArray = new Uint8Array(analyser.frequencyBinCount)
    
    const checkLevel = () => {
      if (!isListening) return
      
      analyser.getByteFrequencyData(dataArray)
      const average = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length
      
      if (average > SILENCE_THRESHOLD) {
        // 음성 감지됨
        setIsTalking(true)
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current)
          silenceTimeoutRef.current = null
        }
      } else if (isTalking) {
        // 묵음 감지
        if (!silenceTimeoutRef.current) {
          silenceTimeoutRef.current = setTimeout(() => {
            handleSpeechEnd()
          }, SILENCE_DURATION)
        }
      }
      
      requestAnimationFrame(checkLevel)
    }
    
    checkLevel()
  }

  const handleSpeechEnd = async () => {
    setIsTalking(false)
    // transcript가 이미 handleSpeechResult에서 처리되었으므로
    // 여기서는 상태만 초기화
    setTranscript("")
  }

  // stopListening 함수 수정
  const stopListening = () => {
    try {
      setConversationActive(false); // 대화 활성화 상태를 false로 설정
      conversationActiveRef.current = false; // 즉시 ref 업데이트
      console.log('대화 종료: conversationActive를 false로 설정');
      setIsProcessing(false) // 먼저 처리 상태를 false로 설정

      // 1. 현재 재생 중인 오디오 중지 - 에러 처리 추가
      if (audioPlayerRef.current) {
        try {
          audioPlayerRef.current.pause();
          audioPlayerRef.current.src = '';
          audioPlayerRef.current = null;
        } catch (err) {
          // 오디오 중지 중 에러는 무시
        }
      }

      // 2. Web Speech Recognition 중지
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
          // 빈 함수로 이벤트 핸들러 초기화
          recognitionRef.current.onend = () => {};
          recognitionRef.current.onresult = () => {};
          recognitionRef.current.onerror = () => {};
          recognitionRef.current = null
        } catch (err) {
          // Recognition 중지 중 에러는 무시
        }
      }

      // 3. 미디어 스트림 트랙 중지
      if (mediaStreamRef.current) {
        try {
          mediaStreamRef.current.getTracks().forEach(track => {
            track.stop()
            mediaStreamRef.current?.removeTrack(track)
          })
          mediaStreamRef.current = null
        } catch (err) {
          // 미디어 스트림 중지 중 에러는 무시
        }
      }

      // 4. AudioContext 정리
      if (audioContextRef.current) {
        try {
          audioContextRef.current.close()
          audioContextRef.current = null
        } catch (err) {
          // AudioContext 중지 중 에러는 무시
        }
      }

      // 5. AnalyserNode 연결 해제
      if (analyserRef.current) {
        try {
          analyserRef.current.disconnect()
          analyserRef.current = null
        } catch (err) {
          // Analyser 연결 해제 중 에러는 무시
        }
      }

      // 6. 타이머 정리
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current)
        silenceTimeoutRef.current = null
      }

      // 7. 상태 초기화
      setIsListening(false)
      setIsTalking(false)
      setTranscript("")

      console.log('음성 대화가 안전하게 종료되었습니다.')
    } catch (error) {
      console.warn('리소스 정리 중 일부 작업이 실패했습니다:', error)
    }
  }

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      stopListening()
    }
  }, [])

  // 페이지 이동 시 정리를 위한 추가
  useEffect(() => {
    const handleBeforeUnload = () => {
      stopListening()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [])

  // playAudio 함수 수정 - iOS에서 오디오 재생 문제 해결
  const playAudio = async (audioBlob: Blob): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        // 이전 오디오 정리
        if (audioPlayerRef.current) {
          try {
            audioPlayerRef.current.pause();
            audioPlayerRef.current.src = '';
          } catch (err) {
            // 이전 오디오 중지 중 에러는 무시
          }
        }
        
        // 오디오 URL 생성 및 오디오 객체 설정
        const audioUrl = URL.createObjectURL(audioBlob)
        const audio = new Audio(audioUrl)
        audioPlayerRef.current = audio;
        
        // 모바일 기기에서 오디오 재생 문제 해결을 위한 설정
        audio.preload = 'auto';
        
        // 이벤트 핸들러 설정
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl)
          audioPlayerRef.current = null;
          resolve();
        }
        
        audio.onerror = (e) => {
          console.error('오디오 재생 오류:', e);
          URL.revokeObjectURL(audioUrl)
          audioPlayerRef.current = null;
          reject(new Error('오디오 재생이 중단되었습니다.'))
        }
        
        // 모바일 기기에서 오디오 재생 전 추가 설정
        if (isMobile()) {
          console.log('모바일에서 오디오 재생 시도...');
          
          // 모바일 기기에서 공통 설정
          audio.setAttribute('playsinline', '');
          audio.setAttribute('webkit-playsinline', '');
          
          // iOS에서 오디오 재생 권한 확보
          if (isIOS()) {
            console.log('iOS에서 오디오 재생 준비...');
            
            // iOS에서 오디오 요소에 추가 속성 설정
            audio.muted = true; // 처음에는 음소거로 시작
            audio.volume = 0;
            (audio as any).playsInline = true;
            
            // 이미 권한이 확보되었는지 확인
            if (!permissionGrantedRef.current) {
              console.log('iOS에서 오디오 권한 재확보 시도');
              unlockAudioOnIOS().catch(err => {
                console.error('iOS에서 오디오 재생 권한 재확보 실패:', err);
                // 실패해도 계속 진행
              });
            }
          }
          
          // 지연 후 재생 시도
          setTimeout(() => {
            const playWithRetry = () => {
              const playPromise = isIOS() 
                ? (async () => {
                    // iOS에서는 muted 상태로 먼저 재생
                    audio.muted = true;
                    await audio.play();
                    console.log('iOS에서 muted 상태로 오디오 재생 성공');
                    
                    // 잠시 후 unmute
                    setTimeout(() => {
                      audio.muted = false;
                      console.log('iOS에서 오디오 unmute 완료');
                    }, 100);
                  })()
                : audio.play();
              
              playPromise.catch(err => {
                console.error('오디오 재생 첫 시도 실패:', err);
                
                // 재시도
                setTimeout(() => {
                  // 두 번째 시도에서는 다른 방식 시도
                  if (isIOS()) {
                    // iOS에서 다시 권한 확보 시도
                    unlockAudioOnIOS()
                      .then(() => {
                        audio.muted = false; // 직접 소리 재생 시도
                        return audio.play();
                      })
                      .catch(retryErr => {
                        console.error('오디오 재생 재시도 실패:', retryErr);
                        reject(new Error('오디오 재생을 시작할 수 없습니다.'));
                      });
                  } else {
                    audio.play().catch(retryErr => {
                      console.error('오디오 재생 재시도 실패:', retryErr);
                      reject(new Error('오디오 재생을 시작할 수 없습니다.'));
                    });
                  }
                }, 300);
              });
            };
            
            playWithRetry();
          }, 500);
        } else {
          // 데스크톱에서는 바로 재생
          audio.play().catch(err => {
            console.error('오디오 재생 실패:', err);
            reject(new Error('오디오 재생을 시작할 수 없습니다.'));
          });
        }
      } catch (error) {
        reject(new Error('오디오 재생 준비 중 오류가 발생했습니다.'))
      }
    })
  }

  // 상태 변경 시 ref 업데이트
  useEffect(() => {
    isListeningRef.current = isListening
  }, [isListening])

  useEffect(() => {
    isProcessingRef.current = isProcessing
  }, [isProcessing])

  useEffect(() => {
    isPausedRef.current = isPaused
  }, [isPaused])

  useEffect(() => {
    conversationActiveRef.current = conversationActive;
  }, [conversationActive]);

  useEffect(() => {
    permissionGrantedRef.current = permissionGranted;
  }, [permissionGranted]);

  // iOS에서 오디오 재생 권한 확보를 위한 함수
  const unlockAudioOnIOS = async () => {
    if (!isIOS()) return;
    
    console.log('iOS에서 오디오 재생 권한 확보 시도...');
    
    try {
      // 이미 권한이 확보된 경우 스킵
      if (permissionGrantedRef.current) {
        console.log('iOS에서 이미 오디오 권한이 확보되어 있습니다.');
        return;
      }
      
      // 짧은 무음 오디오 생성 및 재생 (iOS Safari에 최적화)
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContext();
      
      // 사용자 제스처 이벤트 핸들러 내에서 실행되어야 함
      const buffer = audioContext.createBuffer(1, 1, 22050);
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContext.destination);
      
      // iOS에서는 오디오 요소를 통한 재생도 필요
      const silentAudio = new Audio();
      silentAudio.autoplay = true;
      silentAudio.muted = true;
      (silentAudio as any).playsInline = true;
      silentAudio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
      
      // 한 번에 하나씩 실행 (Promise.all 대신)
      try {
        await source.start(0);
        console.log('iOS에서 AudioContext 소스 시작 성공');
      } catch (sourceErr) {
        console.warn('iOS에서 AudioContext 소스 시작 실패:', sourceErr);
      }
      
      try {
        await silentAudio.play();
        console.log('iOS에서 무음 오디오 재생 성공');
      } catch (audioErr) {
        console.warn('iOS에서 무음 오디오 재생 실패:', audioErr);
        // 실패해도 계속 진행
      }
      
      // 성공으로 간주
      console.log('iOS에서 오디오 재생 권한 확보 성공');
      setPermissionGranted(true);
      
      // 오디오 컨텍스트 참조 저장 (나중에 재사용)
      if (!audioContextRef.current) {
        audioContextRef.current = audioContext;
      }
      
      return audioContext;
    } catch (err) {
      console.error('iOS에서 오디오 재생 권한 확보 실패:', err);
      // 실패해도 계속 진행할 수 있도록 오류를 다시 throw하지 않음
    }
  };

  // restartRecognition 함수 수정
  const restartRecognition = () => {
    // 이미 실행 중인 타이머가 있으면 취소
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
    }
    
    // 새 타이머 설정
    restartTimerRef.current = setTimeout(() => {
      try {
        // 기존 인스턴스 정리
        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
          } catch (stopError) {
            console.warn('기존 인스턴스 중지 중 오류:', stopError);
          }
          recognitionRef.current = null;
        }
        
        const recognition = setupSpeechRecognition();
        if (recognition) {
          console.log('새 recognition 인스턴스 생성됨, 시작 시도...');
          recognition.start();
          recognitionRef.current = recognition;
          setIsListening(true); // 명시적으로 isListening 설정
          console.log('재시작: Speech Recognition 시작됨');
        } else {
          console.warn('재시작: Speech Recognition 인스턴스 생성 실패');
        }
      } catch (error) {
        console.error('음성 인식 재시작 중 오류 발생:', error);
      }
    }, 200); // 0.2초로 줄임
  };

  return (
    <div className={`min-h-screen flex flex-col ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      {/* 네비게이션 */}
      <div className="fixed top-0 left-0 right-0 z-50 border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <Navigation language={language} />
      </div>

      {/* 메인 컨텐츠 */}
      <main className="flex-1 max-w-5xl mx-auto w-full mt-24 p-8">
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-160px)]">
          <div className="w-32 h-32 relative rounded-full overflow-hidden mb-8 shadow-xl">
            <Image
              src="/profile.png"
              alt={translate('name', language)}
              fill
              sizes="(max-width: 768px) 128px, 128px"
              className="object-cover object-top"
            />
          </div>

          {/* 음성 파형 애니메이션 - 상태에 따라 다르게 표시 */}
          <div className="flex items-center justify-center gap-1 mb-8 h-32">
            {bars.map((_, i) => (
              <motion.div
                key={i}
                className={`w-1 rounded-full ${
                  isTalking 
                    ? 'bg-green-500' 
                    : isDarkMode ? 'bg-blue-400' : 'bg-blue-500'
                }`}
                animate={{
                  height: isTalking 
                    ? [getRandomHeight() * 1.5, getRandomHeight() * 1.5] 
                    : isListening 
                      ? [getRandomHeight(), getRandomHeight()]
                      : "20px"
                }}
                transition={{
                  duration: isTalking ? 0.3 : 1.5,
                  repeat: Infinity,
                  repeatType: "reverse",
                  delay: i * 0.05,
                }}
              />
            ))}
          </div>

          {/* 상태 메시지 */}
          <div className={`text-center max-w-md mx-auto ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            <h2 className="text-3xl font-bold mb-4 whitespace-pre-line">
              {errorMessage 
                ? translate('error', language) || "오류가 발생했습니다"
                : isListening 
                  ? isTalking 
                    ? translateVoiceChat('recognizingVoice', language) || "음성을 인식하고 있습니다..."
                    : translateVoiceChat('pleaseSpeak', language) || "말씀해 주세요"
                : translateVoiceChat('voiceChatTitle', language).replace('{name}', `${translate('name', language)}${translate('cloneTitle', language)}`)}
            </h2>
            <p className={`text-lg ${errorMessage ? 'text-red-500 font-medium' : 'opacity-75'} whitespace-pre-line`}>
              {errorMessage 
                ? errorMessage
                : isListening 
                  ? isMobile() 
                    ? isIOS() 
                      ? translateVoiceChat('iosPermission', language) || "iOS에서는 마이크 권한을 허용해야 합니다"
                      : translateVoiceChat('androidPermission', language) || "안드로이드에서는 마이크 권한을 허용해야 합니다"
                    : translateVoiceChat('autoVoiceDetection', language) || "자동으로 음성을 감지하여 대화합니다"
                  : translateVoiceChat('speakFreely', language) || "자유롭게 말씀해주세요. 자동으로 음성을 인식하여 대화를 시작합니다."}
            </p>
          </div>

          {/* 대화 시작/종료 버튼과 채팅으로 돌아가기 버튼 */}
          <div className="mt-12 flex items-center gap-4">
            <Link href="/chat">
              <motion.button
                className={`px-6 py-4 rounded-full font-medium border-2 
                  ${isDarkMode 
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-800' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                  } transform transition-all duration-200 hover:scale-105`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {translate('backToChat', language) || "채팅으로 돌아가기"}
              </motion.button>
            </Link>
            
            <motion.button
              onClick={isListening ? stopListening : startListening}
              className={`px-8 py-4 rounded-full text-white font-medium
                ${isListening 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : isDarkMode 
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : 'bg-blue-500 hover:bg-blue-600'
                } transform transition-all duration-200 hover:scale-105 shadow-lg`}
            >
              {isListening 
                ? translateVoiceChat('endConversation', language) || "대화 종료하기"
                : translateVoiceChat('startConversation', language) || "대화 시작하기"}
            </motion.button>
          </div>
        </div>
      </main>
    </div>
  )
}