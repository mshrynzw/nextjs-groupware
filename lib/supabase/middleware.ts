import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

import { hasEnvVars } from '@/lib/utils/common';
import { getUserFullName } from '@/lib/utils/user';
import { AuthUser } from '@/schemas/auth';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // 環境変数が設定されていない場合、ミドルウェアのチェックをスキップします。プロジェクトのセットアップ後はこの処理を削除しても構いません。
  if (!hasEnvVars) {
    return supabaseResponse;
  }

  // Fluid compute環境では、このクライアントをグローバル変数に入れないでください。
  // 必ずリクエストごとに新しいクライアントを作成してください。
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // createServerClientとsupabase.auth.getClaims()の間にコードを挟まないでください。
  // ここでミスをすると、ユーザーがランダムにログアウトする問題のデバッグが非常に困難になります。
  // 重要: getClaims()を削除してサーバーサイドレンダリングを使う場合、
  // Supabaseクライアントでユーザーがランダムにログアウトする可能性があります。
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  const pathname = request.nextUrl.pathname;

  // === 1) 除外パス ===
  const isAuthPath = pathname.startsWith('/login') || pathname.startsWith('/auth');
  if (isAuthPath) {
    return supabaseResponse;
  }

  const isInternal =
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/favicon.ico' ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.webmanifest');

  if (isInternal) {
    return supabaseResponse; // 素通し
  }

  // === 2) 保護対象かどうか ===
  const isProtected =
    pathname.startsWith('/member') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/system-admin');

  // === 3) 認証判定 ===
  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect_to', pathname + request.nextUrl.search); // 戻り先を付与
    return NextResponse.redirect(url);
  }

  // （任意）ログイン済みで /login に来たらダッシュボードへ
  if (user && isAuthPath) {
    const url = request.nextUrl.clone();
    url.pathname = '/member'; // 既定のランディング
    return NextResponse.redirect(url);
  }

  // 以降の DB 参照（user_profiles 等）は、必要なら isProtected かつ user がある場合だけに限定
  if (user && isProtected) {
    const userId = user.sub;

    try {
      const { data: userProfile, error: userProfileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (!userProfile) {
        throw new Error('ユーザープロフィールが見つかりませんでした');
      }
      if (userProfileError) {
        throw new Error(
          'ユーザープロフィールの取得に失敗しました: ' +
            (userProfileError as { message: string }).message
        );
      }
      const role = userProfile.role;
      const companyId = userProfile.company_id;

      const { data: groupData, error: groupDataError } = await supabase
        .from('user_groups')
        .select('group_id')
        .eq('user_id', userId)
        .is('deleted_at', null);
      if (!groupData) {
        throw new Error('グループが見つかりませんでした');
      }
      if (groupDataError) {
        throw new Error(
          'グループの取得に失敗しました: ' + (groupDataError as { message: string }).message
        );
      }
      const groupIds = groupData?.map((item: { group_id: string }) => item.group_id);

      const { data: companyData, error: companyDataErreer } = await supabase
        .from('features')
        .select('is_active, feature_code')
        .eq('company_id', companyId)
        .in('feature_code', ['chat', 'report', 'schedule'])
        .is('deleted_at', null);
      if (!companyData) {
        throw new Error('企業が見つかりませんでした');
      }
      if (companyDataErreer) {
        throw new Error(
          '企業の取得に失敗しました: ' + (companyDataErreer as { message: string }).message
        );
      }
      const featureFlags = companyData?.reduce(
        (acc: Record<string, boolean>, cur: { is_active: boolean; feature_code: string }) => {
          if (cur.is_active && cur.feature_code) {
            acc[`is_${cur.feature_code}`] = true;
          }
          return acc;
        },
        {} as Record<string, boolean>
      );

      const userMetadata: AuthUser = {
        id: userProfile.id,
        company_id: companyId,
        group_ids: groupIds,
        role: role,
        full_name: getUserFullName(userProfile.family_name, userProfile.first_name),
        employment_type_id: userProfile.employment_type_id,
        current_work_type_id: userProfile.current_work_type_id,
        email: userProfile.email,
        features: {
          chat: featureFlags.chat,
          report: featureFlags.report,
          schedule: featureFlags.schedule,
        },
      };

      const { data: updateUserData, error: updateUserError } = await supabase.auth.updateUser({
        data: userMetadata,
      });
      if (updateUserError) {
        throw new Error(
          'ユーザーデータの更新に失敗しました: ' + (updateUserError as { message: string }).message
        );
      }
    } catch (error) {
      console.error('認証確認後のデータ取得エラー:', error);
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
  }
  // 重要: 必ずsupabaseResponseオブジェクトをそのまま返してください。
  // NextResponse.next()で新しいレスポンスオブジェクトを作成する場合は、必ず以下を守ってください。
  // 1. requestを必ず渡してください（例: const myNewResponse = NextResponse.next({ request })）
  // 2. Cookieを必ずコピーしてください（例: myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())）
  // 3. myNewResponseオブジェクトを必要に応じて変更しても構いませんが、Cookieの変更は避けてください。
  //    Cookieは変更しないでください！
  // 4. 最後に:
  //    return myNewResponse
  // これを守らないと、ブラウザとサーバーのセッションが同期しなくなり、
  // ユーザーのセッションが予期せず終了する原因になります！

  return supabaseResponse;
}
