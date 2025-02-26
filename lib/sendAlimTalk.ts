import axios from 'axios';
import CryptoJS from 'crypto-js';

const apiKey = process.env.SOLAPI_API_KEY!;
const apiSecret = process.env.SOLAPI_API_SECRET!;

interface SendAlimtalkParams {
  to: string;
  from: string;
  templateId: string;
  variables: Record<string, string>;
}

export async function sendAlimtalk({ to, from, templateId, variables }: SendAlimtalkParams) {
  const date = new Date().toISOString();
  const salt = Math.random().toString(36).substring(2, 11);
  const signature = getSignature({ date, salt });

  try {
    const response = await axios.post(
      'https://api.solapi.com/messages/v4/send',
      {
        message: {
          to,
          from,
          type: 'ATA',
          kakaoOptions: {
            pfId: process.env.SOLAPI_PFID,
            templateId: templateId,
            disableSms: true,
            variables,
          },
        },
      },
      {
        headers: {
          Authorization: `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('Alimtalk sent successfully:', response.data);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      console.error('Failed to send Alimtalk. Response:', error.response.data);
    } else {
      console.error('Failed to send Alimtalk:', error);
    }
    throw error;
  }
}

function getSignature({ date, salt }: { date: string; salt: string }) {
  const message = date + salt;
  const hash = CryptoJS.HmacSHA256(message, apiSecret);
  return hash.toString(CryptoJS.enc.Hex);
}

