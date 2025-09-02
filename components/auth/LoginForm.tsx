'use client';

import { Shield, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';

export default function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('system-admin@groupware.com');
  const [password, setPassword] = useState('P@ssw0rd!');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      // Update this route to redirect to an authenticated route. The user already has an active session.
      router.push('/system-admin');
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleLogin}
      // action={async (fd) => {
      //   setPending(true);
      //   setError('');
      //   const res = await LoginAction(fd);
      //   if (res.ok) {
      //     router.replace('/system-admin');
      //     return;
      //   }
      //   setError(
      //     res.error === 'missing'
      //       ? 'メールアドレスとパスワードを入力してください'
      //       : res.error === 'Invalid login credentials'
      //         ? 'メールアドレスまたはパスワードが正しくありません'
      //         : res.error || 'ログインに失敗しました'
      //   );
      //   setPending(false);
      // }}
      className="space-y-6"
    >
      {/* // <form action="/api/login" method="post" className="space-y-6"> */}
      <div className="space-y-2">
        <Label htmlFor="email" className="text-white font-medium">
          メールアドレス
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="メールアドレスを入力"
          required
          disabled={isLoading}
          autoComplete="username"
          className="bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-blue-400 focus:ring-blue-400/20 backdrop-blur-sm"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-white font-medium">
          パスワード
        </Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="パスワードを入力"
            required
            disabled={isLoading}
            autoComplete="current-password"
            className="bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-blue-400 focus:ring-blue-400/20 backdrop-blur-sm pr-12"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-500/20 border border-red-400/30 rounded-lg backdrop-blur-sm">
          <p className="text-red-200 text-sm text-center">{error}</p>
        </div>
      )}

      <Button
        type="submit"
        className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
        disabled={isLoading}
        aria-disabled={isLoading}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ログイン中…
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            ログイン
          </span>
        )}
      </Button>
    </form>
  );
}
