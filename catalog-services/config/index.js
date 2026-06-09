import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535),
  MONGO_URI: z.string().min(1).startsWith("mongodb"),
  NODE_ENV: z.enum(["development", "production", "staging"]),
  SERVICE_NAME: z.string().min(1),
  ENABLE_REQUEST_LOGGING: z
    .preprocess((val) => {
      if (val === "true") return true;
      if (val === "false") return false;
      return val;
    }, z.boolean())
    .default(false),
  ENABLE_CREATE_EVENT: z
    .preprocess((val) => {
      if (val === "true") return true;
      if (val === "false") return false;
      return val;
    }, z.boolean())
    .default(false),
  MAX_POOL_SIZE: z.number().min(1).max,
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error(" Invalid Environment Variable");
  console.error(result.error.format());
  process.exit(1);
}

const config = {
  port: result.data.PORT,
  mongoUri: result.data.MONGO_URI,
  nodeEnv: result.data.NODE_ENV,
  serviceName: result.data.SERVICE_NAME,
  enableRequestLogging: result.data.ENABLE_REQUEST_LOGGING,
  enableCreateEvent: result.data.ENABLE_CREATE_EVENT,
  maxPoolSize: result.data.MAX_POOL_SIZE,
};

export default config;
