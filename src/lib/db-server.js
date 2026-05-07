import { adminDb } from './firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

const PLANTS_COLLECTION = 'plants';
const LOGS_COLLECTION = 'logs';

// --- 植物（Plants）の操作 ---

// 植物一覧の取得
export const getPlants = async () => {
  try {
    const snapshot = await adminDb
      .collection(PLANTS_COLLECTION)
      .orderBy('createdAt', 'desc')
      .get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (e) {
    console.error('Error getting plants (admin):', e);
    throw e;
  }
};

// 植物の更新
export const updatePlant = async (plantId, updatedData) => {
  try {
    const plantRef = adminDb.collection(PLANTS_COLLECTION).doc(plantId);
    // Date オブジェクトは Admin SDK の Timestamp に変換する
    const converted = {};
    for (const [key, value] of Object.entries(updatedData)) {
      converted[key] = value instanceof Date ? Timestamp.fromDate(value) : value;
    }
    await plantRef.update(converted);
  } catch (e) {
    console.error('Error updating plant (admin):', e);
    throw e;
  }
};

// --- お世話履歴（Logs）の操作 ---

// 記録の追加（水やり・肥料）
export const addLog = async (plantId, type) => {
  try {
    const docRef = await adminDb.collection(LOGS_COLLECTION).add({
      plantId,
      type,
      date: FieldValue.serverTimestamp(),
    });
    return docRef.id;
  } catch (e) {
    console.error('Error adding log (admin):', e);
    throw e;
  }
};
