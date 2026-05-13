export default () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  appUrl: process.env.APP_URL ?? 'http://localhost:3000',
  backendUrl: process.env.BACKEND_URL ?? 'http://localhost:3001',
  github: {
    clientId: process.env.GITHUB_CLIENT_ID ?? '',
    clientSecret: process.env.GITHUB_CLIENT_SECRET ?? '',
    callbackUrl: process.env.GITHUB_CALLBACK_URL ?? '',
  },
  jwt: {
    secret: process.env.JWT_SECRET ?? '',
    expiry: process.env.JWT_EXPIRY ?? '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? '',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY ?? '7d',
  },
  database: {
    url: process.env.DATABASE_URL ?? '',
    synchronize: process.env.DATABASE_SYNCHRONIZE === 'true',
    logging: process.env.DATABASE_LOGGING === 'true',
  },
  redis: {
    url: process.env.REDIS_URL ?? '',
    db: Number(process.env.REDIS_DB ?? 0),
  },
  encryption: {
    secret: process.env.ENCRYPTION_SECRET ?? '',
  },
});
