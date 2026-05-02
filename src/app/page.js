'use client';

import { useState, useEffect } from 'react';
import { getPlants } from '@/lib/db';
import styles from './page.module.css';

export default function Home() {
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPlants() {
      try {
        const data = await getPlants();
        setPlants(data);
      } catch (error) {
        console.error("データの取得に失敗しました:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchPlants();
  }, []);

  // 水やりが必要な植物の数を仮計算（後で本格的なアルゴリズムに置き換えます）
  const needsWaterCount = plants.filter(p => p.status === 'needs_water').length;

  const handleCare = async (plantId, type) => {
    try {
      // db.jsに追加した関数を呼び出す（※事前にdb.jsからaddLog, updatePlantをimportする必要があります）
      const { addLog, updatePlant, getPlants } = await import('@/lib/db');
      
      await addLog(plantId, type);
      
      const updateData = { status: 'healthy' };
      if (type === 'water') {
        updateData.lastWateredDate = new Date();
      } else {
        updateData.lastFertilizedDate = new Date();
      }
      
      await updatePlant(plantId, updateData);
      
      // UIを更新
      const data = await getPlants();
      setPlants(data);
      
    } catch (error) {
      console.error("記録エラー:", error);
      alert("記録に失敗しました。");
    }
  };

  return (
    <div className={`animate-fade-in ${styles.dashboard}`}>
      <section className={styles.heroSection}>
        <h1 className={styles.title}>Welcome back!</h1>
        {loading ? (
          <p className={styles.subtitle}>植物のデータを読み込み中...</p>
        ) : plants.length === 0 ? (
          <p className={styles.subtitle}>まだ植物が登録されていません。右上のボタンから追加してみましょう！</p>
        ) : (
          <p className={styles.subtitle}>今日は <strong>{needsWaterCount}つ</strong> の植物が水を求めています💧</p>
        )}
      </section>

      <div className={styles.grid}>
        {plants.map((plant) => (
          <div key={plant.id} className={`glass-panel ${styles.card}`}>
            <div className={styles.cardImageWrapper}>
              <img src={plant.photoUrl} alt={plant.name} className={styles.cardImage} />
              <div className={`${styles.statusBadge} ${styles[plant.status || 'healthy']}`}>
                {plant.status === 'needs_water' ? '💧 水やり目安' : plant.status === 'warning' ? '🌿 葉水おすすめ' : '✨ 元気'}
              </div>
            </div>
            
            <div className={styles.cardContent}>
              <h3 className={styles.plantName}>{plant.name}</h3>
              <div className={styles.tags}>
                <span className={styles.tag}>{plant.group}</span>
                <span className={styles.tag}>{plant.placement}</span>
              </div>
              <p className={styles.lastAction}>
                前回水やり: {plant.lastWateredDate ? new Date(plant.lastWateredDate.seconds * 1000).toLocaleDateString('ja-JP') : '記録なし'}
              </p>
              
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                <button 
                  className={styles.actionBtn} 
                  style={{ flex: 2 }}
                  onClick={() => handleCare(plant.id, 'water')}
                >
                  💧 水やり
                </button>
                <button 
                  className={styles.actionBtn} 
                  style={{ flex: 1, backgroundColor: 'var(--color-text-muted)' }}
                  onClick={() => handleCare(plant.id, 'fertilizer')}
                >
                  💊 肥料
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
