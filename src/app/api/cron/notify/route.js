import { NextResponse } from 'next/server';
import { messagingApi } from '@line/bot-sdk';
import { getPlants } from '@/lib/db-server';
import { calculateNextCareDate } from '@/lib/careAlgorithm';

const { MessagingApiClient } = messagingApi;

const client = new MessagingApiClient({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
});

export async function GET(request) {
  const authHeader = request.headers.get('authorization');
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const plants = await getPlants();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const plantsToCare = [];

    plants.forEach(plant => {
      let needsWater = false;
      let needsFertilizer = false;

      // 水やりの判定
      if (!plant.lastWateredDate) {
        needsWater = true;
      } else {
        const lastW = new Date(plant.lastWateredDate.seconds ? plant.lastWateredDate.seconds * 1000 : plant.lastWateredDate);
        const nextW = calculateNextCareDate(plant, 'water', lastW);
        if (nextW && nextW <= today) needsWater = true;
      }

      // 肥料の判定
      if (!plant.lastFertilizedDate) {
        const baseF = plant.createdAt ? new Date(plant.createdAt.seconds * 1000) : today;
        const nextF = calculateNextCareDate(plant, 'fertilizer', baseF);
        if (nextF && nextF <= today) needsFertilizer = true;
      } else {
        const lastF = new Date(plant.lastFertilizedDate.seconds ? plant.lastFertilizedDate.seconds * 1000 : plant.lastFertilizedDate);
        const nextF = calculateNextCareDate(plant, 'fertilizer', lastF);
        if (nextF && nextF <= today) needsFertilizer = true;
      }

      if (needsWater || needsFertilizer) {
        plantsToCare.push({ ...plant, needsWater, needsFertilizer });
      }
    });

    if (plantsToCare.length === 0) {
      console.log('本日のお世話対象はありません。');
      return NextResponse.json({ status: 'No plants to care today' });
    }

    const isOverLimit = plantsToCare.length > 10;
    const displayPlants = isOverLimit ? plantsToCare.slice(0, 10) : plantsToCare;

    const plantBoxes = displayPlants.map((plant) => {
      const tags = [];
      if (plant.needsWater) tags.push('💧水');
      if (plant.needsFertilizer) tags.push('💊肥料');
      const tagString = tags.join(' ');

      return {
        type: 'box',
        layout: 'horizontal',
        spacing: 'md',
        alignItems: 'center',
        contents: [
          ...(plant.photoUrl || plant.imageUrl
            ? [
                {
                  type: 'image',
                  url: plant.photoUrl || plant.imageUrl,
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
            flex: 3,
            contents: [
              { type: 'text', text: plant.name, weight: 'bold', size: 'md', wrap: true },
              { type: 'text', text: `⚠️ 必要: ${tagString}`, size: 'xs', color: '#ef4444', weight: 'bold' },
            ],
          },
          {
            type: 'button',
            style: 'primary',
            color: '#40916c',
            height: 'sm',
            action: {
              type: 'uri',
              label: 'アプリへ',
              uri: 'https://webapp-ten-ruddy.vercel.app/'
            },
            flex: 2,
          },
        ],
      };
    });

    if (isOverLimit) {
      plantBoxes.push({
        type: 'box',
        layout: 'vertical',
        paddingAll: 'md',
        contents: [
          {
            type: 'text',
            text: `ほか ${plantsToCare.length - 10} 件の植物が待っています！\nアプリを開いて確認してください🌿`,
            wrap: true,
            size: 'sm',
            color: '#666666',
            align: 'center'
          }
        ]
      });
    }

    const flexMessage = {
      type: 'flex',
      altText: `本日のお世話対象は${plantsToCare.length}件です🌿`,
      contents: {
        type: 'bubble',
        header: {
          type: 'box',
          layout: 'vertical',
          backgroundColor: '#ebf5ed',
          contents: [
            { type: 'text', text: '🌿 本日のお世話リスト', weight: 'bold', size: 'lg', color: '#2d6a4f' },
            { type: 'text', text: `対象: ${plantsToCare.length}件`, size: 'sm', color: '#52796f', margin: 'sm' }
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

    await client.broadcast({
      messages: [flexMessage],
    });

    console.log(`Successfully sent care notifications for ${plantsToCare.length} plants.`);
    return NextResponse.json({ status: 'success', count: plantsToCare.length });
  } catch (error) {
    console.error('Cron Notification Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
