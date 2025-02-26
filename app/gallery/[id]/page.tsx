'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Language } from '../../utils/translations'
import Navigation from '@/app/components/Navigation'
import { useLanguage } from '@/app/hooks/useLanguage'
import { storage } from '@/app/utils/storage'

interface GalleryItem {
  id: number;
  title: { [key in Language]: string };
  image: string;
  description: { [key in Language]: string };
  content: { [key in Language]: string };
}

export default function GalleryPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { language } = useLanguage();
  const [gallery, setGallery] = useState<GalleryItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchGallery = () => {
      try {
        setIsLoading(true);
        const storedPosts = storage.get('posts');
        if (!storedPosts) {
          throw new Error('Posts not found');
        }
        
        const posts = JSON.parse(storedPosts);
        let foundGallery: GalleryItem | null = null;
        
        for (const post of posts) {
          if (post.gallery) {
            const galleryItem = post.gallery.find((item: GalleryItem) => item.id === Number(id));
            if (galleryItem) {
              foundGallery = galleryItem;
              break;
            }
          }
        }
        
        if (!foundGallery) {
          throw new Error('Gallery not found');
        }
        
        setGallery(foundGallery);
      } catch (error) {
        console.error('Error fetching gallery:', error);
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchGallery();
    }
  }, [id, router]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900 text-gray-900 dark:text-white">Loading...</div>;
  }

  if (!gallery) {
    return <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900 text-gray-900 dark:text-white">Gallery not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation language={language} />
      
      <div className="max-w-3xl mx-auto p-5 pt-24">
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-400">
              {gallery.title[language]}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Image 
              src={gallery.image} 
              alt={gallery.title[language]} 
              width={800}
              height={600}
              className="w-full h-auto object-cover mb-4 rounded-lg"
            />
            <p className="mb-4 text-gray-600 dark:text-gray-300">{gallery.description[language]}</p>
            
            <div className="mt-8">
              <Button 
                onClick={() => router.back()}
                className="hover:bg-blue-600 dark:hover:bg-blue-700"
              >
                뒤로 가기
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 