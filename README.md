# TimePort v4 - 勤怠管理システム

<div align="center">
  <img src="https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/TypeScript-blue?style=for-the-badge&logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase">
  <img src="https://img.shields.io/badge/Tailwind%20CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/PostgreSQL-336791?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL">
</div>

## 📋 概要

TimePort v4は、現代の企業ニーズに応える高機能な勤怠管理システムです。システム管理者、管理者、メンバーの3つの役割に対応し、柔軟な設定機能と直感的なUIを提供します。

## 📋 方針

- 将来的に多くの会社様にご利用いただけるようマルチテナント型の設計をしています。
- 様々なユーザーのニーズに対応できるよう動的な設計思想で開発をします。（なるべく固定値はコードや環境変数に保持せず、DB・設定画面に保持する。）
- 現状はテクレアからの要件をAdmin・Member設定画面の設定で実現する方向性です。

### ✨ 主な特徴

- 🕐 **リアルタイム打刻** - 正確な勤怠記録と休憩管理
- 📊 **ダッシュボード** - 勤怠状況の可視化と統計
- 📝 **動的申請フォーム** - カスタマイズ可能な申請システム
- 👥 **階層的ユーザー管理** - 企業・グループ・個人の3層構造
- ⚙️ **柔軟な設定** - 機能ON/OFF、勤務時間、通知設定
- 📱 **PWA対応** - オフライン対応とプッシュ通知
- 🔐 **Row Level Security** - データセキュリティの確保
- 📈 **監査ログ** - システム操作の追跡

## 🏗️ 技術スタック

### フロントエンド

- **Next.js 15** (App Router)
- **TypeScript 5.2** - 型安全性
- **Tailwind CSS 3.3** - スタイリング
- **shadcn/ui** - UIコンポーネントライブラリ
- **React Hook Form 7.60** + **Zod 3.25** - フォーム管理・バリデーション
- **date-fns 3.6** - 日付処理
- **Lucide React 0.446** - アイコン
- **Recharts 2.12** - チャート・グラフ
- **Sonner 2.0** - トースト通知

### バックエンド

- **Supabase 2.50** - データベース・認証・リアルタイム
- **PostgreSQL** - データストレージ
- **Row Level Security (RLS)** - データセキュリティ
- **Supabase Auth** - 認証システム

### 開発ツール

- **Cursor** - IDE
- **Docker Desktop** - ローカルでSupabaseを動作させるために必要
- **Supabase CLI** - ローカルでSupabaseを動作させるために必要
- **ESLint 8.49** + **Prettier 3.6** - コード品質
- **TypeScript ESLint 8.36** - TypeScript用リント
- **pnpm** - パッケージマネージャー

## 🚀 クイックスタート

### 前提条件

- **Node.js 22以上**
- **pnpm** (推奨) または npm
- **Supabaseアカウント** (本番環境用)

### インストール

1. **リポジトリのクローン**

```bash
git clone https://github.com/canvas-sapporo/timeport-v4.git
cd timeport-v4
```

2. **依存関係のインストール**

```bash
pnpm install
```

3. **環境変数の設定**

```bash
cp .env.example .env.local
```

`.env.local` を編集：

```env
# データソース切り替え（開発初期はモック使用）
NEXT_PUBLIC_USE_SUPABASE=true

# Supabase設定（本番環境用）
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

4. **システム管理者を作成**
   Supabaseのブラウザコーンソールで以下を実施する。

- Authenticationで、システム管理者のuserを作成する。
- Table Editorで、user_profilesテーブルにシステム管理者のデータを挿入する。

5. **開発サーバーの起動**

```bash
pnpm dev
```

アプリケーションは `http://localhost:3000` で起動します。

### スクリプト

#### ダイレクトチャット管理者更新

既存のダイレクトチャットの参加者全員を管理者に更新する場合：

```bash
pnpm run update-direct-chat-admins
```

このスクリプトは、既存のダイレクトチャット（`chat_type = 'direct'`）の参加者全員のロールを `admin` に設定します。

## 📁 プロジェクト構造

