import { headers } from 'next/headers';

import MainLayout from '@/components/common/layout/MainLayout';
import { toast } from '@/hooks/use-toast';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getMenuFor } from '@/lib/utils/feature/builder';
import { getUserFullName } from '@/lib/utils/user';
import { User } from '@/types/user';

interface Props {
  children: React.ReactNode;
}

export default async function Layout({ children }: Props) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    toast({
      title: 'エラー',
      description: 'ユーザー情報取得に失敗しました',
      variant: 'destructive',
    });
    return null;
  }

  const safeUser: User = {
    id: user.id,
    role: user.user_metadata.role,
    company_id: user.user_metadata.company_id,
    group_ids: user.user_metadata.group_ids,
    full_name: getUserFullName(user.user_metadata.family_name, user.user_metadata.first_name),
    features: user.user_metadata.features,
    work_type_id: user.user_metadata.work_type_id,
    dashboard_notification_count: user.user_metadata.dashboard_notification_count,
    is_show_overtime: user.user_metadata.is_show_overtime,
  };

  // パスに応じたactive付与など（実装に合わせて）
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || '';

  let pathPrefix = 'member'; // デフォルト
  if (pathname.startsWith('/system-admin')) {
    pathPrefix = 'system-admin';
  } else if (pathname.startsWith('/admin')) {
    pathPrefix = 'admin';
  }

  const menu = getMenuFor(safeUser.role, safeUser.features, pathPrefix);

  return (
    <MainLayout user={safeUser} menu={menu}>
      {children}
    </MainLayout>
  );
}
