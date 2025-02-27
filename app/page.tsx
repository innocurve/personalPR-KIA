'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import LanguageToggle from './components/LanguageToggle'
import { useLanguage } from './hooks/useLanguage'
import { translate } from './utils/translations'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination, Autoplay } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import MyValues from './components/MyValues'
import History from './components/Career'
import FadeInSection from './components/FadeInSection'
import { useState, useEffect } from 'react';
import { Menu, X, Mail, Phone, Sun, Moon } from 'lucide-react'
import ContactOptions from './components/ContactOptions'
import type { PostData } from './types/post'
import ShareButton from './components/ShareButton'
import { useDarkMode } from './hooks/useDarkMode'
import Search from './components/Search'

export default function Home() {
const [isMenuOpen, setIsMenuOpen] = useState(false)
const { language } = useLanguage();
const [posts, setPosts] = useState<PostData[]>([
  { 
    id: 1, 
    title: {
      ko: 'RAY EV',
      en: 'RAY EV',
      ja: 'RAY EV',
      zh: 'RAY EV',
    },
    image: '/postimage/id1image.png',
    description: {
      ko: '미래를 위한 선택, 친환경 전기차\nKIA의 혁신적인 EV 모델로 지속 가능한 드라이빙을 경험하세요.',
      en: 'Experience sustainable driving with\nKia\'s innovative EV models, a choice for the future.',
      ja: 'ファミリーと一緒に,\nKIAのイノベーティブなEVモデルを体験してください。',
      zh: '与家人一起体验\nKIA的革新性EV车型，为未来做出选择。',
    },
    tags: {
      ko: ['#KIA', '#RAY EV', '#친환경', '#전기차'],
      en: ['#KIA', '#RAY EV', '#SustainableDriving', '#ElectricCar'],
      ja: ['#KIA', '#RAY EV', '#環境保護', '#電気自動車'],
      zh: ['#KIA', '#RAY EV', '#环境保护', '#电车']
    }
  },
  { 
    id: 2, 
    title: {
      ko: 'K9',
      en: 'K9',
      ja: 'K9',
      zh: 'K9',
    },
    image: '/postimage/id2image.png',
    description: {
      ko: '편안하고 세련된 스타일\n일상과 여행을 위한 최적의 승용 라인업을 만나보세요.',
      en: 'Experience comfortable and sophisticated style\nfor everyday and travel with the optimal passenger lineup.',
      ja: '快適で洗練されたスタイル\n日常と旅行に最適な乗用車ラインアップをご体験ください。',
      zh: '体验舒适和精致的风格\n日常和旅行中体验最佳的乘用车阵容。',
    },
    tags: {
      ko: ['#KIA', '#K9', '#승용차', '#편안함'],
      en: ['#KIA', '#K9', '#PassengerCar', '#Comfort'],
      ja: ['#KIA', '#K9', '#乗用車', '#快適さ'],
      zh: ['#KIA', '#K9', '#乘用车', '#舒适']
    }
  },
  { 
    id: 3, 
    title: {
      ko: '쏘렌토',
      en: 'Sorento',
      ja: 'ソレント',
      zh: '索兰托',
    },
    image: '/postimage/id3image.png',
    description: {
      ko: '넓은 공간과 실용성\n다양한 라이프스타일에 맞춘 다재다능한 모델을 제공합니다.',
      en: 'Experience spaciousness and practicality\nwith a versatile model tailored to various lifestyles.',
      ja: '広い空間と実用性\nさまざまなライフスタイルに合わせた多機能なモデルを提供します。',
      zh: '宽敞的空间和实用性\n满足各种生活方式的多种功能模型。',
    },
    tags: {
      ko: ['#KIA', '#쏘렌토', '#SUV', '#실용성'],
      en: ['#KIA', '#Sorento', '#SUV', '#Practicality'],
      ja: ['#KIA', '#ソレント', '#SUV', '#実用性'],
      zh: ['#KIA', '#索兰托', '#SUV', '#实用性']
    }
  },
  { 
    id: 4, 
    title: {
      ko: '봉고III 파워게이트',
      en: 'BonggoIII Powergate',
      ja: 'ボンゴIII パワーゲート',
      zh: 'BonggoIII 动力门',
    },
    image: '/postimage/id4image.png',
    description: {
      ko: '비즈니스 최적화\n경제성과 내구성을 겸비한 최적의 솔루션을 제공합니다.',
      en: 'Optimize your business\nwith cost-effective and durable solutions.',
      ja: 'ビジネスを最適化する\nコスト効率と持続可能なソリューションを提供します。',
      zh: '优化您的业务\n提供成本效益和可持续的解决方案。',
    },
    tags: {
      ko: ['#KIA', '#봉고III', '#비즈니스', '#경제성'],
      en: ['#KIA', '#BonggoIII', '#Business', '#Economy'],
      ja: ['#KIA', '#ボンゴIII', '#ビジネス', '#経済性'],
      zh: ['#KIA', '#BonggoIII', '#商业', '#经济性']
    }
  }
]);

const router = useRouter();
const { isDarkMode, toggleDarkMode } = useDarkMode()

// 로컬스토리지 초기화 함수
const resetLocalStorage = () => {
  localStorage.removeItem('posts');
  localStorage.setItem('posts', JSON.stringify(posts));
  setPosts(posts);
};

// 초기 데이터 로드
useEffect(() => {
  resetLocalStorage(); // 항상 초기화하도록 변경
}, []); // 컴포넌트 마운트 시 한 번만 실행

// localStorage 데이터 변경 감지 및 상태 업데이트
useEffect(() => {
  const handleStorageChange = () => {
    const storedPosts = localStorage.getItem('posts');
    if (storedPosts) {
      setPosts(JSON.parse(storedPosts));
    }
  };

  window.addEventListener('storage', handleStorageChange);
  return () => {
    window.removeEventListener('storage', handleStorageChange);
  };
}, []); // 컴포넌트 마운트 시 이벤트 리스너 등록

// 페이지 포커스 시 데이터 새로고침
useEffect(() => {
  const handleFocus = () => {
    const storedPosts = localStorage.getItem('posts');
    if (storedPosts) {
      setPosts(JSON.parse(storedPosts));
    }
  };

  window.addEventListener('focus', handleFocus);
  return () => {
    window.removeEventListener('focus', handleFocus);
  };
}, []); // 컴포넌트 마운트 시 이벤트 리스너 등록

const handlePostClick = (postId: number) => {
  router.push(`/post/${postId}`);
};

const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
  e.preventDefault();
  const element = document.getElementById(id);
  if (element) {
    const headerOffset = 100; // 네비게이션 바 높이 + 여유 공간
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
    window.scrollTo({
      top: offsetPosition,
      behavior: "smooth"
    });
  }
};

