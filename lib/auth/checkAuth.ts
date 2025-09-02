import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function checkAuth() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  console.log('~ ProtectedPage ~ data:', data);
  if (error || !data?.claims) {
    console.log('~ ProtectedPage ~ error:', error);
    redirect('/login');
  }
  return data;
}
