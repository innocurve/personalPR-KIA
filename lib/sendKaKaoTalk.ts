import axios from 'axios';
import crypto from 'crypto';

const accessKey = process.env.NAVER_CLOUD_ACCESS_KEY!;
const secretKey = process.env.NAVER_CLOUD_SECRET_KEY!;
const serviceId = process.env.NAVER_CLOUD_SERVICE_ID!;
const senderProfileId = process.env.SENDER_PROFILE_ID!;

if (!accessKey || !secretKey || !serviceId || !senderProfileId) {
  throw new Error('Missing required environment variables');
}

export async function sendMessage(recipientPhone: string, content: string) {
  const timestamp = Date.now().toString();
  const signature = makeSignature(timestamp);

  try {
    const response = await axios.post(
      `https://sens.apigw.ntruss.com/bizmessage/v2/services/${serviceId}/messages`,
      {
        messageType: 'AT', // 알림톡
        templateCode: 'your_template_code', // 등록한 템플릿 코드
        plusFriendId: senderProfileId,
        messages: [
          {
            to: recipientPhone,
            content: content,
          }
        ],
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-ncp-apigw-timestamp': timestamp,
          'x-ncp-iam-access-key': accessKey,
          'x-ncp-apigw-signature-v2': signature,
        },
      }
    );

    console.log('Message sent successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Failed to send message:', error);
    throw error;
  }
}

function makeSignature(timestamp: string) {
  const space = " ";
  const newLine = "\n";
  const method = "POST";
  const url = `/bizmessage/v2/services/${serviceId}/messages`;

  const hmac = crypto.createHmac('sha256', secretKey);
  hmac.update(method);
  hmac.update(space);
  hmac.update(url);
  hmac.update(newLine);
  hmac.update(timestamp);
  hmac.update(newLine);
  hmac.update(accessKey);

  return hmac.digest('base64');
}

