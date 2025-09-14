import { Card, CardHeader, CardTitle } from '@/components/ui/card';

export default async function Page() {
  // const data = await checkAuth();

  return (
    // <Suspense
    //   fallback={
    //     <div className="min-h-[calc(100vh-64px)] flex items-center justify-center timeport-main-background">
    //       <LoadingSpinner />
    //     </div>
    //   }
    // >
    <div className='min-h-[calc(100vh-64px)] min-w-[100vw-255px] timeport-main-background p-4'>
      <Card className='w-full relative backdrop-blur-xl bg-white/10 border-white/20 shadow-lg rounded'>
        <CardHeader>
          <CardTitle>
            <div className='flex items-center'>システム管理者ページ</div>
          </CardTitle>
        </CardHeader>
      </Card>
    </div>
    // </Suspense>

    // <div className="min-h-screen flex items-center justify-center timeport-main-background">
    //   <div>システム管理者ページ</div>
    // </div>
  );
}
