export default {
  routes: [
    {
      method: 'GET',
      path: '/slots/:id',
      handler: 'slot.findOne',
      config: {
        middlewares: ['global::centre'],
      },
    },
    {
      method: 'POST',
      path: '/slots',
      handler: 'slot.create',
      config: {
        middlewares: ['global::centre'],
      },
    },
    {
      method: 'PUT',
      path: '/slots/:id',
      handler: 'slot.update',
      config: {
        middlewares: ['global::centre'],
      },
    },
    {
      method: 'DELETE',
      path: '/slots/:id',
      handler: 'slot.delete',
      config: {
        middlewares: ['global::centre'],
      },
    },
  ],
};
