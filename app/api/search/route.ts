import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  console.log('[Search API] Received request')
  
  try {
    // 1. Request Body 파싱
    const body = await request.json().catch(error => {
      console.error('[Search API] Failed to parse request body:', error)
      return null
    })

    if (!body) {
      return NextResponse.json(
        { error: '잘못된 요청 형식입니다.' },
        { status: 400 }
      )
    }

    const { query } = body
    console.log('[Search API] Query:', query)

    if (!query || typeof query !== 'string') {
      console.log('[Search API] Invalid or missing query')
      return NextResponse.json(
        { error: '검색어를 입력해주세요.' },
        { status: 400 }
      )
    }

    // 2. API 키 확인
    const apiKey = process.env.PERPLEXITY_API_KEY
    console.log('[Search API] API Key exists:', !!apiKey)

    if (!apiKey) {
      console.error('[Search API] API key is missing')
      return NextResponse.json(
        { error: 'API 키가 설정되지 않았습니다. 관리자에게 문의해주세요.' },
        { status: 500 }
      )
    }

    // 3. API 요청 시도
    try {
      console.log('[Search API] Attempting completion...')
      
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "sonar",
          messages: [
            {
              role: "system",
              content: `당신은 검색 결과를 요약해주는 AI 도우미입니다. 다음 형식으로 응답해주세요:

[요약]
핵심 내용을 200자 이내로 명확하게 요약해주세요.

[출처]
- https://example.com (각 URL을 이런 형식으로 직접 입력)
- https://another-example.com
- https://third-example.com

[추가 정보]
추가로 참고할만한 관련 정보를 입력해주세요.

반드시 [요약], [출처], [추가 정보] 섹션을 모두 포함해야 합니다.
요약은 200자를 넘지 않도록 해주세요.`
            },
            {
              role: "user",
              content: query
            }
          ],
          max_tokens: 300,
          temperature: 0.1,
          top_p: 0.9,
          stream: false,
          presence_penalty: 0,
          frequency_penalty: 0.1
        })
      })
      

      console.log('[Search API] Response status:', response.status)

      // 4. 응답 처리
      const responseText = await response.text()
      console.log('[Search API] Raw response:', responseText)

      if (!response.ok) {
        throw new Error(`API 요청 실패 (${response.status}): ${responseText}`)
      }

      let data
      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        console.error('[Search API] Failed to parse response:', parseError)
        throw new Error('API 응답을 파싱할 수 없습니다.')
      }

      if (!data.choices?.[0]?.message?.content) {
        console.error('[Search API] Invalid response format:', data)
        throw new Error('API 응답 형식이 올바르지 않습니다.')
      }

      // 5. 성공 응답 반환
      const content = data.choices[0].message.content;
      const sections = content.split('\n\n');
      
      let summary = '';
      let sources: string[] = [];
      let additionalInfo = '';

      sections.forEach((section: string) => {
        if (section.startsWith('[요약]')) {
          // 1. 기본적인 텍스트 정리
          let processedText = section
            .replace('[요약]\n', '')
            .replace(/\[\d+\]/g, '') // 참조 번호 제거
            .replace(/\d+\)/g, '') // 숫자 리스트 제거
            .replace(/\s+/g, ' ') // 연속된 공백 정리
            .trim();

          // 2. 문장 단위로 분리하고 처리
          const sentences = processedText
            .split('.')
            .map(s => s.trim())
            .filter(s => s.length > 0);

          // 3. 각 문장 검증 및 정리
          const validSentences = sentences.filter(sentence => {
            // 최소 길이 체크 (의미 있는 문장인지 확인)
            if (sentence.length < 5) return false;
            
            // 문장이 조사나 접속사로 끝나는지 확인
            const koreanParticles = ['이', '가', '을', '를', '은', '는', '로', '으로'];
            const endsWithParticle = koreanParticles.some(particle => 
              sentence.endsWith(particle)
            );
            
            // 문장이 불완전하게 끝나는지 확인
            const hasIncompletePhrases = sentence.match(/요$|다$/);
            
            return !endsWithParticle && hasIncompletePhrases;
          });

          // 4. 문장 결합
          summary = validSentences
            .map(s => s.trim() + '.')
            .join(' ')
            .replace(/\.\./g, '.') // 중복 마침표 제거
            .trim();

          // 5. 빈 결과 처리
          if (!summary) {
            summary = '검색 결과를 찾을 수 없습니다.';
          }
        } else if (section.startsWith('[출처]')) {
          sources = section
            .replace('[출처]\n', '')
            .split('\n')
            .filter(line => line.trim().startsWith('- '))
            .map(line => {
              const url = line.trim().replace('- ', '').trim();
              return url.startsWith('http') ? url : null;
            })
            .filter((url): url is string => url !== null);
        } else if (section.startsWith('[추가 정보]')) {
          // 추가 정보도 동일한 정리 과정 적용
          additionalInfo = section
            .replace('[추가 정보]\n', '')
            .replace(/\[\d+\]/g, '')
            .replace(/\d+\)/g, '')
            .replace(/\s+/g, ' ')
            .trim();
        }
      });

      return NextResponse.json({
        results: [{
          title: 'searchResult',
          text: summary,
          sources: sources,
          additionalInfo: additionalInfo,
          url: undefined
        }]
      })

    } catch (fetchError) {
      console.error('[Search API] Fetch error:', fetchError)
      return NextResponse.json(
        { 
          error: 'API 요청 중 오류가 발생했습니다.',
          details: fetchError instanceof Error ? fetchError.message : String(fetchError)
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('[Search API] General error:', error)
    return NextResponse.json(
      { 
        error: '서버 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
} 