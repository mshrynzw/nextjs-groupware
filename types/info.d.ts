import { User } from "@/types/user"

export interface Info {
  id : number;
  title : string;
  body : string;
  bodyRichText : string;
  user : User[]
  createdAt : string;
  updatedAt : string;
}
