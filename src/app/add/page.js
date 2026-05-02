'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import imageCompression from 'browser-image-compression';
import { addPlant } from '@/lib/db';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import styles from './page.module.css';

export default function AddPlantPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    group: '標準観葉',
    placement: '室内',
    photoFile: null,
    isManualMode: false,
    manualWateringDays: 14,
    manualFertilizerDays: 30,
  });

  const GROUPS = [
    { id: '多肉・サボテン', label: '多肉・サボテン（サボテン、エケベリアなど）' },
    { id: '乾燥系観葉', label: '乾燥系観葉（サンスベリア、ドラセナなど）' },
    { id: '標準観葉', label: '標準観葉（ポトス、モンステラなど）' },
    { id: '湿潤系観葉', label: '湿潤系観葉（カラテア、シダ類など）' },
    { id: '季節植物・草花', label: '季節植物・草花（ハーブ類など）' }
  ];
  const PLACEMENTS = ['室内', '屋外'];

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // プレビューの表示
    setPreview(URL.createObjectURL(file));

    // 画像圧縮処理（長辺最大800px、ファイルサイズ最大0.5MBに圧縮してクラウド容量を節約）
    const options = {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 800,
      useWebWorker: true
    };

    try {
      const compressedFile = await imageCompression(file, options);
      setFormData({ ...formData, photoFile: compressedFile });
    } catch (error) {
      console.error("画像圧縮エラー:", error);
      alert("画像の処理に失敗しました。別の画像をお試しください。");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.photoFile) {
      alert('植物の名前と写真は必須です！');
      return;
    }

    setLoading(true);
    try {
      // 1. Storageに画像をアップロード
      const fileExt = formData.photoFile.name.split('.').pop() || 'jpg';
      const fileName = `plants/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const storageRef = ref(storage, fileName);
      
      await uploadBytes(storageRef, formData.photoFile);
      const photoUrl = await getDownloadURL(storageRef);

      // 2. データベースに植物情報を保存
      await addPlant({
        name: formData.name,
        group: formData.group,
        placement: formData.placement,
        photoUrl: photoUrl,
        status: 'healthy', // 初期状態
        isManualMode: formData.isManualMode,
        manualWateringDays: formData.isManualMode ? formData.manualWateringDays : null,
        manualFertilizerDays: formData.isManualMode ? formData.manualFertilizerDays : null,
      });

      // 3. ホーム画面に戻る
      router.push('/');
      router.refresh();
      
    } catch (error) {
      console.error("保存エラー:", error);
      alert("保存に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`animate-fade-in ${styles.container}`}>
      <div className="glass-panel" style={{ padding: '2.5rem' }}>
        <h1 className={styles.title}>🌱 新しい植物を追加</h1>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label}>植物の名前</label>
            <input 
              type="text" 
              className={styles.input} 
              placeholder="例: モンステラ・デリシオーサ"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>水やりのグループ</label>
            <select 
              className={styles.select}
              value={formData.group}
              onChange={(e) => setFormData({...formData, group: e.target.value})}
            >
              {GROUPS.map(g => <option key={g.id} value={g.id}>{g.label}</option>)}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>置き場所</label>
            <select 
              className={styles.select}
              value={formData.placement}
              onChange={(e) => setFormData({...formData, placement: e.target.value})}
            >
              {PLACEMENTS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div className={styles.formGroup} style={{ borderTop: '1px solid rgba(0,0,0,0.1)', paddingTop: '1rem' }}>
            <label className={styles.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={formData.isManualMode}
                onChange={(e) => setFormData({...formData, isManualMode: e.target.checked})}
                style={{ width: '1.2rem', height: '1.2rem' }}
              />
              手動モード（冬型植物など変則サイクル用）
            </label>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
              チェックを外すと、種類と季節からアルゴリズムが自動計算します。
            </p>
          </div>

          {formData.isManualMode && (
            <div className={styles.formGroup} style={{ background: 'rgba(0,0,0,0.03)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
              <label className={styles.label}>水やりの間隔（日）</label>
              <input 
                type="number" 
                className={styles.input} 
                min="1" max="365"
                value={formData.manualWateringDays}
                onChange={(e) => setFormData({...formData, manualWateringDays: parseInt(e.target.value) || 1})}
                style={{ marginBottom: '1rem' }}
              />
              <label className={styles.label}>肥料の間隔（日）</label>
              <input 
                type="number" 
                className={styles.input} 
                min="1" max="365"
                value={formData.manualFertilizerDays}
                onChange={(e) => setFormData({...formData, manualFertilizerDays: parseInt(e.target.value) || 1})}
              />
            </div>
          )}

          <div className={styles.formGroup}>
            <label className={styles.label}>写真</label>
            <div className={styles.fileInputContainer}>
              <p>📷 タップして写真を選択</p>
              <input 
                type="file" 
                accept="image/*"
                className={styles.fileInput}
                onChange={handleImageChange}
                required
              />
            </div>
            {preview && (
              <img src={preview} alt="プレビュー" className={styles.previewImage} />
            )}
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading || !formData.photoFile}>
            {loading ? '保存中...' : '追加する！'}
          </button>
          
          <button type="button" className={styles.cancelBtn} onClick={() => router.push('/')}>
            キャンセル
          </button>
        </form>
      </div>
    </div>
  );
}
