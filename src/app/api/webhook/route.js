import { NextResponse } from 'next/server';
import { messagingApi, validateSignature } from '@line/bot-sdk';
import { addLog, updatePlant } from '@/lib/db-server';

const { MessagingApiClient } = messagingApi;

const client = new MessagingApiClient({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
});

const channelSecret = process.env.LINE_CHANNEL_SECRET || '';

export async function POST(request) {
  try {
    const bodyText = await request.text();
    const signature = request.headers.get('x-line-signature');
    
    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    // セキュリティ強化：LINEからの正規の通信か検証する
    if (!validateSignature(bodyText, channelSecret, signature)) {
      console.error('無効な署名です。LINE以外からの不正なアクセスの可能性があります。');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const body = JSON.parse(bodyText);
    const events = body.events;

    if (!events || events.length === 0) {
      return NextResponse.json({ status: 'success' });
    }

    for (const event of events) {
      // ユーザーがLINE上で「水やり完了」ボタン（Postback）を押したときの処理
      if (event.type === 'postback') {
        const data = event.postback.data; // 例: "action=water&plantId=xxx"
        const params = new URLSearchParams(data);
        const action = params.get('action');
        const plantId = params.get('plantId');

        if (action === 'water' && plantId) {
          // Firebaseにお世話記録を追加し、植物のステータスを更新
          await addLog(plantId, 'water');
          await updatePlant(plantId, { status: 'healthy', lastWateredDate: new Date() });

          // LINEに完了メッセージを返信
          await client.replyMessage(event.replyToken, {
            type: 'text',
            text: '水やりを記録しました！お疲れ様です🌿'
          });
        }
      }
    }

    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
