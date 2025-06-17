import * as Joi from 'joi';

export const appConfig = () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  supabase: {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_KEY,
  },
  cloudinary: {
    url: process.env.CLOUDINARY_URL,
  },
  payment: {
    vnpay: {
      url: process.env.VNPAY_URL,
      tmnCode: process.env.VNPAY_TMN_CODE,
      hashSecret: process.env.VNPAY_HASH_SECRET,
      returnUrl: process.env.VNPAY_RETURN_URL,
    },
    momo: {
      endpoint: process.env.MOMO_ENDPOINT,
      partnerCode: process.env.MOMO_PARTNER_CODE,
      accessKey: process.env.MOMO_ACCESS_KEY,
      secretKey: process.env.MOMO_SECRET_KEY,
      redirectUrl: process.env.MOMO_REDIRECT_URL,
      ipnUrl: process.env.MOMO_IPN_URL,
    },
    stripe: {
      secretKey: process.env.STRIPE_SECRET_KEY,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    },
  },
});

const isTestEnvironment = process.env.NODE_ENV === 'test';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),
  DATABASE_URL: Joi.string().required(),
  JWT_SECRET: Joi.string().required(),
  JWT_ACCESS_TOKEN_EXPIRATION_TIME: Joi.string().default('1h'),
  JWT_REFRESH_TOKEN_EXPIRATION_TIME: Joi.string().default('7d'),
  // SUPABASE_URL và SUPABASE_KEY là optional nếu NODE_ENV là 'test'
  SUPABASE_URL: isTestEnvironment
    ? Joi.string().uri().optional().allow('')
    : Joi.string().uri().required(),
  SUPABASE_KEY: isTestEnvironment
    ? Joi.string().optional().allow('')
    : Joi.string().required(),
  CLOUDINARY_URL: Joi.string().uri().optional(),

  // Payment Gateway Environment Variables
  VNPAY_URL: Joi.string().uri().optional(),
  VNPAY_TMN_CODE: Joi.string().optional(),
  VNPAY_HASH_SECRET: Joi.string().optional(),
  VNPAY_RETURN_URL: Joi.string().uri().optional(),

  MOMO_ENDPOINT: Joi.string().uri().optional(),
  MOMO_PARTNER_CODE: Joi.string().optional(),
  MOMO_ACCESS_KEY: Joi.string().optional(),
  MOMO_SECRET_KEY: Joi.string().optional(),
  MOMO_REDIRECT_URL: Joi.string().uri().optional(),
  MOMO_IPN_URL: Joi.string().uri().optional(),

  STRIPE_SECRET_KEY: Joi.string().optional(),
  STRIPE_PUBLISHABLE_KEY: Joi.string().optional(),
  STRIPE_WEBHOOK_SECRET: Joi.string().optional(),
});
