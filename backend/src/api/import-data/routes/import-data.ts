export default {
  routes: [
    {
      method: 'POST',
      path: '/import-data',
      handler: 'import-data.importData',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
