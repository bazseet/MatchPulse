import dotenv from "dotenv";
import path from "node:path";
import { z } from "zod";

dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
});

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65_535).default(4_000),
  CLIENT_ORIGIN: z.string().url().default("http://localhost:5173"),
  FOUNDRY_CHAT_COMPLETIONS_URL: z.string().url().optional(),
  FOUNDRY_API_KEY: z.string().min(1).optional(),
  FOUNDRY_MODEL: z.string().min(1).optional(),
  FOUNDRY_TIMEOUT_MS: z.coerce.number().int().min(1000).max(60000).default(15000),
});

export const config = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN,
  FOUNDRY_CHAT_COMPLETIONS_URL: process.env.FOUNDRY_CHAT_COMPLETIONS_URL || undefined,
  FOUNDRY_API_KEY: process.env.FOUNDRY_API_KEY || undefined,
  FOUNDRY_MODEL: process.env.FOUNDRY_MODEL || undefined,
  FOUNDRY_TIMEOUT_MS: process.env.FOUNDRY_TIMEOUT_MS,
});
