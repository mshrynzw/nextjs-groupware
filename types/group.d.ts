import { User } from "@/types/user"

export interface Group {
  id: number;
  name: string;
  users_permissions_users: User[]
  createdAt: string;
  updatedAt: string;
}