```
timeport-v4/
├── app/                              # Next.js App Router
│   ├── admin/                       # 管理者ページ
│   │   ├── attendance/              # 勤怠管理
│   │   │   └── page.tsx
│   │   ├── attendance-statuses/     # 勤怠ステータス管理
│   │   │   └── page.tsx
│   │   ├── auth/
│   │   │   └── monitoring/          # 認証監視
│   │   │       └── page.tsx
│   │   ├── group/                   # グループ管理
│   │   │   └── page.tsx
│   │   ├── logs/                    # ログ管理
│   │   │   └── page.tsx
│   │   ├── report-templates/        # レポートテンプレート
│   │   │   ├── [id]/
│   │   │   │   ├── edit/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── preview/
│   │   │   │       └── page.tsx
│   │   │   ├── create/
│   │   │   │   └── page.tsx
│   │   │   └── page.tsx
│   │   ├── request-forms/           # 申請フォーム管理
│   │   │   ├── [id]/
│   │   │   │   ├── edit/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── page.tsx
│   │   │   └── create/
│   │   │       └── page.tsx
│   │   ├── requests/                # 申請管理
│   │   │   ├── monitoring/
│   │   │   │   └── page.tsx
│   │   │   └── page.tsx
│   │   ├── settings/                # 設定管理
│   │   │   ├── notifications/
│   │   │   │   └── page.tsx
│   │   │   └── page.tsx
│   │   ├── users/                   # ユーザー管理
│   │   │   └── page.tsx
│   │   └── page.tsx                 # 管理者ダッシュボード
│   ├── api/                         # API Routes
│   │   ├── admin/                   # 管理者用API
│   │   │   ├── auth/
│   │   │   │   └── monitoring/
│   │   │   │       └── route.ts
│   │   │   ├── logs/
│   │   │   │   ├── audit/
│   │   │   │   │   ├── export/
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   └── route.ts
│   │   │   │   └── system/
│   │   │   │       ├── export/
│   │   │   │       │   └── route.ts
│   │   │   │       └── route.ts
│   │   │   └── requests/
│   │   │       └── monitoring/
│   │   │           └── route.ts
│   │   ├── audit-logs/              # 監査ログAPI
│   │   │   └── auth/
│   │   │       └── route.ts
│   │   ├── csv-export/              # CSV出力API
│   │   │   └── route.ts
│   │   ├── debug/                   # デバッグ用API
│   │   │   ├── push-subscriptions/
│   │   │   │   └── route.ts
│   │   │   ├── request-forms/
│   │   │   ├── test-push/
│   │   │   │   └── route.ts
│   │   │   └── test-server-actions/
│   │   │       └── route.ts
│   │   ├── push/                    # プッシュ通知API
│   │   │   ├── send/
│   │   │   │   └── route.ts
│   │   │   └── subscribe/
│   │   │       └── route.ts
│   │   ├── system-admin/            # システム管理者用API
│   │   │   └── logs/
│   │   │       ├── audit/
│   │   │       │   └── route.ts
│   │   │       ├── settings/
│   │   │       │   └── route.ts
│   │   │       ├── stats/
│   │   │       │   └── route.ts
│   │   │       └── system/
│   │   │           └── route.ts
│   │   ├── test-audit-logs/
│   │   ├── test-logs/
│   │   │   └── route.ts
│   │   └── about.txt
│   ├── login/                       # ログインページ
│   │   └── page.tsx
│   ├── member/                      # メンバーページ
│   │   ├── attendance/              # 勤怠記録
│   │   │   └── page.tsx
│   │   ├── chat/                    # チャット機能
│   │   │   └── page.tsx
│   │   ├── disabled/                # 機能無効化ページ
│   │   ├── feature-disabled/        # 機能無効化通知
│   │   │   └── page.tsx
│   │   ├── profile/                 # プロフィール
│   │   │   └── page.tsx
│   │   ├── report/                  # レポート機能
│   │   │   ├── [id]/
│   │   │   └── create/
│   │   │       └── page.tsx
│   │   ├── requests/                # 申請機能
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx
│   │   │   ├── create/
│   │   │   │   └── page.tsx
│   │   │   └── page.tsx
│   │   ├── schedule/                # スケジュール機能
│   │   │   └── page.tsx
│   │   └── page.tsx                 # メンバーダッシュボード
│   ├── system-admin/                # システム管理者ページ
│   │   ├── auth-logs/               # 認証ログ
│   │   │   └── page.tsx
│   │   ├── company/                 # 企業管理
│   │   │   └── page.tsx
│   │   ├── features/                # 機能管理
│   │   │   └── page.tsx
│   │   ├── logs/                    # ログ管理
│   │   │   └── page.tsx
│   │   ├── system/                  # システム設定
│   │   │   └── page.tsx
│   │   └── page.tsx                 # システム管理者ダッシュボード
│   ├── globals.css                  # グローバルスタイル
│   ├── layout.tsx                   # ルートレイアウト
│   ├── manifest.json                # PWAマニフェスト
│   └── page.tsx                     # ホームページ
├── components/                       # 再利用可能コンポーネント
│   ├── admin/                       # 管理者用コンポーネント
│   │   ├── attendance/              # 勤怠管理コンポーネント
│   │   │   ├── AttendanceDeleteDialog.tsx
│   │   │   ├── AttendanceEditDialog.tsx
│   │   │   └── AttendanceFilters.tsx
│   │   ├── attendance-statuses/     # 勤怠ステータス管理
│   │   │   ├── AttendanceStatusCreateDialog.tsx
│   │   │   ├── AttendanceStatusDeleteDialog.tsx
│   │   │   └── AttendanceStatusEditDialog.tsx
│   │   ├── employment-types/        # 雇用形態管理
│   │   │   ├── EmploymentTypeCreateDialog.tsx
│   │   │   ├── EmploymentTypeDeleteDialog.tsx
│   │   │   └── EmploymentTypeEditDialog.tsx
│   │   ├── groups/                  # グループ管理
│   │   │   ├── GroupCreateDialog.tsx
│   │   │   ├── GroupDeleteDialog.tsx
│   │   │   └── GroupEditDialog.tsx
│   │   ├── request-forms/           # 申請フォーム管理
│   │   │   ├── ApprovalFlowBuilder.tsx
│   │   │   ├── RequestFormCreateDialog.tsx
│   │   │   └── RequestFormDeleteDialog.tsx
│   │   ├── users/                   # ユーザー管理
│   │   │   ├── UserCreateDialog.tsx
│   │   │   ├── UserDeleteDialog.tsx
│   │   │   └── UserEditDialog.tsx
│   │   ├── work-types/              # 勤務タイプ管理
│   │   │   ├── BreakTimesInput.tsx
│   │   │   ├── WorkTypeCreateDialog.tsx
│   │   │   └── WorkTypeDeleteDialog.tsx
│   │   ├── AuthMonitoring.tsx       # 認証監視
│   │   ├── ColumnSettingsDialog.tsx # カラム設定
│   │   ├── CsvExportDialog.tsx      # CSV出力
│   │   └── RequestMonitoring.tsx    # 申請監視
│   ├── auth/                        # 認証関連
│   │   ├── LoginForm.tsx
│   │   └── PasswordInput.tsx
│   ├── forms/                       # フォーム関連
│   │   ├── ClockRecordsInput.tsx
│   │   ├── DynamicForm.tsx
│   │   ├── FormBuilder.tsx
│   │   └── ObjectTypeSettingsDialog.tsx
│   ├── layout/                      # レイアウト関連
│   │   ├── Header.tsx
│   │   ├── MainLayout.tsx
│   │   ├── PageTransitionLoader.tsx
│   │   └── Sidebar.tsx
│   ├── member/                      # メンバー用コンポーネント
│   │   ├── attendance/
│   │   │   └── AttendanceFilters.tsx
│   │   ├── request/
│   │   │   └── RequestEditDialog.tsx
│   │   ├── settings/
│   │   │   └── UserSettings.tsx
│   │   ├── ClockHistory.tsx
│   │   └── ClockHistory.tsx
│   ├── notifications/               # 通知システム
│   │   └── NotificationBell.tsx
│   ├── pwa/                         # PWA関連
│   │   ├── InstallPrompt.tsx
│   │   ├── OfflineIndicator.tsx
│   │   └── PwaScript.tsx
│   ├── system-admin/                # システム管理者用
│   │   └── company/
│   │       ├── CompanyCreateDialog.tsx
│   │       ├── CompanyDeleteDialog.tsx
│   │       └── CompanyEditDialog.tsx
│   └── ui/                          # 基本UIコンポーネント
│       ├── accordion.tsx
│       ├── action-button.tsx
│       ├── alert-dialog.tsx
│       ├── alert.tsx
│       ├── aspect-ratio.tsx
│       ├── avatar.tsx
│       ├── badge.tsx
│       ├── breadcrumb.tsx
│       ├── button.tsx
│       ├── calendar.tsx
│       ├── card.tsx
│       ├── carousel.tsx
│       ├── chart.tsx
│       ├── checkbox.tsx
│       ├── collapsible.tsx
│       ├── combobox.tsx
│       ├── command.tsx
│       ├── context-menu.tsx
│       ├── dialog.tsx
│       ├── drawer.tsx
│       ├── dropdown-menu.tsx
│       ├── form.tsx
│       ├── hover-card.tsx
│       ├── input-otp.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── loading-overlay.tsx
│       ├── menubar.tsx
│       ├── navigation-menu.tsx
│       ├── pagination.tsx
│       ├── popover.tsx
│       ├── progress.tsx
│       ├── radio-group.tsx
│       ├── resizable.tsx
│       ├── scroll-area.tsx
│       ├── select.tsx
│       ├── separator.tsx
│       ├── sheet.tsx
│       ├── skeleton.tsx
│       ├── slider.tsx
│       ├── sonner.tsx
│       ├── standard-button.tsx
│       ├── stats-card.tsx
│       ├── switch.tsx
│       ├── table.tsx
│       ├── tabs.tsx
│       ├── textarea.tsx
│       ├── time-display.tsx
│       ├── toast.tsx
│       ├── toaster.tsx
│       ├── toggle-group.tsx
│       ├── toggle.tsx
│       └── tooltip.tsx
├── contexts/                        # React Context
│   ├── auth-context.tsx             # 認証状態管理
│   ├── data-context.tsx             # データ状態管理
│   └── page-transition-context.tsx  # ページ遷移管理
├── hooks/                           # カスタムフック
│   ├── use-company-features.ts      # 企業機能フック
│   └── use-toast.ts                 # トースト通知
├── lib/                             # ユーティリティ・設定
│   ├── actions/                     # Server Actions
│   │   ├── admin/                   # 管理者用アクション
│   │   │   ├── employment-types.ts
│   │   │   ├── groups.ts
│   │   │   ├── report-templates.ts
│   │   │   ├── request-forms.ts
│   │   │   ├── users.ts
│   │   │   └── work-types.ts
│   │   ├── attendance.ts            # 勤怠関連
│   │   ├── auth.ts                  # 認証関連
│   │   ├── chat.ts                  # チャット関連
│   │   ├── report-templates.ts      # レポートテンプレート
│   │   ├── reports.ts               # レポート関連
│   │   ├── requests.ts              # 申請関連
│   │   ├── settings.ts              # 設定関連
│   │   ├── system-admin/            # システム管理者用
│   │   │   ├── company.ts
│   │   │   ├── feature.ts
│   │   │   ├── features.ts
│   │   │   └── logs.ts
│   │   ├── user-settings.ts         # ユーザー設定
│   │   └── user.ts                  # ユーザー関連
│   ├── auth.ts                      # 認証設定
│   ├── middleware/                  # ミドルウェア
│   │   ├── feature-check.ts         # 機能チェック
│   │   └── logging.ts               # ログ機能
│   ├── mock.ts                      # モックデータ
│   ├── provider.ts                  # データプロバイダー
│   ├── pwa/                         # PWA関連
│   │   └── push-notification.ts     # プッシュ通知
│   ├── supabase-provider.ts         # Supabase接続
│   ├── supabase-realtime.ts         # リアルタイム機能
│   ├── supabase/                    # Supabase設定
│   │   └── server.ts
│   ├── supabase.ts                  # Supabase設定
│   └── utils/                       # ヘルパー関数
│       ├── attendance-validation.ts # 勤怠バリデーション
│       ├── error-handling.ts        # エラーハンドリング
│       ├── log-system.ts            # ログシステム
│       ├── request-type-defaults.ts # 申請タイプデフォルト
│       ├── request-type-utils.ts    # 申請タイプユーティリティ
│       └── user-company.ts          # ユーザー企業関連
├── middleware/                      # Next.js ミドルウェア
│   └── logging.ts                   # ログ機能
├── schemas/                         # スキーマ定義
│   ├── actions/                     # Server Actions スキーマ
│   │   ├── attendance.ts
│   │   ├── auth.ts
│   │   ├── chat.ts
│   │   ├── report.ts
│   │   ├── request.ts
│   │   ├── response.ts
│   │   ├── settings.ts
│   │   ├── stats.ts
│   │   └── validation.ts
│   ├── api/                         # API スキーマ
│   │   ├── attendance.ts
│   │   ├── auth.ts
│   │   ├── batch.ts
│   │   ├── cache.ts
│   │   ├── dashboard.ts
│   │   ├── error.ts
│   │   ├── export.ts
│   │   ├── file.ts
│   │   ├── group.ts
│   │   ├── health.ts
│   │   ├── log.ts
│   │   ├── notification.ts
│   │   ├── pagination.ts
│   │   ├── rate-limit.ts
│   │   ├── request.ts
│   │   ├── response.ts
│   │   ├── search.ts
│   │   ├── system.ts
│   │   ├── user.ts
│   │   └── webhook.ts
│   ├── common/                      # 共通スキーマ
│   │   ├── response.ts
│   │   └── validation.ts
│   ├── database/                    # データベーススキーマ
│   │   ├── api.ts
│   │   ├── attendance.ts
│   │   ├── audit.ts
│   │   ├── base.ts
│   │   ├── dashboard.ts
│   │   ├── feature.ts
│   │   ├── filter.ts
│   │   ├── form.ts
│   │   ├── index.ts
│   │   ├── log.ts
│   │   ├── organization.ts
│   │   ├── request.ts
│   │   ├── settings.ts
│   │   ├── stats.ts
│   │   ├── supabase.ts
│   │   └── view.ts
│   ├── form/                        # フォームスキーマ
│   │   ├── analytics.ts
│   │   ├── builder.ts
│   │   ├── field.ts
│   │   ├── index.ts
│   │   ├── template.ts
│   │   └── validation.ts
│   ├── system/                      # システムスキーマ
│   │   ├── index.ts
│   │   ├── input.ts
│   │   ├── monitoring.ts
│   │   ├── search.ts
│   │   └── template.ts
│   ├── attendance.ts                # 勤怠スキーマ
│   ├── auth.ts                      # 認証スキーマ
│   ├── chat.ts                      # チャットスキーマ
│   ├── company.ts                   # 企業スキーマ
│   ├── employment-type.ts           # 雇用形態スキーマ
│   ├── features.ts                  # 機能スキーマ
│   ├── form/                        # フォーム関連
│   ├── group.ts                     # グループスキーマ
│   ├── groups.ts                    # グループスキーマ
│   ├── index.ts                     # スキーマインデックス
│   ├── report-templates.ts          # レポートテンプレートスキーマ
│   ├── report.ts                    # レポートスキーマ
│   ├── request-forms.ts             # 申請フォームスキーマ
│   ├── request.ts                   # 申請スキーマ
│   ├── schedule.ts                  # スケジュールスキーマ
│   ├── setting.ts                   # 設定スキーマ
│   ├── user_group.ts                # ユーザーグループスキーマ
│   ├── user_profile.ts              # ユーザープロフィールスキーマ
│   ├── users.ts                     # ユーザースキーマ
│   └── work-types.ts                # 勤務タイプスキーマ
├── supabase/                        # Supabase設定
│   ├── config.toml                  # Supabase設定ファイル
│   └── migrations/                  # データベースマイグレーション
│       ├── 20250709043653_setup_database.sql
│       ├── 20250711000000_add_is_active_to_companies.sql
│       ├── 20250712000000_enable_service_role_rls.sql
│       ├── 20250713000000_setup_rls_policies.sql
│       ├── 20250714000000_fix_rls_recursion.sql
│       ├── 20250715000000_fix_user_profiles_rls.sql
│       ├── 20250720000000_make_user_profiles_role_required.sql
│       ├── 20250721000001_fix_groups_and_user_groups_rls.sql
│       ├── 20250721000003_add_is_active_to_groups.sql
│       ├── 20250722000000_remove_primary_group_id.sql
│       ├── 20250722000002_remove_unique_constraint_from_attendances.sql
│       ├── 20250723000000_add_company_id_to_employment_types.sql
│       ├── 20250724000000_add_settings_to_work_types.sql
│       └── [その他のマイグレーションファイル]
├── types/                           # TypeScript型定義
│   ├── common.ts                    # 共通型
│   ├── database-types.ts            # データベース型
│   ├── dynamic-data.ts              # 動的データ型
│   ├── index.ts                     # 型インデックス
│   ├── ui.ts                        # UI型
│   └── usage-examples.ts            # 使用例
├── doc/                             # ドキュメント
│   ├── attendance-calculations-fix.md
│   ├── attendance-statuses-auto-generation.md
│   ├── data-provider-guide.md       # データプロバイダー設計
│   ├── db_design.svg                # データベース設計図
│   ├── environment-workflow.svg     # 環境ワークフロー図
│   ├── PRODUCTION_CHECKLIST.md      # 本番環境チェックリスト
│   ├── README-PWA-SETUP.md          # PWA設定ガイド
│   └── README-SUPABASE-SETUP.md     # Supabase設定ガイド
├── public/                          # 静的ファイル
│   ├── android-chrome-192x192.png   # PWAアイコン
│   ├── android-chrome-512x512.png   # PWAアイコン
│   ├── favicon-16x16.png            # ファビコン
│   └── sw.js                        # Service Worker
├── components.json                  # shadcn/ui設定
├── next.config.js                   # Next.js設定
├── package.json                     # パッケージ設定
├── pnpm-lock.yaml                   # pnpmロックファイル
├── pnpm-workspace.yaml              # pnpmワークスペース設定
├── postcss.config.js                # PostCSS設定
├── tailwind.config.ts               # Tailwind CSS設定
├── tsconfig.json                    # TypeScript設定
├── TROUBLESHOOTING.md               # トラブルシューティング
└── README.md                        # このファイル
```

