import _ from 'lodash';

interface User {
  id?: number | string;
  firstName?: string;
  lastName?: string;
  email?: string;
  center?: unknown;
  phoneNumber?: string;
}

interface Child {
  id?: number | string;
  firstName?: string;
  lastName?: string;
  gender?: string;
  center?: unknown;
  subjects?: unknown[];
  parents?: unknown[];
  school?: unknown;
  schoolYear?: string;
  status?: string;
  isEarlyLearner?: boolean;
  isDue?: boolean;
  dueAmount?: number;
}

export const sanitizeUser = (user: User) => {
  return _.pick(user, ['id', 'firstName', 'lastName', 'email', 'center', 'phoneNumber']);
};

export const sanitizeChild = (child: Child) => {
  return _.pick(child, [
    'id',
    'firstName',
    'lastName',
    'gender',
    'center',
    'subjects',
    'parents',
    'school',
    'schoolYear',
    'status',
    'isEarlyLearner',
    'isDue',
    'dueAmount',
  ]);
};
