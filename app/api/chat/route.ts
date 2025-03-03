import { OpenAI } from 'openai';
import { supabase } from '@/app/utils/supabase';
import { stopWords } from '@/lib/pdfUtils';

// OpenAI 인스턴스 생성
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// 타입 정의
interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface PdfContext {
  fileName: string;
  content: string;
  pageNumber: number;
}

// PDF 관련 컨텍스트 관리를 위한 인터페이스
interface ConversationContext {
  pdfContent?: string;
  fileName?: string;
  recentPdfChunks: PdfContext[];
}

interface ScoredChunk {
  content: string;
  score: number;
}

interface PdfChunk {
  content: string;
  keywords: string[];
 
}

interface Project {
  title: string;
  description: string;
  tech_stack: string[];
  owner_id: number;
}

interface Experience {
  company: string;
  position: string;
  period: string;
  description: string;
  owner_id: number;
}

interface Owner {
  name: string;
  age: number;
  hobbies: string[];
  values: string;
  country?: string;
  birth?: string;
  owner_id: number;
}

interface ChatHistory {
  role: string;
  content: string;
  owner_id: number;
  created_at?: string;
}

interface FileData {
  file_name: string;
}

// 차량 모델명 매핑
const modelNameMapping: { [key: string]: string[] } = {
  'ray': ['레이', 'ray'],
  'rayev': ['레이ev', 'rayev', '레이이브이'],
  'k5': ['케이5', 'k5', '케이파이브'],
  'k8': ['케이8', 'k8', '케이에잇', 'k-8', '케이-8', 'k 8', '케이 8'],
  'k9': ['케이9', 'k9', '케이나인'],
  'carnival': ['카니발', 'carnival'],
  'carnival-hi-limousine': ['카니발 하이브리드', 'carnival-hi-limousine'],
  'sportage': ['스포티지', 'sportage'],
  'sorento': ['쏘렌토', 'sorento'],
  'mohave': ['모하비', 'mohave'],
  'niro': ['니로', 'niro'],
  'ev6': ['이브이6', 'ev6'],
  'ev9': ['이브이9', 'ev9'],
  'bongo': ['봉고', 'bongo'],
  'morning': ['모닝', 'morning'],
  'seltos': ['셀토스', 'seltos'],
  'tasman': ['티스만', 'tasman']
};

// 차량 가격 관련 키워드 추출
const priceKeywords = ['가격', '금액', '원', '만원', '얼마', '얼마야', '얼마예요', '얼마에요', '가격표', '가격은'];

// 트림 관련 키워드 추가
const trimKeywords = ['트림', '모델', '옵션', '사양', '기본형', '기본 모델', '최상위', '최고급', '기본', '풀옵션'];

