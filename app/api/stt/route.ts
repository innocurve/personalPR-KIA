import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      throw new Error('오디오 파일이 없습니다.');
    }

    // 파일 크기 체크 (25MB 제한)
    if (audioFile.size > 25 * 1024 * 1024) {
      throw new Error('파일 크기는 25MB를 초과할 수 없습니다.');
    }

    // 오디오 파일을 Buffer로 변환
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Whisper API 호출 - 향상된 설정
    const transcription = await openai.audio.transcriptions.create({
      file: new File([buffer], audioFile.name, { type: audioFile.type }),
      model: 'whisper-1',
      language: 'ko',
      response_format: 'text',
      temperature: 0.3,  // 더 보수적인 텍스트 생성
      prompt: '이것은 AI 챗봇과의 대화입니다. 한국어로 명확하게 변환해주세요. 문장을 자연스럽게 완성하고 맥락을 고려하여 변환합니다.'
    });

    return NextResponse.json({ text: transcription });
  } catch (error) {
    console.error('STT 처리 중 오류:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'STT 변환 중 오류가 발생했습니다.' 
      },
      { status: 500 }
    );
  }
}