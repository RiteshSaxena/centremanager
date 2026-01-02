import { time } from "console";

export interface User {
  id: string;
  firstname: string;
  lastname: string;
  username: string;
  email: string;
  phoneNumber: string;
  blocked: boolean;
  confirmed: boolean;
  type: 'admin' | 'staff';
}


// 2 limit on digits
