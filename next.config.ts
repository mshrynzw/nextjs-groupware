import type { NextConfig } from 'next';

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // 必要に応じて SAMEORIGIN へ
  { key: 'X-Frame-Options', value: 'DENY' },
  // X-XSS-Protection は削除
  // 追加推奨ヘッダー
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  // 常時HTTPS運用時のみ有効化
  // { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  // 最初は report-only で導入推奨（運用に合わせて要調整）
  // { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; frame-ancestors 'none'" },
];

const nextConfig: NextConfig = {
  // 使っているなら残す
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', '*.vercel.app'],
    },
  },

  // ビルド/実行に影響しない範囲の最適化は残してOK
  eslint: { ignoreDuringBuilds: true },
  compress: true,
  poweredByHeader: false,

  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
};

export default nextConfig;
