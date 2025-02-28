import { NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function POST(request: Request) {
  console.log('[Chat API] Received request')
  
  try {
    // 1. Request Body 파싱
    const body = await request.json().catch(error => {
      console.error('[Chat API] Failed to parse request body:', error)
      return null
    })

    if (!body) {
      return NextResponse.json(
        { error: '잘못된 요청 형식입니다.' },
        { status: 400 }
      )
    }

    const { query } = body
    console.log('[Chat API] Query:', query)

    if (!query || typeof query !== 'string') {
      console.log('[Chat API] Invalid or missing query')
      return NextResponse.json(
        { error: '메시지를 입력해주세요.' },
        { status: 400 }
      )
    }

    // 2. API 키 확인
    const apiKey = process.env.OPENAI_API_KEY
    console.log('[Chat API] API Key exists:', !!apiKey)

    if (!apiKey) {
      console.error('[Chat API] API key is missing')
      return NextResponse.json(
        { error: 'API 키가 설정되지 않았습니다. 관리자에게 문의해주세요.' },
        { status: 500 }
      )
    }

    // 3. OpenAI 클라이언트 초기화
    const openai = new OpenAI({ apiKey })

    try {
      console.log('[Chat API] Attempting completion...')
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `당신은 친절하고 전문적인 AI 어시스턴트입니다. 
            사용자의 질문에 대해 명확하고 이해하기 쉽게 답변해주세요.
            답변은 한국어로 작성하며, 전문적이고 정확한 정보를 제공하되 친근한 톤을 유지해주세요.
            답변의 길이는 적절하게 조절하고, 필요한 경우 예시를 들어 설명해주세요.`
          },
          {
            role: "user",
            content: query
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      })

      console.log('[Chat API] Response received')

      if (!completion.choices[0]?.message?.content) {
        throw new Error('응답이 비어있습니다.')
      }

      // 4. 응답 반환
      return NextResponse.json({
        results: [{
          title: 'chatResult',
          text: completion.choices[0].message.content.trim(),
          additionalInfo: '',
        }]
      })

    } catch (fetchError) {
      console.error('[Chat API] OpenAI error:', fetchError)
      return NextResponse.json(
        { 
          error: 'AI 응답 생성 중 오류가 발생했습니다.',
          details: fetchError instanceof Error ? fetchError.message : String(fetchError)
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('[Chat API] General error:', error)
    return NextResponse.json(
      { 
        error: '서버 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
} 