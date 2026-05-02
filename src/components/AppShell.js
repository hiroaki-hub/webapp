'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import LoginPage from '@/app/login/page';

export default function AppShell({ children }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();

  // ログインページは認証不要
  const isLoginPage = pathname === '/login';

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '2rem'
      }}>
        🌿
      </div>
    );
  }

  // 未ログインかつログインページ以外 → ログイン画面を表示
  if (!user && !isLoginPage) {
    return <LoginPage />;
  }

  // ログイン済み → 通常のレイアウト
  return (
    <main className="container">
      <header style={headerStyle}>
        <Link href="/" style={logoStyle}>🌿 PlantCheck</Link>
        <nav style={navStyle}>
          {user && (
            <>
              <Link href="/add" style={btnOutlineStyle}>+ 植物を追加</Link>
              <button onClick={logout} style={logoutBtnStyle}>
                ログアウト
              </button>
            </>
          )}
        </nav>
      </header>
      {children}
    </main>
  );
}

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingBottom: '2rem',
  marginBottom: '2rem',
  borderBottom: '1px solid var(--color-border)'
};

const logoStyle = {
  fontSize: '1.5rem',
  fontWeight: '700',
  color: 'var(--color-primary-dark)',
  letterSpacing: '-0.5px'
};

const navStyle = {
  display: 'flex',
  gap: '1rem',
  alignItems: 'center'
};

const btnOutlineStyle = {
  padding: '0.6rem 1.2rem',
  borderRadius: 'var(--radius-full)',
  border: '2px solid var(--color-primary)',
  backgroundColor: 'transparent',
  color: 'var(--color-primary)',
  fontWeight: '600',
  transition: 'var(--transition-fast)',
  textDecoration: 'none',
};

const logoutBtnStyle = {
  padding: '0.6rem 1.2rem',
  borderRadius: 'var(--radius-full)',
  border: '2px solid #d1d5db',
  backgroundColor: 'transparent',
  color: '#6b7280',
  fontWeight: '600',
  cursor: 'pointer',
  fontSize: '0.9rem',
};
