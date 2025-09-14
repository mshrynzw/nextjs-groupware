export interface OrganizationStats {
  id: string;
  name: string;
  groupCount: number;
  employeeCount: number;
  status: 'アクティブ' | '非アクティブ';
  isActive: boolean;
  createdAt: string;
}
