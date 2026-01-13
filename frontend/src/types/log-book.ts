import type { Parent, Student } from './student';
import type { Staff } from './staff';

export interface Feedback {
  id: number;
  mathScore: number | null;
  englishScore: number | null;
  mathTime: number | null;
  englishTime: number | null;
  isPercentFeedbackRequired: boolean;
  createdDate: string; // YYYY-MM-DD
  feedback: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  publishedAt: string | null;
  createdByUser: Staff;
}

export interface LogRecord {
  id: number;
  type: 'Guest' | 'Student' | 'StudentWithParent' | 'Parent' | 'Staff';
  signInTime: Date;
  signOutTime: null | Date;
  student?: Student;
  parent?: Parent;
  staff?: Staff;
  signatureId?: number;
  feedback?: Feedback;
  guest?: {
    id: number;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    email: string;
  };
}
