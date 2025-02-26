import { NextResponse } from 'next/server'

// DeepL API 직접 호출을 위한 타입 정의
type TargetLanguageCode = 'EN-US' | 'JA' | 'ZH' | 'KO';

const languageMap: { [key: string]: TargetLanguageCode } = {
  en: 'EN-US',
  ja: 'JA',
  zh: 'ZH',
  ko: 'KO'
}

export async function POST(req: Request) {
  try {
    const { text, targetLanguage } = await req.json()
    
    // 한국어인 경우 번역하지 않고 반환
    if (targetLanguage === 'ko') {
      return NextResponse.json({ translatedText: text })
    }

    const deeplTargetLang = languageMap[targetLanguage]
    if (!deeplTargetLang) {
      throw new Error(`Unsupported language: ${targetLanguage}`)
    }

    // DeepL API 직접 호출
    const response = await fetch('https://api-free.deepl.com/v2/translate', {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${process.env.DEEPL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: [text],
        target_lang: deeplTargetLang,
        formality: 'more',
        preserve_formatting: true
      })
    });

    if (!response.ok) {
      throw new Error(`DeepL API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    const translatedText = result.translations[0].text;

    return NextResponse.json({ translatedText })
  } catch (error) {
    console.error('Translation error:', error)
    return NextResponse.json(
      { error: 'Translation failed' },
      { status: 500 }
    )
  }
} 