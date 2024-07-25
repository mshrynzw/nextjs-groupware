export interface User {
  id: number;
  username: string;
  email: string;
  createdAt: string;
  provider: string;
  confirmed: boolean;
  blocked: boolean;
  updatedAt: string;
}