// 키워드 기반 PDF 청크 검색 함수
async function searchRelevantChunks(question: string, fileName?: string): Promise<PdfContext[]> {
  const ownerId = process.env.NEXT_PUBLIC_OWNER_ID;
  
  try {
    // 먼저 모든 PDF 파일명을 가져와서 모델명 추출
    const { data: files } = await supabase
      .from('pdf_chunks')
      .select('file_name')
      .eq('owner_id', ownerId);

    // price_모델명.pdf 형식에서 모델명 추출 및 매핑 적용
    const modelNamesFromFiles = (files as FileData[] || [])
      .map((file: FileData) => {
        const match = file.file_name.match(/price_(.+)\.pdf/);
        if (!match) return null;
        
        const extractedName = match[1].toLowerCase();
        // 추출된 이름에 대한 모든 매핑된 이름 반환
        return Object.entries(modelNameMapping)
          .find(([key, values]) => values.includes(extractedName))
          ?.[1] || [extractedName];
      })
      .filter(Boolean)
      .flat() as string[];

    // 기본 모델명 리스트와 파일에서 추출한 모델명 합치기
    const modelNames = Array.from(new Set([
      ...Object.values(modelNameMapping).flat(),
      ...modelNamesFromFiles
    ]));

    // 질문에서 차량 모델명 추출 (조사 처리 추가)
    const cleanQuestion = question.toLowerCase().replace(/[은는이가의](\s|$)/g, ' ').trim();
    const modelKeywords = modelNames.filter(model => 
      cleanQuestion.includes(model.toLowerCase())
    );

    // 검색을 위한 모델 키워드 확장 (영문/한글 모두 포함)
    const expandedModelKeywords = modelKeywords.flatMap(keyword => {
      const found = Object.values(modelNameMapping).find(values => 
        values.includes(keyword.toLowerCase())
      );
      return found || [keyword];
    });

    // 가격 관련 질문인지 확인
    const isPriceQuery = priceKeywords.some(keyword => 
      cleanQuestion.includes(keyword.toLowerCase())
    ) || /얼마/.test(cleanQuestion);

    // 특정 모델에 대한 가격 정보 요청인 경우 해당 모델의 모든 청크를 가져오는 로직 추가
    const isModelPriceQuery = expandedModelKeywords.length > 0 && isPriceQuery;
    
    // 차량 모델 가격 정보 요청인 경우 더 많은 청크 반환
    const resultLimit = isModelPriceQuery ? 25 : (isPriceQuery ? 15 : 10);

    // 검색 키워드 구성
    const searchKeywords = Array.from(new Set([
      ...expandedModelKeywords,
      ...(isPriceQuery ? priceKeywords : []),
      ...cleanQuestion
        .split(/[\s,.]+/)
        .filter(word => word.length > 1 && !stopWords.has(word))
    ]));

    if (searchKeywords.length === 0) return [];

    let query = supabase
      .from('pdf_chunks')
      .select('*')
      .eq('owner_id', ownerId);

    // 특정 파일 검색 시 파일명 필터 추가
    if (fileName) {
      query = query.eq('file_name', fileName);
    }

    // 모델명이 있는 경우 해당 PDF 파일만 검색 (확장된 키워드 사용)
    if (expandedModelKeywords.length > 0) {
      // 모든 가능한 파일명 패턴 생성
      const filePatterns: string[] = [];
      
      // 기본 패턴 추가
      expandedModelKeywords.forEach(model => {
        filePatterns.push(`file_name.ilike.%${model}%`);
        
        // 하이픈이나 공백이 있을 수 있는 변형 추가
        if (model.length > 1) {
          // 하이픈 추가 버전 (예: k8 -> k-8)
          if (/^[a-zA-Z]+\d+$/.test(model)) {
            const hyphenVersion = model.replace(/([a-zA-Z]+)(\d+)/, '$1-$2');
            filePatterns.push(`file_name.ilike.%${hyphenVersion}%`);
          }
          
          // 공백 추가 버전 (예: k8 -> k 8)
          if (/^[a-zA-Z]+\d+$/.test(model)) {
            const spacedVersion = model.replace(/([a-zA-Z]+)(\d+)/, '$1 $2');
            filePatterns.push(`file_name.ilike.%${spacedVersion}%`);
          }
        }
      });
      
      // 특별한 경우 처리 (K8, K9 등)
      expandedModelKeywords.forEach(model => {
        const lowerModel = model.toLowerCase();
        
        // K 시리즈 특별 처리
        if (lowerModel.includes('k') && /\d/.test(lowerModel)) {
          const kNumber = lowerModel.match(/k(\d+)/i)?.[1];
          if (kNumber) {
            filePatterns.push(`file_name.ilike.%k${kNumber}%`);
            filePatterns.push(`file_name.ilike.%케이${kNumber}%`);
            filePatterns.push(`file_name.ilike.%k-${kNumber}%`);
            filePatterns.push(`file_name.ilike.%k ${kNumber}%`);
          }
        }
        
        // EV 시리즈 특별 처리
        if (lowerModel.includes('ev') && /\d/.test(lowerModel)) {
          const evNumber = lowerModel.match(/ev(\d+)/i)?.[1];
          if (evNumber) {
            filePatterns.push(`file_name.ilike.%ev${evNumber}%`);
            filePatterns.push(`file_name.ilike.%이브이${evNumber}%`);
            filePatterns.push(`file_name.ilike.%ev-${evNumber}%`);
            filePatterns.push(`file_name.ilike.%ev ${evNumber}%`);
          }
        }
      });
      
      query = query.or(filePatterns.join(','));
    }

    // 키워드 기반 검색 조건 추가
    const searchConditions = searchKeywords.map(word => 
      `content.ilike.%${word}%`
    ).join(',');

    query = query.or(searchConditions);

    const { data: chunks, error } = await query;

    if (error) throw error;

    // 점수 계산 및 정렬
    const scoredChunks = (chunks || []).map(chunk => {
      let score = 0;
      const lowerContent = chunk.content.toLowerCase();
      const lowerFileName = chunk.file_name.toLowerCase();
      
      // 파일명에서 모델명 매칭 (가장 높은 가중치)
      expandedModelKeywords.forEach(model => {
        if (lowerFileName.includes(model.toLowerCase())) {
          score += 15; // 파일명 매칭에 더 높은 점수 부여
          
          // 모델 관련 파일에 추가 점수 부여
          if (isPriceQuery) {
            score += 5; // 가격 정보 요청 시 추가 점수
          }
        }
      });

      // 내용에서 모델명 매칭
      expandedModelKeywords.forEach(model => {
        if (lowerContent.includes(model.toLowerCase())) {
          score += 10;
          
          // 모델 관련 내용에 추가 점수 부여
          if (isPriceQuery) {
            score += 3; // 가격 정보 요청 시 추가 점수
          }
        }
      });

      // 가격 정보 매칭 점수
      if (isPriceQuery) {
        priceKeywords.forEach(keyword => {
          if (lowerContent.includes(keyword)) {
            score += 5;
          }
        });
        
        // 숫자와 '만원' 또는 '원'이 함께 있는 경우 추가 점수
        if (/\d+[\s]*(만원|원)/.test(lowerContent)) {
          score += 5;  // 점수 증가
        }
        
        // 트림명과 가격이 함께 있는 경우 추가 점수
        trimKeywords.forEach(trim => {
          if (lowerContent.includes(trim) && /\d+[\s]*(만원|원)/.test(lowerContent)) {
            score += 8;  // 트림과 가격이 함께 있으면 높은 점수
          }
        });
        
        // 트림명이 여러 개 있는 경우 추가 점수 (더 많은 트림 정보 포함)
        const trimCount = trimKeywords.filter(trim => lowerContent.includes(trim)).length;
        if (trimCount > 1) {
          score += trimCount * 2; // 트림 개수에 비례하여 점수 추가
        }
        
        // 가격 정보가 여러 개 있는 경우 추가 점수
        const priceMatches = lowerContent.match(/\d+[\s]*(만원|원)/g) || [];
        if (priceMatches.length > 1) {
          score += priceMatches.length * 2; // 가격 정보 개수에 비례하여 점수 추가
        }
      }
      
      // 트림 정보 검색 시 추가 점수
      trimKeywords.forEach(keyword => {
        if (lowerContent.includes(keyword)) {
          score += 4;
        }
      });

      // 일반 키워드 매칭 점수
      searchKeywords.forEach(keyword => {
        if (lowerContent.includes(keyword.toLowerCase())) {
          score += 1;
        }
        if (chunk.keywords?.some((k: string) => k.toLowerCase() === keyword.toLowerCase())) {
          score += 0.5;
        }
      });

      return {
        fileName: chunk.file_name,
        content: chunk.content,
        pageNumber: chunk.page_number,
        score
      };
    });

    // 상위 청크 반환 (가격 정보 검색 시 더 많은 컨텍스트 제공)
    return scoredChunks
      .sort((a, b) => b.score - a.score)
      .slice(0, resultLimit)  // 모델 가격 정보는 25개, 일반 가격 정보는 15개, 일반 정보는 10개로 설정
      .map(({ fileName, content, pageNumber }) => ({
        fileName,
        content,
        pageNumber
      }));
  } catch (error) {
    console.error('PDF 검색 오류:', error);
    return [];
  }
}

