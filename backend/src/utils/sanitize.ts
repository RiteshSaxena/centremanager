import _ from 'lodash';

interface User {
  id?: number | string;
  firstName?: string;
  lastName?: string;
  email?: string;
  center?: unknown;
  phoneNumber?: string;
  type?: string;
}

interface Child {
  id?: number | string;
  firstName?: string;
  lastName?: string;
  gender?: string;
  houseNumber?: string;
  streetName?: string;
  city?: string;
  postcode?: string;
  center?: unknown;
  subjects?: unknown[];
  parents?: unknown[];
  school?: unknown;
  schoolYear?: string;
  status?: string;
  enrollmentDate?: string | Date;
  enquiryDate?: string | Date;
  formType?: string;
  referralCode?: string;
  notes?: string;
  paymentDate?: number;
  paymentAmount?: number;
  isEarlyLearner?: boolean;
  isDue?: boolean;
  dueAmount?: number;
  slots?: unknown[];
}

export const sanitizeUser = (user: User) => {
  return _.pick(user, ['id', 'firstName', 'lastName', 'email', 'center', 'phoneNumber', 'type']);
};

export const sanitizeChild = (child: Child) => {
  return _.pick(child, [
    'id',
    'firstName',
    'lastName',
    'gender',
    'houseNumber',
    'streetName',
    'city',
    'postcode',
    'center',
    'subjects',
    'parents',
    'school',
    'schoolYear',
    'status',
    'enrollmentDate',
    'enquiryDate',
    'formType',
    'referralCode',
    'notes',
    'paymentDate',
    'paymentAmount',
    'isEarlyLearner',
    'isDue',
    'dueAmount',
    'slots',
  ]);
};
