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
    const url = "https://www.kia.com/kr/vehicles/catalog-price"
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
        title: 'KIA',
        url: "https://www.kia.com/kr/vehicles/catalog-price"
      })
      setShowMenu(false)
    } catch (err) {
      console.error('Error sharing:', err)
    }
  }

  // 문의 페이지로 이동
  const goToInquiry = () => {
    window.location.href = '/inquiry'
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
        className="fixed bottom-8 right-8 z-50 bg-gray-900 text-white p-3.5 rounded-full shadow-lg hover:bg-[#EA0029] shadow-xl transition-all duration-100 hover:scale-110 flex items-center justify-center"
        aria-label="Share Options"
      >
        <MoreVertical className="w-5 h-5" />
      </button>
      
      {/* 공유 옵션 메뉴 */}
      {showMenu && (
        <div 
          ref={menuRef}
          className="fixed bottom-24 right-8 z-50 bg-white rounded-xl shadow-xl overflow-hidden min-w-[220px] animate-fade-in border border-gray-200"
        >
          {canNativeShare && (
            <button 
              onClick={nativeShare}
              className="flex items-center gap-3 w-full px-4 py-3.5 text-left hover:bg-gray-50 transition-colors group"
            >
              <Share className="w-5 h-5 text-gray-900 group-hover:text-[#EA0029] transition-colors" />
              <span className="text-gray-900 group-hover:text-[#EA0029] transition-colors">
                공유하기
              </span>
            </button>
          )}
          
          <button 
            onClick={copyLink}
            className={`flex items-center gap-3 w-full px-4 py-3.5 text-left hover:bg-gray-50 transition-colors group ${canNativeShare ? 'border-t border-gray-200' : ''}`}
          >
            <Link2 className="w-5 h-5 text-gray-900 group-hover:text-[#EA0029] transition-colors" />
            <span className="text-gray-900 group-hover:text-[#EA0029] transition-colors">
              링크 복사
            </span>
          </button>

          <button 
            onClick={goToInquiry}
            className="flex items-center gap-3 w-full px-4 py-3.5 text-left hover:bg-gray-50 transition-colors group border-t border-gray-200"
          >
            <ExternalLink className="w-5 h-5 text-gray-900 group-hover:text-[#EA0029] transition-colors" />
            <span className="text-gray-900 group-hover:text-[#EA0029] transition-colors">
              문의하기
            </span>
          </button>
        </div>
      )}
      
      {/* 토스트 메시지 */}
      {showToast && (
        <div className="fixed bottom-24 right-8 z-50 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg animate-fade-in">
          {translate('linkCopied', language)}
        </div>
      )}
    </>
  )
} 