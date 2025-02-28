import { NextResponse } from 'next/server';
import { supabase } from '@/app/utils/supabase';
import { 
  splitIntoChunks, 
  extractKeywords, 
  generateEmbedding,
  normalizeMetadata,
  estimateTokenCount 
} from '@/lib/pdfUtils';
import pdfParse from 'pdf-parse';

interface PdfChunk {
  id?: number;                // 자동 생성되는 고유 ID
  file_name: string;         // 원본 PDF 파일명
  content: string;           // 청크의 실제 텍스트 내용
  keywords: string[];        // 추출된 키워드 배열
  page_number: number;       // PDF 페이지 번호
  chunk_index: number;       // 페이지 내 청크 순서
  token_count: number;       // 토큰 수 (GPT 컨텍스트 관리용)
  embedding_vector?: number[]; // 벡터 임베딩 (향후 시맨틱 검색용)
  metadata: {                // 메타데이터
    title?: string;          // PDF 제목
    author?: string;         // 작성자
    creation_date?: string;  // PDF 생성일
    category?: string;       // 문서 카테고리
    language?: string;       // 문서 언어
  };
  owner_id: string;          // 소유자 ID
  created_at: string;        // 생성 시간
  updated_at: string;        // 수정 시간
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: '파일이 제공되지 않았습니다.' },
        { status: 400 }
      );
    }

    // PDF 파일 형식 검증
    if (!file.type.includes('pdf')) {
      return NextResponse.json(
        { success: false, error: 'PDF 파일만 업로드 가능합니다.' },
        { status: 400 }
      );
    }

    // 파일 크기 제한 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: '파일 크기는 10MB를 초과할 수 없습니다.' },
        { status: 400 }
      );
    }

    // PDF를 ArrayBuffer로 변환 후 Buffer로 변환
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const buffer = Buffer.from(uint8Array);

    // PDF 텍스트 추출
    const data = await pdfParse(buffer);
    const fullText = data.text;
    
    // PDF 메타데이터 정규화
    const metadata = normalizeMetadata({
      ...data.info,
      title: data.info?.Title || file.name,
      creation_date: data.info?.CreationDate
    });

    // 텍스트를 청크로 분할 (페이지 단위로)
    const pages = data.text.split(/\f/); // Form feed character로 페이지 구분
    const ownerId = process.env.NEXT_PUBLIC_OWNER_ID!;
    const timestamp = new Date().toISOString();

    // 기존 PDF 청크 삭제 (새로운 파일로 대체)
    await supabase
      .from('pdf_chunks')
      .delete()
      .eq('owner_id', ownerId)
      .eq('file_name', file.name);

    // 페이지별로 청크 생성 및 저장
    for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
      const pageContent = pages[pageIndex].trim();
      if (!pageContent) continue;

      const pageChunks = splitIntoChunks(pageContent);
      
      for (let chunkIndex = 0; chunkIndex < pageChunks.length; chunkIndex++) {
        const content = pageChunks[chunkIndex];
        const keywords = extractKeywords(content);
        const tokenCount = estimateTokenCount(content);
        
        // 임베딩 생성
        const embeddingVector = await generateEmbedding(content);
        
        const chunk: PdfChunk = {
          file_name: file.name,
          content: content,
          keywords: keywords,
          page_number: pageIndex + 1,
          chunk_index: chunkIndex + 1,
          token_count: tokenCount,
          embedding_vector: embeddingVector,
          metadata: metadata,
          owner_id: ownerId,
          created_at: timestamp,
          updated_at: timestamp
        };

        const { error } = await supabase
          .from('pdf_chunks')
          .insert(chunk);

        if (error) {
          console.error('청크 저장 오류:', error);
          throw error;
        }
      }
    }

    return NextResponse.json({
      success: true,
      filename: file.name,
      text: fullText,
      message: 'PDF가 성공적으로 처리되었습니다.',
      metadata: metadata,
      total_chunks: pages.reduce((acc, page) => 
        acc + splitIntoChunks(page.trim()).length, 0
      )
    });

  } catch (error) {
    console.error('PDF 처리 오류:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '파일 처리 중 오류가 발생했습니다.' 
      },
      { status: 500 }
    );
  }
}

// 파일 업로드 크기 제한 설정
export const config = {
  api: {
    bodyParser: false,
    sizeLimit: '10mb',
  },
};
