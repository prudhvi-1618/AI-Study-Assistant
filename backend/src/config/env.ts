import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z
  .object({
    PORT: z.coerce.number().default(3001),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    DB_HOST: z.string().min(1),
    DB_PORT: z.coerce.number().default(3306),
    DB_USER: z.string().min(1),
    DB_PASSWORD: z.string().min(1),
    DB_NAME: z.string().min(1),
    REDIS_HOST: z.string().min(1),
    REDIS_PORT: z.coerce.number().default(6379),
    REDIS_PASSWORD: z.string().optional().or(z.literal('')),
    ACCESS_TOKEN_SECRET: z.string().min(32, 'ACCESS_TOKEN_SECRET must be at least 32 characters long'),
    REFRESH_TOKEN_SECRET: z.string().min(32, 'REFRESH_TOKEN_SECRET must be at least 32 characters long'),
    ACCESS_TOKEN_TTL: z.string().min(1),
    REFRESH_TOKEN_TTL: z.string().min(1),
    BCRYPT_ROUNDS: z.coerce.number().default(12),
    // Upload module additions
    MAX_FILE_SIZE_MB: z.coerce.number().default(50),
    ALLOWED_FILE_TYPES: z.string().default("pdf,docx,txt,pptx,md"),
    BULLMQ_CONCURRENCY: z.coerce.number().default(3),
    EMBEDDING_MODEL: z.string().default("gemini-embedding-2-preview"),
    EMBEDDING_BATCH_SIZE: z.coerce.number().default(100),
    QDRANT_COLLECTION_NAME: z.string().default("document_embeddings"),
    QDRANT_URL: z.string().min(1),
    REDIS_URL: z.string().optional(),
    GEMINI_API_KEY: z.string().optional(),
    GOOGLE_API_KEY: z.string().optional(),
    OPENAI_API_KEY: z.string().optional(),
  })
  .refine((data) => data.ACCESS_TOKEN_SECRET !== data.REFRESH_TOKEN_SECRET, {
    message: 'ACCESS_TOKEN_SECRET and REFRESH_TOKEN_SECRET must be distinct',
    path: ['REFRESH_TOKEN_SECRET'],
  })
  .refine((data) => data.GEMINI_API_KEY || data.GOOGLE_API_KEY, {
    message: 'At least one of GEMINI_API_KEY or GOOGLE_API_KEY must be provided',
    path: ['GEMINI_API_KEY'],
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Environment validation failed:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