## 🔧 データプロバイダー設計

TimePort v4は開発段階に応じてモックデータとSupabaseを切り替える設計を採用しています。

### 切り替え方法

**開発初期（モックデータ使用）:**

```env
NEXT_PUBLIC_USE_SUPABASE=false
```

**本番環境（Supabase使用）:**

```env
NEXT_PUBLIC_USE_SUPABASE=true
```

### 使用例

```typescript
import { getAttendanceData, createRequest } from '@/lib/provider';

// データソースに関係なく同じAPIで使用
const attendanceData = await getAttendanceData(userId);
const result = await createRequest(requestData);
```

詳細は [データプロバイダー設計ガイド](./doc/data-provider-guide.md) を参照してください。

## 🎯 主要機能

### 👨‍💼 管理者機能

- **ダッシュボード** - 全社統計・未処理申請の確認
- **勤怠管理** - 全メンバーの勤怠データ管理・CSV出力
- **勤怠ステータス管理** - 勤怠ステータスの作成・編集・削除
- **申請管理** - 申請の承認・却下処理・監視
- **ユーザー管理** - アカウント作成・編集・削除
- **グループ管理** - 組織構造の管理
- **申請フォーム管理** - 動的フォームの作成・編集
- **レポートテンプレート管理** - レポートテンプレートの作成・編集
- **設定管理**
  - システム設定（企業情報・タイムゾーン）
  - 通知設定
  - 勤務時間設定
  - 雇用形態・勤務パターン管理
