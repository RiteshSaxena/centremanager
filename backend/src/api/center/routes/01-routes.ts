export default {
  routes: [
    {
      method: 'POST',
      path: '/center/register',
      handler: 'center.register',
    },
    {
      method: 'PUT',
      path: '/center',
      handler: 'center.update',
      config: {
        middlewares: ['global::centre'],
      },
    },
  ],
};
