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
  'k5': ['케이5', 'k5'],
  'k8': ['케이8', 'k8'],
  'k9': ['케이9', 'k9'],
  'carnival': ['카니발', 'carnival'],
  'carnival-hi-limousine': ['카니발 하이브리드', 'carnival-hi-limousine'],
  'sportage': ['스포티지', 'sportage', 'Sportage', 'SPORTAGE'],
  'sorento': ['쏘렌토', 'sorento', 'Sorento', 'SORENTO'],
  'mohave': ['모하비', 'mohave'],
  'niro': ['니로', 'niro'],
  'ev6': ['이브이6', 'ev6'],
  'ev9': ['이브이9', 'ev9'],
  'bongo': ['봉고', 'bongo'],
  'morning': ['모닝', 'morning'],
  'seltos': ['셀토스', 'seltos'],
  'tasman': ['티스만', 'tasman']
};

function extractRequestedModels(message: string): string[] {
  const lowerMessage = message.toLowerCase();
  const requestedModels: string[] = [];
  for (const canonical in modelNameMapping) {
    for (const keyword of modelNameMapping[canonical]) {
      if (lowerMessage.includes(keyword.toLowerCase())) {
        requestedModels.push(canonical);
        break; // 같은 모델에 대해 여러 키워드가 중복으로 걸리지 않도록
      }
    }
  }
  return requestedModels;
}


