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

export default function Home() {
const [isMenuOpen, setIsMenuOpen] = useState(false)
const { language } = useLanguage();
const [posts, setPosts] = useState<PostData[]>([
  { 
    id: 1, 
    title: {
      ko: '(사)대한청년을세계로\n미래전략포럼 개최',
      en: 'Future Strategy Forum held by\nKorean Youth to the World Association',
      ja: '(社)大韓青年を世界へ\n未来戦略フォーラム開催',
      zh: '(社)韩国青年走向世界\n举办未来战略论坛',
    },
    image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%EB%AF%B8%EB%9E%98%EC%A0%84%EB%9E%B5%ED%8F%AC%EB%9F%BC.jpg-lobjD33dLn9HHvFaqwYC57KhFIHDJb.jpeg',
    description: {
      ko: '기술혁신의 시대속에서 청년들의 미래를 위한 전략을 논의하는 포럼을 개최합니다.',
      en: 'Hosting a forum to discuss strategies for the future of youth in the era of technological innovation.',
      ja: '技術革新の時代における若者の未来のための戦略を議論するフォーラムを開催します。',
      zh: '举办论坛，讨论技术创新时代青年未来的战略。',
    },
    tags: {
      ko: ['#청년미래', '#기술혁신', '#전략포럼', '#글로벌비전'],
      en: ['#YouthFuture', '#TechInnovation', '#StrategyForum', '#GlobalVision'],
      ja: ['#青年未来', '#技術革新', '#戦略フォーラム', '#グローバルビジョン'],
      zh: ['#青年未来', '#技术创新', '#战略论坛', '#全球愿景']
    }
  },
  { 
    id: 2, 
    title: {
      ko: '이노커브 InnoCard',
      en: 'Innocurve InnoCard',
      ja: 'イノカーブ InnoCard',
      zh: 'InnoCurve InnoCard',
    },
    image: '/og-image.png',
    description: {
      ko: '종이 명함을 넘어 자신만의 웹사이트로 나를 표현하고, 연결하며, 확장할 수 있는 AI 전자명함 서비스를 소개합니다. 당신의 이야기를 담고, 네트워크를 스마트하게 이어주는 디지털 공간을 만나보세요.',
      en: 'Introducing AI digital business cards that go beyond paper, allowing you to express, connect, and expand through your own website. Discover a digital space that holds your story and smartly connects your network.',
      ja: '紙の名刺を超え、自分だけのウェブサイトで自己表現、つながり、拡張できるAIデジタル名刺サービスをご紹介します。あなたのストーリーを込め、ネットワークをスマートにつなぐデジタル空間をご体験ください。',
      zh: '介绍一款超越纸质名片的AI电子名片服务，您可以通过自己的网站来表达、连接和扩展自己。探索一个承载您的故事并智能连接您的网络的数字空间。',
    },
    tags: {
      ko: ['#전자명함', '#개인브랜딩', '#네트워크확장', '#AI솔루션'],
      en: ['#DigitalCard', '#PersonalBranding', '#NetworkExpansion', '#AISolution'],
      ja: ['#デジタル名刺', '#個人ブランディング', '#ネットワーク拡張', '#AIソリューション'],
      zh: ['#电子名片', '#个人品牌', '#网络扩展', '#AI解决方案']
    }
  },
  { 
    id: 3, 
    title: {
      ko: '이노커브 AIConnect',
      en: 'Innocurve AIConnect',
      ja: 'イノカーブ AIConnect',
      zh: 'InnoCurve AIConnect',
    },
    image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/INNOCURVE-UEJ6P4SmjI6dvCbd6jXEsOFWMdMjqW.png',
    description: {
      ko: '기술 발전의 혜택을 누구나 누릴 수 있도록, 각 산업별 맞춤형 AI 컨설팅과 최적화된 솔루션을 제공합니다.',
      en: 'We provide customized AI consulting and optimized solutions for each industry to ensure everyone can enjoy the benefits of technological advancement.',
      ja: '技術発展の恩恵を誰もが享受できるよう、各産業別にカスタマイズされたAIコンサルティングと最適化されたソリューションを提供します。',
      zh: '我们为各个行业提供定制的AI咨询和优化的解决方案，以确保每个人都能享受到技术进步的益处。',
    },
    tags: {
      ko: ['#AI컨설팅', '#맞춤형솔루션', '#기술혁신', '#산업최적화'],
      en: ['#AIConsulting', '#CustomSolutions', '#TechInnovation', '#IndustryOptimization'],
      ja: ['#AIコンサルティング', '#カスタマイズソリューション', '#技術革新', '#産業最適化'],
      zh: ['#AI咨询', '#定制解决方案', '#技术创新', '#产业优化']
    }
  },
  { 
    id: 4, 
    title: {
      ko: '이노커브 마케팅',
      en: 'Innocurve Marketing',
      ja: 'イノカーブマーケティング',
      zh: 'InnoCurve营销',
    },
    image: '/postimage/id4image.png',
    images: [
      '/postimage/id4image2.png',
      '/postimage/id4image3.png',
      '/postimage/id4image4.png',
      '/postimage/id4image5.png',
      '/postimage/id4image6.png',
      '/postimage/id4image7.png',
      '/postimage/id4image8.png',
      '/postimage/id4image9.png'
    ],
    description: {
      ko: 'AI를 활용한 홈페이지, 이미지, 영상 등 다양한 디지털 콘텐츠 제작을 통해 비용은 효율적으로 절감하고, 최상의 퀄리티로 효과적인 홍보를 지원합니다.',
      en: 'We support effective promotion with top quality while efficiently reducing costs through the production of various digital content such as AI-powered websites, images, and videos.',
      ja: 'AIを活用したホームページ、画像、動画など、さまざまなデジタルコンテンツの制作を通じてコストを効率的に削減し、最高の品質で効果的なプロモーションをサポートします。',
      zh: '通过制作AI驱动的网站、图像和视频等各种数字内容，有效降低成本，并以最高质量支持有效的推广。',
    },
    tags: {
      ko: ['#AI마케팅', '#디지털콘텐츠', '#비용효율화', '#퀄리티향상'],
      en: ['#AIMarketing', '#DigitalContent', '#CostEfficiency', '#QualityImprovement'],
      ja: ['#AIマーケティング', '#デジタルコンテンツ', '#コスト効率化', '#品質向上'],
      zh: ['#AI营销', '#数字内容', '#成本效率', '#质量提升']
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
  <div className="font-sans min-h-screen flex flex-col bg-white dark:bg-gray-900">
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
    <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 fixed top-0 left-0 right-0 z-50">
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
              <Link href="#profile" onClick={(e) => handleScrollTo(e, 'profile')} className="nav-link">{translate('profile', language)}</Link>
              <Link href="#smart-options" onClick={(e) => handleScrollTo(e, 'smart-options')} className="nav-link">{translate('smartOptions', language)}</Link>
              <Link href="#history" onClick={(e) => handleScrollTo(e, 'history')} className="nav-link">{translate('history', language)}</Link>
              <Link href="#values" onClick={(e) => handleScrollTo(e, 'values')} className="nav-link">{translate('values', language)}</Link>
              <Link href="#community" onClick={(e) => handleScrollTo(e, 'community')} className="nav-link">{translate('activities', language)}</Link>
            </nav>
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              ) : (
                <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              )}
            </button>
            <LanguageToggle />
            <button 
              className="md:hidden p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? 
                <X className="w-6 h-6 text-gray-600 dark:text-gray-300" /> : 
                <Menu className="w-6 h-6 text-gray-600 dark:text-gray-300" />
              }
            </button>
          </div>
        </div>
      </div>
    </header>
    <AnimatePresence>
      {isMenuOpen && (
        <motion.nav
          className="md:hidden bg-white dark:bg-gray-800 fixed top-[72px] left-0 right-0 z-40 shadow-lg border-b border-gray-200 dark:border-gray-700"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex flex-col">
            <Link href="#profile" onClick={(e) => { setIsMenuOpen(false); handleScrollTo(e, 'profile'); }} className="block py-5 px-6 text-lg text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 transition duration-300 font-mono tracking-tight border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">{translate('profile', language)}</Link>
            <Link href="#smart-options" onClick={(e) => { setIsMenuOpen(false); handleScrollTo(e, 'smart-options'); }} className="block py-5 px-6 text-lg text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 transition duration-300 font-mono tracking-tight border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">{translate('smartOptions', language)}</Link>
            <Link href="#history" onClick={(e) => { setIsMenuOpen(false); handleScrollTo(e, 'history'); }} className="block py-5 px-6 text-lg text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 transition duration-300 font-mono tracking-tight border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">{translate('history', language)}</Link>
            <Link href="#values" onClick={(e) => { setIsMenuOpen(false); handleScrollTo(e, 'values'); }} className="block py-5 px-6 text-lg text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 transition duration-300 font-mono tracking-tight border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">{translate('values', language)}</Link>
            <Link href="#community" onClick={(e) => { setIsMenuOpen(false); handleScrollTo(e, 'community'); }} className="block py-5 px-6 text-lg text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 transition duration-300 font-mono tracking-tight hover:bg-gray-50 dark:hover:bg-gray-700">{translate('activities', language)}</Link>
          </div>
        </motion.nav>
      )}
    </AnimatePresence>
    <main className="w-full max-w-4xl mx-auto p-5 pt-24 flex-grow overflow-x-hidden">
      <div className="w-full overflow-x-hidden">
        <FadeInSection>
          <section id="profile" className="mb-8 bg-white dark:bg-gray-800 rounded-xl p-6 sm:p-10 shadow-lg overflow-hidden relative">
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
                <h2 className="text-4xl sm:text-5xl font-bold mb-3 text-gray-900 dark:text-white">{translate('name', language)}</h2>
                <p className="text-2xl sm:text-3xl text-gray-600 dark:text-gray-300 mb-6">
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
          <section id="history" className="mb-8 bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg overflow-hidden relative">
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
          <section id="community" className="py-16">
            <div className="container mx-auto px-4">
              <Swiper
                modules={[Navigation, Pagination, Autoplay]}
                spaceBetween={20}
                slidesPerView={1}
                navigation
                pagination={{ clickable: true }}
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
                className="swiper-container !pb-12"
              >
                {posts.map((post) => (
                  <SwiperSlide 
                    key={post.id}
                    className="h-[340px]"
                  >
                    <div
                      onClick={() => handlePostClick(post.id)}
                      className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/30 cursor-pointer transform transition-all duration-300 hover:scale-105 h-[340px] flex flex-col border border-gray-100 dark:border-gray-700"
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
                        <h3 className="text-lg font-semibold mb-2 overflow-hidden whitespace-pre-line text-gray-900 dark:text-white"
                            style={{
                              display: '-webkit-box',
                              WebkitBoxOrient: 'vertical',
                              WebkitLineClamp: '2',
                              minHeight: '3.5rem',
                              lineHeight: '1.5rem'
                            }}
                        >{post.title[language]}</h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 overflow-hidden"
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
                            <span key={index} className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-full">
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

    <footer className="bg-gray-800 dark:bg-gray-800 text-white py-12 mt-12">
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
              <Link href="https://www.instagram.com/inno_curve/" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 hover:text-blue-400 transition duration-300">
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
)
}

function ProfileItem({ label, value, className = '' }: { label: string, value: string[], className?: string }) {
  return (
    <div className={`mb-2 ${className}`}>
      {label && <span className="font-bold text-blue-600 dark:text-blue-400 block mb-1 text-xl text-label">{label}</span>}
      {(value ?? []).map((item, index) => (
        <p key={index} className="text-lg text-gray-700 dark:text-gray-300 text-content">{item}</p>
      ))}
    </div>
  )
}