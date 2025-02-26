'use client'

import { Link2, ExternalLink, Share, MoreVertical } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { Language, translate } from '../utils/translations'

interface ShareButtonProps {
  language: Language
}

export default function ShareButton({ language }: ShareButtonProps) {
  const [showToast, setShowToast] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [canNativeShare, setCanNativeShare] = useState(false)

  // 네이티브 공유 API 지원 여부 확인
  useEffect(() => {
    setCanNativeShare(!!navigator.share)
  }, [])

  // 외부 클릭 감지를 위한 이벤트 리스너
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current && 
        buttonRef.current && 
        !menuRef.current.contains(event.target as Node) && 
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // 링크 복사 기능
  const copyLink = async () => {
    const url = window.location.href
    try {
      await navigator.clipboard.writeText(url)
      setShowToast(true)
      setTimeout(() => setShowToast(false), 2000)
      setShowMenu(false)
    } catch (err) {
      console.error('Error copying to clipboard:', err)
    }
  }

  // 네이티브 공유 기능
  const nativeShare = async () => {
    try {
      await navigator.share({
        title: 'InnoCard',
        url: window.location.href
      })
      setShowMenu(false)
    } catch (err) {
      console.error('Error sharing:', err)
    }
  }

  // 기아 카탈로그 페이지로 이동
  const goToKiaCatalog = () => {
    window.open('https://www.kia.com/kr/vehicles/catalog-price', '_blank')
    setShowMenu(false)
  }

  // 공유 버튼 클릭 핸들러
  const handleShareClick = () => {
    // 항상 메뉴 토글
    setShowMenu(prev => !prev)
  }

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleShareClick}
        className="fixed bottom-8 right-8 z-50 bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-500 dark:to-cyan-400 text-white p-3.5 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 flex items-center justify-center"
        aria-label="Share Options"
      >
        <MoreVertical className="w-5 h-5" />
      </button>
      
      {/* 공유 옵션 메뉴 */}
      {showMenu && (
        <div 
          ref={menuRef}
          className="fixed bottom-24 right-8 z-50 bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden min-w-[220px] animate-fade-in border border-gray-200 dark:border-gray-700"
        >
          <div className="px-4 py-2.5 bg-gradient-to-r from-blue-600/20 to-cyan-500/20 dark:from-blue-500/20 dark:to-cyan-400/20 border-b border-gray-200 dark:border-gray-700">
            <span className="text-sm font-medium text-gray-800 dark:text-gray-300">공유 및 바로가기</span>
          </div>
          
          {canNativeShare && (
            <button 
              onClick={nativeShare}
              className="flex items-center gap-3 w-full px-4 py-3.5 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Share className="w-5 h-5 text-blue-600 dark:text-blue-500" />
              <span className="text-gray-800 dark:text-gray-200">
                공유하기
              </span>
            </button>
          )}
          
          <button 
            onClick={copyLink}
            className={`flex items-center gap-3 w-full px-4 py-3.5 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${canNativeShare ? 'border-t border-gray-200 dark:border-gray-700' : ''}`}
          >
            <Link2 className="w-5 h-5 text-blue-600 dark:text-blue-500" />
            <span className="text-gray-800 dark:text-gray-200">
              링크 복사
            </span>
          </button>
          
          <button 
            onClick={goToKiaCatalog}
            className="flex items-center gap-3 w-full px-4 py-3.5 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-t border-gray-200 dark:border-gray-700"
          >
            <ExternalLink className="w-5 h-5 text-blue-600 dark:text-blue-500" />
            <span className="text-gray-800 dark:text-gray-200">
              기아 카탈로그/가격표 바로가기
            </span>
          </button>
        </div>
      )}
      
      {/* 토스트 메시지 */}
      {showToast && (
        <div className="fixed bottom-24 right-8 z-50 bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-4 py-2 rounded-lg shadow-lg animate-fade-in">
          {translate('linkCopied', language)}
        </div>
      )}
    </>
  )
} 