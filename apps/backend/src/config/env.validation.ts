import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  APP_URL: Joi.string().uri().required(),
  BACKEND_URL: Joi.string().uri().required(),
  GITHUB_CLIENT_ID: Joi.string().required(),
  GITHUB_CLIENT_SECRET: Joi.string().required(),
  GITHUB_CALLBACK_URL: Joi.string().uri().required(),
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRY: Joi.string().required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_EXPIRY: Joi.string().required(),
  DATABASE_URL: Joi.string().required(),
  DATABASE_SYNCHRONIZE: Joi.boolean().default(false),
  DATABASE_LOGGING: Joi.boolean().default(false),
  REDIS_URL: Joi.string().uri().allow('').optional(),
  REDIS_DB: Joi.number().integer().min(0).default(0),
  ENCRYPTION_SECRET: Joi.string().min(32).required(),
});
