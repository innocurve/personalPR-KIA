import { OpenAI } from 'openai';

// OpenAI 인스턴스 생성
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// 불용어 세트
export const stopWords = new Set(['이', '그', '저', '것', '수', '등', '및', '를', '이다', '입니다', '했다', '했습니다']);

// 텍스트를 청크로 나누는 함수
export function splitIntoChunks(text: string, maxChunkSize: number = 2500): string[] {
  // 문단 단위로 먼저 분할
  const paragraphs = text.split(/\n\s*\n/);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const paragraph of paragraphs) {
    // 문단이 너무 길면 문장 단위로 분할
    if (paragraph.length > maxChunkSize) {
      const sentences = paragraph.match(/[^.!?]+[.!?]+/g) || [paragraph];
      for (const sentence of sentences) {
        if ((currentChunk + sentence).length > maxChunkSize && currentChunk.length > 0) {
          chunks.push(currentChunk.trim());
          currentChunk = '';
        }
        currentChunk += sentence + ' ';
      }
    } else {
      if ((currentChunk + paragraph).length > maxChunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }
      currentChunk += paragraph + '\n\n';
    }
  }
  
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

// 키워드 추출 함수
export function extractKeywords(text: string): string[] {
  // 텍스트를 단어로 분할
  const words = text.split(/[\s,.]+/).filter(word => 
    word.length > 1 && !stopWords.has(word)
  );
  
  // 빈도수 계산
  const frequency: {[key: string]: number} = {};
  words.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1;
  });
  
  // TF-IDF 스코어 계산 (간단한 버전)
  const scores = Object.entries(frequency).map(([word, freq]) => ({
    word,
    score: freq * Math.log(1 + word.length) // 단어 길이도 고려
  }));
  
  // 상위 15개 키워드 반환
  return scores
    .sort((a, b) => b.score - a.score)
    .slice(0, 15)
    .map(item => item.word);
}

// 텍스트에서 토큰 수 추정
export function estimateTokenCount(text: string): number {
  // GPT 토큰 추정 (일반적으로 단어 수의 1.3배)
  return Math.ceil(text.split(/\s+/).length * 1.3);
}

// 임베딩 생성 함수
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: text.replace(/\n/g, ' ').trim(),
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('임베딩 생성 오류:', error);
    throw error;
  }
}

// 메타데이터 정규화 함수
export function normalizeMetadata(metadata: any) {
  return {
    title: metadata?.Title || metadata?.title || 'Untitled',
    author: metadata?.Author || metadata?.author || 'Unknown',
    creation_date: metadata?.CreationDate || metadata?.creation_date 
      ? new Date(metadata.CreationDate || metadata.creation_date).toISOString()
      : new Date().toISOString(),
    category: metadata?.category || 'document',
    language: metadata?.language || detectLanguage(metadata?.Title || '') || 'ko'
  };
}

// 간단한 언어 감지 함수
function detectLanguage(text: string): string {
  const koreanPattern = /[가-힣]/;
  const japanesePattern = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/;
  const englishPattern = /^[A-Za-z0-9\s.,!?-]+$/;

  if (koreanPattern.test(text)) return 'ko';
  if (japanesePattern.test(text)) return 'ja';
  if (englishPattern.test(text)) return 'en';
  return 'ko'; // 기본값
} 