// 키워드 기반 PDF 청크 검색 함수
async function searchRelevantChunks(question: string, fileName?: string): Promise<PdfContext[]> {
  const ownerId = process.env.NEXT_PUBLIC_OWNER_ID;
  
  // 차량 가격 관련 키워드 추출
  const priceKeywords = ['가격', '금액', '원', '만원', '얼마', '얼마야', '얼마예요', '얼마에요'];
  
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
      const filePatterns = expandedModelKeywords.map(model => 
        `file_name.ilike.%${model}%`
      );
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
      
      // 파일명에서 모델명 매칭 (가장 높은 가중치)
      expandedModelKeywords.forEach(model => {
        if (chunk.file_name.toLowerCase().includes(model.toLowerCase())) {
          score += 15; // 파일명 매칭에 더 높은 점수 부여
        }
      });

      // 내용에서 모델명 매칭
      expandedModelKeywords.forEach(model => {
        if (lowerContent.includes(model.toLowerCase())) {
          score += 10;
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
          score += 3;
        }
      }

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

    // 상위 청크 반환 (가격 정보 검색 시 제한 없음)
    return scoredChunks
      .sort((a, b) => b.score - a.score)
      .slice(0, isPriceQuery ? undefined : 3)
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
  maxChunks: number = 5
): ConversationContext {
  return {
    ...context,
    recentPdfChunks: [...newChunks, ...context.recentPdfChunks]
      .slice(0, maxChunks) // 최근 5개 청크만 유지
  };
}

// PDF 컨텍스트를 시스템 프롬프트에 통합하는 함수
function integrateContextToPrompt(basePrompt: string, context: ConversationContext): string {
  if (context.recentPdfChunks.length === 0) return basePrompt;

  const pdfContext = context.recentPdfChunks
    .map(chunk => chunk.content)
    .join('\n\n');

  return `${basePrompt}\n\n# PDF 문서 컨텍스트 (참고 자료):\n${pdfContext}\n\n위 내용을 참고하여 자연스럽게 답변해주세요.`;
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
    // ----- 동적 차량 모델 추출 및 가격 정보 조회 시작 -----
    if (lastUserMessage.toLowerCase().includes("가격")) {
      // 모델명 추출: modelNameMapping을 이용
      const requestedModels = extractRequestedModels(lastUserMessage);
      if (requestedModels.length > 0) {
        let finalResponse = "";
        for (const model of requestedModels) {
          const { data: modelPriceData, error: priceError } = await supabase
            .from('kia_vehicle_info')
            .select('content')
            .eq('type', 'price')
            .eq('model', model)
            .single();

          if (priceError || !modelPriceData) {
            finalResponse += `${model.toUpperCase()} 가격 정보를 조회할 수 없습니다.\n\n`;
            continue;
          }

          const pricingJSON = modelPriceData.content;
          let priceResponse = `${model.toUpperCase()} 가격 정보:\n\n`;
          for (const engine in pricingJSON) {
            priceResponse += `[${engine.replace(/_/g, ' ')}]\n`;
            const trims = pricingJSON[engine];
            for (const trim in trims) {
              const details = trims[trim];
              let detailStrings: string[] = [];
              for (const key in details) {
                const displayKey = key.replace(/_/g, ' ');
                const value = details[key];
                detailStrings.push(
                  typeof value === 'number'
                    ? `${displayKey}: ${value}만원`
                    : `${displayKey}: ${value}`
                );
              }
              priceResponse += `- ${trim}: ${detailStrings.join(', ')}\n`;
            }
            priceResponse += "\n";
          }
          finalResponse += priceResponse;
        }
        finalResponse += `\n추가로 궁금하신 사항이 있으시면 언제든지 말씀해 주세요!`;
        return new Response(
          JSON.stringify({ response: finalResponse }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      }
    }
    // ----- 동적 차량 모델 추출 및 가격 정보 조회 끝 -----

    // 기존 PDF 관련 대화 컨텍스트 초기화 및 청크 검색 (가격 문의가 아닐 경우 실행)
    let conversationContext: ConversationContext = {
      pdfContent: pdfContent,
      recentPdfChunks: []
    };

    if (lastUserMessage) {
      const relevantChunks = await searchRelevantChunks(lastUserMessage);
      if (relevantChunks.length > 0) {
        conversationContext = updateConversationContext(conversationContext, relevantChunks);
      }
    }

    let systemPrompt = `당신은 정이노의 AI 클론입니다. 아래 정보를 바탕으로 1인칭으로 자연스럽게 대화하세요.
    현재 시각은 ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })} 입니다.
  
당신은 기아자동차의 친절한 상담원이며 기아자동차의 기본적인 지식을 알고 있습니다.

차량 모델명 인식 규칙:
1. 영문/한글 변환 규칙:
   - "ray" = "레이"
   - "rayEV" = "레이 EV"
   - "K3" = "케이3" = "케이쓰리"
   - "K5" = "케이5" = "케이파이브"
   - "K8" = "케이8" = "케이에잇"
   - "K9" = "케이9" = "케이나인"
   - "Carnival" = "카니발"
   - "Sportage" = "스포티지"
   - "Sorento" = "쏘렌토"
   - "Mohave" = "모하비"
   - "Niro" = "니로"
   - "EV6" = "이브이6"
   - "EV9" = "이브이9"
   - "Bongo" = "봉고"
   - "Morning" = "모닝"
   - "Seltos" = "셀토스"
   - "Tasman" = "티스만"

2. 조합 규칙:
   - 영문과 한글 표기는 동일한 의미로 처리
   - 띄어쓰기 유무는 무시
   - 대소문자 구분 없이 처리
   - 예시: 
     * "rayEV" = "레이EV" = "레이 이브이"
     * "K3 GT" = "케이3 GT" = "K3지티"
     * "EV6 GT" = "이브이6 GT" = "EV6 지티"

3. 검색 처리:
   - 사용자가 영문으로 입력하더라도 한글 표기로 된 내용을 찾아서 답변
   - 한글과 영문이 혼용된 경우에도 동일한 차량으로 인식
   - 모델명이 포함된 다양한 표현 방식을 모두 인식하여 관련 정보 제공

가격 답변 규칙:
1. 기본 가격 안내:
   - PDF 문서에서 찾은 가격 정보를 우선적으로 제공
   - PDF에서 찾은 모든 트림의 가격 정보를 빠짐없이 안내
   - PDF에서 정보를 찾지 못한 경우에만 기본 가격 정보를 사용
   - 가격은 숫자와 '만원' 단위로 표시 (예: "2,775만원")
   - 트림별 가격은 항상 트림명과 함께 제시
   - 가격 정보 앞에는 항상 '**' 강조 표시를 사용

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

    systemPrompt = integrateContextToPrompt(systemPrompt, conversationContext);

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 4000
    });

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