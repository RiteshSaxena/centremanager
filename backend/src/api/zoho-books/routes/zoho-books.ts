export default {
  routes: [
    {
     method: 'POST',
     path: '/zoho-books/token',
     handler: 'zoho-books.generateToken',
     config: {
       middlewares: ['global::centre'],
     },
    },
  ],
};
