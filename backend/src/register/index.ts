// import sessionAuthStrategy from './strategies/session-auth';

const requiredEnv = [
  'NODE_ENV',
  'HOST',
  'PORT',
  'APP_KEYS',
  'API_TOKEN_SALT',
  'ADMIN_JWT_SECRET',
  'JWT_SECRET',
  'TRANSFER_TOKEN_SALT',
];

const optionalEnvs = [];

export default () => {
  requiredEnv.forEach((env) => {
    if (!process.env[env]) {
      throw new Error(`Environment variable: ${env} not set`);
    }
  });
  optionalEnvs.forEach((env) => {
    if (!process.env[env]) {
      console.warn(`Environment variable: ${env} not set`);
    }
  });
  //   strapi.container.get('auth').register('content-api', sessionAuthStrategy);
};