// 대화 컨텍스트 관리 함수
function updateConversationContext(
  context: ConversationContext,
  newChunks: PdfContext[],
  maxChunks: number = 10  // 최대 청크 수를 10개로 증가
): ConversationContext {
  // 차량 모델 관련 청크인지 확인
  const isModelRelated = (chunk: PdfContext) => {
    const lowerFileName = chunk.fileName.toLowerCase();
    const lowerContent = chunk.content.toLowerCase();
    
    // 모델명 매핑의 모든 키워드 확인
    return Object.values(modelNameMapping).some(variants => 
      variants.some(variant => 
        lowerFileName.includes(variant.toLowerCase()) || 
        lowerContent.includes(variant.toLowerCase())
      )
    );
  };
  
  // 가격 정보 포함 여부 확인
  const hasPriceInfo = (chunk: PdfContext) => {
    const lowerContent = chunk.content.toLowerCase();
    return /\d+[\s]*(만원|원)/.test(lowerContent) || 
           priceKeywords.some(keyword => lowerContent.includes(keyword));
  };
  
  // 모델 관련 청크이면서 가격 정보가 있는지 확인
  const hasModelPriceInfo = newChunks.some(chunk => 
    isModelRelated(chunk) && hasPriceInfo(chunk)
  );
  
  // 모델 가격 정보가 있으면 최대 청크 수를 20개로 증가
  const adjustedMaxChunks = hasModelPriceInfo ? 20 : maxChunks;
  
  return {
    ...context,
    recentPdfChunks: [...newChunks, ...context.recentPdfChunks]
      .slice(0, adjustedMaxChunks)
  };
}

