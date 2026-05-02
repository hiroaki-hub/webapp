import './globals.css';
import { AuthProvider } from '@/lib/auth';
import AppShell from '@/components/AppShell';

export const metadata = {
  title: 'PlantCheck - 観葉植物のスマート管理',
  description: 'あなたの大切な観葉植物の水やりと肥料のタイミングを自動計算・通知するアプリです。',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body>
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}

