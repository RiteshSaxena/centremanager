export default {
  routes: [
    {
      method: 'GET',
      path: '/feedback/by-child/:childId/:date',
      handler: 'feedback.getFeedbackByChild',
      config: {
        auth: {},
      },
    },
    {
      method: 'POST',
      path: '/feedback/custom-create',
      handler: 'feedback.createFeedback',
      config: {
        auth: {}, // set false if public API
      },
    },
    {
      method: 'PUT',
      path: '/feedback/by-child/:childId/today',
      handler: 'feedback.updateTodayFeedbackByChild',
      config: {
        auth: {},
      },
    },
    {
      method: 'POST',
      path: '/feedback/send-emails',
      handler: 'feedback.sendFeedbackEmails',
      config: {
        auth: {},
      },
    },
    {
      method: 'POST',
      path: '/feedback/test-email',
      handler: 'feedback.testEmail',
      config: {
        auth: {},
      },
    },
  ],
};
