export async function sendKakaoMessage({
  accessToken,
  templateId,
  templateArgs,
}: {
  accessToken: string;
  templateId: string;
  templateArgs: Record<string, string>;
}) {
  const response = await fetch('https://kapi.kakao.com/v2/api/talk/memo/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`, // Access Token
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      template_id: templateId,
      template_args: JSON.stringify(templateArgs),
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('카카오톡 메시지 전송 실패:', error);
    throw new Error('카카오톡 메시지 전송 실패');
  }

  console.log('카카오톡 메시지 전송 성공');
}