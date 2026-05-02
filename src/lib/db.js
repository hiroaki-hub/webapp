import { db } from './firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, where, orderBy, Timestamp } from 'firebase/firestore';

const PLANTS_COLLECTION = 'plants';
const LOGS_COLLECTION = 'logs';

// --- 植物（Plants）の操作 ---

// 植物の追加
export const addPlant = async (plantData) => {
  try {
    const docRef = await addDoc(collection(db, PLANTS_COLLECTION), {
      ...plantData,
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (e) {
    console.error("Error adding plant: ", e);
    throw e;
  }
};

// 植物一覧の取得
export const getPlants = async () => {
  try {
    const q = query(collection(db, PLANTS_COLLECTION), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (e) {
    console.error("Error getting plants: ", e);
    throw e;
  }
};

// 植物の更新（写真の変更やグループの変更など）
export const updatePlant = async (plantId, updatedData) => {
  try {
    const plantRef = doc(db, PLANTS_COLLECTION, plantId);
    await updateDoc(plantRef, updatedData);
  } catch (e) {
    console.error("Error updating plant: ", e);
    throw e;
  }
};

// 植物の削除
export const deletePlant = async (plantId) => {
  try {
    await deleteDoc(doc(db, PLANTS_COLLECTION, plantId));
  } catch (e) {
    console.error("Error deleting plant: ", e);
    throw e;
  }
};

// --- お世話履歴（Logs）の操作 ---

// 記録の追加（水やり・肥料）
export const addLog = async (plantId, type) => {
  // type: 'water' または 'fertilizer'
  try {
    const docRef = await addDoc(collection(db, LOGS_COLLECTION), {
      plantId,
      type,
      date: Timestamp.now(),
    });
    return docRef.id;
  } catch (e) {
    console.error("Error adding log: ", e);
    throw e;
  }
};

// 特定の植物の履歴を取得
export const getLogsByPlantId = async (plantId) => {
  try {
    const q = query(
      collection(db, LOGS_COLLECTION),
      where('plantId', '==', plantId),
      orderBy('date', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (e) {
    console.error("Error getting logs: ", e);
    throw e;
  }
};
