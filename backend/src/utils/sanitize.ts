import _ from 'lodash';

export const sanitizeUser = (user: any) => {
  return _.pick(user, ['id', 'firstName', 'lastName', 'email', 'center', 'phoneNumber']);
};

export const sanitizeChild = (user: any) => {
  return _.pick(user, [
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
  ]);
};
