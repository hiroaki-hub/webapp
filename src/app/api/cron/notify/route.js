import { NextResponse } from 'next/server';
import { messagingApi } from '@line/bot-sdk';
import { getPlants } from '@/lib/db';

const { MessagingApiClient } = messagingApi;

const client = new MessagingApiClient({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
});

export async function GET(request) {
  // セキュリティチェック: Vercel Cronからの呼び出しかを確認
  // https://vercel.com/docs/cron-jobs/manage-cron-jobs#securing-cron-jobs
  const authHeader = request.headers.get('authorization');
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. すべての植物データを取得
    const plants = await getPlants();

    // 2. 今日水やりが必要な植物を抽出
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const plantsToWater = plants.filter((plant) => {
      // 一度も水やりしていない場合は対象とする
      if (!plant.lastWateredDate) return true;

      const lastWatered = plant.lastWateredDate.toDate
        ? plant.lastWateredDate.toDate()
        : new Date(plant.lastWateredDate);
      
      const nextWateringDate = new Date(lastWatered);
      // frequencyが未設定の場合はデフォルト7日
      const freq = parseInt(plant.frequency || 7, 10);
      nextWateringDate.setDate(nextWateringDate.getDate() + freq);
      nextWateringDate.setHours(0, 0, 0, 0);

      // 次回の水やり予定日が今日以前なら対象
      return nextWateringDate <= today;
    });

    if (plantsToWater.length === 0) {
      console.log('本日の水やり対象はありません。');
      return NextResponse.json({ status: 'No plants to water today' });
    }

    // 3. LINE Flex Messageの構築（1つのメッセージにまとめる）
    const plantBoxes = plantsToWater.map((plant) => {
      const lastWateredStr = plant.lastWateredDate 
        ? new Date(plant.lastWateredDate.toDate ? plant.lastWateredDate.toDate() : plant.lastWateredDate).toLocaleDateString('ja-JP')
        : '記録なし';

      return {
        type: 'box',
        layout: 'horizontal',
        spacing: 'md',
        alignItems: 'center',
        contents: [
          ...(plant.imageUrl
            ? [
                {
                  type: 'image',
                  url: plant.imageUrl,
                  size: 'sm',
                  aspectRatio: '1:1',
                  aspectMode: 'cover',
                  flex: 1,
                  backgroundColor: '#f4f4f4'
                },
              ]
            : []),
          {
            type: 'box',
            layout: 'vertical',
            flex: plant.imageUrl ? 3 : 4,
            contents: [
              { type: 'text', text: plant.name, weight: 'bold', size: 'md', wrap: true },
              { type: 'text', text: `前回: ${lastWateredStr}`, size: 'xs', color: '#aaaaaa' },
            ],
          },
          {
            type: 'button',
            style: 'primary',
            color: '#40916c',
            height: 'sm',
            action: {
              type: 'postback',
              label: '完了',
              data: `action=water&plantId=${plant.id}`,
            },
            flex: 2,
          },
        ],
      };
    });

    const flexMessage = {
      type: 'flex',
      altText: `本日の水やり対象は${plantsToWater.length}件です🌿`,
      contents: {
        type: 'bubble',
        header: {
          type: 'box',
          layout: 'vertical',
          backgroundColor: '#ebf5ed',
          contents: [
            { type: 'text', text: '🌿 本日の水やりリスト', weight: 'bold', size: 'lg', color: '#2d6a4f' },
            { type: 'text', text: `対象: ${plantsToWater.length}件`, size: 'sm', color: '#52796f', margin: 'sm' }
          ],
        },
        body: {
          type: 'box',
          layout: 'vertical',
          spacing: 'lg',
          contents: plantBoxes,
        },
      },
    };

    // 4. アカウントに登録されている全員（自分）へブロードキャスト送信
    await client.broadcast({
      messages: [flexMessage],
    });

    console.log(`Successfully sent watering notifications for ${plantsToWater.length} plants.`);
    return NextResponse.json({ status: 'success', count: plantsToWater.length });
  } catch (error) {
    console.error('Cron Notification Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
