export default {
  routes: [
    {
      method: 'GET',
      path: '/center-users',
      handler: 'center-user.find',
      config: {
        middlewares: ['global::centre'],
      },
    },
    {
      method: 'GET',
      path: '/center-users/:id',
      handler: 'center-user.findOne',
      config: {
        middlewares: ['global::centre'],
      },
    },
    {
      method: 'POST',
      path: '/center-users',
      handler: 'center-user.create',
      config: {
        middlewares: ['global::centre'],
      },
    },
    {
      method: 'PUT',
      path: '/center-users/:id',
      handler: 'center-user.update',
      config: {
        middlewares: ['global::centre'],
      },
    },
    {
      method: 'DELETE',
      path: '/center-users/:id',
      handler: 'center-user.delete',
      config: {
        middlewares: ['global::centre'],
      },
    },
  ],
};
