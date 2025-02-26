import { Language } from '../utils/translations'

export interface PostData {
  id: number;
  title: {
    ko: string;
    en: string;
    ja: string;
    zh: string;
  };
  image: string;
  images?: string[];
  description: {
    ko: string;
    en: string;
    ja: string;
    zh: string;
  };
  tags: {
    ko: string[];
    en: string[];
    ja: string[];
    zh: string[];
  };
  gallery?: {
    id: number;
    title: {
      ko: string;
      en: string;
      ja: string;
      zh: string;
    }
    image: string
  }[]
} 