- **ログ管理** - システムログの確認・監査

### 👤 メンバー機能

- **ダッシュボード** - 個人統計・クイックアクション
- **打刻** - 出勤・退勤・休憩の記録
- **勤怠一覧** - 個人の勤怠履歴確認
- **申請** - 動的フォームによる各種申請
- **申請一覧** - 申請状況の確認
- **プロフィール** - 個人情報の管理
- **スケジュール** - スケジュール管理
- **チャット** - チーム内チャット機能
- **レポート** - レポート作成・確認

### 🔧 システム管理者機能

- **企業管理** - 複数企業の管理
- **機能管理** - 機能のON/OFF制御
- **システム設定** - 全体設定の管理
- **認証ログ** - 認証履歴の確認
- **ログ管理** - システムログの確認

## 🔧 申請フォームビルダー

管理者が自由に申請フォームを作成できる動的フォーム機能：

### サポートする入力タイプ

- テキスト（一行・複数行）
- 数値・日付・時刻・日時
- メールアドレス・電話番号
- 選択肢（ドロップダウン・ラジオボタン）
- チェックボックス・ファイル

### 入力規則設定

- 必須/任意の設定
- 文字数制限・数値範囲
- 正規表現パターン
- カスタムエラーメッセージ

## 🗄️ データベース設計

