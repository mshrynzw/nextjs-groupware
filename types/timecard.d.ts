import { User } from "@/types/user"
import { TimecardSetting } from "@/types/timecardSetting"

export interface Timecard {
  id : number;
  date : string;
  type : TimecardSetting;
  startWork : string;
  startBreak : string;
  endBreak : string;
  endWork : string;
  user : User;
  createdAt : string;
  createdBy : User;
  updatedAt : string;
  updatedBy : User;
}
