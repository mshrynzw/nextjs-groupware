'use client';

import { Lock } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

import Particles from '@/components/common/Particles';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function NotFoundPage() {
  const pathname = usePathname();
  const search = useSearchParams();
  const query = search.toString();
  const fullPath = query ? `${pathname}?${query}` : pathname;

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const url = origin ? `${origin}${fullPath}` : fullPath;

  return (
    <div className='h-screen timeport-main-background'>
      {/* 浮遊パーティクル（クライアントで描画 → 水和ズレ回避） */}
      <div className='absolute inset-0 pointer-events-none'>
        <Particles />
      </div>
      <div className='min-h-screen flex items-center justify-center'>
        <Card className='w-full max-w-md bg-white/5 bg-gradient-to-br from-white via-gray-50/50 to-blue-50/30'>
          <CardHeader className='text-center'>
            <div className='mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4'>
              <Lock className='w-8 h-8 text-yellow-600' />
            </div>
            <CardTitle className='text-xl font-semibold text-gray-900'>
              ページが見つかりませんでした
            </CardTitle>
          </CardHeader>
          <CardContent className='text-center space-y-4'>
            <p className='text-start text-gray-600 border border-gray-300 rounded-md p-4'>{url}</p>
            <p className='text-sm text-gray-500'>上記のURLは存在しません。</p>
            <div className='pt-4'>
              <Link href='/login'>
                <Button variant='default' className='w-full'>
                  ログインページに戻る
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
