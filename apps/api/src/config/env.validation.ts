import { z } from 'zod';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from the application-specific .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().refine((val) => {
    try {
      const parsed = new URL(val);
      return parsed.protocol === 'postgresql:' || parsed.protocol === 'postgres:';
    } catch {
      return false;
    }
  }, { message: 'DATABASE_URL must be a valid database connection string (postgresql:// or postgres://)' }),
  JWT_SECRET: z.string().min(8, { message: 'JWT_SECRET must be at least 8 characters long' }),
  REDIS_URL: z.string().refine((val) => {
    try {
      const parsed = new URL(val);
      return parsed.protocol === 'redis:' || parsed.protocol === 'rediss:';
    } catch {
      return false;
    }
  }, { message: 'REDIS_URL must be a valid Redis connection string (redis:// or rediss://)' }).optional(),
  REDIS_HOST: z.string().optional(),
  REDIS_PORT: z.coerce.number().optional(),
  REDIS_PASSWORD: z.string().optional(),
  MULTI_DB_ENABLED: z.coerce.boolean().default(false),
  SINGLE_DB_MODE: z.coerce.boolean().default(false),
  CLOUDINARY_URL: z.string().refine((val) => {
    try {
      const parsed = new URL(val);
      return parsed.protocol === 'cloudinary:';
    } catch {
      return false;
    }
  }, { message: 'CLOUDINARY_URL must be a valid Cloudinary connection string (cloudinary://)' }).optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  ALLOWED_ORIGINS: z.string().optional(),
}).refine(
  (data) => {
    // If CLOUDINARY_URL is not set, we require cloud_name, api_key, and api_secret
    if (!data.CLOUDINARY_URL) {
      return !!(data.CLOUDINARY_CLOUD_NAME && data.CLOUDINARY_API_KEY && data.CLOUDINARY_API_SECRET);
    }
    return true;
  },
  {
    message: 'Either CLOUDINARY_URL must be provided, or CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET must all be provided.',
    path: ['CLOUDINARY_URL'],
  }
).refine(
  (data) => {
    // In production, REDIS_URL must be provided
    if (data.NODE_ENV === 'production') {
      return !!data.REDIS_URL;
    }
    // In development or test, either REDIS_URL or REDIS_HOST must be provided
    return !!(data.REDIS_URL || data.REDIS_HOST);
  },
  {
    message: 'REDIS_URL must be provided in production. In local development/test, either REDIS_URL or REDIS_HOST must be provided.',
    path: ['REDIS_URL'],
  }
);

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('❌ Invalid environment configuration:');
    const formattedErrors = result.error.format();
    for (const [key, value] of Object.entries(formattedErrors)) {
      if (key !== '_errors') {
        console.error(`   - ${key}: ${(value as any)._errors?.join(', ')}`);
      }
    }
    throw new Error('Environment validation failed');
  }
  return result.data;
}
