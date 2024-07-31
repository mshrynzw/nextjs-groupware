import { User } from "@/types/user"

export interface Todo {
  id : number;
  name : string;
  description : string;
  user : User;
  priority : Number;
  completed : boolean;
  due : string;
}