return (
  <div className="min-h-screen bg-white">
    {/* 기존 컨텐츠를 relative로 설정하여 배경 위에 표시 */}
    <div className="relative z-10">
      <div className="font-sans min-h-screen flex flex-col">
        <style jsx global>{`
          html {
            scroll-behavior: smooth;
          }
          .swiper-container {
            width: 100%;
            height: 100%;
            padding: 20px 0;
          }
          .swiper-slide {
            height: auto;
            padding: 1px;
          }
          @media (max-width: 640px) {
            .swiper-button-next,
            .swiper-button-prev {
              display: none;
            }
          }
        `}</style>
        <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
          <div className="max-w-screen-xl mx-auto px-4">
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center">
                <Link href="/" className="flex items-center">
                  <Image 
                    src="/logo.png" 
                    alt="이노커브 로고" 
                    width={160} 
                    height={64} 
                    priority
                    className="object-contain cursor-pointer"
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  />
                </Link>
              </div>
              <div className="flex items-center space-x-4">
                <nav className="hidden md:flex space-x-6">
                  <Link href="#profile" onClick={(e) => handleScrollTo(e, 'profile')} className="text-[#05141F] hover:text-[#EA0029] transition-colors">{translate('profile', language)}</Link>
                  <Link href="#smart-options" onClick={(e) => handleScrollTo(e, 'smart-options')} className="text-[#05141F] hover:text-[#EA0029] transition-colors">{translate('smartOptions', language)}</Link>
                  <Link href="#history" onClick={(e) => handleScrollTo(e, 'history')} className="text-[#05141F] hover:text-[#EA0029] transition-colors">{translate('history', language)}</Link>
                  <Link href="#values" onClick={(e) => handleScrollTo(e, 'values')} className="text-[#05141F] hover:text-[#EA0029] transition-colors">{translate('values', language)}</Link>
                  <Link href="#search" onClick={(e) => handleScrollTo(e, 'search')} className="text-[#05141F] hover:text-[#EA0029] transition-colors">{translate('search', language)}</Link>
                  <Link href="#community" onClick={(e) => handleScrollTo(e, 'community')} className="text-[#05141F] hover:text-[#EA0029] transition-colors">{translate('activities', language)}</Link>
                </nav>
                <LanguageToggle />
                <button 
                  className="md:hidden p-2 rounded-full hover:bg-gray-100 transition-colors" 
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  aria-label="Toggle menu"
                >
                  {isMenuOpen ? 
                    <X className="w-6 h-6 text-gray-600" /> : 
                    <Menu className="w-6 h-6 text-gray-600" />
                  }
                </button>
              </div>
            </div>
          </div>
        </header>
        <AnimatePresence>
          {isMenuOpen && (
            <motion.nav
              className="md:hidden bg-white fixed top-[72px] left-0 right-0 z-40 shadow-lg border-b border-gray-200"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex flex-col">
                <Link href="#profile" onClick={(e) => { setIsMenuOpen(false); handleScrollTo(e, 'profile'); }} className="block py-5 px-6 text-[#05141F] hover:text-[#EA0029] transition-colors font-mono tracking-tight border-b border-gray-100 hover:bg-gray-50">{translate('profile', language)}</Link>
                <Link href="#smart-options" onClick={(e) => { setIsMenuOpen(false); handleScrollTo(e, 'smart-options'); }} className="block py-5 px-6 text-[#05141F] hover:text-[#EA0029] transition-colors font-mono tracking-tight border-b border-gray-100 hover:bg-gray-50">{translate('smartOptions', language)}</Link>
                <Link href="#history" onClick={(e) => { setIsMenuOpen(false); handleScrollTo(e, 'history'); }} className="block py-5 px-6 text-[#05141F] hover:text-[#EA0029] transition-colors font-mono tracking-tight border-b border-gray-100 hover:bg-gray-50">{translate('history', language)}</Link>
                <Link href="#values" onClick={(e) => { setIsMenuOpen(false); handleScrollTo(e, 'values'); }} className="block py-5 px-6 text-[#05141F] hover:text-[#EA0029] transition-colors font-mono tracking-tight border-b border-gray-100 hover:bg-gray-50">{translate('values', language)}</Link>
                <Link href="#search" onClick={(e) => { setIsMenuOpen(false); handleScrollTo(e, 'search'); }} className="block py-5 px-6 text-[#05141F] hover:text-[#EA0029] transition-colors font-mono tracking-tight border-b border-gray-100 hover:bg-gray-50">{translate('search', language)}</Link>
                <Link href="#community" onClick={(e) => { setIsMenuOpen(false); handleScrollTo(e, 'community'); }} className="block py-5 px-6 text-[#05141F] hover:text-[#EA0029] transition-colors font-mono tracking-tight hover:bg-gray-50">{translate('activities', language)}</Link>
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
        <main className="w-full max-w-4xl mx-auto p-5 pt-24 flex-grow overflow-x-hidden">
          <div className="w-full overflow-x-hidden">
            <FadeInSection>
              <section id="profile" className="mb-8 bg-white rounded-xl p-6 sm:p-10 shadow-lg overflow-hidden relative">
                <div className="flex flex-col items-center space-y-6">
                  <div className="w-40 h-40 sm:w-56 sm:h-56 relative">
                    <Image 
                      src="/profile.png"
                      alt={translate('name', language)} 
                      fill
                      sizes="(max-width: 640px) 160px, 224px"
                      priority
                      className="rounded-full object-cover object-top w-auto h-auto" 
                    />
                  </div>
                  <div className="text-center">
                    <h2 className="text-4xl sm:text-5xl font-bold mb-3 text-[#05141F]">{translate('name', language)}</h2>
                    <p className="text-2xl sm:text-3xl text-[#05141F] mb-6">
                      {translate('title', language).split('|').map((part, index) => (
                        <span key={index} className="sm:inline block">
                          {index > 0 && <span className="sm:inline hidden"> · </span>}
                          {part}
                        </span>
                      ))}
                    </p>
                  </div>
                  <div className="w-full max-w-2xl mx-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <ProfileItem label={translate('birth', language)} value={[translate('birthDate', language)]} className="text-center" />
                      <ProfileItem label={translate('mbti', language)} value={[translate('mbtiType', language)]} className="text-center" />
                      <ProfileItem 
                        label={translate('affiliation', language)} 
                        value={translate('affiliationDescription', language).split('\n')} 
                        className="text-center"
                      />
                      <ProfileItem 
                        label={translate('education', language)} 
                        value={translate('educationDescription', language).split('\n')} 
                        className="text-center"
                      />
                      <ProfileItem 
                        label={translate('field', language)} 
                        value={[translate('fieldDescription', language)]} 
                        className="text-center"
                      />
                    </div>
                  </div>
                </div>
              </section>
            </FadeInSection>
          </div>

          <div className="w-full overflow-x-hidden">
            <FadeInSection>
              <section id="smart-options" className="mb-8">
                <ContactOptions language={language} />
              </section>
            </FadeInSection>
          </div>

          <div className="w-full overflow-x-hidden">
            <FadeInSection>
              <section id="history" className="mb-8 bg-white rounded-xl p-8 shadow-lg overflow-hidden relative">
                <History />
              </section>
            </FadeInSection>
          </div>
          <div className="w-full overflow-x-hidden">
            <FadeInSection>
              <section id="values" className="mb-8 pt-8">
                <MyValues language={language} />
              </section>
            </FadeInSection>
          </div>
          <div className="w-full overflow-x-hidden">
            <FadeInSection>
              <section id="search" className="mb-8 pt-16">
                <h2 className="text-3xl font-bold mb-6 text-center text-[#05141F]">{translate('search', language)}</h2>
                <Search language={language} className="max-w-2xl mx-auto" />
              </section>
            </FadeInSection>
          </div>
          <div className="w-full overflow-x-hidden">
            <FadeInSection>
              <section id="community" className="py-8">
                <div className="container mx-auto px-4">
                  <Swiper
                    modules={[Navigation, Pagination, Autoplay]}
                    spaceBetween={20}
                    slidesPerView={1}
                    navigation={true}
                    pagination={{ 
                      clickable: true,
                      bulletActiveClass: 'swiper-pagination-bullet-active !bg-[#ea0029]'
                    }}
                    loop={posts.length > 1}
                    autoplay={{
                      delay: 3000,
                      disableOnInteraction: false,
                      pauseOnMouseEnter: true,
                      stopOnLastSlide: false
                    }}
                    breakpoints={{
                      0: {
                        slidesPerView: 1,
                        spaceBetween: 10,
                      },
                      640: {
                        slidesPerView: Math.min(2, posts.length),
                        spaceBetween: 20,
                      },
                      1024: {
                        slidesPerView: Math.min(3, posts.length),
                        spaceBetween: 20,
                      }
                    }}
                    className="swiper-container !pb-12 [&_.swiper-button-next]:!text-[#ea0029] [&_.swiper-button-prev]:!text-[#ea0029]"
                  >
                    {posts.map((post) => (
                      <SwiperSlide 
                        key={post.id}
                        className="h-[340px]"
                      >
                        <div
                          onClick={() => handlePostClick(post.id)}
                          className="bg-white rounded-lg shadow-md dark:shadow-gray-900/30 cursor-pointer transform transition-all duration-300 hover:scale-105 h-[340px] flex flex-col border border-gray-100 dark:border-gray-700"
                        >
                          <div className="relative h-[200px] rounded-t-lg overflow-hidden bg-gray-50 dark:bg-gray-700 flex items-center justify-center">
                            <Image
                              src={post.image}
                              alt={post.title[language]}
                              fill
                              className="object-cover"
                              priority
                            />
                          </div>
                          <div className="p-4 flex flex-col flex-1">
                            <h3 className="text-lg font-semibold mb-2 overflow-hidden whitespace-pre-line text-gray-900"
                                style={{
                                  display: '-webkit-box',
                                  WebkitBoxOrient: 'vertical',
                                  WebkitLineClamp: '2',
                                  minHeight: '3.5rem',
                                  lineHeight: '1.5rem'
                                }}
                            >{post.title[language]}</h3>
                            <p className="text-gray-600 text-sm mb-3 overflow-hidden"
                               style={{
                                 display: '-webkit-box',
                                 WebkitBoxOrient: 'vertical',
                                 WebkitLineClamp: '3',
                                 minHeight: '3rem',
                                 lineHeight: '1.25rem'
                               }}
                            >{post.description[language]}</p>
                            <div className="flex flex-wrap gap-2 mt-auto">
                              {post.tags[language].map((tag, index) => (
                                <span key={index} className="text-xs text-gray-900 bg-gray-100 px-2 py-1 rounded-full whitespace-pre-line">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </SwiperSlide>
                    ))}
                  </Swiper>
                </div>
              </section>
            </FadeInSection>
          </div>
        </main>

        <ShareButton language={language} />

        <footer className="bg-gray-800 text-white py-12 mt-12">
          <div className="max-w-4xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h3 className="font-bold text-lg mb-4">{translate('contact', language)}</h3>
                <div className="flex items-center space-x-2 mb-2">
                  <Mail className="w-5 h-5" />
                  <p>admin@inno-curve.com</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="w-5 h-5" />
                  <p>010-1234-5678</p>
                </div>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-4">{translate('affiliation', language)}</h3>
                <div className="space-y-2">
                  <p className="block text-white">
                    {translate('affiliations_1', language)}
                  </p>
                  <p>{translate('affiliations_2', language)}</p>
                </div>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-4">{translate('socialMedia', language)}</h3>
                <div className="space-y-2">
                  <Link href="https://www.instagram.com/inno_curve/" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 hover:text-[#EA0029] transition duration-100">
                    <span>Instagram</span>
                  </Link>
                  <p className="text-white">Naver</p>
                  <p className="text-white">Facebook</p>
                </div>
              </div>
            </div>
            <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
              <p>All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  </div>
)
}

function ProfileItem({ label, value, className = '' }: { label: string, value: string[], className?: string }) {
  return (
    <div className={`mb-2 ${className}`}>
      {label && <span className="font-bold text-[#05141F] block mb-1 text-xl text-label">{label}</span>}
      {(value ?? []).map((item, index) => (
        <p key={index} className="text-lg text-[#05141F] text-content">{item}</p>
      ))}
    </div>
  )
}