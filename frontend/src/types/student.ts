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

export interface Student {
  id: number;
  firstName: string;
  lastName: string;
  status: string;
  gender: 'Male' | 'Female' | null;
  schoolYear: string;
  parents: Parent[];
  qrCode: string;
  isEarlyLearner: boolean;
  dueAmount?: number;
  subjects?: Subject[];
}

export interface Subject {
  id: number;
  name: string;
}
