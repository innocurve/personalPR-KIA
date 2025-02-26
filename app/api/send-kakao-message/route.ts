import { NextResponse } from 'next/server';
import { supabase } from '@/app/utils/supabase';
import axios from 'axios';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phoneNumber } = body;

    // Supabase로 데이터 저장
    const { error } = await supabase
      .from('reservations')
      .insert({
        name,
        phone_number: phoneNumber,
        // 다른 필요한 필드들...
      });

    if (error) throw error;

    // 나머지 카카오 메시지 전송 로직...
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending Kakao message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}

