'use client';

import { useState, useEffect } from 'react';
import { getPlants } from '@/lib/db';
import { calculateNextCareDate } from '@/lib/careAlgorithm';
import styles from './page.module.css';

export default function Home() {
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPlant, setEditingPlant] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null); // { id, name }

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

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let needsWaterCount = 0;
  let needsFertilizerCount = 0;

  // 各植物の次回予定日を計算して埋め込む
  const enrichedPlants = plants.map((plant) => {
    let nextWater = null;
    if (!plant.lastWateredDate) {
      needsWaterCount++;
    } else {
      const lastW = new Date(plant.lastWateredDate.seconds ? plant.lastWateredDate.seconds * 1000 : plant.lastWateredDate);
      nextWater = calculateNextCareDate(plant, 'water', lastW);
      if (nextWater && nextWater <= today) needsWaterCount++;
    }
    
    let nextFert = null;
    if (!plant.lastFertilizedDate) {
      const baseF = plant.createdAt ? new Date(plant.createdAt.seconds * 1000) : today;
      nextFert = calculateNextCareDate(plant, 'fertilizer', baseF);
      if (nextFert && nextFert <= today) needsFertilizerCount++;
    } else {
      const lastF = new Date(plant.lastFertilizedDate.seconds ? plant.lastFertilizedDate.seconds * 1000 : plant.lastFertilizedDate);
      nextFert = calculateNextCareDate(plant, 'fertilizer', lastF);
      if (nextFert && nextFert <= today) needsFertilizerCount++;
    }
    
    return { ...plant, nextWateringDate: nextWater, nextFertilizerDate: nextFert };
  });

  const handleCare = async (plantId, type) => {
    try {
      const { addLog, updatePlant, getPlants } = await import('@/lib/db');
      
      await addLog(plantId, type);
      
      const updateData = { status: 'healthy' };
      if (type === 'water') {
        updateData.lastWateredDate = new Date();
      } else {
        updateData.lastFertilizedDate = new Date();
      }
      
      await updatePlant(plantId, updateData);
      
      const data = await getPlants();
      setPlants(data);
      
      const actionName = type === 'water' ? '水やり' : '肥料';
      alert(`${actionName}を記録しました！`);
      
    } catch (error) {
      console.error("記録エラー:", error);
      alert("記録に失敗しました。");
    }
  };

  const handleDelete = (plantId, plantName) => {
    setConfirmTarget({ id: plantId, name: plantName });
  };

  const handleConfirmDelete = async () => {
    if (!confirmTarget) return;
    try {
      const { deletePlant, getPlants } = await import('@/lib/db');
      await deletePlant(confirmTarget.id);
      const data = await getPlants();
      setPlants(data);
      setConfirmTarget(null);
    } catch (error) {
      console.error("削除エラー:", error);
      alert("削除に失敗しました。");
      setConfirmTarget(null);
    }
  };

  const handleDateEdit = async (plantId, type, dateStr) => {
    if (!dateStr) return;
    const newDate = new Date(`${dateStr}T00:00:00`);
    try {
      const { updatePlant, getPlants } = await import('@/lib/db');
      const updateData = type === 'water' ? { lastWateredDate: newDate } : { lastFertilizedDate: newDate };
      await updatePlant(plantId, updateData);
      const data = await getPlants();
      setPlants(data);
      const actionName = type === 'water' ? '水やり' : '肥料';
      alert(`${actionName}の日付を ${dateStr.replace(/-/g, '/')} に修正しました。`);
    } catch (error) {
      console.error("日付の修正エラー:", error);
      alert("日付の修正に失敗しました。");
    }
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    try {
      const { updatePlant, getPlants } = await import('@/lib/db');
      await updatePlant(editingPlant.id, {
        placement: editingPlant.placement,
        isManualMode: editingPlant.isManualMode,
        manualNextWateringDays: editingPlant.isManualMode ? editingPlant.manualNextWateringDays : null,
      });
      setEditingPlant(null);
      const data = await getPlants();
      setPlants(data);
      alert('設定を更新しました！');
    } catch (error) {
      console.error("設定変更エラー:", error);
      alert("設定の更新に失敗しました。");
    }
  };

  return (
    <div className={`animate-fade-in ${styles.dashboard}`}>
      <section className={styles.heroSection}>
        <h1 className={styles.title}>Welcome back!</h1>
        {loading ? (
          <p className={styles.subtitle}>植物のデータを読み込み中...</p>
        ) : enrichedPlants.length === 0 ? (
          <p className={styles.subtitle}>まだ植物が登録されていません。右上のボタンから追加してみましょう！</p>
        ) : (
          <p className={styles.subtitle}>
            今日は <strong>{needsWaterCount}つ</strong> の植物が水を、<strong>{needsFertilizerCount}つ</strong> の植物が肥料を求めています💧💊
          </p>
        )}
      </section>

      <div className={styles.grid}>
        {enrichedPlants.map((plant) => (
          <div key={plant.id} className={`glass-panel ${styles.card}`}>
            <div className={styles.cardImageWrapper}>
              <div className={styles.cardHeaderActions}>
                <button 
                  className={styles.editBtn}
                  onClick={() => setEditingPlant({...plant})}
                  title="設定を編集する"
                >
                  ⚙️
                </button>
                <button 
                  className={styles.deleteBtn}
                  onClick={() => handleDelete(plant.id, plant.name)}
                  title="削除する"
                >
                  🗑️
                </button>
              </div>
              <img src={plant.photoUrl} alt={plant.name} className={styles.cardImage} />
              <div className={`${styles.statusBadge} ${styles[plant.status || 'healthy']}`}>
                {(!plant.lastWateredDate || (plant.nextWateringDate && plant.nextWateringDate <= today)) ? '💧 水やり目安' : '✨ 元気'}
              </div>
            </div>
            
            <div className={styles.cardContent}>
              <h3 className={styles.plantName}>{plant.name}</h3>
              <div className={styles.tags}>
                <span className={styles.tag}>{plant.group}</span>
                <span className={styles.tag}>{plant.placement}</span>
                {plant.isManualMode && <span className={styles.tag} style={{background:'#fff3cd', color:'#856404', borderColor:'#ffeeba'}}>手動モード</span>}
              </div>
              
              <div className={styles.lastActionContainer}>
                <div className={styles.dateRow}>
                  <p className={styles.lastAction}>
                    💧 前回水やり: {plant.lastWateredDate ? new Date(plant.lastWateredDate.seconds ? plant.lastWateredDate.seconds * 1000 : plant.lastWateredDate).toLocaleDateString('ja-JP') : '記録なし'}
                  </p>
                  <label className={styles.calendarLabel} title="水やり日を修正">📅<input type="date" className={styles.hiddenDateInput} onChange={(e) => handleDateEdit(plant.id, 'water', e.target.value)} /></label>
                </div>
                <div className={styles.dateRow}>
                  <p className={styles.lastAction}>
                    💊 前回肥料: {plant.lastFertilizedDate ? new Date(plant.lastFertilizedDate.seconds ? plant.lastFertilizedDate.seconds * 1000 : plant.lastFertilizedDate).toLocaleDateString('ja-JP') : '記録なし'}
                  </p>
                  <label className={styles.calendarLabel} title="肥料日を修正">📅<input type="date" className={styles.hiddenDateInput} onChange={(e) => handleDateEdit(plant.id, 'fertilizer', e.target.value)} /></label>
                </div>
              </div>

              <div className={styles.nextActionContainer}>
                <p className={styles.nextAction}>
                  💧 次回水やり: {plant.nextWateringDate ? plant.nextWateringDate.toLocaleDateString('ja-JP') : '休眠期（不要）'}
                </p>
                <p className={styles.nextAction}>
                  💊 次回肥料: {plant.nextFertilizerDate ? plant.nextFertilizerDate.toLocaleDateString('ja-JP') : '休眠期（不要）'}
                </p>
              </div>
              
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                <button className={styles.actionBtn} style={{ flex: 1 }} onClick={() => handleCare(plant.id, 'water')}>💧 水やり</button>
                <button className={styles.actionBtn} style={{ flex: 1, backgroundColor: 'var(--color-text-muted)' }} onClick={() => handleCare(plant.id, 'fertilizer')}>💊 肥料</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editingPlant && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>⚙️ 「{editingPlant.name}」の設定</h3>
            <form onSubmit={handleEditSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem' }}>置き場所</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {['室内', '屋外'].map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setEditingPlant({...editingPlant, placement: p})}
                      style={{
                        flex: 1, padding: '0.6rem',
                        border: '2px solid',
                        borderColor: editingPlant.placement === p ? 'var(--color-primary)' : '#ccc',
                        borderRadius: '8px',
                        background: editingPlant.placement === p ? 'rgba(16,185,129,0.1)' : 'white',
                        color: editingPlant.placement === p ? 'var(--color-primary-dark)' : '#666',
                        fontWeight: editingPlant.placement === p ? '700' : '400',
                        cursor: 'pointer',
                      }}
                    >
                      {p === '室内' ? '🏠 室内' : '🌳 屋外'}
                    </button>
                  ))}
                </div>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={editingPlant.isManualMode || false}
                  onChange={(e) => setEditingPlant({...editingPlant, isManualMode: e.target.checked})}
                />
                手動モード（冬型植物など変則サイクル用）
              </label>
              
              {editingPlant.isManualMode && (
                <div style={{ background: '#f5f5f5', padding: '1rem', borderRadius: '8px' }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem' }}>次の水やりまで（日後）</label>
                  <input 
                    type="number" min="1" max="365"
                    value={editingPlant.manualNextWateringDays || 7}
                    onChange={(e) => setEditingPlant({...editingPlant, manualNextWateringDays: parseInt(e.target.value) || 1})}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                  />
                  <p style={{ fontSize: '0.8rem', color: '#888', marginTop: '0.5rem' }}>
                    ※ 肥料のタイミングは引き続きアルゴリズムが自動判定します。
                  </p>
                </div>
              )}
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" style={{ flex: 1, padding: '0.8rem', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>保存する</button>
                <button type="button" onClick={() => setEditingPlant(null)} style={{ flex: 1, padding: '0.8rem', background: '#ccc', color: '#333', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>キャンセル</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmTarget && (
        <div className={styles.modalOverlay} onClick={() => setConfirmTarget(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3>🗑️ 削除の確認</h3>
            <p style={{ margin: '1rem 0', color: 'var(--color-text-muted)' }}>
              「<strong style={{ color: 'var(--color-text-main)' }}>{confirmTarget.name}</strong>」を本当に削除しますか？<br />
              <span style={{ fontSize: '0.85rem' }}>この操作は元に戻せません。</span>
            </p>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button
                onClick={handleConfirmDelete}
                style={{ flex: 1, padding: '0.8rem', background: 'var(--color-danger)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
              >
                削除する
              </button>
              <button
                onClick={() => setConfirmTarget(null)}
                style={{ flex: 1, padding: '0.8rem', background: '#e5e7eb', color: '#333', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
