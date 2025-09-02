'use client';

import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

export const LogoutButton = () => {
  const router = useRouter();

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={logout}
      className="hidden lg:flex bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/40 backdrop-blur-sm flex-shrink-0"
    >
      <LogOut className="w-4 h-4" />
    </Button>
  );
};
