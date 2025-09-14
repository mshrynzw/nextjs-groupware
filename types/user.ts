export type Role = 'member' | 'admin' | 'system-admin';

export type UserMetadata = {
  id: string;
  role: Role;
  company_id: string;
  group_ids: string[];
  full_name: string;
  features: Record<string, boolean>;
  work_type_id: string;
  dashboard_notification_count: number;
  is_show_overtime: boolean;
};

export type User = { id: string } & UserMetadata;