// PDF 컨텍스트를 시스템 프롬프트에 통합하는 함수
function integrateContextToPrompt(basePrompt: string, context: ConversationContext): string {
  if (context.recentPdfChunks.length === 0) return basePrompt;

  // 파일명별로 컨텍스트 그룹화
  const fileGroups: Record<string, string[]> = {};
  
  context.recentPdfChunks.forEach(chunk => {
    if (!fileGroups[chunk.fileName]) {
      fileGroups[chunk.fileName] = [];
    }
    fileGroups[chunk.fileName].push(chunk.content);
  });
  
  // 모델 관련 파일 확인
  const modelFiles = Object.keys(fileGroups).filter(fileName => {
    const lowerFileName = fileName.toLowerCase();
    return Object.values(modelNameMapping).some(variants => 
      variants.some(variant => lowerFileName.includes(variant.toLowerCase()))
    );
  });
  
  // 파일별로 컨텍스트 구성
  const formattedContext = Object.entries(fileGroups)
    .map(([fileName, contents]) => {
      const fileNameWithoutExt = fileName.replace(/\.pdf$/, '').replace(/^price_/, '');
      
      // 모델 파일인 경우 특별 처리
      if (modelFiles.includes(fileName)) {
        // 모델명 추출 시도
        let modelName = fileNameWithoutExt;
        
        // price_모델명.pdf 형식에서 모델명 추출
        const match = fileName.match(/price_(.+)\.pdf/);
        if (match) {
          modelName = match[1];
        }
        
        return `## ${modelName.toUpperCase()} 관련 정보 (중요):\n${contents.join('\n\n')}`;
      }
      
      return `## ${fileNameWithoutExt} 관련 정보:\n${contents.join('\n\n')}`;
    })
    .join('\n\n');

  let additionalInstructions = '';
  if (modelFiles.length > 0) {
    additionalInstructions = `
특별 지시사항: 
- 차량 모델 관련 정보가 포함되어 있습니다. 모든 트림 정보와 가격을 빠짐없이 제공해주세요.
- 가솔린, 디젤, LPG, 하이브리드, 전기차 등 모든 엔진 타입별 트림 정보를 포함해주세요.
- 모든 트림 레벨(노블레스, 프레스티지, 시그니처 등)의 가격을 포함해주세요.
- 가격 정보는 개별소비세 적용/미적용 가격을 모두 표시해주세요.
- 트림별 주요 옵션과 특징도 함께 설명해주세요.
- 사용자가 특정 모델에 대해 물어본 경우, 해당 모델의 모든 트림과 가격 정보를 상세히 제공하세요.`;
  }

  return `${basePrompt}\n\n# PDF 문서 컨텍스트 (참고 자료):\n${formattedContext}\n\n위 내용을 참고하여 자연스럽게 답변해주세요. 가격 정보나 트림 정보를 질문받았을 때는 가능한 모든 관련 정보를 포함하여 답변해주세요.${additionalInstructions}`;
}

