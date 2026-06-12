import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().int().min(1),
  NODE_ENV: z
    .enum(["development", "production", "staging"])
    .default("development"),
  DATABASE_URL: z.string().min(1).startsWith("postgresql"),
  SERVICE_NAME: z.string().min(1).default("booking-service"),
  ENABLE_REQUEST_LOGGING: z.coerce.boolean().default(true),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid Environment Variable: ", parsed.error.format());
  process.exit(1);
}

const config = {
  port: parsed.data.PORT,
  nodeEnv: parsed.data.NODE_ENV,
  databaseUrl: parsed.data.DATABASE_URL,
  serviceName: parsed.data.SERVICE_NAME,
  enableRequestLogging: parsed.data.SERVICE_NAME,
};

export default config;
