# Supabase × Next.js 認証まとめ

## 1. クライアント・サーバーでのSupabaseクライアントの使い分け

### ① なぜ `@/lib/supabase/client` を `login-form.tsx` で使うのか？

- `login-form.tsx` は `"use client"` が付いた**クライアントコンポーネント**。
- クライアントサイド（ブラウザ）でSupabaseの認証APIを直接叩くため、`@/lib/supabase/client` を使う。
- サーバーサイド（API RouteやServer Component）では `@/lib/supabase/server` を使う。

---

### ② `lib/supabase/client.ts` と `lib/supabase/server.ts` の使い分け基準

- **`client.ts`**  
  - ブラウザで動くクライアントサイド用
  - `"use client"` のReactコンポーネントで利用
  - Cookieは**ブラウザに保存**される

- **`server.ts`**  
  - サーバーサイド（API Route, Server Component, Middleware等）用
  - サーバーでCookieを直接読み書きできる

---

### ③ `NEXT_PUBLIC_SUPABASE_ANON_KEY!` にはどちらを設定すべきか？使い分けは？

- **anon key**  
  - フロントエンドで使う公開用キー
  - RLS（Row Level Security）で制限された範囲のみアクセス可能
  - `.env.local` の `NEXT_PUBLIC_SUPABASE_ANON_KEY` などに設定

- **service_role key**  
  - 管理者権限の強力なキー
  - **絶対にフロントエンドで使わない**
  - サーバーサイドのバッチや管理者APIなど、信頼できる環境でのみ利用

> **結論：**  
> `NEXT_PUBLIC_SUPABASE_ANON_KEY` には**anon key**のみを設定する。  
> `service_role key` はNext.jsプロジェクト内では使わない。

---

### ④ `middleware.ts` での認証監視

- Next.jsのミドルウェアで**全リクエストの認証状態を監視**。
- 未認証ユーザーが保護ページにアクセスした場合、**自動的に `/auth/login` へリダイレクト**。

```ts
if (
  request.nextUrl.pathname !== "/" &&
  !user &&
  !request.nextUrl.pathname.startsWith("/login") &&
  !request.nextUrl.pathname.startsWith("/auth")
) {
  // 未ログインならログインページへリダイレクト
  const url = request.nextUrl.clone();
  url.pathname = "/auth/login";
  return NextResponse.redirect(url);
}
```

---

## 2. クライアントサイドでのクッキーの扱い

- `client.ts` でログインすると、**クッキーは「ブラウザ」にセット**される。
- その後、**ページ遷移やリロード時に初めてサーバーにクッキーが送信**される。
- サーバー側でクッキーを直接セットしたい場合は、**サーバーアクションやAPI Route経由**で認証処理を行う。

---

## 3. サーバーアクション（Server Action）やAPI Routeでの認証のメリット

- **サーバー側で直接クッキーをセットできる**ため、ログイン直後のリダイレクト先でもサーバーが即座に認証状態を認識できる。
- セキュリティや一貫性の観点からも推奨される（公式ドキュメントでも推奨）。

---

## 4. どちらを選ぶべきか？

- **SPA的な体験やリアルタイム性重視**ならクライアントサイドでも十分。
- **SSRやサーバーサイドでの認証状態の即時反映が必要な場合**は、**サーバーアクションやAPI Route経由**がベスト。

---

## 5. 参考リンク

- [Supabase公式：Next.jsでのServer Action認証例](https://supabase.com/docs/guides/auth/server-side/nextjs?queryGroups=router&router=app)
- [Next.js App RouterでのServer Actions解説](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions)
- [Vercel公式サンプル](https://github.com/vercel/next.js/tree/canary/examples/with-supabase)

---

## 6. まとめ

- **クライアントサイドでの認証は「次のリクエスト」までサーバーに反映されない**
- **サーバーアクションやAPI Route経由なら、即座にサーバーで認証状態を反映できる**
- **`service_role key`は絶対にNext.jsプロジェクトで使わない**

---

# 7. 参考

https://github.com/vercel/next.js/blob/canary/examples/with-supabase/.env.example
https://supabase.com/docs/guides/auth/server-side/nextjs?queryGroups=router&router=app
