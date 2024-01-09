export default ({ env }) => {
  return {
    sentry: {
      enabled: !!env('SENTRY_DSN'),
      config: {
        dsn: env('SENTRY_DSN'),
        sendMetadata: true,
        init: {
          beforeSend(event) {
            const errors = event.exception.values.filter((error) => error.type !== 'ValidationError');
            if (errors.length) {
              return event;
            }
            return null;
          },
        },
      },
    },
    upload: {
      config: {
        provider: 'aws-s3',
        providerOptions: {
          s3Options: {
            region: env('AWS_REGION'),
            params: {
              ACL: 'private',
              signedUrlExpires: env('AWS_SIGNED_URL_EXPIRES', 15 * 60),
              Bucket: env('AWS_BUCKET'),
            },
            credentials: {
              accessKeyId: env('AWS_ACCESS_KEY_ID'),
              secretAccessKey: env('AWS_ACCESS_SECRET'),
            },
          },
        },
        actionOptions: {
          upload: {},
          uploadStream: {},
          delete: {},
        },
      },
    },
  };
};
