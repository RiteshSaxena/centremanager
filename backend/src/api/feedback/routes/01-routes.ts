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
      path: '/feedback/format-feedback',
      handler: 'feedback.formatFeedback',
      config: {
        auth: {},
      },
    },
  ],
};