// 이름에서 다른 사람 언급 추출 함수
async function extractMentionedPerson(message: string): Promise<string | null> {
  // 다양한 이름 패턴 처리
  const patterns = [
    // 성+이름 패턴 (예: 이재권, 김철수)
    /([가-힣]{2,4})(?:님|씨|대표님)?/,
    // 이름만 + 이 패턴 (예: 재권이, 철수야)
    /([가-힣]{2,3})이(?:가|는|께|야|님|씨|대표님)?/,
    // 성을 제외한 이름만 (예: 재권, 철수)
    /([가-힣]{2,3})/
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) {
      // 기본적인 조사 제거
      const name = match[1].replace(/[은는이가을를의]$/, '');
      
      // 이름만 있는 경우 데이터베이스에서 전체 이름 찾기
      if (name.length === 2) {
        const fullName = await findFullName(name);
        return fullName;
      }
      
      return name;
    }
  }
  
  return null;
}

// 부분 이름으로 전체 이름 찾기
async function findFullName(partialName: string): Promise<string | null> {
  try {
    const { data: owners } = await supabase
      .from('owners')
      .select('name')
      .ilike('name', `%${partialName}`);

    if (owners && owners.length > 0) {
      // 가장 짧은 이름을 반환 (가장 정확한 매치일 가능성이 높음)
      return owners.sort((a, b) => a.name.length - b.name.length)[0].name;
    }
  } catch (error) {
    console.error('Error finding full name:', error);
  }
  
  return partialName;
}

// 다른 사람의 정보 조회 함수
async function getPersonInfo(name: string) {
  try {
    // 이름으로 owners 테이블 검색 (부분 이름 매칭 개선)
    const { data: ownerData, error } = await supabase
      .from('owners')
      .select('*')
      .or(`name.ilike.%${name}%,name.ilike.%${name.replace(/이$/, '')}%`)
      .single();

    if (error || !ownerData) {
      console.log(`No owner found with name: ${name}`);
      return null;
    }

    // 해당 owner의 projects와 experiences 정보 조회
    const [{ data: projects }, { data: experiences }] = await Promise.all([
      supabase
        .from('projects')
        .select('*')
        .eq('owner_id', ownerData.owner_id),
      supabase
        .from('experiences')
        .select('*')
        .eq('owner_id', ownerData.owner_id)
    ]);

    const personProjectInfo = (projects || [])
      .map((p: Project) => `- ${p.title}: ${p.description} (기술 스택: ${p.tech_stack.join(', ')})`)
      .join('\n');

    const personExperienceInfo = (experiences || [])
      .map((e: Experience) => `- ${e.company}의 ${e.position} (${e.period})\n  ${e.description}`)
      .join('\n');

    // 정민기 대표님인 경우와 그 외의 경우 구분
    const honorific = ownerData.name === '정민기' ? '대표님' : '님';

    return {
      owner: ownerData,
      projectInfo: personProjectInfo,
      experienceInfo: personExperienceInfo,
      honorific
    };
  } catch (error) {
    console.error('Error fetching person info:', error);
    return null;
  }
}

export async function GET(request: Request) {
  const ownerId = process.env.NEXT_PUBLIC_OWNER_ID;

  try {
    const { data, error } = await supabase
      .from('chat_history')
      .select('*')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return new Response(JSON.stringify(data));
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch messages' }), { status: 500 });
  }
}

