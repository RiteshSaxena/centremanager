export default ({ env }) => {
  return {
    sentry: {
      enabled: !!env('SENTRY_DSN'),
      config: {
        dsn: env('SENTRY_DSN'),
        sendMetadata: true,
      },
    },
  };
};
