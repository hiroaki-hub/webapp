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
    // 毎回アカウント選択画面を表示する（複数アカウントがある場合に便利）
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('ログインに失敗しました。もう一度お試しください。');
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