export async function POST(request: Request) {
  const { messages, pdfContent } = await request.json();
  const lastUserMessage = messages.findLast((msg: Message) => msg.role === 'user')?.content || '';
  const ownerId = process.env.NEXT_PUBLIC_OWNER_ID;

  try {
    // 대화 컨텍스트 초기화
    let conversationContext: ConversationContext = {
      pdfContent: pdfContent,
      recentPdfChunks: []
    };

    // PDF 관련 청크 검색
    if (lastUserMessage) {
      const relevantChunks = await searchRelevantChunks(lastUserMessage);
      if (relevantChunks.length > 0) {
        conversationContext = updateConversationContext(conversationContext, relevantChunks);
      }
    }

    // 기본 시스템 프롬프트 구성
    let systemPrompt = `당신은 기아자동차의 가격표와 카탈로그 정보를 제공하는 챗봇입니다.

역할:
- 기아자동차 차량의 가격, 사양, 옵션 등에 대한 정보 제공
- PDF 문서에서 추출한 정보를 기반으로 정확한 답변 제공
- 사용자의 질문에 친절하고 전문적으로 응답

차량 정보 제공 지침:
1. 가격 정보 요청 시:
   - 모든 트림별 가격을 상세히 나열
   - 가격표에 있는 모든 트림 정보를 빠짐없이 제공
   - 옵션에 따른 가격 변동 사항도 포함
   - 트림별 가격은 항상 트림명과 함께 제시
   - 가격 정보 앞에는 항상 '**' 강조 표시를 사용
   - 엔진 타입별(가솔린, 디젤, LPG, 하이브리드 등)로 구분하여 제공
   - 개별소비세 적용/미적용 가격을 모두 표시

2. 트림 정보 요청 시:
   - 모든 트림 종류와 각 트림의 주요 특징 설명
   - 트림별 기본 사양과 옵션 차이점 상세히 설명
   - 가능한 모든 트림 정보를 빠짐없이 제공
   - 트림별 주요 옵션과 특징을 함께 설명

3. 단종 모델 정보:
   - K3는 현재 단종되어 더 이상 판매되지 않습니다. K3에 대한 가격이나 정보 문의 시 'K3는 현재 단종되어 더 이상 판매되지 않습니다. 대신 K3의 후속 모델인 신형 K3를 추천드립니다.'라고 답변해주세요.

4. 차종별 정보 제공 방식:
   - 사용자가 특정 모델에 대해 물어보면 해당 모델의 모든 트림과 가격 정보를 상세히 제공
   - 정보가 많은 경우에도 요약하지 말고 모든 정보를 빠짐없이 제공
   - 트림별 가격 정보는 표 형식이 아닌 목록 형식으로 제공하여 가독성 높이기

답변 스타일:
1. PDF 내용 관련 질문:
   - PDF 내용을 기반으로 정확하게 답변
   - 불확실한 내용은 "PDF에서 해당 내용을 찾을 수 없습니다"라고 답변
2. 일반 대화:
   - 친근하고 전문적인 어조 유지
   - 필요시 개인 경험이나 지식 공유
- 항상 정중하고 예의 바른 어투 사용

주의사항:
- PDF 내용과 관련된 질문에는 반드시 문서 내용을 기반으로 답변
- 불확실한 내용은 추측하지 않고 모른다고 답변
- 민감한 정보는 공유하지 않음
- 페이지 번호나 문서 출처를 언급하지 않음
`;

    // PDF 컨텍스트가 있는 경우 시스템 프롬프트에 통합
    systemPrompt = integrateContextToPrompt(systemPrompt, conversationContext);

    // OpenAI API 호출
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    // 채팅 내역 저장
    await supabase.from('chat_history').insert({
      role: 'user',
      content: lastUserMessage,
      owner_id: ownerId,
      pdf_context: conversationContext.recentPdfChunks.length > 0 ? {
        file_name: conversationContext.fileName,
        chunks: conversationContext.recentPdfChunks
      } : null
    });

    return new Response(
      JSON.stringify({ 
        response: response.choices[0].message.content,
        pdfContext: conversationContext.recentPdfChunks.length > 0 ? {
          fileName: conversationContext.fileName,
          pages: conversationContext.recentPdfChunks.map(chunk => chunk.pageNumber)
        } : null
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in chat route:', error);
    return new Response(
      JSON.stringify({ error: 'An error occurred during processing' }), 
      { status: 500 }
    );
  }
}
