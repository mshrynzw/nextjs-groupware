'use client';

import { Lock } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ErrorPageProps {
  error: Error;
}

export default function ErrorPage({ error }: ErrorPageProps) {
  return (
    <div className='min-h-screen flex items-center justify-center'>
      <Card className='w-full max-w-md bg-white/5 bg-gradient-to-br from-white via-gray-50/50 to-blue-50/30'>
        <CardHeader className='text-center'>
          <div className='mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4'>
            <Lock className='w-8 h-8 text-yellow-600' />
          </div>
          <CardTitle className='text-xl font-semibold text-gray-900'>
            エラーが発生しました
          </CardTitle>
        </CardHeader>
        <CardContent className='text-center space-y-4'>
          <p className='text-start text-gray-600 border border-gray-300 rounded-md p-4'>
            {error.message}
          </p>
          <p className='text-sm text-gray-500'>再度、ログインをしてください。</p>
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
  );
}
