import { redirect } from 'next/navigation';

import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export async function logout() {
  const supabase = await createSupabaseBrowserClient();
  await supabase.auth.signOut();
  redirect('/login');
}
