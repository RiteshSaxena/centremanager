export default {
  routes: [
    {
      method: 'POST',
      path: '/log-book/search',
      handler: 'log-book.search',
    },
    {
      method: 'POST',
      path: '/log-book/guest-sign',
      handler: 'log-book.guestSign',
    },
    {
      method: 'POST',
      path: '/log-book/sign',
      handler: 'log-book.sign',
    },
  ],
};