### 主要テーブル

- **companies** - 企業情報
- **groups** - グループ・組織情報
- **user_profiles** - ユーザー情報
- **user_groups** - ユーザーとグループの関連
- **attendances** - 勤怠記録
- **attendance_statuses** - 勤怠ステータス
- **request_forms** - 申請フォーム定義
- **requests** - 申請データ
- **request_statuses** - 申請ステータス
- **work_types** - 勤務パターン
- **employment_types** - 雇用形態
- **leave_types** - 休暇種別
- **notifications** - 通知データ
- **features** - 機能設定
- **audit_logs** - 監査ログ
- **system_logs** - システムログ

### 組織階層

```
企業 (companies)
├── グループ (groups)
│   ├── 子グループ
│   └── ユーザー (user_profiles)
├── 機能設定 (features)
└── 監査ログ (audit_logs)
```

### セキュリティ

- **Row Level Security (RLS)** - データアクセス制御
- **認証** - Supabase Auth による安全な認証
- **権限管理** - 役割ベースのアクセス制御
- **監査ログ** - システム操作の追跡

## 📱 PWA機能

TimePort v4はProgressive Web App (PWA) として動作し、以下の機能を提供します：

- **オフライン対応** - インターネット接続なしでも基本機能が利用可能
- **プッシュ通知** - リアルタイム通知
- **ホーム画面追加** - ネイティブアプリのようにインストール可能
- **Service Worker** - バックグラウンド処理

