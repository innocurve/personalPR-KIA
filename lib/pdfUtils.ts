// 불용어 세트
export const stopWords = new Set(['이', '그', '저', '것', '수', '등', '및', '를', '이다', '입니다', '했다', '했습니다']);

// 텍스트를 청크로 나누는 함수
export function splitIntoChunks(text: string, maxChunkSize: number = 1000): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = '';
    }
    currentChunk += sentence;
  }
  
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

// 키워드 추출 함수
export function extractKeywords(text: string): string[] {
  const words = text.split(/[\s,.]+/).filter(word => 
    word.length > 1 && !stopWords.has(word)
  );
  
  // 빈도수 계산
  const frequency: {[key: string]: number} = {};
  words.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1;
  });
  
  // 상위 10개 키워드 반환
  return Object.entries(frequency)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([word]) => word);
} 