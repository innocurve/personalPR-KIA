import { OpenAI } from 'openai';
import { supabase } from '@/app/utils/supabase';
import { stopWords } from '@/lib/pdfUtils';

// OpenAI 인스턴스 생성
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// 타입 정의
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

// 키워드 기반 PDF 청크 검색 함수
async function searchRelevantChunks(question: string): Promise<string> {
  const ownerId = process.env.NEXT_PUBLIC_OWNER_ID;
  const keywords = question
    .split(/[\s,.]+/)
    .filter(word => word.length > 1 && !stopWords.has(word));

  if (keywords.length === 0) return '';

  try {
    const { data: chunks, error } = await supabase
      .from('pdf_chunks')
      .select('*')
      .or(keywords.map(word => 
        `content.ilike.%${word}%,keywords.cs.{${word}}`
      ).join(','));

    if (error) throw error;

    // 점수 계산 로직
    const scoredChunks = (chunks || []).map((chunk: PdfChunk) => {
      let score = 0;
      const lowerContent = chunk.content.toLowerCase();
      
      keywords.forEach(keyword => {
        const keywordLower = keyword.toLowerCase();
        if (lowerContent.includes(keywordLower)) {
          score += 2;
        }
        if (chunk.keywords?.some(k => k.toLowerCase() === keywordLower)) {
          score += 1;
        }
      });

      return { content: chunk.content, score };
    });

    const topChunks = scoredChunks
      .sort((a, b) => b.score - a.score)
      .slice(0, 2);

    return topChunks.map(chunk => chunk.content).join('\n\n');
  } catch (error) {
    console.error('PDF 검색 오류:', error);
    return '';
  }
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
  const { messages } = await request.json();
  const lastUserMessage = messages.findLast((msg: any) => msg.role === 'user')?.content || '';
  const ownerId = process.env.NEXT_PUBLIC_OWNER_ID;

  try {
    // 메시지에서 언급된 사람 찾기
    const mentionedPerson = await extractMentionedPerson(lastUserMessage);
    let mentionedPersonInfo = null;
    
    if (mentionedPerson) {
      mentionedPersonInfo = await getPersonInfo(mentionedPerson);
    }

    // owner_id로 필터링하여 해당 소유자의 데이터만 가져오기
    const [{ data: projects }, { data: experiences }, { data: owner }] = await Promise.all([
      supabase
        .from('projects')
        .select('*')
        .eq('owner_id', ownerId),
      supabase
        .from('experiences')
        .select('*')
        .eq('owner_id', ownerId),
      supabase
        .from('owners')
        .select('*')
        .eq('owner_id', ownerId)
        .single()
    ]);

    if (!owner) {
      throw new Error('Owner not found');
    }

    const projectInfo = (projects || [])
      .map((p: Project) => `- ${p.title}: ${p.description} (기술 스택: ${p.tech_stack.join(', ')})`)
      .join('\n');

    const experienceInfo = (experiences || [])
      .map((e: Experience) => `- ${e.company}의 ${e.position} (${e.period})\n  ${e.description}`)
      .join('\n');

    const ownerInfo = owner
      ? `이름: ${owner.name}\n나이: ${owner.age}\n취미: ${owner.hobbies.join(', ')}\n가치관: ${owner.values}\n나라: ${owner.country}\n생년월일: ${owner.birth}\nowner_id: ${owner.owner_id}`
      : '';

    // 시스템 프롬프트 작성
    let systemPrompt = `당신은 정이노의 AI 클론입니다. 아래 정보를 바탕으로 1인칭으로 자연스럽게 대화하세요.
    현재 시각은 ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })} 입니다.
  
성격 및 특징:
- 비전 있는 리더 스타일로, 목표 지향적이며 새로운 것을 개척하는 것을 좋아합니다.
- 주어진 길을 따르기보다는 스스로 길을 만들어가는 성향입니다.
- 논리적이면서도 실행력이 뛰어나, 생각을 빠르게 실천으로 옮기는 특징이 있습니다.
- 사회적 가치를 중요시하며, 특히 AI와 청년들을 연결해 미래를 만들어가는 데 큰 관심이 있습니다.
- 주변 사람들에게 긍정적인 영향을 주며 동기부여를 잘하는 편입니다.

소속 회사 정보:
회사명: 이노커브(INNOCURVE)
대표: 정민기
주요 사업: AI 기반의 고객 맞춤형 컨설팅
특징: 혁신적인 AI 솔루션을 통한 맞춤형 비즈니스 컨설팅 제공

기본 정보:
${ownerInfo}

경력:
${experienceInfo}

프로젝트:
${projectInfo}

답변 시 주의사항:
- 정민기님을 언급할 때는 "정민기 대표님"으로 호칭
- 다른 분들을 언급할 때는 이름 뒤에 "님"을 붙여서 호칭 (예: "이재권님", "김철수님")
- 항상 정중하고 예의 바른 어투 사용
- 다른 사람에 대해 질문받았을 때는 현재 직책/역할만 간단히 답변
- 예시 답변: "이재권님은 저희 회사의 CTO이십니다."`;

    // 다른 사람의 정보가 있다면 시스템 프롬프트에 추가 (비공개 정보로)
    if (mentionedPersonInfo) {
      systemPrompt += `\n\n# 비공개 참조 정보 (추가 질문이 있을 때만 사용)
${mentionedPerson}${mentionedPersonInfo.honorific}의 정보:
기본 정보:
이름: ${mentionedPersonInfo.owner.name}${mentionedPersonInfo.honorific}
나이: ${mentionedPersonInfo.owner.age}
취미: ${mentionedPersonInfo.owner.hobbies.join(', ')}
가치관: ${mentionedPersonInfo.owner.values}
${mentionedPersonInfo.owner.country ? `나라: ${mentionedPersonInfo.owner.country}` : ''}
${mentionedPersonInfo.owner.birth ? `생년월일: ${mentionedPersonInfo.owner.birth}` : ''}

경력:
${mentionedPersonInfo.experienceInfo}

프로젝트:
${mentionedPersonInfo.projectInfo}`;
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
    });

    // 채팅 내역 저장
    await supabase.from('chat_history').insert({
      role: 'user',
      content: lastUserMessage,
      owner_id: ownerId
    });

    return new Response(
      JSON.stringify({ response: response.choices[0].message.content }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('Error in chat route:', error);
    return new Response(JSON.stringify({ error: 'An error occurred' }), { status: 500 });
  }
}
