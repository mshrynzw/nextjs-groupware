// lib/actions/auth.ts
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';

type LoginResult = { ok: true } | { ok: false; error: string };

export async function LoginAction(formData: FormData): Promise<LoginResult> {
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');

  if (!email || !password) {
    return { ok: false, error: 'missing' };
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { ok: false, error: error.message };
  }
  const { data: { user } } = await supabase.auth.getUser();
  console.log('user情報', user);

  if (data.user&& data.session) {
    console.log('Login successful, user:', data.user.email);
    
    // Cookieの設定を確認
    const cookies = supabase.auth.getSession();
    console.log('Session cookies after login:', cookies);
    await supabase.auth.setSession(data.session);

    // app\(protected)配下をキャッシュ無効化
    // TODO: 本番環境・疑似本番では無効化にしないが、user_profiles.is_updateがfalseなら無効化にする予定
    if (process.env.NODE_ENV === 'development') {
      revalidatePath('/(protected)', 'layout');
    }
    // 成功時はリダイレクト
    redirect('/system-admin');
  }

  return { ok: false, error: 'ログインに失敗しました' };
}
