import { User } from "@/types/user"

export interface TimecardSetting {
  id : number;
  attributes : {
    name : string;
    description : string;
    order : number;
    color : string;
    createdAt : string;
    createdBy : User;
    updatedAt : string;
    updatedBy : User;
  }
}
