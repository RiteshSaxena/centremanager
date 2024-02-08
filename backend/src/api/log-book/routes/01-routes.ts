export default {
  routes: [
    {
      method: 'POST',
      path: '/log-book/search',
      handler: 'log-book.search',
      config: {
        middlewares: ['global::centre'],
      },
    },
    {
      method: 'POST',
      path: '/log-book/search-by-last-name',
      handler: 'log-book.searchByLastName',
      config: {
        middlewares: ['global::centre'],
      },
    },
    {
      method: 'POST',
      path: '/log-book/guest-sign-in',
      handler: 'log-book.guestSignIn',
      config: {
        middlewares: ['global::centre'],
      },
    },
    {
      method: 'POST',
      path: '/log-book/sign-in',
      handler: 'log-book.signIn',
      config: {
        middlewares: ['global::centre'],
      },
    },
    {
      method: 'POST',
      path: '/log-book/sign-out',
      handler: 'log-book.signOut',
      config: {
        middlewares: ['global::centre'],
      },
    },
    {
      method: 'GET',
      path: '/log-book/list',
      handler: 'log-book.list',
      config: {
        middlewares: ['global::centre'],
      },
    },
  ],
};
