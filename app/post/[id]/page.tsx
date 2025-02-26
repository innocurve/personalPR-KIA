'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { translate } from '../../utils/translations'
import { useLanguage } from '@/app/hooks/useLanguage'
import type { PostData } from '@/app/types/post'
import Navigation from '@/app/components/Navigation'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation as SwiperNavigation, Pagination, Autoplay } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import { storage } from '@/app/utils/storage'

export default function PostDetail() {
  const params = useParams()
  const router = useRouter()
  const { language } = useLanguage()
  const [post, setPost] = useState<PostData | null>(null)

  useEffect(() => {
    const fetchPost = () => {
      const postsJson = storage.get('posts')
      if (!postsJson) return;
      
      try {
        const posts = JSON.parse(postsJson)
        const foundPost = posts.find((p: PostData) => p.id === Number(params.id))
        if (foundPost) {
          setPost(foundPost)
        }
      } catch (error) {
        console.error('포스트 데이터 파싱 오류:', error)
      }
    }

    fetchPost()
  }, [params.id])

  if (!post) {
    return <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900 text-gray-900 dark:text-white">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation language={language} />

      <main className="max-w-4xl mx-auto p-5 pt-24">
        <article className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="relative h-[200px] sm:h-[300px] md:h-[400px] w-full">
            {post.images ? (
              <Swiper
                modules={[SwiperNavigation, Pagination, Autoplay]}
                spaceBetween={0}
                slidesPerView={1}
                navigation
                pagination={{ clickable: true }}
                loop={post.images.length > 1}
                autoplay={{
                  delay: 5000,
                  disableOnInteraction: false,
                  pauseOnMouseEnter: true
                }}
                className="w-full h-full"
              >
                <SwiperSlide>
                  <Image 
                    src={post.image} 
                    alt={post.title[language]} 
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 900px, 1200px"
                    quality={90}
                    className="object-contain bg-gray-50 dark:bg-gray-700"
                    priority
                  />
                </SwiperSlide>
                {post.images && post.images.map((image, index) => (
                  <SwiperSlide key={index}>
                    <Image 
                      src={image} 
                      alt={`${post.title[language]} - ${index + 1}`}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 900px, 1200px"
                      quality={90}
                      className="object-contain bg-gray-50 dark:bg-gray-700"
                      loading="lazy"
                    />
                  </SwiperSlide>
                ))}
              </Swiper>
            ) : (
              <Image 
                src={post.image} 
                alt={post.title[language]} 
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 900px, 1200px"
                quality={90}
                className="object-contain bg-gray-50 dark:bg-gray-700"
                priority
              />
            )}
          </div>
          <div className="p-4 sm:p-6 md:p-8">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-400">
              {post.title[language]}
            </h1>
            <div className="prose prose-sm sm:prose-base md:prose-lg max-w-none dark:prose-invert">
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {post.description[language]}
              </p>
            </div>
            
            {post.gallery && (
              <div className="mt-8 sm:mt-12">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-4 sm:mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-400">
                  {translate('gallery', language)}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  {post.gallery.map((item) => (
                    <div 
                      key={item.id} 
                      className="cursor-pointer relative group rounded-xl overflow-hidden"
                      onClick={() => router.push(`/gallery/${item.id}`)}
                    >
                      <Image 
                        src={item.image} 
                        alt={item.title[language]}
                        width={600}
                        height={400}
                        className="w-full h-48 sm:h-64 object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                        <h3 className="text-white text-base sm:text-xl font-semibold">
                          {item.title[language]}
                        </h3>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="ghost"
                className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-sm sm:text-base"
                onClick={() => router.push('/#community')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                {translate('backToList', language)}
              </Button>
            </div>
          </div>
        </article>
      </main>
    </div>
  )
}