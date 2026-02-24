export default {
  routes: [
    {
      method: 'GET',
      path: '/children/paginated',
      handler: 'child.findWithPagination',
      config: {
        middlewares: ['global::centre'],
      },
    },
    {
      method: 'GET',
      path: '/children/due-students',
      handler: 'child.dueStudents',
      config: {
        middlewares: ['global::centre'],
      },
    },
    {
      method: 'POST',
      path: '/children',
      handler: 'child.create',
      config: {
        middlewares: ['global::centre'],
      },
    },
    {
      method: 'PUT',
      path: '/children/:id',
      handler: 'child.update',
      config: {
        middlewares: ['global::centre'],
      },
    },
    {
      method: 'DELETE',
      path: '/children/:id',
      handler: 'child.delete',
      config: {
        middlewares: ['global::centre'],
      },
    },
  ],
};
