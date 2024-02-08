import type { Student } from './student';
import type { Staff } from './staff';

export interface SearchResult extends Student, Staff {
  type: 'student' | 'staff' | 'parent';
  student: number;
}
