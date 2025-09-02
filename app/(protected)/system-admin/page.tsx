import { checkAuth } from '@/lib/auth/check-auth';

export default async function Page() {
  const data = await checkAuth();

  return (
    <div className="min-h-screen flex items-center justify-center timeport-main-background">
      <div>システム管理者ページ</div>
    </div>
  );
}
