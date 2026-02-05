import type { Slot } from './slot';

export interface Parent {
  id: number;
  type: string;
  firstName: string;
  lastName: string;
  email: string;
  contactNumber: string;
  createdAt: string;
  updatedAt: string;
  signatureId?: number;
}

export interface Subject {
  id: number;
  name: string;
}

export interface Student {
  id: number;
  firstName: string;
  lastName: string;
  status: string;
  gender: 'Male' | 'Female' | 'Others' | null;
  schoolYear: string;
  parents: Parent[];
  qrCode: string;
  isEarlyLearner: boolean;
  dueAmount?: number;
  subjects?: Subject[];
  slots?: Slot[];
  // Address fields
  houseNumber?: string;
  streetName?: string;
  city?: string;
  postcode?: string;
  // Payment fields
  paymentDate?: number;
  paymentAmount?: number;
  isDue?: boolean;
  // Date fields
  enrollmentDate?: string;
  enquiryDate?: string;
  // Other fields
  formType?: string;
  referralCode?: string;
  notes?: string;
}

export type ChildStatus =
  | 'New'
  | 'No Further Contact'
  | 'Future Follow Up'
  | 'Enrolment meeting no show'
  | 'Attended enrolment meeting but didn\'t enrol'
  | 'Send to KSiS'
  | 'Send to KSiS (Free Trial)'
  | 'Exited';

export interface CreateChildPayload {
  firstName: string;
  lastName?: string;
  status?: ChildStatus;
  gender?: 'Male' | 'Female' | 'Others' | null;
  schoolYear?: string;
  isEarlyLearner?: boolean;
  // Address
  houseNumber?: string;
  streetName?: string;
  city?: string;
  postcode?: string;
  // Payment
  paymentDate?: number;
  paymentAmount?: number;
  // Dates
  enrollmentDate?: string;
  enquiryDate?: string;
  // Other
  formType?: string;
  referralCode?: string;
  notes?: string;
  // Relations
  subjects?: number[];
  parents?: number[];
  slots?: number[];
}

export interface UpdateChildPayload extends Partial<CreateChildPayload> {}
