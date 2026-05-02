'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { auth } from './firebase';

const AuthContext = createContext(null);

// 許可されたメールアドレス（環境変数から取得）
const ALLOWED_EMAIL = process.env.NEXT_PUBLIC_ALLOWED_EMAIL;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // ホワイトリストチェック: 許可されたメール以外は即座にサインアウト
        if (ALLOWED_EMAIL && firebaseUser.email !== ALLOWED_EMAIL) {
          setError(`このアカウント（${firebaseUser.email}）はアクセスが許可されていません。`);
          await signOut(auth);
          setUser(null);
        } else {
          setError(null);
          setUser(firebaseUser);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setError(null);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error('Auth error:', err.code, err.message);
      if (err.code === 'auth/popup-closed-by-user') {
        // ユーザーが自分で閉じた場合は何もしない
        return;
      } else if (err.code === 'auth/unauthorized-domain') {
        setError('このドメインはFirebaseに登録されていません。Firebase Console → Authentication → 承認済みドメインに追加が必要です。');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Googleサインインが有効化されていません。Firebase Console → Authentication → Sign-in method → Googleを有効にしてください。');
      } else if (err.code === 'auth/popup-blocked') {
        setError('ポップアップがブロックされました。ブラウザのポップアップ許可設定を確認してください。');
      } else {
        setError(`ログインに失敗しました（${err.code}）。もう一度お試しください。`);
      }
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
