export default {
  routes: [
    {
      method: 'GET',
      path: '/children/due-students',
      handler: 'child.dueStudents',
      config: {
        middlewares: ['global::centre'],
      },
    },
  ],
};
