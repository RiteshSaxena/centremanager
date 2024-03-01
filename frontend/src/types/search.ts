import type { Parent, Student } from './student';
import type { Staff } from './staff';

export interface SearchResult extends Student, Staff, Parent {
  type: 'student' | 'staff' | 'parent';
  student: number;
}
