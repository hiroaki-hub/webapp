import './globals.css';
import Link from 'next/link';

export const metadata = {
  title: 'PlantCheck - 観葉植物のスマート管理',
  description: 'あなたの大切な観葉植物の水やりと肥料のタイミングを自動計算・通知するアプリです。',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body>
        <main className="container">
          <header style={headerStyle}>
            <Link href="/" style={logoStyle}>🌿 PlantCheck</Link>
            <nav style={navStyle}>
              <Link href="/add" style={btnOutlineStyle}>+ 植物を追加</Link>
            </nav>
          </header>
          {children}
        </main>
      </body>
    </html>
  );
}

// --- Inline Styles for Layout ---
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
  gap: '1rem'
};

const btnOutlineStyle = {
  padding: '0.6rem 1.2rem',
  borderRadius: 'var(--radius-full)',
  border: '2px solid var(--color-primary)',
  backgroundColor: 'transparent',
  color: 'var(--color-primary)',
  fontWeight: '600',
  transition: 'var(--transition-fast)',
};
