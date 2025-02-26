
import { sendAlimtalk } from '@/lib/sendAlimTalk';





export async function POST(req: Request) {
  try {
    const { name, email, phoneNumber, date, message } = await req.json();
    const reservationDate = new Date(date);
    const formattedDate = reservationDate.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });
   /* const reservation = await prisma.reservation.create({
      data: {
        name,
        email,
        phoneNumber,
        date: reservationDate,
        message,
      },
    });*/

     // 고객에게 알림톡 발송

     if (phoneNumber) {
      try {
        await sendAlimtalk({
          to: phoneNumber,
          from: process.env.SOLAPI_SENDER_NUMBER!,
          templateId: process.env.CUSTOMER_TEMPLATE_ID!,
          variables: {
            '#{name}': name,
            '#{date}': formattedDate,
            '#{message}': message || '없음',
          },
        });
      } catch (error) {
        console.error('고객에게 알림톡 발송 실패:', error);
      }
    }

   
    // 소유자에게 알림톡 발송
   const ownerPhoneNumber = process.env.OWNER_PHONE_NUMBER;
   if (ownerPhoneNumber) {
     try {
       await sendAlimtalk({
         to: ownerPhoneNumber,
         from: process.env.SOLAPI_SENDER_NUMBER!,
         templateId: process.env.OWNER_TEMPLATE_ID!,
         variables: {
          '#{name}': name,
          '#{email}': email,
          '#{phonenumber}': phoneNumber,
          '#{date}': formattedDate,
          '#{message}': message || '없음',
         },
       });
     } catch (error) {
       console.error('소유자에게 알림톡 발송 실패:', error);
     }
   }


    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('예약 API 오류:', error);
    return new Response(JSON.stringify({ error: '예약 처리 중 오류 발생' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
