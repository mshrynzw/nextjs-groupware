// import { cookies } from 'next/headers';

// import { createServerClient } from '@supabase/ssr';
import SidebarClient from '@/components/common/Sidebar/SidebarClient';

type Role = 'member' | 'admin' | 'system-admin';
type FeatureKey = 'chat' | 'report' | 'schedule';

async function getUserServer() {
  // const cookieStore = await cookies();
  // const supabase = createServerClient(
  //   process.env.NEXT_PUBLIC_SUPABASE_URL!,
  //   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  //   {
  //     cookies: {
  //       get(name: string) {
  //         return cookieStore.get(name)?.value;
  //       },
  //     },
  //   }
  // );
  // const {
  //   data: { user },
  // } = await supabase.auth.getUser();
  // if (!user) return null;
  // 例: profiles から取得
  // const { data: profile } = await supabase
  //   .from('profiles')
  //   .select('full_name, role, company_id')
  //   .eq('id', user.id)
  //   .single();
  //   if (!profile) return null;
  //   return {
  //     id: user.id,
  //     full_name: profile.full_name as string,
  //     role: profile.role as Role,
  //     company_id: (profile.company_id ?? null) as string | null,
  //   };
  // }
  // async function getCompanyFeaturesServer(companyId: string | null) {
  //   if (!companyId) return null;
  //   const cookieStore = await cookies();
  //   const supabase = createServerClient(
  //     process.env.NEXT_PUBLIC_SUPABASE_URL!,
  //     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  //     {
  //       cookies: {
  //         get(name: string) {
  //           return cookieStore.get(name)?.value;
  //         },
  //       },
  //     }
  //   );
  //   const { data, error } = await supabase
  //     .from('company_features')
  //     .select('chat, report, schedule')
  //     .eq('company_id', companyId)
  //     .single();
  //   if (error) return null;
  //   return {
  //     chat: data?.chat ?? true,
  //     report: data?.report ?? true,
  //     schedule: data?.schedule ?? true,
  //   } as Record<FeatureKey, boolean>;
}

const user = {
  full_name: 'John Doe',
  role: 'system-admin' as Role,
};

export const dynamic = 'force-static';
export default function Sidebar(props: { isOpen?: boolean; onToggle?: () => void }) {
  // const user = await getUserServer();
  if (!user) return null;

  // const features = await getCompanyFeaturesServer(user.company_id);

  return (
    <SidebarClient
      isOpen={props.isOpen}
      onToggle={props.onToggle}
      user={{ full_name: user.full_name, role: user.role }}
      features={null}
    />
  );
}
