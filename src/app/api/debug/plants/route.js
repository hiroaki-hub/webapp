import { NextResponse } from 'next/server';
import { getPlants } from '@/lib/db';

// ⚠️ このルートはテスト用です。テスト完了後に削除してください。
export async function GET() {
  try {
    const plants = await getPlants();
    const summary = plants.map(p => ({
      id: p.id,
      name: p.name,
      lastWateredDate: p.lastWateredDate ?? null,
      lastFertilizedDate: p.lastFertilizedDate ?? null,
      createdAt: p.createdAt ?? null,
    }));
    return NextResponse.json({ count: plants.length, plants: summary });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
