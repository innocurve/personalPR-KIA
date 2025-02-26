'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from 'lucide-react'
import { translate } from '../utils/translations'
import { useLanguage } from '../hooks/useLanguage'
import Navigation from '../components/Navigation'
import Link from 'next/link'
import Image from 'next/image'

export default function GreetingVideo() {
  const { language } = useLanguage()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [translatedTitle, setTranslatedTitle] = useState('')
  const [translatedDescription, setTranslatedDescription] = useState('')

  const videoSources = {
    ko: "/greetingvideo/greetingko.mp4",
    en: "/greetingvideo/greetingen.mp4",
    ja: "/greetingvideo/greetingja.mp4",
    zh: "/greetingvideo/greetingzh.mp4"
  }

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  useEffect(() => {
    const video = videoRef.current
    if (video) {
      const handleEnded = () => setIsPlaying(false)
      video.addEventListener('ended', handleEnded)
      return () => video.removeEventListener('ended', handleEnded)
    }
  }, [])

  useEffect(() => {
    async function translateContent() {
      try {
        setTranslatedTitle(translate('greetingTitle', language))
        setTranslatedDescription(translate('greetingDescription', language))
      } catch (error) {
        console.error('Translation error:', error)
      }
    }

    translateContent()
  }, [language])

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
      {/* 네비게이션 */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <Navigation language={language} />
      </div>

      {/* 메인 컨텐츠 */}
      <main className="container mx-auto pt-24 pb-12 px-4 relative">
        <Card className="relative overflow-hidden dark:bg-gray-800 dark:border-gray-700">
          {/* 배경 이미지 */}
          <div className="absolute inset-0 z-0">
            <Image
              src="/network-graph.svg"
              alt="Background Pattern"
              fill
              className="object-cover opacity-40 dark:opacity-20 transform scale-125 dark:brightness-150"
              priority
            />
          </div>

          <CardHeader className="relative z-10 border-b bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm dark:border-gray-700">
            <div className="flex justify-between items-center">
              <Link 
                href="/" 
                className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-sm sm:text-base font-medium">Back</span>
              </Link>
              <CardTitle className="inline-block w-max text-xl sm:text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-400">
                {translate('greetingVideo', language)}
              </CardTitle>
              <div className="invisible flex items-center gap-2">
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-sm sm:text-base font-medium">Back</span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="relative z-10 p-4 sm:p-6 md:p-8">
            {/* 상단 섹션: 동영상 + 텍스트 */}
            <div className="flex flex-col lg:flex-row gap-8 items-stretch justify-center w-full max-w-3xl mx-auto mb-8">
              {/* 비디오 섹션 */}
              <div className="w-full lg:w-2/5 flex items-center">
                <div className="w-full bg-white/90 dark:bg-gray-700/90 backdrop-blur-sm rounded-lg shadow-lg p-3">
                  <div className="aspect-w-16 aspect-h-9 rounded-lg overflow-hidden">
                    <div className="relative w-full h-full">
                      <video 
                        ref={videoRef}
                        src={videoSources[language] || videoSources['en']}
                        className="w-full h-full object-cover cursor-pointer"
                        playsInline
                        onClick={togglePlay}
                      >
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  </div>
                </div>
              </div>

              {/* 오른쪽 텍스트 섹션 */}
              <div className="w-full lg:w-3/5 flex items-center">
                <div className="h-full w-full px-6 py-8 bg-white/90 dark:bg-gray-700/90 backdrop-blur-sm rounded-lg shadow-lg flex items-center justify-center">
                  <div className="text-[0.75rem] xs:text-[0.85rem] sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line font-bold">
                    {translate('greetingScript', language)}
                  </div>
                </div>
              </div>
            </div>

            {/* 하단 섹션 */}
            <div className="max-w-3xl mx-auto">
              <div className="px-6 py-8 bg-white/90 dark:bg-gray-700/90 backdrop-blur-sm rounded-lg shadow-lg text-center">
                <div className="max-w-2xl mx-auto">
                  <div className="flex items-center justify-center mb-8">
                    <div className="w-16 h-[1px] bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-500 to-transparent"></div>
                    <h3 className="mx-4 text-sm xs:text-base sm:text-lg font-bold bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
                      {translate('greetingTitle', language).split('\n').map((line, i) => (
                        <span key={i} className="block whitespace-nowrap">{line}</span>
                      ))}
                    </h3>
                    <div className="w-16 h-[1px] bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-500 to-transparent"></div>
                  </div>
                  <p className="text-xs xs:text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed font-bold space-y-4">
                    {translate('greetingDescription', language).split('\n\n').map((paragraph, i) => (
                      <span key={i} className="block">
                        {paragraph.split('\n').map((line, j) => (
                          <span key={j} className="block whitespace-nowrap">{line}</span>
                        ))}
                      </span>
                    ))}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
} 