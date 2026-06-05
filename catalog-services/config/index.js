import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535),
  MONGO_URI: z.string().min(1).startsWith("mongodb"),
  NODE_ENV: z.enum(["development", "production", "staging"]),
  SERVICE_NAME: z.string().min(1),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error(" Invalid Enviornment Variable");
  console.error(result.error.format());
  process.exit(1);
}

const config = {
  port: result.data.PORT,
  mongoUri: result.data.MONGO_URI,
  nodeEnv: result.data.NODE_ENV,
  serviceName: result.data.SERVICE_NAME,
};

export default config;
