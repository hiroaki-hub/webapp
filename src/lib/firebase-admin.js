import admin from 'firebase-admin';

// 二重初期化を防ぐシングルトン実装
if (!admin.apps.length) {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!serviceAccountJson) {
    throw new Error('環境変数 FIREBASE_SERVICE_ACCOUNT_KEY が設定されていません。');
  }

  const serviceAccount = JSON.parse(serviceAccountJson);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export const adminDb = admin.firestore();
export default admin;
