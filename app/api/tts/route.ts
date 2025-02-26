import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { text, voice_settings } = await request.json();
    
    // 두 가지 환경 변수 이름을 모두 지원하도록 수정
    const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || process.env.ELEVEN_LABS_VOICE_ID;
    const API_KEY = process.env.ELEVENLABS_API_KEY || process.env.ELEVEN_LABS_API_KEY;

    // 환경 변수 검증 로깅 개선
    console.log('환경 변수 상태:', { 
      hasApiKey: !!API_KEY, 
      apiKeyLength: API_KEY?.length,
      hasVoiceId: !!VOICE_ID,
      voiceId: VOICE_ID
    });

    if (!VOICE_ID || !API_KEY) {
      throw new Error('ElevenLabs API 키 또는 Voice ID가 설정되지 않았습니다.');
    }

    // TTS 요청
    console.log('TTS 요청 시작:', { 
      textLength: text.length,
      model: 'eleven_multilingual_v2',
      voice_settings
    });

    const ttsResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'xi-api-key': API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: voice_settings || {
            stability: 0.3,
            similarity_boost: 0.8,
          }
        }),
      }
    );

    if (!ttsResponse.ok) {
      const errorData = await ttsResponse.text();
      console.error('TTS 요청 실패:', {
        status: ttsResponse.status,
        statusText: ttsResponse.statusText,
        error: errorData
      });

      if (ttsResponse.status === 401) {
        throw new Error('인증 실패: API 키가 유효하지 않습니다.');
      } else if (ttsResponse.status === 422) {
        throw new Error('잘못된 요청: 텍스트가 너무 길거나 형식이 잘못되었습니다.');
      } else if (ttsResponse.status === 429) {
        throw new Error('요청 한도 초과: API 사용량을 확인해주세요.');
      }

      throw new Error(`TTS 변환 실패: ${ttsResponse.status} ${ttsResponse.statusText}`);
    }

    console.log('TTS 응답 수신 완료');
    const audioBlob = await ttsResponse.blob();
    
    if (audioBlob.size === 0) {
      throw new Error('생성된 오디오가 비어있습니다.');
    }

    console.log('오디오 변환 성공:', {
      size: audioBlob.size,
      type: audioBlob.type
    });

    return new Response(audioBlob, {
      headers: { 
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-cache'
      },
    });
  } catch (error) {
    console.error('TTS 처리 중 오류:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'TTS 변환 중 오류가 발생했습니다.',
        details: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error
      },
      { status: 500 }
    );
  }
} 