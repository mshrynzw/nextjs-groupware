supabase/migrations配下の既存マイグレーションファイルを確認し、  
★★★テーブル名★★★ のみを作成するマイグレーションファイルを作成してください。

- CREATE TABLE, CREATE VIEW, CREATE FUNCTION/PROCEDURE, インデックス, 制約, トリガー, RLS/ポリシー（Supabase用）を観点にしてください。
- 他テーブルとのリレーション（外部キー等）は、まだそのテーブルが無い場合はコメントでTODOとして記載してください。
- RLSポリシーは「profiles（user_profiles）テーブルのroleがsystem-adminならCRUD可能、それ以外は認証OKならSELECTのみ可能」とし、コメントアウトで記載してください。
- 既存のcompaniesテーブル用マイグレーションファイルと同じスタイルでお願いします。
- ファイル名は `supabase/migrations/日付_create_★★★テーブル名★★★_table.sql` のようにしてください。