export interface AttendanceStatus {
  id: string;
  company_id: string;
  name: string; // システム内部名 (normal, late, early_leave, absent, etc.)
  display_name: string; // 表示名
  color: string; // バッジの色
  font_color: string; // フォント色
  background_color: string; // 背景色
  sort_order: number; // 表示順序
  is_active: boolean; // 有効/無効
  is_required: boolean; // 必須フラグ
  logic?: string | null; // ステータス判定ロジック
  description?: string | null; // 説明
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}
