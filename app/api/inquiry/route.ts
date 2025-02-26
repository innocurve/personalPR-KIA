import { NextResponse } from 'next/server'

const MAKE_WEBHOOK_URL = process.env.MAKE_WEBHOOK_URL

export async function POST(req: Request) {
  if (!MAKE_WEBHOOK_URL) {
    console.error('Webhook URL is not defined')
    return NextResponse.json(
      { error: 'Webhook URL이 설정되지 않았습니다.' },
      { status: 500 }
    )
  }

  try {
    const data = await req.json()
    console.log('Received data:', data) // 데이터 로깅
    
    const response = await fetch(MAKE_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(data),
    })

    // 응답 로깅
    console.log('Webhook response status:', response.status)
    const responseText = await response.text()
    console.log('Webhook response:', responseText)

    if (response.status === 400 && responseText.includes('Access denied from this IP')) {
      return NextResponse.json(
        { error: 'IP 접근 권한이 없습니다. 관리자에게 문의해주세요.' },
        { status: 400 }
      )
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: `웹훅 전송 실패: ${responseText}` },
        { status: response.status }
      )
    }

    return NextResponse.json({ 
      success: true, 
      message: '문의가 성공적으로 전송되었습니다.' 
    })

  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 500 }
    )
  }
} 