// app/.../MainLayout.tsx （あなたの元ファイルを置き換え）
// 'use client' は付けない → サーバーコンポーネント
import '@/app/globals.css';

import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';

import MainLayoutClient from '@/components/common/MainLayoutClient';
import { Toaster } from '@/components/ui/toaster';

interface MainLayoutProps {
  children: React.ReactNode;
}

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TimePort - 勤怠管理システム',
  description: '効率的な勤怠管理を実現するTimePortシステム',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'TimePort',
  },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' }],
  },
};

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const dynamic = 'force-static';
export default function MainLayout({ children }: MainLayoutProps) {
  const particlesCount = Number(process.env.PARTICLES_COUNT) || 100;

  return (
    <html lang="ja">
      <head>
        <meta name="application-name" content="TimePort" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="TimePort" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#0f172a" />
        <meta name="msapplication-tap-highlight" content="no" />

        <link rel="apple-touch-icon" href="/android-chrome-192x192.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-16x16.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="mask-icon" href="/android-chrome-192x192.png" color="#0f172a" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <MainLayoutClient particlesCount={particlesCount}>{children}</MainLayoutClient>
        <Toaster />
      </body>
    </html>
  );
}
