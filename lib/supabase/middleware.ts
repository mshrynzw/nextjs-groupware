import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

import { hasEnvVars } from '@/lib/utils';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // If the env vars are not set, skip middleware check. You can remove this
  // ja: 環境変数が設定されていない場合、ミドルウェアのチェックをスキップします。プロジェクトのセットアップ後はこの処理を削除しても構いません。
  // once you setup the project.
  if (!hasEnvVars) {
    return supabaseResponse;
  }

  // With Fluid compute, don't put this client in a global environment
  // ja: Fluid compute環境では、このクライアントをグローバル変数に入れないでください。
  // variable. Always create a new one on each request.
  // ja: 必ずリクエストごとに新しいクライアントを作成してください。
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Do not run code between createServerClient and
  // ja: createServerClientとsupabase.auth.getClaims()の間にコードを挟まないでください。
  // supabase.auth.getClaims(). A simple mistake could make it very hard to debug
  // ja: ここでミスをすると、ユーザーがランダムにログアウトする問題のデバッグが非常に困難になります。
  // issues with users being randomly logged out.

  // IMPORTANT: If you remove getClaims() and you use server-side rendering
  // ja: 重要: getClaims()を削除してサーバーサイドレンダリングを使う場合、
  // with the Supabase client, your users may be randomly logged out.
  // ja: Supabaseクライアントでユーザーがランダムにログアウトする可能性があります。
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (
    request.nextUrl.pathname !== '/' &&
    !user &&
    !request.nextUrl.pathname.startsWith('/login')
  ) {
    // no user, potentially respond by redirecting the user to the login page
    // ja: ユーザーがいない場合、ログインページへリダイレクトする処理を行います。
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // ja: 重要: 必ずsupabaseResponseオブジェクトをそのまま返してください。
  // If you're creating a new response object with NextResponse.next() make sure to:
  // ja: NextResponse.next()で新しいレスポンスオブジェクトを作成する場合は、必ず以下を守ってください。
  // 1. Pass the request in it, like so:
  // ja: 1. requestを必ず渡してください（例: const myNewResponse = NextResponse.next({ request })）
  // 2. Copy over the cookies, like so:
  // ja: 2. Cookieを必ずコピーしてください（例: myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())）
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  // ja: 3. myNewResponseオブジェクトを必要に応じて変更しても構いませんが、Cookieの変更は避けてください。
  //    the cookies!
  // ja:    Cookieは変更しないでください！
  // 4. Finally:
  // ja: 4. 最後に:
  //    return myNewResponse
  // ja:    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // ja: これを守らないと、ブラウザとサーバーのセッションが同期しなくなり、
  // of sync and terminate the user's session prematurely!
  // ja: ユーザーのセッションが予期せず終了する原因になります！

  return supabaseResponse;
}
