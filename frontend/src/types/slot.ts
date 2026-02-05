import type { Student } from './student';

export type DayOfWeek =
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday'
  | 'Sunday';

export interface Slot {
  id: number;
  name: string;
  day: DayOfWeek;
  startTime: string;
  endTime: string;
  children: Student[];
}

export interface CreateSlotPayload {
  name: string;
  day: DayOfWeek;
  startTime: string;
  endTime: string;
}

export interface UpdateSlotPayload {
  name?: string;
  day?: DayOfWeek;
  startTime?: string;
  endTime?: string;
}
