import type { Student } from './student';

export interface Slot {
  id: number;
  name: string;
  day: string;
  startTime: string;
  endTime: string;
  children: Student[];
}
