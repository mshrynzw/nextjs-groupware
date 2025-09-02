import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Turbopack は top-level 'turbopack' に。ルール追加はしない（←ここ重要）
  turbopack: {},

  // 使っているなら残す
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', '*.vercel.app'],
      bodySizeLimit: '2mb',
    },
  },

  // ビルド/実行に影響しない範囲の最適化は残してOK
  eslint: { ignoreDuringBuilds: true },
  images: { unoptimized: true },
  compress: true,
  poweredByHeader: false,
  generateEtags: false,

  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/api/:path*',
        headers: [{ key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' }],
      },
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
        ],
      },
    ];
  },
};

export default nextConfig;