詳細は [PWA設定ガイド](./doc/README-PWA-SETUP.md) を参照してください。

## 🚀 本番デプロイ

### Supabaseプロジェクトの準備

1. [Supabase](https://supabase.com/) でプロジェクト作成
2. データベーススキーマの適用:

```bash
# Supabase CLIを使用
supabase db reset --db-url YOUR_DATABASE_URL

# または手動でマイグレーション実行
# supabase/migrations/ 内のSQLファイルを順次実行
```

3. 環境変数の更新:

```env
NEXT_PUBLIC_USE_SUPABASE=true
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Vercelへのデプロイ

```bash
pnpm build
pnpm start
```

または、Vercelに直接デプロイ：

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/canvas-sapporo/timeport-v4)

## 🛠️ 開発

### 推奨開発フロー

1. **モックデータで開発開始** (`NEXT_PUBLIC_USE_SUPABASE=false`)
2. **UI/UX の完成**
3. **Supabase設定** (`NEXT_PUBLIC_USE_SUPABASE=true`)
4. **本番デプロイ**

### 利用可能なスクリプト

```bash
# 開発環境をクリーン
Remove-Item -Recurse -Force .next, node_modules, pnpm-lock.yaml -ErrorAction SilentlyContinue
pnpm store prune

# パッケージのインストール
pnpm install

# 開発サーバー起動
pnpm dev

# ビルド
pnpm build

# 本番サーバー起動
pnpm start

# リント
pnpm lint

# 型チェック
pnpm type-check
```

### コード品質

- **TypeScript** - 型安全性の確保
- **ESLint + Prettier** - コード品質の維持
- **shadcn/ui** - 一貫したUIコンポーネント

## 📝 ライセンス

© 2025, 株式企業テクレア

## 🤝 コントリビューション

### ブランチ戦略

TimePort v4は以下のブランチ戦略を採用しています：

```
main (本番環境)
  ↑
stage (疑似本番環境・テスト・レビュー)
  ↑
dev (開発環境)
  ↑
dev/username/YYYYMMDD-XX (機能ブランチ)
```

#### 環境の役割

- **prod (本番環境)** - 実際のユーザーが使用する本番システム
- **stage (疑似本番環境)** - 本番環境と同じ構成でのテスト・レビュー用
- **dev (開発環境)** - 開発者が統合テストを行う環境

#### 開発ワークフロー

<div align="center">
  <img src="./doc/environment-workflow.svg" alt="環境ワークフロー図" width="800">
</div>

この図は以下の開発フローを示しています：

1. **開発フェーズ** - 開発者が機能ブランチで作業
2. **デプロイメント** - ステージング環境から本番環境へのリリース
3. **ロールバック/マージ** - 必要に応じて本番環境からステージング環境への同期

### 開発フロー

0. **コード整理**

- pnpm buildでエラーが出なくなるまで、コード修正すること

```bash
pnpm tsc --noEmit
pnpm fix
pnpm build
```

1. **機能ブランチの作成**

```bash
git checkout stage
git pull origin stage
git checkout -b dev/yourname/YYYYMMDD-XX
```

例：`dev/yonezawamasahiro/250731-00`

2. **開発・コミット**

   ```bash
   # 開発作業
   git add .
   git commit -m 'Add: 新機能の追加'
   git push origin dev/yourname/YYYYMMDD-XX
   ```

3. **devブランチへのマージ**

   ```bash
   git checkout dev
   git pull origin dev
   git merge dev/yourname/YYYYMMDD-XX
   git push origin dev
   ```

4. **stageブランチへのマージ**

   ```bash
   git checkout stage
   git pull origin stage
   git merge dev
   git push origin stage
   ```

   - ステージング環境でテスト・レビューを実施
   - 問題がなければ次のステップへ

5. **mainブランチへのマージ（リリース）**

   ```bash
   git checkout main
   git pull origin main
   git merge stage
   git push origin main
   ```

   - 本番環境へのリリース

### コミットメッセージ規約

- **feat**: 新機能
- **fix**: バグ修正
- **docs**: ドキュメント更新
- **style**: コードスタイル修正
- **refactor**: リファクタリング
- **test**: テスト追加・修正
- **chore**: その他の変更

例：`feat: 勤怠打刻機能の追加`

### プルリクエスト

1. 機能ブランチから`dev`ブランチへのプルリクエストを作成
2. コードレビューを実施
3. 承認後にマージ

### 注意事項

- 直接`main`ブランチにコミットしない
- 機能ブランチは`stage`から分岐する
- テスト・レビューは`stage`環境で実施
- リリースは`stage`から`main`へのマージで行う

## 📞 サポート

- **Issues** - [GitHub Issues](https://github.com/canvas-sapporo/timeport-v4/issues)
- **Discussions** - [GitHub Discussions](https://github.com/canvas-sapporo/timeport-v4/discussions)

## 📚 関連ドキュメント

- [データプロバイダー設計ガイド](./doc/data-provider-guide.md)
- [Supabase設定ガイド](./doc/README-SUPABASE-SETUP.md)
- [PWA設定ガイド](./doc/README-PWA-SETUP.md)
- [本番環境チェックリスト](./doc/PRODUCTION_CHECKLIST.md)
- [データベース設計図](./doc/db_design.svg)
- [トラブルシューティング](./TROUBLESHOOTING.md)

---

<div align="center">
  Made with ❤️ by Canvas Sapporo Team
</div>
