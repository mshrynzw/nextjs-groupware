-- companiesテーブルの作成
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- インデックス
CREATE INDEX idx_companies_code ON companies(code) WHERE deleted_at IS NULL;
CREATE INDEX idx_companies_deleted ON companies(deleted_at);

-- トリガー: updated_at自動更新
CREATE OR REPLACE FUNCTION update_companies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_companies_updated_at
    BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_companies_updated_at();

-- RLS（Row Level Security）有効化
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- RLSポリシー（Supabase用）
-- ↓↓↓ ここからコメントアウトで記載 ↓↓↓
-- -- system-adminはCRUD可能
-- CREATE POLICY "system_admin_manage_companies" ON companies
--   FOR ALL
--   TO authenticated
--   USING (
--     EXISTS (
--       SELECT 1 FROM profiles 
--       WHERE profiles.id = auth.uid() 
--       AND profiles.role = 'system-admin'
--     )
--   )
--   WITH CHECK (
--     EXISTS (
--       SELECT 1 FROM profiles 
--       WHERE profiles.id = auth.uid() 
--       AND profiles.role = 'system-admin'
--     )
--   );
-- 
-- -- その他の認証済みユーザーはSELECTのみ可能
-- CREATE POLICY "authenticated_select_companies" ON companies
--   FOR SELECT
--   TO authenticated
--   USING (true);
-- ↑↑↑ ここまでコメントアウト ↑↑↑

-- TODO: 他テーブル（profiles等）とのリレーションや参照ビューは、該当テーブル作成時に追加
