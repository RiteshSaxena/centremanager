import type { Parent, Student } from './student';
import type { Staff } from './staff';

export interface LogRecord {
  id: number;
  type: 'Guest' | 'Student' | 'StudentWithParent' | 'Parent' | 'Staff';
  signInTime: Date;
  signOutTIme: null | Date;
  student?: Student;
  parent?: Parent;
  staff?: Staff;
  guest?: {
    id: number;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    email: string;
  };
}
