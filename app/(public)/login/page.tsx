import fs from 'fs';
import path from 'path';

import { Clock, Sparkles } from 'lucide-react';
import Image from 'next/image';

import LoginForm from '@/components/auth/LoginForm';
import Particles from '@/components/common/Particles';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const dynamic = 'force-static';
export default function Page() {
  const packageJsonPath = path.resolve(process.cwd(), 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const version = packageJson.version;

  return (
    <div className='min-h-screen relative overflow-hidden flex items-center justify-center p-4'>
      {/* Animated Gradient Background */}
      <div className='absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800'>
        <div className='absolute inset-0 bg-gradient-to-tr from-blue-600/20 via-purple-600/20 to-pink-600/20'></div>

        {/* Animated Orbs */}
        <div className='absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-400/30 to-purple-500/30 rounded-full blur-3xl animate-pulse'></div>
        <div className='absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-purple-400/30 to-pink-500/30 rounded-full blur-3xl animate-pulse delay-1000'></div>
        <div className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-indigo-400/20 to-cyan-500/20 rounded-full blur-2xl animate-pulse delay-500'></div>

        {/* Floating Particles */}
        <Particles />
      </div>

      {/* Login Card */}
      <Card className='w-full max-w-md relative z-10 backdrop-blur-xl bg-white/10 border-white/20 shadow-2xl'>
        <CardHeader className='text-center pb-8'>
          {/* Logo with Glow Effect */}
          <div className='flex justify-center mb-6'>
            <div className='relative'>
              <div className='absolute inset-0 w-20 h-20 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full blur-lg opacity-60'></div>
              <div className='relative w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg'>
                <Clock className='w-10 h-10 text-white' />
              </div>
            </div>
          </div>

          <CardTitle className='text-3xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent'>
            TimePort
          </CardTitle>
          <div className='flex items-center justify-center space-x-2 mt-2'>
            <Sparkles className='w-4 h-4 text-blue-300' />
            <p className='text-blue-100 font-medium'>Version {version}</p>
            <Sparkles className='w-4 h-4 text-purple-300' />
          </div>
        </CardHeader>

        <CardContent>
          <LoginForm />

          <div className='mt-8 p-4 bg-white/5 border border-white/10 rounded-lg backdrop-blur-sm'>
            <div className='flex justify-center space-x-2 mb-3'>
              <Sparkles className='w-4 h-4 text-blue-300' />
              <p className='text-xs text-blue-200 font-semibold'>
                スマートフォン・タブレット端末用のQRコード
              </p>
            </div>
            <div className='flex justify-center'>
              <Image
                src='/qrcode_timeport-v4.vercel.app.png'
                alt='スマートフォン・タブレット端末用のQRコード'
                width={100}
                height={100}
                priority
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
