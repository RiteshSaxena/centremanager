export interface Parent {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  contactNumber: string;
  createdAt: string;
  updatedAt: string;
}

export interface Student {
  id: number;
  firstName: string;
  lastName: string;
  gender: 'Male' | 'Female' | null;
  schoolYear: string;
  parents: Parent[];
}
