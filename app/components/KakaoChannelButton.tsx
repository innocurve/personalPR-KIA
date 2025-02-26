import React, { useEffect } from 'react';
import { Button } from "@/components/ui/button";

declare global {
  interface Window {
    Kakao: any;
  }
}

interface KakaoChannelButtonProps {
  channelPublicId: string;
}

export function KakaoChannelButton({ channelPublicId }: KakaoChannelButtonProps) {
  useEffect(() => {
    if (window.Kakao && !window.Kakao.isInitialized()) {
      window.Kakao.init(process.env.NEXT_PUBLIC_KAKAO_JavaScript_KEY);
    }
  }, []);

  const handleAddChannel = () => {
    if (window.Kakao) {
      window.Kakao.Channel.addChannel({
        channelPublicId,
      });
    }
  };

  return (
    <Button
      onClick={handleAddChannel}
      className="bg-yellow-400 text-yellow-800 hover:bg-yellow-500"
    >
      카카오톡 채널 추가하기
    </Button>
  );
}

