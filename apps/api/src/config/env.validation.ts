import { z } from 'zod';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from the application-specific .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const envSchema = z.object({
  PORT: z.coerce.number().default(10000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().refine((val) => {
    try {
      const parsed = new URL(val);
      return parsed.protocol === 'postgresql:' || parsed.protocol === 'postgres:';
    } catch {
      return false;
    }
  }, { message: 'DATABASE_URL must be a valid database connection string (postgresql:// or postgres://)' }),
  DIRECT_URL: z.string().optional(),
  JWT_SECRET: z.string().min(8, { message: 'JWT_SECRET must be at least 8 characters long' }),
  ALLOWED_ADMIN_EMAILS: z.string().optional(),
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
  OLLAMA_HOST: z.string().optional(),
  OLLAMA_MODEL: z.string().optional(),
  ENABLE_SWAGGER: z.preprocess((val) => val === 'true' || val === true, z.boolean()).default(true),
  SINGLE_DB_MODE: z.coerce.boolean().default(true),
  MULTI_DB_ENABLED: z.coerce.boolean().default(false),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv() {
  if (process.env.NODE_ENV === 'test') {
    process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgrespassword@localhost:5432/campus-connect';
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-for-test-suite';
    process.env.CLOUDINARY_URL = process.env.CLOUDINARY_URL || 'cloudinary://key:secret@cloud';
  }

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
