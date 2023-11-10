export default {
  routes: [
    {
      method: 'POST',
      path: '/log-book/search',
      handler: 'log-book.search',
    },
    {
      method: 'POST',
      path: '/log-book/guest-sign-in',
      handler: 'log-book.guestSignIn',
    },
    {
      method: 'POST',
      path: '/log-book/sign-in',
      handler: 'log-book.signIn',
    },
    {
      method: 'POST',
      path: '/log-book/sign-out',
      handler: 'log-book.signOut',
    },
    {
      method: 'GET',
      path: '/log-book/list',
      handler: 'log-book.list',
    },
  ],
};
